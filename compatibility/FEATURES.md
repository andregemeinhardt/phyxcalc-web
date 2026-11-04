# Feature Matrix and Manual Acceptance Inventory

Baseline: `c952bc8fecda1f5c14e05ed33656492564bc6cd4`.

Every row is **source-reviewed**, not runtime-verified. Web status is explicitly
`not started` for all rows: documenting a feature does not implement it. No legacy
feature is deferred or removed without approval. Calculator cases are in
`cases.json`; the manual acceptance steps below cover desktop workflows that
cannot be represented as single engine expressions.

## Calculation Features

| ID | Capability and acceptance scope | Web status | Owning evidence |
| --- | --- | --- | --- |
| operators | Precedence, grouping, associativity, unary signs, powers, squared/cubed symbols, factorial; probe ambiguous power chains | not started | [grammar](../PhyxCalc/settings/grammar.txt), [evaluation](../PhyxCalc/phyxcalculator.cpp) |
| shorthand | Optional function parentheses and implicit multiplication before selected symbols/functions/variables; do not assume general juxtaposition support | not started | [grammar](../PhyxCalc/settings/grammar.txt) |
| comments | Whitespace removal, single-line and block comments, preservation of error locations; multiline editor handling | not started | [engine](../PhyxCalc/phyxcalculator.cpp), [editor](../PhyxCalc/lineparser.cpp) |
| numbers | Decimal, scientific, leading-dot, hexadecimal, octal, binary, BCD; integer-only base conversion restrictions | not started | [grammar](../PhyxCalc/settings/grammar.txt), [conversions](../PhyxCalc/phyxcalculator.cpp) |
| complex | Both i/j input, real/imaginary parts, argument, norm, conjugate, polar form and complex arithmetic | not started | [grammar](../PhyxCalc/settings/grammar.txt), [values](../PhyxCalc/phyxvariable.h) |
| functions | Trigonometric/hyperbolic functions and inverses, aliases/case variants, radians/degrees, exponentials/logarithms/roots | not started | [grammar](../PhyxCalc/settings/grammar.txt) |
| rounding | abs, sign, heaviside, min/max/avg, int/trunc/ceil/floor/round, gcd/lcm | not started | [grammar](../PhyxCalc/settings/grammar.txt), [implementation](../PhyxCalc/phyxcalculator.cpp) |
| random | rand/rnd, randi/rndi, randg/rndg; range/domain/statistical behavior, not identical cross-platform streams | not started | [grammar](../PhyxCalc/settings/grammar.txt), [implementation](../PhyxCalc/phyxcalculator.cpp) |
| logic | Comparisons/equality, logical AND/NAND/OR/NOR/XOR/XAND/NOT, bitwise operations/shifts, integer/dimensionless requirements | not started | [grammar](../PhyxCalc/settings/grammar.txt) |
| conditionals | Ternary, if/then/else, IF with semicolon separators; probe branch side effects and evaluation order | not started | [grammar](../PhyxCalc/settings/grammar.txt) |
| state | Variable assignment/removal, constants with underscore lookup, custom function definition/removal and parameter scope | not started | [grammar](../PhyxCalc/settings/grammar.txt), [manager](../PhyxCalc/phyxvariablemanager.cpp) |
| assignments | Compound arithmetic/bitwise/shift assignment, prefix/postfix increment/decrement, comma sequencing | not started | [grammar](../PhyxCalc/settings/grammar.txt), [engine](../PhyxCalc/phyxcalculator.cpp) |
| answer | Last output through # and ans/ans(); verify whether silent operations or conversion affect it | not started | [engine](../PhyxCalc/phyxcalculator.cpp), [help](../PhyxCalc/doc/doc_en.txt) |
| lists | Trailing-operator list mode for arithmetic, power, modulo, logical and bitwise operators; blank line terminates; each line is a separate term | not started | [grammar](../PhyxCalc/settings/grammar.txt), [help](../PhyxCalc/doc/doc_en.txt) |
| units | Dimensional compatibility, addition/subtraction, multiplication/division, powers/roots, derived simplification and explicit conversion | not started | [compound units](../PhyxCalc/phyxcompoundunit.cpp), [engine](../PhyxCalc/phyxcalculator.cpp) |
| unit-definitions | Custom systems, base/derived/offset units, preferred prefixes, input-only prefixes, deletion/redefinition, dimension stripping with braces | not started | [grammar](../PhyxCalc/settings/grammar.txt), [unit system](../PhyxCalc/phyxunitsystem.cpp) |
| definitions | Startup SI/physical constants, non-SI units, binary/decimal information units, static currency factors and custom definitions | not started | [definitions](../PhyxCalc/settings/definitions.txt), [loader](../PhyxCalc/phyxcalculator.cpp) |
| formatting | g/G/e/f/custom formats, precision, fractions, i/j output, automatic/no prefixes, base/minimized/forced-input units | not started | [formatting](../PhyxCalc/phyxcalculator.cpp), [settings](../PhyxCalc/settingsdialog.cpp) |
| errors | Syntax, incompatible/dimensionful units, integer/sign/complex domain errors, prefix/unknown-variable/program errors and spans | not started | [error enum](../PhyxCalc/phyxcalculator.h), [messages](../PhyxCalc/phyxcalculator.cpp) |
| datasets | data/datalog case aliases, implicit/explicit steps, complex dependent values, units, endpoints and invalid inputs | not started | [sampling](../PhyxCalc/phyxcalculator.cpp), [model](../PhyxCalc/phyxvariablemanager.h) |

## Desktop Workflows

| ID | Capability and acceptance scope | Web status | Owning evidence |
| --- | --- | --- | --- |
| editor | Evaluate line, inserted/replaced result, Enter/Shift/Ctrl behavior, symbol replacement, syntax/error highlighting, value tooltips | not started | [line parser](../PhyxCalc/lineparser.cpp), [events](../PhyxCalc/mainwindow.cpp), [highlighter](../PhyxCalc/phyxsyntaxhighlighter.cpp) |
| recalculate | Whole-document/from-line evaluation, skipping result lines, cursor movement, variable clearing and repeat-run state | not started | [line parser](../PhyxCalc/lineparser.cpp), [window](../PhyxCalc/mainwindow.cpp) |
| editing | Undo/redo, cut/copy/paste, selections and normal text editing; no dedicated search action found in menus | not started | [menus](../PhyxCalc/mainwindow.ui) |
| documents | New/open/save/save-as/save-all, UTF-8 text, trim-on-save, recent files, modified-state prompts and failure recovery | not started | [document IO](../PhyxCalc/mainwindow.cpp) |
| tabs | New/close/close-all/close-other tabs, tab titles/modified indicators and per-document calculator context | not started | [window](../PhyxCalc/mainwindow.cpp), [tabs](../PhyxCalc/qhidingtabwidget.cpp) |
| autosave | Active document autosave, startup restoration and deletion on normal shutdown; not a full multi-document backup | not started | [window](../PhyxCalc/mainwindow.cpp) |
| inspectors | Variables/constants/functions/units/prefix tables, insertion and tooltips, clear variables | not started | [line parser](../PhyxCalc/lineparser.cpp), [menus](../PhyxCalc/mainwindow.ui) |
| panels | Configurable docks with tooltip/label/insertion triples, startup symbols and electronic function buttons | not started | [loader](../PhyxCalc/unitloader.cpp), [window](../PhyxCalc/mainwindow.cpp), [dock list](../PhyxCalc/settings/docks.txt) |
| settings | Settings directory and startup file copying, editable definitions, defaults, font/antialiasing and syntax/color controls | not started | [window](../PhyxCalc/mainwindow.cpp), [dialog](../PhyxCalc/settingsdialog.cpp), [defaults](../PhyxCalc/settings/settings.ini) |
| layout | Slim/full layout, dock visibility/positions, geometry, column widths and recent-document state | not started | [window](../PhyxCalc/mainwindow.cpp), [menus](../PhyxCalc/mainwindow.ui) |
| expression-output | Output-with-numbers and output-result options affect expression rendering/export | not started | [line parser](../PhyxCalc/lineparser.cpp), [settings](../PhyxCalc/settingsdialog.cpp) |
| export | Formula transformation, instant export dialog and clipboard; current code selects LaTeX, OpenOffice Math selectable mode unproven | not started | [conversion](../PhyxCalc/lineparser.cpp), [dialog](../PhyxCalc/exportdialog.cpp) |
| plotting | Plot dialog inserts data/datalog expression; plot window can open automatically; dataset rename/delete and selection | not started | [dialog](../PhyxCalc/plotdialog.cpp), [plot window](../PhyxCalc/plotwindow.cpp) |
| plot-axes | Four axes (bottom/top/left/right), axis assignments, linear/log, inversion, titles/fonts, automatic/manual min/max/step | not started | [plot window](../PhyxCalc/plotwindow.cpp), [controls](../PhyxCalc/plotwindow.ui) |
| plot-style | Multiple curves, line colors/styles/thickness, symbols/sizes, randomized colors, title, legend position, canvas/background/grid colors | not started | [plot window](../PhyxCalc/plotwindow.cpp), [controls](../PhyxCalc/plotwindow.ui) |
| plot-interaction | Zoomer, crosshair picker, one configurable marker with location, line and symbol styling; verify pointer mappings | not started | [plot window](../PhyxCalc/plotwindow.cpp) |
| plot-output | Clipboard raster, SVG and Qt-supported raster formats; PDF/PostScript conditional on Qwt 6; pixel/mm dimensions and DPI | not started | [export implementation](../PhyxCalc/plotwindow.cpp) |
| printing | Plot print dialog, landscape and grayscale handling; no worksheet print action found in main-window menus | not started | [plot printing](../PhyxCalc/plotwindow.cpp), [main menus](../PhyxCalc/mainwindow.ui) |
| localization | German/French translation sources exist; translator activation not established in startup code; English bundled help | not started | [translations](../PhyxCalc/PhyxCalc.pro), [startup](../PhyxCalc/main.cpp), [help](../PhyxCalc/doc/doc_en.txt) |
| help | Help dialog, About/version/license information, settings folder opening and external project link | not started | [help](../PhyxCalc/helpdialog.cpp), [window](../PhyxCalc/mainwindow.cpp), [settings](../PhyxCalc/settingsdialog.cpp) |

## Function Inventory

Families exposed by grammar (lowercase names below also have selected initial-capital
and uppercase spellings, not arbitrary case-insensitive matching):

- Trigonometry: sin, cos, tan, cot, sec, csc, arcsin/asin, arccos/acos,
  arctan/atan, arccot/acot, arcsec/asec, arccsc/acsc.
- Hyperbolic: sinh, cosh, tanh, coth, sech, csch, arcsinh/asinh, arccosh/acosh,
  arctanh/atanh, arccoth/acoth, arcsech/asech, arccsch/acsch.
- Exponential/root: exp, ln, log followed by base, root followed by degree,
  sqrt/sqr (both mean square root, not square).
- Scalar/integer: abs, min, max, avg, int, trunc, floor, round, ceil, sign,
  heaviside, gcd, lcm, bcd, tobcd, factorial.
- Random: rand/rnd, randi/rndi, randg/rndg.
- Complex/state: re, im, arg, norm, conj, polar, ans; braces strip a unit.
- Data: data and datalog create datasets rather than scalar results.

## Manual Reference Acceptance Scripts

For every workflow, capture build/platform/settings plus screenshots or exact text,
the ordered actions, expected/documented behavior, actual behavior, and discrepancies.
All workflows below are **pending reference execution**.

| Workflow | Ordered acceptance actions |
| --- | --- |
| worksheet | Enter `2+3`; record result insertion. Re-evaluate the same line and a result line. Test Enter, Shift+Enter, Ctrl+Enter, cursor restoration, undo/redo and error recovery. |
| comments | Run single-line comments, inline block comments and a multiline block with valid code afterwards; bound runtime and record any hang rather than waiting indefinitely. |
| recalculate | Define a variable, use it on later lines, change its definition, recalculate all/from-line repeatedly and compare state, existing result replacement and final-line handling. |
| tabs | Create two worksheets with different values for the same variable; switch tabs, close modified tabs using Save/Discard/Cancel, close others/all and inspect state isolation. |
| file-roundtrip | Save UTF-8 expressions containing degree/micro/ohm symbols and comments. Reopen, inspect trimmed edges, existing results and recent-file list. Test cancelled dialogs and unwritable destinations. |
| recovery | Autosave an edited active worksheet, switch tabs, interrupt the app, restart and inspect which content is restored. Repeat with clean exit. Use disposable files/settings. |
| settings | Change each output/editor/expression/plot option; evaluate/export again, restart and inspect persistence. Test resetting missing settings/startup definitions in an isolated profile. |
| docks | Inspect all tables and tooltips, insert a symbol/function, add a custom dock file/triple, restart and verify insertion text and ordering. |
| formula-export | Export grouping, division, powers, subscripts, units, variables, converted results and multiline documents. Toggle expression options, copy output and check target syntax. Probe a document starting with `=` safely. |
| datasets | Generate linear/log and complex-valued data; record samples, counts, units, endpoints and zero/negative step handling. Rename/delete and select several datasets. |
| plots | Exercise all four axis assignments, manual/auto/log/inverted scales, titles, legend positions, curve/grid/marker styles, zoom/picker behavior and current-size controls. Inspect complex component handling. |
| plot-output | Copy the raster, export every format supported by that build, vary pixel/mm/DPI, print landscape/color/grayscale and inspect resulting files. |
| localization-help | Launch with supported locales, inspect translation activation, open help/About/settings directory and record external-link behavior. |

## Migration Boundaries

Browser search, accessibility improvements, robust multi-document recovery, PWA
installation and offline caching are migration requirements, not verified existing
desktop behavior. Similarly, worksheet printing must not be presented as a legacy
feature merely because plot printing exists. Any legacy limitation replaced by an
intentional improvement needs an explicit compatibility note and regression case.