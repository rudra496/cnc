/**
 * CNC Simulator Pro — Example G-code Programs
 * ============================================
 *
 * A curated library of realistic, well-commented CNC G-code programs for a
 * 3-axis vertical machining center (VMC). Each program is a complete, runnable
 * Fanuc-style G-code file that the CNC simulator can parse and animate.
 *
 * Tool library (each program loads the appropriate tool via T<n> M06):
 *   T1: End Mill Ø6     — general purpose (default for most cuts)
 *   T2: End Mill Ø10    — roughing bigger pockets
 *   T3: Drill Ø3        — drilling cycles (G81/G83)
 *   T4: Ball Nose Ø6    — 3D surfacing & decorative engraving
 *   T5: Chamfer Ø10 90° — edge breaking / chamfering
 *   T6: Face Mill Ø50   — surfacing stock flat
 *   T7: Spot Drill Ø8   — spotting holes
 *   T8: Reamer Ø5       — precision holes
 *
 * Coordinate conventions used by every example:
 *   - Workpiece is centered on the origin: X = 0, Y = 0 is the workpiece center.
 *   - The top surface of the workpiece sits at Z = 0.
 *   - Cutting happens at NEGATIVE Z (e.g. Z-3 cuts 3mm below the top surface).
 *   - Safe retract / rapid plane is POSITIVE Z (e.g. Z5 or Z10).
 *   - All X/Y coordinates stay inside the declared workpiece bounds with a
 *     safety margin so the tool never leaves the stock.
 *   - All cutting Z values never go deeper than -workpiece.height.
 *
 * G-code conventions:
 *   - G21 = millimeters, G90 = absolute positioning, G17 = XY plane
 *   - G00 = rapid traverse, G01 = linear feed, G02 = arc CW, G03 = arc CCW
 *   - Arc centers are specified with I/J (incremental offset from start point
 *     to arc center) — never the R-word, for unambiguous parsing.
 *   - M03 Sxxxx = spindle on CW, M05 = spindle off, M06 = tool change,
 *     M30 = program end & rewind.
 *
 * These programs are intended as much for education as for simulation, so
 * nearly every block carries an inline `;` comment explaining its purpose.
 */

export interface CncExample {
  id: string;
  name: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  machine: "Mill"; // always "Mill" for now
  workpiece: { width: number; depth: number; height: number }; // mm
  code: string;
}

export const CNC_EXAMPLES: CncExample[] = [
  /* ===================================================================== */
  /* 1) CIRCLE POCKET / BORE                                                */
  /* ===================================================================== */
  {
    id: "circle-bore",
    name: "Circle Pocket / Bore",
    description:
      "A simple circular pocket milled into the workpiece with a single " +
      "full-circle G02 arc. Great first look at how arc center offsets (I/J) " +
      "define a circle. Two depth passes clean up the bottom.",
    difficulty: "Beginner",
    machine: "Mill",
    workpiece: { width: 80, depth: 80, height: 10 },
    code: `
;
; ============================================================
; CIRCLE POCKET / BORE
; ============================================================
; Cuts a 50mm-diameter circular pocket 4mm deep into the stock.
; Tool: End Mill Ø6 (T1) — general purpose.
; Strategy: plunge to depth, single G02 full-circle pass per Z step.
;
%
G21 G90 G17              ; mm, absolute, XY plane
T1 M06                   ; load tool 1 (End Mill Ø6)
M03 S1200                ; spindle ON, 1200 RPM, clockwise
G00 Z5                   ; rapid to safe retract height
G00 X25 Y0               ; rapid to circle start (rightmost point, r=25)
G01 Z-2 F50              ; plunge to first depth, slow plunge feed
G02 X25 Y0 I-25 J0 F150  ; full circle CW (center offset I-25 J0 -> center at origin)
G01 Z-4 F50              ; plunge to final depth
G02 X25 Y0 I-25 J0 F150  ; second full-circle finish pass
G00 Z5                   ; retract to safe Z
M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 2) SQUARE POCKET WITH FINISH PASS                                      */
  /* ===================================================================== */
  {
    id: "square-pocket",
    name: "Square Pocket with Finish Pass",
    description:
      "A square pocket roughed out in three Z-steps, then a final finish " +
      "pass around the perimeter. Demonstrates purely linear G01 moves and " +
      "step-down (Z-increment) pocketing technique.",
    difficulty: "Beginner",
    machine: "Mill",
    workpiece: { width: 80, depth: 80, height: 10 },
    code: `
;
; ============================================================
; SQUARE POCKET WITH FINISH PASS
; ============================================================
; Cuts a 44x44mm square pocket 5mm deep, centered on origin.
; Tool path is the cutter centerline (cutter dia 6mm, wall 1mm).
; Tool: End Mill Ø6 (T1).
; Strategy: 3 roughing Z-steps (-2, -4, -5) + 1 finish pass at -5.
;
%
G21 G90 G17              ; mm, absolute, XY plane
T1 M06                   ; load tool 1 (End Mill Ø6)
M03 S1500                ; spindle ON, 1500 RPM
G00 Z5                   ; rapid to safe Z
G00 X-22 Y-22            ; rapid to lower-left corner of centerline path
G01 Z-2 F50              ; plunge to first roughing depth
G01 X22 Y-22 F200        ; cut bottom edge, left to right
G01 X22 Y22              ; cut right edge, bottom to top
G01 X-22 Y22             ; cut top edge, right to left
G01 X-22 Y-22            ; cut left edge, top to bottom (close loop)
G01 Z-4 F50              ; plunge to second roughing depth
G01 X22 Y-22 F200        ; repeat square at Z-4
G01 X22 Y22
G01 X-22 Y22
G01 X-22 Y-22
G01 Z-5 F50              ; plunge to final depth
G01 X22 Y-22 F200        ; repeat square at Z-5
G01 X22 Y22
G01 X-22 Y22
G01 X-22 Y-22
G01 X22 Y-22 F150        ; final finish pass (slower feed for better surface)
G01 X22 Y22
G01 X-22 Y22
G01 X-22 Y-22
G00 Z5                   ; retract to safe Z
M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 3) DRILLING CYCLE DEMO                                                 */
  /* ===================================================================== */
  {
    id: "drilling-demo",
    name: "Drilling Cycle Demo (G81)",
    description:
      "Drills five holes arranged in a cross pattern using the canned " +
      "drilling cycle G81. The first hole sets up the cycle (Z depth, R " +
      "retract plane, feed); subsequent holes need only X/Y. G80 cancels.",
    difficulty: "Beginner",
    machine: "Mill",
    workpiece: { width: 80, depth: 80, height: 10 },
    code: `
;
; ============================================================
; DRILLING CYCLE DEMO (G81)
; ============================================================
; Drills 5 holes, 6mm deep, in a cross pattern.
; Tool: Drill Ø3 (T3) — small drill for these holes.
; Hole positions: (15,15), (-15,15), (-15,-15), (15,-15), (0,0).
; G81 = canned drill cycle: rapid to R, feed to Z, rapid back to R.
;
%
G21 G90 G17              ; mm, absolute, XY plane
T3 M06                   ; load tool 3 (Drill Ø3)
M03 S3000                ; spindle ON, 3000 RPM (high speed for small drill)
G00 Z10                  ; rapid to safe Z (extra high for drilling)
G00 X15 Y15              ; rapid to first hole position
G81 X15 Y15 Z-6 R2 F60   ; start drill cycle: drill to Z-6, retract to Z=2, feed 60
X-15                     ; drill hole at (-15, 15) — G81 is modal
Y-15                     ; drill hole at (-15, -15)
X15                      ; drill hole at (15, -15)
X0 Y0                    ; drill center hole at (0, 0)
G80                      ; cancel canned cycle
G00 Z10                  ; retract to safe Z
M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 4) HEART SHAPE CONTOUR                                                  */
  /* ===================================================================== */
  {
    id: "heart-contour",
    name: "Heart Shape Contour",
    description:
      "Mills a heart-shaped outline using two G03 CCW arcs for the top humps " +
      "and two G01 lines for the V at the bottom. Run at two Z-steps to cut " +
      "through 4mm of stock. A classic arcs exercise.",
    difficulty: "Intermediate",
    machine: "Mill",
    workpiece: { width: 80, depth: 80, height: 10 },
    code: `
;
; ============================================================
; HEART SHAPE CONTOUR
; ============================================================
; Mills the outline of a heart, 4mm deep, centered on origin.
; Tool: End Mill Ø6 (T1).
; Geometry (all in mm):
;   - Top dip (notch between humps):  (0, 10)
;   - Left hump center:  (-15, 10),  radius 15  -> leftmost  (-30, 10), topmost (-15, 25)
;   - Right hump center: ( 15, 10),  radius 15  -> rightmost ( 30, 10), topmost ( 15, 25)
;   - Bottom point: (0, -25)
; Path traced CCW: dip -> left hump -> bottom -> right side -> right hump -> dip
;
%
G21 G90 G17              ; mm, absolute, XY plane
T1 M06                   ; load tool 1 (End Mill Ø6)
M03 S1800                ; spindle ON, 1800 RPM
G00 Z5                   ; rapid to safe Z
G00 X0 Y10               ; rapid to top dip (start of contour)

; --- first depth pass at Z-2 ---
G01 Z-2 F50              ; plunge to first depth
G03 X-30 Y10 I-15 J0 F150  ; LEFT hump: CCW arc to (-30,10), center (-15,10)
G01 X0 Y-25              ; diagonal down to bottom point
G01 X30 Y10              ; diagonal up to right side
G03 X0 Y10 I-15 J0       ; RIGHT hump: CCW arc back to dip, center (15,10)

; --- second depth pass at Z-4 ---
G01 Z-4 F50              ; plunge to final depth
G03 X-30 Y10 I-15 J0 F150  ; LEFT hump (second pass)
G01 X0 Y-25              ; down to bottom point
G01 X30 Y10              ; up to right side
G03 X0 Y10 I-15 J0       ; RIGHT hump (second pass)

G00 Z5                   ; retract to safe Z
M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 5) SPIRAL TOOLPATH                                                      */
  /* ===================================================================== */
  {
    id: "spiral-toolpath",
    name: "Spiral Toolpath",
    description:
      "Approximates an Archimedean spiral (r = 5 + 2*theta, 2 turns) using " +
      "48 short G01 linear segments. A common strategy for pocketing circular " +
      "cavities with constant chip load. Demonstrates how arcs can be " +
      "approximated by many small linear moves.",
    difficulty: "Intermediate",
    machine: "Mill",
    workpiece: { width: 80, depth: 80, height: 10 },
    code: `
;
; ============================================================
; SPIRAL TOOLPATH (Archimedean, 2 turns)
; ============================================================
; Approximates r = 5 + 2*theta (theta 0..4*pi) with 48 G01 segments.
; Spiral grows from r=5 (center) out to r~30 (edge).
; Tool: End Mill Ø6 (T1).
; Strategy: plunge once at center, then feed along the spiral at Z-2.
;
%
G21 G90 G17              ; mm, absolute, XY plane
T1 M06                   ; load tool 1 (End Mill Ø6)
M03 S2400                ; spindle ON, 2400 RPM
G00 Z5                   ; rapid to safe Z
G00 X5 Y0                ; rapid to spiral start (r=5 on +X axis)
G01 Z-2 F50              ; plunge to cutting depth
G01 X5 Y0 F200           ; stay at start (first point of spiral)
G01 X5.335 Y1.43         ; segment 1
G01 X5.237 Y3.024        ; segment 2
G01 X4.646 Y4.646        ; segment 3
G01 X3.547 Y6.144        ; segment 4
G01 X1.972 Y7.358        ; segment 5
G01 X0 Y8.142            ; segment 6
G01 X-2.243 Y8.37        ; segment 7
G01 X-4.594 Y7.958       ; segment 8
G01 X-6.868 Y6.868       ; segment 9
G01 X-8.865 Y5.118       ; segment 10
G01 X-10.393 Y2.785      ; segment 11
G01 X-11.283 Y0          ; segment 12 (quarter turn)
G01 X-11.404 Y-3.056     ; segment 13
G01 X-10.678 Y-6.165     ; segment 14
G01 X-9.089 Y-9.089      ; segment 15
G01 X-6.689 Y-11.585     ; segment 16
G01 X-3.598 Y-13.428     ; segment 17
G01 X0 Y-14.425          ; segment 18
G01 X3.869 Y-14.439      ; segment 19
G01 X7.736 Y-13.399      ; segment 20
G01 X11.311 Y-11.311     ; segment 21
G01 X14.306 Y-8.26       ; segment 22
G01 X16.462 Y-4.411      ; segment 23
G01 X17.566 Y0           ; segment 24 (half turn, r~17.5)
G01 X17.474 Y4.682       ; segment 25
G01 X16.12 Y9.307        ; segment 26
G01 X13.532 Y13.532      ; segment 27
G01 X9.83 Y17.027        ; segment 28
G01 X5.224 Y19.497       ; segment 29
G01 X0 Y20.708           ; segment 30
G01 X-5.495 Y20.508      ; segment 31
G01 X-10.878 Y18.841     ; segment 32
G01 X-15.753 Y15.753     ; segment 33
G01 X-19.747 Y11.401     ; segment 34
G01 X-22.531 Y6.037      ; segment 35
G01 X-23.85 Y0           ; segment 36 (three-quarter turn)
G01 X-23.543 Y-6.308     ; segment 37
G01 X-21.561 Y-12.448    ; segment 38
G01 X-17.975 Y-17.975    ; segment 39
G01 X-12.972 Y-22.468    ; segment 40
G01 X-6.85 Y-25.566      ; segment 41
G01 X0 Y-26.991          ; segment 42
G01 X7.121 Y-26.577      ; segment 43
G01 X14.019 Y-24.282     ; segment 44
G01 X20.196 Y-20.196     ; segment 45
G01 X25.189 Y-14.543     ; segment 46
G01 X28.6 Y-7.663        ; segment 47
G01 X30.133 Y0           ; segment 48 (spiral end, r~30)
G00 Z5                   ; retract to safe Z
M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 6) TEXT-LIKE ENGRAVING "HI"                                            */
  /* ===================================================================== */
  {
    id: "hi-engraving",
    name: 'Engraving "HI"',
    description:
      'Engraves the letters "HI" using pen-up/pen-down style Z moves. ' +
      "Between each stroke the tool retracts to safe Z (G00 Z5), rapids to " +
      "the next stroke start, then plunges back to cutting depth. Models " +
      "how plotters and engravers lift between strokes.",
    difficulty: "Intermediate",
    machine: "Mill",
    workpiece: { width: 80, depth: 60, height: 10 },
    code: `
;
; ============================================================
; ENGRAVING "HI"
; ============================================================
; Engraves the letters H and I, 1mm deep, on the workpiece.
; Tool: End Mill Ø6 (T1) — used as engraver.
; Geometry:
;   H: left  vertical at X=-20,  Y -15..15
;      right vertical at X= -5,  Y -15..15
;      horizontal bar    Y=  0,  X -20..-5
;   I: vertical at X=15,  Y -15..15
;      top serif at Y=15, X  5..25
;      bottom serif at Y=-15, X 5..25
; Pen-up = G00 Z5, pen-down = G01 Z-1.
;
%
G21 G90 G17              ; mm, absolute, XY plane
T1 M06                   ; load tool 1 (End Mill Ø6)
M03 S3000                ; spindle ON, 3000 RPM (high speed for engraving)
G00 Z5                   ; rapid to safe Z

; --- H: left vertical stroke ---
G00 X-20 Y-15            ; rapid to bottom of left vertical
G01 Z-1 F40              ; pen DOWN (plunge to engraving depth)
G01 X-20 Y15 F150        ; cut upward to top of left vertical
G00 Z5                   ; pen UP (retract)

; --- H: right vertical stroke ---
G00 X-5 Y-15             ; rapid to bottom of right vertical
G01 Z-1 F40              ; pen DOWN
G01 X-5 Y15 F150         ; cut upward to top of right vertical
G00 Z5                   ; pen UP

; --- H: horizontal bar ---
G00 X-20 Y0              ; rapid to left end of crossbar
G01 Z-1 F40              ; pen DOWN
G01 X-5 Y0 F150          ; cut across to right end
G00 Z5                   ; pen UP

; --- I: bottom serif ---
G00 X5 Y-15              ; rapid to left end of bottom serif
G01 Z-1 F40              ; pen DOWN
G01 X25 Y-15 F150        ; cut across to right end
G00 Z5                   ; pen UP

; --- I: vertical stem ---
G00 X15 Y-15             ; rapid to bottom of I stem
G01 Z-1 F40              ; pen DOWN
G01 X15 Y15 F150         ; cut upward to top of stem
G00 Z5                   ; pen UP

; --- I: top serif ---
G00 X5 Y15               ; rapid to left end of top serif
G01 Z-1 F40              ; pen DOWN
G01 X25 Y15 F150         ; cut across to right end
G00 Z5                   ; pen UP (final retract)

M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 7) GRID OF POCKETS                                                      */
  /* ===================================================================== */
  {
    id: "grid-pockets",
    name: "Grid of Pockets",
    description:
      "Mills a 2x2 grid of identical circular pockets. Demonstrates how to " +
      "structure a repeating-feature program: retract, rapid to next " +
      "feature, plunge, cut, repeat. A natural lead-in to subprograms.",
    difficulty: "Intermediate",
    machine: "Mill",
    workpiece: { width: 100, depth: 100, height: 10 },
    code: `
;
; ============================================================
; GRID OF POCKETS (2 x 2)
; ============================================================
; Cuts four 20mm-diameter circular pockets, 3mm deep, in a grid.
; Tool: End Mill Ø6 (T1).
; Pocket centers: (-25,-25), (25,-25), (-25,25), (25,25).
; Each pocket is a single full-circle G02 pass at Z-3.
;
%
G21 G90 G17              ; mm, absolute, XY plane
T1 M06                   ; load tool 1 (End Mill Ø6)
M03 S1800                ; spindle ON, 1800 RPM

; --- Pocket 1 at (-25, -25) ---
G00 Z5                   ; retract to safe Z
G00 X-15 Y-25            ; rapid to pocket 1 start (right edge of circle, r=10)
G01 Z-3 F40              ; plunge to depth, slow feed
G02 X-15 Y-25 I-10 J0 F180  ; full circle CW (center offset to (-25,-25))

; --- Pocket 2 at (25, -25) ---
G00 Z5                   ; retract to safe Z
G00 X35 Y-25             ; rapid to pocket 2 start (right edge of circle)
G01 Z-3 F40              ; plunge to depth
G02 X35 Y-25 I-10 J0 F180  ; full circle CW (center at (25,-25))

; --- Pocket 3 at (-25, 25) ---
G00 Z5                   ; retract to safe Z
G00 X-15 Y25             ; rapid to pocket 3 start
G01 Z-3 F40              ; plunge to depth
G02 X-15 Y25 I-10 J0 F180  ; full circle CW (center at (-25,25))

; --- Pocket 4 at (25, 25) ---
G00 Z5                   ; retract to safe Z
G00 X35 Y25              ; rapid to pocket 4 start
G01 Z-3 F40              ; plunge to depth
G02 X35 Y25 I-10 J0 F180  ; full circle CW (center at (25,25))

G00 Z5                   ; final retract to safe Z
M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 8) GEAR-SHAPED POCKET                                                   */
  /* ===================================================================== */
  {
    id: "gear-pocket",
    name: "Gear-Shaped Pocket",
    description:
      "Mills the outline of an 8-tooth spur gear using alternating G03 arcs " +
      "(tooth tips at R28, valley floors at R22) connected by short G01 " +
      "radial transitions. Two depth passes cut a 6mm-deep gear profile. " +
      "A workout in polar coordinate planning and arc-center math.",
    difficulty: "Advanced",
    machine: "Mill",
    workpiece: { width: 80, depth: 80, height: 10 },
    code: `
;
; ============================================================
; GEAR-SHAPED POCKET (8 teeth)
; ============================================================
; Mills the outline of an 8-tooth gear, 6mm deep, centered on origin.
; Tool: End Mill Ø6 (T1).
; Geometry:
;   - Outer (tip) radius: R = 28
;   - Root (valley) radius: R = 22
;   - 8 teeth, 45 deg per tooth: 18 deg tip arc, 4.5 deg transition,
;     18 deg valley arc, 4.5 deg transition.
;   - All arcs are G03 (CCW) around the gear center (origin).
;   - Transitions are G01 (linear) radial-ish moves.
; Strategy: 2 depth passes (-3, -6) for a clean 6mm-deep gear profile.
;
%
G21 G90 G17              ; mm, absolute, XY plane
T1 M06                   ; load tool 1 (End Mill Ø6)
M03 S2000                ; spindle ON, 2000 RPM
G00 Z5                   ; rapid to safe Z
G00 X28 Y0               ; rapid to tooth 1 tip (right side, angle 0)

; --- first depth pass at Z-3 ---
G01 Z-3 F50              ; plunge to first depth
G03 X26.63 Y8.652 I-28 J0            ; tooth 1 tip arc (R28, 0..18 deg)
G01 X20.325 Y8.419                   ; transition tip -> root
G03 X16.729 Y14.288 I-20.325 J-8.419 ; valley floor arc (R22)
G01 X19.799 Y19.799                  ; transition root -> next tooth
G03 X12.712 Y24.948 I-19.799 J-19.799 ; tooth 2 tip arc
G01 X8.419 Y20.325                   ; transition tip -> root
G03 X1.726 Y21.932 I-8.419 J-20.325  ; valley floor arc
G01 X0 Y28                           ; transition root -> next tooth
G03 X-8.652 Y26.63 I0 J-28           ; tooth 3 tip arc
G01 X-8.419 Y20.325                  ; transition tip -> root
G03 X-14.288 Y16.729 I8.419 J-20.325 ; valley floor arc
G01 X-19.799 Y19.799                 ; transition root -> next tooth
G03 X-24.948 Y12.712 I19.799 J-19.799 ; tooth 4 tip arc
G01 X-20.325 Y8.419                  ; transition tip -> root
G03 X-21.932 Y1.726 I20.325 J-8.419  ; valley floor arc
G01 X-28 Y0                          ; transition root -> next tooth
G03 X-26.63 Y-8.652 I28 J0           ; tooth 5 tip arc
G01 X-20.325 Y-8.419                 ; transition tip -> root
G03 X-16.729 Y-14.288 I20.325 J8.419 ; valley floor arc
G01 X-19.799 Y-19.799                ; transition root -> next tooth
G03 X-12.712 Y-24.948 I19.799 J19.799 ; tooth 6 tip arc
G01 X-8.419 Y-20.325                 ; transition tip -> root
G03 X-1.726 Y-21.932 I8.419 J20.325  ; valley floor arc
G01 X0 Y-28                          ; transition root -> next tooth
G03 X8.652 Y-26.63 I0 J28            ; tooth 7 tip arc
G01 X8.419 Y-20.325                  ; transition tip -> root
G03 X14.288 Y-16.729 I-8.419 J20.325 ; valley floor arc
G01 X19.799 Y-19.799                 ; transition root -> next tooth
G03 X24.948 Y-12.712 I-19.799 J19.799 ; tooth 8 tip arc
G01 X20.325 Y-8.419                  ; transition tip -> root
G03 X21.932 Y-1.726 I-20.325 J8.419  ; valley floor arc
G01 X28 Y0                           ; transition root -> back to start

; --- second depth pass at Z-6 (repeat contour at full depth) ---
G01 Z-6 F50              ; plunge to final depth
G03 X26.63 Y8.652 I-28 J0            ; tooth 1 tip arc
G01 X20.325 Y8.419                   ; transition tip -> root
G03 X16.729 Y14.288 I-20.325 J-8.419 ; valley floor arc
G01 X19.799 Y19.799                  ; transition root -> next tooth
G03 X12.712 Y24.948 I-19.799 J-19.799 ; tooth 2 tip arc
G01 X8.419 Y20.325                   ; transition tip -> root
G03 X1.726 Y21.932 I-8.419 J-20.325  ; valley floor arc
G01 X0 Y28                           ; transition root -> next tooth
G03 X-8.652 Y26.63 I0 J-28           ; tooth 3 tip arc
G01 X-8.419 Y20.325                  ; transition tip -> root
G03 X-14.288 Y16.729 I8.419 J-20.325 ; valley floor arc
G01 X-19.799 Y19.799                 ; transition root -> next tooth
G03 X-24.948 Y12.712 I19.799 J-19.799 ; tooth 4 tip arc
G01 X-20.325 Y8.419                  ; transition tip -> root
G03 X-21.932 Y1.726 I20.325 J-8.419  ; valley floor arc
G01 X-28 Y0                          ; transition root -> next tooth
G03 X-26.63 Y-8.652 I28 J0           ; tooth 5 tip arc
G01 X-20.325 Y-8.419                 ; transition tip -> root
G03 X-16.729 Y-14.288 I20.325 J8.419 ; valley floor arc
G01 X-19.799 Y-19.799                ; transition root -> next tooth
G03 X-12.712 Y-24.948 I19.799 J19.799 ; tooth 6 tip arc
G01 X-8.419 Y-20.325                 ; transition tip -> root
G03 X-1.726 Y-21.932 I8.419 J20.325  ; valley floor arc
G01 X0 Y-28                          ; transition root -> next tooth
G03 X8.652 Y-26.63 I0 J28            ; tooth 7 tip arc
G01 X8.419 Y-20.325                  ; transition tip -> root
G03 X14.288 Y-16.729 I-8.419 J20.325 ; valley floor arc
G01 X19.799 Y-19.799                 ; transition root -> next tooth
G03 X24.948 Y-12.712 I-19.799 J19.799 ; tooth 8 tip arc
G01 X20.325 Y-8.419                  ; transition tip -> root
G03 X21.932 Y-1.726 I-20.325 J8.419  ; valley floor arc
G01 X28 Y0                           ; transition root -> back to start

G00 Z5                   ; retract to safe Z
M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 9) STAR PATTERN WITH FILLET ARCS                                       */
  /* ===================================================================== */
  {
    id: "star-pattern",
    name: "Star Pattern with Filleted Corners",
    description:
      "Mills a 5-pointed star (outer R30, inner R12). The 5 inner notches " +
      "are rounded with small R2 G02 fillet arcs that smoothly connect the " +
      "two adjacent edges, demonstrating how to blend a sharp corner into " +
      "an arc tangent to both incoming and outgoing moves. Two depth passes.",
    difficulty: "Advanced",
    machine: "Mill",
    workpiece: { width: 80, depth: 80, height: 10 },
    code: `
;
; ============================================================
; STAR PATTERN WITH FILLET ARCS
; ============================================================
; Mills a 5-point star outline, 4mm deep, centered on origin.
; Tool: End Mill Ø6 (T1).
; Geometry:
;   - Outer points at R = 30 (top, then every 72 deg CCW)
;   - Inner vertices at R = 12 (between outer points)
;   - At each inner vertex, a small R2 G02 arc rounds the notch.
;   - Arc center is on the air-side bisector, tangent to both edges.
; Strategy: 2 depth passes (-2, -4) for a clean 4mm-deep star.
;
%
G21 G90 G17              ; mm, absolute, XY plane
T1 M06                   ; load tool 1 (End Mill Ø6)
M03 S2200                ; spindle ON, 2200 RPM
G00 Z5                   ; rapid to safe Z
G00 X0 Y30               ; rapid to top point of star (outer vertex 0)

; --- first depth pass at Z-2 ---
G01 Z-2 F50              ; plunge to first depth
G01 X-6.596 Y11.023              ; approach rounded inner corner (left-upper)
G02 X-8.445 Y9.68 I-1.889 J0.657 ; fillet arc R2 (CCW path, CW fillet)
G01 X-28.532 Y9.271              ; outer point (left)
G01 X-12.522 Y-2.867             ; approach rounded inner corner (left-lower)
G02 X-11.816 Y-5.04 I-1.208 J-1.594 ; fillet arc R2
G01 X-17.634 Y-24.271            ; outer point (lower-left)
G01 X-1.142 Y-12.795             ; approach rounded inner corner (bottom)
G02 X1.142 Y-12.795 I1.142 J-1.642 ; fillet arc R2
G01 X17.634 Y-24.271             ; outer point (lower-right)
G01 X11.816 Y-5.04               ; approach rounded inner corner (right-lower)
G02 X12.522 Y-2.867 I1.914 J0.579 ; fillet arc R2
G01 X28.532 Y9.271               ; outer point (right)
G01 X8.445 Y9.68                 ; approach rounded inner corner (right-upper)
G02 X6.596 Y11.023 I0.041 J2     ; fillet arc R2
G01 X0 Y30                       ; close star outline back to top point

; --- second depth pass at Z-4 ---
G01 Z-4 F50              ; plunge to final depth
G01 X-6.596 Y11.023              ; approach rounded inner corner
G02 X-8.445 Y9.68 I-1.889 J0.657 ; fillet arc R2
G01 X-28.532 Y9.271              ; outer point (left)
G01 X-12.522 Y-2.867             ; approach rounded inner corner
G02 X-11.816 Y-5.04 I-1.208 J-1.594 ; fillet arc R2
G01 X-17.634 Y-24.271            ; outer point (lower-left)
G01 X-1.142 Y-12.795             ; approach rounded inner corner
G02 X1.142 Y-12.795 I1.142 J-1.642 ; fillet arc R2
G01 X17.634 Y-24.271             ; outer point (lower-right)
G01 X11.816 Y-5.04               ; approach rounded inner corner
G02 X12.522 Y-2.867 I1.914 J0.579 ; fillet arc R2
G01 X28.532 Y9.271               ; outer point (right)
G01 X8.445 Y9.68                 ; approach rounded inner corner
G02 X6.596 Y11.023 I0.041 J2     ; fillet arc R2
G01 X0 Y30                       ; close star outline

G00 Z5                   ; retract to safe Z
M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 10) FLOWER / DAISY                                                      */
  /* ===================================================================== */
  {
    id: "flower-daisy",
    name: "Flower / Daisy",
    description:
      "Engraves a 6-petal daisy. Each petal is a leaf/lens shape formed by " +
      "two G02 arcs (top arc + bottom arc) that meet at the petal tip and " +
      "base. The cutter lifts to safe Z between petals. A study in arc " +
      "tangency and rotational placement of repeated geometry.",
    difficulty: "Advanced",
    machine: "Mill",
    workpiece: { width: 80, depth: 80, height: 10 },
    code: `
;
; ============================================================
; FLOWER / DAISY (6 petals)
; ============================================================
; Engraves a 6-petal daisy outline, 2mm deep, centered on origin.
; Tool: Ball Nose Ø6 (T4) — rounded tip gives a smooth engraving.
; Geometry per petal (local: base at origin, tip at +X distance L=20):
;   - Petal length L = 20 (base r=5, tip r=25)
;   - Petal width w = 8 (max half-width at midpoint)
;   - Two arcs of radius R = 14.5, centers offset perpendicular by h = 10.5
;   - Petal axis at angles 0, 60, 120, 180, 240, 300 deg
; Each petal: G00 to base, G02 to tip (top arc), G02 back to base (bottom arc).
;
%
G21 G90 G17              ; mm, absolute, XY plane
T4 M06                   ; load tool 4 (Ball Nose Ø6)
M03 S3000                ; spindle ON, 3000 RPM
G00 Z5                   ; rapid to safe Z

; --- Petal 1 (axis at 0 deg, +X) ---
G00 X5 Y0                ; rapid to petal 1 base
G01 Z-2 F40              ; plunge to depth
G02 X25 Y0 I10 J-10.5 F200  ; top arc to tip (center offset 10,-10.5)
G02 X5 Y0 I-10 J10.5       ; bottom arc back to base (center offset -10,10.5)
G00 Z5                     ; retract between petals

; --- Petal 2 (axis at 60 deg) ---
G00 X2.5 Y4.33           ; rapid to petal 2 base
G01 Z-2 F40              ; plunge
G02 X12.5 Y21.651 I14.093 J3.41  ; top arc to tip
G02 X2.5 Y4.33 I-14.093 J-3.41  ; bottom arc back to base
G00 Z5                   ; retract

; --- Petal 3 (axis at 120 deg) ---
G00 X-2.5 Y4.33          ; rapid to petal 3 base
G01 Z-2 F40              ; plunge
G02 X-12.5 Y21.651 I4.093 J13.91  ; top arc to tip
G02 X-2.5 Y4.33 I-4.093 J-13.91  ; bottom arc back to base
G00 Z5                   ; retract

; --- Petal 4 (axis at 180 deg, -X) ---
G00 X-5 Y0               ; rapid to petal 4 base
G01 Z-2 F40              ; plunge
G02 X-25 Y0 I-10 J10.5      ; top arc to tip
G02 X-5 Y0 I10 J-10.5       ; bottom arc back to base
G00 Z5                   ; retract

; --- Petal 5 (axis at 240 deg) ---
G00 X-2.5 Y-4.33         ; rapid to petal 5 base
G01 Z-2 F40              ; plunge
G02 X-12.5 Y-21.651 I-14.093 J-3.41  ; top arc to tip
G02 X-2.5 Y-4.33 I14.093 J3.41       ; bottom arc back to base
G00 Z5                   ; retract

; --- Petal 6 (axis at 300 deg) ---
G00 X2.5 Y-4.33          ; rapid to petal 6 base
G01 Z-2 F40              ; plunge
G02 X12.5 Y-21.651 I-4.093 J-13.91  ; top arc to tip
G02 X2.5 Y-4.33 I4.093 J13.91       ; bottom arc back to base
G00 Z5                   ; final retract

M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 11) FACE SURFACING (zig-zag)                                           */
  /* ===================================================================== */
  {
    id: "face-surface",
    name: "Face Surfacing (Zig-Zag)",
    description:
      "Skim-cuts the entire top of the stock flat with a 50mm face mill in " +
      "a zig-zag pattern. Demonstrates the very first operation in most CNC " +
      "jobs: truing up the top surface of rough stock. Three passes per " +
      "depth level with 30mm stepover for 80% tool coverage.",
    difficulty: "Beginner",
    machine: "Mill",
    workpiece: { width: 100, depth: 80, height: 10 },
    code: `
;
; ============================================================
; FACE SURFACING (zig-zag)
; ============================================================
; Skim-cuts the entire top of the stock flat with a 50mm face mill.
; Tool: Face Mill Ø50 (T6).
; Strategy: 3 parallel passes (Y=-30, 0, +30) in a zig-zag pattern,
;   30mm stepover (~60% of tool dia for good coverage), 0.5mm depth per
;   pass, 2 depth levels (Z-0.5 then Z-1.0).
;
%
G21 G90 G17              ; mm, absolute, XY plane
T6 M06                   ; load face mill Ø50
M03 S3000                ; spindle ON, 3000 RPM (face mills like high RPM)
G00 Z5                   ; rapid to safe Z

; --- first depth level at Z-0.5 ---
G00 X-40 Y-30            ; rapid to start of pass 1 (lower-left)
G01 Z-0.5 F200           ; plunge to skim depth
G01 X40 Y-30 F500        ; pass 1: cut +X direction (bottom row)
G01 X40 Y0               ; stepover in Y to middle row (still cutting)
G01 X-40 Y0 F500         ; pass 2: cut -X direction (middle, return)
G01 X-40 Y30             ; stepover in Y to top row
G01 X40 Y30 F500         ; pass 3: cut +X direction (top row)
G00 Z5                   ; retract

; --- second depth level at Z-1.0 (final clean-up) ---
G00 X-40 Y-30            ; rapid back to start
G01 Z-1 F200             ; plunge to final depth
G01 X40 Y-30 F500        ; pass 1
G01 X40 Y0               ; stepover
G01 X-40 Y0 F500         ; pass 2
G01 X-40 Y30             ; stepover
G01 X40 Y30 F500         ; pass 3
G00 Z5                   ; retract to safe Z
M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 12) HEXAGONAL POCKET                                                    */
  /* ===================================================================== */
  {
    id: "hex-pocket",
    name: "Hexagonal Pocket",
    description:
      "Mills a 6-sided (hexagonal) pocket outline using only G01 linear " +
      "segments. A regular hexagon with vertex radius 20mm (flat-to-flat " +
      "~34.6mm). Two depth passes for a 4mm-deep pocket.",
    difficulty: "Intermediate",
    machine: "Mill",
    workpiece: { width: 80, depth: 80, height: 10 },
    code: `
;
; ============================================================
; HEXAGONAL POCKET
; ============================================================
; Mills a 6-sided (hexagonal) pocket, 4mm deep, centered on origin.
; Tool: End Mill Ø6 (T1).
; Geometry: regular hexagon, vertex radius R=20 (flat-to-flat ≈ 34.6mm).
;   Vertices at angles 0, 60, 120, 180, 240, 300 deg.
; Strategy: 2 depth passes (-2, -4) tracing the hexagon outline.
;
%
G21 G90 G17              ; mm, absolute, XY plane
T1 M06                   ; load end mill Ø6
M03 S1800                ; spindle ON, 1800 RPM
G00 Z5                   ; rapid to safe Z
G00 X20 Y0               ; rapid to vertex 1 (angle 0)

; --- first depth pass at Z-2 ---
G01 Z-2 F50              ; plunge to first depth
G01 X10 Y17.32 F200      ; to vertex 2 (angle 60)
G01 X-10 Y17.32          ; to vertex 3 (angle 120)
G01 X-20 Y0              ; to vertex 4 (angle 180)
G01 X-10 Y-17.32         ; to vertex 5 (angle 240)
G01 X10 Y-17.32          ; to vertex 6 (angle 300)
G01 X20 Y0               ; close hexagon (back to vertex 1)

; --- second depth pass at Z-4 ---
G01 Z-4 F50              ; plunge to final depth
G01 X10 Y17.32 F200      ; vertex 2
G01 X-10 Y17.32          ; vertex 3
G01 X-20 Y0              ; vertex 4
G01 X-10 Y-17.32         ; vertex 5
G01 X10 Y-17.32          ; vertex 6
G01 X20 Y0               ; close hexagon

G00 Z5                   ; retract to safe Z
M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 13) RECTANGLE CONTOUR WITH CUTTER COMP (G41)                           */
  /* ===================================================================== */
  {
    id: "rect-cutter-comp",
    name: "Rectangle Contour with Cutter Comp (G41)",
    description:
      "Cuts a 60x40mm rectangular outside profile using G41 cutter " +
      "compensation LEFT. The simulator follows the programmed centerline " +
      "(cutter comp is parsed but not applied); on a real machine the " +
      "control would offset the tool 3mm to the left of travel. Includes " +
      "lead-in/lead-out moves and two depth passes.",
    difficulty: "Intermediate",
    machine: "Mill",
    workpiece: { width: 100, depth: 80, height: 10 },
    code: `
;
; ============================================================
; RECTANGLE CONTOUR WITH CUTTER COMP (G41)
; ============================================================
; Cuts a 60x40mm rectangular outside profile, 4mm deep, using
; G41 cutter compensation LEFT (tool offsets 3mm to the left of the
; programmed path). The simulator follows the programmed centerline
; (cutter comp is parsed but not applied); on a real machine the
; control would offset the tool to the left of travel.
; Tool: End Mill Ø6 (T1).
; Strategy: lead-in to enable comp, trace rectangle CW, lead-out to
;   disable comp. 2 depth passes.
;
%
G21 G90 G17              ; mm, absolute, XY plane
T1 M06                   ; load end mill Ø6
M03 S1800                ; spindle ON, 1800 RPM
G00 Z5                   ; rapid to safe Z
G00 X-40 Y-20            ; rapid to lead-in start (clear of part)

; --- first depth pass at Z-2 ---
G01 Z-2 F50              ; plunge to first depth
G41 D1 X-30 Y-20 F150    ; enable cutter comp LEFT, lead-in to corner 1
G01 X-30 Y20             ; left edge (upward, +Y)
G01 X30 Y20              ; top edge (rightward, +X)
G01 X30 Y-20             ; right edge (downward, -Y)
G01 X-30 Y-20            ; bottom edge (leftward, -X, close)
G40 X-40 Y-20            ; disable cutter comp, lead-out

; --- second depth pass at Z-4 ---
G01 Z-4 F50              ; plunge to final depth
G41 D1 X-30 Y-20 F150    ; re-enable cutter comp
G01 X-30 Y20             ; left edge
G01 X30 Y20              ; top edge
G01 X30 Y-20             ; right edge
G01 X-30 Y-20            ; bottom edge
G40 X-40 Y-20            ; disable cutter comp, lead-out

G00 Z5                   ; retract to safe Z
M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 14) CIRCLE BORE WITH ROUGH + FINISH PASSES                             */
  /* ===================================================================== */
  {
    id: "circle-bore-finish",
    name: "Circle Bore with Rough + Finish Passes",
    description:
      "Cuts a 60mm-diameter circular bore 5mm deep using TWO tools: T2 " +
      "(End Mill Ø10) roughs the bore in 3 Z-steps leaving 1mm of stock on " +
      "the wall, then T1 (End Mill Ø6) takes a single finish pass at full " +
      "depth for a smooth wall surface. Demonstrates tool changes and " +
      "rough/finish strategy.",
    difficulty: "Intermediate",
    machine: "Mill",
    workpiece: { width: 100, depth: 100, height: 10 },
    code: `
;
; ============================================================
; CIRCLE BORE WITH ROUGH + FINISH PASSES
; ============================================================
; Cuts a 60mm-diameter circular bore 5mm deep using TWO tools:
;   - T2 (End Mill Ø10) roughs the bore in 3 Z-steps, leaving 1mm
;     of stock on the wall (cutter centerline at r=24).
;   - T1 (End Mill Ø6) takes a single finish pass at full depth
;     (cutter centerline at r=27, leaving the wall at r=30).
; Demonstrates tool changes and rough/finish strategy.
;
%
G21 G90 G17              ; mm, absolute, XY plane

; --- roughing with T2 (End Mill Ø10) ---
T2 M06                   ; load roughing end mill Ø10
M03 S1500                ; spindle ON, 1500 RPM (slower for bigger tool)
G00 Z5                   ; rapid to safe Z
G00 X24 Y0               ; rapid to rough circle start (r=24)
G01 Z-2 F50              ; first rough pass at Z-2
G02 X24 Y0 I-24 J0 F200  ; full circle CW
G01 Z-4 F50              ; second rough pass at Z-4
G02 X24 Y0 I-24 J0 F200  ; full circle CW
G01 Z-5 F50              ; final rough pass at Z-5
G02 X24 Y0 I-24 J0 F200  ; full circle CW
G00 Z5                   ; retract for tool change
M05                      ; spindle OFF

; --- finishing with T1 (End Mill Ø6) ---
T1 M06                   ; load finishing end mill Ø6
M03 S2200                ; spindle ON, 2200 RPM (faster for finish)
G00 Z5                   ; rapid to safe Z
G00 X27 Y0               ; rapid to finish circle start (r=27)
G01 Z-5 F50              ; plunge to final depth (single finish pass)
G02 X27 Y0 I-27 J0 F150  ; full circle CW, slower feed for surface finish
G00 Z5                   ; retract to safe Z
M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 15) PECK DRILLING ARRAY (G83)                                          */
  /* ===================================================================== */
  {
    id: "peck-drill-array",
    name: "Peck Drilling Array (G83)",
    description:
      "Peck-drills a 3x3 grid of 3mm holes, 6mm deep, using the G83 canned " +
      "peck-drilling cycle. G83 breaks chips by retracting (or partially " +
      "retracting) after each peck depth Q. The simulator simplifies this " +
      "to a single plunge per hole, but the G-code is correct for a real " +
      "machine.",
    difficulty: "Intermediate",
    machine: "Mill",
    workpiece: { width: 100, depth: 80, height: 10 },
    code: `
;
; ============================================================
; PECK DRILLING ARRAY (G83)
; ============================================================
; Peck-drills a 3x3 grid of 3mm holes, 6mm deep, using G83.
; Tool: Drill Ø3 (T3).
; G83 = peck drilling cycle: rapid to R, feed down by Q (peck depth),
;   rapid back to R (or small retract for chip breaking), repeat until
;   Z depth reached. The simulator simplifies this to a single plunge.
; Hole grid: X = -25, 0, +25; Y = -20, 0, +20 (9 holes total).
;
%
G21 G90 G17              ; mm, absolute, XY plane
T3 M06                   ; load drill Ø3
M03 S3000                ; spindle ON, 3000 RPM (high speed for small drill)
G00 Z10                  ; rapid to safe Z (extra high for drilling)
G00 X-25 Y-20            ; rapid to first hole (bottom-left)
G83 X-25 Y-20 Z-6 R2 Q2 F60  ; start peck cycle: Z-6, R=2, peck Q=2, feed 60
X0                      ; hole (0, -20) — G83 is modal
X25                      ; hole (25, -20)
Y0                      ; hole (25, 0)
X0                      ; hole (0, 0) — center
X-25                     ; hole (-25, 0)
Y20                      ; hole (-25, 20)
X0                      ; hole (0, 20)
X25                      ; hole (25, 20)
G80                      ; cancel canned cycle
G00 Z10                  ; retract to safe Z
M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 16) SLOT CUTTING (straight slot, multi-pass)                           */
  /* ===================================================================== */
  {
    id: "slot-cutting",
    name: "Slot Cutting (Straight Slot)",
    description:
      "Cuts a straight 6mm-wide slot (one tool diameter), 5mm deep, " +
      "centered on origin and oriented along the X axis. Five depth passes " +
      "alternate direction each pass (climb then conventional) for a " +
      "cleaner slot floor and walls.",
    difficulty: "Beginner",
    machine: "Mill",
    workpiece: { width: 80, depth: 60, height: 10 },
    code: `
;
; ============================================================
; SLOT CUTTING (straight slot, multi-pass)
; ============================================================
; Cuts a straight 6mm-wide slot (one tool diameter), 5mm deep,
; centered on origin, oriented along the X axis.
; Tool: End Mill Ø6 (T1) — slot width equals tool diameter.
; Strategy: 5 depth passes (Z-1 to Z-5), alternating direction each
;   pass (climb then conventional) for a cleaner slot floor.
;
%
G21 G90 G17              ; mm, absolute, XY plane
T1 M06                   ; load end mill Ø6
M03 S2000                ; spindle ON, 2000 RPM
G00 Z5                   ; rapid to safe Z
G00 X-25 Y0              ; rapid to slot left end (centerline)
G01 Z-1 F50              ; plunge to depth 1
G01 X25 Y0 F200          ; cut slot to right end
G01 Z-2 F50              ; plunge to depth 2 (at right end)
G01 X-25 Y0 F200         ; cut back to left end
G01 Z-3 F50              ; plunge to depth 3
G01 X25 Y0 F200          ; cut to right end
G01 Z-4 F50              ; plunge to depth 4
G01 X-25 Y0 F200         ; cut back to left end
G01 Z-5 F50              ; plunge to final depth
G01 X25 Y0 F200          ; final cut to right end
G00 Z5                   ; retract to safe Z
M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 17) CIRCULAR POCKET WITH CENTER ISLAND                                 */
  /* ===================================================================== */
  {
    id: "circular-island",
    name: "Circular Pocket with Center Island",
    description:
      "Mills an annular pocket: a 70mm-diameter outer pocket with a central " +
      "20mm-diameter island pillar left standing. Uses multiple concentric " +
      "circular passes stepping inward (5mm stepover) to clear the annular " +
      "floor between the island wall and the outer wall. Two depth passes.",
    difficulty: "Advanced",
    machine: "Mill",
    workpiece: { width: 100, depth: 100, height: 10 },
    code: `
;
; ============================================================
; CIRCULAR POCKET WITH CENTER ISLAND
; ============================================================
; Mills an annular pocket: outer pocket 70mm dia (r=35), with a
; central island pillar 20mm dia (r=10) left standing.
; Tool: End Mill Ø6 (T1, r=3).
; Strategy: multiple concentric circular passes stepping inward
;   (stepover 5mm) to clear the annular floor between r=13 (island
;   wall + tool radius) and r=32 (outer wall - tool radius).
;   2 depth passes (-2, -4).
;
%
G21 G90 G17              ; mm, absolute, XY plane
T1 M06                   ; load end mill Ø6
M03 S1800                ; spindle ON, 1800 RPM
G00 Z5                   ; rapid to safe Z

; --- first depth pass at Z-2 ---
G00 X32 Y0               ; rapid to outer ring start (r=32)
G01 Z-2 F50              ; plunge to first depth
G02 X32 Y0 I-32 J0 F200  ; outer ring CW (r=32)
G01 X27 Y0               ; radial move inward to r=27
G03 X27 Y0 I-27 J0       ; ring r=27 CCW (alternate direction)
G01 X22 Y0               ; radial move to r=22
G02 X22 Y0 I-22 J0       ; ring r=22 CW
G01 X17 Y0               ; radial move to r=17
G03 X17 Y0 I-17 J0       ; ring r=17 CCW
G01 X13 Y0               ; radial move to r=13 (island wall)
G02 X13 Y0 I-13 J0       ; inner ring CW (r=13)

; --- second depth pass at Z-4 ---
G00 Z5                   ; retract
G00 X32 Y0               ; re-position to outer ring
G01 Z-4 F50              ; plunge to final depth
G02 X32 Y0 I-32 J0 F200  ; outer ring CW
G01 X27 Y0               ; radial inward
G03 X27 Y0 I-27 J0       ; ring r=27 CCW
G01 X22 Y0               ; radial inward
G02 X22 Y0 I-22 J0       ; ring r=22 CW
G01 X17 Y0               ; radial inward
G03 X17 Y0 I-17 J0       ; ring r=17 CCW
G01 X13 Y0               ; radial inward to island wall
G02 X13 Y0 I-13 J0       ; inner ring CW

G00 Z5                   ; retract to safe Z
M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 18) ENGRAVING "CNC"                                                    */
  /* ===================================================================== */
  {
    id: "engrave-cnc",
    name: 'Engraving "CNC"',
    description:
      'Engraves the letters C-N-C, 1mm deep, using pen-up/pen-down Z moves. ' +
      "Each C is a 240° G03 arc that opens to the right; the N is three " +
      "connected G01 strokes (left vertical, diagonal, right vertical). " +
      "A study in mixed arc/linear engraving.",
    difficulty: "Intermediate",
    machine: "Mill",
    workpiece: { width: 100, depth: 60, height: 10 },
    code: `
;
; ============================================================
; ENGRAVING "CNC"
; ============================================================
; Engraves the letters C-N-C, 1mm deep, using pen-up/pen-down
; (Z retract between strokes).
; Tool: End Mill Ø6 (T1, used as engraver).
; Geometry (each letter 20mm tall, 17.32mm wide):
;   - C1 centered at X=-25: 240° G03 arc (radius 10), opens right
;   - N  centered at X=  0: 3 G01 strokes (left vertical, diagonal,
;     right vertical)
;   - C2 centered at X=+25: same as C1
;
%
G21 G90 G17              ; mm, absolute, XY plane
T1 M06                   ; load end mill Ø6
M03 S3000                ; spindle ON, 3000 RPM (high speed for engraving)
G00 Z5                   ; rapid to safe Z

; --- C1 (first C, centered at -25, 0) ---
G00 X-20 Y8.66           ; rapid to C1 top-right (start of arc)
G01 Z-1 F40              ; pen DOWN (plunge to engraving depth)
G03 X-20 Y-8.66 I-5 J-8.66 F200  ; C arc CCW 240° (through top, left, bottom)
G00 Z5                   ; pen UP (retract)

; --- N (centered at 0, 0) ---
G00 X-5 Y-8.66           ; rapid to N bottom-left
G01 Z-1 F40              ; pen DOWN
G01 X-5 Y8.66 F200       ; left vertical (upward)
G01 X5 Y-8.66            ; diagonal (down-right)
G01 X5 Y8.66             ; right vertical (upward)
G00 Z5                   ; pen UP

; --- C2 (second C, centered at +25, 0) ---
G00 X30 Y8.66            ; rapid to C2 top-right
G01 Z-1 F40              ; pen DOWN
G03 X30 Y-8.66 I-5 J-8.66 F200  ; C arc CCW 240°
G00 Z5                   ; pen UP (final retract)

M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 19) DOVETAIL-ISH SLOT (stepped approximation)                          */
  /* ===================================================================== */
  {
    id: "dovetail-slot",
    name: "Dovetail-ish Slot (Stepped)",
    description:
      "Cuts a slot with angled side walls (a dovetail), approximated by 5 " +
      "stepped rectangular passes. Each pass is 1mm deeper and 2mm wider " +
      "than the previous, producing a 45° wall angle. The terraced walls " +
      "approximate a continuous dovetail. A real dovetail would use a " +
      "dedicated dovetail cutter.",
    difficulty: "Advanced",
    machine: "Mill",
    workpiece: { width: 100, depth: 80, height: 10 },
    code: `
;
; ============================================================
; DOVETAIL-ISH SLOT (stepped approximation)
; ============================================================
; Cuts a slot with angled side walls (a dovetail), approximated by
; 5 stepped rectangular passes. Each pass is 1mm deeper and 2mm wider
; than the previous, producing a 45° wall angle.
; Tool: End Mill Ø6 (T1).
; Final slot: 40mm long (X), top width 22mm, bottom width 30mm, depth 5mm.
; Strategy: at each Z level, cut a rectangle of the appropriate width.
;   The terraced walls approximate a continuous dovetail.
;
%
G21 G90 G17              ; mm, absolute, XY plane
T1 M06                   ; load end mill Ø6
M03 S1800                ; spindle ON, 1800 RPM
G00 Z5                   ; rapid to safe Z

; --- Z-1 pass (slot width 22mm, top of dovetail) ---
G00 X-20 Y-11            ; rapid to lower-left of pass 1
G01 Z-1 F50              ; plunge to depth 1
G01 X20 Y-11 F200        ; bottom edge (+X)
G01 X20 Y11              ; right edge (+Y)
G01 X-20 Y11             ; top edge (-X)
G01 X-20 Y-11            ; left edge (-Y, close)
G00 Z5                   ; retract

; --- Z-2 pass (slot width 24mm) ---
G00 X-20 Y-12
G01 Z-2 F50
G01 X20 Y-12 F200
G01 X20 Y12
G01 X-20 Y12
G01 X-20 Y-12
G00 Z5

; --- Z-3 pass (slot width 26mm) ---
G00 X-20 Y-13
G01 Z-3 F50
G01 X20 Y-13 F200
G01 X20 Y13
G01 X-20 Y13
G01 X-20 Y-13
G00 Z5

; --- Z-4 pass (slot width 28mm) ---
G00 X-20 Y-14
G01 Z-4 F50
G01 X20 Y-14 F200
G01 X20 Y14
G01 X-20 Y14
G01 X-20 Y-14
G00 Z5

; --- Z-5 pass (slot width 30mm, bottom of dovetail) ---
G00 X-20 Y-15
G01 Z-5 F50
G01 X20 Y-15 F200
G01 X20 Y15
G01 X-20 Y15
G01 X-20 Y-15
G00 Z5                   ; retract to safe Z

M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 20) BOLT CIRCLE PATTERN (spot + drill)                                 */
  /* ===================================================================== */
  {
    id: "bolt-circle",
    name: "Bolt Circle Pattern (Spot + Drill)",
    description:
      "Drills 8 holes on a 60mm-diameter bolt circle (radius 30mm) using " +
      "two tools: T7 (Spot Drill Ø8) spots each hole to create a conical " +
      "start, then T3 (Drill Ø3) drills through. Hole angles at 0, 45, 90, " +
      "135, 180, 225, 270, 315°. A classic production drilling pattern.",
    difficulty: "Advanced",
    machine: "Mill",
    workpiece: { width: 100, depth: 100, height: 10 },
    code: `
;
; ============================================================
; BOLT CIRCLE PATTERN (spot + drill)
; ============================================================
; Drills 8 holes on a 60mm-diameter bolt circle (radius 30) using
; two tools:
;   - T7 (Spot Drill Ø8) spots each hole (Z-2) to create a conical
;     start for the drill.
;   - T3 (Drill Ø3) drills through (Z-8).
; Hole angles: 0, 45, 90, 135, 180, 225, 270, 315 deg.
;
%
G21 G90 G17              ; mm, absolute, XY plane

; --- step 1: spot drill with T7 ---
T7 M06                   ; load spot drill Ø8
M03 S2000                ; spindle ON, 2000 RPM
G00 Z10                  ; rapid to safe Z
G00 X30 Y0               ; rapid to hole 1 (angle 0)
G81 X30 Y0 Z-2 R2 F80    ; spot drill hole 1 (depth 2mm)
X21.21 Y21.21            ; hole 2 (45°)
X0 Y30                   ; hole 3 (90°)
X-21.21 Y21.21           ; hole 4 (135°)
X-30 Y0                  ; hole 5 (180°)
X-21.21 Y-21.21          ; hole 6 (225°)
X0 Y-30                  ; hole 7 (270°)
X21.21 Y-21.21           ; hole 8 (315°)
G80                      ; cancel canned cycle
G00 Z10                  ; retract
M05                      ; spindle OFF

; --- step 2: drill through with T3 ---
T3 M06                   ; load drill Ø3
M03 S3000                ; spindle ON, 3000 RPM
G00 Z10                  ; rapid to safe Z
G00 X30 Y0               ; rapid to hole 1
G81 X30 Y0 Z-8 R2 F60    ; drill hole 1 through (depth 8mm)
X21.21 Y21.21            ; hole 2
X0 Y30                   ; hole 3
X-21.21 Y21.21           ; hole 4
X-30 Y0                  ; hole 5
X-21.21 Y-21.21          ; hole 6
X0 Y-30                  ; hole 7
X21.21 Y-21.21           ; hole 8
G80                      ; cancel canned cycle
G00 Z10                  ; retract to safe Z
M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 21) CAM LOBE PROFILE (tangent arcs + flanks)                           */
  /* ===================================================================== */
  {
    id: "cam-lobe",
    name: "Cam Lobe Profile",
    description:
      "Mills a cam profile: a base circle (r=15) with a tangent lobe " +
      "rising to (0, 30). The profile is traced CW as a 240° base arc " +
      "through the bottom, then two straight flanks tangent to the base " +
      "circle that meet at the lobe tip. The flanks are mathematically " +
      "tangent to the base circle at the transition points, giving a " +
      "smooth profile with no corners. Two depth passes.",
    difficulty: "Advanced",
    machine: "Mill",
    workpiece: { width: 100, depth: 100, height: 10 },
    code: `
;
; ============================================================
; CAM LOBE PROFILE (tangent arcs + flanks)
; ============================================================
; Mills a cam profile: a base circle (r=15) with a tangent lobe
; rising to (0, 30). The profile is traced CW:
;   - Base arc: 240° of the base circle (through bottom)
;   - Left flank: straight line tangent to base, up to lobe tip
;   - Right flank: straight line tangent to base, back down to start
; The flanks are mathematically tangent to the base circle at the
; transition points (12.99, 7.5) and (-12.99, 7.5), giving a smooth
; profile with no corners.
; Tool: End Mill Ø6 (T1).
; Strategy: 2 depth passes (-3, -6).
;
%
G21 G90 G17              ; mm, absolute, XY plane
T1 M06                   ; load end mill Ø6
M03 S1800                ; spindle ON, 1800 RPM
G00 Z5                   ; rapid to safe Z
G00 X12.99 Y7.5          ; rapid to right tangent point (start)

; --- first depth pass at Z-3 ---
G01 Z-3 F50              ; plunge to first depth
G02 X-12.99 Y7.5 I-12.99 J-7.5 F200  ; base arc CW 240° (through bottom)
G01 X0 Y30                          ; left flank to lobe tip
G01 X12.99 Y7.5                     ; right flank back to start

; --- second depth pass at Z-6 ---
G01 Z-6 F50              ; plunge to final depth
G02 X-12.99 Y7.5 I-12.99 J-7.5 F200  ; base arc CW 240°
G01 X0 Y30                          ; left flank to tip
G01 X12.99 Y7.5                     ; right flank back to start

G00 Z5                   ; retract to safe Z
M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 22) TEXT "2024" ENGRAVING                                              */
  /* ===================================================================== */
  {
    id: "text-2024",
    name: 'Text "2024" Engraving',
    description:
      'Engraves the year "2024", 1mm deep, using pen-up/pen-down. The two ' +
      "\"2\" digits are 4 connected G01 strokes each; the \"0\" is a rounded " +
      "rectangle (4 G01 edges + 4 G02 corner arcs); the \"4\" is a " +
      "diagonal+vertical continuous stroke plus a horizontal bar. Total " +
      "width 52mm, centered on origin.",
    difficulty: "Intermediate",
    machine: "Mill",
    workpiece: { width: 100, depth: 60, height: 10 },
    code: `
;
; ============================================================
; TEXT "2024" ENGRAVING
; ============================================================
; Engraves the year "2024", 1mm deep, using pen-up/pen-down.
; Tool: End Mill Ø6 (T1, used as engraver).
; Geometry: 4 digits, each 10mm wide × 18mm tall, with 4mm gaps.
;   - "2": 4 G01 strokes (top, right-upper, diagonal, bottom)
;   - "0": rounded rectangle (4 G01 edges + 4 G02 corner arcs)
;   - "2": same as first "2"
;   - "4": 2 strokes (diagonal+vertical continuous, then horizontal)
; Layout: digits centered on origin, total width 52mm.
;
%
G21 G90 G17              ; mm, absolute, XY plane
T1 M06                   ; load end mill Ø6
M03 S3000                ; spindle ON, 3000 RPM
G00 Z5                   ; rapid to safe Z

; --- digit "2" (first, leftmost, X range -26 to -16) ---
G00 X-26 Y9              ; rapid to top-left of "2"
G01 Z-1 F40              ; pen DOWN
G01 X-16 Y9 F200         ; top horizontal
G01 X-16 Y0              ; right vertical (upper half)
G01 X-26 Y-9             ; diagonal (down-left)
G01 X-16 Y-9             ; bottom horizontal
G00 Z5                   ; pen UP

; --- digit "0" (second, X range -12 to -2) ---
G00 X-12 Y6.5            ; rapid to left edge (just below top-left corner)
G01 Z-1 F40              ; pen DOWN
G02 X-9.5 Y9 I2.5 J0 F200  ; top-left corner arc (CW)
G01 X-4.5 Y9               ; top edge
G02 X-2 Y6.5 I0 J-2.5      ; top-right corner arc
G01 X-2 Y-6.5              ; right edge
G02 X-4.5 Y-9 I-2.5 J0     ; bot-right corner arc
G01 X-9.5 Y-9              ; bottom edge
G02 X-12 Y-6.5 I0 J2.5     ; bot-left corner arc
G01 X-12 Y6.5              ; left edge (close)
G00 Z5                     ; pen UP

; --- digit "2" (third, X range 2 to 12) ---
G00 X2 Y9                 ; rapid to top-left of "2"
G01 Z-1 F40               ; pen DOWN
G01 X12 Y9 F200           ; top horizontal
G01 X12 Y0                ; right vertical (upper half)
G01 X2 Y-9                ; diagonal
G01 X12 Y-9               ; bottom horizontal
G00 Z5                    ; pen UP

; --- digit "4" (fourth, rightmost, X range 16 to 26) ---
G00 X17 Y-3               ; rapid to start of diagonal
G01 Z-1 F40               ; pen DOWN
G01 X22 Y9 F200           ; diagonal up to top
G01 X22 Y-9               ; vertical down to bottom
G00 Z5                    ; pen UP
G00 X17 Y0                ; rapid to start of horizontal bar
G01 Z-1 F40               ; pen DOWN
G01 X25 Y0 F200           ; horizontal bar
G00 Z5                    ; pen UP (final retract)

M05                       ; spindle OFF
M30                       ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 23) KEYWAY SLOT                                                         */
  /* ===================================================================== */
  {
    id: "keyway-slot",
    name: "Keyway Slot",
    description:
      "Cuts a standard keyway slot: 40mm long, 6mm wide (one tool " +
      "diameter), 4mm deep, with rounded ends naturally formed by the " +
      "round tool. Four depth passes alternate direction. A single " +
      "straight pass per Z level creates the full slot because the slot " +
      "width equals the tool diameter.",
    difficulty: "Beginner",
    machine: "Mill",
    workpiece: { width: 80, depth: 60, height: 10 },
    code: `
;
; ============================================================
; KEYWAY SLOT
; ============================================================
; Cuts a standard keyway slot: 40mm long, 6mm wide (one tool dia),
; 4mm deep, with rounded ends (naturally formed by the round tool).
; Tool: End Mill Ø6 (T1).
; Strategy: 4 depth passes alternating direction. Slot is one tool
;   wide, so a single straight pass per Z level creates the full slot.
;
%
G21 G90 G17              ; mm, absolute, XY plane
T1 M06                   ; load end mill Ø6
M03 S2200                ; spindle ON, 2200 RPM
G00 Z5                   ; rapid to safe Z
G00 X-17 Y0              ; rapid to slot left end (centerline, X=-17)
G01 Z-1 F50              ; plunge to depth 1
G01 X17 Y0 F200          ; cut slot to right end (X=+17)
G01 Z-2 F50              ; plunge to depth 2
G01 X-17 Y0 F200         ; cut back to left end
G01 Z-3 F50              ; plunge to depth 3
G01 X17 Y0 F200          ; cut to right end
G01 Z-4 F50              ; plunge to final depth
G01 X-17 Y0 F200         ; final cut back to left end
G00 Z5                   ; retract to safe Z
M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 24) STAR BURST RAYS                                                     */
  /* ===================================================================== */
  {
    id: "star-burst",
    name: "Star Burst Rays",
    description:
      "Engraves 8 radial rays emanating from the center, 1mm deep. Each " +
      "ray starts at r=5 (inner) and extends to r=30 (outer), at angles " +
      "0, 45, 90, 135, 180, 225, 270, 315°. Uses pen-up/pen-down between " +
      "rays. A simple decorative engraving pattern.",
    difficulty: "Intermediate",
    machine: "Mill",
    workpiece: { width: 80, depth: 80, height: 10 },
    code: `
;
; ============================================================
; STAR BURST RAYS
; ============================================================
; Engraves 8 radial rays emanating from the center, 1mm deep.
; Tool: End Mill Ø6 (T1, used as engraver).
; Geometry: each ray starts at r=5 (inner) and extends to r=30 (outer),
;   at angles 0, 45, 90, 135, 180, 225, 270, 315 deg.
; Strategy: pen-up/pen-down between rays.
;
%
G21 G90 G17              ; mm, absolute, XY plane
T1 M06                   ; load end mill Ø6
M03 S2500                ; spindle ON, 2500 RPM
G00 Z5                   ; rapid to safe Z

; --- ray 1 (0°, +X axis) ---
G00 X5 Y0                ; rapid to ray 1 inner end
G01 Z-1 F40              ; pen DOWN
G01 X30 Y0 F250          ; cut to outer end
G00 Z5                   ; pen UP

; --- ray 2 (45°) ---
G00 X3.54 Y3.54          ; rapid to ray 2 inner end
G01 Z-1 F40              ; pen DOWN
G01 X21.21 Y21.21 F250   ; cut to outer end
G00 Z5                   ; pen UP

; --- ray 3 (90°, +Y axis) ---
G00 X0 Y5                ; rapid to ray 3 inner end
G01 Z-1 F40              ; pen DOWN
G01 X0 Y30 F250          ; cut to outer end
G00 Z5                   ; pen UP

; --- ray 4 (135°) ---
G00 X-3.54 Y3.54         ; rapid to ray 4 inner end
G01 Z-1 F40              ; pen DOWN
G01 X-21.21 Y21.21 F250  ; cut to outer end
G00 Z5                   ; pen UP

; --- ray 5 (180°, -X axis) ---
G00 X-5 Y0               ; rapid to ray 5 inner end
G01 Z-1 F40              ; pen DOWN
G01 X-30 Y0 F250         ; cut to outer end
G00 Z5                   ; pen UP

; --- ray 6 (225°) ---
G00 X-3.54 Y-3.54        ; rapid to ray 6 inner end
G01 Z-1 F40              ; pen DOWN
G01 X-21.21 Y-21.21 F250 ; cut to outer end
G00 Z5                   ; pen UP

; --- ray 7 (270°, -Y axis) ---
G00 X0 Y-5               ; rapid to ray 7 inner end
G01 Z-1 F40              ; pen DOWN
G01 X0 Y-30 F250         ; cut to outer end
G00 Z5                   ; pen UP

; --- ray 8 (315°) ---
G00 X3.54 Y-3.54         ; rapid to ray 8 inner end
G01 Z-1 F40              ; pen DOWN
G01 X21.21 Y-21.21 F250  ; cut to outer end
G00 Z5                   ; pen UP (final retract)

M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 25) CONCENTRIC RINGS (nested pockets, different depths)                */
  /* ===================================================================== */
  {
    id: "concentric-rings",
    name: "Concentric Rings",
    description:
      "Cuts 3 concentric circular grooves at 3 different depths: outer " +
      "ring at r=27 (depth Z-2), middle ring at r=17 (depth Z-4), inner " +
      "ring at r=7 (depth Z-6). Each ring is a single full-circle pass " +
      "where the groove width equals the tool diameter. Creates a " +
      "stepped-well visual when viewed from above.",
    difficulty: "Intermediate",
    machine: "Mill",
    workpiece: { width: 100, depth: 100, height: 10 },
    code: `
;
; ============================================================
; CONCENTRIC RINGS (nested pockets, different depths)
; ============================================================
; Cuts 3 concentric circular grooves at 3 different depths:
;   - Outer ring: r=27, depth Z-2 (cuts r=24 to r=30)
;   - Middle ring: r=17, depth Z-4 (cuts r=14 to r=20)
;   - Inner ring: r=7, depth Z-6 (cuts r=4 to r=10)
; Tool: End Mill Ø6 (T1).
; Strategy: single full-circle pass per ring (groove width = tool dia).
;
%
G21 G90 G17              ; mm, absolute, XY plane
T1 M06                   ; load end mill Ø6
M03 S1800                ; spindle ON, 1800 RPM
G00 Z5                   ; rapid to safe Z

; --- outer ring at r=27, depth Z-2 ---
G00 X27 Y0               ; rapid to outer ring start
G01 Z-2 F50              ; plunge to depth 2
G02 X27 Y0 I-27 J0 F200  ; full circle CW (r=27)
G00 Z5                   ; retract

; --- middle ring at r=17, depth Z-4 ---
G00 X17 Y0               ; rapid to middle ring start
G01 Z-4 F50              ; plunge to depth 4
G02 X17 Y0 I-17 J0 F200  ; full circle CW (r=17)
G00 Z5                   ; retract

; --- inner ring at r=7, depth Z-6 ---
G00 X7 Y0                ; rapid to inner ring start
G01 Z-6 F50              ; plunge to depth 6
G02 X7 Y0 I-7 J0 F200    ; full circle CW (r=7)
G00 Z5                   ; retract to safe Z

M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },

  /* ===================================================================== */
  /* 26) TROPHY / BASE PLATE (multi-tool combination)                       */
  /* ===================================================================== */
  {
    id: "trophy-base",
    name: "Trophy / Base Plate (Multi-Tool)",
    description:
      "Machines a trophy base plate using 4 tools in sequence: T6 face " +
      "mill skims the top flat, T1 end mill cuts a 40x30 rectangular " +
      "pocket, T3 drill puts 4 corner holes through, and T5 chamfer tool " +
      "breaks the perimeter edge. Demonstrates a complete multi-operation " +
      "CNC workflow with multiple tool changes.",
    difficulty: "Advanced",
    machine: "Mill",
    workpiece: { width: 100, depth: 80, height: 10 },
    code: `
;
; ============================================================
; TROPHY / BASE PLATE (multi-tool combination)
; ============================================================
; Machines a trophy base plate using 4 tools in sequence:
;   1. T6 (Face Mill Ø50): skim-cut the top flat (zig-zag)
;   2. T1 (End Mill Ø6): mill a 40x30 rectangular pocket, 3mm deep
;   3. T3 (Drill Ø3): drill 4 corner holes through (Z-8)
;   4. T5 (Chamfer Ø10 90°): chamfer the perimeter edge (Z-1)
; Workpiece: 100 x 80 x 10 mm.
; Demonstrates a complete multi-operation workflow.
;
%
G21 G90 G17              ; mm, absolute, XY plane

; ===== Step 1: Face mill the top with T6 =====
T6 M06                   ; load face mill Ø50
M03 S3000                ; spindle ON, 3000 RPM
G00 Z5                   ; rapid to safe Z
G00 X-40 Y-30            ; rapid to zig-zag start (lower-left)
G01 Z-0.5 F200           ; plunge to skim depth
G01 X40 Y-30 F500        ; pass 1 (+X, bottom row)
G01 X40 Y0               ; stepover in Y
G01 X-40 Y0 F500         ; pass 2 (-X, middle row)
G01 X-40 Y30             ; stepover in Y
G01 X40 Y30 F500         ; pass 3 (+X, top row)
G00 Z5                   ; retract
M05                      ; spindle OFF

; ===== Step 2: Rectangular pocket with T1 =====
T1 M06                   ; load end mill Ø6
M03 S1800                ; spindle ON, 1800 RPM
G00 Z5                   ; rapid to safe Z
G00 X-17 Y-12            ; rapid to pocket lower-left (centerline)
G01 Z-1 F50              ; plunge to depth 1
G01 X17 Y-12 F200        ; bottom edge
G01 X17 Y12              ; right edge
G01 X-17 Y12             ; top edge
G01 X-17 Y-12            ; left edge (close)
G01 Z-2 F50              ; plunge to depth 2
G01 X17 Y-12 F200
G01 X17 Y12
G01 X-17 Y12
G01 X-17 Y-12
G01 Z-3 F50              ; plunge to final depth
G01 X17 Y-12 F200
G01 X17 Y12
G01 X-17 Y12
G01 X-17 Y-12
G00 Z5                   ; retract
M05                      ; spindle OFF

; ===== Step 3: Drill 4 corner holes with T3 =====
T3 M06                   ; load drill Ø3
M03 S3000                ; spindle ON, 3000 RPM
G00 Z10                  ; rapid to safe Z
G00 X-35 Y-25            ; rapid to hole 1 (lower-left)
G81 X-35 Y-25 Z-8 R2 F60 ; drill hole 1 through (8mm deep)
X35                      ; hole 2 (lower-right)
Y25                      ; hole 3 (upper-right)
X-35                     ; hole 4 (upper-left)
G80                      ; cancel canned cycle
G00 Z10                  ; retract
M05                      ; spindle OFF

; ===== Step 4: Chamfer perimeter with T5 =====
T5 M06                   ; load chamfer tool Ø10 90°
M03 S2200                ; spindle ON, 2200 RPM
G00 Z5                   ; rapid to safe Z
G00 X-40 Y-30            ; rapid to chamfer start (inset 10mm from edge)
G01 Z-1 F50              ; plunge to chamfer depth
G01 X40 Y-30 F300        ; bottom edge chamfer
G01 X40 Y30              ; right edge chamfer
G01 X-40 Y30             ; top edge chamfer
G01 X-40 Y-30            ; left edge chamfer (close)
G00 Z5                   ; retract to safe Z
M05                      ; spindle OFF
M30                      ; program end & rewind
`,
  },
];
