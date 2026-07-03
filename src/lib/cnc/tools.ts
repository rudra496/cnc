// CNC Simulator Pro — Tool Library
// Each tool has geometry + machining parameters used by the carving engine
// (radius) and the 3D scene (mesh shape).

export type ToolType =
  | "end_mill"
  | "ball_nose"
  | "drill"
  | "chamfer"
  | "face_mill"
  | "spot_drill"
  | "reamer"
  | "thread_mill";

export interface CncTool {
  number: number; // T1, T2 …
  name: string;
  type: ToolType;
  diameter: number; // mm (cutting diameter)
  length: number; // mm (cutting flute length)
  flutes: number;
  shankDiameter: number; // mm
  color: string; // hex, for 3D + UI swatch
  // suggested machining params (aluminum baseline)
  surfaceSpeed: number; // m/min (Vc)
  chipLoad: number; // mm/tooth (fz)
  description: string;
}

export const TOOL_LIBRARY: CncTool[] = [
  {
    number: 1,
    name: "End Mill Ø6",
    type: "end_mill",
    diameter: 6,
    length: 20,
    flutes: 3,
    shankDiameter: 6,
    color: "#e8c878",
    surfaceSpeed: 250,
    chipLoad: 0.05,
    description: "General-purpose 3-flute flat end mill. The workhorse for pockets, slots and profiles.",
  },
  {
    number: 2,
    name: "End Mill Ø10",
    type: "end_mill",
    diameter: 10,
    length: 25,
    flutes: 3,
    shankDiameter: 10,
    color: "#d4a44a",
    surfaceSpeed: 220,
    chipLoad: 0.07,
    description: "Larger 3-flute end mill for faster roughing of bigger pockets.",
  },
  {
    number: 3,
    name: "Drill Ø3",
    type: "drill",
    diameter: 3,
    length: 30,
    flutes: 2,
    shankDiameter: 3,
    color: "#c0c6cf",
    surfaceSpeed: 80,
    chipLoad: 0.06,
    description: "Twist drill for 3 mm holes. Use with G81/G83 canned cycles.",
  },
  {
    number: 4,
    name: "Ball Nose Ø6",
    type: "ball_nose",
    diameter: 6,
    length: 18,
    flutes: 2,
    shankDiameter: 6,
    color: "#b8e0a3",
    surfaceSpeed: 200,
    chipLoad: 0.04,
    description: "Ball-nose for 3D surfacing and organic contours.",
  },
  {
    number: 5,
    name: "Chamfer Ø10 (90°)",
    type: "chamfer",
    diameter: 10,
    length: 12,
    flutes: 2,
    shankDiameter: 6,
    color: "#f4a460",
    surfaceSpeed: 180,
    chipLoad: 0.05,
    description: "Spot/chamfer tool for breaking edges and spotting hole locations.",
  },
  {
    number: 6,
    name: "Face Mill Ø50",
    type: "face_mill",
    diameter: 50,
    length: 14,
    flutes: 5,
    shankDiameter: 25,
    color: "#9aa6b2",
    surfaceSpeed: 300,
    chipLoad: 0.12,
    description: "Big 5-insert face mill for surfacing stock flat quickly.",
  },
  {
    number: 7,
    name: "Spot Drill Ø8",
    type: "spot_drill",
    diameter: 8,
    length: 14,
    flutes: 2,
    shankDiameter: 8,
    color: "#e0a3a3",
    surfaceSpeed: 120,
    chipLoad: 0.05,
    description: "Spot drill for accurate hole starting. 90° point.",
  },
  {
    number: 8,
    name: "Reamer Ø5",
    type: "reamer",
    diameter: 5,
    length: 35,
    flutes: 6,
    shankDiameter: 5,
    color: "#a3c4e0",
    surfaceSpeed: 30,
    chipLoad: 0.08,
    description: "Reamer for precision-finished holes. Feed slowly.",
  },
];

export function getToolByNumber(n: number): CncTool | undefined {
  return TOOL_LIBRARY.find((t) => t.number === n);
}

export function toolRadius(n: number): number {
  return (getToolByNumber(n)?.diameter ?? 6) / 2;
}

export const TOOL_TYPE_ICON: Record<ToolType, string> = {
  end_mill: "▭",
  ball_nose: "◡",
  drill: "▲",
  chamfer: "◣",
  face_mill: "⊞",
  spot_drill: "▼",
  reamer: "▮",
  thread_mill: "CallableWrapper",
};
