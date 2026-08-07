"use client";

import { useState } from "react";
import { Palette, Info, Check, ShieldAlert } from "lucide-react";
import { MATERIAL_LIBRARY, type IsoMaterialGroup } from "@/lib/cnc/materials";
import { useSimStore } from "@/lib/cnc/store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const ISO_GROUPS: ("All" | IsoMaterialGroup)[] = [
  "All",
  "N (Non-Ferrous)",
  "P (Steel)",
  "M (Stainless)",
  "S (Superalloys)",
  "K (Cast Iron)",
  "O (Synthetics)",
];

export default function MaterialPanel() {
  const materialId = useSimStore((s) => s.materialId);
  const [selectedGroup, setSelectedGroup] = useState<"All" | IsoMaterialGroup>("All");

  const filteredMaterials = MATERIAL_LIBRARY.filter(
    (m) => selectedGroup === "All" || m.isoGroup === selectedGroup
  );

  return (
    <div className="flex h-full flex-col bg-[#0b0d10] text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-500/15 text-orange-400">
            <Palette className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">ISO Material Catalog</h2>
            <p className="text-[10px] text-slate-500">
              ISO 513 standard material classification
            </p>
          </div>
        </div>
        <Badge variant="outline" className="border-orange-500/30 text-orange-300 text-[10px]">
          {MATERIAL_LIBRARY.length} Materials
        </Badge>
      </div>

      {/* ISO Group Filters */}
      <div className="flex flex-wrap gap-1 border-b border-white/10 bg-[#0d0f13] px-3 py-2">
        {ISO_GROUPS.map((grp) => (
          <button
            key={grp}
            onClick={() => setSelectedGroup(grp)}
            className={cn(
              "rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors",
              selectedGroup === grp
                ? "bg-orange-500/20 text-orange-200 border border-orange-400/40"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
            )}
          >
            {grp}
          </button>
        ))}
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto p-3 [scrollbar-width:thin]">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {filteredMaterials.map((m) => {
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
                    ? "border-cyan-400/60 bg-cyan-500/[0.08] shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                    : "border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                )}
              >
                <div className="flex items-center gap-2">
                  {/* PBR color swatch */}
                  <span
                    className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md border border-white/20 shadow-inner"
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
                    <div className="text-[10px] font-mono text-slate-400">
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
        "rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-mono font-medium text-slate-400",
        className
      )}
    >
      {children}
    </span>
  );
}
