# Project Instructions

## Resume Here

Before acting, read [HANDOFF.md](HANDOFF.md), then [TODO.md](TODO.md).
The active task is completing Phase 2 on Linux: obtain a reproducible native
reference build and capture measured compatibility results. Do not restart the
inventory or begin the web implementation unless the user redirects the work.

## Boundaries

- Preserve `PhyxCalc/` as the imported upstream baseline. Build and patch a separate
  working copy; record every compatibility patch and its effect on reference validity.
- Keep completed TODO entries visible and checked. Never equate source-reviewed
  expectations or structural validation with runtime-verified behavior.
- Follow [compatibility/README.md](compatibility/README.md) for numerical policy,
  evidence categories, safety requirements and observation records. Known hang/crash
  probes must not run in a shared unbounded process.
- Future web code belongs in `web/`; engine reuse through WebAssembly is undecided.
- The user chose an independent repository, provisionally `phyxcalc-web`, with
  publishing later. Do not commit, create branches, create a hosted repository,
  add a publishing remote, or push without explicit authorization. Never push to upstream.
- Preserve GPL-3.0-or-later notices and obligations. Keep unrelated user changes.

## Checks and Environment

- Re-detect Linux tooling. Windows paths and previous-session installations are not
  portable and must not be assumed available.
- Existing specification checks use PowerShell: with `pwsh` installed, run
  `pwsh -NoProfile -File ./scripts/validate-compatibility.ps1`.
- The pinned-source verifier is
  `pwsh -NoProfile -File ./scripts/verify-source.ps1` and needs GitHub network access.
  Neither script has yet been run on Linux. Fix portability problems in tooling,
  not by silently changing the upstream baseline or fixture expectations.
- These scripts do not compile or execute the calculator. No native build, native
  harness, web engine or automated runtime-results comparison exists yet.