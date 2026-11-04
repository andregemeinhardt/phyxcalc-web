/**
 * Web Worker for PhyxCalc Engine.
 * Evaluates calculations in a dedicated background thread with error isolation.
 */

import { PhyxCalculator } from './calculator';
import {
  WorkerInMessage,
  WorkerOutMessage,
  EvaluationResponse,
  EngineStateSummary,
} from './api';

const calculators = new Map<string, PhyxCalculator>();

function getCalculator(docId: string = 'default'): PhyxCalculator {
  let calc = calculators.get(docId);
  if (!calc) {
    calc = new PhyxCalculator();
    calculators.set(docId, calc);
  }
  return calc;
}

self.onmessage = (event: MessageEvent<WorkerInMessage>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'EVALUATE': {
      const { id, expression, documentId = 'default' } = msg.payload;
      const calc = getCalculator(documentId);
      const start = performance.now();

      try {
        const evalRes = calc.evaluate(expression);
        const duration = performance.now() - start;

        const response: EvaluationResponse = {
          id,
          kind: evalRes.kind,
          display: evalRes.display,
          unit: evalRes.unit?.toString(),
          value: evalRes.value
            ? { real: evalRes.value.real, imag: evalRes.value.imag }
            : undefined,
          error: evalRes.error,
          executionTimeMs: duration,
        };

        const outMsg: WorkerOutMessage = {
          type: 'EVALUATE_RESULT',
          payload: response,
        };
        self.postMessage(outMsg);
      } catch (err: any) {
        const duration = performance.now() - start;
        const response: EvaluationResponse = {
          id,
          kind: 'error',
          display: err.message || 'Calculation error',
          error: {
            code: 'ProgramError',
            message: err.message || 'Unknown error',
          },
          executionTimeMs: duration,
        };
        self.postMessage({ type: 'EVALUATE_RESULT', payload: response });
      }
      break;
    }

    case 'EVALUATE_DOCUMENT': {
      const { id, lines, documentId = 'default', resetBefore = true } = msg.payload;
      const calc = getCalculator(documentId);
      if (resetBefore) {
        calc.reset();
      }
      const results: EvaluationResponse[] = [];
      const startAll = performance.now();

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim() || line.trim().startsWith('//')) {
          results.push({
            id: `${id}_${i}`,
            kind: 'silent',
            display: '',
            executionTimeMs: 0,
          });
          continue;
        }

        const lineStart = performance.now();
        try {
          const evalRes = calc.evaluate(line);
          const duration = performance.now() - lineStart;
          results.push({
            id: `${id}_${i}`,
            kind: evalRes.kind,
            display: evalRes.display,
            unit: evalRes.unit?.toString(),
            value: evalRes.value
              ? { real: evalRes.value.real, imag: evalRes.value.imag }
              : undefined,
            error: evalRes.error,
            executionTimeMs: duration,
          });
        } catch (err: any) {
          const duration = performance.now() - lineStart;
          results.push({
            id: `${id}_${i}`,
            kind: 'error',
            display: err.message || 'Error',
            error: {
              code: 'ProgramError',
              message: err.message || 'Error',
            },
            executionTimeMs: duration,
          });
        }
      }

      const totalDuration = performance.now() - startAll;
      const summary: EngineStateSummary = {
        documentId,
        variables: calc.inspectVariables(),
        constants: calc.inspectConstants(),
        functions: [],
        datasets: calc.inspectDatasets(),
        units: calc.inspectUnits(),
        prefixes: calc.inspectPrefixes(),
      };

      self.postMessage({
        type: 'EVALUATE_DOCUMENT_RESULT',
        payload: {
          id,
          results,
          state: summary,
          totalExecutionTimeMs: totalDuration,
        },
      });
      break;
    }

    case 'RESET': {
      const docId = msg.documentId || 'default';
      const calc = calculators.get(docId);
      if (calc) {
        calc.reset();
      }
      break;
    }

    case 'SET_SETTINGS': {
      const settings = msg.payload;
      for (const calc of calculators.values()) {
        calc.setSettings(settings);
      }
      break;
    }

    case 'GET_STATE': {
      const docId = msg.documentId || 'default';
      const calc = getCalculator(docId);

      const summary: EngineStateSummary = {
        documentId: docId,
        variables: calc.inspectVariables(),
        constants: calc.inspectConstants(),
        functions: [],
        datasets: calc.inspectDatasets(),
        units: calc.inspectUnits(),
        prefixes: calc.inspectPrefixes(),
      };

      const outMsg: WorkerOutMessage = {
        type: 'STATE_SUMMARY',
        payload: summary,
      };
      self.postMessage(outMsg);
      break;
    }
  }
};
