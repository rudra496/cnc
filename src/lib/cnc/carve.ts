// CNC Simulator Pro — workpiece carving engine
// Builds a subdivided top-surface geometry and maintains a heightmap
// that represents how deep the tool has cut at every (X,Y) grid vertex.

import * as THREE from "three";
import { sampleMove } from "./parser";
import type { Move } from "./types";
import type { Workpiece } from "./store";
import { toolRadius } from "./tools";

export type ToolRadiusFn = (toolNumber: number) => number;

export interface TopSurface {
  geometry: THREE.BufferGeometry;
  N: number;
  topY: Float32Array; // (N+1)^2 live heights (cnc Z, 0 = uncut, negative = cut)
  applyHeightmap: (hm: Float32Array) => void;
  reset: () => void;
}

export function createTopSurface(width: number, depth: number, N: number): TopSurface {
  const cols = N + 1;
  const count = cols * cols;
  const positions = new Float32Array(count * 3);
  const topY = new Float32Array(count);

  const hx = width / 2;
  const hz = depth / 2;
  for (let j = 0; j < cols; j++) {
    for (let i = 0; i < cols; i++) {
      const idx = j * cols + i;
      const x = -hx + (i / N) * width;
      const z = -hz + (j / N) * depth;
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = 0;
      positions[idx * 3 + 2] = z;
      topY[idx] = 0;
    }
  }

  const indices: number[] = [];
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const a = j * cols + i;
      const b = j * cols + i + 1;
      const c = (j + 1) * cols + i + 1;
      const d = (j + 1) * cols + i;
      // CCW from +Y (up): a, c, b ; a, d, c
      indices.push(a, c, b, a, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return {
    geometry,
    N,
    topY,
    applyHeightmap(hm: Float32Array) {
      const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < count; i++) {
        topY[i] = hm[i];
        arr[i * 3 + 1] = hm[i];
      }
      pos.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
    },
    reset() {
      for (let i = 0; i < count; i++) {
        topY[i] = 0;
        positions[i * 3 + 1] = 0;
      }
      const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
      pos.needsUpdate = true;
      geometry.computeVertexNormals();
    },
  };
}

// Stamp a single disc (tool cross-section) at (px,py) cnc coords with depth dz.
function stampDisc(
  hm: Float32Array,
  N: number,
  width: number,
  depth: number,
  px: number,
  py: number,
  radius: number,
  dz: number,
) {
  if (dz >= 0) return; // only cut when tool is below surface
  const cols = N + 1;
  const hx = width / 2;
  const hz = depth / 2;
  const r2 = radius * radius;
  // cell size
  const sx = width / N;
  const sz = depth / N;
  const i0 = Math.max(0, Math.floor((px - radius + hx) / sx));
  const i1 = Math.min(N, Math.ceil((px + radius + hx) / sx));
  const j0 = Math.max(0, Math.floor((py - radius + hz) / sz));
  const j1 = Math.min(N, Math.ceil((py + radius + hz) / sz));
  for (let j = j0; j <= j1; j++) {
    const z = -hz + (j / N) * depth;
    const dz2 = (z - py) * (z - py);
    if (dz2 > r2) continue;
    for (let i = i0; i <= i1; i++) {
      const x = -hx + (i / N) * width;
      const dx2 = (x - px) * (x - px);
      if (dx2 + dz2 > r2) continue;
      const idx = j * cols + i;
      if (dz < hm[idx]) hm[idx] = dz;
    }
  }
}

// Stamp a move (full or partial up to tMax) into heightmap hm.
export function stampMove(
  hm: Float32Array,
  move: Move,
  tMax: number,
  tr: number,
  width: number,
  depth: number,
  N: number,
) {
  if (move.type === "dwell" || move.type === "rapid") {
    // rapids shouldn't cut (assume safe retract). If a rapid dips below 0 we
    // still skip to avoid weird gouges — real machine would crash.
    return;
  }
  if (tMax <= 0) return;
  const len = move.length;
  const samples = Math.max(2, Math.min(500, Math.ceil(len / Math.max(tr * 0.5, 0.5))));
  for (let s = 0; s <= samples; s++) {
    const t = (s / samples) * tMax;
    const p = sampleMove(move, t);
    stampDisc(hm, N, width, depth, p.x, p.y, tr, p.z);
  }
}

// Build cumulative heightmaps: result[k] = state after k moves (result[0] = uncut).
// Uses the per-move tool number to look up the cutting radius.
export function buildCumulativeHeightmaps(
  moves: Move[],
  workpiece: Workpiece,
  N: number,
  trFn: ToolRadiusFn = toolRadius,
): Float32Array[] {
  const cols = N + 1;
  const count = cols * cols;
  const result: Float32Array[] = [];
  const current = new Float32Array(count); // all zeros
  result.push(new Float32Array(current));
  for (const m of moves) {
    stampMove(current, m, 1, trFn(m.tool), workpiece.width, workpiece.depth, N);
    result.push(new Float32Array(current));
  }
  return result;
}

// Apply the partial state: copy base (after previous move) then stamp partial current move.
export function applyPartialCut(
  target: Float32Array,
  base: Float32Array,
  move: Move | undefined,
  t: number,
  trFn: ToolRadiusFn,
  width: number,
  depth: number,
  N: number,
) {
  target.set(base);
  if (move) {
    stampMove(target, move, t, trFn(move.tool), width, depth, N);
  }
}

// Build a polyline (with per-vertex color) for the toolpath, split by type.
export function buildToolpathLines(moves: Move[]): {
  feedPoints: THREE.Vector3[];
  rapidPoints: THREE.Vector3[];
} {
  const feedPoints: THREE.Vector3[] = [];
  const rapidPoints: THREE.Vector3[] = [];
  // map cnc (x,y,z) -> three (x, z, y)
  const toVec = (p: { x: number; y: number; z: number }) =>
    new THREE.Vector3(p.x, p.z, p.y);
  let lastFeed = false;
  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    const isRapid = m.type === "rapid";
    const arr = isRapid ? rapidPoints : feedPoints;
    if (arr.length === 0 || (isRapid !== lastFeed)) {
      arr.push(toVec(m.from));
    }
    if (m.type === "arc_cw" || m.type === "arc_ccw") {
      const samples = Math.max(8, Math.min(120, Math.ceil((m.sweep ?? 0) / 0.1)));
      for (let s = 1; s <= samples; s++) {
        const t = s / samples;
        const p = sampleMove(m, t);
        arr.push(toVec(p));
      }
    } else {
      arr.push(toVec(m.to));
    }
    lastFeed = !isRapid;
  }
  return { feedPoints, rapidPoints };
}
