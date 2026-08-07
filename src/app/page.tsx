"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { Cpu, GitBranch, BookOpen, Terminal, GraduationCap, Wrench } from "lucide-react";
import { useSimStore } from "@/lib/cnc/store";
import { CNC_EXAMPLES } from "@/lib/cnc/examples";
import { Badge } from "@/components/ui/badge";

const CncLayout = dynamic(() => import("@/components/cnc/CncLayout"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#0b0d10] text-slate-500">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
        <span className="text-xs font-mono">Booting CNC Simulator Pro…</span>
      </div>
    </div>
  ),
});

export default function Home() {
  const loadExample = useSimStore((s) => s.loadExample);

  // initial parse of default example
  useEffect(() => {
    loadExample(CNC_EXAMPLES[0].id);
  }, [loadExample]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0b0d10] text-slate-100">
      {/* Header */}
      <header className="z-20 flex shrink-0 items-center gap-3 border-b border-white/10 bg-gradient-to-r from-[#15181d] to-[#0d0f13] px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500 to-orange-500 shadow-[0_0_14px_rgba(34,211,238,0.4)]">
            <Cpu className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <h1 className="flex items-center gap-2 text-sm font-bold tracking-tight text-white">
              CNC SIMULATOR <span className="text-cyan-400">PRO</span>
            </h1>
            <span className="text-[10px] text-slate-500">
              3-Axis Milling · G-code · Real-time Machining
            </span>
          </div>
        </div>

        <div className="ml-3 hidden items-center gap-1.5 md:flex">
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-300"
          >
            <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            ONLINE
          </Badge>
          <Badge
            variant="outline"
            className="border-white/10 bg-white/5 text-[10px] text-slate-400"
          >
            v2.4.0
          </Badge>
        </div>

        <div className="ml-auto hidden items-center gap-3 text-[10px] text-slate-500 lg:flex">
          <span className="flex items-center gap-1">
            <Terminal className="h-3 w-3" /> Fanuc-style
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" /> {CNC_EXAMPLES.length} samples
          </span>
          <span className="flex items-center gap-1">
            <Wrench className="h-3 w-3" /> 8 tools
          </span>
          <span className="flex items-center gap-1">
            <GraduationCap className="h-3 w-3" /> Learn mode
          </span>
        </div>
        <a
          href="https://github.com/rudra496/cnc"
          target="_blank"
          rel="noreferrer"
          className="ml-auto flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200 lg:ml-2"
        >
          <GitBranch className="h-3 w-3" /> Source Code
        </a>
      </header>

      {/* Main resizable layout */}
      <CncLayout />

      {/* Footer */}
      <footer className="flex shrink-0 items-center justify-between border-t border-white/10 bg-[#0d0f13] px-4 py-1 text-[10px] text-slate-600">
        <span>
          CNC Simulator Pro — drag the 3D view to orbit ·{" "}
          <kbd className="rounded border border-white/10 bg-white/5 px-1 font-mono text-slate-400">
            Space
          </kbd>{" "}
          play ·{" "}
          <kbd className="rounded border border-white/10 bg-white/5 px-1 font-mono text-slate-400">
            ← →
          </kbd>{" "}
          step
        </span>
        <span className="hidden sm:inline">
          Powered by Next.js · react-three-fiber · Custom G-code interpreter
        </span>
      </footer>
    </div>
  );
}

