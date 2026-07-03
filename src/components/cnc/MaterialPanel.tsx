"use client";

import { Palette, Info, Check } from "lucide-react";
import { MATERIAL_LIBRARY } from "@/lib/cnc/materials";
import { useSimStore } from "@/lib/cnc/store";
import { cn } from "@/lib/utils";

/**
 * Material Library panel.
 * Renders the full material catalog as a grid of selectable cards.
 * Clicking a material writes it to the sim store (workpiece color updates
 * live in the 3D scene).
 */
export default function MaterialPanel() {
  const materialId = useSimStore((s) => s.materialId);

  return (
    <div className="flex h-full flex-col bg-[#0b0d10] text-slate-200">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-500/15 text-orange-400">
          <Palette className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-100">Material Library</h2>
          <p className="text-[10px] text-slate-500">
            Tap a material to load it into the simulator
          </p>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {MATERIAL_LIBRARY.map((m) => {
            const active = m.id === materialId;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => useSimStore.getState().setMaterial(m.id)}
                aria-pressed={active}
                className={cn(
                  "group relative flex flex-col rounded-md border p-2.5 text-left transition",
                  active
                    ? "border-cyan-400/60 bg-cyan-500/[0.08] shadow-[0_0_0_1px_rgba(34,211,238,0.4)]"
                    : "border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]",
                )}
              >
                <div className="flex items-center gap-2">
                  {/* Color swatch (top + side band to mimic 3D workpiece) */}
                  <span
                    className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md border border-white/20"
                    style={{ background: m.color }}
                  >
                    <span
                      className="absolute inset-x-0 bottom-0 h-2"
                      style={{ background: m.sideColor }}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-slate-100">
                      {m.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {m.density} g/cm³ · Vc {m.surfaceSpeed} m/min
                    </div>
                  </div>
                  {active && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>

                <p className="mt-1.5 text-[10px] leading-snug text-slate-400">{m.notes}</p>

                <div className="mt-1.5 flex flex-wrap gap-1">
                  <Pill>Max DOC {m.maxDepthOfCut} mm</Pill>
                  <Pill>Stepover {m.maxStepover}%</Pill>
                  <Pill className="capitalize">Coolant: {m.coolant}</Pill>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-3 flex items-start gap-2 rounded-md border border-orange-500/20 bg-orange-500/[0.05] p-2.5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" />
          <p className="text-[10px] leading-snug text-slate-400">
            Workpiece color updates in 3D view. Material choice also feeds the Feeds &amp; Speeds
            calculator (cutting parameters depend on the selected workpiece).
          </p>
        </div>
      </div>
    </div>
  );
}

function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-medium text-slate-400",
        className,
      )}
    >
      {children}
    </span>
  );
}
