"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { Cpu, Github, BookOpen, Terminal, GraduationCap, Wrench, Layers, Calculator, FolderOpen } from "lucide-react";
import { useSimStore } from "@/lib/cnc/store";
import { useViewStore } from "@/lib/cnc/viewStore";
import { CNC_EXAMPLES } from "@/lib/cnc/examples";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import ControlBar from "@/components/cnc/ControlBar";
import ProgramPanel from "@/components/cnc/ProgramPanel";
import CodeReference from "@/components/cnc/CodeReference";
import GuidePanel from "@/components/cnc/GuidePanel";
import ToolManager from "@/components/cnc/ToolManager";
import MaterialPanel from "@/components/cnc/MaterialPanel";
import FeedsCalculator from "@/components/cnc/FeedsCalculator";
import ProgramManager from "@/components/cnc/ProgramManager";
import SceneOverlay from "@/components/cnc/SceneOverlay";

const CncScene = dynamic(() => import("@/components/cnc/CncScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#0b0d10] text-slate-500">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
        <span className="text-xs">Booting CNC controller…</span>
      </div>
    </div>
  ),
});

export default function Home() {
  const loadExample = useSimStore((s) => s.loadExample);
  const resetKey = useViewStore((s) => s.resetKey);
  const isMobile = useIsMobile();
  const direction = isMobile ? "vertical" : "horizontal";

  // initial parse of the default example
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
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="ml-auto flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200 lg:ml-2"
        >
          <Github className="h-3 w-3" /> Docs
        </a>
      </header>

      {/* Main split */}
      <div className="min-h-0 flex-1 flex flex-row overflow-hidden">
        {/* Left Sidebar Control bar */}
        <div className="w-64 shrink-0 border-r border-white/10 bg-gradient-to-b from-[#15181d] to-[#0d0f13] overflow-y-auto [scrollbar-width:thin]">
          <ControlBar />
        </div>

        <PanelGroup direction={direction} key={direction} autoSaveId="cnc-main">
          {/* 3D viewport */}
          <Panel
            defaultSize={isMobile ? 50 : 55}
            minSize={isMobile ? 25 : 40}
            maxSize={isMobile ? 75 : 80}
          >
            <div className="relative h-full w-full bg-[#0b0d10]">
              <CncScene key={resetKey} />
              <SceneOverlay />
            </div>
          </Panel>

          <PanelResizeHandle
            className={
              isMobile
                ? "h-1.5 bg-white/5 transition-colors hover:bg-cyan-500/40"
                : "w-1.5 bg-white/5 transition-colors hover:bg-cyan-500/40"
            }
          />

          {/* Right panel: tabs */}
          <Panel
            defaultSize={isMobile ? 50 : 45}
            minSize={isMobile ? 25 : 30}
            maxSize={isMobile ? 75 : 60}
          >
            <Tabs defaultValue="program" className="flex h-full flex-col">
              <div className="flex flex-wrap items-center gap-1 border-b border-white/10 bg-[#0d0f13] px-2 py-1.5">
                <TabsList className="h-auto flex-wrap bg-transparent p-0 gap-1">
                  <TabsTrigger
                    value="program"
                    className="h-7 rounded-md px-2.5 text-[11px] text-slate-300 hover:bg-white/5 hover:text-slate-100 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                  >
                    <Terminal className="mr-1 h-3 w-3 text-cyan-400" /> Program
                  </TabsTrigger>
                  <TabsTrigger
                    value="library"
                    className="h-7 rounded-md px-2.5 text-[11px] text-slate-300 hover:bg-white/5 hover:text-slate-100 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                  >
                    <FolderOpen className="mr-1 h-3 w-3 text-amber-400" /> Library
                  </TabsTrigger>
                  <TabsTrigger
                    value="tools"
                    className="h-7 rounded-md px-2.5 text-[11px] text-slate-300 hover:bg-white/5 hover:text-slate-100 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                  >
                    <Wrench className="mr-1 h-3 w-3 text-purple-400" /> Tools
                  </TabsTrigger>
                  <TabsTrigger
                    value="materials"
                    className="h-7 rounded-md px-2.5 text-[11px] text-slate-300 hover:bg-white/5 hover:text-slate-100 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                  >
                    <Layers className="mr-1 h-3 w-3 text-emerald-400" /> Material
                  </TabsTrigger>
                  <TabsTrigger
                    value="feeds"
                    className="h-7 rounded-md px-2.5 text-[11px] text-slate-300 hover:bg-white/5 hover:text-slate-100 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                  >
                    <Calculator className="mr-1 h-3 w-3 text-pink-400" /> Feeds
                  </TabsTrigger>
                  <TabsTrigger
                    value="reference"
                    className="h-7 rounded-md px-2.5 text-[11px] text-slate-300 hover:bg-white/5 hover:text-slate-100 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                  >
                    <BookOpen className="mr-1 h-3 w-3 text-blue-400" /> Reference
                  </TabsTrigger>
                  <TabsTrigger
                    value="guide"
                    className="h-7 rounded-md px-2.5 text-[11px] text-slate-300 hover:bg-white/5 hover:text-slate-100 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                  >
                    <GraduationCap className="mr-1 h-3 w-3 text-rose-400" /> Guide
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="program" className="min-h-0 flex-1 data-[state=inactive]:hidden">
                <ProgramPanel />
              </TabsContent>
              <TabsContent value="library" className="min-h-0 flex-1 data-[state=inactive]:hidden">
                <ProgramManager />
              </TabsContent>
              <TabsContent value="tools" className="min-h-0 flex-1 data-[state=inactive]:hidden">
                <ToolManager />
              </TabsContent>
              <TabsContent value="materials" className="min-h-0 flex-1 data-[state=inactive]:hidden">
                <MaterialPanel />
              </TabsContent>
              <TabsContent value="feeds" className="min-h-0 flex-1 data-[state=inactive]:hidden">
                <FeedsCalculator />
              </TabsContent>
              <TabsContent value="reference" className="min-h-0 flex-1 data-[state=inactive]:hidden">
                <CodeReference />
              </TabsContent>
              <TabsContent value="guide" className="min-h-0 flex-1 data-[state=inactive]:hidden">
                <GuidePanel />
              </TabsContent>
            </Tabs>
          </Panel>
        </PanelGroup>
      </div>

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
