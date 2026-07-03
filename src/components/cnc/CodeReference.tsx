"use client";

import { useMemo, useState } from "react";
import { Search, BookOpen, Lightbulb, Terminal } from "lucide-react";
import { CODE_REFERENCE, ALL_CODES, type CodeEntry } from "@/lib/cnc/reference";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CATEGORY_COLOR: Record<string, string> = {
  G: "#22d3ee",
  M: "#f59e0b",
  T: "#a78bfa",
  F: "#facc15",
  S: "#fb7185",
  Z: "#4ade80",
  Other: "#94a3b8",
};

export default function CodeReference() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string | "All">("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_CODES.filter((e) => {
      if (activeCat !== "All") {
        // match by group category label
      }
      if (!q) return true;
      return (
        e.code.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.group ?? "").toLowerCase().includes(q)
      );
    });
  }, [query, activeCat]);

  const grouped = useMemo(() => {
    const map = new Map<string, CodeEntry[]>();
    for (const e of filtered) {
      const arr = map.get(e.code[0]) ?? [];
      arr.push(e);
      map.set(e.code[0], arr);
    }
    return map;
  }, [filtered]);

  const categories = ["All", "G", "M", "T", "F", "S", "Z", "Other"];

  return (
    <div className="flex h-full flex-col bg-[#0b0d10]">
      {/* header */}
      <div className="border-b border-white/10 p-3">
        <div className="mb-2 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-100">
            CNC Code Reference
          </h3>
          <Badge variant="secondary" className="ml-auto bg-white/5 text-slate-300">
            {ALL_CODES.length} codes
          </Badge>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search codes, e.g. G02, drill, coolant…"
            className="h-8 border-white/10 bg-black/40 pl-8 text-xs text-slate-200 placeholder:text-slate-600"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={cn(
                "rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                activeCat === c
                  ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-200"
                  : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10",
              )}
              style={activeCat === c && c !== "All" ? { color: CATEGORY_COLOR[c] } : undefined}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* list */}
      <div className="flex-1 overflow-y-auto p-3 [scrollbar-width:thin]">
        {activeCat !== "All" && (
          <GroupBlock
            cat={activeCat}
            entries={grouped.get(activeCat) ?? []}
          />
        )}
        {activeCat === "All" &&
          [...grouped.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([cat, entries]) => (
              <GroupBlock key={cat} cat={cat} entries={entries} />
            ))}
        {filtered.length === 0 && (
          <div className="mt-8 text-center text-xs text-slate-500">
            No codes match “{query}”.
          </div>
        )}
      </div>

      {/* footer hint */}
      <div className="border-t border-white/10 p-2.5 text-[10px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <Terminal className="h-3 w-3" />
          <span>
            Click a line in the editor to jump the simulation to that block.
          </span>
        </div>
      </div>
    </div>
  );
}

function GroupBlock({ cat, entries }: { cat: string; entries: CodeEntry[] }) {
  if (entries.length === 0) return null;
  const color = CATEGORY_COLOR[cat] ?? "#94a3b8";
  const groupMeta = CODE_REFERENCE.find((g) => g.category === cat);
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold"
          style={{ background: `${color}22`, color }}
        >
          {cat}
        </span>
        <h4 className="text-xs font-semibold text-slate-200">
          {groupMeta?.title ?? `${cat}-Codes`}
        </h4>
      </div>
      {groupMeta?.blurb && (
        <p className="mb-2 text-[10px] leading-relaxed text-slate-500">
          {groupMeta.blurb}
        </p>
      )}
      <div className="space-y-2">
        {entries.map((e) => (
          <div
            key={e.code + e.name}
            className="rounded-md border border-white/8 bg-white/[0.03] p-2.5 transition-colors hover:border-white/15 hover:bg-white/[0.06]"
          >
            <div className="flex items-center gap-2">
              <code
                className="rounded px-1.5 py-0.5 font-mono text-[11px] font-bold"
                style={{ background: `${color}22`, color }}
              >
                {e.code}
              </code>
              <span className="text-xs font-medium text-slate-200">
                {e.name}
              </span>
              {e.group && (
                <Badge
                  variant="outline"
                  className="ml-auto border-white/10 text-[9px] text-slate-400"
                >
                  {e.group}
                </Badge>
              )}
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
              {e.description}
            </p>
            {e.example && (
              <pre className="mt-1.5 overflow-x-auto rounded bg-black/50 px-2 py-1 font-mono text-[10px] text-emerald-300">
                {e.example}
              </pre>
            )}
            {e.tip && (
              <div className="mt-1.5 flex items-start gap-1.5 text-[10px] text-amber-300/80">
                <Lightbulb className="mt-0.5 h-3 w-3 shrink-0" />
                <span>{e.tip}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
