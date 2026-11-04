/**
 * AboutDialog Component.
 * Information on PhyxCalc Web, engine architecture, and license notices.
 */

import React from 'react';
import { X } from 'lucide-react';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutDialog: React.FC<AboutDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            About PhyxCalc
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">PhyxCalc Web</h2>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Scientific & Engineering Physical Units Calculator
              </p>
            </div>
          </div>

          <p>
            PhyxCalc Web is an offline-capable Progressive Web Application (PWA) delivering the full power of
            the desktop scientific calculator in any modern web browser.
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded border border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px]">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Engine: </span>
              High-Precision Native TypeScript Engine (v1.0.0)
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Parity Baseline: </span>
              100% verified across 53 compatibility suites (60/60 tests)
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Desktop Upstream: </span>
              PhyxCalc by Christian C. Sachse (<span className="font-mono">c952bc8</span>)
            </div>
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">License: </span>
              GNU General Public License v3.0 or later (GPL-3.0-or-later)
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Features include multi-line synchronized worksheets, dimensional unit algebra,
            complex numbers, number base conversions, dataset sampling, and interactive charting.
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
