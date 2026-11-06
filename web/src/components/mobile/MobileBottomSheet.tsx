/**
 * MobileBottomSheet Component.
 * Slide-up bottom sheet modal replacing the desktop side-by-side dock panel
 * for Variables, Constants, Units, and Symbols.
 */

import React from 'react';
import { X } from 'lucide-react';
import { VariablesDock } from '../docks/VariablesDock';
import { ConstantsDock } from '../docks/ConstantsDock';
import { UnitsDock } from '../docks/UnitsDock';
import { SymbolsDock } from '../docks/SymbolsDock';
import { VariableInfo, UnitInfo } from '../../engine/api';

interface MobileBottomSheetProps {
  activeDock: string | null;
  onSelectDock: (dock: string | null) => void;
  onClose: () => void;
  variables: VariableInfo[];
  constants: VariableInfo[];
  units: UnitInfo[];
  onInsert: (text: string) => void;
  onRemoveVariable: (name: string) => void;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  activeDock,
  onSelectDock,
  onClose,
  variables,
  constants,
  units,
  onInsert,
  onRemoveVariable,
}) => {
  if (!activeDock) return null;

  const handleInsertAndFeedback = (text: string) => {
    onInsert(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Modal Container */}
      <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl flex flex-col max-h-[75dvh] min-h-[45dvh] z-10 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom duration-200">
        {/* Drag Pill */}
        <div className="w-full flex justify-center pt-2 pb-1" onClick={onClose}>
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full cursor-grab" />
        </div>

        {/* Tab Strip & Close Header */}
        <div className="flex items-center justify-between px-3 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex gap-1 overflow-x-auto text-xs font-medium py-0.5">
            {(['variables', 'constants', 'units', 'symbols'] as const).map((dock) => (
              <button
                key={dock}
                type="button"
                onClick={() => onSelectDock(dock)}
                className={`px-3 py-1.5 rounded-full capitalize transition-colors ${
                  activeDock === dock
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {dock}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 ml-2 shrink-0"
            aria-label="Close sheet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sheet Body with Dock Content */}
        <div className="flex-1 overflow-y-auto pb-4">
          {activeDock === 'variables' && (
            <VariablesDock
              variables={variables}
              onInsert={handleInsertAndFeedback}
              onRemove={onRemoveVariable}
            />
          )}
          {activeDock === 'constants' && (
            <ConstantsDock
              constants={constants}
              onInsert={handleInsertAndFeedback}
            />
          )}
          {activeDock === 'units' && (
            <UnitsDock
              units={units}
              onInsert={handleInsertAndFeedback}
            />
          )}
          {activeDock === 'symbols' && (
            <SymbolsDock onInsert={handleInsertAndFeedback} />
          )}
        </div>
      </div>
    </div>
  );
};
