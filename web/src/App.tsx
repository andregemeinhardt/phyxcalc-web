/**
 * Main Application Component for PhyxCalc Web.
 * Connects MenuBar, Toolbar, WorksheetTabs, WorksheetEditor, Dock Panels,
 * Dialogs, and Web Worker calculation engine.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MenuBar } from './components/MenuBar';
import { Toolbar } from './components/Toolbar';
import { WorksheetTabs, TabData } from './components/WorksheetTabs';
import { WorksheetEditor, WorksheetEditorRef } from './editor/WorksheetEditor';
import { VariablesDock } from './components/docks/VariablesDock';
import { ConstantsDock } from './components/docks/ConstantsDock';
import { UnitsDock } from './components/docks/UnitsDock';
import { SymbolsDock } from './components/docks/SymbolsDock';
import { PlotDialog } from './components/PlotDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { ExportDialog } from './components/ExportDialog';
import { DefinitionsDialog } from './components/DefinitionsDialog';
import { AboutDialog } from './components/AboutDialog';
import { HelpDialog } from './components/HelpDialog';
import { ErrorBoundary } from './components/ErrorBoundary';
import { storage, WorkspaceBackup } from './storage/db';
import { Language } from './i18n/translations';
import { PhyxWorkerClient } from './engine/worker-client';
import {
  DEFAULT_ENGINE_SETTINGS,
  EngineSettings,
  EngineStateSummary,
  EvaluationResponse,
} from './engine/api';
import { X, Wifi, WifiOff } from 'lucide-react';
import { useIsMobile } from './hooks/useIsMobile';
import { MobileHeader } from './components/mobile/MobileHeader';
import { MobileDrawer } from './components/mobile/MobileDrawer';
import { MobileBottomSheet } from './components/mobile/MobileBottomSheet';
import { MobileAccessoryBar } from './components/mobile/MobileAccessoryBar';

const INITIAL_WORKSHEET = `// PhyxCalc Web - Scientific & Physical Units Calculator
radius = 5m
area = pi * radius^2
volume = (4/3) * pi * radius^3

// Physical unit conversions
speed = 72km/h -> m/s
energy = 100W * 2h -> kWh
temp = 0°C -> K

// Complex arithmetic
z1 = 2 + 3j
z2 = 4 - 5j
z_product = z1 * z2
magnitude = abs(z1)

// Datasets and plotting
d = data(0, 10, 0.2, sin(x))
`;

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('phyxcalc_dark');
    return saved ? JSON.parse(saved) : false;
  });

  // Language state
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('phyxcalc_language');
    return saved === 'de' || saved === 'en' ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('phyxcalc_language', language);
  }, [language]);

  // Settings
  const [settings, setSettings] = useState<EngineSettings>(() => {
    const saved = localStorage.getItem('phyxcalc_settings');
    return saved ? JSON.parse(saved) : { ...DEFAULT_ENGINE_SETTINGS };
  });

  const [autoSuperscripts, setAutoSuperscripts] = useState<boolean>(() => {
    const saved = localStorage.getItem('phyxcalc_autosuperscripts');
    return saved ? JSON.parse(saved) : true;
  });

  // Tabs state
  const [tabs, setTabs] = useState<TabData[]>(() => {
    const saved = localStorage.getItem('phyxcalc_tabs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('Failed to parse saved tabs:', e);
      }
    }
    return [
      {
        id: 'tab_1',
        title: 'Worksheet 1',
        content: INITIAL_WORKSHEET,
        isDirty: false,
      },
    ];
  });

  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.id || 'tab_1');

  // Evaluation results & state per tab
  const [resultsMap, setResultsMap] = useState<Record<string, EvaluationResponse[]>>({});
  const [stateMap, setStateMap] = useState<Record<string, EngineStateSummary>>({});

  // Active dock panel: 'variables' | 'constants' | 'units' | 'symbols' | null
  const [activeDock, setActiveDock] = useState<string | null>('variables');

  // Resizable dock width state
  const [dockWidth, setDockWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('phyxcalc_dock_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 160 && parsed <= 800) {
          return parsed;
        }
      }
      if (window.innerWidth < 640) {
        return Math.max(160, Math.floor(window.innerWidth * 0.45));
      }
    }
    return 320;
  });

  const [isDraggingDock, setIsDraggingDock] = useState<boolean>(false);
  const isDraggingDockRef = useRef<boolean>(false);

  const handleStartDragDock = useCallback(
    (clientX: number) => {
      isDraggingDockRef.current = true;
      setIsDraggingDock(true);

      const startX = clientX;
      const startWidth = dockWidth;

      const handlePointerMove = (currentX: number) => {
        if (!isDraggingDockRef.current) return;
        const deltaX = currentX - startX;
        const proposed = startWidth - deltaX;
        const maxAllowed =
          typeof window !== 'undefined'
            ? Math.max(160, window.innerWidth - 120)
            : 600;
        const minAllowed = 160;
        const clamped = Math.max(minAllowed, Math.min(maxAllowed, proposed));
        setDockWidth(clamped);
      };

      const onMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        handlePointerMove(e.clientX);
      };

      const onTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 0) {
          handlePointerMove(e.touches[0].clientX);
        }
      };

      const onEndDrag = () => {
        if (isDraggingDockRef.current) {
          isDraggingDockRef.current = false;
          setIsDraggingDock(false);
          setDockWidth((curr) => {
            try {
              localStorage.setItem('phyxcalc_dock_width', curr.toString());
            } catch {}
            return curr;
          });
        }
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onEndDrag);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onEndDrag);
        window.removeEventListener('touchcancel', onEndDrag);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onEndDrag);
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onEndDrag);
      window.addEventListener('touchcancel', onEndDrag);
    },
    [dockWidth]
  );

  // Dialog visibility states
  const [showPlot, setShowPlot] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showDefinitions, setShowDefinitions] = useState<boolean>(false);
  const [showExport, setShowExport] = useState<boolean>(false);
  const [showAbout, setShowAbout] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState<boolean>(false);

  // Responsive device hook
  const isMobile = useIsMobile();

  // References
  const editorRef = useRef<WorksheetEditorRef | null>(null);
  const workerClientRef = useRef<PhyxWorkerClient | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const evalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cross-tab conflict notice
  const [conflictNotice, setConflictNotice] = useState<string | null>(null);

  // Cross-tab synchronization listener
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('phyxcalc_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'TAB_SAVED') {
          setConflictNotice(
            `Worksheet "${event.data.title}" was updated in another browser tab.`
          );
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not available:', e);
    }
    return () => {
      channel?.close();
    };
  }, []);

  const broadcastTabChange = (tabId: string, title: string) => {
    try {
      const channel = new BroadcastChannel('phyxcalc_sync');
      channel.postMessage({ type: 'TAB_SAVED', tabId, title, timestamp: Date.now() });
      channel.close();
    } catch (e) {
      // Ignore
    }
  };

  // Initialize Worker Client
  useEffect(() => {
    const client = new PhyxWorkerClient();
    client.setSettings(settings);

    const savedDef = localStorage.getItem('phyxcalc_custom_definitions');
    const savedSym = localStorage.getItem('phyxcalc_custom_symbols');
    if (savedDef || savedSym) {
      client.setDefinitions(savedDef ?? undefined, savedSym ?? undefined);
    }

    workerClientRef.current = client;

    return () => {
      client.terminate();
    };
  }, []);

  // Update theme class on root
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('phyxcalc_dark', JSON.stringify(isDark));
  }, [isDark]);

  // Network & Service Worker State
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [swUpdateAvailable, setSwUpdateAvailable] = useState<boolean>(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setSwUpdateAvailable(true);
              }
            });
          }
        });
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Initialize Storage Engine (IndexedDB + migrations) and load stored worksheets
  useEffect(() => {
    storage.init().then(async () => {
      const storedTabs = await storage.loadWorksheets();
      if (storedTabs && storedTabs.length > 0) {
        setTabs(
          storedTabs.map((st) => ({
            id: st.id,
            title: st.title,
            content: st.content,
            isDirty: st.isDirty ?? false,
          }))
        );
      }
    });
  }, []);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('phyxcalc_settings', JSON.stringify(settings));
    storage.setSetting('settings', settings);
    workerClientRef.current?.setSettings(settings);
  }, [settings]);

  // Persist auto superscripts
  useEffect(() => {
    localStorage.setItem('phyxcalc_autosuperscripts', JSON.stringify(autoSuperscripts));
    storage.setSetting('autosuperscripts', autoSuperscripts);
  }, [autoSuperscripts]);

  // Persist tabs to IndexedDB and localStorage
  useEffect(() => {
    localStorage.setItem('phyxcalc_tabs', JSON.stringify(tabs));
    storage.saveWorksheets(
      tabs.map((t) => ({
        id: t.id,
        title: t.title,
        content: t.content,
        isDirty: t.isDirty,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }))
    );
  }, [tabs]);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const activeResults = resultsMap[activeTabId] || [];
  const activeState = stateMap[activeTabId];

  // Evaluate document lines using worker
  const runEvaluation = useCallback(
    async (tabId: string, content: string) => {
      if (!workerClientRef.current) return;
      const lines = content.split('\n');

      try {
        const docRes = await workerClientRef.current.evaluateDocument(lines, tabId);
        setResultsMap((prev) => ({ ...prev, [tabId]: docRes.results }));
        setStateMap((prev) => ({ ...prev, [tabId]: docRes.state }));
      } catch (err) {
        console.error('Worksheet evaluation failed:', err);
      }
    },
    []
  );

  // Trigger evaluation whenever active tab content changes (debounced 250ms)
  useEffect(() => {
    if (!activeTab) return;

    if (evalTimerRef.current) {
      clearTimeout(evalTimerRef.current);
    }

    evalTimerRef.current = setTimeout(() => {
      runEvaluation(activeTab.id, activeTab.content);
    }, 250);

    return () => {
      if (evalTimerRef.current) {
        clearTimeout(evalTimerRef.current);
      }
    };
  }, [activeTab?.id, activeTab?.content, runEvaluation]);

  // Handle worksheet text edit from CodeMirror
  const handleContentChange = (newContent: string) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTabId ? { ...tab, content: newContent, isDirty: true } : tab
      )
    );
  };

  // Immediate recalculation
  const handleRecalculate = () => {
    if (activeTab) {
      runEvaluation(activeTab.id, activeTab.content);
    }
  };

  // Tab management
  const handleNewTab = () => {
    const newId = `tab_${Date.now()}`;
    const newTab: TabData = {
      id: newId,
      title: `Worksheet ${tabs.length + 1}`,
      content: '',
      isDirty: false,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (idToClose?: string) => {
    const targetId = idToClose || activeTabId;
    if (tabs.length <= 1) return; // Keep at least one tab

    const idx = tabs.findIndex((t) => t.id === targetId);
    const remaining = tabs.filter((t) => t.id !== targetId);
    setTabs(remaining);

    if (targetId === activeTabId) {
      const nextIdx = Math.max(0, idx - 1);
      setActiveTabId(remaining[nextIdx].id);
    }
  };

  const handleRenameTab = (id: string, newTitle: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: newTitle } : t))
    );
  };

  // Clear worksheet
  const handleClearWorksheet = () => {
    if (window.confirm('Clear all lines in this worksheet?')) {
      handleContentChange('');
      editorRef.current?.setContent('');
    }
  };

  // Insert text into editor
  const handleInsertText = (text: string) => {
    editorRef.current?.insertText(text);
  };

  // Save current worksheet to disk (with direct File System Access where supported)
  const handleSave = async () => {
    if (!activeTab) return;

    if (activeTab.fileHandle && 'createWritable' in activeTab.fileHandle) {
      try {
        const writable = await activeTab.fileHandle.createWritable();
        await writable.write(activeTab.content);
        await writable.close();
        setTabs((prev) =>
          prev.map((t) => (t.id === activeTab.id ? { ...t, isDirty: false } : t))
        );
        broadcastTabChange(activeTab.id, activeTab.title);
        return;
      } catch (err) {
        console.warn('Direct file save failed, falling back:', err);
      }
    }

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: `${activeTab.title.replace(/\s+/g, '_')}.phyx`,
          types: [
            {
              description: 'PhyxCalc Worksheet',
              accept: { 'text/plain': ['.phyx', '.txt'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(activeTab.content);
        await writable.close();
        setTabs((prev) =>
          prev.map((t) =>
            t.id === activeTab.id
              ? {
                  ...t,
                  isDirty: false,
                  fileHandle: handle,
                  title: handle.name.replace(/\.[^/.]+$/, ''),
                }
              : t
          )
        );
        broadcastTabChange(activeTab.id, activeTab.title);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return; // User canceled dialog
        console.warn('Save file picker failed, falling back to download:', err);
      }
    }

    // Standard download fallback
    const blob = new Blob([activeTab.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeTab.title.replace(/\s+/g, '_')}.phyx`;
    link.click();
    URL.revokeObjectURL(url);

    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...t, isDirty: false } : t))
    );
    broadcastTabChange(activeTab.id, activeTab.title);
  };

  // Open file from disk (with direct File System Access where supported)
  const handleOpenClick = async () => {
    if ('showOpenFilePicker' in window) {
      try {
        const [handle] = await (window as any).showOpenFilePicker({
          types: [
            {
              description: 'PhyxCalc Worksheet',
              accept: { 'text/plain': ['.phyx', '.txt'] },
            },
          ],
        });
        const file = await handle.getFile();
        const content = await file.text();
        const newId = `tab_${Date.now()}`;
        const title = file.name.replace(/\.[^/.]+$/, '');
        const newTab: TabData = {
          id: newId,
          title,
          content,
          isDirty: false,
          fileHandle: handle,
        };
        setTabs((prev) => [...prev, newTab]);
        setActiveTabId(newId);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return; // User canceled dialog
        console.warn('File System Access API failed, falling back:', err);
      }
    }
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      const newId = `tab_${Date.now()}`;
      const title = file.name.replace(/\.[^/.]+$/, '');
      const newTab: TabData = {
        id: newId,
        title,
        content,
        isDirty: false,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newId);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Dock toggling
  const handleToggleDock = (dockName: string) => {
    setActiveDock((prev) => (prev === dockName ? null : dockName));
  };

  // Print worksheet
  const handlePrint = () => {
    window.print();
  };

  // Reload application & purge cache
  const handleReloadApp = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }
    } catch (err) {
      console.warn('Cache clearing failed:', err);
    }
    window.location.reload();
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          handleNewTab();
        } else if (e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          handleCloseTab();
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          handleSave();
        } else if (e.key === 'o' || e.key === 'O') {
          e.preventDefault();
          handleOpenClick();
        } else if (e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          setShowExport(true);
        } else if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          if (e.shiftKey) {
            setShowPlot(true);
          } else {
            handlePrint();
          }
        } else if (e.key === ',') {
          e.preventDefault();
          setShowSettings(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId]);

  const handleInstallApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallPrompt(null);
      }
    }
  };

  const handleExportWorkspaceBackup = async () => {
    const customDefs = localStorage.getItem('phyxcalc_custom_definitions') || undefined;
    const backup = await storage.createBackup(activeTabId, settings, customDefs);
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phyxcalc-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreWorkspaceBackup = async (file: File) => {
    try {
      const text = await file.text();
      const backup: WorkspaceBackup = JSON.parse(text);
      if (!backup.worksheets || !Array.isArray(backup.worksheets)) {
        alert('Invalid workspace backup file: worksheets array missing.');
        return;
      }
      const restoredTabs: TabData[] = backup.worksheets.map((w) => ({
        id: w.id || `tab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: w.title || 'Worksheet',
        content: w.content || '',
        isDirty: false,
      }));
      setTabs(restoredTabs);
      if (backup.activeTabId && restoredTabs.some((t) => t.id === backup.activeTabId)) {
        setActiveTabId(backup.activeTabId);
      } else if (restoredTabs.length > 0) {
        setActiveTabId(restoredTabs[0].id);
      }
      if (backup.settings) {
        setSettings(backup.settings as EngineSettings);
      }
      if (backup.definitions) {
        localStorage.setItem('phyxcalc_custom_definitions', backup.definitions);
      }
      await storage.saveWorksheets(backup.worksheets);
      handleRecalculate();
    } catch (err: any) {
      alert(`Failed to restore workspace backup: ${err.message}`);
    }
  };

  const activeDatasets = activeState?.datasets || [];

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 select-none print:h-auto print:overflow-visible print:bg-white print:text-black">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept=".txt,.phyx"
        className="hidden"
      />

      {/* Printable Header (Visible only when printed) */}
      <div className="hidden print:block p-6 border-b-2 border-slate-900 mb-2">
        <div className="flex justify-between items-baseline">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">PhyxCalc — {activeTab?.title}</h1>
            <p className="text-xs text-slate-600">Physical Units & Scientific Calculation Worksheet</p>
          </div>
          <div className="text-right text-xs text-slate-500 font-mono">
            {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Service Worker Safe Update Banner */}
      {swUpdateAvailable && (
        <div className="bg-blue-600 text-white text-xs px-4 py-1.5 flex items-center justify-between shadow-sm z-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Update Available:</span>
            <span>A new version of PhyxCalc Web has been installed in the background.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistration().then((reg) => {
                    reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
                  });
                }
                window.location.reload();
              }}
              className="bg-white text-blue-700 hover:bg-blue-50 px-2.5 py-0.5 rounded font-semibold text-xs shadow-xs"
            >
              Update Now
            </button>
            <button
              onClick={() => setSwUpdateAvailable(false)}
              className="p-1 hover:bg-blue-700 rounded text-blue-200 hover:text-white"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Cross-tab conflict banner */}
      {conflictNotice && (
        <div className="bg-amber-100 dark:bg-amber-950 border-b border-amber-300 dark:border-amber-700 px-4 py-1.5 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 print:hidden z-20">
          <span>⚠️ {conflictNotice}</span>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium"
            >
              Reload
            </button>
            <button
              onClick={() => setConflictNotice(null)}
              className="px-2 py-0.5 text-amber-700 dark:text-amber-300 hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Mobile Top Header & Drawer (Screens < 768px) */}
      {isMobile ? (
        <div className="print:hidden">
          <MobileHeader
            title={activeTab?.title || 'Worksheet'}
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={setActiveTabId}
            onNewTab={handleNewTab}
            onOpenDrawer={() => setShowMobileDrawer(true)}
            isDark={isDark}
            onToggleTheme={() => setIsDark(!isDark)}
            datasetCount={activeDatasets.length}
            onOpenPlot={() => setShowPlot(true)}
            onRecalculate={handleRecalculate}
          />
          <MobileDrawer
            isOpen={showMobileDrawer}
            onClose={() => setShowMobileDrawer(false)}
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={setActiveTabId}
            onNewTab={handleNewTab}
            onCloseTab={handleCloseTab}
            onRenameTab={handleRenameTab}
            onOpen={handleOpenClick}
            onSave={handleSave}
            onExport={() => setShowExport(true)}
            onPrint={handlePrint}
            onClearWorksheet={handleClearWorksheet}
            onOpenPlot={() => setShowPlot(true)}
            onOpenSettings={() => setShowSettings(true)}
            onOpenDefinitions={() => setShowDefinitions(true)}
            onOpenHelp={() => setShowHelp(true)}
            onOpenAbout={() => setShowAbout(true)}
            language={language}
            onLanguageChange={setLanguage}
            canInstall={!!installPrompt}
            onInstallApp={handleInstallApp}
          />
        </div>
      ) : (
        <>
          {/* Menu Bar */}
          <div className="print:hidden">
            <MenuBar
              onNewTab={handleNewTab}
              onOpen={handleOpenClick}
              onSave={handleSave}
              onExport={() => setShowExport(true)}
              onPrint={handlePrint}
              onCloseTab={() => handleCloseTab()}
              onClearWorksheet={handleClearWorksheet}
              onRecalculate={handleRecalculate}
              onOpenPlot={() => setShowPlot(true)}
              onOpenSettings={() => setShowSettings(true)}
              onOpenDefinitions={() => setShowDefinitions(true)}
              onOpenHelp={() => setShowHelp(true)}
              onOpenAbout={() => setShowAbout(true)}
              isDark={isDark}
              onToggleTheme={() => setIsDark(!isDark)}
              language={language}
              onLanguageChange={setLanguage}
              activeDock={activeDock}
              onToggleDock={handleToggleDock}
              canInstall={!!installPrompt}
              onInstallApp={handleInstallApp}
              onReloadApp={handleReloadApp}
            />
          </div>

          {/* Toolbar */}
          <div className="print:hidden">
            <Toolbar
              onNewTab={handleNewTab}
              onOpen={handleOpenClick}
              onSave={handleSave}
              onExport={() => setShowExport(true)}
              onPrint={handlePrint}
              onRecalculate={handleRecalculate}
              onOpenPlot={() => setShowPlot(true)}
              onOpenSettings={() => setShowSettings(true)}
              onOpenHelp={() => setShowHelp(true)}
              activeDock={activeDock}
              onToggleDock={handleToggleDock}
              datasetCount={activeDatasets.length}
            />
          </div>

          {/* Worksheet Tabs */}
          <div className="print:hidden">
            <WorksheetTabs
              tabs={tabs}
              activeTabId={activeTabId}
              onSelectTab={setActiveTabId}
              onNewTab={handleNewTab}
              onCloseTab={handleCloseTab}
              onRenameTab={handleRenameTab}
            />
          </div>
        </>
      )}

      {/* Main Workspace: Editor on Left, Dock on Right */}
      <div className="flex flex-1 overflow-hidden relative print:overflow-visible print:h-auto">
        <div className="flex-1 h-full min-w-0 print:h-auto print:overflow-visible">
          {activeTab && (
            <WorksheetEditor
              key={activeTab.id}
              ref={editorRef}
              content={activeTab.content}
              results={activeResults}
              onChange={handleContentChange}
              onEvaluate={handleRecalculate}
              getVariableNames={() =>
                activeState?.variables.map((v) => v.name) || []
              }
              getUnitNames={() =>
                activeState?.units.map((u) => u.symbol) || []
              }
              autoSuperscripts={autoSuperscripts}
              isMobile={isMobile}
            />
          )}
        </div>

        {/* Right Collapsible Dock Panel (Desktop Only) */}
        {!isMobile && activeDock && (
          <aside
            style={{ width: `${dockWidth}px` }}
            className={`shrink-0 h-full border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col z-10 shadow-sm print:hidden relative ${
              isDraggingDock ? 'select-none' : ''
            }`}
          >
            {/* Draggable Splitter on Left Edge of Dock */}
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize dock panel"
              tabIndex={0}
              onMouseDown={(e) => {
                e.preventDefault();
                handleStartDragDock(e.clientX);
              }}
              onTouchStart={(e) => {
                if (e.touches.length > 0) {
                  handleStartDragDock(e.touches[0].clientX);
                }
              }}
              onDoubleClick={() => {
                const resetWidth =
                  window.innerWidth < 640
                    ? Math.max(160, Math.floor(window.innerWidth * 0.45))
                    : 320;
                setDockWidth(resetWidth);
                try {
                  localStorage.setItem('phyxcalc_dock_width', resetWidth.toString());
                } catch {}
              }}
              className={`absolute -left-1 top-0 bottom-0 w-2 z-20 cursor-col-resize select-none touch-none hover:bg-blue-500/20 active:bg-blue-500/30 transition-colors flex items-center justify-center ${
                isDraggingDock ? 'bg-blue-500/30' : ''
              }`}
              title="Drag to resize dock panel (double-click to reset)"
            >
              <div
                className={`w-[1px] h-full bg-transparent hover:bg-blue-500 transition-colors ${
                  isDraggingDock ? 'bg-blue-500' : ''
                }`}
              />
            </div>
            {/* Dock Header Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-2 pt-1">
              <div className="flex gap-1 text-xs font-medium">
                {(['variables', 'constants', 'units', 'symbols'] as const).map((dock) => (
                  <button
                    key={dock}
                    type="button"
                    onClick={() => setActiveDock(dock)}
                    className={`px-2.5 py-1.5 rounded-t border-t border-l border-r capitalize transition-colors ${
                      activeDock === dock
                        ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {dock}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setActiveDock(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                title="Close dock"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Dock Body */}
            <div className="flex-1 overflow-hidden">
              {activeDock === 'variables' && (
                <VariablesDock
                  variables={activeState?.variables || []}
                  onInsert={handleInsertText}
                  onRemove={(name) => {
                    handleInsertText(`\ndelete ${name}\n`);
                  }}
                />
              )}
              {activeDock === 'constants' && (
                <ConstantsDock
                  constants={activeState?.constants || []}
                  onInsert={handleInsertText}
                />
              )}
              {activeDock === 'units' && (
                <UnitsDock
                  units={activeState?.units || []}
                  onInsert={handleInsertText}
                />
              )}
              {activeDock === 'symbols' && (
                <SymbolsDock onInsert={handleInsertText} />
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Mobile Slide-Up Bottom Sheet for Docks */}
      {isMobile && activeDock && (
        <MobileBottomSheet
          activeDock={activeDock}
          onSelectDock={(dock) => setActiveDock(dock)}
          onClose={() => setActiveDock(null)}
          variables={activeState?.variables || []}
          constants={activeState?.constants || []}
          units={activeState?.units || []}
          onInsert={handleInsertText}
          onRemoveVariable={(name) => {
            handleInsertText(`\ndelete ${name}\n`);
          }}
        />
      )}

      {/* Mobile Accessory Bar */}
      {isMobile && (
        <div className="print:hidden">
          <MobileAccessoryBar
            onInsertText={handleInsertText}
            onOpenDock={handleToggleDock}
            activeDock={activeDock}
          />
        </div>
      )}

      {/* Status Bar (Desktop only) */}
      {!isMobile && (
        <footer className="h-6 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 select-none print:hidden">
          <div className="flex items-center gap-3">
            <span>Lines: {activeTab?.content.split('\n').length || 0}</span>
            <span>Variables: {activeState?.variables.length || 0}</span>
            <span>Datasets: {activeDatasets.length}</span>
            <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800 font-medium">
              {isOnline ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400" title="Connected: PWA precache active">
                  <Wifi size={11} /> Online (PWA Ready)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400" title="Offline: Calculating locally via Web Worker">
                  <WifiOff size={11} /> Offline Mode
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span>Engine: TypeScript Native (v1.0.0)</span>
            <span>Format: {settings.numberFormat.toUpperCase()}</span>
            <span>Precision: {settings.decimalPrecision}</span>
          </div>
        </footer>
      )}

      {/* Dialog Modals */}
      <ErrorBoundary>
        <PlotDialog
          isOpen={showPlot}
          onClose={() => setShowPlot(false)}
          datasets={activeDatasets}
        />
      </ErrorBoundary>

      <SettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={setSettings}
        autoSuperscripts={autoSuperscripts}
        onAutoSuperscriptsChange={setAutoSuperscripts}
        language={language}
        onLanguageChange={setLanguage}
        onExportBackup={handleExportWorkspaceBackup}
        onRestoreBackup={handleRestoreWorkspaceBackup}
      />

      <DefinitionsDialog
        isOpen={showDefinitions}
        onClose={() => setShowDefinitions(false)}
        onSaveDefinitions={async (defText, symText) => {
          await workerClientRef.current?.setDefinitions(defText, symText);
          handleRecalculate();
        }}
      />

      <ExportDialog
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        documentTitle={activeTab?.title || 'Worksheet'}
        content={activeTab?.content || ''}
        results={activeResults}
      />

      <AboutDialog
        isOpen={showAbout}
        onClose={() => setShowAbout(false)}
      />

      <HelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        onInsertExample={handleInsertText}
      />
    </div>
  );
}
