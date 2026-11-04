import { describe, it, expect } from 'vitest';
import { PhyxCalculator } from './calculator';

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
});
