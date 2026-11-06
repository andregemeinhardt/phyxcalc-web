/**
 * MobileAccessoryBar Component.
 * Quick-access math operator & docks accessory bar for mobile touch screens.
 */

import React from 'react';
import { Variable, Ruler, Pi, Sigma } from 'lucide-react';

interface MobileAccessoryBarProps {
  onInsertText: (text: string) => void;
  onOpenDock: (dockName: string) => void;
  activeDock: string | null;
}

const QUICK_KEYS = [
  { label: '²', insert: '²' },
  { label: '³', insert: '³' },
  { label: '^', insert: '^' },
  { label: '→', insert: ' -> ' },
  { label: 'π', insert: 'pi' },
  { label: '°', insert: '°' },
  { label: 'j', insert: 'j' },
  { label: '(', insert: '(' },
  { label: ')', insert: ')' },
  { label: '*', insert: ' * ' },
  { label: '/', insert: ' / ' },
  { label: '+', insert: ' + ' },
  { label: '-', insert: ' - ' },
  { label: '=', insert: ' = ' },
];

export const MobileAccessoryBar: React.FC<MobileAccessoryBarProps> = ({
  onInsertText,
  onOpenDock,
  activeDock,
}) => {
  return (
    <div className="h-10 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-2 gap-1 overflow-x-auto select-none z-20 shrink-0">
      {/* Dock Quick Toggles */}
      <div className="flex items-center gap-1 shrink-0 border-r border-slate-300 dark:border-slate-700 pr-1.5">
        <button
          type="button"
          onClick={() => onOpenDock('variables')}
          className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
            activeDock === 'variables'
              ? 'bg-blue-600 text-white'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Variables"
          aria-label="Variables"
        >
          <Variable className="w-3.5 h-3.5" />
          <span className="hidden xs:inline text-[11px]">Vars</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenDock('units')}
          className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
            activeDock === 'units'
              ? 'bg-blue-600 text-white'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Units"
          aria-label="Units"
        >
          <Ruler className="w-3.5 h-3.5" />
          <span className="hidden xs:inline text-[11px]">Units</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenDock('constants')}
          className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
            activeDock === 'constants'
              ? 'bg-blue-600 text-white'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Constants"
          aria-label="Constants"
        >
          <Pi className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onOpenDock('symbols')}
          className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
            activeDock === 'symbols'
              ? 'bg-blue-600 text-white'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
          title="Greek & Math Symbols"
          aria-label="Symbols"
        >
          <Sigma className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Math Characters */}
      <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
        {QUICK_KEYS.map((k) => (
          <button
            key={k.label}
            type="button"
            onClick={() => onInsertText(k.insert)}
            className="px-2 py-1 min-w-[28px] h-7 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs font-medium active:bg-blue-500 active:text-white transition-colors flex items-center justify-center shrink-0 shadow-xs"
          >
            {k.label}
          </button>
        ))}
      </div>
    </div>
  );
};
