# 🛠️ CNC Simulator Pro

> A professional, browser-based **3-axis CNC milling simulator** with real-time G-code animation, a high-fidelity 3D machine, a powerful controller console, and a complete learning suite for G/M/T/F/S/Z codes.

Built with **Next.js 16**, **react-three-fiber**, **Three.js**, **TypeScript**, **Tailwind CSS 4**, and **shadcn/ui**. 100% client-side — deploys to **GitHub Pages** as a static site.

---

## ✨ Features

### 🎯 3D Machine & Simulation
- **High-fidelity gantry VMC** — base, table with T-slots, columns, moving bridge (Y), carriage (X), telescoping quill (Z), spindle motor, safety-glass enclosure
- **Real material removal** — a subdivided heightmap workpiece that gets *actually milled* as the tool follows the program
- **Per-tool geometry** — end mills, ball noses, drills, chamfers, face mills, spot drills and reamers each render their real shape and carve with their real diameter
- **Live toolpath** — cyan feed moves + amber dashed rapids, with arc tessellation
- **PBR materials, soft shadows, environment reflections, fog, infinite grid**
- **Camera presets** — Iso / Top / Front / Right / Reset, plus orbit / zoom

### 🎛️ Unique Advanced Control Bar
- **LCD-style DRO** — live X / Y / Z coordinates with cutting indicator
- **Status lamps** — spindle RPM, feed rate, active tool, coolant
- **Transport** — reset, step-back, play/pause, step-forward, single-block
- **Machine modes** — **Run** (full cut) / **Dry Run** (no material cut) / **Machine Lock** (toolpath preview only)
- **Optional stop (M01)** and **Block skip (/)** toggles
- **Timeline scrubber** with elapsed / remaining cycle time + block counter
- **Cycle speed** — 0.25× to 10× presets
- **Override knobs** — Feed / Rapid / Spindle % sliders that genuinely affect timing
- **Keyboard shortcuts** — `Space` play/pause, `←/→` step, `R` reset

### 💻 Manual G-code Programming
- **Full code editor** with syntax highlighting (color-coded G/M/T/F/S/X/Y/Z/I/J)
- **Line numbers + current-execution-line tracking** (highlights the block running in 3D)
- **Click-a-line-to-seek** — click any line to jump the simulation to that block
- **Parse diagnostics** — errors and warnings shown inline with line numbers
- **26 ready-to-run example programs** (Beginner → Advanced): circle pocket, square pocket, drilling, heart, spiral, "HI" engraving, grid pockets, gear, star, flower, face surfacing, hex pocket, cutter comp, circle bore, peck drill array, slot, island pocket, "CNC" engraving, dovetail, bolt circle, cam lobe, "2024", keyway, star burst, concentric rings, trophy base plate

### 🔧 Tool Library (8 pre-configured tools)
| T# | Tool | Diameter | Use |
|----|------|----------|-----|
| T1 | End Mill | Ø6 mm | General pockets, slots, profiles |
| T2 | End Mill | Ø10 mm | Roughing bigger features |
| T3 | Drill | Ø3 mm | Holes (G81/G83) |
| T4 | Ball Nose | Ø6 mm | 3D surfacing |
| T5 | Chamfer | Ø10 mm 90° | Edge breaking, spotting |
| T6 | Face Mill | Ø50 mm | Surfacing stock flat |
| T7 | Spot Drill | Ø8 mm | Accurate hole spotting |
| T8 | Reamer | Ø5 mm | Precision finished holes |

Each tool renders its real geometry and carves with its real diameter. The **Tools** tab shows all tools, highlights the active one, and marks which tools the current program uses.

### 🧱 Material Library (8 materials)
Aluminum 6061/7075, Mild Steel, Stainless 304, Brass, Copper, Delrin, Oak — each with recommended surface speed (Vc), chip load (fz), max depth of cut, and coolant recommendation. **Selecting a material changes the workpiece color in the 3D view.**

### 📐 Feeds & Speeds Calculator
Pick a tool + material, adjust axial/radial/feed overrides, and get live:
- **RPM** = (Vc × 1000) / (π × D)
- **Feed** = fz × flutes × RPM
- **MRR** (material removal rate, cm³/min)
- **Spindle power** estimate (kW)
- **Recommended DOC / WOC**
- Contextual warnings (rubbing risk, RPM cap, work-hardening, etc.)

### 💾 Program Library (save / load / export / import)
- **Save** the current editor content + workpiece to browser `localStorage`
- **Load** any saved program back into the editor
- **Download** a single program as a `.nc` file
- **Export All** / **Import** the entire library as JSON
- **15 code snippets** (header, tool change, circular pocket, drilling cycle, profile, finish pass, surfacing, etc.) — click to insert into the editor

### 📚 Comprehensive Learning
- **Reference tab** — 65 CNC codes (G/M/T/F/S/Z) with descriptions, examples, and tips, fully searchable and category-filtered
- **Guide tab** — how-to steps, G-code primer, coordinate system, programming tips, keyboard shortcuts

---

## 🚀 Deploy to GitHub Pages

This project is configured for **static export** and includes a GitHub Action that builds and deploys automatically.

### Option A — Automatic (recommended)

1. **Create a new GitHub repository** and push this project's source code to it:
   ```bash
   git init
   git add .
   git commit -m "CNC Simulator Pro"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**: go to your repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.

3. The included workflow (`.github/workflows/deploy.yml`) will automatically build and deploy on every push to `main`. Wait ~2 minutes, then visit:
   ```
   https://<YOUR_USERNAME>.github.io/<YOUR_REPO>/
   ```

> The `basePath` is auto-detected from your repo name — no configuration needed.

### Option B — Manual build

```bash
bun install
# For a project page (username.github.io/REPO):
NEXT_PUBLIC_BASE_PATH="/REPO" bun run build
# For a user page (username.github.io):
bun run build
```
The static site is generated in `out/`. Upload the **contents** of `out/` to your `gh-pages` branch or the root of your GitHub Pages site. The `.nojekyll` file is included automatically.

---

## 🧑‍💻 Local Development

```bash
bun install
bun run dev      # http://localhost:3000
bun run lint     # ESLint check
```

Requirements: Node 18+ / Bun 1.0+.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `→` | Step forward one block |
| `←` | Step back one block |
| `R` | Reset to start |

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout + metadata
│   └── page.tsx            # Main page (3D viewport + tabbed panel + control bar)
├── components/
│   ├── cnc/
│   │   ├── CncScene.tsx        # 3D machine (react-three-fiber)
│   │   ├── ControlBar.tsx      # Controller console
│   │   ├── GCodeEditor.tsx     # Syntax-highlighted editor
│   │   ├── ProgramPanel.tsx    # Example selector + editor + diagnostics
│   │   ├── ProgramManager.tsx  # Save/load/export/import + snippets
│   │   ├── ToolManager.tsx     # Tool library browser
│   │   ├── MaterialPanel.tsx   # Material library selector
│   │   ├── FeedsCalculator.tsx # Feeds & speeds calculator
│   │   ├── CodeReference.tsx   # 65-code reference
│   │   ├── GuidePanel.tsx      # Educational guide
│   │   └── SceneOverlay.tsx    # 3D view toggles + camera presets
│   └── ui/                     # shadcn/ui components
└── lib/
    └── cnc/
        ├── parser.ts       # G-code interpreter
        ├── store.ts        # Zustand simulation store
        ├── carve.ts        # Workpiece carving engine
        ├── tools.ts        # 8-tool library
        ├── materials.ts    # 8-material library
        ├── feeds.ts        # Feeds & speeds math
        ├── reference.ts    # 65 CNC code entries
        ├── examples.ts     # 26 example programs
        ├── snippets.ts     # 15 code templates
        ├── programStore.ts # localStorage program manager
        ├── viewStore.ts    # View/camera options
        └── types.ts        # Shared types
```

---

## 🎨 Tech Stack

- **Next.js 16** (App Router, static export) · **TypeScript 5**
- **react-three-fiber** + **@react-three/drei** + **Three.js** — 3D rendering
- **Tailwind CSS 4** + **shadcn/ui** — UI components
- **Zustand** — simulation state · **react-resizable-panels** — layout
- **lucide-react** — icons

---

## 📜 License

MIT — free to use, modify, and share. Built for learning and experimentation.

---

**Enjoy milling!** 🏭 If you find this useful, give it a ⭐ on GitHub.
