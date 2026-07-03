"use client";

// CNC Simulator Pro — Program Manager
// localStorage-backed program library + code-snippet inserter.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Save,
  Download,
  Upload,
  Trash2,
  FilePlus,
  FolderOpen,
  FileCode,
  Plus,
} from "lucide-react";

import { useSimStore } from "@/lib/cnc/store";
import { useToast } from "@/hooks/use-toast";
import {
  listPrograms,
  saveProgram,
  deleteProgram,
  exportProgram,
  exportAllPrograms,
  importPrograms,
  type SavedProgram,
} from "@/lib/cnc/programStore";
import { CODE_SNIPPETS, type Snippet } from "@/lib/cnc/snippets";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SNIPPET_CATEGORIES = ["All", "Header", "Pocket", "Drill", "Profile", "Finish", "Surfacing", "Utility"];

function formatDate(ms: number): string {
  try {
    const d = new Date(ms);
    return d.toLocaleString(undefined, {
      year: "2-digit",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function ProgramManager() {
  const { toast } = useToast();

  // Editor / workpiece state from sim store
  const source = useSimStore((s) => s.source);
  const workpiece = useSimStore((s) => s.workpiece);
  const programName = useSimStore((s) => s.programName);

  const [programs, setPrograms] = useState<SavedProgram[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [snippetCategory, setSnippetCategory] = useState<string>("All");
  const [deleteTarget, setDeleteTarget] = useState<SavedProgram | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(() => {
    setPrograms(listPrograms());
  }, []);

  // Hydration guard — localStorage data must only render after mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    refresh();
  }, [refresh]);

  // Pre-fill name input with the current program name (only when empty)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!nameInput && programName) setNameInput(programName);
  }, [programName]);

  const handleSave = useCallback(() => {
    const name = (nameInput || "").trim() || programName || "Untitled Program";
    const saved = saveProgram({
      name,
      code: source,
      workpiece: {
        width: workpiece.width,
        depth: workpiece.depth,
        height: workpiece.height,
      },
    });
    setNameInput(saved.name);
    refresh();
    toast({
      title: "Program saved",
      description: `"${saved.name}" stored locally (${saved.code.length} chars).`,
    });
  }, [nameInput, programName, source, workpiece, refresh, toast]);

  const handleLoad = useCallback(
    (p: SavedProgram) => {
      // Load code into the editor + apply the saved workpiece
      useSimStore.getState().setSource(p.code);
      useSimStore.getState().setWorkpiece({
        width: p.workpiece.width,
        depth: p.workpiece.depth,
        height: p.workpiece.height,
      });
      setNameInput(p.name);
      toast({
        title: "Program loaded",
        description: `"${p.name}" loaded into the editor.`,
      });
    },
    [toast],
  );

  const handleDownload = useCallback(
    (p: SavedProgram) => {
      exportProgram(p);
      toast({
        title: "Download started",
        description: `${p.name}.nc`,
      });
    },
    [toast],
  );

  const handleExportAll = useCallback(() => {
    if (programs.length === 0) {
      toast({
        title: "Nothing to export",
        description: "Your program library is empty.",
      });
      return;
    }
    exportAllPrograms();
    toast({
      title: "Exporting library",
      description: `${programs.length} program${programs.length === 1 ? "" : "s"} → JSON.`,
    });
  }, [programs, toast]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = ""; // allow re-importing the same file later
      if (!file) return;
      try {
        const count = await importPrograms(file);
        refresh();
        toast({
          title: "Import complete",
          description:
            count > 0
              ? `${count} program${count === 1 ? "" : "s"} imported.`
              : "No valid programs found in file.",
        });
      } catch (err) {
        toast({
          title: "Import failed",
          description: err instanceof Error ? err.message : "Could not read file.",
        });
      }
    },
    [refresh, toast],
  );

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    const t = deleteTarget;
    deleteProgram(t.id);
    setDeleteTarget(null);
    refresh();
    toast({
      title: "Program deleted",
      description: `"${t.name}" removed from your library.`,
    });
  }, [deleteTarget, refresh, toast]);

  const handleInsertSnippet = useCallback(
    (s: Snippet) => {
      const cur = useSimStore.getState().source;
      const sep = cur.endsWith("\n") || cur.length === 0 ? "" : "\n";
      useSimStore.getState().setSource(cur + sep + "\n" + s.code);
      toast({
        title: "Snippet inserted",
        description: `"${s.name}" appended to the editor.`,
      });
    },
    [toast],
  );

  const visibleSnippets = useMemo(
    () =>
      snippetCategory === "All"
        ? CODE_SNIPPETS
        : CODE_SNIPPETS.filter((s) => s.category === snippetCategory),
    [snippetCategory],
  );

  return (
    <div className="flex h-full flex-col bg-[#0b0d10] text-slate-200">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <FolderOpen className="size-4 text-cyan-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Program Library
        </h3>
        <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
          {mounted ? `${programs.length} saved` : "—"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 cnc-scroll">
        {/* Save Current */}
        <section className="rounded-lg border border-white/10 bg-black/30 p-3">
          <div className="mb-2 flex items-center gap-2">
            <FilePlus className="size-3.5 text-cyan-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
              Save Current
            </span>
          </div>
          <div className="flex gap-2">
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Program name…"
              className="h-8 flex-1 border-white/10 bg-black/50 text-xs text-slate-100 placeholder:text-slate-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
            <Button
              size="sm"
              onClick={handleSave}
              className="h-8 bg-cyan-500 text-black hover:bg-cyan-400"
            >
              <Save className="size-3.5" />
              Save
            </Button>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-500">
            Stores the editor content + current workpiece (
            {workpiece.width}×{workpiece.depth}×{workpiece.height} mm) under the
            given name. Saving an existing name updates it in place.
          </p>
        </section>

        {/* Library list */}
        <section className="rounded-lg border border-white/10 bg-black/30 p-3">
          <div className="mb-2 flex items-center gap-2">
            <FileCode className="size-3.5 text-orange-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
              Saved Programs
            </span>
          </div>

          {mounted && programs.length === 0 ? (
            <div className="rounded-md border border-dashed border-white/10 bg-black/20 px-3 py-6 text-center">
              <FileCode className="mx-auto mb-2 size-5 text-slate-600" />
              <p className="text-[11px] text-slate-500">
                No saved programs yet.
                <br />
                Save your current program above to start a library.
              </p>
            </div>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto pr-1 cnc-scroll">
              {(mounted ? programs : []).map((p) => (
                <li
                  key={p.id}
                  className="group rounded-md border border-white/10 bg-white/[0.02] p-2 transition-colors hover:border-cyan-500/40 hover:bg-white/[0.04]"
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-slate-100">
                        {p.name}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500">
                        <span>
                          {p.workpiece.width}×{p.workpiece.depth}×{p.workpiece.height} mm
                        </span>
                        <span className="text-slate-700">•</span>
                        <span>{p.code.length} chars</span>
                        <span className="text-slate-700">•</span>
                        <span title={new Date(p.updatedAt).toISOString()}>
                          {formatDate(p.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleLoad(p)}
                      className="h-6 px-2 text-[10px] text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200"
                    >
                      <FolderOpen className="size-3" />
                      Load
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(p)}
                      className="h-6 px-2 text-[10px] text-slate-300 hover:bg-white/10"
                    >
                      <Download className="size-3" />
                      .nc
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget(p)}
                      className="h-6 px-2 text-[10px] text-orange-300 hover:bg-orange-500/10 hover:text-orange-200"
                    >
                      <Trash2 className="size-3" />
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Export / Import */}
          <div className="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportAll}
              className="h-7 border-white/10 bg-transparent text-[10px] text-slate-300 hover:bg-white/10"
            >
              <Download className="size-3" />
              Export All (JSON)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleImportClick}
              className="h-7 border-white/10 bg-transparent text-[10px] text-slate-300 hover:bg-white/10"
            >
              <Upload className="size-3" />
              Import (JSON)
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>
        </section>

        {/* Snippets */}
        <section className="rounded-lg border border-white/10 bg-black/30 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Plus className="size-3.5 text-cyan-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">
              Insert Snippet
            </span>
          </div>
          <Select value={snippetCategory} onValueChange={setSnippetCategory}>
            <SelectTrigger className="mb-2 h-8 w-full border-white/10 bg-black/50 text-xs text-slate-200">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="max-h-72 border-white/10 bg-[#15181d] text-slate-200">
              {SNIPPET_CATEGORIES.map((c) => (
                <SelectItem
                  key={c}
                  value={c}
                  className="text-xs focus:bg-white/10"
                >
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ul className="space-y-1.5">
            {visibleSnippets.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => handleInsertSnippet(s)}
                  className="w-full rounded-md border border-white/10 bg-white/[0.02] px-2.5 py-2 text-left transition-colors hover:border-cyan-500/40 hover:bg-cyan-500/[0.06]"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-cyan-300">
                      {s.category}
                    </span>
                    <span className="truncate text-xs font-medium text-slate-100">
                      {s.name}
                    </span>
                    <Plus className="ml-auto size-3 shrink-0 text-slate-500 group-hover:text-cyan-300" />
                  </div>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-slate-500">
                    {s.description}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent className="border-white/10 bg-[#15181d] text-slate-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">
              Delete program?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This permanently removes{" "}
              <span className="font-medium text-orange-300">
                "{deleteTarget?.name}"
              </span>{" "}
              from your local library. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-slate-300 hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-orange-500 text-black hover:bg-orange-400"
            >
              <Trash2 className="size-3.5" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
