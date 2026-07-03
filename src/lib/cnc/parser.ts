// CNC Simulator Pro — G-code parser / interpreter
// Tokenizes a G-code program and produces an ordered list of moves
// with full modal state tracking (Fanuc-style milling).

import type {
  Move,
  MoveType,
  ParseError,
  ParseResult,
  ToolState,
  Vec2,
  Vec3,
} from "./types";

interface Word {
  letter: string; // uppercase letter, e.g. "G"
  value: number;
}

interface RawLine {
  lineNo: number; // 1-based source line number
  words: Word[];
  comment?: string;
  raw: string;
}

const DEG = Math.PI / 180;

function tokenizeLine(raw: string, lineNo: number): RawLine {
  // Strip block delete and line number
  let s = raw.replace(/\r$/, "");
  // Remove full-line/block comments `( ... )` possibly nested loosely
  const commentMatch = s.match(/\(([^)]*)\)/g);
  let comment: string | undefined;
  if (commentMatch) {
    comment = commentMatch.map((c) => c.slice(1, -1)).join(" ").trim();
    s = s.replace(/\(([^)]*)\)/g, " ");
  }
  // `;` line comment
  const semi = s.indexOf(";");
  if (semi >= 0) {
    const c = s.slice(semi + 1).trim();
    if (c) comment = comment ? `${comment} ${c}` : c;
    s = s.slice(0, semi);
  }
  // Remove leading slash (block skip) and N-number
  s = s.replace(/^\//, "").trim();
  // Tokenize words: letter + number (number may have sign and decimals)
  const words: Word[] = [];
  const re = /([A-Za-z])\s*([-+]?\d*\.?\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const letter = m[1].toUpperCase();
    const value = parseFloat(m[2]);
    words.push({ letter, value });
  }
  return { lineNo, words, comment, raw: raw.replace(/\r$/, "") };
}

function angleOf(dx: number, dy: number): number {
  return Math.atan2(dy, dx);
}

function arcInfo(
  from: Vec2,
  to: Vec2,
  i: number | undefined,
  j: number | undefined,
  r: number | undefined,
  cw: boolean,
): { center: Vec2; radius: number; startAngle: number; endAngle: number; sweep: number } {
  let center: Vec2;
  if (i !== undefined || j !== undefined) {
    center = { x: from.x + (i ?? 0), y: from.y + (j ?? 0) };
  } else if (r !== undefined) {
    // Compute center from radius. Two possible centers; pick based on arc direction.
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const d = Math.hypot(dx, dy);
    const h2 = r * r - (d / 2) * (d / 2);
    const h = Math.sqrt(Math.max(0, h2));
    // perpendicular unit
    const px = -dy / d;
    const py = dx / d;
    // sign convention
    const sign = r >= 0 ? (cw ? -1 : 1) : (cw ? 1 : -1);
    center = { x: mx + sign * h * px, y: my + sign * h * py };
  } else {
    // default: center at midpoint (degenerate) — shouldn't happen, validated earlier
    center = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  }
  const radius = Math.hypot(from.x - center.x, from.y - center.y);
  const startAngle = angleOf(from.x - center.x, from.y - center.y);
  const endAngle = angleOf(to.x - center.x, to.y - center.y);
  let sweep: number;
  if (cw) {
    // clockwise: angle decreases
    sweep = startAngle - endAngle;
    while (sweep <= 0) sweep += 2 * Math.PI;
  } else {
    // ccw: angle increases
    sweep = endAngle - startAngle;
    while (sweep <= 0) sweep += 2 * Math.PI;
  }
  // If from==to (full circle), sweep = 2π
  if (Math.hypot(to.x - from.x, to.y - from.y) < 1e-6) sweep = 2 * Math.PI;
  return { center, radius, startAngle, endAngle, sweep };
}

export function parseGCode(source: string): ParseResult {
  const lines = source.split("\n");
  const moves: Move[] = [];
  const errors: ParseError[] = [];
  const warnings: ParseError[] = [];

  // Modal state
  let pos: Vec3 = { x: 0, y: 0, z: 0 };
  let absMode = true; // G90
  let unitsMm = true; // G21 (true=mm, false=inch)
  let plane: "XY" | "XZ" | "YZ" = "XY"; // G17
  let motion: number = 0; // last G0/G1/G2/G3 (0 = none)
  let feed = 100; // mm/min default
  let spindle = 0;
  let spindleOn = false;
  let spindleDir: 1 | -1 = 1;
  let coolant: ToolState["coolant"] = "off";
  let tool = 0;
  // Canned cycle state
  let cannedCycle: number | null = null; // e.g. 81
  let cannedZ: number | null = null; // R plane (retract)
  let cannedDepth: number | null = null;
  let cannedClear: number | null = null; // G98/G99 retract to
  let cannedFeed: number | null = null;
  const toMm = (v: number) => (unitsMm ? v : v * 25.4);

  const bounds = {
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,
    minZ: 0,
    maxZ: 0,
  };
  const updateBounds = (p: Vec3) => {
    bounds.minX = Math.min(bounds.minX, p.x);
    bounds.maxX = Math.max(bounds.maxX, p.x);
    bounds.minY = Math.min(bounds.minY, p.y);
    bounds.maxY = Math.max(bounds.maxY, p.y);
    bounds.minZ = Math.min(bounds.minZ, p.z);
    bounds.maxZ = Math.max(bounds.maxZ, p.z);
  };

  let programName: string | undefined;
  let moveIndex = 0;

  const pushMove = (
    type: MoveType,
    to: Vec3,
    lineNo: number,
    raw: string,
    comment: string | undefined,
    extra?: Partial<Move>,
  ) => {
    let length: number;
    if (type === "rapid" || type === "linear") {
      length = Math.hypot(to.x - pos.x, to.y - pos.y, to.z - pos.z);
    } else if (type === "arc_cw" || type === "arc_ccw") {
      const sweep = (extra as { sweep?: number }).sweep ?? 0;
      length = (extra?.radius ?? 0) * sweep;
    } else {
      length = 0;
    }
    const move: Move = {
      index: moveIndex++,
      line: lineNo,
      type,
      from: { ...pos },
      to: { ...to },
      feed,
      spindle,
      spindleOn,
      spindleDir,
      coolant,
      tool,
      length,
      source: raw,
      comment,
      ...extra,
    };
    moves.push(move);
    pos = { ...to };
    updateBounds(pos);
  };

  // Helper to resolve a coordinate word given modal abs/inc
  const resolveAxis = (
    current: number,
    word: number | undefined,
  ): number => {
    if (word === undefined) return current;
    const v = toMm(word);
    return absMode ? v : current + v;
  };

  for (let li = 0; li < lines.length; li++) {
    const lineNo = li + 1;
    const raw = lines[li];
    if (!raw.trim()) continue;
    const tok = tokenizeLine(raw, lineNo);
    if (tok.words.length === 0) continue;

    // Extract O-program number as program name
    const oWord = tok.words.find((w) => w.letter === "O");
    if (oWord && !programName) programName = `O${Math.round(oWord.value)}`;

    // Separate words
    let gWords = tok.words.filter((w) => w.letter === "G");
    const mWords = tok.words.filter((w) => w.letter === "M");
    const x = tok.words.find((w) => w.letter === "X")?.value;
    const y = tok.words.find((w) => w.letter === "Y")?.value;
    const z = tok.words.find((w) => w.letter === "Z")?.value;
    const i = tok.words.find((w) => w.letter === "I")?.value;
    const j = tok.words.find((w) => w.letter === "J")?.value;
    const k = tok.words.find((w) => w.letter === "K")?.value;
    const r = tok.words.find((w) => w.letter === "R")?.value;
    const f = tok.words.find((w) => w.letter === "F")?.value;
    const s = tok.words.find((w) => w.letter === "S")?.value;
    const t = tok.words.find((w) => w.letter === "T")?.value;
    const p = tok.words.find((w) => w.letter === "P")?.value;
    const q = tok.words.find((w) => w.letter === "Q")?.value;
    const l = tok.words.find((w) => w.letter === "L")?.value;

    // Apply F and S words (modal)
    if (f !== undefined) feed = toMm(f);
    if (s !== undefined) spindle = Math.abs(s);
    if (t !== undefined) tool = Math.round(t);

    // Apply M codes
    for (const mw of mWords) {
      const code = Math.round(mw.value);
      switch (code) {
        case 0:
        case 1:
          // program stop / optional stop — treat as no-op for simulation
          break;
        case 2:
        case 30:
          // end of program — stop parsing further moves
          break;
        case 3:
          spindleOn = true;
          spindleDir = 1;
          break;
        case 4:
          spindleOn = true;
          spindleDir = -1;
          break;
        case 5:
          spindleOn = false;
          break;
        case 6:
          // tool change — tool already set by T word
          break;
        case 7:
          coolant = "mist";
          break;
        case 8:
          coolant = "flood";
          break;
        case 9:
          coolant = "off";
          break;
      }
    }

    // Determine motion mode(s) from G words on this line. Some G words are
    // non-motion modal (units, plane, abs/inc, etc.)
    let lineMotion: number | null = null;
    let dwellTime: number | undefined;
    for (const gw of gWords) {
      const code = Math.round(gw.value);
      switch (code) {
        case 0:
        case 1:
        case 2:
        case 3:
          lineMotion = code;
          motion = code;
          break;
        case 4:
          lineMotion = 4;
          break;
        case 17:
          plane = "XY";
          break;
        case 18:
          plane = "XZ";
          break;
        case 19:
          plane = "YZ";
          break;
        case 20:
          unitsMm = false;
          break;
        case 21:
          unitsMm = true;
          break;
        case 28:
          // home — go to reference/home position (0,0,0) via rapid
          lineMotion = 0;
          break;
        case 90:
          absMode = true;
          break;
        case 91:
          absMode = false;
          break;
        case 94:
          // feed per minute (default)
          break;
        case 80:
          cannedCycle = null;
          break;
        case 81:
        case 82:
        case 83:
          cannedCycle = code;
          break;
        case 98:
        case 99:
          // retract behavior — ignore detail
          break;
        case 53:
        case 54:
        case 55:
        case 56:
        case 57:
        case 58:
        case 59:
          // work offsets — ignore
          break;
        case 43:
          // tool length comp — ignore
          break;
        case 40:
        case 41:
        case 42:
          // cutter comp — ignore for sim
          break;
        default:
          // Unknown G code — warning, not fatal
          warnings.push({
            line: lineNo,
            message: `Unsupported G-code G${code} (ignored)`,
          });
      }
    }

    // Dwell
    if (lineMotion === 4) {
      const seconds = p !== undefined ? p : q !== undefined ? q : 0;
      pushMove("dwell", { ...pos }, lineNo, raw, tok.comment, {
        dwell: seconds,
      });
      continue;
    }

    // G28 home
    if (gWords.some((w) => Math.round(w.value) === 28)) {
      // rapid to home (0,0,0) — but keep it visible
      pushMove("rapid", { x: 0, y: 0, z: 0 }, lineNo, raw, tok.comment);
      // reset canned cycle
      cannedCycle = null;
      continue;
    }

    // Compute target XYZ
    const tx = resolveAxis(pos.x, x);
    const ty = resolveAxis(pos.y, y);
    const tz = resolveAxis(pos.z, z);

    // Canned cycle (G81/82/83) handling — simplified: drill at each XY, then retract to R
    if (cannedCycle !== null && (x !== undefined || y !== undefined || z !== undefined)) {
      const rPlane = r !== undefined ? toMm(r) : cannedZ ?? 5;
      const depth = z !== undefined ? tz : cannedDepth ?? pos.z;
      cannedZ = rPlane;
      cannedDepth = depth;
      cannedFeed = feed;
      // 1) rapid to R plane above the hole (at current XY first if XY given, move then plunge)
      if (x !== undefined || y !== undefined) {
        pushMove("rapid", { x: tx, y: ty, z: rPlane }, lineNo, raw, tok.comment);
      } else {
        pushMove("rapid", { x: pos.x, y: pos.y, z: rPlane }, lineNo, raw, tok.comment);
      }
      // 2) feed plunge to depth
      pushMove("linear", { x: tx, y: ty, z: depth }, lineNo, raw, tok.comment);
      // 3) rapid retract to R plane (G99) or initial (G98) — use R plane for simplicity
      pushMove("rapid", { x: tx, y: ty, z: rPlane }, lineNo, raw, tok.comment);
      continue;
    }

    // No axis motion and no motion code → state-only line (F/S/T/M/comments)
    if (x === undefined && y === undefined && z === undefined && i === undefined && j === undefined && k === undefined) {
      continue;
    }

    // Determine motion
    const useMotion = lineMotion ?? motion;
    if (useMotion === 0 || useMotion === 1) {
      const type: MoveType = useMotion === 0 ? "rapid" : "linear";
      pushMove(type, { x: tx, y: ty, z: tz }, lineNo, raw, tok.comment);
    } else if (useMotion === 2 || useMotion === 3) {
      const cw = useMotion === 2;
      if (plane !== "XY") {
        warnings.push({
          line: lineNo,
          message: `Arc in ${plane} plane not fully supported (treated as XY)`,
        });
      }
      const a = arcInfo(
        { x: pos.x, y: pos.y },
        { x: tx, y: ty },
        i !== undefined ? toMm(i) : undefined,
        j !== undefined ? toMm(j) : undefined,
        r !== undefined ? toMm(r) : undefined,
        cw,
      );
      // Validate radius consistency
      const rEnd = Math.hypot(tx - a.center.x, ty - a.center.y);
      if (Math.abs(rEnd - a.radius) > 0.05 && Math.hypot(tx - pos.x, ty - pos.y) > 1e-6) {
        warnings.push({
          line: lineNo,
          message: `Arc endpoint not on declared radius (Δ=${(rEnd - a.radius).toFixed(3)}mm)`,
        });
      }
      pushMove(
        cw ? "arc_cw" : "arc_ccw",
        { x: tx, y: ty, z: tz },
        lineNo,
        raw,
        tok.comment,
        {
          center: a.center,
          radius: a.radius,
          plane,
          sweep: a.sweep,
          startAngle: a.startAngle,
        },
      );
    } else {
      // unknown motion, treat as no-op move
      continue;
    }
  }

  const finalState: ToolState = {
    tool,
    feed,
    spindle,
    spindleOn,
    spindleDir,
    coolant,
  };

  return {
    ok: errors.length === 0,
    moves,
    errors,
    warnings,
    finalState,
    bounds,
    programName,
  };
}

// Utility: sample a move at parametric t (0..1) returning XYZ
export function sampleMove(move: Move, t: number): Vec3 {
  if (move.type === "rapid" || move.type === "linear") {
    return {
      x: move.from.x + (move.to.x - move.from.x) * t,
      y: move.from.y + (move.to.y - move.from.y) * t,
      z: move.from.z + (move.to.z - move.from.z) * t,
    };
  }
  if (move.type === "arc_cw" || move.type === "arc_ccw") {
    const ext = move as Move & { sweep?: number; startAngle?: number };
    const sweep = ext.sweep ?? 0;
    const startAngle = ext.startAngle ?? 0;
    const cw = move.type === "arc_cw";
    const angle = cw ? startAngle - sweep * t : startAngle + sweep * t;
    const cx = move.center!.x;
    const cy = move.center!.y;
    return {
      x: cx + move.radius! * Math.cos(angle),
      y: cy + move.radius! * Math.sin(angle),
      z: move.from.z + (move.to.z - move.from.z) * t,
    };
  }
  // dwell — stays put
  return { ...move.from };
}

// Total estimated cycle time (seconds) ignoring spindle accel
export function estimateCycleTime(moves: Move[]): number {
  let time = 0;
  for (const m of moves) {
    if (m.type === "dwell") {
      time += m.dwell ?? 0;
    } else if (m.length > 0) {
      const feedMmPerMin = m.type === "rapid" ? 5000 : m.feed > 0 ? m.feed : 100;
      time += (m.length / feedMmPerMin) * 60;
    }
  }
  return time;
}

export { DEG };
