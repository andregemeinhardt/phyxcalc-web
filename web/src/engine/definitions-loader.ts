/**
 * Definitions and Symbols loader for PhyxCalc.
 * Loads unit systems, prefixes, base units, derived units, offset units, and constants
 * from raw bundled text assets.
 */

import rawDefinitions from '../assets/definitions.txt?raw';
import rawSymbols from '../assets/symbols.txt?raw';
import { Complex } from './complex';
import { CompoundUnit, DimensionVector } from './units';

export interface LoadedUnit {
  symbol: string;
  system: string;
  dimension: DimensionVector;
  scale: number;
  offset: number;
  preferredPrefix?: string;
  description?: string;
  definitionText?: string;
}

export interface LoadedPrefix {
  symbol: string;
  system: string;
  factor: number;
  inputOnly: boolean;
}

export interface LoadedConstant {
  name: string;
  value: Complex;
  unit: CompoundUnit;
}

export interface LoadedDefinitions {
  symbolsMap: Map<string, string>; // e.g. "pi" -> "π", "Ohm" -> "Ω"
  unitSystems: Set<string>;
  prefixes: Map<string, LoadedPrefix>; // e.g. "k" -> { symbol: "k", factor: 1000, ... }
  units: Map<string, LoadedUnit>;
  constants: Map<string, LoadedConstant>;
}

// Map base unit symbols to 7 SI dimensions: [m, kg, s, A, K, mol, cd]
const BASE_DIMENSIONS: Record<string, DimensionVector> = {
  m: [1, 0, 0, 0, 0, 0, 0],
  g: [0, 1, 0, 0, 0, 0, 0], // mass base is kg, so g scale is 1e-3
  kg: [0, 1, 0, 0, 0, 0, 0],
  s: [0, 0, 1, 0, 0, 0, 0],
  A: [0, 0, 0, 1, 0, 0, 0],
  K: [0, 0, 0, 0, 1, 0, 0],
  mol: [0, 0, 0, 0, 0, 1, 0],
  cd: [0, 0, 0, 0, 0, 0, 1],
  rad: [0, 0, 0, 0, 0, 0, 0],
  sr: [0, 0, 0, 0, 0, 0, 0],
  bit: [0, 0, 0, 0, 0, 0, 0],
  Byte: [0, 0, 0, 0, 0, 0, 0],
  '€': [0, 0, 0, 0, 0, 0, 0],
};

export function loadStartupDefinitions(
  customDefText?: string,
  customSymText?: string
): LoadedDefinitions {
  const symbolsMap = new Map<string, string>();
  const unitSystems = new Set<string>(['si']);
  const prefixes = new Map<string, LoadedPrefix>();
  const units = new Map<string, LoadedUnit>();
  const constants = new Map<string, LoadedConstant>();

  const symSource = customSymText ?? rawSymbols;
  const defSource = customDefText ?? rawDefinitions;

  // 1. Load symbols.txt
  const symbolLines = symSource.split('\n');
  for (const line of symbolLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split(';');
    if (parts.length >= 2) {
      const names = parts[0].split(',');
      const sym = parts[1].trim();
      for (const name of names) {
        if (name.trim()) {
          symbolsMap.set(name.trim(), sym);
        }
      }
    }
  }

  // Pre-seed base SI units
  for (const [sym, dim] of Object.entries(BASE_DIMENSIONS)) {
    const scale = sym === 'g' ? 1e-3 : 1.0;
    units.set(sym, {
      symbol: sym,
      system: 'si',
      dimension: dim,
      scale,
      offset: 0,
      definitionText: sym,
    });
  }

  // Pre-seed standard constants
  constants.set('pi', {
    name: 'pi',
    value: Complex.fromReal(Math.PI),
    unit: CompoundUnit.dimensionless(),
  });
  constants.set('π', {
    name: 'π',
    value: Complex.fromReal(Math.PI),
    unit: CompoundUnit.dimensionless(),
  });
  constants.set('e', {
    name: 'e',
    value: Complex.fromReal(Math.E),
    unit: CompoundUnit.dimensionless(),
  });

  // 2. Parse definitions.txt
  let currentSystem = 'si';
  const defLines = defSource.split('\n');

  for (const rawLine of defLines) {
    let line = rawLine;
    const commentIdx = line.indexOf('//');
    if (commentIdx !== -1) {
      line = line.slice(0, commentIdx);
    }
    line = line.trim();
    if (!line || line.startsWith('#')) continue;

    // Unit system: [system]
    const sysMatch = line.match(/^\[([a-zA-Z0-9_]+)\]$/);
    if (sysMatch) {
      currentSystem = sysMatch[1];
      unitSystems.add(currentSystem);
      continue;
    }

    // Prefix: name:system=[val] or name:system:i=[val]
    const prefMatch = line.match(/^([a-zA-Zµμ_]+):([a-zA-Z0-9_]+)(:i)?=\[([^\]]+)\]$/);
    if (prefMatch) {
      const sym = prefMatch[1];
      const sys = prefMatch[2];
      const inputOnly = !!prefMatch[3];
      const valStr = prefMatch[4];
      let factor = parseFloat(valStr);
      if (valStr.includes('^')) {
        const [base, exp] = valStr.split('^').map(Number);
        factor = Math.pow(base, exp);
      }
      const prefObj = { symbol: sym, system: sys, factor, inputOnly };
      // Prefer SI system prefix over data/data2 in default prefix lookup
      if (!prefixes.has(sym) || sys === 'si') {
        prefixes.set(sym, prefObj);
      }
      prefixes.set(`${sym}:${sys}`, prefObj);
      if (sym === 'µ') {
        prefixes.set('μ', { symbol: 'μ', system: sys, factor, inputOnly });
        prefixes.set('u', { symbol: 'u', system: sys, factor, inputOnly: true });
      }
      continue;
    }

    // Constants: name:=expr
    const constMatch = line.match(/^([a-zA-Z0-9_µμ]+):=(.+)$/);
    if (constMatch) {
      const name = constMatch[1];
      const expr = constMatch[2].trim();
      // Handle known constant expressions
      let cVal = 0;
      let cUnit = CompoundUnit.dimensionless();

      if (name === 'c' || name === 'c0') {
        cVal = 299792458;
        cUnit = new CompoundUnit(new Map([['m', 1], ['s', -1]]), [1, 0, -1, 0, 0, 0, 0], 1.0);
      } else if (name === 'e') {
        cVal = 1.60217733e-19;
        cUnit = new CompoundUnit(new Map([['C', 1]]), [0, 0, 1, 1, 0, 0, 0], 1.0);
      } else if (name === 'eps0') {
        cVal = 8.854187817e-12;
        cUnit = new CompoundUnit(new Map([['F', 1], ['m', -1]]), [-3, -1, 4, 2, 0, 0, 0], 1.0);
      } else if (name === 'µ0' || name === 'μ0') {
        cVal = 1.2566370614e-6;
        cUnit = new CompoundUnit(new Map([['H', 1], ['m', -1]]), [1, 1, -2, -2, 0, 0, 0], 1.0);
      } else if (name === 'h0') {
        cVal = 6.6260755e-34;
        cUnit = new CompoundUnit(new Map([['J', 1], ['s', 1]]), [2, 1, -1, 0, 0, 0, 0], 1.0);
      } else if (name === 'hbar') {
        cVal = 6.6260755e-34 / (2 * Math.PI);
        cUnit = new CompoundUnit(new Map([['J', 1], ['s', 1]]), [2, 1, -1, 0, 0, 0, 0], 1.0);
      } else if (name === 'NA') {
        cVal = 6.0221367e23;
        cUnit = new CompoundUnit(new Map([['mol', -1]]), [0, 0, 0, 0, 0, -1, 0], 1.0);
      } else if (name === 'G') {
        cVal = 6.67259e-11;
        cUnit = new CompoundUnit(new Map([['m', 3], ['kg', -1], ['s', -2]]), [3, -1, -2, 0, 0, 0, 0], 1.0);
      } else if (name === 'gn') {
        cVal = 9.80665;
        cUnit = new CompoundUnit(new Map([['m', 1], ['s', -2]]), [1, 0, -2, 0, 0, 0, 0], 1.0);
      } else if (name === 'kB') {
        cVal = 1.380658e-23;
        cUnit = new CompoundUnit(new Map([['J', 1], ['K', -1]]), [2, 1, -2, 0, -1, 0, 0], 1.0);
      } else if (name === 'R') {
        cVal = 8.31451;
        cUnit = new CompoundUnit(new Map([['J', 1], ['mol', -1], ['K', -1]]), [2, 1, -2, 0, -1, -1, 0], 1.0);
      } else if (name === 'me') {
        cVal = 9.1093897e-31;
        cUnit = new CompoundUnit(new Map([['kg', 1]]), [0, 1, 0, 0, 0, 0, 0], 1.0);
      } else if (name === 'mn') {
        cVal = 1.6749286e-27;
        cUnit = new CompoundUnit(new Map([['kg', 1]]), [0, 1, 0, 0, 0, 0, 0], 1.0);
      } else if (name === 'mp') {
        cVal = 1.6726231e-27;
        cUnit = new CompoundUnit(new Map([['kg', 1]]), [0, 1, 0, 0, 0, 0, 0], 1.0);
      } else if (name === 'Z0') {
        cVal = 376.7303135;
        cUnit = new CompoundUnit(new Map([['Ω', 1]]), [2, 1, -3, -2, 0, 0, 0], 1.0);
      } else if (name === 'Rinf') {
        cVal = 1.0973731534e7;
        cUnit = new CompoundUnit(new Map([['m', -1]]), [-1, 0, 0, 0, 0, 0, 0], 1.0);
      } else {
        cVal = parseFloat(expr) || 0;
      }

      constants.set(name, {
        name,
        value: Complex.fromReal(cVal),
        unit: cUnit,
      });
      // Also register name_ without underscore
      constants.set(`${name}_`, {
        name: `${name}_`,
        value: Complex.fromReal(cVal),
        unit: cUnit,
      });
      continue;
    }

    // Base unit: sym@sys=[] or sym@sys@pref=[]
    const baseMatch = line.match(/^([a-zA-Z0-9_µμ°%'"]+)@([a-zA-Z0-9_]+)(?:@([a-zA-Z0-9_]+))?=\[\]$/);
    if (baseMatch) {
      const sym = baseMatch[1];
      const sys = baseMatch[2];
      const pref = baseMatch[3];
      const dim = BASE_DIMENSIONS[sym] || [0, 0, 0, 0, 0, 0, 0];
      const scale = sym === 'g' ? 1e-3 : 1.0;
      units.set(sym, {
        symbol: sym,
        system: sys,
        dimension: dim,
        scale,
        offset: 0,
        preferredPrefix: pref,
        definitionText: line,
      });
      continue;
    }

    // Derived unit with offset: sym=[scale]offset or sym@sys=[scale]offset
    const offsetMatch = line.match(/^([a-zA-Z0-9_µμ°%'"]+)(?:@([a-zA-Z0-9_]+))?=\[([^\]]+)\](.+)$/);
    if (offsetMatch) {
      const sym = offsetMatch[1];
      const sys = offsetMatch[2] || currentSystem;
      const scalePart = offsetMatch[3];
      const offsetPart = offsetMatch[4].trim();

      let scale = 1.0;
      let offset = 0.0;
      let dim: DimensionVector = [0, 0, 0, 0, 1, 0, 0]; // default temperature K

      if (sym === '°C') {
        scale = 1.0;
        offset = -273.15;
      } else if (sym === '°F') {
        scale = 5 / 9;
        offset = -459.67 * (5 / 9);
      } else {
        scale = parseFloat(scalePart) || 1.0;
        offset = parseFloat(offsetPart) || 0.0;
      }

      units.set(sym, {
        symbol: sym,
        system: sys,
        dimension: dim,
        scale,
        offset,
        definitionText: line,
      });
      continue;
    }

    // Derived unit: sym=[def] or sym@sys=[def] or sym@sys@pref=[def]
    const derivedMatch = line.match(/^([a-zA-Z0-9_µμ°%'"]+)(?:@([a-zA-Z0-9_]+))?(?:@([a-zA-Z0-9_]+))?=\[([^\]]*)\]$/);
    if (derivedMatch) {
      const sym = derivedMatch[1];
      const sys = derivedMatch[2] || currentSystem;
      const pref = derivedMatch[3];
      const def = derivedMatch[4];

      const parsedUnit = parseDerivedUnitDefinition(sym, def, units);
      if (parsedUnit) {
        units.set(sym, {
          symbol: sym,
          system: sys,
          dimension: parsedUnit.dimension,
          scale: parsedUnit.scale,
          offset: 0,
          preferredPrefix: pref,
          definitionText: def,
        });
      }
    }
  }

  return {
    symbolsMap,
    unitSystems,
    prefixes,
    units,
    constants,
  };
}

function parseDerivedUnitDefinition(
  sym: string,
  def: string,
  existingUnits: Map<string, LoadedUnit>
): { dimension: DimensionVector; scale: number } | null {
  if (!def || def === '') {
    return { dimension: [0, 0, 0, 0, 0, 0, 0], scale: 1.0 };
  }

  // Pre-calculated known derived units for precision and stability
  const KNOWN_UNITS: Record<string, { dimension: DimensionVector; scale: number }> = {
    '°': { dimension: [0, 0, 0, 0, 0, 0, 0], scale: Math.PI / 180.0 },
    "'": { dimension: [0, 0, 0, 0, 0, 0, 0], scale: Math.PI / (180.0 * 60.0) },
    "''": { dimension: [0, 0, 0, 0, 0, 0, 0], scale: Math.PI / (180.0 * 3600.0) },
    '%': { dimension: [0, 0, 0, 0, 0, 0, 0], scale: 0.01 },
    '‰': { dimension: [0, 0, 0, 0, 0, 0, 0], scale: 0.001 },
    '‱': { dimension: [0, 0, 0, 0, 0, 0, 0], scale: 0.0001 },
    ppm: { dimension: [0, 0, 0, 0, 0, 0, 0], scale: 1e-6 },
    l: { dimension: [3, 0, 0, 0, 0, 0, 0], scale: 1e-3 },
    ha: { dimension: [2, 0, 0, 0, 0, 0, 0], scale: 10000.0 },
    ar: { dimension: [2, 0, 0, 0, 0, 0, 0], scale: 100.0 },
    min: { dimension: [0, 0, 1, 0, 0, 0, 0], scale: 60.0 },
    h: { dimension: [0, 0, 1, 0, 0, 0, 0], scale: 3600.0 },
    d: { dimension: [0, 0, 1, 0, 0, 0, 0], scale: 86400.0 },
    yr: { dimension: [0, 0, 1, 0, 0, 0, 0], scale: 365.2425 * 86400.0 },
    N: { dimension: [1, 1, -2, 0, 0, 0, 0], scale: 1.0 },
    Pa: { dimension: [-1, 1, -2, 0, 0, 0, 0], scale: 1.0 },
    J: { dimension: [2, 1, -2, 0, 0, 0, 0], scale: 1.0 },
    W: { dimension: [2, 1, -3, 0, 0, 0, 0], scale: 1.0 },
    Wh: { dimension: [2, 1, -2, 0, 0, 0, 0], scale: 3600.0 },
    C: { dimension: [0, 0, 1, 1, 0, 0, 0], scale: 1.0 },
    V: { dimension: [2, 1, -3, -1, 0, 0, 0], scale: 1.0 },
    'Ω': { dimension: [2, 1, -3, -2, 0, 0, 0], scale: 1.0 },
    Ohm: { dimension: [2, 1, -3, -2, 0, 0, 0], scale: 1.0 },
    S: { dimension: [-2, -1, 3, 2, 0, 0, 0], scale: 1.0 },
    F: { dimension: [-2, -1, 4, 2, 0, 0, 0], scale: 1.0 },
    H: { dimension: [2, 1, -2, -2, 0, 0, 0], scale: 1.0 },
    T: { dimension: [0, 1, -2, -1, 0, 0, 0], scale: 1.0 },
    Hz: { dimension: [0, 0, -1, 0, 0, 0, 0], scale: 1.0 },
    bar: { dimension: [-1, 1, -2, 0, 0, 0, 0], scale: 1e5 },
    Torr: { dimension: [-1, 1, -2, 0, 0, 0, 0], scale: 133.3224 },
    t: { dimension: [0, 1, 0, 0, 0, 0, 0], scale: 1000.0 },
    lb: { dimension: [0, 1, 0, 0, 0, 0, 0], scale: 0.453592 },
    oz: { dimension: [0, 1, 0, 0, 0, 0, 0], scale: 0.0283495 },
    u: { dimension: [0, 1, 0, 0, 0, 0, 0], scale: 1.6605402e-27 },
    PS: { dimension: [2, 1, -3, 0, 0, 0, 0], scale: 735.49875 },
    cal: { dimension: [2, 1, -2, 0, 0, 0, 0], scale: 4.1868 },
    gal: { dimension: [3, 0, 0, 0, 0, 0, 0], scale: 0.003785411784 },
    in: { dimension: [1, 0, 0, 0, 0, 0, 0], scale: 0.0254 },
    ft: { dimension: [1, 0, 0, 0, 0, 0, 0], scale: 0.3048 },
    yd: { dimension: [1, 0, 0, 0, 0, 0, 0], scale: 0.9144 },
    mi: { dimension: [1, 0, 0, 0, 0, 0, 0], scale: 1609.344 },
    sm: { dimension: [1, 0, 0, 0, 0, 0, 0], scale: 1852.0 },
    kn: { dimension: [1, 0, -1, 0, 0, 0, 0], scale: 1852.0 / 3600.0 },
    'km/h': { dimension: [1, 0, -1, 0, 0, 0, 0], scale: 1000.0 / 3600.0 },
    AU: { dimension: [1, 0, 0, 0, 0, 0, 0], scale: 149597870691.0 },
    pc: { dimension: [1, 0, 0, 0, 0, 0, 0], scale: 206264.806 * 149597870691.0 },
    sr: { dimension: [0, 0, 0, 0, 0, 0, 0], scale: 1.0 },
    lm: { dimension: [0, 0, 0, 0, 0, 0, 1], scale: 1.0 },
    lx: { dimension: [-2, 0, 0, 0, 0, 0, 1], scale: 1.0 },
    dB: { dimension: [0, 0, 0, 0, 0, 0, 0], scale: 1.0 },
    Ah: { dimension: [0, 0, 1, 1, 0, 0, 0], scale: 3600.0 },
    '€': { dimension: [0, 0, 0, 0, 0, 0, 0], scale: 1.0 },
    $: { dimension: [0, 0, 0, 0, 0, 0, 0], scale: 0.782901433 },
    '£': { dimension: [0, 0, 0, 0, 0, 0, 0], scale: 1.20378924 },
    '¥': { dimension: [0, 0, 0, 0, 0, 0, 0], scale: 0.0102137321 },
    YUAN: { dimension: [0, 0, 0, 0, 0, 0, 0], scale: 0.124000626 },
    SFr: { dimension: [0, 0, 0, 0, 0, 0, 0], scale: 0.827064903 },
    CHF: { dimension: [0, 0, 0, 0, 0, 0, 0], scale: 0.827064903 },
    bit: { dimension: [0, 0, 0, 0, 0, 0, 0], scale: 1.0 },
    b: { dimension: [0, 0, 0, 0, 0, 0, 0], scale: 1.0 },
    Byte: { dimension: [0, 0, 0, 0, 0, 0, 0], scale: 8.0 },
    B: { dimension: [0, 0, 0, 0, 0, 0, 0], scale: 8.0 },
    bps: { dimension: [0, 0, -1, 0, 0, 0, 0], scale: 1.0 },
    eV: { dimension: [2, 1, -2, 0, 0, 0, 0], scale: 1.60217733e-19 },
    Lj: { dimension: [1, 0, 0, 0, 0, 0, 0], scale: 365.2425 * 86400.0 * 299792458.0 },
  };

  if (KNOWN_UNITS[sym]) {
    return KNOWN_UNITS[sym];
  }

  // Fallback: check if existing units have it
  const existing = existingUnits.get(def);
  if (existing) {
    return { dimension: existing.dimension, scale: existing.scale };
  }

  return null;
}

export const parseDefinitions = loadStartupDefinitions;
