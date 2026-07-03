"use client";

import { useMemo, useState } from "react";
import {
  Calculator,
  Gauge,
  Zap,
  AlertTriangle,
  Info,
  RotateCw,
  Scissors,
  Ruler,
  Layers,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { TOOL_LIBRARY, getToolByNumber } from "@/lib/cnc/tools";
import { MATERIAL_LIBRARY, getMaterialById } from "@/lib/cnc/materials";
import { calculateFeeds } from "@/lib/cnc/feeds";

/**
 * Feeds & Speeds Calculator
 * Educational tool: pick a tool + material, tweak DOC/WOC/feed overrides,
 * and read out live RPM / feed / chip load / MRR / power plus safety warnings.
 * Read-only — does not modify the loaded G-code program.
 */
export default function FeedsCalculator() {
  const [toolNumber, setToolNumber] = useState<number>(TOOL_LIBRARY[0].number);
  const [materialId, setMaterialId] = useState<string>(MATERIAL_LIBRARY[0].id);
  const [axialPct, setAxialPct] = useState<number>(80);
  const [radialPct, setRadialPct] = useState<number>(100);
  const [feedPct, setFeedPct] = useState<number>(100);

  const tool = useMemo(() => getToolByNumber(toolNumber) ?? TOOL_LIBRARY[0], [toolNumber]);
  const material = useMemo(() => getMaterialById(materialId), [materialId]);

  const result = useMemo(
    () =>
      calculateFeeds(tool, material, {
        axialOverride: axialPct,
        radialOverridePct: radialPct,
        feedOverridePct: feedPct,
      }),
    [tool, material, axialPct, radialPct, feedPct],
  );

  return (
    <div className="flex h-full flex-col bg-[#0b0d10] text-slate-200">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/15 text-cyan-400">
          <Calculator className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-100">Feeds &amp; Speeds Calculator</h2>
          <p className="text-[10px] text-slate-500">
            Reference machining parameters from tool + material combination
          </p>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Selectors */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Tool
            </label>
            <Select value={String(toolNumber)} onValueChange={(v) => setToolNumber(Number(v))}>
              <SelectTrigger className="border-white/10 bg-black/40 text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOOL_LIBRARY.map((t) => (
                  <SelectItem key={t.number} value={String(t.number)}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: t.color }}
                      />
                      T{t.number} · {t.name} (Ø{t.diameter}, {t.flutes}FL)
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Material
            </label>
            <Select value={materialId} onValueChange={setMaterialId}>
              <SelectTrigger className="border-white/10 bg-black/40 text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATERIAL_LIBRARY.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-white/20"
                        style={{ background: m.color }}
                      />
                      {m.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tool + material info cards */}
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-md border border-white/8 bg-white/[0.02] p-2.5">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: tool.color, boxShadow: `0 0 8px ${tool.color}66` }}
              />
              <span className="truncate text-xs font-semibold text-slate-100">
                T{tool.number} · {tool.name}
              </span>
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-400">
              <span>Ø {tool.diameter} mm</span>
              <span>{tool.flutes} flutes</span>
              <span>Flute {tool.length} mm</span>
              <span>Vc {tool.surfaceSpeed} m/min</span>
            </div>
          </div>
          <div className="rounded-md border border-white/8 bg-white/[0.02] p-2.5">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full border border-white/20"
                style={{ background: material.color }}
              />
              <span className="truncate text-xs font-semibold text-slate-100">{material.name}</span>
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-400">
              <span>ρ {material.density} g/cm³</span>
              <span>Vc {material.surfaceSpeed} m/min</span>
              <span>Max DOC {material.maxDepthOfCut} mm</span>
              <span className="capitalize">Coolant: {material.coolant}</span>
            </div>
          </div>
        </div>

        {/* Override sliders */}
        <div className="mt-3 space-y-3 rounded-md border border-white/8 bg-white/[0.02] p-3">
          <SliderRow
            icon={<Layers className="h-3.5 w-3.5" />}
            label="Axial DOC"
            value={axialPct}
            min={10}
            max={100}
            step={5}
            unit="%"
            color="#22d3ee"
            hint={`→ ${result.docAxial.toFixed(2)} mm`}
            onChange={setAxialPct}
          />
          <SliderRow
            icon={<Ruler className="h-3.5 w-3.5" />}
            label="Radial WOC"
            value={radialPct}
            min={10}
            max={100}
            step={5}
            unit="%"
            color="#f59e0b"
            hint={`→ ${result.docRadial.toFixed(2)} mm`}
            onChange={setRadialPct}
          />
          <SliderRow
            icon={<Gauge className="h-3.5 w-3.5" />}
            label="Feed Override"
            value={feedPct}
            min={50}
            max={150}
            step={5}
            unit="%"
            color="#fb923c"
            onChange={setFeedPct}
          />
        </div>

        {/* Live result stats */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat
            icon={<RotateCw className="h-3.5 w-3.5" />}
            label="Spindle RPM"
            value={result.rpm.toLocaleString()}
            color="#22d3ee"
          />
          <Stat
            icon={<Gauge className="h-3.5 w-3.5" />}
            label="Feed"
            value={result.feedMmPerMin.toLocaleString()}
            unit="mm/min"
            color="#34d399"
          />
          <Stat
            icon={<Scissors className="h-3.5 w-3.5" />}
            label="Chip Load"
            value={result.chipLoadActual.toFixed(4)}
            unit="mm/t"
            color="#f59e0b"
          />
          <Stat
            icon={<Layers className="h-3.5 w-3.5" />}
            label="MRR"
            value={result.mrr.toFixed(2)}
            unit="cm³/min"
            color="#a78bfa"
          />
          <Stat
            icon={<Zap className="h-3.5 w-3.5" />}
            label="Power"
            value={result.power.toFixed(2)}
            unit="kW"
            color="#fb923c"
          />
          <Stat
            icon={<Ruler className="h-3.5 w-3.5" />}
            label="DOC / WOC"
            value={`${result.docAxial.toFixed(1)} / ${result.docRadial.toFixed(1)}`}
            unit="mm"
            color="#2dd4bf"
          />
        </div>

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/[0.06] p-2.5">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              {result.warnings.length} warning{result.warnings.length > 1 ? "s" : ""}
            </div>
            <ul className="space-y-1">
              {result.warnings.map((w, i) => (
                <li
                  key={i}
                  className="flex gap-1.5 text-[10px] leading-snug text-amber-200/80"
                >
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Apply note */}
        <div className="mt-3 flex items-start gap-2 rounded-md border border-cyan-500/20 bg-cyan-500/[0.05] p-2.5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
          <p className="text-[10px] leading-snug text-slate-400">
            These values are{" "}
            <span className="font-semibold text-cyan-300">reference only</span> and do not modify
            the loaded G-code program. To apply, hand-edit the program&apos;s{" "}
            <code className="rounded bg-black/40 px-1 font-mono text-cyan-300">S</code> (spindle) and{" "}
            <code className="rounded bg-black/40 px-1 font-mono text-cyan-300">F</code> (feed) words.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------- subcomponents ----------------

function SliderRow({
  icon,
  label,
  value,
  min,
  max,
  step,
  unit,
  color,
  hint,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  color: string;
  hint?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
          <span style={{ color }}>{icon}</span>
          {label}
        </div>
        <div className="flex items-center gap-2">
          {hint && (
            <span className="font-mono text-[10px] text-slate-500">{hint}</span>
          )}
          <span
            className="font-mono text-[11px] font-semibold tabular-nums"
            style={{ color }}
          >
            {value}
            {unit}
          </span>
        </div>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
        style={{ color }}
        className={cn(
          "[&_[data-slot=slider-track]]:bg-white/10",
          "[&_[data-slot=slider-range]]:bg-current",
          "[&_[data-slot=slider-thumb]]:border-current",
          "[&_[data-slot=slider-thumb]]:bg-[#0b0d10]",
        )}
      />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  color: string;
}) {
  return (
    <div className="rounded-md border border-white/8 bg-black/40 p-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span
          className="font-mono text-base font-semibold tabular-nums sm:text-lg"
          style={{ color, textShadow: `0 0 10px ${color}33` }}
        >
          {value}
        </span>
        {unit && <span className="text-[9px] text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}
