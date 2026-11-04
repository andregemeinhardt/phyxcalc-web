import { describe, it, expect } from 'vitest';
import { storage, StoredWorksheet } from './db';

describe('IndexedDB Storage Engine', () => {
  it('initializes and saves worksheets with fallback', async () => {
    await storage.init();

    const sampleWorksheets: StoredWorksheet[] = [
      {
        id: 'test_1',
        title: 'Thermal Dynamics',
        content: 'power = 100W\ntime = 2h\nenergy = power * time -> kWh',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    await storage.saveWorksheets(sampleWorksheets);
    const loaded = await storage.loadWorksheets();
    expect(loaded.length).toBeGreaterThanOrEqual(1);
    expect(loaded[0].title).toBe('Thermal Dynamics');
  });

  it('persists and retrieves key-value settings', async () => {
    await storage.setSetting('test_key', { precision: 12, mode: 'sci' });
    const val = await storage.getSetting('test_key', null);
    expect(val).toEqual({ precision: 12, mode: 'sci' });
  });

  it('generates a valid exportable workspace backup', async () => {
    const backup = await storage.createBackup('test_1', { precision: 6 }, '// startup');
    expect(backup.version).toBe('1.0.0');
    expect(backup.activeTabId).toBe('test_1');
    expect(backup.worksheets.length).toBeGreaterThan(0);
    expect(backup.exportedAt).toBeGreaterThan(0);
  });
});
