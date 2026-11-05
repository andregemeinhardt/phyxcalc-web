/**
 * Versioned API types and serializable contracts for PhyxCalc Web Engine.
 * API Version: 1.0.0
 */

export const ENGINE_API_VERSION = '1.0.0';

export interface SerializableComplex {
  real: number;
  imag: number;
}

export type DimensionTuple = [number, number, number, number, number, number, number];

export interface SerializableUnit {
  symbol: string;
  dimension: DimensionTuple;
  scale: number;
  offset?: number;
}

export interface EngineSettings {
  decimalPrecision: number;
  numberFormat: 'g' | 'f' | 'e';
  imaginaryUnit: 'j' | 'i';
  useFractions: boolean;
  unitMode: number;   // 1: minimize, 2: force input, 3: base only
  prefixMode: number; // 1: auto prefix, 2: no prefix
  maxRecursionDepth?: number;
  maxDatasetPoints?: number;
  calculationTimeoutMs?: number;
}

export const DEFAULT_ENGINE_SETTINGS: EngineSettings = {
  decimalPrecision: 6,
  numberFormat: 'g',
  imaginaryUnit: 'j',
  useFractions: false,
  unitMode: 1,
  prefixMode: 1,
  maxRecursionDepth: 50,
  maxDatasetPoints: 10000,
  calculationTimeoutMs: 2000,
};

export type CalculationKind = 'value' | 'display' | 'silent' | 'error';

export interface CalculationDiagnostic {
  code: string;
  message: string;
  start?: number;
  end?: number;
}

export interface EvaluationRequest {
  id: string;
  expression: string;
  documentId?: string;
  settings?: Partial<EngineSettings>;
}

export interface DocumentEvaluationRequest {
  id: string;
  lines: string[];
  documentId?: string;
  resetBefore?: boolean;
  settings?: Partial<EngineSettings>;
}

export interface EvaluationResponse {
  id: string;
  kind: CalculationKind;
  value?: SerializableComplex;
  unit?: string;
  display: string;
  error?: CalculationDiagnostic;
  executionTimeMs: number;
}

export interface DocumentEvaluationResponse {
  id: string;
  results: EvaluationResponse[];
  state: EngineStateSummary;
  totalExecutionTimeMs: number;
}

export interface VariableInfo {
  name: string;
  value: string;
  unit: string;
  dimension?: string;
}

export interface UnitInfo {
  symbol: string;
  system: string;
  description?: string;
  definition?: string;
}

export interface PrefixInfo {
  prefix: string;
  system: string;
  factor: number;
}

export interface DatasetPoint {
  x: number;
  yReal: number;
  yImag: number;
}

export interface DatasetInfo {
  name: string;
  count: number;
  xRange?: [number, number];
  yRange?: [number, number];
  points?: DatasetPoint[];
}

export interface EngineStateSummary {
  documentId: string;
  variables: VariableInfo[];
  constants: VariableInfo[];
  functions: string[];
  datasets: DatasetInfo[];
  units: UnitInfo[];
  prefixes: PrefixInfo[];
}

export type WorkerInMessage =
  | { type: 'EVALUATE'; payload: EvaluationRequest }
  | { type: 'EVALUATE_DOCUMENT'; payload: DocumentEvaluationRequest }
  | { type: 'RESET'; documentId?: string }
  | { type: 'SET_SETTINGS'; payload: Partial<EngineSettings> }
  | { type: 'SET_DEFINITIONS'; payload: { defText?: string; symText?: string } }
  | { type: 'GET_STATE'; documentId?: string };

export type WorkerOutMessage =
  | { type: 'EVALUATE_RESULT'; payload: EvaluationResponse }
  | { type: 'EVALUATE_DOCUMENT_RESULT'; payload: DocumentEvaluationResponse }
  | { type: 'STATE_SUMMARY'; payload: EngineStateSummary }
  | { type: 'ERROR'; message: string };
