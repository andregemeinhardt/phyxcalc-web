# PhyxCalc Web ⚡

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline%20Capable-success.svg)](web/docs/INSTALLATION.md)
[![Compatibility Tests](https://img.shields.io/badge/Tests-76%20passed-success.svg)](web/src/engine/compatibility.test.ts)

**PhyxCalc Web** is a modern, high-precision scientific and engineering physical units calculator. It runs 100% locally in the browser as an installable Progressive Web Application (PWA) with zero network dependencies, complete offline capability, and desktop-grade performance.

---

## 🌟 Origin & Attribution

This project is a modern web port and continuation of **[PhyxCalc](https://github.com/machinekoder/PhyxCalc)**, the desktop scientific calculator created by **[Alexander Rössler (machinekoder)](https://github.com/machinekoder)**.

* **Original Project**: [PhyxCalc (Desktop C++/Qt)](https://github.com/machinekoder/PhyxCalc)
* **Original Author**: [Alexander Rössler](https://github.com/machinekoder)
* **Original Copyright**: Copyright © 2011–2014 Alexander Rössler
* **Original License**: [GNU General Public License v3.0 or later (GPL-3.0-or-later)](LICENSE)

We are deeply grateful to Alexander Rössler for his pioneering work, grammar design, and comprehensive physical unit definitions that served as the foundation and reference specification for this implementation. All original calculations, unit systems, grammar rules, and documentation have been preserved and credited in accordance with the GNU General Public License v3.0. See [NOTICE](NOTICE) and [UPSTREAM.md](UPSTREAM.md) for full provenance details.

---

## ✨ Features

### 📐 Physical Units & Scientific Computing
* **Compound Physical Units**: Dimensional arithmetic with SI base units, derived units, and metric prefixes (`km`, `MW`, `ns`, `pF`, `kWh`, `m/s²`, `N`, `J`, `W`, `Pa`).
* **Instant Conversions**: Real-time conversions with the `->` operator (e.g. `72km/h -> m/s`, `100W * 2h -> kWh`, `0°C -> K`, `1atm -> bar`).
* **Complex Arithmetic**: Native complex number calculations using imaginary unit `j` (e.g. `(2 + 3j) * (4 - 5j)`, `abs(z)`, `arg(z)`).
* **Base Transformations**: On-the-fly conversion between number systems (`23 -> hex`, `255 -> bin`, `100 -> oct`, `0xFF -> dec`).
* **List Additions**: Financial and lab list summation (`12+`, `4`, `3`, followed by a blank line evaluates to `= 19`).

### 📑 Modern Engineering Worksheet Workflows
* **Multi-Tab Worksheets**: Open, rename, and manage independent calculation notebooks simultaneously with dirty markers (`*`), autosave, and cross-tab conflict detection via `BroadcastChannel`.
* **Direct File System Access API**: Direct local file open and save (`.phyx` and `.txt`) in Chromium browsers with portable fallbacks for Safari and Firefox.
* **CodeMirror 6 Editor**: Custom syntax highlighting, line numbers, automatic superscripts (`^2` &rarr; `²`, `^3` &rarr; `³`), and context-aware autocompletion for variables, constants, and units.

### 📊 Interactive Datasets & Plotting
* **Dataset Generation**: Simple `data(start, stop, step, expr)` and `datalog(...)` syntax (e.g. `d = data(0, 10, 0.2, sin(x))`).
* **Interactive Viewer**: Zoom in/out/reset, point markers toggle, spline curve smoothing, linear/logarithmic axes, and **click-and-drag panning** across the dataset range.
* **Accessible Data Table**: Searchable, screen-reader-friendly table view of all computed coordinates.
* **CSV Export & Print**: One-click data export and dedicated plot print styling.

### 📤 Formula Export & Document Printing
* **LaTeX, HTML & Plain Text**: Instant copy to clipboard or file download for scientific papers and engineering reports.
* **High-Contrast Print View**: Dedicated `@media print` stylesheet isolating worksheets, paginating formulas cleanly, and presenting an official document header.

### 🔒 100% Offline & Private
* **Client-Side Only**: All calculations run locally in a dedicated Web Worker. Zero data leaves your machine; no analytics, no external servers, and strict Content Security Policy (`default-src 'self'`).
* **Persistent Storage (IndexedDB)**: Schema-migrated database (`phyxcalc_db`) with optional browser persistence request (`navigator.storage.persist()`) preventing data eviction.
* **Workspace Archival**: One-click full workspace backup and restore as a portable JSON file.
* **Installable PWA**: Standalone desktop app window on Windows, macOS, Linux, Android, and iOS/iPadOS with background service worker caching.

### 🌐 Bilingual Interface & Themes
* **Localization**: Full English and German (`Deutsch`) translations derived directly from original desktop Qt localization files (`phyxcalc_de.ts`).
* **Dark & Light Modes**: Tailored engineering dark theme and crisp daytime print light theme.

---

## 🚀 Quickstart

### Prerequisites
* [Node.js](https://nodejs.org/) v18.0.0 or higher
* `npm` v9.0.0 or higher

### Installation & Development
```bash
# Clone the repository
git clone https://github.com/your-username/phyxcalc-web.git
cd phyxcalc-web/web

# Install dependencies
npm install

# Start local development server
npm run dev
```
Open **`http://localhost:5173`** in your browser to start calculating.

### Running Tests
```bash
cd web
npx vitest run
```
Executes all 5 test suites (76 unit, compatibility, regression, and storage tests) against the native reference specification.

### Production Build
```bash
cd web
npm run build
```
Generates optimized, minified production assets in `web/dist/`.

---

## 📂 Repository Structure

```text
├── PhyxCalc/               # Preserved upstream C++/Qt source (reference baseline)
├── compatibility/          # Machine-readable compatibility corpus (53 cases, 120 steps)
├── reference/              # Native reference build harness and portability patches
├── scripts/                # Verification, runner, and validation scripts
├── web/                    # PhyxCalc Web Application (React 19 + TypeScript + Vite)
│   ├── public/             # PWA manifest, service worker (sw.js), app icons
│   ├── src/
│   │   ├── components/     # UI dialogs, menu bar, toolbar, dock panels, error boundaries
│   │   ├── editor/         # CodeMirror 6 mode, syntax highlighting, autocompletion
│   │   ├── engine/         # High-precision TypeScript calculation engine & Web Worker
│   │   ├── i18n/           # English and German translation dictionaries
│   │   └── storage/        # IndexedDB storage engine & workspace backups
│   └── docs/               # Architecture, installation, deployment, and performance guides
├── NOTICE                  # Official attribution and copyright notice
├── LICENSE                 # GNU General Public License v3.0
└── README.md               # Main project documentation
```

---

## 📖 Documentation

* [Installation & Offline PWA Guide](web/docs/INSTALLATION.md)
* [Deployment & Caching Guide](web/docs/DEPLOYMENT.md)
* [Performance Benchmarks & Budgets](web/docs/PERFORMANCE.md)
* [Release Notes & Feature Matrix Acceptance](web/docs/RELEASE_NOTES.md)
* [Third-Party License Audit](web/docs/THIRD_PARTY_LICENSES.md)
* [Upstream Source Provenance](UPSTREAM.md)

---

## 📜 License

This project is licensed under the **GNU General Public License v3.0 or later** ([GPL-3.0-or-later](LICENSE)).

Copyright © 2011–2014 Alexander Rössler (PhyxCalc desktop)  
Copyright © 2026 PhyxCalc Web Contributors
