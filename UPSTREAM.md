# Upstream Source Provenance

## Identity

- Repository: https://github.com/machinekoder/PhyxCalc.git
- Branch observed at verification: `master`.
- Pinned commit: `c952bc8fecda1f5c14e05ed33656492564bc6cd4`.
- Commit timestamp reported by GitHub: `2014-01-03T08:59:08Z`.
- Workspace import and pinned-source verification date: `2026-11-04`.
- Pinned archive: https://codeload.github.com/machinekoder/PhyxCalc/zip/c952bc8fecda1f5c14e05ed33656492564bc6cd4
- Local source directory: `PhyxCalc/`.
- License declared in source headers: GPL-3.0-or-later.

## Import Method

The initial import used GitHub's `master` ZIP archive because Git was unavailable.
It therefore contained no `.git` metadata or upstream history. The source was
later moved together into `PhyxCalc/`, preserving all 144 files representable in
the initial Windows extraction without changing their contents.

During Phase 1, all imported file contents were compared with an archive of the
exact commit above, rather than relying on the moving `master` branch. The image
that could not coexist with the application icon on a case-insensitive filesystem
was recovered from that pinned archive. All 145 upstream file contents now match
using the filename mapping below. No calculator source code was modified.

The root migration repository was initialized separately. Its `upstream` remote
identifies the original repository; it does not imply cloned history or a remote
repository for publishing this migration. No commit was made during setup.

## Windows Filename Collision

The upstream archive contains two distinct PNG files whose names differ only by
capitalization. Both cannot coexist on a typical Windows filesystem. The import
uses the following deterministic, case-insensitive-safe mapping:

| Upstream path | Local path |
| --- | --- |
| `images/phyxcalc.png` | `PhyxCalc/images/phyxcalc.png` |
| `images/PhyxCalc.png` | `PhyxCalc/images/phyxcalc-original.png` |

`PhyxCalc/images.qrc` references `images/phyxcalc.png`, so the runtime icon retains
its original path and contents. The other image is preserved under a unique name;
no resource-reference edit is necessary. All other paths retain their upstream
names under `PhyxCalc/`.

## Reverification

From the workspace root:

```powershell
.\scripts\verify-source.ps1
```

Expected result: the pinned revision above, `VerifiedFiles: 145`, and no missing,
modified, incorrectly cased, or case-colliding mapped paths. The script compares
individual SHA-256 file hashes against the downloaded pinned archive. Its
`-RestoreImages` switch can reproduce the normalization on the initial Windows
snapshot without silently overwriting a modified application icon.

The original upstream commit remains the immutable reference. Deliberate future
changes to the desktop source should be reviewed and documented rather than
changing the baseline revision merely to make verification pass.