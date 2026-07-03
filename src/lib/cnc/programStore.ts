// CNC Simulator Pro — Program store (localStorage-backed)
// All functions are CLIENT-ONLY and safe: they guard against SSR
// (localStorage / window / document being undefined) and swallow errors.

import { v4 as uuidv4 } from "uuid";

export interface SavedProgram {
  id: string; // uuid v4
  name: string;
  code: string;
  workpiece: { width: number; depth: number; height: number };
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

const KEY = "cnc-sim-programs";

/** True when localStorage is usable (client-side, not blocked). */
function storageAvailable(): boolean {
  try {
    if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
      return false;
    }
    const k = "__cnc_probe__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function readAll(): SavedProgram[] {
  if (!storageAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidProgram);
  } catch {
    return [];
  }
}

function writeAll(list: SavedProgram[]): void {
  if (!storageAvailable()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* quota or privacy mode — silently ignore */
  }
}

function isValidProgram(v: unknown): v is SavedProgram {
  if (!v || typeof v !== "object") return false;
  const p = v as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    typeof p.code === "string" &&
    typeof p.createdAt === "number" &&
    typeof p.updatedAt === "number" &&
    p.workpiece != null &&
    typeof (p.workpiece as Record<string, unknown>).width === "number" &&
    typeof (p.workpiece as Record<string, unknown>).depth === "number" &&
    typeof (p.workpiece as Record<string, unknown>).height === "number"
  );
}

function normalizeWorkpiece(w: {
  width: number;
  depth: number;
  height: number;
}): { width: number; depth: number; height: number } {
  return {
    width: Number.isFinite(w.width) ? w.width : 0,
    depth: Number.isFinite(w.depth) ? w.depth : 0,
    height: Number.isFinite(w.height) ? w.height : 0,
  };
}

/** List all saved programs, sorted by updatedAt descending (most recent first). */
export function listPrograms(): SavedProgram[] {
  const list = readAll();
  return list.sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Create or update a program by name (upsert). Returns the saved program. */
export function saveProgram(p: {
  name: string;
  code: string;
  workpiece: { width: number; depth: number; height: number };
}): SavedProgram {
  const now = Date.now();
  const list = readAll();
  const name = (p.name ?? "").trim() || "Untitled Program";
  const existing = list.find((x) => x.name.toLowerCase() === name.toLowerCase());
  let saved: SavedProgram;
  if (existing) {
    saved = {
      ...existing,
      name,
      code: p.code ?? "",
      workpiece: normalizeWorkpiece(p.workpiece),
      updatedAt: now,
    };
    const idx = list.findIndex((x) => x.id === existing.id);
    if (idx >= 0) list[idx] = saved;
  } else {
    saved = {
      id: uuidv4(),
      name,
      code: p.code ?? "",
      workpiece: normalizeWorkpiece(p.workpiece),
      createdAt: now,
      updatedAt: now,
    };
    list.push(saved);
  }
  writeAll(list);
  return saved;
}

/** Delete a program by id. No-op if not found. */
export function deleteProgram(id: string): void {
  const list = readAll();
  const next = list.filter((x) => x.id !== id);
  if (next.length !== list.length) writeAll(next);
}

/** Trigger a .nc file download for a single program. */
export function exportProgram(p: SavedProgram): void {
  if (typeof document === "undefined") return;
  try {
    const blob = new Blob([p.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = sanitizeFileName(p.name) + ".nc";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    /* no-op */
  }
}

/** Trigger a JSON download containing ALL saved programs. */
export function exportAllPrograms(): void {
  if (typeof document === "undefined") return;
  try {
    const list = readAll();
    const payload = JSON.stringify(
      {
        app: "cnc-simulator-pro",
        version: 1,
        exportedAt: new Date().toISOString(),
        programs: list,
      },
      null,
      2,
    );
    const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cnc-programs-${stamp()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    /* no-op */
  }
}

/** Parse a JSON file and merge programs into the store. Returns count added. */
export async function importPrograms(file: File): Promise<number> {
  const text = await file.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("File is not valid JSON.");
  }
  // Accept either an array of programs or an object with a `programs` array.
  let arr: unknown[] = [];
  if (Array.isArray(data)) {
    arr = data;
  } else if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).programs)) {
    arr = (data as Record<string, unknown>).programs as unknown[];
  } else {
    throw new Error("JSON does not contain any programs.");
  }
  const list = readAll();
  const byName = new Map(list.map((x) => [x.name.toLowerCase(), x]));
  let added = 0;
  const now = Date.now();
  for (const item of arr) {
    if (!isValidProgram(item)) continue;
    const existing = byName.get(item.name.toLowerCase());
    if (existing) {
      // update in place, keep original id/createdAt
      const idx = list.findIndex((x) => x.id === existing.id);
      if (idx >= 0) {
        list[idx] = {
          ...existing,
          code: item.code,
          workpiece: item.workpiece,
          updatedAt: now + added,
        };
        added++;
      }
    } else {
      const fresh: SavedProgram = {
        id: uuidv4(),
        name: item.name,
        code: item.code,
        workpiece: item.workpiece,
        createdAt: item.createdAt || now,
        updatedAt: now + added,
      };
      list.push(fresh);
      byName.set(fresh.name.toLowerCase(), fresh);
      added++;
    }
  }
  if (added > 0) writeAll(list);
  return added;
}

function sanitizeFileName(name: string): string {
  return (name || "program")
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 64);
}

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}
