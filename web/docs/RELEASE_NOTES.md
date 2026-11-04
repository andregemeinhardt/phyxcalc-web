# PhyxCalc Web v1.0.0 — Release Notes & Feature Matrix Acceptance

PhyxCalc Web is a full-featured, offline-first Progressive Web Application (PWA) port of the classic desktop scientific and physical units calculator PhyxCalc.

---

## 1. Feature Parity & Verification Matrix

Every feature from the desktop PhyxCalc C++/Qt reference has been reproduced, measured against the reference compatibility suite, and verified:

| Feature Category | Desktop C++/Qt PhyxCalc | PhyxCalc Web v1.0.0 | Acceptance Status |
| :--- | :--- | :--- | :--- |
| **Arithmetic & Precedence** | Standard algebra, powers, functions | Standard algebra, powers, functions | **100% Verified** (Cases 1–15) |
| **Physical Units** | SI base, derived, prefixes, algebra | Full compound units, auto SI prefixes | **100% Verified** (Cases 16–30) |
| **Unit Conversion (`->`)** | In-place & assignment conversion | In-place & assignment conversion | **100% Verified** (Cases 31–38) |
| **Complex Arithmetic** | Real, imaginary `j`, `abs()`, `arg()` | Real, imaginary `j`, polar forms | **100% Verified** (Cases 39–45) |
| **Number Bases** | `->hex`, `->bin`, `->oct`, `->dec` | `->hex`, `->bin`, `->oct`, `->dec` | **100% Verified** (Cases 46–49) |
| **List Additions** | `12+`, `4`, `3`, blank line `= 19` | List additions with blank line finish | **100% Verified** (Cases 50–53) |
| **Datasets & Plotting** | `data(...)`, linear/log plots | `data(...)`, interactive pan/zoom, CSV | **100% Verified** (Phase 8) |
| **Formulas Export** | Text, HTML table, LaTeX | Text, HTML table, LaTeX | **100% Verified** (Phase 9) |
| **Startup Definitions** | Editable file with factory reset | In-app editor with validation & reset | **100% Verified** (Phase 7) |
| **Inspectors / Docks** | Variables, Constants, Units, Symbols | Variables, Constants, Units, Symbols | **100% Verified** (Phase 7) |
| **Localization** | German (`phyxcalc_de.ts`) & English | German & English runtime switcher | **100% Verified** (Phase 7) |

---

## 2. Web-Native Modern Enhancements

Beyond strict parity, PhyxCalc Web introduces modern engineering workflows:
1. **Multi-Tab Worksheets**: Open multiple independent calculation tabs with rename, close, dirty change tracking (`*`), autosave, and cross-tab modification conflict detection.
2. **Interactive Chart Pan & Zoom**: Smooth continuous zoom (`1x`–`10x`) with click-and-drag horizontal panning and instant reset.
3. **Accessible Data Table**: Screen-reader and touch-friendly tabular view with live search/filtering of dataset points.
4. **File System Access API**: Direct local file open and save (`.phyx` and `.txt`) in Chrome/Edge, with universal fallback for Safari and Firefox.
5. **Installable PWA & Offline Engine**: Dedicated standalone app window on Windows, macOS, Linux, ChromeOS, Android, and iOS/iPadOS with local Web Worker calculation and IndexedDB persistent storage.
6. **Dark and Light Themes**: High-contrast dark mode tailored for engineering night-shift and light mode optimized for document printing.
7. **Workspace Archival**: One-click JSON backup and restore encompassing all tabs, calculation settings, and custom definitions.

---

## 3. Known Differences & Design Boundaries

1. **Sandbox Security & Process Isolation**:
   * Desktop PhyxCalc ran in a single unbounded C++ process. PhyxCalc Web runs the calculator in an isolated Web Worker protected by a strict Content Security Policy (`default-src 'self'`).
2. **Third-Party C++ Plugins**:
   * Native C++ dynamic libraries (`.so`/`.dll`) cannot be loaded inside a web browser sandbox. The complete engine is implemented natively in high-performance TypeScript.
3. **Browser Storage Durability**:
   * While desktop PhyxCalc stored files on raw local disk, web browsers manage storage through IndexedDB. Persistent storage must be granted by the browser, and periodic workspace export (`.json`) is provided for long-term archival.
