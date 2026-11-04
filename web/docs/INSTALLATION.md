# PhyxCalc Web — Installation & Offline PWA Guide

PhyxCalc Web is an installable Progressive Web Application (PWA) designed to run 100% offline with desktop-class capability and zero external server dependencies during calculations.

---

## 1. Supported Platforms & Installation Steps

### Google Chrome / Microsoft Edge (Desktop: Windows, macOS, Linux)
1. Navigate to the PhyxCalc Web URL in Chrome or Edge.
2. In the omnibox (address bar), click the **Install PhyxCalc** icon on the right side (or click the **Install App** button in the top-right menu bar).
3. Confirm **Install**.
4. PhyxCalc opens in a dedicated standalone window with desktop window decorations, custom taskbar icon, and native system shortcuts (`Ctrl+S`, `Ctrl+O`, `Ctrl+P`, `Ctrl+T`, `F5`).

### Apple Safari (macOS Sonoma 14+)
1. Open PhyxCalc Web in Safari.
2. Choose **File** &rarr; **Add to Dock...**.
3. Customize the title if desired and click **Add**.
4. PhyxCalc is now in your macOS Dock and Applications folder, operating as an independent app with isolated state.

### Apple iOS / iPadOS (Safari)
1. Open PhyxCalc Web in Mobile Safari.
2. Tap the **Share** button (box with upward arrow) in the toolbar.
3. Scroll down and tap **Add to Home Screen** (`+`).
4. Tap **Add**.
5. Launch PhyxCalc from your Home Screen in standalone fullscreen mode without browser URL bars.

### Android (Chrome / Brave / Edge)
1. Open PhyxCalc Web in Chrome on Android.
2. An automatic install banner or menu option **Add to Home Screen** / **Install app** will appear.
3. Tap **Install**.
4. The app installs to your app drawer and home screen.

### Mozilla Firefox & Browser-Only Fallback
1. Firefox does not currently support desktop PWA installation natively without third-party extensions.
2. However, PhyxCalc Web works **100% offline in standard Firefox tabs**:
   * The Service Worker caches the app shell, engine, and symbols automatically.
   * Worksheets and settings persist in IndexedDB (`phyxcalc_db`).
   * Bookmarking `http://localhost:5173` allows full offline calculation even with the internet disconnected.

---

## 2. Offline Behavior & Service Worker Lifecycle

### Precached App Shell
* On first load, the Service Worker (`/sw.js`) precaches:
  * Application shell (`/`, `/index.html`)
  * Web App Manifest (`/manifest.json`)
  * App icons (`/icon.svg`)
  * Dynamic script bundles and Web Worker modules (`/assets/*`)
* When offline, navigation requests automatically fall back to the cached `/index.html`, and calculation evaluation runs inside the local browser Web Worker.
* The status bar displays **🔌 Offline Mode** when internet connectivity is lost, and **⚡ Online (PWA Ready)** when connected.

### Safe Application Updates
* To prevent data loss in open engineering worksheets, the Service Worker **never forcibly reloads or takes over active tabs while an unsaved calculation is open**.
* When a new version is detected:
  1. The new Service Worker installs in the background into the `waiting` state.
  2. A blue notification banner appears: `Update Available: A new version of PhyxCalc Web is ready. [Update Now]`.
  3. Clicking **Update Now** sends `SKIP_WAITING` to the new worker and reloads the window safely after the user has saved their work.

---

## 3. Storage Durability & Data Safety

### IndexedDB Storage (`phyxcalc_db`)
* All open tabs, titles, dirty markers, calculation settings, and startup definitions are stored in IndexedDB.
* Versioned migrations handle schema evolutions seamlessly.

### Browser Eviction Rules & Persistent Storage
* **WebKit / Safari Policy**: Safari may evict unpersisted IndexedDB data if the domain has had no user interaction for 7 days or under low disk conditions.
* **Persistent Storage**: Open **Tools** &rarr; **Preferences...** &rarr; **Offline Storage & Workspace Backup** and click **Request Persistence**. When granted, the browser guarantees worksheets will not be cleared during automatic cleanup.
* **Periodic Backups**: Use **Export Backup (.json)** in Preferences to save an all-in-one JSON file containing every tab, variable state, settings, and definitions for permanent long-term archival.
