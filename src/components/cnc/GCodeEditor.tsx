"use client";

import { useMemo, useRef, useCallback, type CSSProperties } from "react";
import { useSimStore } from "@/lib/cnc/store";

// ---------- tokenizer ----------
type Tok = { t: string; c: string };

const COLORS: Record<string, string> = {
  G: "#22d3ee",
  M: "#f59e0b",
  T: "#a78bfa",
  F: "#facc15",
  S: "#fb7185",
  X: "#34d399",
  Y: "#34d399",
  Z: "#4ade80",
  I: "#60a5fa",
  J: "#60a5fa",
  K: "#60a5fa",
  R: "#c084fc",
  N: "#64748b",
  num: "#e2e8f0",
  comment: "#6b7280",
  punct: "#94a3b8",
  default: "#cbd5e1",
};

function tokenizeLine(line: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  const n = line.length;
  // leading N-number or slash
  // We'll just scan char by char.
  while (i < n) {
    const ch = line[i];
    if (ch === " " || ch === "\t") {
      let j = i;
      while (j < n && (line[j] === " " || line[j] === "\t")) j++;
      toks.push({ t: line.slice(i, j), c: "default" });
      i = j;
      continue;
    }
    if (ch === ";") {
      toks.push({ t: line.slice(i), c: "comment" });
      i = n;
      continue;
    }
    if (ch === "(") {
      const end = line.indexOf(")", i);
      const stop = end === -1 ? n : end + 1;
      toks.push({ t: line.slice(i, stop), c: "comment" });
      i = stop;
      continue;
    }
    if (/[A-Za-z]/.test(ch)) {
      const letter = ch.toUpperCase();
      let j = i + 1;
      // optional sign + digits/decimals
      while (j < n && /[-+0-9.]/.test(line[j])) j++;
      const word = line.slice(i, j);
      toks.push({ t: word, c: COLORS[letter] ?? "default" });
      i = j;
      continue;
    }
    // other punctuation
    toks.push({ t: ch, c: "punct" });
    i++;
  }
  return toks;
}

const FONT: CSSProperties = {
  fontFamily:
    "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 13,
  lineHeight: "20px",
  letterSpacing: 0,
  tabSize: 2,
  whiteSpace: "pre",
  wordBreak: "keep-all",
  margin: 0,
};

export default function GCodeEditor() {
  const source = useSimStore((s) => s.source);
  const setSource = useSimStore((s) => s.setSource);
  const currentLine = useSimStore((s) => s.currentLine);
  const parseResult = useSimStore((s) => s.parseResult);
  const jumpToMove = useSimStore((s) => s.jumpToMove);

  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const lines = useMemo(() => source.split("\n"), [source]);

  // map line number -> first move index (for click-to-seek)
  const lineToMove = useMemo(() => {
    const m = new Map<number, number>();
    if (parseResult) {
      for (const mv of parseResult.moves) {
        if (!m.has(mv.line)) m.set(mv.line, mv.index);
      }
    }
    return m;
  }, [parseResult]);

  const handleScroll = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    if (preRef.current) {
      preRef.current.scrollTop = ta.scrollTop;
      preRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = ta.scrollTop;
    }
  }, []);

  const onLineClick = useCallback(
    (lineNo: number) => {
      const mv = lineToMove.get(lineNo);
      if (mv !== undefined) jumpToMove(mv);
    },
    [lineToMove, jumpToMove],
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0b0d10]">
      <div className="flex h-full">
        {/* gutter */}
        <div
          ref={gutterRef}
          className="select-none overflow-hidden py-3 pl-3 pr-2 text-right"
          style={{ ...FONT, color: "#475569", minWidth: 52 }}
          aria-hidden
        >
          {lines.map((_, i) => (
            <div key={i} style={{ height: 20 }}>
              {i + 1}
            </div>
          ))}
        </div>

        {/* code area */}
        <div className="relative flex-1 overflow-hidden">
          {/* highlight layer */}
          <pre
            ref={preRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-auto py-3 pl-2 pr-6"
            style={FONT}
          >
            {lines.map((ln, i) => {
              const lineNo = i + 1;
              const active = lineNo === currentLine;
              const toks = tokenizeLine(ln || " ");
              return (
                <div
                  key={i}
                  data-line={lineNo}
                  style={{
                    height: 20,
                    background: active
                      ? "rgba(34,211,238,0.16)"
                      : undefined,
                    boxShadow: active
                      ? "inset 2px 0 0 #22d3ee"
                      : undefined,
                    borderRadius: 0,
                  }}
                >
                  {toks.map((tk, k) => (
                    <span key={k} style={{ color: COLORS[tk.c] ?? "#cbd5e1" }}>
                      {tk.t}
                    </span>
                  ))}
                  {ln === "" ? "\u200b" : null}
                </div>
              );
            })}
          </pre>

          {/* textarea (transparent text, visible caret) */}
          <textarea
            ref={taRef}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            onScroll={handleScroll}
            onClick={(e) => {
              const ta = e.currentTarget;
              const upto = source.slice(0, ta.selectionStart);
              const lineNo = upto.split("\n").length;
              onLineClick(lineNo);
            }}
            spellCheck={false}
            wrap="off"
            className="absolute inset-0 overflow-auto bg-transparent py-3 pl-2 pr-6 text-transparent caret-cyan-300 outline-none"
            style={FONT}
            placeholder="; Enter your G-code here…"
          />
        </div>
      </div>
    </div>
  );
}
