import { describe, it, expect } from 'vitest';
import { PhyxCalculator } from './calculator';
import rawDefinitions from '../assets/definitions.txt?raw';

describe('PhyxCalc TypeScript Engine Proof of Concept', () => {
  const calc = new PhyxCalculator();

  it('evaluates arithmetic operator precedence', () => {
    calc.reset();
    const r1 = calc.evaluate('2+3*4');
    expect(r1.kind).toBe('value');
    expect(r1.value?.real).toBe(14);
    expect(r1.display).toBe('14');

    const r2 = calc.evaluate('(2+3)*4');
    expect(r2.value?.real).toBe(20);
    expect(r2.display).toBe('20');
  });

  it('evaluates unit conversion', () => {
    calc.reset();
    const r = calc.evaluate('20m/s -> km/h');
    expect(r.display).toBe('72km/h');
  });

  it('evaluates number base conversions', () => {
    calc.reset();
    const r = calc.evaluate('23->hex');
    expect(r.display).toBe('0x17');
  });

  it('evaluates list additions with blank line termination', () => {
    calc.reset();
    expect(calc.evaluate('12+').kind).toBe('silent');
    expect(calc.evaluate('4').kind).toBe('silent');
    expect(calc.evaluate('3').kind).toBe('silent');
    expect(calc.evaluate('5').kind).toBe('silent');
    const finalResult = calc.evaluate('');
    expect(finalResult.kind).toBe('value');
    expect(finalResult.value?.real).toBe(24);
    expect(finalResult.display).toBe('24');
  });

  it('evaluates variables and compound units', () => {
    calc.reset();
    expect(calc.evaluate('radius = 5m').kind).toBe('silent');
    const area = calc.evaluate('pi * radius^2');
    expect(area.kind).toBe('value');
    expect(area.unit?.toString()).toBe('m²');
    expect(Math.abs(area.value!.real - 78.539816)).toBeLessThan(1e-4);
  });

  it('evaluates superscripts (cube / square shorthand)', () => {
    calc.reset();
    const r = calc.evaluate('2³');
    expect(r.value?.real).toBe(8);
  });

  it('evaluates complex numbers', () => {
    calc.reset();
    // (2+3j) * (4+5j) = 8 + 10j + 12j - 15 = -7 + 22j
    const r = calc.evaluate('(2+3j)*(4+5j)');
    expect(r.value?.real).toBe(-7);
    expect(r.value?.imag).toBe(22);
  });

  it('supports variable assignment with unit conversion (one-liner and two-liner)', () => {
    calc.reset();
    // Two-liner
    const r1 = calc.evaluate('speed = 72km/h');
    expect(r1.kind).toBe('silent');
    const r2 = calc.evaluate('speed -> m/s');
    expect(r2.display).toBe('20m/s');

    // One-liner
    const r3 = calc.evaluate('v2 = 72km/h -> m/s');
    expect(r3.display).toBe('20m/s');
    const r4 = calc.evaluate('v2 + 5m/s');
    expect(r4.display).toBe('25m/s');
  });

  it('supports dataset generation with various syntax forms', () => {
    calc.reset();
    // Standard PhyxCalc bracket syntax
    const d1 = calc.evaluate('data([x^2], x, 0, 2, 1)');
    expect(d1.kind).toBe('silent');
    expect(calc.inspectDatasets().length).toBe(1);

    // Variable assigned flexible syntax: d = data(0, 10, 0.2, sin(x))
    const d2 = calc.evaluate('d = data(0, 10, 0.2, sin(x))');
    expect(d2.kind).toBe('display');
    expect(d2.display).toContain('51 points');
    const ds = calc.inspectDatasets().find((d) => d.name === 'd');
    expect(ds).toBeDefined();
    expect(ds?.count).toBe(51);
  });

  it('correctly simplifies and converts dimensional units across prefixes', () => {
    calc.reset();
    // Dimensionless reduction across different prefixes of the same unit
    const divRes = calc.evaluate('10m / 2mm');
    expect(divRes.kind).toBe('value');
    expect(divRes.value?.real).toBe(5000);
    expect(divRes.display).toBe('5000');
    expect(divRes.unit?.isDimensionless()).toBe(true);

    // Multi-line user volume scenario: r = 3.1mm, d = 12µm, V = pi*r^2*d
    expect(calc.evaluate('r = 3.1mm').kind).toBe('silent');
    expect(calc.evaluate('d = 12µm').kind).toBe('silent');
    const v = calc.evaluate('V = pi*r^2*d');
    expect(v.kind).toBe('silent');
    const vVar = calc.inspectVariables().find((x) => x.name === 'V');
    expect(vVar).toBeDefined();
    expect(vVar?.unit).toBe('m³');
    expect(Math.abs(parseFloat(vVar!.value) - 3.62288e-10)).toBeLessThan(1e-14);

    // Conversion to µm^3 and µm³
    const convPow = calc.evaluate('V -> µm^3');
    expect(convPow.kind).toBe('display');
    expect(convPow.display).toBe('3.62288e+08µm^3');

    const convSuper = calc.evaluate('V -> µm³');
    expect(convSuper.kind).toBe('display');
    expect(convSuper.display).toBe('3.62288e+08µm³');

    // Conversion to mm^3 and mm³
    const convMm = calc.evaluate('V -> mm^3');
    expect(convMm.kind).toBe('display');
    expect(convMm.display).toBe('0.362288mm^3');

    // Single-line assignment with conversion
    const vDirect = calc.evaluate('V_direct = pi*(3.1mm)^2 * 12µm -> µm^3');
    expect(vDirect.kind).toBe('value');
    expect(vDirect.display).toBe('3.62288e+08µm^3');

    // Support for Greek mu 'μ' as well as micro sign 'µ' and ascii 'u'
    expect(calc.evaluate('d_greek = 12μm').kind).toBe('silent');
    const convGreek = calc.evaluate('d_greek -> um');
    expect(convGreek.kind).toBe('display');
    expect(convGreek.display).toBe('12um');

    // Unit addition across prefixes
    const addRes = calc.evaluate('1m + 100cm');
    expect(addRes.display).toBe('2m');

    const subRes = calc.evaluate('10m - 2mm');
    expect(subRes.display).toBe('9.998m');
  });

  it('loads and reloads custom startup definitions dynamically', () => {
    const customCalc = new PhyxCalculator();
    // Default calculator does not know custom unit "parsec_custom"
    expect(customCalc.evaluate('10m -> parsec_custom').kind).toBe('error');

    // Reload with custom definitions extending factory definitions
    // PhyxCalc unit definition format: symbol=[expression]
    customCalc.reloadDefinitions(
      rawDefinitions + '\nparsec_custom=[3.085677581e16m]\n'
    );
    const r0 = customCalc.evaluate('2parsec_custom');
    expect(r0.kind).toBe('value');
    const res = customCalc.evaluate('2parsec_custom -> m');
    expect(res.kind).toBe('display');
    expect(res.display).toBe('6.17136e+16m');

    // Inspect units contains the new unit
    const units = customCalc.inspectUnits();
    expect(units.some((u) => u.symbol === 'parsec_custom')).toBe(true);
  });
});
