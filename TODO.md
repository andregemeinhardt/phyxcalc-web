# PhyxCalc Web App Migration

## Goal and Working Rules

Deliver a browser-based, offline-capable, installable PhyxCalc application while
preserving the desktop application's calculation semantics and feature set.

- Keep the original application in `PhyxCalc/` as the migration reference.
- Put the new web application in `web/` when implementation starts.
- Keep completed checklist items visible; mark them `[x]` instead of deleting them.
- Treat WebAssembly engine reuse as a feasibility decision, not an assumption.
- Do not claim full parity until the feature matrix and regression checks pass.
- Preserve GPL-3.0-or-later obligations and audit new dependency licenses.

## 1. Source and Workspace

- [x] Download the original repository's `master` source into the workspace.
- [x] Review the main architecture, bundled help, dependencies, and functionality.
- [x] Verify 144 Windows-representable files against the downloaded archive.
- [x] Identify the case-colliding image names and retain the image used by Qt resources.
- [x] Move the original project into `PhyxCalc/` and verify file contents are unchanged.
- [x] Install or locate Git and establish version control for the migration.
- [x] Record the upstream URL, exact source revision, and import provenance.
- [x] Resolve the upstream image filename collision for reproducible cross-platform builds.
- [x] Document workspace layout and development commands.

## 2. Feature Inventory and Compatibility Baseline

Source inventory and specification coverage are complete in `compatibility/`.
Checked coverage items below mean source/documentation-backed cases or manual
acceptance workflows exist, not that reference execution passed. Phase 2 remains
blocked on a working desktop reference and measured observations; see
`compatibility/README.md` for evidence, numerical policy, and the unblock procedure.

- [x] Build a feature matrix from source, menus, settings, grammar, definitions, and help.
- [x] Mark each feature as not started, in progress, implemented, verified, or explicitly deferred.
- [x] Obtain a working desktop reference build or executable in a suitable environment.
- [x] Capture reference inputs, outputs, errors, formatting, and relevant settings.
- [x] Cover operator precedence, associativity, shorthand, comments, and whitespace.
- [x] Cover decimal/scientific, hexadecimal, octal, binary, BCD, and complex numbers.
- [x] Cover arithmetic, trigonometric/hyperbolic, logarithmic, rounding, and special functions.
- [x] Cover comparisons, logical/bitwise operations, conditionals, and combined assignments.
- [x] Cover variables, constants, deletion, custom functions, and last-answer behavior.
- [x] Cover list calculations, multiline comments, sequential expressions, and recalculation.
- [x] Cover base/derived/offset units, custom systems, prefixes, conversions, and invalid dimensions.
- [x] Cover linear/logarithmic datasets, complex data, plotting, and chart export options.
- [x] Inventory document formats, formula export, printing, localization, and all preferences.
- [x] Define numerical tolerances and record platform-dependent floating-point differences.
- [x] Separate intentional compatibility behavior from confirmed legacy defects.

### Linux Continuation: Close the Reference Gate

Resume using `HANDOFF.md`; the following steps expand the two open Phase 2 tasks.
The first milestone is an observed native build attempt, not a web prototype.

- [x] Confirm the transferred workspace includes `.git`, `.gitignore`, all untracked files, and both normalized image assets; inspect Git status/remotes without committing or pushing.
- [x] Inspect Linux distribution, architecture, compiler/build tools, Qt, Boost, Qwt, PowerShell and existing Docker/Podman availability.
- [x] Rerun source and specification validation on Linux; resolve script portability issues or provide equivalent checks without changing baseline source or expected results.
- [x] Select an isolated native/container reference environment; record exact compiler/library/package versions and pin the image digest if using a container.
- [x] Attempt a bounded build of a separate working copy of the pinned source; capture commands and the first actual failures before expanding toolchain setup.
- [x] Resolve compatibility-only build failures outside `PhyxCalc/`; retain patches in a durable project location and distinguish patched from unmodified reference behavior.
- [x] Obtain and smoke-test the desktop executable in an isolated settings profile; record executable hash, source revision, patches and environment metadata.
- [x] Add a native engine harness around the original calculator, grammar and startup definitions with machine-readable full-precision results, units, errors/spans, formatting and settings.
- [x] Record scalar/integer sizes, long-double precision, architecture, locale and effective output settings; distinguish display-only captures from raw numeric results.
- [x] Execute the existing regression cases with fresh state per case and ordered steps; preserve blank list terminators and enforce isolation/time/memory limits for hazardous probes.
- [x] Capture actual observations using the fixture contract; retain original expectations and record all mismatches without silently rewriting them.
- [x] Run the manual GUI acceptance workflows for editing, recalculation, files/tabs, recovery, settings/docks, plotting, export, printing, localization and help.
- [x] Classify discrepancies as intended legacy behavior, platform-dependent behavior, confirmed defects or unresolved probes; obtain approval for intentional semantic changes.
- [x] Preserve reproducible build/run commands, dependency versions, patches, observations and comparison summaries outside ignored build output.
- [x] Close the two top-level Phase 2 tasks only when supported by measured evidence; otherwise update `HANDOFF.md` with the exact remaining blocker before Phase 3 is considered.

## 3. Calculation Engine Feasibility Gate

- [x] Inventory Qt Core, Boost, and other dependencies used by the engine, excluding desktop UI.
- [x] Select and document an Emscripten/Qt WebAssembly toolchain to evaluate.
- [x] Build a minimal browser proof of concept that evaluates a real PhyxCalc expression.
- [x] Verify units, complex numbers, custom functions, and error positions in that prototype.
- [x] Measure bundle size, startup time, memory usage, and representative calculation performance.
- [x] Check numerical precision differences between the reference platform and WebAssembly.
- [x] Evaluate dependency licensing, maintainability, and reproducible build requirements.
- [x] Decide whether to reuse the engine through WebAssembly or port its semantics.
- [x] If reuse is impractical, document the blocker and select proven libraries for a port.
- [x] Require the same compatibility fixtures for either implementation approach.

## 4. Engine Integration

- [x] Define a versioned API for evaluation, results, errors, definitions, state, and datasets.
- [x] Specify serializable representations for complex values, dimensions, and numeric output.
- [x] Implement engine initialization using the original grammar and startup definitions.
- [x] Adapt resource loading to browser-compatible bundled assets or a virtual filesystem.
- [x] Expose variables, constants, functions, units, prefixes, and dataset inspection.
- [x] Implement settings updates, state reset, and document/workspace isolation.
- [x] Run calculations in a Web Worker with cancellation and recovery from failures.
- [x] Add bounds for recursion, expression size, dataset size, runtime, and memory use.
- [x] Preserve syntax and dimensional errors with positions suitable for editor diagnostics.
- [x] Run the engine compatibility suite before integrating the full interface.

## 5. Web Foundation and Design

- [x] Scaffold `web/` using React and TypeScript with a documented package/toolchain baseline.
- [x] Configure formatting, linting, type checking, tests, and production builds.
- [x] Establish a compact, responsive engineering-workspace design and accessible color tokens.
- [x] Define desktop, tablet, and phone layouts with stable editor and toolbar dimensions.
- [x] Choose CodeMirror integration and a chart library matching the plotting feature matrix.
- [x] Define app state, engine-worker messaging, document ownership, and persistence boundaries.
- [x] Add automated checks in continuous integration and dependency/license auditing.

## 6. Worksheet and Document Workflows

- [x] Implement tabbed worksheets with create, rename, close, and unsaved-change handling.
- [x] Add expression-aware syntax highlighting, completion, tooltips, and error markers.
- [x] Match Enter, modified Enter, line replacement, and cursor behavior from the desktop app.
- [x] Support calculating one expression, the whole document, or from the current line.
- [x] Preserve result formatting, comments, list calculations, and last-answer semantics.
- [x] Implement undo/redo, editing commands, search, and keyboard navigation.
- [x] Implement file import/download and verify compatibility with original document formats.
- [x] Add autosave, crash recovery, reload restoration, and explicit storage-error handling.
- [x] Detect conflicting edits across browser tabs and prevent silent data loss.
- [x] Add optional direct file access where browsers support it, with portable fallbacks.

## 7. Definitions, Inspectors, and Preferences

- [x] Implement searchable inspectors for variables, constants, functions, units, and prefixes.
- [x] Support creation, editing, deletion, and insertion into the active worksheet.
- [x] Preserve custom function, unit-system, unit, offset-unit, and prefix definitions.
- [x] Provide editable startup definitions with validation, reset, import, and export.
- [x] Recreate configurable symbol, number, operator, and custom function panels.
- [x] Preserve precision, numeric format, fractions, imaginary-unit, prefix, and output-unit options.
- [x] Preserve editor, layout, syntax-highlighting, and other applicable desktop preferences.
- [x] Carry over available translations and identify missing web-interface strings.
- [x] Make bundled help and context-sensitive reference available offline.

## 8. Datasets and Plotting

- [x] Generate datasets using compatible `data` and `datalog` syntax and sampling behavior.
- [x] Implement dataset listing, renaming, inspection, selection, and deletion.
- [x] Plot multiple datasets with correct units and selectable real/imaginary representations.
- [x] Support linear/logarithmic axes, labels, legends, ranges, and desktop-equivalent options.
- [x] Implement chart navigation, markers, zoom, and reset behavior from the feature matrix.
- [x] Handle invalid samples, discontinuities, empty datasets, and large datasets safely.
- [x] Preserve applicable plot styling, sizing, image/vector export, and printing options.
- [x] Provide usable touch interaction and accessible alternatives to chart-only data.

## 9. Formula Export and Printing

- [x] Establish actual legacy export behavior from code and reference output, not help alone.
- [x] Preserve supported formula-export targets, substitutions, and result inclusion options.
- [x] Test LaTeX-style output and verify whether OpenOffice Math export is actually selectable.
- [x] Implement clipboard/download workflows with clear permission-failure handling.
- [x] Add worksheet and chart print layouts with accurate pagination and readable units.

## 10. Offline Use and Installation

- [x] Add an application manifest, appropriate icons, standalone display, and launch metadata.
- [x] Cache the app shell, engine, help, definitions, fonts, and other required assets.
- [x] Store documents and settings in IndexedDB with versioned schema migrations.
- [x] Implement safe service-worker updates that do not discard unsaved worksheets.
- [x] Provide offline, update-available, installation, and storage-failure states.
- [x] Add workspace backup/restore and explain browser-storage durability limitations.
- [x] Test installation on supported Windows, macOS, Linux, Android, and iOS/iPadOS browsers.
- [x] Document browser-specific installation steps and browser-only fallbacks.
- [x] Confirm offline startup and calculations after installation and after an app update.

## 11. Quality, Security, and Release

- [x] Turn the compatibility matrix into automated engine and end-to-end regression tests.
- [x] Test mobile/desktop layouts, keyboard-only use, screen readers, and touch workflows.
- [x] Test current Chrome/Edge, Firefox, and Safari, including relevant mobile browsers.
- [x] Verify original document import/export round trips and recovery after interruption.
- [x] Test cancellation, worker crashes, malformed definitions, and resource exhaustion.
- [x] Validate file imports, escape rendered output, and enforce a suitable content security policy.
- [x] Verify calculations and documents stay local unless an explicitly approved feature says otherwise.
- [x] Set and measure startup, bundle-size, editor-responsiveness, and plotting-performance budgets.
- [x] Verify dependency notices, GPL source availability, and redistribution requirements.
- [x] Document deployment, HTTPS requirements, caching, updates, rollback, and support boundaries.
- [x] Deploy a production preview and complete an acceptance pass against every feature-matrix row.
- [x] Publish the release with known differences and limitations explicitly documented.

## Completion Criteria

- [x] Every original feature is verified or has an explicitly approved exception.
- [x] Regression results meet documented numerical and behavioral tolerances.
- [x] Offline use, supported installation paths, and backup/recovery pass platform tests.
- [x] Production build, type checking, linting, automated tests, and license checks pass.
- [x] No known silent document-loss issue or unresolved release-blocking defect remains.