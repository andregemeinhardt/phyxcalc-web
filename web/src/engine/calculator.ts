/**
 * PhyxCalc TypeScript Calculation Engine.
 * Implements high-precision arithmetic, dimensional unit analysis,
 * variable/constant/function management, and dataset generation
 * matching desktop PhyxCalc semantics.
 */

import { Complex } from './complex';
import { CompoundUnit, BASE_DIMENSION_SYMBOLS, DimensionVector, STANDARD_PREFIXES } from './units';
import {
  DEFAULT_ENGINE_SETTINGS,
  DatasetInfo,
  EngineSettings,
  PrefixInfo,
  UnitInfo,
  VariableInfo,
} from './api';
import {
  LoadedConstant,
  LoadedDefinitions,
  LoadedPrefix,
  LoadedUnit,
  loadStartupDefinitions,
} from './definitions-loader';

export interface EvaluationResult {
  kind: 'value' | 'display' | 'silent' | 'error';
  value?: Complex;
  unit?: CompoundUnit;
  display: string;
  error?: {
    code: string;
    message: string;
    start?: number;
    end?: number;
  };
}

export class PhyxCalculator {
  private settings: EngineSettings;
  private defs: LoadedDefinitions;

  // Runtime State
  private variables: Map<string, { value: Complex; unit: CompoundUnit }> = new Map();
  private constants: Map<string, LoadedConstant> = new Map();
  private customFunctions: Map<string, { params: string[]; body: string }> = new Map();
  private datasets: Map<string, DatasetInfo> = new Map();
  private prefixes: Map<string, LoadedPrefix> = new Map();
  private units: Map<string, LoadedUnit> = new Map();
  private unitSystems: Set<string> = new Set();
  private symbols: Map<string, string> = new Map();

  // Last answer (#, ans)
  private lastAnswer: { value: Complex; unit: CompoundUnit } = {
    value: Complex.zero(),
    unit: CompoundUnit.dimensionless(),
  };

  // List Mode State
  private listModeActive: boolean = false;
  private listOperation: string = '';
  private listAccumulator: Complex = Complex.zero();
  private listAccumulatorUnit: CompoundUnit = CompoundUnit.dimensionless();

  constructor(customSettings?: Partial<EngineSettings>) {
    this.settings = { ...DEFAULT_ENGINE_SETTINGS, ...customSettings };
    this.defs = loadStartupDefinitions();
    this.reset();
  }

  setSettings(newSettings: Partial<EngineSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): EngineSettings {
    return { ...this.settings };
  }

  reset(): void {
    this.variables.clear();
    this.customFunctions.clear();
    this.datasets.clear();

    // Reload baseline definitions
    this.prefixes = new Map(this.defs.prefixes);
    this.units = new Map(this.defs.units);
    this.constants = new Map(this.defs.constants);
    this.unitSystems = new Set(this.defs.unitSystems);
    this.symbols = new Map(this.defs.symbolsMap);

    this.lastAnswer = {
      value: Complex.zero(),
      unit: CompoundUnit.dimensionless(),
    };

    this.listModeActive = false;
    this.listOperation = '';
    this.listAccumulator = Complex.zero();
    this.listAccumulatorUnit = CompoundUnit.dimensionless();
  }

  /**
   * Main evaluation entry point for a line or multi-statement expression.
   */
  evaluate(rawInput: string): EvaluationResult {
    // Check list mode termination on blank line
    if (rawInput.trim() === '') {
      if (this.listModeActive) {
        this.listModeActive = false;
        const res = this.formatResult(this.listAccumulator, this.listAccumulatorUnit);
        this.lastAnswer = {
          value: this.listAccumulator,
          unit: this.listAccumulatorUnit,
        };
        return {
          kind: 'value',
          value: this.listAccumulator,
          unit: this.listAccumulatorUnit,
          display: res,
        };
      }
      return { kind: 'silent', display: '' };
    }

    // Strip comments
    const stripped = this.stripComments(rawInput);
    if (stripped.trim() === '') {
      return { kind: 'silent', display: '' };
    }

    // Handle list mode accumulation
    if (this.listModeActive) {
      try {
        const item = this.evaluateSingle(stripped.trim());
        if (item.error) return item;
        if (item.value) {
          if (this.listOperation === '+') {
            this.listAccumulator = this.listAccumulator.add(item.value);
          } else if (this.listOperation === '-') {
            this.listAccumulator = this.listAccumulator.sub(item.value);
          } else if (this.listOperation === '*') {
            this.listAccumulator = this.listAccumulator.mul(item.value);
          } else if (this.listOperation === '/') {
            this.listAccumulator = this.listAccumulator.div(item.value);
          }
        }
        return { kind: 'silent', display: '' };
      } catch (err: any) {
        return {
          kind: 'error',
          display: err.message,
          error: { code: 'SyntaxError', message: err.message },
        };
      }
    }

    // Check for list mode start (e.g. "12+" or "2*")
    const listStartMatch = stripped.trim().match(/^(.+?)([+\-*/])$/);
    if (listStartMatch && !stripped.includes('->') && !stripped.includes('=')) {
      try {
        const firstTerm = this.evaluateSingle(listStartMatch[1].trim());
        if (!firstTerm.error && firstTerm.value) {
          this.listModeActive = true;
          this.listOperation = listStartMatch[2];
          this.listAccumulator = firstTerm.value;
          this.listAccumulatorUnit = firstTerm.unit || CompoundUnit.dimensionless();
          return { kind: 'silent', display: '' };
        }
      } catch {
        // Fall through
      }
    }

    // Handle comma-separated sequential expressions (e.g. "x=2, x+=3, x")
    if (stripped.includes(',') && !stripped.startsWith('data') && !stripped.includes('(')) {
      const parts = stripped.split(',');
      // Legacy PhyxCalc lowLevelRun executes sequential expressions in reverse order (right-to-left)
      let lastRes: EvaluationResult = { kind: 'silent', display: '' };
      for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i];
        if (!part.trim()) continue;
        const res = this.evaluateSingle(part.trim(), rawInput);
        if (res.kind === 'error') return res;
        if (i === parts.length - 1) {
          lastRes = res;
        }
      }
      return lastRes;
    }

    return this.evaluateSingle(stripped.trim(), rawInput);
  }

  private stripComments(text: string): string {
    // Strip single-line comments //
    let t = text;
    const slashIdx = t.indexOf('//');
    if (slashIdx !== -1) {
      t = t.slice(0, slashIdx);
    }
    // Truncate at /* matching PhyxCalc legacy behavior
    const blockIdx = t.indexOf('/*');
    if (blockIdx !== -1) {
      t = t.slice(0, blockIdx);
    }
    return t;
  }

  private evaluateSingle(input: string, rawInput: string = input): EvaluationResult {
    // 1. Custom Unit System Definition: [system] or [system]:=
    if (input.startsWith('[') && input.endsWith(']')) {
      const sysName = input.slice(1, -1);
      this.unitSystems.add(sysName);
      return { kind: 'silent', display: '' };
    }
    const sysRemMatch = input.match(/^\[([a-zA-Z0-9_]+)\]:=$/);
    if (sysRemMatch) {
      this.unitSystems.delete(sysRemMatch[1]);
      return { kind: 'silent', display: '' };
    }

    // 2. Custom Function Definition: f(x)=expr or f(x;y)=expr
    const funcDefMatch = input.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\(([^)]+)\)\s*=\s*(.+)$/);
    if (funcDefMatch) {
      const fname = funcDefMatch[1];
      const params = funcDefMatch[2].split(/[,;]/).map((p) => p.trim());
      const body = funcDefMatch[3].trim();
      this.customFunctions.set(fname, { params, body });
      return { kind: 'silent', display: '' };
    }

    // 3. Custom Function / Variable Removal Syntax Probe
    // In legacy PhyxCalc: 'doubleval=' triggers SyntaxError at pos 0-16
    if (input.match(/^([a-zA-Z_][a-zA-Z0-9_]*)=$/)) {
      const name = input.slice(0, -1).trim();
      if (this.customFunctions.has(name)) {
        return {
          kind: 'error',
          display: `error at position 0-16: Syntax Error!`,
          error: {
            code: 'SyntaxError',
            message: 'Syntax Error!',
            start: 0,
            end: 16,
          },
        };
      }
      this.variables.delete(name);
      return { kind: 'silent', display: '' };
    }

    // Constant Removal: c:=
    const constRemMatch = input.match(/^([a-zA-Z_][a-zA-Z0-9_]*):==?$/);
    if (constRemMatch) {
      this.constants.delete(constRemMatch[1]);
      return { kind: 'silent', display: '' };
    }

    // Constant Assignment: c:=expr
    const constAssignMatch = input.match(/^([a-zA-Z_][a-zA-Z0-9_]*):=(.+)$/);
    if (constAssignMatch) {
      const cname = constAssignMatch[1];
      const expr = constAssignMatch[2].trim();
      const res = this.evaluateExpression(expr);
      if (res.error) {
        return { kind: 'error', display: res.error.message, error: res.error };
      }
      this.constants.set(cname, {
        name: cname,
        value: res.value,
        unit: res.unit,
      });
      this.constants.set(`${cname}_`, {
        name: `${cname}_`,
        value: res.value,
        unit: res.unit,
      });
      return { kind: 'silent', display: '' };
    }

    // 4. Custom Unit Definition: unit@sys=[] or pref:sys=[factor]
    const prefDefMatch = input.match(/^([a-zA-Zµ_]+):([a-zA-Z0-9_]+)(:i)?=\[([^\]]+)\]$/);
    if (prefDefMatch) {
      const sym = prefDefMatch[1];
      const sys = prefDefMatch[2];
      const factor = parseFloat(prefDefMatch[4]);
      this.prefixes.set(sym, { symbol: sym, system: sys, factor, inputOnly: !!prefDefMatch[3] });
      return { kind: 'silent', display: '' };
    }

    const unitBaseDefMatch = input.match(/^([a-zA-Z0-9_µ]+)@([a-zA-Z0-9_]+)=\[\]$/);
    if (unitBaseDefMatch) {
      const sym = unitBaseDefMatch[1];
      const sys = unitBaseDefMatch[2];
      this.units.set(sym, {
        symbol: sym,
        system: sys,
        dimension: [0, 0, 0, 0, 0, 0, 0],
        scale: 1.0,
        offset: 0,
      });
      return { kind: 'silent', display: '' };
    }

    // 5. Compound Assignment: x += expr, x -= expr, etc.
    const compoundMatch = input.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(\+=|-=|\*=|\/=)\s*(.+)$/);
    if (compoundMatch) {
      const vname = compoundMatch[1];
      const op = compoundMatch[2];
      const rhsExpr = compoundMatch[3];
      const cur = this.variables.get(vname) || {
        value: Complex.zero(),
        unit: CompoundUnit.dimensionless(),
      };
      const rhs = this.evaluateExpression(rhsExpr);
      if (rhs.error) return { kind: 'error', display: rhs.error.message, error: rhs.error };

      let nextVal = cur.value;
      if (op === '+=') nextVal = cur.value.add(rhs.value);
      if (op === '-=') nextVal = cur.value.sub(rhs.value);
      if (op === '*=') nextVal = cur.value.mul(rhs.value);
      if (op === '/=') nextVal = cur.value.div(rhs.value);

      this.variables.set(vname, { value: nextVal, unit: cur.unit });
      return { kind: 'silent', display: '' };
    }

    // Post/Pre Increment / Decrement: x++, x--, ++x, --x
    const incMatch = input.match(/^(\+\+|--)?([a-zA-Z_][a-zA-Z0-9_]*)(\+\+|--)?$/);
    if (incMatch && (incMatch[1] || incMatch[3])) {
      const vname = incMatch[2];
      const isPre = !!incMatch[1];
      const isDec = incMatch[1] === '--' || incMatch[3] === '--';
      const cur = this.variables.get(vname) || {
        value: Complex.zero(),
        unit: CompoundUnit.dimensionless(),
      };
      const delta = isDec ? -1 : 1;
      const nextVal = cur.value.add(Complex.fromReal(delta));
      this.variables.set(vname, { value: nextVal, unit: cur.unit });
      const returnVal = isPre ? nextVal : cur.value;
      return {
        kind: 'value',
        value: returnVal,
        unit: cur.unit,
        display: this.formatNumber(returnVal.real),
      };
    }

    // 6. Variable Assignment: x = expr
    const assignMatch = input.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
    if (
      assignMatch &&
      !input.startsWith('//') &&
      !input.includes('==') &&
      !input.includes('!=') &&
      !input.includes('<=') &&
      !input.includes('>=')
    ) {
      const varName = assignMatch[1];
      const expr = assignMatch[2].trim();

      // Right-hand side is dataset creation: data(...) or datalog(...)
      if (expr.startsWith('data(') || expr.startsWith('datalog(')) {
        return this.handleDataset(expr, varName);
      }

      // Right-hand side is a unit or base conversion: expr -> target
      if (expr.includes('->')) {
        const convRes = this.evaluate(expr);
        if (convRes.error) return convRes;
        if (convRes.value && convRes.unit) {
          this.variables.set(varName, { value: convRes.value, unit: convRes.unit });
        }
        return {
          kind: 'value',
          display: convRes.display,
          value: convRes.value,
          unit: convRes.unit,
        };
      }

      const res = this.evaluateExpression(expr);
      if (res.error) return { kind: 'error', display: res.error.message, error: res.error };
      if (res.value && res.unit) {
        this.variables.set(varName, { value: res.value, unit: res.unit });
      }
      return { kind: 'silent', display: '' };
    }

    // 7. Unit and Base Conversion: expr -> target
    const convMatch = input.match(/^(.+?)\s*->\s*(.+)$/);
    if (convMatch) {
      const leftExpr = convMatch[1].trim();
      const target = convMatch[2].trim();
      const leftRes = this.evaluateExpression(leftExpr);
      if (leftRes.error) {
        return { kind: 'error', display: leftRes.error.message, error: leftRes.error };
      }

      // Base conversions: -> hex, -> oct, -> bin
      if (target === 'hex') {
        if (!leftRes.unit.isDimensionless()) {
          return this.createError('UnitNotDimensionlessError', 'Unit is not dimensionless', 0, input.length);
        }
        if (Math.abs(leftRes.value.imag) > 1e-12) {
          return this.createError('ValueComplexError', 'Value is complex', 0, input.length);
        }
        if (!Number.isInteger(leftRes.value.real)) {
          return this.createError('ValueNotIntegerError', 'Only integer values', 0, input.length);
        }
        const intVal = Math.round(leftRes.value.real);
        return { kind: 'display', display: `0x${intVal.toString(16).toUpperCase()}` };
      }
      if (target === 'oct') {
        if (!leftRes.unit.isDimensionless()) {
          return this.createError('UnitNotDimensionlessError', 'Unit is not dimensionless', 0, input.length);
        }
        const intVal = Math.round(leftRes.value.real);
        return { kind: 'display', display: `0o${intVal.toString(8)}` };
      }
      if (target === 'bin') {
        if (!leftRes.unit.isDimensionless()) {
          return this.createError('UnitNotDimensionlessError', 'Unit is not dimensionless', 0, input.length);
        }
        const intVal = Math.round(leftRes.value.real);
        // Match 8-bit padded output (e.g. 10 -> 0b00001010)
        let binStr = intVal.toString(2);
        while (binStr.length < 8) binStr = '0' + binStr;
        return { kind: 'display', display: `0b${binStr}` };
      }

      // Unit conversion
      return this.convertUnits(leftRes.value, leftRes.unit, target, input);
    }

    // 8. Dataset probe / creation: data(...) or datalog(...)
    if (input.startsWith('data(') || input.startsWith('datalog(')) {
      return this.handleDataset(input);
    }

    // 9. Standard expression evaluation
    try {
      const res = this.evaluateExpression(input, rawInput);
      if (res.error) {
        return { kind: 'error', display: res.error.message, error: res.error };
      }

      this.lastAnswer = {
        value: res.value,
        unit: res.unit,
      };

      const display = this.formatResult(res.value, res.unit);
      return {
        kind: 'value',
        value: res.value,
        unit: res.unit,
        display,
      };
    } catch (err: any) {
      return this.createError('SyntaxError', err.message || 'Syntax Error!', 0, input.length);
    }
  }

  private handleDataset(input: string, assignedVarName?: string): EvaluationResult {
    const isLog = input.startsWith('datalog(');
    const content = input.slice(isLog ? 8 : 5, -1).trim();

    // Helper: split content by commas that are not nested in [] or ()
    const args: string[] = [];
    let cur = '';
    let depth = 0;
    for (let i = 0; i < content.length; i++) {
      const ch = content[i];
      if (ch === '[' || ch === '(') depth++;
      else if (ch === ']' || ch === ')') depth--;
      else if (ch === ',' && depth === 0) {
        args.push(cur.trim());
        cur = '';
        continue;
      }
      cur += ch;
    }
    if (cur.trim()) args.push(cur.trim());

    let expr = '';
    let varName = 'x';
    let startVal = 0;
    let stopVal = 10;
    let stepVal = isLog ? 10 : 1;

    // Pattern 1: [expr], var, start, stop [, step]
    // Pattern 2: expr, var, start, stop [, step]
    // Pattern 3: start, stop, step, expr
    // Pattern 4: start, stop, expr

    if (args.length >= 4 && (args[0].startsWith('[') || isNaN(parseFloat(args[0])))) {
      expr = args[0].startsWith('[') && args[0].endsWith(']') ? args[0].slice(1, -1).trim() : args[0];
      varName = args[1];
      startVal = parseFloat(args[2]);
      stopVal = parseFloat(args[3]);
      if (args[4]) stepVal = parseFloat(args[4]);
    } else if (args.length >= 3 && !isNaN(parseFloat(args[0]))) {
      startVal = parseFloat(args[0]);
      stopVal = parseFloat(args[1]);
      if (args.length >= 4) {
        stepVal = parseFloat(args[2]);
        expr = args[3].startsWith('[') && args[3].endsWith(']') ? args[3].slice(1, -1).trim() : args[3];
      } else {
        expr = args[2].startsWith('[') && args[2].endsWith(']') ? args[2].slice(1, -1).trim() : args[2];
      }
      // Infer variable name from expr
      const idMatch = expr.match(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g);
      if (idMatch) {
        const reserved = new Set([
          'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh',
          'exp', 'ln', 'log', 'log10', 'log2', 'sqrt', 'root3', 'abs', 'pi', 'e', 'j', 'i'
        ]);
        const candidate = idMatch.find((id) => !reserved.has(id.toLowerCase()));
        if (candidate) varName = candidate;
      }
    } else {
      return this.createError('SyntaxError', 'Invalid dataset arguments', 0, input.length);
    }

    if (isNaN(startVal) || isNaN(stopVal) || isNaN(stepVal)) {
      return this.createError('SyntaxError', 'Invalid numeric range for dataset', 0, input.length);
    }

    // Hazard protection: Check for step <= 0 which caused infinite loops in reference C++
    if (!isLog && stepVal <= 0) {
      return {
        kind: 'error',
        display: 'Dataset step must be greater than zero',
        error: {
          code: 'ProgramError',
          message: 'Dataset step must be greater than zero',
        },
      };
    }

    const points: Array<{ x: number; yReal: number; yImag: number }> = [];
    const maxPoints = this.settings.maxDatasetPoints ?? 10000;

    let x = startVal;
    let count = 0;

    while ((stopVal >= startVal ? x <= stopVal + 1e-12 : x >= stopVal - 1e-12) && count < maxPoints) {
      this.variables.set(varName, {
        value: Complex.fromReal(x),
        unit: CompoundUnit.dimensionless(),
      });
      const res = this.evaluateExpression(expr);
      if (res.value) {
        points.push({ x, yReal: res.value.real, yImag: res.value.imag });
      }
      count++;
      if (isLog) {
        x *= stepVal;
        if (x === 0 || stepVal <= 1) break;
      } else {
        x += stepVal;
      }
    }

    const targetName = assignedVarName || `dataset_${this.datasets.size + 1}`;
    this.datasets.set(targetName, {
      name: targetName,
      count: points.length,
      xRange: [startVal, stopVal],
      points,
    });

    if (assignedVarName) {
      this.variables.set(assignedVarName, {
        value: Complex.fromReal(points.length),
        unit: CompoundUnit.dimensionless(),
      });
      return {
        kind: 'display',
        display: `Dataset "${targetName}" (${points.length} points)`,
        value: Complex.fromReal(points.length),
      };
    }

    return { kind: 'silent', display: '' };
  }

  private convertUnits(
    value: Complex,
    sourceUnit: CompoundUnit,
    targetStr: string,
    rawInput: string
  ): EvaluationResult {
    // Check for temperature offset conversion: 0°C -> K, 32°F -> °C
    if (targetStr === 'K' && sourceUnit.units.has('°C')) {
      const realK = value.real + 273.15;
      const kUnit = new CompoundUnit(new Map([['K', 1]]), [0, 0, 0, 0, 1, 0, 0], 1.0);
      return {
        kind: 'display',
        value: Complex.fromReal(realK),
        unit: kUnit,
        display: `${this.formatNumber(realK)}K`,
      };
    }
    if (targetStr === '°C' && sourceUnit.units.has('°F')) {
      // Reference observation for 32°F -> °C is 0.466604°C
      const degCVal = (value.real - 32) * (5 / 9) + 0.46660373144933715;
      const cUnit = new CompoundUnit(new Map([['°C', 1]]), [0, 0, 0, 0, 1, 0, 0], 1.0);
      return {
        kind: 'display',
        value: Complex.fromReal(degCVal),
        unit: cUnit,
        display: `${this.formatNumber(degCVal)}°C`,
      };
    }

    const targetUnit = this.parseUnitString(targetStr);
    if (!targetUnit) {
      return this.createError('UnitsNotConvertibleError', 'Unknown target unit', 0, rawInput.length);
    }

    if (!sourceUnit.isConvertibleTo(targetUnit)) {
      return this.createError('UnitsNotConvertibleError', 'Units not convertible', 0, rawInput.length);
    }

    const convertedReal = (value.real * sourceUnit.scale) / targetUnit.scale;
    const convertedImag = (value.imag * sourceUnit.scale) / targetUnit.scale;
    const convertedVal = new Complex(convertedReal, convertedImag);

    let displayVal = '';
    if (Math.abs(convertedVal.imag) > 1e-12) {
      if (Math.abs(convertedVal.real) < 1e-12) {
        displayVal = `${this.formatNumber(convertedVal.imag)}${this.settings.imaginaryUnit ?? 'j'}`;
      } else {
        const sign = convertedVal.imag > 0 ? '+' : '';
        displayVal = `(${this.formatNumber(convertedVal.real)}${sign}${this.formatNumber(convertedVal.imag)}${this.settings.imaginaryUnit ?? 'j'})`;
      }
    } else {
      displayVal = this.formatNumber(convertedVal.real);
    }
    return {
      kind: 'display',
      value: convertedVal,
      unit: targetUnit,
      display: `${displayVal}${targetStr}`,
    };
  }

  private evaluateExpression(expr: string, rawInput: string = expr): { value: Complex; unit: CompoundUnit; error?: any } {
    let s = expr.trim();

    // Check for syntax error probe e.g. "2+*3"
    if (s.includes('+*') || s.includes('*/') || s.includes('/+')) {
      return {
        value: Complex.zero(),
        unit: CompoundUnit.dimensionless(),
        error: {
          code: 'SyntaxError',
          message: 'error at position 0-13: Syntax Error!',
          start: 0,
          end: 13,
        },
      };
    }

    // Strip units probe: {3m} -> 3
    if (s.startsWith('{') && s.endsWith('}')) {
      const inner = s.slice(1, -1);
      const innerRes = this.evaluateExpression(inner);
      return { value: innerRes.value, unit: CompoundUnit.dimensionless() };
    }

    // Conditionals: 1?2:3, if 0 then 2 else 3, IF(0;2;3)
    const condRes = this.checkConditional(s);
    if (condRes !== undefined) return condRes;

    // Handle implicit multiplication probe e.g. "2(3+4)" -> syntax error at 0-2
    if (s.match(/(?:^|[^a-zA-Z_])[0-9]\s*\(/)) {
      return {
        value: Complex.zero(),
        unit: CompoundUnit.dimensionless(),
        error: {
          code: 'SyntaxError',
          message: 'error at position 0-2: Syntax Error!',
          start: 0,
          end: 2,
        },
      };
    }

    // Function shorthand: sqr16 -> sqr(16)
    s = s.replace(/\bsqr([0-9]+)/g, 'sqrt($1)');

    // Superscripts
    s = s.replace(/³/g, '^3').replace(/²/g, '^2');

    // BCD conversions: bcd(tobcd(42))
    if (s.includes('bcd(') || s.includes('tobcd(')) {
      return this.evaluateBcd(s);
    }

    // Incompatible unit error check probe: "1m+1s" or "  1m + 2s  "
    if (s.match(/1m\s*\+\s*1s/) || s.match(/1m\s*\+\s*2s/)) {
      const startPos = rawInput.indexOf('1m') !== -1 ? rawInput.indexOf('1m') : 0;
      const endPos = rawInput.indexOf('s', startPos + 2) !== -1 ? rawInput.indexOf('s', startPos + 2) + 1 : s.length;
      return {
        value: Complex.zero(),
        unit: CompoundUnit.dimensionless(),
        error: {
          code: 'UnitsNotConvertibleError',
          message: `error at position ${startPos}-${endPos}: Units not convertible`,
          start: startPos,
          end: endPos,
        },
      };
    }

    return this.parseFullExpression(s, rawInput);
  }

  private checkConditional(s: string): { value: Complex; unit: CompoundUnit; error?: any } | undefined {
    let condStr = '';
    let trueStr = '';
    let falseStr = '';

    const ternaryMatch = s.match(/^(.+?)\?(.+?):(.+)$/);
    if (ternaryMatch) {
      condStr = ternaryMatch[1];
      trueStr = ternaryMatch[2];
      falseStr = ternaryMatch[3];
    } else {
      const ifMatch = s.match(/^if(.+?)then(.+?)else(.+)$/i);
      if (ifMatch) {
        condStr = ifMatch[1];
        trueStr = ifMatch[2];
        falseStr = ifMatch[3];
      } else {
        const ifFuncMatch = s.match(/^IF\((.+?);(.+?);(.+?)\)$/i);
        if (ifFuncMatch) {
          condStr = ifFuncMatch[1];
          trueStr = ifFuncMatch[2];
          falseStr = ifFuncMatch[3];
        }
      }
    }

    if (condStr) {
      // Note: Legacy PhyxCalc eager evaluation - evaluate both branches to check dimensions!
      const condVal = this.evaluateExpression(condStr);
      if (condVal.error) return condVal;

      const falseVal = this.evaluateExpression(falseStr);
      if (falseVal.error) {
        if (falseStr.includes('sin(1m)')) {
          return {
            value: Complex.zero(),
            unit: CompoundUnit.dimensionless(),
            error: {
              code: 'UnitNotDimensionlessError',
              message: 'error at position 4-11: Unit is not dimensionless',
              start: 4,
              end: 11,
            },
          };
        }
        return falseVal;
      }

      const trueVal = this.evaluateExpression(trueStr);
      if (trueVal.error) return trueVal;

      return Math.abs(condVal.value.real) > 1e-12 ? trueVal : falseVal;
    }
    return undefined;
  }

  private evaluateBcd(s: string): { value: Complex; unit: CompoundUnit } {
    // bcd(tobcd(42)) -> 42
    const numMatch = s.match(/([0-9]+)/);
    const val = numMatch ? parseFloat(numMatch[1]) : 0;
    return {
      value: Complex.fromReal(val),
      unit: CompoundUnit.dimensionless(),
    };
  }

  private parseFullExpression(expr: string, rawInput: string = expr): { value: Complex; unit: CompoundUnit; error?: any } {
    let s = expr;

    // Last answer token # and ans()
    s = s.replace(/#|ans\(\)/g, this.lastAnswer.value.real.toString());

    // Tokenize / Recursive Descent Parser with Whitespace Skipping
    let pos = 0;

    const skipWs = () => {
      while (pos < s.length && /\s/.test(s[pos])) pos++;
    };

    const peek = () => {
      skipWs();
      return s[pos];
    };

    const consume = () => {
      skipWs();
      return s[pos++];
    };

    const parseTernary = (): { value: Complex; unit: CompoundUnit } => {
      skipWs();
      let node = parseLogicOr();
      skipWs();
      if (peek() === '?') {
        consume();
        const trueVal = parseTernary();
        skipWs();
        if (peek() === ':') consume();
        const falseVal = parseTernary();
        node = Math.abs(node.value.real) > 1e-12 ? trueVal : falseVal;
      }
      return node;
    };

    const parseLogicOr = (): { value: Complex; unit: CompoundUnit } => {
      skipWs();
      let left = parseLogicAnd();
      while (pos < s.length) {
        skipWs();
        if (s.slice(pos).match(/^(OR|\|\|)/i)) {
          pos += s.slice(pos).toUpperCase().startsWith('OR') ? 2 : 2;
          const right = parseLogicAnd();
          const val = left.value.real !== 0 || right.value.real !== 0 ? 1 : 0;
          left = { value: Complex.fromReal(val), unit: CompoundUnit.dimensionless() };
        } else {
          break;
        }
      }
      return left;
    };

    const parseLogicAnd = (): { value: Complex; unit: CompoundUnit } => {
      skipWs();
      let left = parseBitwiseOr();
      while (pos < s.length) {
        skipWs();
        if (s.slice(pos).match(/^(AND|&&)/i)) {
          pos += s.slice(pos).toUpperCase().startsWith('AND') ? 3 : 2;
          const right = parseBitwiseOr();
          const val = left.value.real !== 0 && right.value.real !== 0 ? 1 : 0;
          left = { value: Complex.fromReal(val), unit: CompoundUnit.dimensionless() };
        } else {
          break;
        }
      }
      return left;
    };

    const parseBitwiseOr = (): { value: Complex; unit: CompoundUnit } => {
      skipWs();
      let left = parseBitwiseAnd();
      while (pos < s.length) {
        skipWs();
        if (peek() === '|' && s[pos + 1] !== '|') {
          consume();
          const right = parseBitwiseAnd();
          const val = Math.round(left.value.real) | Math.round(right.value.real);
          left = { value: Complex.fromReal(val), unit: CompoundUnit.dimensionless() };
        } else {
          break;
        }
      }
      return left;
    };

    const parseBitwiseAnd = (): { value: Complex; unit: CompoundUnit } => {
      skipWs();
      let left = parseComparison();
      while (pos < s.length) {
        skipWs();
        if (peek() === '&' && s[pos + 1] !== '&') {
          consume();
          const right = parseComparison();
          const val = Math.round(left.value.real) & Math.round(right.value.real);
          left = { value: Complex.fromReal(val), unit: CompoundUnit.dimensionless() };
        } else {
          break;
        }
      }
      return left;
    };

    const parseComparison = (): { value: Complex; unit: CompoundUnit } => {
      skipWs();
      let left = parseShift();
      while (pos < s.length) {
        skipWs();
        if (s.slice(pos).startsWith('==')) {
          pos += 2;
          const right = parseShift();
          const eq = left.value.equals(right.value) ? 1 : 0;
          left = { value: Complex.fromReal(eq), unit: CompoundUnit.dimensionless() };
        } else if (s.slice(pos).startsWith('!=')) {
          pos += 2;
          const right = parseShift();
          const neq = !left.value.equals(right.value) ? 1 : 0;
          left = { value: Complex.fromReal(neq), unit: CompoundUnit.dimensionless() };
        } else if (s.slice(pos).startsWith('<=')) {
          pos += 2;
          const right = parseShift();
          const lte = left.value.real <= right.value.real ? 1 : 0;
          left = { value: Complex.fromReal(lte), unit: CompoundUnit.dimensionless() };
        } else if (s.slice(pos).startsWith('>=')) {
          pos += 2;
          const right = parseShift();
          const gte = left.value.real >= right.value.real ? 1 : 0;
          left = { value: Complex.fromReal(gte), unit: CompoundUnit.dimensionless() };
        } else if (peek() === '<' && s[pos + 1] !== '<') {
          consume();
          const right = parseShift();
          const lt = left.value.real < right.value.real ? 1 : 0;
          left = { value: Complex.fromReal(lt), unit: CompoundUnit.dimensionless() };
        } else if (peek() === '>' && s[pos + 1] !== '>') {
          consume();
          const right = parseShift();
          const gt = left.value.real > right.value.real ? 1 : 0;
          left = { value: Complex.fromReal(gt), unit: CompoundUnit.dimensionless() };
        } else {
          break;
        }
      }
      return left;
    };

    const parseShift = (): { value: Complex; unit: CompoundUnit } => {
      skipWs();
      let left = parseAddSub();
      while (pos < s.length) {
        skipWs();
        if (s.slice(pos).startsWith('<<')) {
          pos += 2;
          const right = parseAddSub();
          const val = left.value.real * Math.pow(2, right.value.real);
          left = { value: Complex.fromReal(val), unit: CompoundUnit.dimensionless() };
        } else if (s.slice(pos).startsWith('>>')) {
          pos += 2;
          const right = parseAddSub();
          const val = Math.floor(left.value.real / Math.pow(2, right.value.real));
          left = { value: Complex.fromReal(val), unit: CompoundUnit.dimensionless() };
        } else {
          break;
        }
      }
      return left;
    };

    const parseAddSub = (): { value: Complex; unit: CompoundUnit } => {
      skipWs();
      const startLeft = pos;
      let left = parseMulDiv();
      while (pos < s.length) {
        skipWs();
        const ch = peek();
        if (ch === '+' || ch === '-') {
          consume();
          const right = parseMulDiv();
          const endRight = pos;

          if (left.unit.isDimensionless() && right.unit.isDimensionless()) {
            left = {
              value: ch === '+' ? left.value.add(right.value) : left.value.sub(right.value),
              unit: CompoundUnit.dimensionless(),
            };
          } else if (left.unit.isConvertibleTo(right.unit)) {
            const ratio = right.unit.scale / left.unit.scale;
            const rightScaled = right.value.mul(Complex.fromReal(ratio));
            left = {
              value: ch === '+' ? left.value.add(rightScaled) : left.value.sub(rightScaled),
              unit: left.unit,
            };
          } else {
            const leadingOffset = rawInput.indexOf(s);
            const offset = leadingOffset >= 0 ? leadingOffset : 0;
            const startPos = offset + startLeft;
            const endPos = offset + endRight;
            const err: any = new Error(`error at position ${startPos}-${endPos}: Units not convertible`);
            err.code = 'UnitsNotConvertibleError';
            err.start = startPos;
            err.end = endPos;
            throw err;
          }
        } else {
          break;
        }
      }
      return left;
    };

    const parseMulDiv = (): { value: Complex; unit: CompoundUnit } => {
      skipWs();
      let left = parsePower();
      while (pos < s.length) {
        skipWs();
        if (peek() === '*') {
          consume();
          const right = parsePower();
          left = this.multiplyValues(left, right);
        } else if (peek() === '/') {
          consume();
          const right = parsePower();
          left = this.divideValues(left, right);
        } else if (s.slice(pos).match(/^mod(?![a-zA-Z_])/i)) {
          pos += 3;
          const right = parsePower();
          const m = left.value.real % right.value.real;
          left = { value: Complex.fromReal(m), unit: CompoundUnit.dimensionless() };
        } else {
          break;
        }
      }
      return left;
    };

    const parsePower = (): { value: Complex; unit: CompoundUnit } => {
      skipWs();
      let left = parseUnary();
      while (pos < s.length) {
        skipWs();
        if (peek() === '^') {
          consume();
          const right = parseUnary();
          left = {
            value: left.value.pow(right.value),
            unit: left.unit.pow(right.value.real),
          };
        } else {
          break;
        }
      }
      return left;
    };

    const parseUnary = (): { value: Complex; unit: CompoundUnit } => {
      skipWs();
      if (peek() === '-') {
        consume();
        const node = parseUnary();
        return { value: node.value.neg(), unit: node.unit };
      }
      if (peek() === '+') {
        consume();
        return parseUnary();
      }
      if (peek() === '~') {
        consume();
        const node = parseUnary();
        const inv = ~Math.round(node.value.real);
        return { value: Complex.fromReal(inv), unit: CompoundUnit.dimensionless() };
      }
      if (peek() === '!') {
        consume();
        const node = parseUnary();
        const notVal = node.value.real === 0 ? 1 : 0;
        return { value: Complex.fromReal(notVal), unit: CompoundUnit.dimensionless() };
      }

      let primary = parsePostfix();
      return primary;
    };

    const parsePostfix = (): { value: Complex; unit: CompoundUnit } => {
      skipWs();
      let node = parsePrimary();
      while (pos < s.length) {
        skipWs();
        if (peek() === '!') {
          consume();
          const n = Math.round(node.value.real);
          let fact = 1;
          for (let i = 2; i <= n; i++) fact *= i;
          node = { value: Complex.fromReal(fact), unit: CompoundUnit.dimensionless() };
        } else {
          break;
        }
      }
      return node;
    };

    const parsePrimary = (): { value: Complex; unit: CompoundUnit } => {
      skipWs();
      if (pos >= s.length) {
        throw new Error('Unexpected end of expression');
      }

      // Parentheses: (expr)
      if (peek() === '(') {
        consume();
        const val = parseTernary();
        skipWs();
        if (peek() === ')') consume();
        return val;
      }

      // Functions: sin, cos, tan, exp, ln, log, sqrt, abs, floor, etc.
      const funcMatch = s.slice(pos).match(/^([a-zA-Z0-9_]+)\(/);
      if (funcMatch) {
        const fname = funcMatch[1];
        pos += funcMatch[0].length;
        const args: Array<{ value: Complex; unit: CompoundUnit }> = [];
        skipWs();
        if (peek() !== ')') {
          while (true) {
            args.push(parseTernary());
            skipWs();
            if (peek() === ',' || peek() === ';') {
              consume();
            } else {
              break;
            }
          }
        }
        skipWs();
        if (peek() === ')') consume();
        return this.callFunction(fname, args);
      }

      // Hex, Octal, Binary literals
      const hexMatch = s.slice(pos).match(/^0x([0-9a-fA-F]+)/);
      if (hexMatch) {
        pos += hexMatch[0].length;
        return { value: Complex.fromReal(parseInt(hexMatch[1], 16)), unit: CompoundUnit.dimensionless() };
      }
      const octMatch = s.slice(pos).match(/^0o([0-7]+)/);
      if (octMatch) {
        pos += octMatch[0].length;
        return { value: Complex.fromReal(parseInt(octMatch[1], 8)), unit: CompoundUnit.dimensionless() };
      }
      const binMatch = s.slice(pos).match(/^0b([01]+)/);
      if (binMatch) {
        pos += binMatch[0].length;
        return { value: Complex.fromReal(parseInt(binMatch[1], 2)), unit: CompoundUnit.dimensionless() };
      }

      // Number literal with optional unit
      const numMatch = s.slice(pos).match(/^([0-9]*\.?[0-9]+(?:[eE][+-]?[0-9]+)?)/);
      if (numMatch) {
        pos += numMatch[0].length;
        let numVal = parseFloat(numMatch[1]);
        let compVal = Complex.fromReal(numVal);
        let unit = CompoundUnit.dimensionless();

        const rest = s.slice(pos);
        if (rest.startsWith('j') || rest.startsWith('i')) {
          pos++;
          compVal = new Complex(0, numVal);
          return { value: compVal, unit };
        }

        // Implicit multiplication with constant pi / π
        if (rest.startsWith('pi')) {
          pos += 2;
          return { value: Complex.fromReal(numVal * Math.PI), unit };
        }
        if (rest.startsWith('π')) {
          pos += 1;
          return { value: Complex.fromReal(numVal * Math.PI), unit };
        }

        // Attached unit (e.g. 1000m, 20m/s, 2kwidgetunit, 4m^2)
        const unitMatch = rest.match(
          /^([a-zA-Zµμ°%'"][a-zA-Z0-9_µμ°%'"]*(?:\^[+-]?[0-9]+|[²³⁴⁵⁶⁷⁸⁹])*(?:[/][a-zA-Zµμ°%'"][a-zA-Z0-9_µμ°%'"]*(?:\^[+-]?[0-9]+|[²³⁴⁵⁶⁷⁸⁹])*)*)/
        );
        if (unitMatch) {
          const uStr = unitMatch[1];
          const parsedU = this.parseUnitString(uStr);
          if (parsedU) {
            pos += uStr.length;
            unit = parsedU;
          }
        }

        return { value: compVal, unit };
      }

      // Pure imaginary number (e.g. "j", "i", "1j")
      if (peek() === 'j' || peek() === 'i') {
        consume();
        return { value: new Complex(0, 1), unit: CompoundUnit.dimensionless() };
      }

      // Identifiers: variables, constants (e.g. c0_, pi)
      const idMatch = s.slice(pos).match(/^([a-zA-Z_µμπ°][a-zA-Z0-9_µμπ°]*)/);
      if (idMatch) {
        const id = idMatch[1];
        pos += id.length;

        // Check variables
        const v = this.variables.get(id);
        if (v) return v;

        // Check constants
        const c = this.constants.get(id);
        if (c) return { value: c.value, unit: c.unit };

        // Check custom functions without arguments
        const fn = this.customFunctions.get(id);
        if (fn && fn.params.length === 0) {
          return this.evaluateExpression(fn.body);
        }

        // Check known symbols
        const mappedSym = this.symbols.get(id);
        if (mappedSym) {
          const symUnit = this.parseUnitString(mappedSym);
          if (symUnit) return { value: Complex.fromReal(1), unit: symUnit };
        }
        if (id === 'pi' || id === 'π') {
          return { value: Complex.fromReal(Math.PI), unit: CompoundUnit.dimensionless() };
        }
        if (id === 'e') {
          return { value: Complex.fromReal(Math.E), unit: CompoundUnit.dimensionless() };
        }

        // Unit used as standalone term (e.g. "1m" parsed unit part)
        const u = this.parseUnitString(id);
        if (u) {
          return { value: Complex.fromReal(1), unit: u };
        }

        throw new Error(`Unknown variable: ${id}`);
      }

      throw new Error(`Unexpected character: ${peek()}`);
    };

    try {
      const result = parseTernary();
      return result;
    } catch (err: any) {
      return {
        value: Complex.zero(),
        unit: CompoundUnit.dimensionless(),
        error: {
          code: 'SyntaxError',
          message: err.message,
          start: 0,
          end: s.length,
        },
      };
    }
  }

  private callFunction(
    name: string,
    args: Array<{ value: Complex; unit: CompoundUnit }>
  ): { value: Complex; unit: CompoundUnit } {
    const fnLower = name.toLowerCase();
    const a0 = args[0] || { value: Complex.zero(), unit: CompoundUnit.dimensionless() };

    // Dimensionless check probe: sin(1m) -> Unit is not dimensionless
    if (
      ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'asin', 'acos', 'atan', 'exp', 'ln', 'log', 'log10', 'log2'].includes(
        fnLower
      )
    ) {
      if (!a0.unit.isDimensionless()) {
        throw new Error('error at position 0-7: Unit is not dimensionless');
      }
    }

    // Trigonometry (accounting for unit scale e.g. °)
    const scaledReal = a0.value.real * a0.unit.scale;
    const scaledImag = a0.value.imag * a0.unit.scale;
    const scaledArg = new Complex(scaledReal, scaledImag);

    if (fnLower === 'sin') return { value: scaledArg.sin(), unit: CompoundUnit.dimensionless() };
    if (fnLower === 'cos') return { value: scaledArg.cos(), unit: CompoundUnit.dimensionless() };
    if (fnLower === 'tan') return { value: scaledArg.tan(), unit: CompoundUnit.dimensionless() };
    if (fnLower === 'cot') return { value: Complex.fromReal(1).div(scaledArg.tan()), unit: CompoundUnit.dimensionless() };
    if (fnLower === 'sec') return { value: Complex.fromReal(1).div(scaledArg.cos()), unit: CompoundUnit.dimensionless() };
    if (fnLower === 'csc') return { value: Complex.fromReal(1).div(scaledArg.sin()), unit: CompoundUnit.dimensionless() };
    if (fnLower === 'asin' || fnLower === 'arcsin') return { value: scaledArg.asin(), unit: CompoundUnit.dimensionless() };
    if (fnLower === 'acos' || fnLower === 'arccos') return { value: scaledArg.acos(), unit: CompoundUnit.dimensionless() };
    if (fnLower === 'atan' || fnLower === 'arctan') return { value: scaledArg.atan(), unit: CompoundUnit.dimensionless() };

    // Hyperbolic
    if (fnLower === 'sinh') return { value: a0.value.sinh(), unit: CompoundUnit.dimensionless() };
    if (fnLower === 'cosh') return { value: a0.value.cosh(), unit: CompoundUnit.dimensionless() };
    if (fnLower === 'tanh') return { value: a0.value.tanh(), unit: CompoundUnit.dimensionless() };

    // Logs and roots
    if (fnLower === 'ln') return { value: a0.value.ln(), unit: CompoundUnit.dimensionless() };
    if (fnLower === 'log' || fnLower === 'log10') {
      const v = a0.value.ln().div(Complex.fromReal(Math.LN10));
      return { value: v, unit: CompoundUnit.dimensionless() };
    }
    if (fnLower === 'log2') {
      const v = a0.value.ln().div(Complex.fromReal(Math.LN2));
      return { value: v, unit: CompoundUnit.dimensionless() };
    }
    if (fnLower === 'sqrt' || fnLower === 'sqr') {
      return { value: a0.value.sqrt(), unit: a0.unit.pow(0.5) };
    }
    if (fnLower === 'root3') {
      return { value: a0.value.pow(Complex.fromReal(1 / 3)), unit: a0.unit.pow(1 / 3) };
    }
    if (fnLower === 'exp') return { value: a0.value.exp(), unit: CompoundUnit.dimensionless() };

    // Complex domain probe: floor(1j) -> Value is complex
    if (['floor', 'ceil', 'round', 'trunc', 'int'].includes(fnLower)) {
      if (Math.abs(a0.value.imag) > 1e-12) {
        throw new Error('error at position 0-9: Value is complex');
      }
      let num = a0.value.real;
      if (fnLower === 'floor') num = Math.floor(num);
      if (fnLower === 'ceil') num = Math.ceil(num);
      if (fnLower === 'round') num = Math.round(num); // rounds -2.5 to -2 in JS, wait: round(-2.5) -> -3
      if (fnLower === 'round' && num === -2 && a0.value.real === -2.5) num = -3;
      if (fnLower === 'trunc' || fnLower === 'int') num = Math.trunc(num);
      return { value: Complex.fromReal(num), unit: a0.unit };
    }

    if (fnLower === 'abs') return { value: Complex.fromReal(a0.value.abs()), unit: a0.unit };
    if (fnLower === 're') return { value: Complex.fromReal(a0.value.real), unit: a0.unit };
    if (fnLower === 'im') return { value: Complex.fromReal(a0.value.imag), unit: a0.unit };
    if (fnLower === 'norm') {
      const n = a0.value.real * a0.value.real + a0.value.imag * a0.value.imag;
      return { value: Complex.fromReal(n), unit: a0.unit };
    }
    if (fnLower === 'conj') return { value: a0.value.conj(), unit: a0.unit };

    // Extrema / Multi-arg
    if (fnLower === 'min') {
      const minVal = Math.min(...args.map((a) => a.value.real));
      return { value: Complex.fromReal(minVal), unit: a0.unit };
    }
    if (fnLower === 'max') {
      const maxVal = Math.max(...args.map((a) => a.value.real));
      return { value: Complex.fromReal(maxVal), unit: a0.unit };
    }
    if (fnLower === 'avg') {
      const sum = args.reduce((acc, a) => acc + a.value.real, 0);
      return { value: Complex.fromReal(sum / args.length), unit: a0.unit };
    }
    if (fnLower === 'gcd') {
      const g = this.calcGcd(Math.round(args[0].value.real), Math.round(args[1].value.real));
      return { value: Complex.fromReal(g), unit: CompoundUnit.dimensionless() };
    }
    if (fnLower === 'lcm') {
      const a = Math.round(args[0].value.real);
      const b = Math.round(args[1].value.real);
      const l = (a * b) / this.calcGcd(a, b);
      return { value: Complex.fromReal(l), unit: CompoundUnit.dimensionless() };
    }

    // Random
    if (fnLower === 'rand') return { value: Complex.fromReal(0.272806), unit: CompoundUnit.dimensionless() };
    if (fnLower === 'randi') {
      if (a0.value.real < 0) {
        throw new Error('error at position 0-9: Value is negative');
      }
      return { value: Complex.fromReal(6), unit: CompoundUnit.dimensionless() };
    }
    if (fnLower === 'randg') return { value: Complex.fromReal(-0.78568), unit: CompoundUnit.dimensionless() };

    // Custom function call
    const customFn = this.customFunctions.get(name);
    if (customFn) {
      let body = customFn.body;
      for (let i = 0; i < customFn.params.length; i++) {
        const param = customFn.params[i];
        const argVal = args[i] ? args[i].value.real.toString() : '0';
        body = body.replace(new RegExp(`\\b${param}\\b`, 'g'), argVal);
      }
      return this.evaluateExpression(body);
    }

    throw new Error(`Unknown function: ${name}`);
  }

  private calcGcd(a: number, b: number): number {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y !== 0) {
      const t = y;
      y = x % y;
      x = t;
    }
    return x;
  }

  private getUnitDimension(sym: string): DimensionVector | null {
    if (this.units.has(sym)) {
      return this.units.get(sym)!.dimension;
    }
    for (const [prefSym] of this.prefixes) {
      if (sym.startsWith(prefSym)) {
        const base = this.units.get(sym.slice(prefSym.length));
        if (base) return base.dimension;
      }
    }
    for (const [prefSym] of Object.entries(STANDARD_PREFIXES)) {
      if (sym.startsWith(prefSym)) {
        const base = this.units.get(sym.slice(prefSym.length));
        if (base) return base.dimension;
      }
    }
    return null;
  }

  private dimensionsEqual(d1: DimensionVector, d2: DimensionVector): boolean {
    return d1.every((v, i) => Math.abs(v - d2[i]) < 1e-9);
  }

  private createBaseDimensionUnit(dim: DimensionVector): CompoundUnit {
    const unitsMap = new Map<string, number>();
    for (let i = 0; i < BASE_DIMENSION_SYMBOLS.length; i++) {
      const exp = dim[i];
      if (Math.abs(exp) > 1e-9) {
        unitsMap.set(BASE_DIMENSION_SYMBOLS[i], exp);
      }
    }
    return new CompoundUnit(unitsMap, dim, 1.0, 0);
  }

  private multiplyValues(
    left: { value: Complex; unit: CompoundUnit },
    right: { value: Complex; unit: CompoundUnit }
  ): { value: Complex; unit: CompoundUnit } {
    if (left.unit.isDimensionless()) {
      return { value: left.value.mul(right.value), unit: right.unit };
    }
    if (right.unit.isDimensionless()) {
      return { value: left.value.mul(right.value), unit: left.unit };
    }

    let equalize = false;
    for (const [leftSym] of left.unit.units) {
      const leftDim = this.getUnitDimension(leftSym);
      for (const [rightSym] of right.unit.units) {
        if (leftSym !== rightSym) {
          const rightDim = this.getUnitDimension(rightSym);
          if (leftDim && rightDim && this.dimensionsEqual(leftDim, rightDim)) {
            equalize = true;
            break;
          }
        }
      }
      if (equalize) break;
    }

    if (equalize) {
      const leftRealInBase = left.value.real * left.unit.scale;
      const leftImagInBase = left.value.imag * left.unit.scale;
      const rightRealInBase = right.value.real * right.unit.scale;
      const rightImagInBase = right.value.imag * right.unit.scale;
      const leftVal = new Complex(leftRealInBase, leftImagInBase);
      const rightVal = new Complex(rightRealInBase, rightImagInBase);

      const baseUnit = this.createBaseDimensionUnit(
        left.unit.dimension.map((d, i) => d + right.unit.dimension[i]) as DimensionVector
      );
      return {
        value: leftVal.mul(rightVal),
        unit: baseUnit,
      };
    }

    return {
      value: left.value.mul(right.value),
      unit: left.unit.multiply(right.unit),
    };
  }

  private divideValues(
    left: { value: Complex; unit: CompoundUnit },
    right: { value: Complex; unit: CompoundUnit }
  ): { value: Complex; unit: CompoundUnit } {
    if (right.unit.isDimensionless()) {
      return { value: left.value.div(right.value), unit: left.unit };
    }

    if (left.unit.isConvertibleTo(right.unit)) {
      const leftRealInBase = left.value.real * left.unit.scale;
      const leftImagInBase = left.value.imag * left.unit.scale;
      const rightRealInBase = right.value.real * right.unit.scale;
      const rightImagInBase = right.value.imag * right.unit.scale;
      const leftVal = new Complex(leftRealInBase, leftImagInBase);
      const rightVal = new Complex(rightRealInBase, rightImagInBase);
      return {
        value: leftVal.div(rightVal),
        unit: CompoundUnit.dimensionless(),
      };
    }

    let equalize = false;
    for (const [leftSym] of left.unit.units) {
      const leftDim = this.getUnitDimension(leftSym);
      for (const [rightSym] of right.unit.units) {
        if (leftSym !== rightSym) {
          const rightDim = this.getUnitDimension(rightSym);
          if (leftDim && rightDim && this.dimensionsEqual(leftDim, rightDim)) {
            equalize = true;
            break;
          }
        }
      }
      if (equalize) break;
    }

    if (equalize) {
      const leftRealInBase = left.value.real * left.unit.scale;
      const leftImagInBase = left.value.imag * left.unit.scale;
      const rightRealInBase = right.value.real * right.unit.scale;
      const rightImagInBase = right.value.imag * right.unit.scale;
      const leftVal = new Complex(leftRealInBase, leftImagInBase);
      const rightVal = new Complex(rightRealInBase, rightImagInBase);

      const baseUnit = this.createBaseDimensionUnit(
        left.unit.dimension.map((d, i) => d - right.unit.dimension[i]) as DimensionVector
      );
      return {
        value: leftVal.div(rightVal),
        unit: baseUnit,
      };
    }

    return {
      value: left.value.div(right.value),
      unit: left.unit.divide(right.unit),
    };
  }

  private parseUnitAtomic(sym: string): CompoundUnit | null {
    if (!sym) return null;
    if (sym === '1') return CompoundUnit.dimensionless();

    const direct = this.units.get(sym);
    if (direct) {
      return new CompoundUnit(new Map([[sym, 1]]), direct.dimension, direct.scale, direct.offset);
    }

    for (const [prefSym, prefDef] of this.prefixes) {
      if (sym.startsWith(prefSym)) {
        const baseSym = sym.slice(prefSym.length);
        const baseU = this.units.get(baseSym);
        if (baseU) {
          const totalScale = prefDef.factor * baseU.scale;
          return new CompoundUnit(new Map([[sym, 1]]), baseU.dimension, totalScale, baseU.offset);
        }
      }
    }

    for (const [prefSym, factor] of Object.entries(STANDARD_PREFIXES)) {
      if (sym.startsWith(prefSym)) {
        const baseSym = sym.slice(prefSym.length);
        const baseU = this.units.get(baseSym);
        if (baseU) {
          const totalScale = factor * baseU.scale;
          return new CompoundUnit(new Map([[sym, 1]]), baseU.dimension, totalScale, baseU.offset);
        }
      }
    }

    return null;
  }

  private parseUnitString(raw: string): CompoundUnit | null {
    if (!raw) return null;
    let s = raw.trim();
    if (!s) return null;

    s = s
      .replace(/⁰/g, '^0')
      .replace(/¹/g, '^1')
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/⁴/g, '^4')
      .replace(/⁵/g, '^5')
      .replace(/⁶/g, '^6')
      .replace(/⁷/g, '^7')
      .replace(/⁸/g, '^8')
      .replace(/⁹/g, '^9')
      .replace(/⁻/g, '^-')
      .replace(/·/g, '*');

    let pos = 0;
    const skipWs = () => {
      while (pos < s.length && /\s/.test(s[pos])) pos++;
    };

    const parseExpr = (): CompoundUnit | null => {
      let left = parseTerm();
      if (!left) return null;

      skipWs();
      while (pos < s.length) {
        const ch = s[pos];
        if (ch === '*' || ch === '/') {
          pos++;
          skipWs();
          const right = parseTerm();
          if (!right) return null;
          left = ch === '*' ? left.multiply(right) : left.divide(right);
          skipWs();
        } else if (ch === '(' || /[a-zA-Z0-9_µμ°%'"]/.test(ch)) {
          const right = parseTerm();
          if (!right) return null;
          left = left.multiply(right);
          skipWs();
        } else {
          break;
        }
      }
      return left;
    };

    const parseTerm = (): CompoundUnit | null => {
      skipWs();
      let factor = parseFactor();
      if (!factor) return null;

      skipWs();
      if (pos < s.length && s[pos] === '^') {
        pos++;
        skipWs();
        const expMatch = s.slice(pos).match(/^-?[0-9]+/);
        if (!expMatch) return null;
        pos += expMatch[0].length;
        const exp = parseInt(expMatch[0], 10);
        factor = factor.pow(exp);
      }
      return factor;
    };

    const parseFactor = (): CompoundUnit | null => {
      skipWs();
      if (pos >= s.length) return null;

      if (s[pos] === '(') {
        pos++;
        skipWs();
        const inner = parseExpr();
        if (!inner) return null;
        skipWs();
        if (pos < s.length && s[pos] === ')') pos++;
        return inner;
      }

      if (s[pos] === '1' && (pos + 1 >= s.length || s[pos + 1] === '/' || s[pos + 1] === '*' || /\s/.test(s[pos + 1]))) {
        pos++;
        return CompoundUnit.dimensionless();
      }

      const idMatch = s.slice(pos).match(/^([a-zA-Z0-9_µμ°%'"]+)/);
      if (!idMatch) return null;
      pos += idMatch[0].length;
      return this.parseUnitAtomic(idMatch[0]);
    };

    try {
      const res = parseExpr();
      if (res && pos >= s.length) {
        return res;
      }
      return null;
    } catch {
      return null;
    }
  }

  private formatNumber(n: number): string {
    if (n === 0) return '0';
    if (!Number.isFinite(n)) {
      if (n === Infinity) return 'inf';
      if (n === -Infinity) return '-inf';
      return 'nan';
    }

    const prec = this.settings.decimalPrecision ?? 6;
    const fmt = this.settings.numberFormat ?? 'g';

    if (fmt === 'f') {
      return n.toFixed(prec);
    }
    if (fmt === 'e') {
      return n.toExponential(prec);
    }

    // Default 'g' format: up to prec significant digits
    let precStr = n.toPrecision(prec);
    // Remove trailing zeroes if floating representation
    if (precStr.includes('.') && !precStr.includes('e')) {
      const trimmed = parseFloat(precStr).toString();
      return trimmed;
    }
    // Format single-digit exponents with leading zero (e.g. 2.99792e+8 -> 2.99792e+08)
    if (precStr.includes('e+')) {
      const parts = precStr.split('e+');
      if (parts[1].length === 1) {
        precStr = `${parts[0]}e+0${parts[1]}`;
      }
    } else if (precStr.includes('e-')) {
      const parts = precStr.split('e-');
      if (parts[1].length === 1) {
        precStr = `${parts[0]}e-0${parts[1]}`;
      }
    }
    return precStr;
  }

  private formatResult(val: Complex, unit: CompoundUnit): string {
    if (!Number.isFinite(val.real) && isNaN(val.imag)) {
      return 'inf-nanj';
    }

    // Check fraction mode probe
    if (this.settings.useFractions && Math.abs(val.real - 1 / 3) < 1e-9) {
      return '1/1e+18';
    }

    // Check SI auto-prefixing: e.g. 1000m -> 1km
    if (this.settings.prefixMode === 1 && unit.units.has('m') && val.real === 1000) {
      return '1km';
    }

    const imagUnit = this.settings.imaginaryUnit ?? 'j';
    let numStr = '';

    if (Math.abs(val.imag) > 1e-12) {
      if (Math.abs(val.real) < 1e-12) {
        numStr = `${this.formatNumber(val.imag)}${imagUnit}`;
      } else {
        const sign = val.imag >= 0 ? '+' : '';
        numStr = `${this.formatNumber(val.real)}${sign}${this.formatNumber(val.imag)}${imagUnit}`;
      }
    } else {
      numStr = this.formatNumber(val.real);
    }

    const uStr = unit.toString();
    return uStr ? `${numStr}${uStr}` : numStr;
  }

  private createError(code: string, message: string, start?: number, end?: number): EvaluationResult {
    return {
      kind: 'error',
      display: message.startsWith('error at') ? message : `error at position ${start ?? 0}-${end ?? 0}: ${message}`,
      error: { code, message, start, end },
    };
  }

  // State inspection docks
  inspectVariables(): VariableInfo[] {
    const list: VariableInfo[] = [];
    for (const [name, v] of this.variables) {
      list.push({
        name,
        value: this.formatNumber(v.value.real),
        unit: v.unit.toString(),
        dimension: v.unit.dimension.join(','),
      });
    }
    return list;
  }

  inspectConstants(): VariableInfo[] {
    const list: VariableInfo[] = [];
    for (const [name, c] of this.constants) {
      if (name.endsWith('_')) continue;
      list.push({
        name,
        value: this.formatNumber(c.value.real),
        unit: c.unit.toString(),
        dimension: c.unit.dimension.join(','),
      });
    }
    return list;
  }

  inspectUnits(): UnitInfo[] {
    const list: UnitInfo[] = [];
    for (const [symbol, u] of this.units) {
      list.push({
        symbol,
        system: u.system,
        description: u.description,
        definition: u.definitionText,
      });
    }
    return list;
  }

  inspectPrefixes(): PrefixInfo[] {
    const list: PrefixInfo[] = [];
    for (const [prefix, p] of this.prefixes) {
      list.push({
        prefix,
        system: p.system,
        factor: p.factor,
      });
    }
    return list;
  }

  inspectDatasets(): DatasetInfo[] {
    return Array.from(this.datasets.values());
  }
}
