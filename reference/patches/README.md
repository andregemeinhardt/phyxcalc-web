# Reference Compatibility Patches

This directory records all patches required to build and run the reference desktop executable on modern Linux.

## Patch 0001: Qt 5 Linux Compilation (`0001-qt5-linux-compilation.patch`)

- **Scope**: Build system and UI headers only.
- **Affected files**:
  - `PhyxCalc.pro`: Link `-lqwt-qt5` on Debian/Ubuntu systems where `libqwt-qt5.so` exists.
  - `main.cpp`: Include `<QApplication>` instead of `<QtGui/QApplication>`.
  - `helpdialog.h`, `mainwindow.h`, `plotwindow.h`, `settingsdialog.h`: Explicitly include `<QIcon>`.
  - `plotwindow.h`: Explicitly include `<QButtonGroup>`.
- **Effect on calculation validity**: **None**. Zero changes were made to calculation engine files (`phyxcalculator.*`, `qearleyparser.*`, `phyxunit.*`, `phyxvariable.*`, `phyxunitsystem.*`, `phyxcompoundunit.*`, `lineparser.*`). All mathematical logic and grammar parsing are bit-for-bit identical to the upstream baseline.
