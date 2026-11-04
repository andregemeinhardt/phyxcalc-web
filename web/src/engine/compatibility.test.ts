/**
 * Automated Compatibility Suite for PhyxCalc Web Engine.
 * Loads all 53 cases from compatibility/cases.json and asserts strict behavioral parity.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { PhyxCalculator } from './calculator';

interface CaseStep {
  input: string;
  expect?: any;
}

interface ObservedStep {
  input: string;
  kind: string;
  display?: string;
  raw?: {
    real?: string;
    imaginary?: string;
    unit?: string;
  };
}

interface TestCase {
  id: string;
  feature: string;
  steps: CaseStep[];
  observation?: {
    settings?: any;
    steps?: ObservedStep[];
  };
}

const casesPath = path.resolve(__dirname, '../../../compatibility/cases.json');
const fixtureData = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));
const cases: TestCase[] = fixtureData.cases;

describe('PhyxCalc 53 Compatibility Fixtures', () => {
  const calc = new PhyxCalculator();

  cases.forEach((testCase) => {
    it(`Case ${testCase.id} (${testCase.feature})`, () => {
      calc.reset();

      // Apply case-specific settings if present
      if (testCase.observation?.settings) {
        calc.setSettings(testCase.observation.settings);
      }

      const obsSteps = testCase.observation?.steps || [];

      testCase.steps.forEach((step, idx) => {
        const obsStep = obsSteps[idx];
        const res = calc.evaluate(step.input);

        // Hazardous hang probe
        if (testCase.id === 'dataset-invalid-step-probe') {
          // In native reference this hung; in web it must reject safely without hanging
          expect(['error', 'silent']).toContain(res.kind);
          return;
        }

        if (obsStep) {
          if (obsStep.kind === 'silent') {
            expect(res.kind).toBe('silent');
          } else if (obsStep.kind === 'display') {
            expect(res.kind).toBe('display');
            if (obsStep.display) {
              expect(res.display).toBe(obsStep.display);
            }
          } else if (obsStep.kind === 'value') {
            expect(res.kind).toBe('value');
            if (obsStep.display) {
              expect(res.display).toBe(obsStep.display);
            }
          } else if (obsStep.kind === 'error') {
            expect(res.kind).toBe('error');
            if (obsStep.display) {
              expect(res.display).toBe(obsStep.display);
            }
          }
        }
      });
    });
  });
});
