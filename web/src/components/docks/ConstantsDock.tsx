/**
 * Constants Dock Component.
 * Searchable list of physical and mathematical constants.
 */

import React, { useState } from 'react';
import { VariableInfo } from '../../engine/api';
import { Search, Plus } from 'lucide-react';

interface ConstantsDockProps {
  constants: VariableInfo[];
  onInsert: (text: string) => void;
}

export const ConstantsDock: React.FC<ConstantsDockProps> = ({
  constants,
  onInsert,
}) => {
  const [filter, setFilter] = useState('');

  const filtered = constants.filter(
    (c) =>
      c.name.toLowerCase().includes(filter.toLowerCase()) ||
      c.unit.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
        <span>Constants ({constants.length})</span>
      </div>

      <div className="p-1.5 border-b border-slate-200 dark:border-slate-800">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-2 text-slate-400" />
          <input
            type="text"
            placeholder="Search constants..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-6 pr-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-1">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-left">
              <th className="py-1 px-1.5 font-medium">Symbol</th>
              <th className="py-1 px-1.5 font-medium">Value</th>
              <th className="py-1 px-1.5 font-medium">Unit</th>
              <th className="py-1 px-1.5 text-right font-medium">Insert</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.name}
                className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/30 font-mono"
              >
                <td
                  className="py-1 px-1.5 font-semibold text-purple-600 dark:text-purple-400 cursor-pointer"
                  onClick={() => onInsert(c.name)}
                  title="Click to insert"
                >
                  {c.name}
                </td>
                <td className="py-1 px-1.5 text-slate-800 dark:text-slate-200">{c.value}</td>
                <td className="py-1 px-1.5 text-slate-600 dark:text-slate-400">{c.unit || '-'}</td>
                <td className="py-1 px-1.5 text-right">
                  <button
                    className="p-1 text-slate-400 hover:text-blue-500 rounded"
                    onClick={() => onInsert(c.name)}
                    title={`Insert ${c.name}`}
                  >
                    <Plus size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
