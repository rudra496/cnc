// CNC Simulator Pro — shared types

export type MoveType =
  | "rapid" // G00
  | "linear" // G01
  | "arc_cw" // G02
  | "arc_ccw" // G03
  | "dwell"; // G04

export interface ToolState {
  tool: number; // T number, 0 = no tool
  feed: number; // mm/min
  spindle: number; // RPM (absolute); direction tracked separately
  spindleOn: boolean;
  spindleDir: 1 | -1; // M03 = 1 (CW), M04 = -1 (CCW)
  coolant: "off" | "flood" | "mist";
}

export interface Move {
  index: number; // sequential move index
  line: number; // source line number in the program (1-based)
  type: MoveType;
  from: Vec3; // start position (mm) — Z is up
  to: Vec3; // end position (mm)
  // Arc data (only for arc_cw / arc_ccw)
  center?: Vec2; // arc center XY (absolute), for arcs in XY plane
  plane?: "XY" | "XZ" | "YZ";
  radius?: number;
  sweep?: number; // swept angle (radians), positive
  startAngle?: number; // start angle (radians) from center to start point
  // State at the END of this move
  feed: number; // mm/min active during this move
  spindle: number; // rpm
  spindleOn: boolean;
  spindleDir: 1 | -1;
  coolant: ToolState["coolant"];
  tool: number;
  // geometry helpers
  length: number; // path length of this move (mm) — for rapid/linear/arc
  // dwell time in seconds (only for dwell)
  dwell?: number;
  // raw source text of the line
  source: string;
  // comment if the line had one
  comment?: string;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface ParseError {
  line: number;
  message: string;
}

export interface ParseResult {
  ok: boolean;
  moves: Move[];
  errors: ParseError[];
  warnings: ParseError[];
  finalState: ToolState;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
  programName?: string;
}
