"use client";

import {
  Rocket,
  Keyboard,
  Compass,
  Code2,
  Lightbulb,
  BookOpen,
  PlayCircle,
  MousePointerClick,
  Cpu,
} from "lucide-react";

function Section({
  icon: Icon,
  title,
  color,
  children,
}: {
  icon: React.ElementType;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
      <div className="mb-2 flex items-center gap-2">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{ background: `${color}22`, color }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <h3 className="text-xs font-semibold text-slate-100">{title}</h3>
      </div>
      <div className="space-y-1.5 text-[11px] leading-relaxed text-slate-400">
        {children}
      </div>
    </section>
  );
}

const KBDS: { keys: string; desc: string }[] = [
  { keys: "Space", desc: "Play / Pause the simulation" },
  { keys: "→", desc: "Step forward one block" },
  { keys: "←", desc: "Step back one block" },
  { keys: "R", desc: "Reset to the start" },
  { keys: "Drag", desc: "Orbit the 3D camera" },
  { keys: "Scroll", desc: "Zoom in / out" },
];

export default function GuidePanel() {
  return (
    <div className="h-full overflow-y-auto bg-[#0b0d10] p-3 [scrollbar-width:thin]">
      <div className="mx-auto max-w-2xl space-y-3">
        {/* Hero */}
        <div className="rounded-lg border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent p-4">
          <div className="mb-1 flex items-center gap-2">
            <Rocket className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100">
              Welcome to CNC Simulator Pro
            </h2>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            A professional, browser-based simulator for 3-axis CNC milling.
            Write or load G-code, watch a high-fidelity 3-axis machine carve
            your part in real time, and learn every <strong>G</strong>,{" "}
            <strong>M</strong>, <strong>T</strong>, <strong>F</strong>,{" "}
            <strong>S</strong> and <strong>Z</strong> code along the way.
          </p>
        </div>

        {/* How to use */}
        <Section icon={PlayCircle} title="How to use the simulator" color="#22d3ee">
          <Step n={1}>
            Pick a program from the dropdown (top of the Program tab) — or just
            start typing your own G-code in the editor.
          </Step>
          <Step n={2}>
            Press <Kbd>Space</Kbd> or the big <strong>Play</strong> button to
            run the simulation. The spindle spins, the tool follows your
            toolpath, and the workpiece is carved live.
          </Step>
          <Step n={3}>
            Drag in the 3D view to orbit, scroll to zoom. Toggle the toolpath,
            grid and enclosure from the top-right buttons.
          </Step>
          <Step n={4}>
            Use the timeline scrubber to seek anywhere, or step block-by-block
            with <Kbd>←</Kbd> <Kbd>→</Kbd> for detailed study.
          </Step>
          <Step n={5}>
            Adjust <strong>Cycle Speed</strong> (0.25×–10×) and the Feed / Rapid
            / Spindle overrides to see how each affects machining time.
          </Step>
        </Section>

        {/* Code primer */}
        <Section icon={Code2} title="G-code quick primer" color="#a78bfa">
          <p>
            A CNC program is a list of <em>blocks</em> (lines). Each block tells
            the machine one thing to do. Words are a letter + a number, e.g.{" "}
            <code className="rounded bg-black/50 px-1 text-cyan-300">G01 X20 F150</code>.
          </p>
          <ul className="ml-3 list-disc space-y-1">
            <li>
              <code className="text-cyan-300">G-codes</code> — motion &amp; mode
              (G00 rapid, G01 cut, G02/03 arcs, G90 absolute…)
            </li>
            <li>
              <code className="text-amber-300">M-codes</code> — machine
              functions (M03 spindle on, M08 coolant, M06 tool change, M30 end)
            </li>
            <li>
              <code className="text-violet-300">T</code> — tool number ·{" "}
              <code className="text-yellow-300">F</code> — feed rate ·{" "}
              <code className="text-rose-300">S</code> — spindle RPM
            </li>
            <li>
              <code className="text-emerald-300">X Y Z</code> — target
              coordinates (Z+ = up / safe, Z− = cutting depth)
            </li>
            <li>
              <code className="text-blue-300">I J K</code> — arc-center offsets
              from the <em>start</em> point
            </li>
          </ul>
          <pre className="mt-2 overflow-x-auto rounded bg-black/50 p-2 font-mono text-[10px] leading-relaxed text-slate-300">
{`G21 G90 G17          ; mm, absolute, XY plane
T1 M06                ; load tool 1
M03 S2500             ; spindle on, 2500 rpm
G00 Z5                ; rapid to safe height
G00 X-20 Y-20         ; rapid to start
G01 Z-2 F50           ; plunge 2mm
G01 X20 Y-20 F150     ; cut a line
G01 X20 Y20
G01 X-20 Y20
G01 X-20 Y-20
G00 Z5                ; retract
M05 M30               ; spindle off, program end`}
          </pre>
        </Section>

        {/* Coordinate system */}
        <Section icon={Compass} title="Coordinate system" color="#34d399">
          <p>
            The part <strong>zero</strong> (origin) sits at the center of the
            workpiece top surface. X runs left↔right, Y runs front↔back, Z runs
            up↕down.
          </p>
          <ul className="ml-3 list-disc space-y-1">
            <li>
              <span className="text-emerald-400">Z = 0</span> = top of stock.{" "}
              <span className="text-emerald-400">Z = −5</span> = 5 mm deep cut.
            </li>
            <li>
              <span className="text-emerald-400">Z = +5</span> = safe retract
              (travel above the part).
            </li>
            <li>
              Always <code className="text-amber-300">G00 Z5</code> (retract)
              before any XY move between features — this is rule #1 of CNC.
            </li>
          </ul>
        </Section>

        {/* Programming tips */}
        <Section icon={Lightbulb} title="Programming tips" color="#f59e0b">
          <ul className="ml-3 list-disc space-y-1">
            <li>
              <strong>Ramp into cuts.</strong> Don't plunge an end mill straight
              down at full depth — helix or ramp in at an angle.
            </li>
            <li>
              <strong>Step down.</strong> For deep pockets, take several Z
              passes (Z-1, Z-2, Z-3…) rather than one big bite.
            </li>
            <li>
              <strong>Use comments.</strong> A <code className="text-slate-400">;</code>{" "}
              or <code className="text-slate-400">( )</code> comment on every
              block helps you (and the sim) stay sane.
            </li>
            <li>
              <strong>Mind the arc center.</strong> I and J are measured from the
              arc <em>start</em>, not from origin. Get this wrong and the sim
              will warn you.
            </li>
            <li>
              <strong>End cleanly.</strong> <code className="text-amber-300">M05</code>{" "}
              (spindle off) then <code className="text-amber-300">M30</code>{" "}
              (program end &amp; reset).
            </li>
          </ul>
        </Section>

        {/* Keyboard */}
        <Section icon={Keyboard} title="Keyboard shortcuts" color="#fb7185">
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {KBDS.map((k) => (
              <div
                key={k.keys}
                className="flex items-center gap-2 rounded-md border border-white/8 bg-black/30 px-2 py-1"
              >
                <Kbd>{k.keys}</Kbd>
                <span className="text-slate-400">{k.desc}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Click to seek */}
        <Section icon={MousePointerClick} title="Pro tip: click-to-seek" color="#38bdf8">
          <p>
            Click any line in the G-code editor to jump the 3D simulation
            straight to that block — perfect for studying exactly how a single
            move carves the part.
          </p>
        </Section>

        <div className="flex items-center gap-2 px-1 py-2 text-[10px] text-slate-600">
          <Cpu className="h-3 w-3" />
          <span>
            Built with Next.js, react-three-fiber &amp; a custom G-code
            interpreter.
          </span>
        </div>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 font-mono text-[9px] font-bold text-cyan-300">
        {n}
      </span>
      <span>{children}</span>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[20px] items-center justify-center rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-slate-200">
      {children}
    </kbd>
  );
}

// silence unused import warning for BookOpen (kept for future use)
void BookOpen;
