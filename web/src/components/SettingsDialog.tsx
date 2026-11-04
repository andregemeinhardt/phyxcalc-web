/**
 * Settings Dialog Component.
 * Configuration matching desktop PhyxCalc settings:
 * precision, format, imaginary unit, fractions, unit/prefix modes, and calculation safety limits.
 */

import React, { useState, useEffect, useRef } from 'react';
import { EngineSettings } from '../engine/api';
import { Language, getTranslation } from '../i18n/translations';
import { storage } from '../storage/db';
import { X, HardDrive, ShieldCheck, Download, Upload, AlertCircle } from 'lucide-react';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EngineSettings;
  onSave: (settings: EngineSettings) => void;
  autoSuperscripts: boolean;
  onAutoSuperscriptsChange: (val: boolean) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onExportBackup?: () => void;
  onRestoreBackup?: (file: File) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  autoSuperscripts,
  onAutoSuperscriptsChange,
  language,
  onLanguageChange,
  onExportBackup,
  onRestoreBackup,
}) => {
  const [localSettings, setLocalSettings] = useState<EngineSettings>(settings);
  const [localLang, setLocalLang] = useState<Language>(language);
  const [persistStatus, setPersistStatus] = useState<boolean | null>(null);
  const [storageUsage, setStorageUsage] = useState<string | null>(null);
  const restoreInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
    setLocalLang(language);
    if (isOpen && navigator.storage) {
      if (navigator.storage.persisted) {
        navigator.storage.persisted().then(setPersistStatus).catch(() => {});
      }
      if (navigator.storage.estimate) {
        navigator.storage.estimate().then((est) => {
          if (est.usage !== undefined) {
            const kb = Math.round(est.usage / 1024);
            setStorageUsage(kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);
          }
        }).catch(() => {});
      }
    }
  }, [settings, language, isOpen]);

  if (!isOpen) return null;

  const t = (key: string) => getTranslation(localLang, key);

  const handleRequestPersistence = async () => {
    const res = await storage.requestPersistentStorage();
    setPersistStatus(res.persisted);
    if (res.usage !== undefined) {
      const kb = Math.round(res.usage / 1024);
      setStorageUsage(kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onRestoreBackup) {
      onRestoreBackup(file);
      e.target.value = '';
    }
  };

  const handleSave = () => {
    onSave(localSettings);
    onLanguageChange(localLang);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
            {t('preferences')}
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[460px] overflow-auto">
          {/* Numbers & Precision */}
          <div>
            <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
              {t('numberFormat')}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {t('precision')}
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={localSettings.decimalPrecision}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      decimalPrecision: Math.max(1, parseInt(e.target.value) || 6),
                    })
                  }
                  className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {t('numberFormat')}
                </label>
                <select
                  value={localSettings.numberFormat}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      numberFormat: e.target.value as 'g' | 'f' | 'e',
                    })
                  }
                  className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                >
                  <option value="g">Standard (g)</option>
                  <option value="f">Fixed Decimal (f)</option>
                  <option value="e">Scientific Exponential (e)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  Imaginary Unit
                </label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="imaginaryUnit"
                      checked={localSettings.imaginaryUnit === 'j'}
                      onChange={() =>
                        setLocalSettings({ ...localSettings, imaginaryUnit: 'j' })
                      }
                    />
                    <span>j (engineering)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="imaginaryUnit"
                      checked={localSettings.imaginaryUnit === 'i'}
                      onChange={() =>
                        setLocalSettings({ ...localSettings, imaginaryUnit: 'i' })
                      }
                    />
                    <span>i (mathematics)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  Fraction Display
                </label>
                <label className="flex items-center gap-1.5 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.useFractions}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        useFractions: e.target.checked,
                      })
                    }
                  />
                  <span>Display exact fractions (e.g. 1/3)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Units & Prefixes */}
          <div>
            <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
              Units & Prefixes
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  Unit Output Mode
                </label>
                <select
                  value={localSettings.unitMode}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      unitMode: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                >
                  <option value={1}>Minimize (e.g. N instead of kg*m/s²)</option>
                  <option value={2}>Keep Input Units</option>
                  <option value={3}>Base SI Units Only</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  Prefix Mode
                </label>
                <select
                  value={localSettings.prefixMode}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      prefixMode: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                >
                  <option value={1}>Auto SI Prefix (e.g. 1000m &rarr; 1km)</option>
                  <option value={2}>No Prefix</option>
                </select>
              </div>
            </div>
          </div>

          {/* Safety & Editor */}
          <div>
            <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
              Editor & Safety Limits
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  Calculation Timeout (ms)
                </label>
                <input
                  type="number"
                  min={100}
                  max={30000}
                  step={500}
                  value={localSettings.calculationTimeoutMs ?? 2000}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      calculationTimeoutMs: parseInt(e.target.value) || 2000,
                    })
                  }
                  className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  Typing Shortcuts
                </label>
                <label className="flex items-center gap-1.5 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSuperscripts}
                    onChange={(e) => onAutoSuperscriptsChange(e.target.checked)}
                  />
                  <span>Auto-superscripts (^2 → ², ^3 → ³)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Language / Sprache */}
          <div>
            <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
              Language / Sprache
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  Interface Language
                </label>
                <select
                  value={localLang}
                  onChange={(e) => setLocalLang(e.target.value as Language)}
                  className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                >
                  <option value="en">English</option>
                  <option value="de">Deutsch (German)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Offline Storage & Workspace Backup */}
          <div>
            <div className="font-semibold text-slate-700 dark:text-slate-300 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1 flex items-center justify-between">
              <span>Offline Storage & Workspace Backup</span>
              {storageUsage && (
                <span className="text-[11px] font-normal text-slate-500">
                  Usage: {storageUsage}
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {/* Storage Persistence */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2 rounded border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <HardDrive size={15} className="text-blue-500" />
                  <div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      Persistent Storage
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {persistStatus === true
                        ? 'Protected: Browser will not clear worksheets under low disk space'
                        : 'Best-effort: Subject to browser cache eviction policies'}
                    </div>
                  </div>
                </div>

                {persistStatus !== true && (
                  <button
                    type="button"
                    onClick={handleRequestPersistence}
                    className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                  >
                    <ShieldCheck size={13} className="text-emerald-500" /> Request Persistence
                  </button>
                )}
              </div>

              {/* Workspace Backup & Restore Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onExportBackup}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded font-medium text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <Download size={13} className="text-blue-500" /> Export Backup (.json)
                </button>

                <button
                  type="button"
                  onClick={() => restoreInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded font-medium text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <Upload size={13} className="text-emerald-500" /> Restore Backup (.json)
                </button>

                <input
                  type="file"
                  ref={restoreInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                />
              </div>

              {/* Durability Notice */}
              <div className="flex items-start gap-1.5 text-[11px] text-slate-500 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 p-2 rounded">
                <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Browsers may clear unpersisted data if unused for more than 7 days (WebKit/Safari) or during private browsing. Export periodic workspace backups for permanent archival.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
          >
            {t('saveSettings')}
          </button>
        </div>
      </div>
    </div>
  );
};
