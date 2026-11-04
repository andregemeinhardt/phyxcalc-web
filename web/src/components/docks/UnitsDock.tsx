/**
 * Units Dock Component.
 * Searchable hierarchy of units organized by unit system.
 */

import React, { useState } from 'react';
import { UnitInfo } from '../../engine/api';
import { Search, Plus } from 'lucide-react';

interface UnitsDockProps {
  units: UnitInfo[];
  onInsert: (text: string) => void;
}

export const UnitsDock: React.FC<UnitsDockProps> = ({ units, onInsert }) => {
  const [filter, setFilter] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<string>('all');

  const systems = Array.from(new Set(units.map((u) => u.system || 'si')));

  const filtered = units.filter((u) => {
    const matchesFilter =
      u.symbol.toLowerCase().includes(filter.toLowerCase()) ||
      (u.definition && u.definition.toLowerCase().includes(filter.toLowerCase()));
    const matchesSystem = selectedSystem === 'all' || u.system === selectedSystem;
    return matchesFilter && matchesSystem;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs">
      <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
        <span>Units ({units.length})</span>
      </div>

      <div className="p-1.5 border-b border-slate-200 dark:border-slate-800 flex gap-1">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2 top-2 text-slate-400" />
          <input
            type="text"
            placeholder="Search units..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-6 pr-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={selectedSystem}
          onChange={(e) => setSelectedSystem(e.target.value)}
          className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1 outline-none"
        >
          <option value="all">All</option>
          {systems.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-auto p-1">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-left">
              <th className="py-1 px-1.5 font-medium">Symbol</th>
              <th className="py-1 px-1.5 font-medium">System</th>
              <th className="py-1 px-1.5 font-medium">Definition</th>
              <th className="py-1 px-1.5 text-right font-medium">Insert</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.symbol}
                className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/30 font-mono"
              >
                <td
                  className="py-1 px-1.5 font-semibold text-indigo-600 dark:text-indigo-400 cursor-pointer"
                  onClick={() => onInsert(u.symbol)}
                  title="Click to insert"
                >
                  {u.symbol}
                </td>
                <td className="py-1 px-1.5 text-slate-500">{u.system}</td>
                <td className="py-1 px-1.5 text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                  {u.definition || '-'}
                </td>
                <td className="py-1 px-1.5 text-right">
                  <button
                    className="p-1 text-slate-400 hover:text-blue-500 rounded"
                    onClick={() => onInsert(u.symbol)}
                    title={`Insert ${u.symbol}`}
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
