"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Wind,
  Wrench,
  FastForward,
  Footprints,
  Square,
  Settings2,
  CircleDot,
  FlaskConical,
  Lock,
  OctagonX,
  PauseCircle,
} from "lucide-react";
import { useSimStore, selectProgress, type MachineMode } from "@/lib/cnc/store";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function fmtTime(sec: number) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.floor((sec * 10) % 10);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${cs}`;
}

function fmt(n: number, digits = 2) {
  if (!isFinite(n)) n = 0;
  return n.toFixed(digits);
}

// ---------- DRO readout ----------
function DRO() {
  const pos = useSimStore((s) => s.position);
  const isCutting = useSimStore((s) => s.isCutting);
  const axes = [
    { label: "X", v: pos.x, color: "#34d399" },
    { label: "Y", v: pos.y, color: "#22d3ee" },
    { label: "Z", v: pos.z, color: "#4ade80" },
  ];
  return (
    <div className="flex gap-1.5">
      {axes.map((a) => (
        <div
          key={a.label}
          className="relative flex min-w-[92px] flex-col rounded-md border border-white/10 bg-black/60 px-2.5 py-1.5 shadow-inner"
        >
          <div className="flex items-center justify-between">
            <span
              className="text-[10px] font-bold tracking-widest"
              style={{ color: a.color }}
            >
              {a.label}
            </span>
            <span className="text-[8px] uppercase tracking-wider text-slate-500">
              mm
            </span>
          </div>
          <span
            className="font-mono text-lg font-semibold tabular-nums leading-tight"
            style={{ color: a.color, textShadow: `0 0 8px ${a.color}55` }}
          >
            {fmt(a.v, 3)}
          </span>
          {isCutting && a.label === "Z" && (
            <span className="absolute right-1 top-1 h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------- Status lamps ----------
function StatusLamp({
  icon: Icon,
  label,
  value,
  active,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  active: boolean;
  color: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors",
        active
          ? "border-white/15 bg-white/5"
          : "border-white/5 bg-black/40 opacity-60",
      )}
    >
      <Icon
        className="h-4 w-4 shrink-0"
        style={{ color: active ? color : "#64748b" }}
      />
      <div className="flex flex-col leading-tight">
        <span className="text-[8px] uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <span
          className="font-mono text-xs font-semibold tabular-nums"
          style={{ color: active ? color : "#94a3b8" }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function StatusRow() {
  const spindleRpm = useSimStore((s) => s.spindleRpm);
  const spindleOn = useSimStore((s) => s.spindleOn);
  const spindleDir = useSimStore((s) => s.spindleDir);
  const spindleOverride = useSimStore((s) => s.spindleOverride);
  const feed = useSimStore((s) => s.feed);
  const isCutting = useSimStore((s) => s.isCutting);
  const tool = useSimStore((s) => s.tool);
  const coolant = useSimStore((s) => s.coolant);

  const rpmDisp = Math.round((spindleRpm * spindleOverride) / 100);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <StatusLamp
        icon={spindleDir >= 0 ? CircleDot : RotateCcw}
        label="Spindle"
        value={spindleOn ? `${rpmDisp} rpm` : "OFF"}
        active={spindleOn}
        color="#f59e0b"
      />
      <StatusLamp
        icon={Gauge}
        label="Feed"
        value={isCutting ? `${fmt(feed, 0)} mm/min` : "—"}
        active={isCutting}
        color="#22d3ee"
      />
      <StatusLamp
        icon={Wrench}
        label="Tool"
        value={`T${tool || 0}`}
        active={tool > 0}
        color="#a78bfa"
      />
      <StatusLamp
        icon={Wind}
        label="Coolant"
        value={coolant === "off" ? "OFF" : coolant.toUpperCase()}
        active={coolant !== "off"}
        color="#38bdf8"
      />
    </div>
  );
}

// ---------- Transport button ----------
function TButton({
  onClick,
  children,
  tooltip,
  active,
  variant = "ghost",
  size = "icon",
  className,
}: {
  onClick: () => void;
  children: React.ReactNode;
  tooltip: string;
  active?: boolean;
  variant?: "ghost" | "default" | "outline";
  size?: "icon" | "sm" | "lg";
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          variant={variant}
          size={size}
          className={cn(
            "h-9 w-9 rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white",
            active && "border-cyan-400/50 bg-cyan-500/20 text-cyan-200",
            className,
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

// ---------- Override knob (slider-based) ----------
function OverrideKnob({
  label,
  value,
  onChange,
  min,
  max,
  color,
  unit = "%",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  color: string;
  unit?: string;
}) {
  return (
    <div className="flex w-[110px] flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <span
          className="font-mono text-[10px] font-bold tabular-nums"
          style={{ color }}
        >
          {value}
          {unit}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={5}
        onValueChange={(v) => onChange(v[0])}
        className="py-0.5"
      />
    </div>
  );
}

// ---------- Machine mode selector ----------
function ModeSelect({
  mode,
  onChange,
}: {
  mode: MachineMode;
  onChange: (m: MachineMode) => void;
}) {
  const modes: { id: MachineMode; label: string; icon: React.ElementType }[] = [
    { id: "run", label: "Run", icon: Play },
    { id: "dry_run", label: "Dry", icon: FlaskConical },
    { id: "machine_lock", label: "Lock", icon: Lock },
  ];
  return (
    <div className="flex items-center gap-0.5 rounded-md border border-white/10 bg-black/50 p-0.5">
      {modes.map((m) => {
        const active = mode === m.id;
        return (
          <Tooltip key={m.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onChange(m.id)}
                className={cn(
                  "flex h-7 items-center gap-1 rounded px-2 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                  active
                    ? m.id === "run"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : m.id === "dry_run"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-rose-500/20 text-rose-300"
                    : "text-slate-500 hover:text-slate-300",
                )}
              >
                <m.icon className="h-3 w-3" />
                {m.label}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {m.id === "run"
                ? "Run mode — full cutting simulation"
                : m.id === "dry_run"
                  ? "Dry run — toolpath runs but no material cut"
                  : "Machine lock — no carving, toolpath preview only"}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

export default function ControlBar() {
  const playing = useSimStore((s) => s.playing);
  const toggle = useSimStore((s) => s.toggle);
  const reset = useSimStore((s) => s.reset);
  const stepForward = useSimStore((s) => s.stepForward);
  const stepBackward = useSimStore((s) => s.stepBackward);
  const seek = useSimStore((s) => s.seek);
  const speed = useSimStore((s) => s.speed);
  const setSpeed = useSimStore((s) => s.setSpeed);
  const feedOverride = useSimStore((s) => s.feedOverride);
  const rapidOverride = useSimStore((s) => s.rapidOverride);
  const spindleOverride = useSimStore((s) => s.spindleOverride);
  const setFeedOverride = useSimStore((s) => s.setFeedOverride);
  const setRapidOverride = useSimStore((s) => s.setRapidOverride);
  const setSpindleOverride = useSimStore((s) => s.setSpindleOverride);
  const singleBlock = useSimStore((s) => s.singleBlock);
  const toggleSingleBlock = useSimStore((s) => s.toggleSingleBlock);
  const optionalStop = useSimStore((s) => s.optionalStop);
  const toggleOptionalStop = useSimStore((s) => s.toggleOptionalStop);
  const blockSkip = useSimStore((s) => s.blockSkip);
  const toggleBlockSkip = useSimStore((s) => s.toggleBlockSkip);
  const machineMode = useSimStore((s) => s.machineMode);
  const setMachineMode = useSimStore((s) => s.setMachineMode);
  const currentMoveIndex = useSimStore((s) => s.currentMoveIndex);
  const cycleTimeSec = useSimStore((s) => s.cycleTimeSec);
  const elapsedTimeSec = useSimStore((s) => s.elapsedTimeSec);
  const parseResult = useSimStore((s) => s.parseResult);
  const tick = useSimStore((s) => s.tick);
  const progress = useSimStore(selectProgress);
  const totalMoves = parseResult?.moves.length ?? 0;

  // ---- rAF ticker ----
  const lastRef = useRef<number | null>(null);
  useEffect(() => {
    let raf = 0;
    const loop = (t: number) => {
      if (lastRef.current == null) lastRef.current = t;
      const dt = Math.min(0.05, (t - lastRef.current) / 1000); // clamp dt
      lastRef.current = t;
      if (dt > 0) tick(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tick]);

  // ---- keyboard shortcuts ----
  const onKey = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        stepForward();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        stepBackward();
      } else if (e.code === "KeyR") {
        e.preventDefault();
        reset();
      }
    },
    [toggle, stepForward, stepBackward, reset],
  );
  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  const speedPresets = [0.25, 0.5, 1, 2, 5, 10];

  return (
    <TooltipProvider delayDuration={250}>
      <div className="border-t border-white/10 bg-gradient-to-b from-[#15181d] to-[#0d0f13] shadow-[0_-8px_24px_rgba(0,0,0,0.4)]">
        {/* Top strip: DRO + status */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
          <div className="flex items-center gap-3">
            <DRO />
            <div className="hidden flex-col rounded-md border border-white/10 bg-black/50 px-2.5 py-1.5 sm:flex">
              <span className="text-[8px] uppercase tracking-wider text-slate-500">
                Block
              </span>
              <span className="font-mono text-sm font-semibold tabular-nums text-slate-200">
                {Math.min(currentMoveIndex + 1, totalMoves || 1)}
                <span className="text-slate-500"> / {totalMoves}</span>
              </span>
            </div>
            <div className="hidden flex-col rounded-md border border-white/10 bg-black/50 px-2.5 py-1.5 md:flex">
              <span className="text-[8px] uppercase tracking-wider text-slate-500">
                Cycle Time
              </span>
              <span className="font-mono text-sm font-semibold tabular-nums text-slate-200">
                {fmtTime(elapsedTimeSec)}
                <span className="text-slate-500"> / {fmtTime(cycleTimeSec)}</span>
              </span>
            </div>
          </div>
          <StatusRow />
        </div>

        {/* Bottom strip: transport + scrubber + speed + overrides */}
        <div className="flex flex-wrap items-center gap-3 border-t border-white/5 px-3 py-2.5">
          {/* Transport */}
          <div className="flex items-center gap-1.5">
            <TButton onClick={reset} tooltip="Reset (R)">
              <RotateCcw className="h-4 w-4" />
            </TButton>
            <TButton onClick={stepBackward} tooltip="Step back (←)">
              <SkipBack className="h-4 w-4" />
            </TButton>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={toggle}
                  size="icon"
                  className={cn(
                    "h-12 w-12 rounded-full border-2 transition-all",
                    playing
                      ? "border-amber-400/60 bg-amber-500/20 text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.45)]"
                      : "border-cyan-400/60 bg-cyan-500/20 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.4)] hover:bg-cyan-500/30",
                  )}
                >
                  {playing ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 translate-x-0.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {playing ? "Pause (Space)" : "Play (Space)"}
              </TooltipContent>
            </Tooltip>
            <TButton onClick={stepForward} tooltip="Step forward (→)">
              <SkipForward className="h-4 w-4" />
            </TButton>
            <TButton
              onClick={toggleSingleBlock}
              tooltip="Single-block mode"
              active={singleBlock}
            >
              <Footprints className="h-4 w-4" />
            </TButton>
          </div>

          {/* Machine modes */}
          <div className="hidden items-center gap-1.5 lg:flex">
            <TButton
              onClick={toggleOptionalStop}
              tooltip="Optional stop (M01)"
              active={optionalStop}
            >
              <PauseCircle className="h-4 w-4" />
            </TButton>
            <TButton
              onClick={toggleBlockSkip}
              tooltip="Block skip (/)"
              active={blockSkip}
            >
              <OctagonX className="h-4 w-4" />
            </TButton>
            <ModeSelect
              mode={machineMode}
              onChange={setMachineMode}
            />
          </div>

          <div className="hidden h-10 w-px bg-white/10 md:block" />

          {/* Scrubber */}
          <div className="flex min-w-[180px] flex-1 flex-col gap-1">
            <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-500">
              <span>Timeline</span>
              <span className="font-mono tabular-nums text-slate-400">
                {(progress * 100).toFixed(1)}%
              </span>
            </div>
            <Slider
              value={[Math.round(progress * 1000)]}
              min={0}
              max={1000}
              step={1}
              onValueChange={(v) => seek(v[0] / 1000)}
              className="py-1"
            />
            <div className="flex items-center justify-between font-mono text-[9px] tabular-nums text-slate-500">
              <span>{fmtTime(elapsedTimeSec)}</span>
              <span>-{fmtTime(Math.max(0, cycleTimeSec - elapsedTimeSec))}</span>
            </div>
          </div>

          <div className="hidden h-10 w-px bg-white/10 lg:block" />

          {/* Cycle speed presets */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <FastForward className="h-3 w-3 text-slate-500" />
              <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                Cycle Speed
              </span>
            </div>
            <div className="flex items-center gap-1">
              {speedPresets.map((sp) => (
                <button
                  key={sp}
                  onClick={() => setSpeed(sp)}
                  className={cn(
                    "rounded-md border px-2 py-1 font-mono text-[11px] font-semibold tabular-nums transition-colors",
                    speed === sp
                      ? "border-cyan-400/60 bg-cyan-500/25 text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                      : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200",
                  )}
                >
                  {sp}×
                </button>
              ))}
            </div>
          </div>

          <div className="hidden h-10 w-px bg-white/10 xl:block" />

          {/* Overrides */}
          <div className="hidden items-center gap-3 xl:flex">
            <OverrideKnob
              label="Feed"
              value={feedOverride}
              onChange={setFeedOverride}
              min={0}
              max={200}
              color="#22d3ee"
            />
            <OverrideKnob
              label="Rapid"
              value={rapidOverride}
              onChange={setRapidOverride}
              min={10}
              max={100}
              color="#f59e0b"
            />
            <OverrideKnob
              label="Spindle"
              value={spindleOverride}
              onChange={setSpindleOverride}
              min={50}
              max={200}
              color="#fb7185"
            />
          </div>

          <div className="hidden h-10 w-px bg-white/10 lg:block" />

          {/* Settings/extra */}
          <div className="hidden items-center gap-1.5 lg:flex">
            <TButton
              onClick={() => setSpeed(Math.max(0.1, speed - 0.25))}
              tooltip="Slower"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </TButton>
            <span className="w-12 text-center font-mono text-xs font-semibold text-slate-300">
              {speed}×
            </span>
            <TButton
              onClick={() => setSpeed(speed + 0.25)}
              tooltip="Faster"
              size="sm"
            >
              <ChevronRight className="h-4 w-4" />
            </TButton>
            <TButton
              onClick={() => setSpeed(1)}
              tooltip="Reset speed to 1×"
              size="sm"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </TButton>
            <TButton onClick={reset} tooltip="Stop & reset" size="sm">
              <Square className="h-3.5 w-3.5" />
            </TButton>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
