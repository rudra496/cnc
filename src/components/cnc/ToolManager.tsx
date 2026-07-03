"use client";

import { Wrench, Circle, Triangle, Square } from "lucide-react";
import { TOOL_LIBRARY, type ToolType } from "@/lib/cnc/tools";
import { useSimStore } from "@/lib/cnc/store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const TYPE_LABEL: Record<ToolType, string> = {
  end_mill: "End Mill",
  ball_nose: "Ball Nose",
  drill: "Drill",
  chamfer: "Chamfer",
  face_mill: "Face Mill",
  spot_drill: "Spot Drill",
  reamer: "Reamer",
  thread_mill: "Thread Mill",
};

const TYPE_SHAPE: Record<ToolType, React.ElementType> = {
  end_mill: Square,
  ball_nose: Circle,
  drill: Triangle,
  chamfer: Triangle,
  face_mill: Square,
  spot_drill: Triangle,
  reamer: Square,
  thread_mill: Square,
};

export default function ToolManager() {
  const currentTool = useSimStore((s) => s.tool);
  const parseResult = useSimStore((s) => s.parseResult);

  // which tools does the program use?
  const usedTools = new Set<number>();
  if (parseResult) {
    for (const m of parseResult.moves) {
      if (m.tool > 0) usedTools.add(m.tool);
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-[#0b0d10] p-3 [scrollbar-width:thin]">
      <div className="mb-3 flex items-center gap-2">
        <Wrench className="h-4 w-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-slate-100">Tool Library</h3>
        <Badge variant="secondary" className="ml-auto bg-white/5 text-slate-300">
          {TOOL_LIBRARY.length} tools
        </Badge>
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-slate-400">
        The simulator ships with {TOOL_LIBRARY.length} pre-configured tools.
        Each tool carves with its real diameter and renders its actual geometry
        in the 3D view. Programs select tools with <code className="text-amber-300">T&lt;n&gt; M06</code>.
      </p>

      <div className="space-y-2">
        {TOOL_LIBRARY.map((t) => {
          const active = currentTool === t.number;
          const used = usedTools.has(t.number);
          const Shape = TYPE_SHAPE[t.type];
          return (
            <div
              key={t.number}
              className={cn(
                "rounded-lg border p-3 transition-colors",
                active
                  ? "border-amber-400/50 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                  : used
                    ? "border-cyan-500/30 bg-cyan-500/5"
                    : "border-white/8 bg-white/[0.02] hover:border-white/15",
              )}
            >
              <div className="flex items-start gap-3">
                {/* tool shape swatch */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
                  style={{ background: `${t.color}22` }}
                >
                  <Shape
                    className="h-5 w-5"
                    style={{ color: t.color }}
                    fill={t.color}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-200">
                      T{t.number}
                    </span>
                    <span className="truncate text-xs font-semibold text-slate-100">
                      {t.name}
                    </span>
                    {active && (
                      <Badge className="ml-auto bg-amber-500/30 text-[9px] text-amber-200">
                        ACTIVE
                      </Badge>
                    )}
                    {used && !active && (
                      <Badge
                        variant="outline"
                        className="ml-auto border-cyan-500/30 text-[9px] text-cyan-300"
                      >
                        IN USE
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500">
                    <span>{TYPE_LABEL[t.type]}</span>
                    <span>Ø{t.diameter}mm</span>
                    <span>{t.flutes} flutes</span>
                    <span>L{t.length}mm</span>
                  </div>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                    {t.description}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Mini label="Vc" value={`${t.surfaceSpeed} m/min`} />
                    <Mini label="fz" value={`${t.chipLoad} mm`} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-md border border-white/8 bg-white/[0.02] p-2.5 text-[10px] text-slate-500">
        <strong className="text-slate-400">Tip:</strong> The Feeds &amp; Speeds
        calculator tab uses each tool's Vc and chip-load to recommend RPM and
        feed rate for the selected material.
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-white/8 bg-black/30 px-1.5 py-0.5 font-mono text-[9px]">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-300">{value}</span>
    </span>
  );
}
