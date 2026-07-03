// CNC Simulator Pro — Feeds & Speeds calculation engine
// Computes recommended cutting parameters (RPM, feed, MRR, power, DOC/WOC)
// from a tool + material combination, with override factors and safety warnings.
//
// Formulas (metric):
//   RPM  = (Vc * 1000) / (pi * D)        Vc in m/min, D in mm
//   Feed = fz * z * RPM                   fz = chip load mm/tooth, z = flutes
//   MRR  = (WOC * DOC * Feed) / 1000      cm³/min  (inputs in mm & mm/min)
//   Power = MRR * Kp                       kW,  Kp = material unit power

import type { CncTool } from "./tools";
import type { CncMaterial } from "./materials";

export interface FeedsResult {
  rpm: number; // spindle RPM
  feedMmPerMin: number; // cutting feed rate
  chipLoadActual: number; // mm/tooth
  mrr: number; // material removal rate cm³/min
  power: number; // estimated spindle power kW
  docAxial: number; // recommended axial depth of cut mm
  docRadial: number; // recommended radial width of cut mm
  warnings: string[];
}

/** Typical hobby/production VMC spindle ceiling. */
const SPINDLE_MAX_RPM = 24000;

/**
 * Material unit-power constants, expressed in kW per (cm³/min) of removal.
 * These are the Kp coefficients used in  Power = MRR * Kp.
 * Per project spec: aluminum ~0.5, steel ~2.0, brass ~0.7, stainless ~2.5,
 * delrin ~0.2, wood ~0.3.
 */
const UNIT_POWER: Record<string, number> = {
  "aluminum-6061": 0.5,
  "aluminum-7075": 0.55,
  "steel-mild": 2.0,
  "steel-stainless": 2.5,
  brass: 0.7,
  copper: 0.6,
  delrin: 0.2,
  "wood-oak": 0.3,
};

function getUnitPower(materialId: string): number {
  return UNIT_POWER[materialId] ?? 1.0;
}

function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

/**
 * Compute feeds & speeds for a tool/material pair.
 *
 * Override options (all expressed as percent, default 100):
 *  - axialOverride      : % of recommended max axial DOC (10..100)
 *  - radialOverridePct  : % of recommended max radial WOC (10..100)
 *  - feedOverridePct    : % of nominal programmed feed (50..150)
 */
export function calculateFeeds(
  tool: CncTool,
  material: CncMaterial,
  opts?: {
    axialOverride?: number;
    radialOverridePct?: number;
    feedOverridePct?: number;
  },
): FeedsResult {
  const axialPct = opts?.axialOverride ?? 100;
  const radialPct = opts?.radialOverridePct ?? 100;
  const feedPct = opts?.feedOverridePct ?? 100;

  const warnings: string[] = [];

  // ---- Surface speed & chip load: constrained by the more conservative of tool / material ----
  const vc = Math.min(tool.surfaceSpeed, material.surfaceSpeed);
  const fzBase = Math.min(tool.chipLoad, material.chipLoad);

  // ---- RPM = (Vc * 1000) / (pi * D) ----
  const D = Math.max(tool.diameter, 0.1);
  let rpm = (vc * 1000) / (Math.PI * D);
  if (rpm > SPINDLE_MAX_RPM) {
    warnings.push(
      `RPM exceeds spindle max (${SPINDLE_MAX_RPM.toLocaleString()} rpm) — capped. Reduce tool diameter or accept lower surface speed.`,
    );
    rpm = SPINDLE_MAX_RPM;
  }
  if (rpm < 100) {
    warnings.push(
      "RPM very low — large tool or slow material. Verify the spindle can sustain cutting torque at this speed.",
    );
  }
  const rpmRounded = Math.max(roundTo(rpm, 10), 0);

  // ---- Effective chip load (feed override scales fz at constant RPM) ----
  const fz = fzBase * (feedPct / 100);
  const z = Math.max(tool.flutes, 1);
  const feed = Math.max(fz * z * rpmRounded, 0);

  // ---- Recommended DOC / WOC (apply user overrides on the safe baseline) ----
  const maxAxial = Math.min(tool.length, material.maxDepthOfCut);
  const docAxial = Math.max(maxAxial * (axialPct / 100), 0);
  const radialFrac = (material.maxStepover / 100) * (radialPct / 100);
  const docRadial = Math.max(tool.diameter * radialFrac, 0);

  // ---- MRR (cm³/min) = (WOC * DOC * Feed) / 1000 ----
  const mrr = (docRadial * docAxial * feed) / 1000;

  // ---- Spindle power = MRR * Kp ----
  const kp = getUnitPower(material.id);
  const power = mrr * kp;

  // ---------------- Warnings ----------------
  if (fz > 0 && fz < 0.02) {
    warnings.push(
      "Chip load very low (<0.020 mm/tooth) — rubbing risk. Tool will burnish instead of cut; reduce RPM or raise feed.",
    );
  }
  if (fz > 0.15) {
    warnings.push(
      "Chip load very high (>0.150 mm/tooth) — risk of tool breakage or chipping. Reduce feed or increase flutes/RPM.",
    );
  }
  if (feed > 5000) {
    warnings.push(
      `High feed rate (${Math.round(feed).toLocaleString()} mm/min) — verify machine rapids and servo rigidity.`,
    );
  }
  if (power > 5) {
    warnings.push(
      `High spindle power demand (${power.toFixed(2)} kW) — ensure spindle rating, rigidity and coolant flow.`,
    );
  }
  if (docAxial > 3 * D) {
    warnings.push(
      "Axial DOC > 3× tool diameter — chip evacuation compromised. Consider peck-drilling or reduced depth per pass.",
    );
  }
  if (docRadial > 0.9 * D) {
    warnings.push(
      "Radial WOC > 90% — full slotting engagement. Reduce feed 30-50% or switch to an HSM toolpath.",
    );
  }
  if (material.id === "steel-stainless") {
    warnings.push(
      "Stainless work-hardens rapidly — keep chip load up, avoid dwelling, flood coolant mandatory.",
    );
  }
  if (material.id === "delrin" && rpmRounded < 5000) {
    warnings.push(
      "Delrin at low RPM risks melting — increase surface speed and use air blast to clear chips.",
    );
  }
  if (material.id === "copper") {
    warnings.push(
      "Copper is gummy — use sharp polished-carbide tools and aggressive chip load to avoid built-up edge.",
    );
  }
  if (tool.type === "drill" || tool.type === "spot_drill" || tool.type === "reamer") {
    warnings.push(
      `${tool.type.replace("_", " ")}: feed/RPM calc is approximate — use manufacturer peck cycles (G83/G81) and chip-load per rev.`,
    );
  }
  if (tool.type === "chamfer") {
    warnings.push(
      "Chamfer tool: effective cutting diameter changes with depth — recalculate Vc at the actual engagement Ø.",
    );
  }
  if (tool.type === "face_mill") {
    warnings.push(
      "Face mill: enter on the outside of the stock at <50% radial engagement to avoid entrance shock.",
    );
  }

  return {
    rpm: rpmRounded,
    feedMmPerMin: Math.round(feed),
    chipLoadActual: Number(fz.toFixed(4)),
    mrr: Number(mrr.toFixed(3)),
    power: Number(power.toFixed(3)),
    docAxial: Number(docAxial.toFixed(2)),
    docRadial: Number(docRadial.toFixed(2)),
    warnings,
  };
}
