"use client";

import dynamic from "next/dynamic";
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { Terminal, BookOpen, Wrench, GraduationCap, Layers, Calculator, FolderOpen } from "lucide-react";
import { useSimStore } from "@/lib/cnc/store";
import { useViewStore } from "@/lib/cnc/viewStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
        <span className="text-xs font-mono">Booting CNC controller…</span>
      </div>
    </div>
  ),
});

export default function CncLayout() {
  const resetKey = useViewStore((s) => s.resetKey);
  const isMobile = useIsMobile();
  const direction = isMobile ? "vertical" : "horizontal";

  return (
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
  );
}
