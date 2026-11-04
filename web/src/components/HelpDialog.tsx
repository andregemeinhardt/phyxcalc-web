/**
 * HelpDialog Component.
 * Offline reference and user guide for PhyxCalc expression syntax, units, and features.
 */

import React, { useState } from 'react';
import { X, Search } from 'lucide-react';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertExample?: (example: string) => void;
}

export const HelpDialog: React.FC<HelpDialogProps> = ({
  isOpen,
  onClose,
  onInsertExample,
}) => {
  const [filter, setFilter] = useState('');

  if (!isOpen) return null;

  const sections = [
    {
      category: 'Basic Arithmetic & Operators',
      items: [
        { expr: '2 + 3 * 4', desc: 'Standard operator precedence (multiplication before addition)' },
        { expr: '2^3^2', desc: 'Powers are left-associative in PhyxCalc: (2^3)^2 = 64' },
        { expr: '2³ + 5!', desc: 'Superscripts and factorial (5! = 120)' },
        { expr: '17 mod 5', desc: 'Modulo remainder (17 mod 5 = 2)' },
        { expr: '17 div 5', desc: 'Integer division (17 div 5 = 3)' },
      ],
    },
    {
      category: 'Units & Physical Conversions',
      items: [
        { expr: '20m/s -> km/h', desc: 'Speed conversion between SI and derived units (72 km/h)' },
        { expr: '100W * 2h -> kWh', desc: 'Energy calculation and conversion (0.2 kWh)' },
        { expr: '0°C -> K', desc: 'Temperature offset conversion (273.15 K)' },
        { expr: '32°F -> °C', desc: 'Fahrenheit to Celsius conversion' },
        { expr: 'sqrt(16m^2)', desc: 'Roots reduce unit powers (4m)' },
      ],
    },
    {
      category: 'Complex Numbers',
      items: [
        { expr: '(2 + 3j) * (4 + 5j)', desc: 'Complex multiplication with j (or i)' },
        { expr: 'sqrt(-1)', desc: 'Negative square roots evaluate to imaginary unit (1j)' },
        { expr: 'exp(pi * j)', desc: "Euler's identity: exp(pi*j) = -1" },
        { expr: 'abs(3 + 4j)', desc: 'Complex absolute value / magnitude (5)' },
      ],
    },
    {
      category: 'Variables & Custom Functions',
      items: [
        { expr: 'radius = 5m', desc: 'Variable assignment' },
        { expr: 'area = pi * radius^2', desc: 'Evaluating with defined variables' },
        { expr: 'f(x) = sin(x) * x', desc: 'Custom function definition' },
        { expr: 'f(2)', desc: 'Calling custom function' },
        { expr: 'x += 3', desc: 'In-place accumulator' },
        { expr: 'c := 10', desc: 'Immutable constant definition' },
      ],
    },
    {
      category: 'Number Systems & Bases',
      items: [
        { expr: '255 -> hex', desc: 'Convert decimal to hexadecimal (0xff)' },
        { expr: '0b1011 -> dec', desc: 'Convert binary literal to decimal (11)' },
        { expr: 'tobcd(42)', desc: 'Convert integer to BCD representation' },
        { expr: 'bcd(0x42)', desc: 'Decode BCD representation to integer' },
      ],
    },
    {
      category: 'Datasets & Plotting',
      items: [
        { expr: 'data(0, 10, 0.1, sin(x))', desc: 'Generate linearly-spaced dataset for plotting' },
        { expr: 'datalog(1, 1000, 10, log10(x))', desc: 'Generate logarithmically-spaced dataset' },
      ],
    },
    {
      category: 'Worksheet Shortcuts',
      items: [
        { expr: 'Ctrl + Enter / F5', desc: 'Recalculate entire worksheet' },
        { expr: 'Ctrl + T', desc: 'New worksheet tab' },
        { expr: 'Ctrl + W', desc: 'Close current worksheet tab' },
        { expr: 'Ctrl + O / Ctrl + S', desc: 'Open / Save worksheet' },
        { expr: '^2 / ^3', desc: 'Automatically converted to ² / ³ while typing' },
      ],
    },
  ];

  const filteredSections = sections
    .map((sec) => ({
      ...sec,
      items: sec.items.filter(
        (item) =>
          item.expr.toLowerCase().includes(filter.toLowerCase()) ||
          item.desc.toLowerCase().includes(filter.toLowerCase())
      ),
    }))
    .filter((sec) => sec.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            PhyxCalc Documentation & Quick Reference
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search syntax, functions, units..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {filteredSections.map((sec) => (
            <div key={sec.category} className="space-y-1.5">
              <h3 className="font-semibold text-blue-600 dark:text-blue-400 text-xs">
                {sec.category}
              </h3>
              <div className="space-y-1">
                {sec.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded flex items-center justify-between gap-3 group hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                  >
                    <div>
                      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                        {item.expr}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                    {onInsertExample && !item.expr.includes('Ctrl') && (
                      <button
                        type="button"
                        onClick={() => {
                          onInsertExample(item.expr);
                          onClose();
                        }}
                        className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-[10px] whitespace-nowrap transition-all"
                      >
                        Try it
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
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
