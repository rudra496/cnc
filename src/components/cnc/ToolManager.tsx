"use client";

import { useState } from "react";
import { Wrench, Circle, Triangle, Square, Layers, ShieldCheck, Zap } from "lucide-react";
import { TOOL_LIBRARY, type ToolType, type OperationCategory, type CncTool } from "@/lib/cnc/tools";
import { useSimStore } from "@/lib/cnc/store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const TYPE_LABEL: Record<ToolType, string> = {
  end_mill: "End Mill",
  ball_nose: "Ball Nose",
  bull_nose: "Bull Nose",
  roughing_end_mill: "Rougher",
  drill: "Twist Drill",
  spot_drill: "Spot Drill",
  reamer: "Reamer",
  chamfer: "Chamfer",
  face_mill: "Face Mill",
  fly_cutter: "Fly Cutter",
  tap: "Machine Tap",
  thread_mill: "Thread Mill",
  lathe_turning: "OD Turning",
  lathe_finishing: "OD Finishing",
  lathe_threading: "Threading",
  lathe_grooving: "Parting/Groove",
  lathe_boring: "ID Boring",
  carving_tapered: "3D Tapered",
};

const CATEGORIES: ("All" | OperationCategory)[] = ["All", "Milling", "Drilling", "Holemaking", "Finishing", "Turning"];

export default function ToolManager() {
  const currentTool = useSimStore((s) => s.tool);
  const parseResult = useSimStore((s) => s.parseResult);
  const [selectedCategory, setSelectedCategory] = useState<"All" | OperationCategory>("All");

  // track tools used in current program
  const usedTools = new Set<number>();
  if (parseResult) {
    for (const m of parseResult.moves) {
      if (m.tool > 0) usedTools.add(m.tool);
    }
  }

  const filteredTools = TOOL_LIBRARY.filter(
    (t) => selectedCategory === "All" || t.category === selectedCategory
  );

  return (
    <div className="h-full overflow-y-auto bg-[#0b0d10] p-3 [scrollbar-width:thin]">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-100">ISO Tool Library</h3>
        </div>
        <Badge variant="secondary" className="bg-amber-500/10 text-amber-300 border-amber-500/20 text-[10px]">
          {TOOL_LIBRARY.length} Standard Tools
        </Badge>
      </div>

      <p className="mb-3 text-[11px] leading-relaxed text-slate-400">
        International ISO 13399 &amp; ANSI standard tool catalog. Select any tool to inspect geometry and machining parameters. Programs call tools via <code className="text-amber-300 font-mono">T&lt;n&gt; M06</code>.
      </p>

      {/* Category Tabs */}
      <div className="mb-3 flex flex-wrap gap-1 border-b border-white/10 pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "rounded-md px-2 py-1 text-[10px] font-semibold transition-colors",
              selectedCategory === cat
                ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/40"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tool Cards */}
      <div className="space-y-2">
        {filteredTools.map((t) => {
          const active = currentTool === t.number;
          const used = usedTools.has(t.number);
          return (
            <div
              key={t.number}
              className={cn(
                "group relative rounded-lg border p-2.5 transition-colors",
                active
                  ? "border-amber-400/60 bg-amber-500/10 shadow-[0_0_14px_rgba(245,158,11,0.2)]"
                  : used
                    ? "border-cyan-500/40 bg-cyan-500/5"
                    : "border-white/8 bg-white/[0.02] hover:border-white/15"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Tool Color Swatch & Number Badge */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/20 font-mono text-xs font-bold text-slate-100 shadow"
                    style={{ background: `linear-gradient(135deg, ${t.color}44, ${t.color}aa)` }}
                  >
                    T{t.number}
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase">{t.category[0]}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="truncate text-xs font-bold text-slate-100">
                      {t.name}
                    </span>
                    <span className="rounded bg-white/5 px-1 py-0.2 font-mono text-[9px] text-slate-400">
                      {t.isoCode}
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
                        IN PROGRAM
                      </Badge>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-slate-400 font-mono">
                    <span className="text-cyan-400">Ø{t.diameter}mm</span>
                    <span>Flutes: {t.flutes}</span>
                    <span>L: {t.length}mm</span>
                    <span>Shank: Ø{t.shankDiameter}mm</span>
                    {t.cornerRadius && <span>R{t.cornerRadius}mm</span>}
                    {t.pointAngle && <span>{t.pointAngle}°</span>}
                  </div>

                  <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                    {t.description}
                  </p>

                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Mini label="Vc" value={`${t.surfaceSpeed} m/min`} />
                    <Mini label="fz" value={`${t.chipLoad} mm`} />
                    <Mini label="Cat" value={t.category} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-white/8 bg-black/40 px-1.5 py-0.5 font-mono text-[9px]">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-300">{value}</span>
    </span>
  );
}
