// CNC Simulator Pro — CNC code reference data
// Used by the in-app reference panel (educational).

export interface CodeEntry {
  code: string; // e.g. "G00"
  name: string;
  group: string; // modal group name
  description: string;
  example?: string;
  tip?: string;
}

export interface CodeGroup {
  category: "G" | "M" | "T" | "F" | "S" | "Z" | "Other";
  title: string;
  blurb: string;
  entries: CodeEntry[];
}

export const CODE_REFERENCE: CodeGroup[] = [
  {
    category: "G",
    title: "G-Codes — Preparatory / Motion",
    blurb:
      "G-codes tell the controller what KIND of motion or mode to use. They are modal — once set, they stay active until changed.",
    entries: [
      {
        code: "G00",
        name: "Rapid Positioning",
        group: "Motion",
        description:
          "Move the tool to the target point at maximum traverse speed. Used for non-cutting moves (approach, retract, between features).",
        example: "G00 X10 Y20 Z5",
        tip: "Never cut with G00 — the tool will slam into material at full speed.",
      },
      {
        code: "G01",
        name: "Linear Interpolation (Feed)",
        group: "Motion",
        description:
          "Move in a straight line to the target at the programmed feed rate. The bread-and-butter cutting move.",
        example: "G01 X50 Y20 F150",
        tip: "F is sticky — set it once and it stays until you change it.",
      },
      {
        code: "G02",
        name: "Circular Interpolation — Clockwise",
        group: "Motion",
        description:
          "Cut a clockwise arc to the target. The arc center is defined by I/J (offset from start) or by R (radius).",
        example: "G02 X25 Y25 I10 J0",
        tip: "I and J are the DISTANCE from the arc START to the CENTER — not the center's absolute coordinates.",
      },
      {
        code: "G03",
        name: "Circular Interpolation — Counter-Clockwise",
        group: "Motion",
        description:
          "Cut a counter-clockwise arc to the target. Same I/J/R rules as G02, opposite direction.",
        example: "G03 X25 Y25 I10 J0",
      },
      {
        code: "G04",
        name: "Dwell",
        group: "Misc",
        description:
          "Pause the program for a number of seconds (P) or milliseconds. Used for chip breaking or letting coolant reach the tool.",
        example: "G04 P2",
        tip: "P is in seconds on most mills (milliseconds on some controls — check yours).",
      },
      {
        code: "G17",
        name: "XY Plane Selection",
        group: "Plane",
        description: "Selects the XY plane for circular moves (default for vertical mills).",
      },
      {
        code: "G18",
        name: "ZX Plane Selection",
        group: "Plane",
        description: "Selects the ZX plane for circular moves (used on lathes face work).",
      },
      {
        code: "G19",
        name: "YZ Plane Selection",
        group: "Plane",
        description: "Selects the YZ plane for circular moves.",
      },
      {
        code: "G20",
        name: "Inch Units",
        group: "Units",
        description: "All coordinates and feeds are interpreted in inches.",
        example: "G20 G01 X1.5 F6.0",
        tip: "Never mix G20/G21 mid-program — it re-interprets every following number.",
      },
      {
        code: "G21",
        name: "Millimeter Units",
        group: "Units",
        description: "All coordinates and feeds are interpreted in millimeters (metric).",
        example: "G21 G01 X40 F150",
      },
      {
        code: "G28",
        name: "Return to Machine Home",
        group: "Position",
        description: "Sends the tool to the machine home/reference position via an intermediate point.",
        example: "G28 G91 Z0",
        tip: "Always retract Z first with G28 to avoid crashing into the part.",
      },
      {
        code: "G40",
        name: "Cancel Cutter Compensation",
        group: "Cutter Comp",
        description: "Turns off cutter radius compensation — tool center follows the programmed path.",
      },
      {
        code: "G41",
        name: "Cutter Comp — Left",
        group: "Cutter Comp",
        description:
          "Offsets the tool to the LEFT of the programmed path by the cutter radius. Used for finish passes.",
      },
      {
        code: "G42",
        name: "Cutter Comp — Right",
        group: "Cutter Comp",
        description: "Offsets the tool to the RIGHT of the programmed path by the cutter radius.",
      },
      {
        code: "G43",
        name: "Tool Length Compensation",
        group: "Tool",
        description: "Applies the stored tool length offset for the active tool (with H word).",
        example: "G43 H1",
      },
      {
        code: "G53",
        name: "Machine Coordinate System",
        group: "Coords",
        description: "Moves use the machine's absolute coordinate system (non-modal).",
      },
      {
        code: "G54",
        name: "Work Offset 1",
        group: "Coords",
        description:
          "Selects work coordinate system #1. The most common offset — your part zero lives here.",
      },
      {
        code: "G55",
        name: "Work Offset 2",
        group: "Coords",
        description: "Selects work coordinate system #2 (for second vise / second part).",
      },
      {
        code: "G80",
        name: "Cancel Canned Cycle",
        group: "Canned Cycle",
        description: "Cancels any active canned cycle (drilling, tapping, boring).",
      },
      {
        code: "G81",
        name: "Drilling Cycle",
        group: "Canned Cycle",
        description:
          "Standard drilling cycle: rapid to R plane, feed to depth, rapid out. Repeats at each following XY until G80.",
        example: "G81 R2 Z-10 F100",
        tip: "After G81, every X/Y move drills another hole — until you call G80.",
      },
      {
        code: "G82",
        name: "Drilling Cycle with Dwell",
        group: "Canned Cycle",
        description: "Like G81 but pauses (P) at the bottom of the hole — great for spot drilling / countersink.",
        example: "G82 R2 Z-5 P0.5 F100",
      },
      {
        code: "G83",
        name: "Peck Drilling Cycle",
        group: "Canned Cycle",
        description:
          "Deep-hole peck drill: drills a Q-depth, retracts to clear chips, repeats. Prevents chip packing.",
        example: "G83 R2 Z-30 Q5 F100",
      },
      {
        code: "G90",
        name: "Absolute Positioning",
        group: "Distance",
        description: "All coordinates are measured from the program zero (part origin).",
        example: "G90 G01 X20 Y10",
      },
      {
        code: "G91",
        name: "Incremental Positioning",
        group: "Distance",
        description: "All coordinates are measured from the tool's CURRENT position.",
        example: "G91 G01 X5 (moves +5mm in X from here)",
      },
      {
        code: "G94",
        name: "Feed Per Minute",
        group: "Feed Mode",
        description: "Feed rate is in distance per minute (mm/min or in/min). Default on mills.",
      },
      {
        code: "G98",
        name: "Retract to Initial Level",
        group: "Canned Cycle",
        description: "After a canned cycle, retract to the initial Z level (safe for clamps).",
      },
      {
        code: "G99",
        name: "Retract to R Level",
        group: "Canned Cycle",
        description: "After a canned cycle, retract only to the R plane (faster for many holes).",
      },
    ],
  },
  {
    category: "M",
    title: "M-Codes — Miscellaneous / Machine",
    blurb:
      "M-codes control machine functions: spindle, coolant, program flow, tool changes. They are NOT modal like G-codes.",
    entries: [
      {
        code: "M00",
        name: "Program Stop",
        group: "Program Flow",
        description: "Stops the program and spindle. Operator presses Cycle Start to continue. Used for inspections.",
      },
      {
        code: "M01",
        name: "Optional Stop",
        group: "Program Flow",
        description: "Stops only if the Optional Stop switch is ON. Handy for inspection points.",
      },
      {
        code: "M02",
        name: "Program End",
        group: "Program Flow",
        description: "Ends the program (no rewind on most controls).",
      },
      {
        code: "M03",
        name: "Spindle ON — Clockwise",
        group: "Spindle",
        description: "Starts the spindle rotating clockwise (standard for right-hand tools). Set speed with S.",
        example: "M03 S1200",
      },
      {
        code: "M04",
        name: "Spindle ON — Counter-Clockwise",
        group: "Spindle",
        description: "Starts the spindle rotating CCW (for left-hand tools / tapping out).",
        example: "M04 S800",
      },
      {
        code: "M05",
        name: "Spindle OFF",
        group: "Spindle",
        description: "Stops the spindle. Usually called before tool changes and at program end.",
      },
      {
        code: "M06",
        name: "Tool Change",
        group: "Tool",
        description: "Performs an automatic tool change to the tool number set by the T word.",
        example: "T3 M06 (load tool 3)",
        tip: "Always retract to a safe Z and stop the spindle (M05) before M06.",
      },
      {
        code: "M07",
        name: "Coolant — Mist",
        group: "Coolant",
        description: "Turns on mist coolant.",
      },
      {
        code: "M08",
        name: "Coolant — Flood",
        group: "Coolant",
        description: "Turns on flood coolant (the standard for milling steel/aluminum).",
        tip: "Turn coolant on just before the tool enters the cut, off during rapids.",
      },
      {
        code: "M09",
        name: "Coolant OFF",
        group: "Coolant",
        description: "Turns off all coolant.",
      },
      {
        code: "M19",
        name: "Spindle Orientation",
        group: "Spindle",
        description: "Orients the spindle to a fixed angle (used for rigid tapping / tool change).",
      },
      {
        code: "M30",
        name: "Program End & Reset",
        group: "Program Flow",
        description: "Ends the program AND resets it to the top (the standard end-of-program code).",
        example: "M30",
      },
      {
        code: "M98",
        name: "Subprogram Call",
        group: "Subprogram",
        description: "Calls a subprogram (P = program number, L = repeat count).",
        example: "M98 P1001 L3",
      },
      {
        code: "M99",
        name: "Subprogram Return",
        group: "Subprogram",
        description: "Returns from a subprogram to the calling program.",
      },
    ],
  },
  {
    category: "T",
    title: "T-Code — Tool Selection",
    blurb:
      "The T word selects which tool to use. On most mills, T1 M06 loads tool #1 from the carousel and applies its offsets.",
    entries: [
      {
        code: "T",
        name: "Tool Number",
        group: "Tool",
        description:
          "Selects the tool number (1–N). Combined with M06 it performs a tool change. Each tool has its own length and diameter offsets.",
        example: "T1 M06",
        tip: "Common tools: T1 = face mill, T2 = end mill, T3 = drill, T4 = chamfer.",
      },
      {
        code: "T01",
        name: "Tool 1 — Face Mill",
        group: "Tool",
        description: "Typically a large-diameter cutter for surfacing the top of a part flat.",
      },
      {
        code: "T02",
        name: "Tool 2 — End Mill",
        group: "Tool",
        description: "General-purpose cutter for pockets, slots, profiles. Most common tool.",
      },
      {
        code: "T03",
        name: "Tool 3 — Drill",
        group: "Tool",
        description: "Twist drill for making holes. Used with G81/G83 canned cycles.",
      },
      {
        code: "T04",
        name: "Tool 4 — Chamfer / Spot Drill",
        group: "Tool",
        description: "Spot-drills hole locations and breaks edges with a chamfer.",
      },
      {
        code: "H",
        name: "Tool Length Offset Register",
        group: "Tool",
        description:
          "The H word (used with G43) tells the control which length-offset register to use — usually the same number as the tool.",
        example: "G43 H1 (use length offset #1)",
      },
      {
        code: "D",
        name: "Cutter Radius Offset Register",
        group: "Tool",
        description: "The D word selects the radius-offset register used by G41/G42 cutter compensation.",
      },
    ],
  },
  {
    category: "F",
    title: "F-Code — Feed Rate",
    blurb:
      "The F word sets how fast the tool FEEDS into material (cutting speed). Too fast breaks tools; too slow rubs and work-hardens. F is modal.",
    entries: [
      {
        code: "F",
        name: "Feed Rate",
        group: "Feed",
        description:
          "Sets the cutting feed rate. With G94 (default) the units are mm/min or in/min. Stays active until changed.",
        example: "G01 X50 F150",
        tip: "Feed = chip load × spindle rpm × number of flutes. Start conservative.",
      },
      {
        code: "F (Rapid)",
        name: "Rapid has no F",
        group: "Feed",
        description:
          "G00 ignores F and always runs at the machine's maximum traverse. You can't slow a rapid with F — use G01 instead.",
      },
      {
        code: "F — Surface Speed",
        name: "Choosing a feed",
        group: "Feed",
        description:
          "For aluminum with a 6mm carbide end mill: ~0.05mm/tooth chip load × 8000 rpm × 2 flutes ≈ 800 mm/min.",
        tip: "When in doubt, halve the feed and listen for chatter.",
      },
    ],
  },
  {
    category: "S",
    title: "S-Code — Spindle Speed",
    blurb:
      "The S word sets spindle RPM. It does nothing by itself — pair with M03/M04 to actually spin the spindle.",
    entries: [
      {
        code: "S",
        name: "Spindle Speed (RPM)",
        group: "Spindle",
        description:
          "Sets the spindle speed in revolutions per minute. Becomes active when M03 or M04 is called.",
        example: "M03 S2500",
        tip: "RPM = (Surface Speed × 1000) / (π × tool diameter in mm).",
      },
      {
        code: "S — Constant Surface Speed",
        name: "G96 (lathe)",
        group: "Spindle",
        description: "On lathes G96 keeps surface speed constant by varying RPM — not used on mills.",
      },
    ],
  },
  {
    category: "Z",
    title: "Z-Axis — Depth & Safe Moves",
    blurb:
      "The Z word controls vertical depth. Part top is Z=0; cutting goes to negative Z. A safe retract (positive Z) between features prevents crashes.",
    entries: [
      {
        code: "Z (safe retract)",
        name: "Z positive = safe",
        group: "Z",
        description:
          "Lift the tool to a positive Z (e.g. Z5 or Z10) before any XY rapid. This is the #1 rule to avoid crashing.",
        example: "G00 Z5",
      },
      {
        code: "Z (cut depth)",
        name: "Z negative = cutting",
        group: "Z",
        description:
          "Negative Z values plunge the tool into the workpiece. Depth of cut per pass depends on tool diameter and material.",
        example: "G01 Z-2 F50",
        tip: "Never plunge an end mill straight down at full depth — ramp or helix in.",
      },
      {
        code: "Z (pecking)",
        name: "Peck depth (Q)",
        group: "Z",
        description:
          "For deep holes use G83 peck drilling — the tool retracts after every Q mm to clear chips and cool.",
        example: "G83 R2 Z-20 Q3 F80",
      },
      {
        code: "Z (step-down)",
        name: "Multiple Z-passes",
        group: "Z",
        description:
          "For deep pockets, cut in several Z steps: Z-1, Z-2, Z-3… finishing the full XY contour at each depth.",
      },
    ],
  },
  {
    category: "Other",
    title: "Other Words & Syntax",
    blurb: "Address letters that appear next to G/M codes to give them values.",
    entries: [
      {
        code: "X / Y / Z",
        name: "Coordinate words",
        group: "Coords",
        description: "Set the target position along each axis. Omit an axis to keep its current value.",
      },
      {
        code: "I / J / K",
        name: "Arc center offsets",
        group: "Arc",
        description:
          "Distance from the arc START point to the arc CENTER, along X / Y / Z respectively. Always incremental from the start.",
        example: "G02 X20 Y20 I5 J0",
      },
      {
        code: "R",
        name: "Arc radius",
        group: "Arc",
        description: "Alternative to I/J/K: gives the arc radius directly. Sign picks which of the two possible arcs.",
      },
      {
        code: "P",
        name: "Dwell time / Program number",
        group: "Misc",
        description: "With G04 = dwell seconds. With M98 = subprogram number. With G82 = dwell at hole bottom.",
      },
      {
        code: "Q",
        name: "Peck depth / Shift",
        group: "Misc",
        description: "With G83 = peck increment. With G76/G87 = boring tool shift.",
      },
      {
        code: "N",
        name: "Block / line number",
        group: "Syntax",
        description: "Optional sequence number at the start of a line. Rarely needed on modern controls.",
        example: "N10 G01 X10",
      },
      {
        code: "; or ( )",
        name: "Comments",
        group: "Syntax",
        description: "Text after `;` or inside `( )` is ignored by the machine — used for notes.",
        example: "G01 X10 ; finish pass",
      },
      {
        code: "/",
        name: "Block skip",
        group: "Syntax",
        description: "A `/` at the start of a line lets the operator skip that block via a switch.",
      },
    ],
  },
];

export const ALL_CODES: CodeEntry[] = CODE_REFERENCE.flatMap((g) => g.entries);
