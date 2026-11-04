import { CompoundUnit, UnitDef } from './units';
import { Complex } from './complex';

export interface DefinedConstant {
  name: string;
  value: Complex;
  unit: CompoundUnit;
}

export const BASE_UNITS: Record<string, UnitDef> = {
  m:   { symbol: 'm',   dimension: [1, 0, 0, 0, 0, 0, 0], scale: 1.0 },
  g:   { symbol: 'g',   dimension: [0, 1, 0, 0, 0, 0, 0], scale: 1e-3 },
  kg:  { symbol: 'kg',  dimension: [0, 1, 0, 0, 0, 0, 0], scale: 1.0 },
  s:   { symbol: 's',   dimension: [0, 0, 1, 0, 0, 0, 0], scale: 1.0 },
  A:   { symbol: 'A',   dimension: [0, 0, 0, 1, 0, 0, 0], scale: 1.0 },
  K:   { symbol: 'K',   dimension: [0, 0, 0, 0, 1, 0, 0], scale: 1.0 },
  mol: { symbol: 'mol', dimension: [0, 0, 0, 0, 0, 1, 0], scale: 1.0 },
  cd:  { symbol: 'cd',  dimension: [0, 0, 0, 0, 0, 0, 1], scale: 1.0 },
};

export const STANDARD_UNITS: Record<string, UnitDef> = {
  ...BASE_UNITS,
  min:   { symbol: 'min',   dimension: [0, 0, 1, 0, 0, 0, 0], scale: 60.0 },
  h:     { symbol: 'h',     dimension: [0, 0, 1, 0, 0, 0, 0], scale: 3600.0 },
  d:     { symbol: 'd',     dimension: [0, 0, 1, 0, 0, 0, 0], scale: 86400.0 },
  N:     { symbol: 'N',     dimension: [1, 1, -2, 0, 0, 0, 0], scale: 1.0 },
  J:     { symbol: 'J',     dimension: [2, 1, -2, 0, 0, 0, 0], scale: 1.0 },
  W:     { symbol: 'W',     dimension: [2, 1, -3, 0, 0, 0, 0], scale: 1.0 },
  Pa:    { symbol: 'Pa',    dimension: [-1, 1, -2, 0, 0, 0, 0], scale: 1.0 },
  bar:   { symbol: 'bar',   dimension: [-1, 1, -2, 0, 0, 0, 0], scale: 1e5 },
  Hz:    { symbol: 'Hz',    dimension: [0, 0, -1, 0, 0, 0, 0], scale: 1.0 },
  V:     { symbol: 'V',     dimension: [2, 1, -3, -1, 0, 0, 0], scale: 1.0 },
  Ohm:   { symbol: 'Ohm',   dimension: [2, 1, -3, -2, 0, 0, 0], scale: 1.0 },
  'Ω':   { symbol: 'Ω',     dimension: [2, 1, -3, -2, 0, 0, 0], scale: 1.0 },
  C:     { symbol: 'C',     dimension: [0, 0, 1, 1, 0, 0, 0], scale: 1.0 },
  F:     { symbol: 'F',     dimension: [-2, -1, 4, 2, 0, 0, 0], scale: 1.0 },
  T:     { symbol: 'T',     dimension: [0, 1, -2, -1, 0, 0, 0], scale: 1.0 },
  H:     { symbol: 'H',     dimension: [2, 1, -2, -2, 0, 0, 0], scale: 1.0 },
  'km/h':{ symbol: 'km/h',  dimension: [1, 0, -1, 0, 0, 0, 0], scale: 1000.0 / 3600.0 },
  B:     { symbol: 'B',     dimension: [0, 0, 0, 0, 0, 0, 0], scale: 1.0 },
  bit:   { symbol: 'bit',   dimension: [0, 0, 0, 0, 0, 0, 0], scale: 0.125 },
};

export function createUnit(symbol: string): CompoundUnit | null {
  if (STANDARD_UNITS[symbol]) {
    const u = STANDARD_UNITS[symbol];
    return new CompoundUnit(new Map([[symbol, 1]]), u.dimension, u.scale, u.offset || 0);
  }
  return null;
}

export const STANDARD_CONSTANTS: Record<string, DefinedConstant> = {
  pi: {
    name: 'pi',
    value: Complex.fromReal(Math.PI),
    unit: CompoundUnit.dimensionless(),
  },
  'π': {
    name: 'π',
    value: Complex.fromReal(Math.PI),
    unit: CompoundUnit.dimensionless(),
  },
  e: {
    name: 'e',
    value: Complex.fromReal(Math.E),
    unit: CompoundUnit.dimensionless(),
  },
  c0_: {
    name: 'c0_',
    value: Complex.fromReal(299792458),
    unit: new CompoundUnit(new Map([['m', 1], ['s', -1]]), [1, 0, -1, 0, 0, 0, 0], 1.0),
  },
};
