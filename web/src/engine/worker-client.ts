/**
 * Client for PhyxCalc Web Worker.
 * Manages background evaluation, request correlation, timeout cancellation, and crash recovery.
 */

import {
  DEFAULT_ENGINE_SETTINGS,
  DocumentEvaluationRequest,
  DocumentEvaluationResponse,
  EngineSettings,
  EngineStateSummary,
  EvaluationRequest,
  EvaluationResponse,
  WorkerInMessage,
  WorkerOutMessage,
} from './api';

interface PendingRequest {
  id: string;
  resolve: (response: EvaluationResponse) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface PendingDocRequest {
  id: string;
  resolve: (response: DocumentEvaluationResponse) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export class PhyxWorkerClient {
  private worker: Worker | null = null;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private pendingDocRequests: Map<string, PendingDocRequest> = new Map();
  private pendingStateRequests: Array<{
    resolve: (summary: EngineStateSummary) => void;
    reject: (error: Error) => void;
  }> = [];
  private settings: EngineSettings = { ...DEFAULT_ENGINE_SETTINGS };
  private terminated = false;

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    if (this.terminated) return;
    try {
      this.worker = new Worker(new URL('./worker.ts', import.meta.url), {
        type: 'module',
      });
      this.worker.onmessage = this.handleMessage.bind(this);
      this.worker.onerror = this.handleError.bind(this);
    } catch (err) {
      console.error('Failed to initialize PhyxCalc Web Worker:', err);
    }
  }

  private handleMessage(event: MessageEvent<WorkerOutMessage>): void {
    const msg = event.data;

    if (msg.type === 'EVALUATE_RESULT') {
      const pending = this.pendingRequests.get(msg.payload.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(msg.payload.id);
        pending.resolve(msg.payload);
      }
    } else if (msg.type === 'EVALUATE_DOCUMENT_RESULT') {
      const pending = this.pendingDocRequests.get(msg.payload.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingDocRequests.delete(msg.payload.id);
        pending.resolve(msg.payload);
      }
    } else if (msg.type === 'STATE_SUMMARY') {
      const pending = this.pendingStateRequests.shift();
      if (pending) {
        pending.resolve(msg.payload);
      }
    }
  }

  private handleError(event: ErrorEvent): void {
    console.error('PhyxCalc Worker error:', event);
    // Reject all pending requests
    for (const [, req] of this.pendingRequests) {
      clearTimeout(req.timer);
      req.reject(new Error(event.message || 'Worker calculation failed'));
    }
    this.pendingRequests.clear();

    for (const [, req] of this.pendingDocRequests) {
      clearTimeout(req.timer);
      req.reject(new Error(event.message || 'Worker calculation failed'));
    }
    this.pendingDocRequests.clear();

    for (const req of this.pendingStateRequests) {
      req.reject(new Error('Worker crashed'));
    }
    this.pendingStateRequests = [];

    // Re-initialize worker to recover
    if (!this.terminated) {
      if (this.worker) {
        this.worker.terminate();
      }
      this.initWorker();
    }
  }

  evaluate(
    expression: string,
    documentId: string = 'default',
    customSettings?: Partial<EngineSettings>
  ): Promise<EvaluationResponse> {
    const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const effectiveSettings = { ...this.settings, ...customSettings };
    const timeoutMs = effectiveSettings.calculationTimeoutMs ?? 2000;

    return new Promise<EvaluationResponse>((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker is not available'));
        return;
      }

      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        // On hard hang, terminate and restart worker
        if (this.worker) {
          this.worker.terminate();
          this.worker = null;
          this.initWorker();
        }
        resolve({
          id,
          kind: 'error',
          display: `Calculation timed out after ${timeoutMs}ms`,
          error: {
            code: 'ProgramError',
            message: `Calculation timed out after ${timeoutMs}ms`,
          },
          executionTimeMs: timeoutMs,
        });
      }, timeoutMs);

      this.pendingRequests.set(id, { id, resolve, reject, timer });

      const request: EvaluationRequest = {
        id,
        expression,
        documentId,
        settings: effectiveSettings,
      };

      const msg: WorkerInMessage = {
        type: 'EVALUATE',
        payload: request,
      };

      this.worker.postMessage(msg);
    });
  }

  evaluateDocument(
    lines: string[],
    documentId: string = 'default',
    resetBefore: boolean = true,
    customSettings?: Partial<EngineSettings>
  ): Promise<DocumentEvaluationResponse> {
    const id = `req_doc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const effectiveSettings = { ...this.settings, ...customSettings };
    const timeoutMs = (effectiveSettings.calculationTimeoutMs ?? 2000) * 3;

    return new Promise<DocumentEvaluationResponse>((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker is not available'));
        return;
      }

      const timer = setTimeout(() => {
        this.pendingDocRequests.delete(id);
        if (this.worker) {
          this.worker.terminate();
          this.worker = null;
          this.initWorker();
        }
        resolve({
          id,
          results: lines.map((_, i) => ({
            id: `${id}_${i}`,
            kind: 'error',
            display: `Document calculation timed out after ${timeoutMs}ms`,
            error: {
              code: 'ProgramError',
              message: `Document calculation timed out after ${timeoutMs}ms`,
            },
            executionTimeMs: timeoutMs,
          })),
          state: {
            documentId,
            variables: [],
            constants: [],
            functions: [],
            datasets: [],
            units: [],
            prefixes: [],
          },
          totalExecutionTimeMs: timeoutMs,
        });
      }, timeoutMs);

      this.pendingDocRequests.set(id, { id, resolve, reject, timer });

      const request: DocumentEvaluationRequest = {
        id,
        lines,
        documentId,
        resetBefore,
        settings: effectiveSettings,
      };

      const msg: WorkerInMessage = {
        type: 'EVALUATE_DOCUMENT',
        payload: request,
      };

      this.worker.postMessage(msg);
    });
  }

  reset(documentId?: string): Promise<void> {
    return new Promise((resolve) => {
      if (this.worker) {
        this.worker.postMessage({ type: 'RESET', documentId });
      }
      resolve();
    });
  }

  setSettings(settings: Partial<EngineSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    return new Promise((resolve) => {
      if (this.worker) {
        this.worker.postMessage({ type: 'SET_SETTINGS', payload: settings });
      }
      resolve();
    });
  }

  getState(documentId: string = 'default'): Promise<EngineStateSummary> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker is not available'));
        return;
      }
      this.pendingStateRequests.push({ resolve, reject });
      this.worker.postMessage({ type: 'GET_STATE', documentId });
    });
  }

  terminate(): void {
    this.terminated = true;
    for (const [, req] of this.pendingRequests) {
      clearTimeout(req.timer);
    }
    this.pendingRequests.clear();
    for (const [, req] of this.pendingDocRequests) {
      clearTimeout(req.timer);
    }
    this.pendingDocRequests.clear();
    this.pendingStateRequests = [];
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
