/**
 * Physical Units and Dimensional Analysis for PhyxCalc.
 * Base dimensions: [m, kg, s, A, K, mol, cd]
 */

export type DimensionVector = [number, number, number, number, number, number, number];

export interface UnitDef {
  symbol: string;
  dimension: DimensionVector;
  scale: number; // multiplier to convert to base SI units
  offset?: number; // for temperature offsets (e.g. °C, °F)
}

export interface PrefixDef {
  symbol: string;
  factor: number;
}

export const BASE_DIMENSION_SYMBOLS = ['m', 'kg', 's', 'A', 'K', 'mol', 'cd'];

export const STANDARD_PREFIXES: Record<string, number> = {
  Y: 1e24,
  Z: 1e21,
  E: 1e18,
  P: 1e15,
  T: 1e12,
  G: 1e9,
  M: 1e6,
  k: 1e3,
  h: 1e2,
  da: 1e1,
  d: 1e-1,
  c: 1e-2,
  m: 1e-3,
  u: 1e-6,
  'μ': 1e-6,
  n: 1e-9,
  p: 1e-12,
  f: 1e-15,
  a: 1e-18,
  z: 1e-21,
  y: 1e-24,
  Ki: 1024,
  Mi: 1048576,
  Gi: 1073741824,
  Ti: 1099511627776,
};

export class CompoundUnit {
  // Map of unit symbol to exponent
  readonly units: ReadonlyMap<string, number>;
  readonly dimension: DimensionVector;
  readonly scale: number;
  readonly offset: number;

  constructor(
    units: Map<string, number> = new Map(),
    dimension: DimensionVector = [0, 0, 0, 0, 0, 0, 0],
    scale: number = 1.0,
    offset: number = 0.0
  ) {
    this.units = units;
    this.dimension = dimension;
    this.scale = scale;
    this.offset = offset;
  }

  static dimensionless(): CompoundUnit {
    return new CompoundUnit();
  }

  isDimensionless(): boolean {
    return this.dimension.every((d) => d === 0);
  }

  isConvertibleTo(other: CompoundUnit): boolean {
    return this.dimension.every((d, i) => Math.abs(d - other.dimension[i]) < 1e-9);
  }

  multiply(other: CompoundUnit): CompoundUnit {
    const newUnits = new Map(this.units);
    for (const [sym, exp] of other.units) {
      const current = newUnits.get(sym) || 0;
      const sum = current + exp;
      if (sum === 0) {
        newUnits.delete(sym);
      } else {
        newUnits.set(sym, sum);
      }
    }
    const newDim = this.dimension.map((d, i) => d + other.dimension[i]) as DimensionVector;
    return new CompoundUnit(newUnits, newDim, this.scale * other.scale, 0);
  }

  divide(other: CompoundUnit): CompoundUnit {
    const newUnits = new Map(this.units);
    for (const [sym, exp] of other.units) {
      const current = newUnits.get(sym) || 0;
      const diff = current - exp;
      if (diff === 0) {
        newUnits.delete(sym);
      } else {
        newUnits.set(sym, diff);
      }
    }
    const newDim = this.dimension.map((d, i) => d - other.dimension[i]) as DimensionVector;
    return new CompoundUnit(newUnits, newDim, this.scale / other.scale, 0);
  }

  pow(exponent: number): CompoundUnit {
    const newUnits = new Map<string, number>();
    for (const [sym, exp] of this.units) {
      newUnits.set(sym, exp * exponent);
    }
    const newDim = this.dimension.map((d) => d * exponent) as DimensionVector;
    return new CompoundUnit(newUnits, newDim, Math.pow(this.scale, exponent), 0);
  }

  toString(): string {
    if (this.units.size === 0) return '';
    const posParts: string[] = [];
    const negParts: string[] = [];

    const formatPower = (sym: string, exp: number) => {
      const absExp = Math.abs(exp);
      if (absExp === 1) return sym;
      if (absExp === 2) return `${sym}²`;
      if (absExp === 3) return `${sym}³`;
      return `${sym}^${absExp}`;
    };

    for (const [sym, exp] of this.units) {
      if (exp > 0) {
        posParts.push(formatPower(sym, exp));
      } else if (exp < 0) {
        negParts.push(formatPower(sym, exp));
      }
    }

    if (negParts.length > 0) {
      const num = posParts.length > 0 ? posParts.join('*') : '1';
      const den = negParts.length === 1 ? negParts[0] : `(${negParts.join('*')})`;
      return `${num}/${den}`;
    }

    return posParts.join('*');
  }
}
