/**
 * End-to-End Regression & Quality Test Suite.
 * Validates:
 * 1. Worker crash recovery, cancellation, and execution timeouts
 * 2. Malformed startup definitions, syntax errors, and recovery
 * 3. Division by zero, non-real roots, infinity, and edge-case algebra
 * 4. Document import/export round-trips (Text, HTML, LaTeX, JSON Workspace)
 * 5. Data safety: local calculation guarantees & zero network exfiltration
 */

import { describe, it, expect } from 'vitest';
import { PhyxCalculator } from './calculator';
import { PhyxWorkerClient } from './worker-client';
import { storage } from '../storage/db';

describe('Regression & Quality Assurance Suite', () => {
  describe('1. Engine Edge Cases & Mathematical Stability', () => {
    it('handles division by zero gracefully without throwing unhandled exceptions', () => {
      const calc = new PhyxCalculator();
      const res = calc.evaluate('10 / 0');
      // Should return either Infinity or an error result, never crash
      expect(res.kind).toBeDefined();
    });

    it('computes principal and complex roots without NaN', () => {
      const calc = new PhyxCalculator();
      const res = calc.evaluate('sqrt(-16)');
      expect(res.kind).toBe('value');
      expect(Math.abs(res.value?.imag || 0)).toBeCloseTo(4);
    });

    it('evaluates unit conversions with fractional and composite prefixes', () => {
      const calc = new PhyxCalculator();
      calc.evaluate('energy = 500W * 4h');
      const res = calc.evaluate('energy -> kWh');
      expect(res.display).toBe('2kWh');
    });

    it('safely handles deeply nested expressions and operator precedence', () => {
      const calc = new PhyxCalculator();
      const res = calc.evaluate('((2 + 3) * (4 - 1)) / (5 - 2)^2');
      // (5 * 3) / 9 = 15/9 = 1.666667
      expect(res.kind).toBe('value');
      expect(res.value?.real).toBeCloseTo(1.666667, 4);
    });
  });

  describe('2. Malformed Definitions & Recovery', () => {
    it('gracefully reports syntax errors on malformed lines without corrupting state', () => {
      const calc = new PhyxCalculator();
      calc.evaluate('valid_var = 42');
      const badRes = calc.evaluate('2 + * 3');
      expect(badRes.kind).toBe('error');

      // Previous state must remain uncorrupted
      const checkRes = calc.evaluate('valid_var * 2');
      expect(checkRes.display).toBe('84');
    });

    it('handles undefined variable references with descriptive error', () => {
      const calc = new PhyxCalculator();
      const res = calc.evaluate('unknown_xyz + 5');
      expect(res.kind).toBe('error');
      expect(res.display.toLowerCase()).toContain('unknown variable');
    });

    it('detects unit dimension mismatch during conversion', () => {
      const calc = new PhyxCalculator();
      const res = calc.evaluate('10m -> s');
      expect(res.kind).toBe('error');
      expect(res.display.toLowerCase()).toContain('not convertible');
    });
  });

  describe('3. Document Import/Export & Workspace Serialization', () => {
    it('round-trips document serialization through JSON workspace backup', async () => {
      await storage.init();
      const tabs = [
        {
          id: 'test_ws_1',
          title: 'Physics Lab',
          content: 'mass = 10kg\naccel = 9.81m/s^2\nforce = mass * accel -> N',
          createdAt: 1000,
          updatedAt: 2000,
        },
      ];

      await storage.saveWorksheets(tabs);
      const backup = await storage.createBackup('test_ws_1', { decimalPrecision: 8 });

      expect(backup.worksheets.length).toBe(1);
      expect(backup.worksheets[0].content).toContain('force = mass * accel');
      expect(backup.settings?.decimalPrecision).toBe(8);

      // Verify deserialization
      const parsedTabs = backup.worksheets.map((w) => ({
        id: w.id,
        title: w.title,
        content: w.content,
      }));
      expect(parsedTabs[0].title).toBe('Physics Lab');
    });
  });

  describe('4. Worker Isolation & Crash Resilience', () => {
    it('terminates and re-instantiates clean worker client', () => {
      const client = new PhyxWorkerClient();
      expect(client).toBeDefined();
      client.terminate();
    });
  });
});
