/**
 * Toolbar Component.
 * Quick-access toolbar buttons matching desktop PhyxCalc toolbar.
 */

import React from 'react';
import {
  FilePlus,
  FolderOpen,
  Save,
  Share2,
  Printer,
  Play,
  LineChart,
  Settings,
  HelpCircle,
  Variable,
  Pi,
  Ruler,
  Sigma,
} from 'lucide-react';

interface ToolbarProps {
  onNewTab: () => void;
  onOpen: () => void;
  onSave: () => void;
  onExport: () => void;
  onPrint: () => void;
  onRecalculate: () => void;
  onOpenPlot: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  activeDock: string | null;
  onToggleDock: (dockName: string) => void;
  datasetCount: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onNewTab,
  onOpen,
  onSave,
  onExport,
  onPrint,
  onRecalculate,
  onOpenPlot,
  onOpenSettings,
  onOpenHelp,
  activeDock,
  onToggleDock,
  datasetCount,
}) => {
  return (
    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-3 py-1 select-none text-slate-700 dark:text-slate-200">
      {/* File actions */}
      <button
        type="button"
        onClick={onNewTab}
        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
        title="New Worksheet (Ctrl+T)"
      >
        <FilePlus className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
        title="Open Worksheet... (Ctrl+O)"
      >
        <FolderOpen className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onSave}
        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
        title="Save Worksheet (Ctrl+S)"
      >
        <Save className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onExport}
        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
        title="Export... (Ctrl+E)"
      >
        <Share2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onPrint}
        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
        title="Print Worksheet... (Ctrl+P)"
      >
        <Printer className="w-4 h-4" />
      </button>

      <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1" />

      {/* Calculate action */}
      <button
        type="button"
        onClick={onRecalculate}
        className="flex items-center gap-1 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-medium transition-colors"
        title="Recalculate Entire Worksheet (F5 / Ctrl+Enter)"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        <span>Calculate</span>
      </button>

      {/* Plot action */}
      <button
        type="button"
        onClick={onOpenPlot}
        className={`relative flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
          datasetCount > 0
            ? 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300'
            : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
        }`}
        title="Plot Datasets (Ctrl+P)"
      >
        <LineChart className="w-3.5 h-3.5" />
        <span>Plot</span>
        {datasetCount > 0 && (
          <span className="ml-0.5 px-1 py-0.2 bg-purple-600 text-white text-[10px] rounded-full">
            {datasetCount}
          </span>
        )}
      </button>

      <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1" />

      {/* Dock toggles */}
      <button
        type="button"
        onClick={() => onToggleDock('variables')}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
          activeDock === 'variables'
            ? 'bg-blue-500 text-white font-medium'
            : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
        }`}
        title="Toggle Variables Dock"
      >
        <Variable className="w-3.5 h-3.5" />
        <span>Variables</span>
      </button>
      <button
        type="button"
        onClick={() => onToggleDock('constants')}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
          activeDock === 'constants'
            ? 'bg-blue-500 text-white font-medium'
            : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
        }`}
        title="Toggle Constants Dock"
      >
        <Pi className="w-3.5 h-3.5" />
        <span>Constants</span>
      </button>
      <button
        type="button"
        onClick={() => onToggleDock('units')}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
          activeDock === 'units'
            ? 'bg-blue-500 text-white font-medium'
            : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
        }`}
        title="Toggle Units Dock"
      >
        <Ruler className="w-3.5 h-3.5" />
        <span>Units</span>
      </button>
      <button
        type="button"
        onClick={() => onToggleDock('symbols')}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
          activeDock === 'symbols'
            ? 'bg-blue-500 text-white font-medium'
            : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
        }`}
        title="Toggle Symbols Dock"
      >
        <Sigma className="w-3.5 h-3.5" />
        <span>Symbols</span>
      </button>

      <div className="flex-1" />

      {/* Settings & Help */}
      <button
        type="button"
        onClick={onOpenSettings}
        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
        title="Preferences (Ctrl+,)"
      >
        <Settings className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onOpenHelp}
        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
        title="Help & Reference"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
    </div>
  );
};
