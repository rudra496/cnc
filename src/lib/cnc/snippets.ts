// CNC Simulator Pro — Code snippets / templates
// Ready-to-insert blocks of well-commented G-code (Fanuc-style, `;` comments).

export interface Snippet {
  id: string;
  name: string;
  category: string; // "Header" | "Pocket" | "Drill" | "Profile" | "Finish" | "Surfacing" | "Utility"
  description: string;
  code: string; // multi-line G-code to insert
}

export const CODE_SNIPPETS: Snippet[] = [
  {
    id: "hdr-program",
    name: "Program Header Boilerplate",
    category: "Header",
    description:
      "Standard start-of-program block: units, absolute, plane, safety block, work offset.",
    code: [
      "; ===== PROGRAM HEADER =====",
      "O1000 ; program number + name",
      "G21 ; mm units",
      "G90 ; absolute positioning",
      "G17 ; XY plane selection",
      "G54 ; work offset",
      "G40 G49 G80 ; cancel cutter comp, tool len comp, canned cycle",
      "G94 ; feed per minute",
      "; (set your stock / origin here)",
    ].join("\n"),
  },
  {
    id: "hdr-toolchange",
    name: "Tool Change + Spindle Start",
    category: "Header",
    description:
      "Tool change block followed by spindle on, feed, and safe positioning.",
    code: [
      "; ===== TOOL CHANGE T1 =====",
      "T1 M06 ; load tool 1",
      "S12000 M03 ; spindle on CW, 12000 rpm",
      "G43 H1 Z25. ; apply tool length offset, retract to Z25",
      "M08 ; coolant on (flood)",
      "F1500 ; default feed rate",
    ].join("\n"),
  },
  {
    id: "util-safe-retract",
    name: "Safe Retract + Park",
    category: "Utility",
    description:
      "Lift Z to a safe height, stop spindle/coolant, return to machine zero, end program.",
    code: [
      "; ===== SAFE RETRACT + END =====",
      "G0 Z25. ; rapid retract",
      "M09 ; coolant off",
      "M05 ; spindle stop",
      "G91 G28 Z0 ; return to ref Z",
      "G91 G28 X0 Y0 ; return to ref XY",
      "G90 ; back to absolute",
      "M30 ; program end + rewind",
    ].join("\n"),
  },
  {
    id: "util-dwell",
    name: "Dwell (Pause)",
    category: "Utility",
    description: "Pause for a fixed time in seconds — useful at hole bottoms for chip break.",
    code: [
      "; ===== DWELL =====",
      "G04 P0.5 ; pause 0.5 s (P in seconds)",
      "; (set P to desired dwell time)",
    ].join("\n"),
  },
  {
    id: "util-comment-banner",
    name: "Comment Banner Block",
    category: "Utility",
    description: "A bordered comment block to label a section of the program.",
    code: [
      "; =============================",
      "; (set your section title here)",
      "; =============================",
    ].join("\n"),
  },
  {
    id: "surfacing-pass",
    name: "Surfacing / Facing Pass",
    category: "Surfacing",
    description:
      "Zig-zag facing pattern covering a rectangular area at a fixed depth. Adjust stock size + stepover.",
    code: [
      "; ===== SURFACING PASS =====",
      "; (set your stock X/Y/depth here)",
      "G0 X0 Y0",
      "Z2.",
      "G1 Z-1. F500 ; first cut depth",
      "Y80. F1200 ; cut across Y length",
      "X10. ; stepover in X",
      "Y0 ; return cut",
      "X20.",
      "Y80.",
      "X30.",
      "Y0",
      "G0 Z25. ; retract when done",
    ].join("\n"),
  },
  {
    id: "pocket-circular",
    name: "Circular Pocket Template",
    category: "Pocket",
    description:
      "Spiral-in circular pocket using G02 arcs. Center the pocket at (Xc, Yc), set radius and depth.",
    code: [
      "; ===== CIRCULAR POCKET =====",
      "; (set Xc/Yc center, radius R, depth Z here)",
      "G0 X25. Y25. ; move to center",
      "Z2.",
      "G1 Z-2. F300 ; plunge per pass",
      "G1 X35. ; move to start of arc",
      "G2 X35. Y25. I-10. J0 ; full circle, R10",
      "G1 X25. Y25. ; return to center",
      "G0 Z25. ; retract",
    ].join("\n"),
  },
  {
    id: "pocket-rectangular",
    name: "Rectangular Pocket (Z-Step)",
    category: "Pocket",
    description:
      "Multi-pass rectangular pocket with linear ramp on Z. Adjust corner XY and pocket width/height/depth.",
    code: [
      "; ===== RECT POCKET (Z-STEP) =====",
      "; (set pocket XY, width W, height H, depth D here)",
      "G0 X10. Y10. ; lower-left corner + tool radius",
      "Z2.",
      "G1 Z-1. F300 ; first Z pass",
      "G1 X50. F800 ; cut right",
      "Y50. ; cut up",
      "X10. ; cut left",
      "Y10. ; cut down",
      "Z-2. ; next pass",
      "G1 X50. F800",
      "Y50.",
      "X10.",
      "Y10.",
      "G0 Z25. ; retract",
    ].join("\n"),
  },
  {
    id: "drill-g81",
    name: "Drilling Cycle G81",
    category: "Drill",
    description:
      "Canned drilling cycle for a row of holes. Specify hole positions; R = retract plane, Z = hole depth.",
    code: [
      "; ===== DRILL CYCLE G81 =====",
      "; (set hole XY, R retract, Z depth, F feed here)",
      "G0 X10. Y10.",
      "G81 R2. Z-8. F250 ; drill cycle on",
      "X20. ; next hole",
      "X30.",
      "X40.",
      "G80 ; cancel cycle",
      "G0 Z25. ; retract",
    ].join("\n"),
  },
  {
    id: "drill-g83-peck",
    name: "Peck Drilling Cycle G83",
    category: "Drill",
    description:
      "Deep-hole peck drill cycle with Q peck increment — clears chips between pecks.",
    code: [
      "; ===== PECK DRILL G83 =====",
      "; (set hole XY, R retract, Z depth, Q peck, F feed here)",
      "G0 X15. Y15.",
      "G83 R2. Z-20. Q3. F200 ; peck 3mm each cycle",
      "X35.",
      "X55.",
      "G80 ; cancel cycle",
      "G0 Z25.",
    ].join("\n"),
  },
  {
    id: "profile-rectangle",
    name: "Rectangle Profile (Climb)",
    category: "Profile",
    description:
      "Climb-mill rectangle profile around the outside of stock. Set corner + W/H + cut depth.",
    code: [
      "; ===== RECTANGLE PROFILE =====",
      "; (set corner XY, width W, height H, depth here)",
      "G0 X0 Y0",
      "Z2.",
      "G1 Z-3. F400 ; depth of cut",
      "G1 X60. F1000 ; bottom edge",
      "Y40. ; right edge",
      "X0 ; top edge",
      "Y0 ; back to start",
      "G0 Z25. ; retract",
    ].join("\n"),
  },
  {
    id: "profile-circle",
    name: "Circular Profile (Outside)",
    category: "Profile",
    description:
      "Circle profile around outside of a circular boss using a single G02 full-circle arc.",
    code: [
      "; ===== CIRCULAR PROFILE =====",
      "; (set center Xc/Yc, radius R here)",
      "G0 X40. Y20. ; start point (right of circle, R20)",
      "Z2.",
      "G1 Z-3. F400",
      "G2 X40. Y20. I-20. J0 F1000 ; full circle, CCW from start",
      "G0 Z25. ; retract",
    ].join("\n"),
  },
  {
    id: "finish-pass",
    name: "Finish Pass (Slow + Spring)",
    category: "Finish",
    description:
      "Low-feed final finish pass — repeat profile at final depth with reduced feed for surface quality.",
    code: [
      "; ===== FINISH PASS =====",
      "; (set final Z and feed here — lower F for better finish)",
      "G0 X0 Y0",
      "Z2.",
      "G1 Z-4. F200 ; final depth, slow plunge",
      "G1 X60. F400 ; finish feed (slower)",
      "Y40.",
      "X0.",
      "Y0.",
      "G0 Z25.",
    ].join("\n"),
  },
  {
    id: "finish-chamfer",
    name: "Chamfer / Deburr Pass",
    category: "Finish",
    description:
      "Light chamfer pass along an edge using a chamfer tool — small Z drop at slow feed.",
    code: [
      "; ===== CHAMFER PASS =====",
      "; (set edge XY, chamfer depth here — use chamfer mill)",
      "G0 X0 Y0",
      "Z2.",
      "G1 Z-0.5 F300 ; chamfer depth",
      "G1 X60. F600 ; along edge",
      "Y40.",
      "X0.",
      "Y0.",
      "G0 Z25.",
    ].join("\n"),
  },
  {
    id: "header-optional-stop",
    name: "Optional Stop / Inspection",
    category: "Header",
    description:
      "M01 optional stop — pauses only if the machine's optional-stop switch is on, for in-cycle inspection.",
    code: [
      "; ===== OPTIONAL STOP =====",
      "M01 ; optional stop (honored if switch on)",
      "; (set your inspection point here)",
    ].join("\n"),
  },
];
