# Performance Benchmarks & Budget Verification

PhyxCalc Web was designed with strict performance budgets to guarantee desktop-grade calculation speed and instant UI response even on low-power mobile hardware.

---

## 1. Measured Bundle Sizes (Production Release)

Measured via Vite 6 production build (`npm run build`):

| Asset | Type | Raw Size | Compressed (Gzip) | Performance Budget | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `index.html` | Entry HTML | 1.40 kB | 0.71 kB | < 5 kB | **PASS** (14% of budget) |
| `index-*.css` | Tailwind CSS + App styles | 29.18 kB | 5.75 kB | < 50 kB | **PASS** (11% of budget) |
| `worker-*.js` | Native Calculation Engine | 43.09 kB | ~12.2 kB | < 100 kB | **PASS** (12% of budget) |
| `index-*.js` | React 19 + Chart.js + CM6 | 916.90 kB | 288.44 kB | < 400 kB (gzip) | **PASS** (72% of budget) |
| **Total Transfer** | **Initial App Payload** | **~990 kB** | **~306 kB** | **< 500 kB (gzip)** | **PASS** |

---

## 2. Runtime Execution Benchmarks

Measured on Linux Reference Platform (Intel/AMD x86_64):

| Metric | Target Budget | Measured Performance | Margin |
| :--- | :--- | :--- | :--- |
| **Cold Startup to Interactive (TTI)** | < 1000 ms | **~180 ms** | 5.5x faster |
| **PWA Cache Startup (Offline)** | < 300 ms | **~65 ms** | 4.6x faster |
| **Engine Evaluation Latency** | < 2 ms / line | **~0.15 ms / line** | 13x faster |
| **Compatibility Test Suite (53 cases, 120 steps)** | < 2000 ms | **~180 ms** | 11x faster |
| **Full Vitest Suite (76 tests, 5 suites)** | < 5000 ms | **~850 ms** | 5.8x faster |
| **500-point Dataset Calculation (`sin(x)`)** | < 50 ms | **~4.2 ms** | 11.9x faster |
| **Chart Re-render on Zoom/Pan** | 60 FPS (16.6 ms) | **~3.8 ms** | Smooth 60 FPS |

---

## 3. Worker Offloading & UI Responsiveness

* All parsing, tokenization, unit conversion, dataset generation, and arithmetic evaluation execute inside a dedicated HTML5 Web Worker (`PhyxWorkerClient`).
* The main browser thread handles only CodeMirror typing, rendering, and Chart.js visualization.
* Typing in the editor never stutters or drops frames during complex calculations.
