# Compatibility Baseline

This directory records the legacy application's features and regression inputs
before choosing a browser engine. The baseline revision is
`c952bc8fecda1f5c14e05ed33656492564bc6cd4`.

## Evidence and Status

- `documentation`: an expectation taken from bundled help, not a measured result.
- `source-derived`: an expectation supported by the implementation, not a measured result.
- `probe`: behavior that must be established by running the reference application.
- `observation: null`: the case has not been run on a working reference build.

Do not label cases runtime-verified merely because their inputs parse as JSON,
their answers are mathematically reasonable, or source inspection supports them.
Documented output can be stale. Ambiguous grammar and suspected defects need
explicit probes rather than silently corrected expected results.

## Fixture Contract

`cases.json` is engine-neutral. Start each case with a fresh calculator and the
bundled startup definitions; execute its `steps` in order with shared case-local
state. Reset between cases. An empty input is meaningful and must not be trimmed
out: it can finish a list calculation. Preserve source text including comments,
whitespace, Unicode symbols, and newlines.

The profile records bundled formatting settings, not the developer's desktop
preferences. Treat settings not explicitly captured here as unresolved until the
reference procedure specifies them. Expected display text excludes the worksheet's
leading `=` marker. `silent` means no result line, not failure. `probe` requires a
recorded answer and does not automatically pass.

The requested `locale: C` is a deterministic runtime control, not a measured local
desktop setting. Cases marked `safety` are manual/isolated-process probes and must
not be fed blindly to a shared in-process engine runner. Multiline worksheet probes
must be driven through the editor, not silently substituted with one engine call.

For `value` expectations, real and imaginary components are decimal strings, so
JavaScript number parsing cannot silently round the baseline itself. The `unit`
field describes the expected unit rather than a value-independent label.

To record an actual run, replace a case's null observation with a record containing
the reference build identifier, OS/compiler/numeric type, effective settings,
per-step raw outputs and errors, and date. Retain the original expectation and
record discrepancies separately. Never fill observations with inferred results.
Observation records must have `referenceBuild`, `platform`, `settings`, `steps`
and `date` fields, with one recorded step per input step.

This is a compatibility specification, not yet an automated calculator runner.

## Reference Execution Gate

Status on 2026-11-04: **blocked; zero observed reference cases**.

- The GitHub releases endpoint returns an empty JSON array; no release executable
	is available there: https://api.github.com/repos/machinekoder/PhyxCalc/releases.
- The About dialog links to https://sourceforge.net/p/phyxcalc/. Access to the
	project's files page returned HTTP 403 in this environment, so no binary or
	matching version was established.
- qmake, Qt, CMake and a C++ compiler were not found on PATH or in the checked
	standard Qt/MSYS/Visual Studio/portable-toolchain locations.
- WSL is not installed. No system component was installed, elevated prompt
	answered, or toolchain compatibility change made to the original source.

To unblock: provide a trusted desktop executable with its version/source identity,
or a compatible Qt/Boost/Qwt/C++ environment that can build the pinned source.
An unrelated version can inform behavior, but cannot silently stand in for this
revision's reference results. A patched reference build must list every patch and
distinguish its results from the unmodified baseline. Do not fetch unsigned binaries
from arbitrary mirrors just to make this gate appear complete.

Before recording results, isolate the settings directory from existing user data.
Record executable hash, commit/patch set, Qt/Boost/Qwt and compiler versions, OS,
locale, architecture, `sizeof(long double)`, `numeric_limits<long double>::digits`,
`sizeof(long int)` and all effective output settings. Capture both raw engine
values and worksheet display text where possible, plus error codes and spans.
The GUI alone may expose only rounded text; label such captures display-only.

## Numerical and Formatting Acceptance Policy

These are migration acceptance rules, not measured error bounds of the legacy
calculator. Refine them explicitly when reference measurements justify a change.

- Compare integers and booleans exactly; retain decimal strings for integers that
	cannot be represented exactly by JavaScript Number. Record reference `long int`
	width before testing bit shifts, BCD and overflow. Overflow behavior is a probe,
	not a portable result to emulate blindly.
- Compare dimensions exactly and convert values into the same unit before numeric
	comparison. A numerical tolerance never excuses a dimensional mismatch.
- For well-conditioned nonzero real/imaginary components, require
	`abs(actual - expected) <= absoluteTolerance + relativeTolerance * abs(expected)`.
	Default relative tolerance is `1e-12`; default absolute tolerance is zero.
	Near-zero transcendental dimensionless results may explicitly use absolute
	tolerance `1e-14`. Dimensionful absolute tolerances must name their unit and be
	specified per case, never inferred from a dimensionless default.
- Compare complex components separately. Do not use a tolerance on magnitude alone
	that could hide a wrong phase or component sign. Treat signed zero, NaN and
	infinity as explicit probes until the reference's handling is captured.
- Do not infer full-precision values from six-digit worksheet output. Exact display
	assertions and internal numeric assertions are different test modes.
- Match display text exactly under the stated profile, apart from CRLF/LF transport
	normalization. Do not erase unit prefixes, Unicode symbols, exponent notation,
	meaningful spaces or imaginary-unit spelling to make a test pass.
- Error classes must match. Capture spans in the original input with its whitespace
	and symbols intact; do not freeze guessed endpoints before observing a reference.
- Random cases assert ranges/distribution properties, not a particular sample.
	Floating-step dataset endpoint/count differences require explicit investigation,
	not an arbitrary extra numerical tolerance.

`global.h` uses `long double` outside Symbian and `double` on Symbian; values are
complex numbers of that scalar type, and integers are `long int`. `long double`
precision varies by compiler/ABI, not just operating system. In particular, MSVC
and typical GCC x86 builds may differ. The help's fixed 64/96-bit description is
not a sufficient precision specification. WebAssembly precision is still unmeasured
and belongs to the Phase 3 feasibility gate.

## Findings and Decision Register

No issue below authorizes editing the baseline source or automatically treating a
legacy bug as a required web feature. Preserve raw reference behavior separately
from the desired behavior and approve deliberate fixes explicitly.

| ID | Classification | Evidence and consequence | Next check |
| --- | --- | --- | --- |
| C01 | Source-confirmed inconsistent actions; observable result pending | `settings/grammar.txt`: `p18` superscript cube uses `valuePush2`, while another cube rule uses `valuePush3` | Run `cube-shorthand-probe`; record which parse wins |
| C02 | Source-confirmed handler mismatch | `datasetLogCreateStep` passes `LinearDataset`, whereas `datasetLogCreate` passes `LogarithmicDataset` | Compare explicit/default datalog sampling in `dataset-log-explicit-probe` |
| C03 | Source-confirmed comment truncation | `stripComments` truncates at `/*` before searching for `*/`; trailing code in an inline block comment is lost | Run `inline-block-comment-probe` and the editor multiline workflow |
| C04 | Suspected editor control-flow/hang risk | `LineParser::commentLineSelected` treats an index result as bool and has a non-advancing while loop | Run multiline probes with a timeout and disposable state |
| C05 | Source-confirmed IO status defect | `saveDocument` warns on failed write but still returns true | Test an unwritable destination and closing a modified document; web must not silently lose data |
| C06 | Source-confirmed export bounds risk | `exportFormelEditor` appends a result line to index `i-1` even for a document beginning with `=` | Execute the export edge-case workflow with crash isolation |
| C07 | Source/help mismatch | Export selects `LatexTarget` in code; help describes OpenOffice Math and planned LaTeX | Capture actual output and whether any target control exists; do not promise an unexposed target |
| C08 | Activation unresolved | German/French translation files are declared, but translator installation was not found in inspected startup code | Inspect locale-specific launches before claiming working localization |
| C09 | Intentional frozen data, not live financial data | Startup currency factors are explicitly dated January 2012; physical constants also reflect an old baseline | Preserve compatibility data with clear provenance; updating it is a separate decision |
| C10 | Documented limitation contradicts grammar | Help says implicit multiplication is unimplemented; grammar permits selected symbols, variables and functions, but comments out bracket juxtaposition | Run `implicit-multiplication-probe`; document supported forms rather than broad claims |
| C11 | Source-confirmed random endpoint risk | `valueRandint` scales `qrand()` by `RAND_MAX`; at the maximum draw it can return the requested upper bound, contrary to the help's exclusive bound | Include endpoint analysis in `random-distribution-probe`; approve any change explicitly |

## Phase 2 Deliverables

- `FEATURES.md`: individually tracked feature groups, evidence and manual workflows.
- `cases.json`: ordered deterministic cases and unresolved probes, with no fabricated observations.
- `../scripts/validate-compatibility.ps1`: offline structural/evidence/grammar validation,
	not a calculation test. A future adapter must execute these fixtures against the
	reference and browser engines without changing their meaning.

Phase 2 cannot be called fully complete until the reference gate is unblocked and
the observations, effective settings, errors, formatting and discrepancy decisions
are captured. Structural checks alone do not satisfy that requirement.