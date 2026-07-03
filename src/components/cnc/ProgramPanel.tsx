"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Cpu,
  Layers,
  Ruler,
  CircleAlert,
} from "lucide-react";
import { useSimStore } from "@/lib/cnc/store";
import { CNC_EXAMPLES } from "@/lib/cnc/examples";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import GCodeEditor from "./GCodeEditor";

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner: "#34d399",
  Intermediate: "#f59e0b",
  Advanced: "#fb7185",
};

export default function ProgramPanel() {
  const exampleId = useSimStore((s) => s.exampleId);
  const loadExample = useSimStore((s) => s.loadExample);
  const workpiece = useSimStore((s) => s.workpiece);
  const parseErrors = useSimStore((s) => s.parseErrors);
  const parseWarnings = useSimStore((s) => s.parseWarnings);
  const cycleTimeSec = useSimStore((s) => s.cycleTimeSec);
  const parseResult = useSimStore((s) => s.parseResult);
  const setSource = useSimStore((s) => s.setSource);

  const currentExample = useMemo(
    () => CNC_EXAMPLES.find((e) => e.id === exampleId),
    [exampleId],
  );

  const moveCount = parseResult?.moves.length ?? 0;
  const cutMoves = useMemo(
    () =>
      parseResult?.moves.filter(
        (m) => m.type !== "rapid" && m.type !== "dwell",
      ).length ?? 0,
    [parseResult],
  );

  const hasIssues = parseErrors.length > 0 || parseWarnings.length > 0;

  return (
    <div className="flex h-full flex-col bg-[#0b0d10]">
      {/* program meta header */}
      <div className="border-b border-white/10 p-3">
        <div className="mb-2 flex items-center gap-2">
          <Select value={exampleId ?? "custom"} onValueChange={(v) => {
            if (v === "custom") {
              setSource("; Type your custom G-code here\n");
            } else {
              loadExample(v);
            }
          }}>
            <SelectTrigger className="h-8 flex-1 border-white/10 bg-black/40 text-xs text-slate-200">
              <SelectValue placeholder="Select a program" />
            </SelectTrigger>
            <SelectContent className="max-h-72 border-white/10 bg-[#15181d] text-slate-200">
              {CNC_EXAMPLES.map((ex) => (
                <SelectItem
                  key={ex.id}
                  value={ex.id}
                  className="text-xs focus:bg-white/10"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: DIFFICULTY_COLOR[ex.difficulty] }}
                    />
                    {ex.name}
                  </span>
                </SelectItem>
              ))}
              <SelectItem value="custom" className="text-xs focus:bg-white/10">
                Custom (editor)
              </SelectItem>
            </SelectContent>
          </Select>
          {currentExample && (
            <Badge
              variant="outline"
              className="shrink-0 border-white/10 text-[10px]"
              style={{ color: DIFFICULTY_COLOR[currentExample.difficulty] }}
            >
              {currentExample.difficulty}
            </Badge>
          )}
        </div>

        {currentExample?.description && (
          <p className="mb-2 text-[11px] leading-relaxed text-slate-400">
            {currentExample.description}
          </p>
        )}

        {/* stats row */}
        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
          <Stat
            icon={Ruler}
            label="Stock"
            value={`${workpiece.width}×${workpiece.depth}×${workpiece.height} mm`}
            color="#34d399"
          />
          <Stat
            icon={Cpu}
            label="Tool"
            value="Ø6 End Mill"
            color="#a78bfa"
          />
          <Stat
            icon={Layers}
            label="Blocks"
            value={`${moveCount} (${cutMoves} cut)`}
            color="#22d3ee"
          />
          <Stat
            icon={Info}
            label="Cycle"
            value={`${cycleTimeSec.toFixed(1)} s`}
            color="#f59e0b"
          />
        </div>

        {/* diagnostics */}
        <div className="mt-2">
          {parseErrors.length > 0 ? (
            <DiagList
              kind="error"
              items={parseErrors}
            />
          ) : parseWarnings.length > 0 ? (
            <DiagList kind="warning" items={parseWarnings} />
          ) : (
            <div className="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 text-[10px] text-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              Program parsed cleanly — no errors or warnings.
            </div>
          )}
        </div>
      </div>

      {/* editor */}
      <div className="relative min-h-0 flex-1">
        <GCodeEditor />
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-white/8 bg-white/[0.03] px-2 py-1">
      <Icon className="h-3 w-3 shrink-0" style={{ color }} />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="text-[8px] uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <span className="truncate font-mono text-[10px] font-semibold text-slate-200">
          {value}
        </span>
      </div>
    </div>
  );
}

function DiagList({
  kind,
  items,
}: {
  kind: "error" | "warning";
  items: { line: number; message: string }[];
}) {
  const isErr = kind === "error";
  return (
    <div
      className={cn(
        "max-h-24 overflow-y-auto rounded-md border px-2 py-1 text-[10px] [scrollbar-width:thin]",
        isErr
          ? "border-rose-500/20 bg-rose-500/5"
          : "border-amber-500/20 bg-amber-500/5",
      )}
    >
      <div
        className={cn(
          "mb-1 flex items-center gap-1.5 font-semibold",
          isErr ? "text-rose-300" : "text-amber-300",
        )}
      >
        {isErr ? (
          <CircleAlert className="h-3 w-3" />
        ) : (
          <AlertTriangle className="h-3 w-3" />
        )}
        {items.length} {isErr ? "error" : "warning"}
        {items.length > 1 ? "s" : ""}
      </div>
      {items.map((it, i) => (
        <div key={i} className="flex gap-1.5 py-0.5">
          <span
            className={cn(
              "font-mono font-bold",
              isErr ? "text-rose-400" : "text-amber-400",
            )}
          >
            L{it.line}
          </span>
          <span className="text-slate-400">{it.message}</span>
        </div>
      ))}
    </div>
  );
}
