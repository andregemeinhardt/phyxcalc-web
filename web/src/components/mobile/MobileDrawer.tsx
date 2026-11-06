/**
 * MobileDrawer Component.
 * Slide-out navigation drawer housing Worksheet management, File actions,
 * Settings, and App tools.
 */

import React from 'react';
import {
  X,
  FolderOpen,
  Save,
  Share2,
  Printer,
  Trash2,
  LineChart,
  Settings,
  BookOpen,
  HelpCircle,
  Info,
  Download,
  Plus,
  FileText,
  Edit2,
  Languages,
} from 'lucide-react';
import { TabData } from '../WorksheetTabs';
import { Language } from '../../i18n/translations';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: TabData[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onNewTab: () => void;
  onCloseTab: (id: string) => void;
  onRenameTab: (id: string, newTitle: string) => void;
  onOpen: () => void;
  onSave: () => void;
  onExport: () => void;
  onPrint: () => void;
  onClearWorksheet: () => void;
  onOpenPlot: () => void;
  onOpenSettings: () => void;
  onOpenDefinitions: () => void;
  onOpenHelp: () => void;
  onOpenAbout: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  canInstall?: boolean;
  onInstallApp?: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  tabs,
  activeTabId,
  onSelectTab,
  onNewTab,
  onCloseTab,
  onRenameTab,
  onOpen,
  onSave,
  onExport,
  onPrint,
  onClearWorksheet,
  onOpenPlot,
  onOpenSettings,
  onOpenDefinitions,
  onOpenHelp,
  onOpenAbout,
  language,
  onLanguageChange,
  canInstall,
  onInstallApp,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Body */}
      <div className="relative w-80 max-w-[85vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 overflow-hidden">
        {/* Header */}
        <div className="h-14 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="font-bold text-slate-800 dark:text-slate-100 text-base">
              PhyxCalc
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">
              WEB
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Worksheets Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Worksheets ({tabs.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  onNewTab();
                  onClose();
                }}
                className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                New
              </button>
            </div>
            <div className="space-y-1">
              {tabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                return (
                  <div
                    key={tab.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => {
                      onSelectTab(tab.id);
                      onClose();
                    }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 shrink-0 text-slate-400" />
                      <span className="truncate">{tab.title}</span>
                      {tab.isDirty && <span className="text-blue-500 font-bold">*</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newName = window.prompt('Rename worksheet:', tab.title);
                          if (newName?.trim()) {
                            onRenameTab(tab.id, newName.trim());
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                        title="Rename worksheet"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {tabs.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCloseTab(tab.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 rounded"
                          title="Close worksheet"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* File Operations */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              File Actions
            </div>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  onSave();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
              >
                <Save className="w-4 h-4 text-slate-500" />
                <span>Save Worksheet</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpen();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
              >
                <FolderOpen className="w-4 h-4 text-slate-500" />
                <span>Open File...</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onExport();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
              >
                <Share2 className="w-4 h-4 text-slate-500" />
                <span>Export / Share...</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onPrint();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Print Document</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearWorksheet();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-left"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span>Clear Worksheet</span>
              </button>
            </div>
          </div>

          {/* Tools & Settings */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Tools & Settings
            </div>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  onOpenPlot();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
              >
                <LineChart className="w-4 h-4 text-purple-500" />
                <span>Plot View</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenSettings();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Settings</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenDefinitions();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
              >
                <BookOpen className="w-4 h-4 text-slate-500" />
                <span>Custom Definitions</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenHelp();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
              >
                <HelpCircle className="w-4 h-4 text-slate-500" />
                <span>Help & Examples</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenAbout();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
              >
                <Info className="w-4 h-4 text-slate-500" />
                <span>About PhyxCalc</span>
              </button>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Languages className="w-4 h-4" /> Language
            </span>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-1 rounded ${
                  language === 'en'
                    ? 'bg-white dark:bg-slate-700 font-bold text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('de')}
                className={`px-2 py-1 rounded ${
                  language === 'de'
                    ? 'bg-white dark:bg-slate-700 font-bold text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                DE
              </button>
            </div>
          </div>

          {/* Install App button if PWA install available */}
          {canInstall && (
            <button
              type="button"
              onClick={() => {
                onInstallApp?.();
                onClose();
              }}
              className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              Install Mobile App
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
