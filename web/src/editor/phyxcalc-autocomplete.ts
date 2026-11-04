/**
 * Autocompletion for PhyxCalc editor.
 * Provides completions for functions, constants, units, active variables, and symbols.
 */

import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

const FUNCTION_COMPLETIONS = [
  { label: 'sin', type: 'function', detail: 'sin(x) - Sine (radians/degrees)' },
  { label: 'cos', type: 'function', detail: 'cos(x) - Cosine' },
  { label: 'tan', type: 'function', detail: 'tan(x) - Tangent' },
  { label: 'cot', type: 'function', detail: 'cot(x) - Cotangent' },
  { label: 'asin', type: 'function', detail: 'asin(x) - Inverse sine' },
  { label: 'acos', type: 'function', detail: 'acos(x) - Inverse cosine' },
  { label: 'atan', type: 'function', detail: 'atan(x) - Inverse tangent' },
  { label: 'sinh', type: 'function', detail: 'sinh(x) - Hyperbolic sine' },
  { label: 'cosh', type: 'function', detail: 'cosh(x) - Hyperbolic cosine' },
  { label: 'tanh', type: 'function', detail: 'tanh(x) - Hyperbolic tangent' },
  { label: 'sqrt', type: 'function', detail: 'sqrt(x) - Square root' },
  { label: 'sqr', type: 'function', detail: 'sqr(x) - Square root (shorthand)' },
  { label: 'exp', type: 'function', detail: 'exp(x) - Exponential e^x' },
  { label: 'ln', type: 'function', detail: 'ln(x) - Natural logarithm' },
  { label: 'log', type: 'function', detail: 'log(x) - Base-10 logarithm' },
  { label: 'log2', type: 'function', detail: 'log2(x) - Base-2 logarithm' },
  { label: 'abs', type: 'function', detail: 'abs(x) - Absolute value / magnitude' },
  { label: 'floor', type: 'function', detail: 'floor(x) - Round down' },
  { label: 'ceil', type: 'function', detail: 'ceil(x) - Round up' },
  { label: 'round', type: 'function', detail: 'round(x) - Round to nearest' },
  { label: 'int', type: 'function', detail: 'int(x) - Integer part' },
  { label: 'min', type: 'function', detail: 'min(a, b) - Minimum value' },
  { label: 'max', type: 'function', detail: 'max(a, b) - Maximum value' },
  { label: 'avg', type: 'function', detail: 'avg(a, b) - Average value' },
  { label: 'gcd', type: 'function', detail: 'gcd(a, b) - Greatest common divisor' },
  { label: 'lcm', type: 'function', detail: 'lcm(a, b) - Least common multiple' },
  { label: 'data', type: 'function', detail: 'data([expr], x, start, stop, step)' },
  { label: 'datalog', type: 'function', detail: 'datalog([expr], x, start, stop, step)' },
];

const CONSTANT_COMPLETIONS = [
  { label: 'pi', type: 'constant', detail: 'π ≈ 3.14159265' },
  { label: 'π', type: 'constant', detail: 'π ≈ 3.14159265' },
  { label: 'e', type: 'constant', detail: 'Euler number ≈ 2.71828' },
  { label: 'c0_', type: 'constant', detail: 'Speed of light = 299792458 m/s' },
  { label: 'h0_', type: 'constant', detail: 'Planck constant = 6.626e-34 J*s' },
  { label: 'hbar', type: 'constant', detail: 'Reduced Planck constant h / 2π' },
  { label: 'kB', type: 'constant', detail: 'Boltzmann constant = 1.38e-23 J/K' },
  { label: 'NA', type: 'constant', detail: 'Avogadro constant = 6.022e23 /mol' },
  { label: 'G', type: 'constant', detail: 'Gravitational constant = 6.67e-11 N*m²/kg²' },
  { label: 'gn', type: 'constant', detail: 'Standard gravity = 9.80665 m/s²' },
  { label: 'eps0', type: 'constant', detail: 'Electric constant = 8.854e-12 F/m' },
  { label: 'µ0', type: 'constant', detail: 'Magnetic constant = 1.256e-6 H/m' },
];

const UNIT_COMPLETIONS = [
  { label: 'km/h', type: 'keyword', detail: 'Speed (km/h)' },
  { label: 'm/s', type: 'keyword', detail: 'Speed (m/s)' },
  { label: 'kHz', type: 'keyword', detail: 'Frequency (kHz)' },
  { label: 'MHz', type: 'keyword', detail: 'Frequency (MHz)' },
  { label: 'GHz', type: 'keyword', detail: 'Frequency (GHz)' },
  { label: 'kPa', type: 'keyword', detail: 'Pressure (kPa)' },
  { label: 'bar', type: 'keyword', detail: 'Pressure (bar = 100 kPa)' },
  { label: 'kW', type: 'keyword', detail: 'Power (kilowatt)' },
  { label: 'kWh', type: 'keyword', detail: 'Energy (kilowatt-hour)' },
  { label: 'KiB', type: 'keyword', detail: 'Data: 1024 Bytes' },
  { label: 'MiB', type: 'keyword', detail: 'Data: 1024² Bytes' },
  { label: 'GiB', type: 'keyword', detail: 'Data: 1024³ Bytes' },
];

export function createPhyxcalcAutocomplete(getVariables?: () => string[]) {
  return function phyxcalcAutocomplete(context: CompletionContext): CompletionResult | null {
    const word = context.matchBefore(/[a-zA-Z0-9_µπ°]+/);
    if (!word || (word.from === word.to && !context.explicit)) {
      return null;
    }

    const variableCompletions = (getVariables ? getVariables() : []).map((v) => ({
      label: v,
      type: 'variable',
      detail: 'Worksheet variable',
    }));

    return {
      from: word.from,
      options: [
        ...FUNCTION_COMPLETIONS,
        ...CONSTANT_COMPLETIONS,
        ...UNIT_COMPLETIONS,
        ...variableCompletions,
      ],
    };
  };
}
