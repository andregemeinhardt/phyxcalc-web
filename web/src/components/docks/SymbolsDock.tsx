/**
 * Symbols Dock Component.
 * Grid of Greek letters and mathematical symbols for one-click insertion.
 */

import React from 'react';

interface SymbolsDockProps {
  onInsert: (symbol: string) => void;
}

const GREEK_LOWER = [
  'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ',
  'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω',
];

const GREEK_UPPER = [
  'Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ', 'Ι', 'Κ', 'Λ', 'Μ',
  'Ν', 'Ξ', 'Ο', 'Π', 'Ρ', 'Σ', 'Τ', 'Υ', 'Φ', 'Χ', 'Ψ', 'Ω',
];

const MATH_SYMBOLS = [
  '²', '³', '√', 'π', 'µ', '°', '‰', '‱', '·', '±', '≠', '≤', '≥', '≈', '∞',
  '€', '$', '£', '¥', 'Ω', '→',
];

export const SymbolsDock: React.FC<SymbolsDockProps> = ({ onInsert }) => {
  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 font-semibold text-slate-700 dark:text-slate-300">
        <span>Greek & Math Symbols</span>
      </div>

      <div className="flex-1 overflow-auto p-2 space-y-3">
        <div>
          <div className="text-[11px] font-semibold text-slate-400 mb-1">Math & Units</div>
          <div className="grid grid-cols-7 gap-1">
            {MATH_SYMBOLS.map((s) => (
              <button
                key={s}
                onClick={() => onInsert(s)}
                className="h-7 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-800 dark:text-slate-200 font-mono font-medium flex items-center justify-center transition-colors"
                title={`Insert ${s}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold text-slate-400 mb-1">Greek Lowercase</div>
          <div className="grid grid-cols-8 gap-1">
            {GREEK_LOWER.map((s) => (
              <button
                key={s}
                onClick={() => onInsert(s)}
                className="h-7 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-800 dark:text-slate-200 font-serif text-sm flex items-center justify-center transition-colors"
                title={`Insert ${s}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold text-slate-400 mb-1">Greek Uppercase</div>
          <div className="grid grid-cols-8 gap-1">
            {GREEK_UPPER.map((s) => (
              <button
                key={s}
                onClick={() => onInsert(s)}
                className="h-7 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-800 dark:text-slate-200 font-serif text-sm flex items-center justify-center transition-colors"
                title={`Insert ${s}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
