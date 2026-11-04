/**
 * WorksheetTabs Component.
 * Tab bar for managing multiple worksheet documents.
 */

import React, { useState } from 'react';
import { Plus, X, Edit2 } from 'lucide-react';

export interface TabData {
  id: string;
  title: string;
  content: string;
  isDirty: boolean;
  fileHandle?: any;
}

interface WorksheetTabsProps {
  tabs: TabData[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onNewTab: () => void;
  onCloseTab: (id: string) => void;
  onRenameTab: (id: string, newTitle: string) => void;
}

export const WorksheetTabs: React.FC<WorksheetTabsProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onNewTab,
  onCloseTab,
  onRenameTab,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleStartRename = (tab: TabData, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(tab.id);
    setEditingTitle(tab.title);
  };

  const handleFinishRename = (id: string) => {
    const trimmed = editingTitle.trim();
    if (trimmed) {
      onRenameTab(id, trimmed);
    }
    setEditingId(null);
  };

  const handleKeyDown = (id: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleFinishRename(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  return (
    <div className="flex items-center bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-2 pt-1 gap-1 select-none overflow-x-auto text-xs">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            onDoubleClick={(e) => handleStartRename(tab, e)}
            className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-t-md border-t border-l border-r transition-colors cursor-pointer max-w-[200px] ${
              isActive
                ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-100 shadow-sm'
                : 'bg-slate-200/70 dark:bg-slate-950/40 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/60'
            }`}
          >
            {editingId === tab.id ? (
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={() => handleFinishRename(tab.id)}
                onKeyDown={(e) => handleKeyDown(tab.id, e)}
                autoFocus
                className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 px-1 py-0.5 rounded outline-none border border-blue-500 w-24 text-xs"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate" title={tab.title}>
                {tab.title}
                {tab.isDirty && <span className="text-blue-500 font-bold ml-0.5">*</span>}
              </span>
            )}

            {/* Quick rename button visible on hover */}
            {editingId !== tab.id && (
              <button
                type="button"
                onClick={(e) => handleStartRename(tab, e)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
                title="Rename tab"
              >
                <Edit2 className="w-2.5 h-2.5" />
              </button>
            )}

            {/* Close Tab button */}
            {tabs.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-0.5 rounded transition-colors ml-0.5"
                title="Close tab (Ctrl+W)"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}

      {/* New Tab button */}
      <button
        type="button"
        onClick={onNewTab}
        className="flex items-center justify-center p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 rounded mb-1 transition-colors"
        title="New Tab (Ctrl+T)"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};
