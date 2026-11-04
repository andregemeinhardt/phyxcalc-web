/**
 * DefinitionsDialog Component.
 * View, edit, validate, import, export, and reset PhyxCalc startup definitions
 * and symbol mappings.
 */

import React, { useState, useEffect } from 'react';
import rawDefinitions from '../assets/definitions.txt?raw';
import rawSymbols from '../assets/symbols.txt?raw';
import { X, Check, RotateCcw, Download, Upload, AlertCircle } from 'lucide-react';
import { parseDefinitions } from '../engine/definitions-loader';

interface DefinitionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDefinitions: (definitionsText: string, symbolsText: string) => void;
}

export const DefinitionsDialog: React.FC<DefinitionsDialogProps> = ({
  isOpen,
  onClose,
  onSaveDefinitions,
}) => {
  const [activeTab, setActiveTab] = useState<'definitions' | 'symbols'>('definitions');
  const [defText, setDefText] = useState(rawDefinitions);
  const [symText, setSymText] = useState(rawSymbols);
  const [validationStatus, setValidationStatus] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const savedDef = localStorage.getItem('phyxcalc_custom_definitions');
    const savedSym = localStorage.getItem('phyxcalc_custom_symbols');
    if (savedDef) setDefText(savedDef);
    if (savedSym) setSymText(savedSym);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleValidate = () => {
    try {
      const parsed = parseDefinitions(defText, symText);
      const unitCount = parsed.units.size;
      const constCount = parsed.constants.size;
      const prefixCount = parsed.prefixes.size;
      setValidationStatus({
        valid: true,
        message: `Valid! Successfully parsed ${unitCount} units, ${constCount} constants, and ${prefixCount} prefixes.`,
      });
    } catch (err: any) {
      setValidationStatus({
        valid: false,
        message: err.message || 'Syntax error in definitions',
      });
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset all definitions and symbols back to factory defaults?')) {
      setDefText(rawDefinitions);
      setSymText(rawSymbols);
      localStorage.removeItem('phyxcalc_custom_definitions');
      localStorage.removeItem('phyxcalc_custom_symbols');
      setValidationStatus({
        valid: true,
        message: 'Reset back to factory defaults.',
      });
    }
  };

  const handleExport = () => {
    const isDef = activeTab === 'definitions';
    const text = isDef ? defText : symText;
    const filename = isDef ? 'definitions.txt' : 'symbols.txt';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      if (activeTab === 'definitions') {
        setDefText(content);
      } else {
        setSymText(content);
      }
      setValidationStatus(null);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveAndApply = () => {
    try {
      parseDefinitions(defText, symText);
      localStorage.setItem('phyxcalc_custom_definitions', defText);
      localStorage.setItem('phyxcalc_custom_symbols', symText);
      onSaveDefinitions(defText, symText);
      onClose();
    } catch (err: any) {
      setValidationStatus({
        valid: false,
        message: `Cannot apply invalid definitions: ${err.message}`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl w-full max-w-4xl h-[650px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
              Startup Definitions & Symbols Manager
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Toolbar & Tabs */}
        <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-0.5 rounded">
            <button
              type="button"
              onClick={() => setActiveTab('definitions')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === 'definitions'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              definitions.txt (Units & Constants)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('symbols')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === 'symbols'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              symbols.txt (Aliases & Greek)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer">
              <Upload size={12} /> Import...
              <input
                type="file"
                accept=".txt"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              <Download size={12} /> Export
            </button>
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              <RotateCcw size={12} /> Reset Defaults
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 p-3 overflow-hidden flex flex-col">
          <textarea
            value={activeTab === 'definitions' ? defText : symText}
            onChange={(e) => {
              if (activeTab === 'definitions') setDefText(e.target.value);
              else setSymText(e.target.value);
              setValidationStatus(null);
            }}
            spellCheck={false}
            className="flex-1 w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-xs p-3 rounded border border-slate-200 dark:border-slate-800 outline-none focus:border-blue-500 resize-none leading-relaxed"
          />
        </div>

        {/* Validation Bar */}
        {validationStatus && (
          <div
            className={`px-4 py-2 border-t text-xs flex items-center gap-2 ${
              validationStatus.valid
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            {validationStatus.valid ? (
              <Check size={14} className="text-emerald-600" />
            ) : (
              <AlertCircle size={14} className="text-rose-600" />
            )}
            <span>{validationStatus.message}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleValidate}
            className="px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium"
          >
            Validate Syntax
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-transparent hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndApply}
              className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
            >
              Save & Apply Definitions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
