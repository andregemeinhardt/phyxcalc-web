/**
 * MobileHeader Component.
 * Minimalist 44px top application bar for mobile smartphones.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Menu, Moon, Sun, LineChart, Play, ChevronDown, Plus, Check } from 'lucide-react';
import { TabData } from '../WorksheetTabs';

interface MobileHeaderProps {
  title: string;
  tabs: TabData[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onNewTab: () => void;
  onOpenDrawer: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  datasetCount: number;
  onOpenPlot: () => void;
  onRecalculate: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  tabs,
  activeTabId,
  onSelectTab,
  onNewTab,
  onOpenDrawer,
  isDark,
  onToggleTheme,
  datasetCount,
  onOpenPlot,
  onRecalculate,
}) => {
  const [showTabSwitcher, setShowTabSwitcher] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setShowTabSwitcher(false);
      }
    };
    if (showTabSwitcher) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [showTabSwitcher]);

  return (
    <header className="h-11 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-2 flex items-center justify-between select-none relative z-30 shrink-0">
      {/* Left: Hamburger Drawer Trigger */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onOpenDrawer}
          className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Center: Active Worksheet Switcher Pill */}
      <div className="relative" ref={switcherRef}>
        <button
          type="button"
          onClick={() => setShowTabSwitcher(!showTabSwitcher)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium text-xs max-w-[180px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <span className="truncate">{title}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showTabSwitcher ? 'rotate-180' : ''}`} />
        </button>

        {/* Tab Switcher Dropdown */}
        {showTabSwitcher && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50">
            <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Worksheets
            </div>
            <div className="max-h-60 overflow-y-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(tab.id);
                    setShowTabSwitcher(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 ${
                    tab.id === activeTabId
                      ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/50 dark:bg-blue-950/30'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span className="truncate">{tab.title}</span>
                  {tab.id === activeTabId && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              ))}
            </div>
            <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1 px-1">
              <button
                type="button"
                onClick={() => {
                  onNewTab();
                  setShowTabSwitcher(false);
                }}
                className="w-full text-left px-2 py-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium rounded flex items-center gap-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              >
                <Plus className="w-3.5 h-3.5" />
                New Worksheet
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Actions: Recalculate, Plot, Theme */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onRecalculate}
          className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
          title="Recalculate"
          aria-label="Calculate"
        >
          <Play className="w-4 h-4 fill-current" />
        </button>

        {datasetCount > 0 && (
          <button
            type="button"
            onClick={onOpenPlot}
            className="p-2 rounded-lg relative text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
            title="Plot datasets"
            aria-label="Plot"
          >
            <LineChart className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full" />
          </button>
        )}

        <button
          type="button"
          onClick={onToggleTheme}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Toggle Dark Mode"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
