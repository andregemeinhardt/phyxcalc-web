/**
 * Variables Dock Component.
 * Displays all active variables, values, and units in the current document.
 */

import React from 'react';
import { VariableInfo } from '../../engine/api';
import { Trash2 } from 'lucide-react';

interface VariablesDockProps {
  variables: VariableInfo[];
  onInsert: (text: string) => void;
  onRemove: (varName: string) => void;
}

export const VariablesDock: React.FC<VariablesDockProps> = ({
  variables,
  onInsert,
  onRemove,
}) => {
  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
        <span>Variables ({variables.length})</span>
      </div>

      <div className="flex-1 overflow-auto p-1">
        {variables.length === 0 ? (
          <div className="text-center py-6 text-slate-400 italic">
            No variables defined yet.
            <br />
            Define one like <code className="text-blue-500 font-mono">r = 5m</code>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-left">
                <th className="py-1 px-1.5 font-medium">Name</th>
                <th className="py-1 px-1.5 font-medium">Value</th>
                <th className="py-1 px-1.5 font-medium">Unit</th>
                <th className="py-1 px-1.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {variables.map((v) => (
                <tr
                  key={v.name}
                  className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/30 font-mono"
                >
                  <td
                    className="py-1 px-1.5 font-semibold text-blue-600 dark:text-blue-400 cursor-pointer"
                    onClick={() => onInsert(v.name)}
                    title="Click to insert"
                  >
                    {v.name}
                  </td>
                  <td className="py-1 px-1.5 text-slate-800 dark:text-slate-200">{v.value}</td>
                  <td className="py-1 px-1.5 text-slate-600 dark:text-slate-400">{v.unit || '-'}</td>
                  <td className="py-1 px-1.5 text-right">
                    <button
                      className="p-1 text-slate-400 hover:text-red-500 rounded"
                      onClick={() => onRemove(v.name)}
                      title={`Remove ${v.name}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
