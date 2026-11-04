/**
 * PhyxCalc IndexedDB Storage Engine.
 * Provides resilient, asynchronous, version-migrated storage for:
 * - Worksheets (multi-tab documents with metadata and dirty state)
 * - User Preferences & Engine Settings
 * - Custom Startup Definitions
 * - Workspace Backups
 *
 * Includes fallback to localStorage / memory if IndexedDB is restricted.
 */

export interface StoredWorksheet {
  id: string;
  title: string;
  content: string;
  isDirty?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceBackup {
  version: string;
  exportedAt: number;
  worksheets: StoredWorksheet[];
  activeTabId: string;
  settings?: Record<string, any>;
  definitions?: string;
}

const DB_NAME = 'phyxcalc_db';
const DB_VERSION = 1;

class PhyxStorage {
  private db: IDBDatabase | null = null;
  private isIndexedDBAvailable: boolean = typeof indexedDB !== 'undefined';
  private memoryFallback: Map<string, any> = new Map();

  /**
   * Initialize and open the IndexedDB database with schema migrations.
   */
  public async init(): Promise<void> {
    if (!this.isIndexedDBAvailable) return;

    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = request.result;
          const oldVersion = event.oldVersion;

          // Schema Migration v1: Create initial object stores
          if (oldVersion < 1) {
            if (!db.objectStoreNames.contains('worksheets')) {
              const wsStore = db.createObjectStore('worksheets', { keyPath: 'id' });
              wsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
              wsStore.createIndex('title', 'title', { unique: false });
            }

            if (!db.objectStoreNames.contains('settings')) {
              db.createObjectStore('settings');
            }

            if (!db.objectStoreNames.contains('backups')) {
              const backupStore = db.createObjectStore('backups', { keyPath: 'id' });
              backupStore.createIndex('exportedAt', 'exportedAt', { unique: false });
            }
          }
        };

        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };

        request.onerror = (e) => {
          console.warn('IndexedDB failed to open, falling back to localStorage:', e);
          this.isIndexedDBAvailable = false;
          resolve();
        };
      } catch (err) {
        console.warn('IndexedDB initialization exception, using fallback:', err);
        this.isIndexedDBAvailable = false;
        resolve();
      }
    });
  }

  /**
   * Save all worksheets to database.
   */
  public async saveWorksheets(worksheets: StoredWorksheet[]): Promise<void> {
    if (!this.db) {
      this.saveWorksheetsFallback(worksheets);
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('worksheets', 'readwrite');
        const store = tx.objectStore('worksheets');

        // Clear existing and rewrite current worksheets
        store.clear();
        for (const ws of worksheets) {
          store.put(ws);
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => {
          this.saveWorksheetsFallback(worksheets);
          resolve();
        };
      } catch (err) {
        this.saveWorksheetsFallback(worksheets);
        resolve();
      }
    });
  }

  /**
   * Load all worksheets from database.
   */
  public async loadWorksheets(): Promise<StoredWorksheet[]> {
    if (!this.db) {
      return this.loadWorksheetsFallback();
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('worksheets', 'readonly');
        const store = tx.objectStore('worksheets');
        const request = store.getAll();

        request.onsuccess = () => {
          const list = request.result as StoredWorksheet[];
          if (list && list.length > 0) {
            resolve(list);
          } else {
            // Check if there are legacy tabs in localStorage to migrate
            const legacy = this.loadWorksheetsFallback();
            if (legacy.length > 0) {
              this.saveWorksheets(legacy);
            }
            resolve(legacy);
          }
        };

        request.onerror = () => {
          resolve(this.loadWorksheetsFallback());
        };
      } catch (err) {
        resolve(this.loadWorksheetsFallback());
      }
    });
  }

  /**
   * Save a key-value setting.
   */
  public async setSetting<T>(key: string, value: T): Promise<void> {
    if (!this.db) {
      try {
        localStorage.setItem(`phyxcalc_${key}`, JSON.stringify(value));
      } catch (e) {
        this.memoryFallback.set(key, value);
      }
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('settings', 'readwrite');
        const store = tx.objectStore('settings');
        store.put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => {
          try {
            localStorage.setItem(`phyxcalc_${key}`, JSON.stringify(value));
          } catch (e) {}
          resolve();
        };
      } catch (err) {
        resolve();
      }
    });
  }

  /**
   * Retrieve a key-value setting.
   */
  public async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    if (!this.db) {
      try {
        const val = localStorage.getItem(`phyxcalc_${key}`);
        return val ? JSON.parse(val) : defaultValue;
      } catch (e) {
        return this.memoryFallback.get(key) ?? defaultValue;
      }
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction('settings', 'readonly');
        const store = tx.objectStore('settings');
        const request = store.get(key);

        request.onsuccess = () => {
          if (request.result !== undefined) {
            resolve(request.result as T);
          } else {
            // Fallback check to localStorage
            try {
              const val = localStorage.getItem(`phyxcalc_${key}`);
              resolve(val ? JSON.parse(val) : defaultValue);
            } catch (e) {
              resolve(defaultValue);
            }
          }
        };

        request.onerror = () => resolve(defaultValue);
      } catch (err) {
        resolve(defaultValue);
      }
    });
  }

  /**
   * Create an exportable workspace backup object.
   */
  public async createBackup(activeTabId: string, settings?: any, definitions?: string): Promise<WorkspaceBackup> {
    const worksheets = await this.loadWorksheets();
    return {
      version: '1.0.0',
      exportedAt: Date.now(),
      worksheets,
      activeTabId,
      settings,
      definitions,
    };
  }

  /**
   * Request persistent storage permission from the browser.
   */
  public async requestPersistentStorage(): Promise<{ persisted: boolean; quota?: number; usage?: number }> {
    let persisted = false;
    let quota: number | undefined;
    let usage: number | undefined;

    if (navigator.storage && navigator.storage.persist) {
      try {
        persisted = await navigator.storage.persist();
      } catch (e) {
        console.warn('Storage persist request failed:', e);
      }
    }

    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        quota = estimate.quota;
        usage = estimate.usage;
      } catch (e) {
        console.warn('Storage estimate failed:', e);
      }
    }

    return { persisted, quota, usage };
  }

  // --- Fallback helpers ---

  private saveWorksheetsFallback(worksheets: StoredWorksheet[]): void {
    try {
      localStorage.setItem('phyxcalc_tabs', JSON.stringify(worksheets));
    } catch (e) {
      this.memoryFallback.set('worksheets', worksheets);
    }
  }

  private loadWorksheetsFallback(): StoredWorksheet[] {
    try {
      const data = localStorage.getItem('phyxcalc_tabs');
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {}
    return this.memoryFallback.get('worksheets') || [];
  }
}

export const storage = new PhyxStorage();
