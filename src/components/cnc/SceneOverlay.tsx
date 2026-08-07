"use client";

import {
  Route,
  Grid3x3,
  Box,
  RefreshCw,
  Maximize2,
  Camera,
  ScanEye,
  ArrowDownUp,
  ArrowUpDown,
  Wrench,
  Cpu,
  Layers,
  RotateCw,
} from "lucide-react";
import { useViewStore, type CameraPreset } from "@/lib/cnc/viewStore";
import { useSimStore } from "@/lib/cnc/store";
import { MACHINE_CATALOG, type MachineType } from "@/lib/cnc/machines";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function ToggleBtn({
  active,
  onClick,
  tooltip,
  children,
}: {
  active: boolean;
  onClick: () => void;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
            active
              ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-200"
              : "border-white/10 bg-black/60 text-slate-400 hover:bg-white/10 hover:text-slate-200",
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

const PRESETS: { id: CameraPreset; icon: React.ElementType; label: string }[] = [
  { id: "iso", icon: ScanEye, label: "Isometric View" },
  { id: "top", icon: ArrowDownUp, label: "Top View (XY)" },
  { id: "bottom", icon: ArrowUpDown, label: "Bottom View (Underside Inspection)" },
  { id: "front", icon: Box, label: "Front View (XZ)" },
  { id: "right", icon: Maximize2, label: "Right View (YZ)" },
];

export default function SceneOverlay() {
  const showToolpath = useViewStore((s) => s.showToolpath);
  const showGrid = useViewStore((s) => s.showGrid);
  const showEnclosure = useViewStore((s) => s.showEnclosure);
  const toggle = useViewStore((s) => s.toggle);
  const setCameraPreset = useViewStore((s) => s.setCameraPreset);
  const programName = useSimStore((s) => s.programName);
  const tool = useSimStore((s) => s.tool);
  const machineId = useSimStore((s) => s.machineId);

  return (
    <TooltipProvider delayDuration={200}>
      {/* top-left: machine type selector + program badge + active tool */}
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col gap-1.5">
        {/* Machine Type Selector */}
        <div className="pointer-events-auto flex items-center gap-2 rounded-md border border-cyan-500/30 bg-black/70 px-2.5 py-1.5 backdrop-blur shadow-lg">
          <Cpu className="h-4 w-4 text-cyan-400" />
          <select
            value={machineId}
            onChange={(e) => useSimStore.getState().setMachineId(e.target.value as MachineType)}
            className="bg-transparent font-mono text-xs font-bold text-slate-100 outline-none cursor-pointer"
          >
            {MACHINE_CATALOG.map((m) => (
              <option key={m.id} value={m.id} className="bg-[#12161f] text-slate-200">
                {m.shortName} ({m.category})
              </option>
            ))}
          </select>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 rounded-md border border-white/10 bg-black/60 px-2.5 py-1.5 backdrop-blur">
          <Camera className="h-3.5 w-3.5 text-cyan-400" />
          <span className="max-w-[180px] truncate text-xs font-semibold text-slate-100">
            {programName}
          </span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2 rounded-md border border-white/10 bg-black/60 px-2.5 py-1.5 backdrop-blur">
          <Wrench className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-[10px] font-mono text-slate-300">
            T{tool || 0} Active Tool
          </span>
        </div>
      </div>

      {/* top-right: view toggles + camera presets */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
        <div className="flex flex-col gap-1.5">
          <ToggleBtn
            active={showToolpath}
            onClick={() => toggle("showToolpath")}
            tooltip="Toggle 3D Toolpath"
          >
            <Route className="h-4 w-4" />
          </ToggleBtn>
          <ToggleBtn
            active={showGrid}
            onClick={() => toggle("showGrid")}
            tooltip="Toggle Grid & Scale"
          >
            <Grid3x3 className="h-4 w-4" />
          </ToggleBtn>
          <ToggleBtn
            active={showEnclosure}
            onClick={() => toggle("showEnclosure")}
            tooltip="Toggle Enclosure (Open View for Bottom/Sides)"
          >
            <Box className="h-4 w-4" />
          </ToggleBtn>
        </div>
        <div className="my-1 h-px w-full bg-white/10" />
        <div className="flex flex-col gap-1.5">
          {PRESETS.map((p) => (
            <ToggleBtn
              key={p.id}
              active={false}
              onClick={() => setCameraPreset(p.id)}
              tooltip={p.label}
            >
              <p.icon className="h-4 w-4" />
            </ToggleBtn>
          ))}
          <ToggleBtn
            active={false}
            onClick={() => setCameraPreset("reset")}
            tooltip="Reset Camera Orbit"
          >
            <RefreshCw className="h-4 w-4" />
          </ToggleBtn>
        </div>
      </div>

      {/* bottom-left: axis legend */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-center gap-3 rounded-md border border-white/10 bg-black/60 px-2.5 py-1.5 font-mono text-[10px] backdrop-blur">
        <span className="text-emerald-400 font-bold">■ X</span>
        <span className="text-cyan-400 font-bold">■ Y</span>
        <span className="text-green-400 font-bold">■ Z</span>
        <span className="ml-2 text-slate-400">
          <Maximize2 className="inline h-3 w-3" /> drag 360° · scroll zoom
        </span>
      </div>
    </TooltipProvider>
  );
}
