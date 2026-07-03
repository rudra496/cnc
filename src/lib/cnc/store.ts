// CNC Simulator Pro — simulation store (Zustand)
// Owns the parsed program + playback state + telemetry.

"use client";

import { create } from "zustand";
import { parseGCode, sampleMove, estimateCycleTime } from "./parser";
import type { Move, ParseResult, Vec3 } from "./types";
import { CNC_EXAMPLES, type CncExample } from "./examples";

const RAPID_FEED = 8000; // mm/min used for time estimation of rapids

function moveTimeSec(m: Move): number {
  if (m.type === "dwell") return m.dwell ?? 0;
  if (m.length <= 0) return 0;
  const feed = m.type === "rapid" ? RAPID_FEED : m.feed > 0 ? m.feed : 100;
  return (m.length / feed) * 60;
}

interface Cumulative {
  times: number[]; // time per move
  cum: number[]; // cumulative start time of each move
  total: number;
}

function buildCumulative(moves: Move[]): Cumulative {
  const times = moves.map(moveTimeSec);
  const cum: number[] = [];
  let acc = 0;
  for (const t of times) {
    cum.push(acc);
    acc += t;
  }
  return { times, cum, total: acc };
}

export interface Workpiece {
  width: number; // X mm
  depth: number; // Y mm
  height: number; // Z mm
}

export type MachineMode = "run" | "dry_run" | "machine_lock";

export interface SimState {
  // program
  exampleId: string | null;
  source: string;
  programName: string;
  parseResult: ParseResult | null;
  workpiece: Workpiece;
  materialId: string;

  // playback
  playing: boolean;
  speed: number; // master cycle-speed multiplier
  feedOverride: number; // %  (50..200) — scales cutting move timing
  rapidOverride: number; // %  (10..100) — scales rapid move timing
  spindleOverride: number; // % (50..200) — scales displayed RPM
  singleBlock: boolean; // pause after each block when stepping/playing
  optionalStop: boolean; // honor M01
  blockSkip: boolean; // skip blocks starting with /
  machineMode: MachineMode; // run / dry_run / machine_lock
  currentMoveIndex: number;
  currentT: number; // 0..1 within current move
  cumulative: Cumulative;
  cycleTimeSec: number;
  elapsedTimeSec: number;

  // telemetry
  position: Vec3;
  spindleRpm: number;
  spindleOn: boolean;
  spindleDir: 1 | -1;
  feed: number;
  tool: number;
  coolant: "off" | "flood" | "mist";
  isCutting: boolean;
  currentLine: number;

  // errors
  parseErrors: { line: number; message: string }[];
  parseWarnings: { line: number; message: string }[];

  // actions
  loadExample: (id: string) => void;
  setSource: (code: string, opts?: { keepPlay?: boolean }) => void;
  setWorkpiece: (w: Partial<Workpiece>) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  jumpToMove: (index: number) => void;
  seek: (progress: number) => void;
  setSpeed: (s: number) => void;
  setFeedOverride: (v: number) => void;
  setRapidOverride: (v: number) => void;
  setSpindleOverride: (v: number) => void;
  toggleSingleBlock: () => void;
  toggleOptionalStop: () => void;
  toggleBlockSkip: () => void;
  setMachineMode: (m: MachineMode) => void;
  setMaterial: (id: string) => void;
  tick: (dt: number) => void;
}

function telemetryAt(moves: Move[], index: number, t: number) {
  if (moves.length === 0) {
    return {
      position: { x: 0, y: 0, z: 0 } as Vec3,
      spindleRpm: 0,
      spindleOn: false,
      spindleDir: 1 as 1 | -1,
      feed: 0,
      tool: 0,
      coolant: "off" as const,
      isCutting: false,
      currentLine: 0,
    };
  }
  const idx = Math.min(Math.max(index, 0), moves.length - 1);
  const m = moves[idx];
  const pos = sampleMove(m, t);
  const isCutting =
    m.type !== "rapid" && m.type !== "dwell" && pos.z < -0.01;
  return {
    position: pos,
    spindleRpm: m.spindle,
    spindleOn: m.spindleOn,
    spindleDir: m.spindleDir,
    feed: m.feed,
    tool: m.tool,
    coolant: m.coolant,
    isCutting,
    currentLine: m.line,
  };
}

function applyProgram(state: SimState, source: string, workpiece: Workpiece): Partial<SimState> {
  const parseResult = parseGCode(source);
  const cumulative = buildCumulative(parseResult.moves);
  const cycleTimeSec = cumulative.total;
  const tel = telemetryAt(parseResult.moves, 0, 0);
  return {
    source,
    parseResult,
    cumulative,
    cycleTimeSec,
    currentMoveIndex: 0,
    currentT: 0,
    elapsedTimeSec: 0,
    ...tel,
    parseErrors: parseResult.errors,
    parseWarnings: parseResult.warnings,
    workpiece,
  } as Partial<SimState>;
}

export const useSimStore = create<SimState>((set, get) => ({
  exampleId: CNC_EXAMPLES[0].id,
  source: CNC_EXAMPLES[0].code,
  programName: CNC_EXAMPLES[0].name,
  parseResult: null,
  workpiece: {
    width: CNC_EXAMPLES[0].workpiece.width,
    depth: CNC_EXAMPLES[0].workpiece.depth,
    height: CNC_EXAMPLES[0].workpiece.height,
  },
  materialId: "aluminum-6061",
  playing: false,
  speed: 1,
  feedOverride: 100,
  rapidOverride: 100,
  spindleOverride: 100,
  singleBlock: false,
  optionalStop: true,
  blockSkip: true,
  machineMode: "run",
  currentMoveIndex: 0,
  currentT: 0,
  cumulative: { times: [], cum: [], total: 0 },
  cycleTimeSec: 0,
  elapsedTimeSec: 0,
  position: { x: 0, y: 0, z: 0 },
  spindleRpm: 0,
  spindleOn: false,
  spindleDir: 1,
  feed: 0,
  tool: 0,
  coolant: "off",
  isCutting: false,
  currentLine: 0,
  parseErrors: [],
  parseWarnings: [],

  loadExample: (id) => {
    const ex = CNC_EXAMPLES.find((e) => e.id === id) as CncExample;
    if (!ex) return;
    const base: SimState = get() as SimState;
    const patch = applyProgram(base, ex.code, {
      width: ex.workpiece.width,
      depth: ex.workpiece.depth,
      height: ex.workpiece.height,
    });
    set({
      exampleId: id,
      programName: ex.name,
      playing: false,
      ...patch,
    } as Partial<SimState>);
  },

  setSource: (code, opts) => {
    const base = get() as SimState;
    const patch = applyProgram(base, code, base.workpiece);
    set({
      exampleId: null,
      programName: "Custom Program",
      playing: opts?.keepPlay ? base.playing : false,
      ...patch,
    } as Partial<SimState>);
  },

  setWorkpiece: (w) => {
    const base = get() as SimState;
    const workpiece = { ...base.workpiece, ...w };
    set({ workpiece });
  },

  play: () => {
    const s = get() as SimState;
    if (!s.parseResult || s.parseResult.moves.length === 0) return;
    if (s.currentMoveIndex >= s.parseResult.moves.length - 1 && s.currentT >= 1) {
      // restart if at end
      set({ currentMoveIndex: 0, currentT: 0, elapsedTimeSec: 0 });
    }
    set({ playing: true });
  },

  pause: () => set({ playing: false }),
  toggle: () => {
    const s = get() as SimState;
    if (s.playing) set({ playing: false });
    else (get() as SimState).play();
  },

  reset: () =>
    set({
      playing: false,
      currentMoveIndex: 0,
      currentT: 0,
      elapsedTimeSec: 0,
    }),

  stepForward: () => {
    const s = get() as SimState;
    if (!s.parseResult) return;
    const moves = s.parseResult.moves;
    let next = s.currentMoveIndex + 1;
    if (next >= moves.length) next = moves.length - 1;
    const tel = telemetryAt(moves, next, 0);
    set({
      playing: false,
      currentMoveIndex: next,
      currentT: 0,
      elapsedTimeSec: s.cumulative.cum[next] ?? 0,
      ...tel,
    });
  },

  stepBackward: () => {
    const s = get() as SimState;
    if (!s.parseResult) return;
    const moves = s.parseResult.moves;
    let prev = s.currentMoveIndex - 1;
    if (prev < 0) prev = 0;
    const tel = telemetryAt(moves, prev, 0);
    set({
      playing: false,
      currentMoveIndex: prev,
      currentT: 0,
      elapsedTimeSec: s.cumulative.cum[prev] ?? 0,
      ...tel,
    });
  },

  jumpToMove: (index) => {
    const s = get() as SimState;
    if (!s.parseResult) return;
    const moves = s.parseResult.moves;
    const idx = Math.min(Math.max(index, 0), moves.length - 1);
    const tel = telemetryAt(moves, idx, 0);
    set({
      currentMoveIndex: idx,
      currentT: 0,
      elapsedTimeSec: s.cumulative.cum[idx] ?? 0,
      ...tel,
    });
  },

  seek: (progress) => {
    const s = get() as SimState;
    if (!s.parseResult || s.parseResult.moves.length === 0) return;
    const p = Math.min(Math.max(progress, 0), 1);
    const target = p * s.cumulative.total;
    // find move
    const cum = s.cumulative.cum;
    let idx = 0;
    for (let i = 0; i < cum.length; i++) {
      if (cum[i] <= target + 1e-6) idx = i;
      else break;
    }
    const moveStart = cum[idx] ?? 0;
    const moveDur = s.cumulative.times[idx] ?? 0;
    const t = moveDur > 0 ? (target - moveStart) / moveDur : 0;
    const tel = telemetryAt(s.parseResult.moves, idx, Math.min(t, 1));
    set({
      playing: false,
      currentMoveIndex: idx,
      currentT: Math.min(t, 1),
      elapsedTimeSec: target,
      ...tel,
    });
  },

  setSpeed: (sp) => set({ speed: sp }),
  setFeedOverride: (v) => set({ feedOverride: Math.min(200, Math.max(0, Math.round(v))) }),
  setRapidOverride: (v) => set({ rapidOverride: Math.min(100, Math.max(0, Math.round(v))) }),
  setSpindleOverride: (v) => set({ spindleOverride: Math.min(200, Math.max(0, Math.round(v))) }),
  toggleSingleBlock: () => set((st) => ({ singleBlock: !st.singleBlock })),
  toggleOptionalStop: () => set((st) => ({ optionalStop: !st.optionalStop })),
  toggleBlockSkip: () => set((st) => ({ blockSkip: !st.blockSkip })),
  setMachineMode: (m) => set({ machineMode: m }),
  setMaterial: (id) => set({ materialId: id }),

  tick: (dt) => {
    const s = get() as SimState;
    if (!s.playing || !s.parseResult || s.parseResult.moves.length === 0) return;
    const moves = s.parseResult.moves;
    let idx = s.currentMoveIndex;
    let t = s.currentT;
    let elapsed = s.elapsedTimeSec;
    // budget = real-seconds * master speed. We convert to base-seconds via per-move factor.
    let budget = dt * s.speed;
    let finishedBlock = false;

    while (budget > 0 && idx < moves.length) {
      const m = moves[idx];
      const dur = s.cumulative.times[idx] ?? 0;
      const isRapid = m.type === "rapid";
      const factor = m.type === "dwell" ? 1 : isRapid ? s.rapidOverride / 100 : s.feedOverride / 100;
      if (dur <= 0) {
        // zero-length move (or dwell with dur handled below)
        if (m.type === "dwell") {
          const dwellDur = m.dwell ?? 0;
          const done = t * dwellDur;
          const left = dwellDur - done;
          const need = left / Math.max(factor, 0.0001);
          if (budget >= need) {
            budget -= need;
            elapsed += left;
            idx++;
            t = 0;
            if (s.singleBlock) { finishedBlock = true; break; }
            continue;
          } else {
            const adv = budget * factor;
            t = (done + adv) / dwellDur;
            elapsed += adv;
            budget = 0;
            break;
          }
        } else {
          idx++;
          t = 0;
          continue;
        }
      }
      const remainingInMove = dur * (1 - t); // base-seconds left
      const need = remainingInMove / Math.max(factor, 0.0001);
      if (budget >= need) {
        budget -= need;
        elapsed += remainingInMove;
        idx++;
        t = 0;
        if (s.singleBlock) { finishedBlock = true; break; }
      } else {
        const adv = budget * factor;
        t += adv / dur;
        elapsed += adv;
        budget = 0;
        break;
      }
    }

    let playing = s.playing;
    if (idx >= moves.length) {
      idx = moves.length - 1;
      t = 1;
      playing = false;
    } else if (finishedBlock) {
      playing = false; // single-block: pause after completing a block
    }
    const tel = telemetryAt(moves, idx, t);
    set({
      currentMoveIndex: idx,
      currentT: t,
      elapsedTimeSec: elapsed,
      playing,
      ...tel,
    });
  },
}));

// Add progress as a derived selector helper
export function selectProgress(s: SimState): number {
  if (s.cycleTimeSec <= 0) return 0;
  return Math.min(s.elapsedTimeSec / s.cycleTimeSec, 1);
}

export { estimateCycleTime };
