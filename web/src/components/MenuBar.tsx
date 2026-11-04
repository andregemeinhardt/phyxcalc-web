/**
 * MenuBar Component.
 * Desktop-style menu bar with dropdowns for File, Edit, View, Tools, and Help.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  FolderOpen,
  Save,
  Share2,
  Printer,
  Trash2,
  Play,
  Settings,
  HelpCircle,
  Info,
  LineChart,
  Moon,
  Sun,
  X,
  Download,
} from 'lucide-react';

import { Language, getTranslation } from '../i18n/translations';

interface MenuBarProps {
  onNewTab: () => void;
  onOpen: () => void;
  onSave: () => void;
  onExport: () => void;
  onPrint: () => void;
  onCloseTab: () => void;
  onClearWorksheet: () => void;
  onRecalculate: () => void;
  onOpenPlot: () => void;
  onOpenSettings: () => void;
  onOpenDefinitions: () => void;
  onOpenHelp: () => void;
  onOpenAbout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  activeDock: string | null;
  onToggleDock: (dockName: string) => void;
  canInstall?: boolean;
  onInstallApp?: () => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  onNewTab,
  onOpen,
  onSave,
  onExport,
  onPrint,
  onCloseTab,
  onClearWorksheet,
  onRecalculate,
  onOpenPlot,
  onOpenSettings,
  onOpenDefinitions,
  onOpenHelp,
  onOpenAbout,
  isDark,
  onToggleTheme,
  language,
  onLanguageChange,
  activeDock,
  onToggleDock,
  canInstall,
  onInstallApp,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);
  const t = (key: string) => getTranslation(language, key);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menuName: string) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const handleItemClick = (action: () => void) => {
    action();
    setOpenMenu(null);
  };

  return (
    <div
      ref={menuBarRef}
      className="flex items-center justify-between bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 py-1 select-none text-xs text-slate-700 dark:text-slate-200"
    >
      <div className="flex items-center gap-1">
        <span className="font-bold text-blue-600 dark:text-blue-400 mr-2 flex items-center gap-1">
          <span className="text-sm">⚡</span> PhyxCalc
        </span>

        {/* File Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => handleMenuClick('file')}
            className={`px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 ${
              openMenu === 'file' ? 'bg-slate-200 dark:bg-slate-800 font-medium' : ''
            }`}
          >
            {t('file')}
          </button>
          {openMenu === 'file' && (
            <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg py-1 z-50">
              <button
                type="button"
                onClick={() => handleItemClick(onNewTab)}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-500" /> {t('newTab')}
                </span>
                <span className="text-slate-400 text-[10px]">Ctrl+T</span>
              </button>
              <button
                type="button"
                onClick={() => handleItemClick(onOpen)}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="w-3.5 h-3.5 text-slate-500" /> {t('open')}
                </span>
                <span className="text-slate-400 text-[10px]">Ctrl+O</span>
              </button>
              <button
                type="button"
                onClick={() => handleItemClick(onSave)}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span className="flex items-center gap-2">
                  <Save className="w-3.5 h-3.5 text-slate-500" /> {t('save')}
                </span>
                <span className="text-slate-400 text-[10px]">Ctrl+S</span>
              </button>
              <button
                type="button"
                onClick={() => handleItemClick(onExport)}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span className="flex items-center gap-2">
                  <Share2 className="w-3.5 h-3.5 text-slate-500" /> {t('export')}
                </span>
                <span className="text-slate-400 text-[10px]">Ctrl+E</span>
              </button>
              <button
                type="button"
                onClick={() => handleItemClick(onPrint)}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span className="flex items-center gap-2">
                  <Printer className="w-3.5 h-3.5 text-slate-500" /> {t('print')}
                </span>
                <span className="text-slate-400 text-[10px]">Ctrl+P</span>
              </button>
              <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
              <button
                type="button"
                onClick={() => handleItemClick(onCloseTab)}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 text-red-600 dark:text-red-400"
              >
                <span className="flex items-center gap-2">
                  <X className="w-3.5 h-3.5" /> {t('closeTab')}
                </span>
                <span className="text-slate-400 text-[10px]">Ctrl+W</span>
              </button>
            </div>
          )}
        </div>

        {/* Edit Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => handleMenuClick('edit')}
            className={`px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 ${
              openMenu === 'edit' ? 'bg-slate-200 dark:bg-slate-800 font-medium' : ''
            }`}
          >
            {t('edit')}
          </button>
          {openMenu === 'edit' && (
            <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg py-1 z-50">
              <button
                type="button"
                onClick={() => handleItemClick(onClearWorksheet)}
                className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-red-600 dark:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('clearWorksheet')}
              </button>
            </div>
          )}
        </div>

        {/* View Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => handleMenuClick('view')}
            className={`px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 ${
              openMenu === 'view' ? 'bg-slate-200 dark:bg-slate-800 font-medium' : ''
            }`}
          >
            {t('view')}
          </button>
          {openMenu === 'view' && (
            <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg py-1 z-50">
              <button
                type="button"
                onClick={() => handleItemClick(() => onToggleDock('variables'))}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span>{t('variablesDock')}</span>
                {activeDock === 'variables' && <span className="text-blue-500 font-bold">✓</span>}
              </button>
              <button
                type="button"
                onClick={() => handleItemClick(() => onToggleDock('constants'))}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span>{t('constantsDock')}</span>
                {activeDock === 'constants' && <span className="text-blue-500 font-bold">✓</span>}
              </button>
              <button
                type="button"
                onClick={() => handleItemClick(() => onToggleDock('units'))}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span>{t('unitsDock')}</span>
                {activeDock === 'units' && <span className="text-blue-500 font-bold">✓</span>}
              </button>
              <button
                type="button"
                onClick={() => handleItemClick(() => onToggleDock('symbols'))}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span>{t('symbolsDock')}</span>
                {activeDock === 'symbols' && <span className="text-blue-500 font-bold">✓</span>}
              </button>
              <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
              <button
                type="button"
                onClick={() => handleItemClick(onOpenPlot)}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span className="flex items-center gap-2">
                  <LineChart className="w-3.5 h-3.5 text-blue-500" /> {t('plotWindow')}
                </span>
                <span className="text-slate-400 text-[10px]">Ctrl+P</span>
              </button>
            </div>
          )}
        </div>

        {/* Tools Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => handleMenuClick('tools')}
            className={`px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 ${
              openMenu === 'tools' ? 'bg-slate-200 dark:bg-slate-800 font-medium' : ''
            }`}
          >
            {t('tools')}
          </button>
          {openMenu === 'tools' && (
            <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg py-1 z-50">
              <button
                type="button"
                onClick={() => handleItemClick(onRecalculate)}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span className="flex items-center gap-2">
                  <Play className="w-3.5 h-3.5 text-emerald-500" /> {t('recalculate')}
                </span>
                <span className="text-slate-400 text-[10px]">F5</span>
              </button>
              <button
                type="button"
                onClick={() => handleItemClick(onOpenDefinitions)}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-500" /> Startup Definitions...
                </span>
              </button>
              <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
              <button
                type="button"
                onClick={() => handleItemClick(onOpenSettings)}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-slate-500" /> {t('preferences')}
                </span>
                <span className="text-slate-400 text-[10px]">Ctrl+,</span>
              </button>
            </div>
          )}
        </div>

        {/* Help Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => handleMenuClick('help')}
            className={`px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 ${
              openMenu === 'help' ? 'bg-slate-200 dark:bg-slate-800 font-medium' : ''
            }`}
          >
            {t('help')}
          </button>
          {openMenu === 'help' && (
            <div className="absolute left-0 mt-1 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg py-1 z-50">
              <button
                type="button"
                onClick={() => handleItemClick(onOpenHelp)}
                className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> {t('documentation')}
              </button>
              <button
                type="button"
                onClick={() => handleItemClick(onOpenAbout)}
                className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Info className="w-3.5 h-3.5 text-slate-500" /> {t('about')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right side controls: Install, Language switcher & Theme toggle */}
      <div className="flex items-center gap-2">
        {canInstall && onInstallApp && (
          <button
            type="button"
            onClick={onInstallApp}
            className="flex items-center gap-1 px-2 py-0.5 rounded font-medium text-[11px] bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
            title="Install PhyxCalc as standalone Desktop/Mobile App"
          >
            <Download className="w-3 h-3" />
            <span>Install App</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onLanguageChange(language === 'en' ? 'de' : 'en')}
          className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          title={language === 'en' ? 'Switch to German' : 'Auf Englisch umstellen'}
        >
          {language === 'en' ? 'DE' : 'EN'}
        </button>
        <button
          type="button"
          onClick={onToggleTheme}
          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
