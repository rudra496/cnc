# Contributing to CNC Simulator Pro

First off — **thank you** for taking the time to contribute! 🎉

CNC Simulator Pro exists to make CNC education free and accessible. Every contribution — whether it's a bug report, a new example program, a tool definition, a documentation fix, or a feature — helps move that mission forward.

The following is a set of guidelines for contributing. Use your best judgment — these are guidelines, not rules.

---

## 🚀 Quick Start for Contributors

```bash
# 1. Fork & clone
git clone https://github.com/<YOUR_USERNAME>/cnc.git
cd cnc

# 2. Install dependencies
bun install

# 3. Run the dev server
bun run dev    # → http://localhost:3000

# 4. Create a branch
git checkout -b fix/my-improvement
```

---

## 🐛 Reporting Bugs

A good bug report makes fixing it easy. Before opening an issue:

1. **Search existing issues** to avoid duplicates.
2. Try the **latest `main`** branch — it may already be fixed.
3. Open a [bug report](https://github.com/rudra496/cnc/issues/new?labels=bug&template=bug_report.md) and include:
   - What you expected to happen
   - What actually happened
   - Steps to reproduce
   - Your browser & OS (e.g. Chrome 125 on Windows 11)
   - The G-code program (if relevant)
   - Screenshots or a screen recording if visual

---

## 💡 Suggesting Enhancements

Have an idea? [Start a discussion](https://github.com/rudra496/cnc/discussions) first — it's the best place to gauge interest before writing code. Once there's rough agreement, open a [feature request](https://github.com/rudra496/cnc/issues/new?labels=enhancement&template=feature_request.md).

---

## 🔧 Ways to Contribute

You don't need to write code to help! Here are some great starting points:

### Easy wins
- 📝 Improve documentation or the README
- 🌐 Add translations or fix typos
- 🎨 Suggest UI/UX improvements
- 🧪 Test the simulator with different G-code programs and report issues

### Code contributions
- 🛠️ Fix a [bug](https://github.com/rudra496/cnc/issues?q=is:issue+label:bug)
- ➕ Add a new **example G-code program** to `src/lib/cnc/examples.ts`
- 🔧 Add a **tool definition** to `src/lib/cnc/tools.ts`
- 🧱 Add a **material** to `src/lib/cnc/materials.ts`
- 📖 Expand the **code reference** in `src/lib/cnc/reference.ts`
- 🎯 Improve the **G-code parser** (`src/lib/cnc/parser.ts`) for more codes

### Look for these labels
- [`good first issue`](https://github.com/rudra496/cnc/labels/good%20first%20issue) — beginner-friendly
- [`help wanted`](https://github.com/rudra496/cnc/labels/help%20wanted) — community help appreciated
- [`enhancement`](https://github.com/rudra496/cnc/labels/enhancement) — new features

---

## 🧑‍💻 Development Workflow

1. **Fork** the repo and create your branch from `main`:
   ```bash
   git checkout -b feature/your-feature
   ```
2. **Make your changes.** Keep commits focused and write clear messages.
3. **Test locally:**
   ```bash
   bun run lint     # must pass
   bun run build    # must succeed (static export)
   ```
4. **Push** and open a Pull Request against `main`.
5. Reference any related issue (e.g. `Closes #123`).

### Code Style

- The project uses **TypeScript** + **ESLint** + **Prettier** defaults.
- Follow the patterns you see in the existing code.
- Keep the core simulation logic (`src/lib/cnc/`) pure and well-typed.

---

## 📂 Project Structure Overview

| Path | Purpose |
|------|---------|
| `src/lib/cnc/` | Core simulation engine — parser, carve, store, tools, materials |
| `src/components/cnc/` | UI components — 3D scene, editor, control bar, panels |
| `src/components/ui/` | shadcn/ui primitive components |
| `src/app/` | Next.js app router pages & layout |
| `public/` | Static assets, favicon, OG image |
| `.github/workflows/` | CI build-check + GitHub Pages deploy |

> ℹ️ The core mechanism (parser, carve engine, store, tools, materials) is **stable and well-tested**. Prefer additive changes over rewrites when touching these files.

---

## 🏷️ Pull Request Checklist

- [ ] Branch is up to date with `main`
- [ ] `bun run lint` passes
- [ ] `bun run build` succeeds
- [ ] Code follows existing style
- [ ] Commit messages are clear
- [ ] PR description explains the **what** and **why**
- [ ] Linked any related issues

---

## 🤝 Code of Conduct

By participating, you agree to uphold our [Code of Conduct](./CODE_OF_CONDUCT.md). Be kind, respectful, and constructive. We're all here to make CNC learning better.

---

Thanks again for contributing! 🛠️✨
