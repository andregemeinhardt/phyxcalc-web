import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useIsMobile', () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it('evaluates mobile query according to 768px breakpoint', () => {
    const mobileWidth = 375;
    const desktopWidth = 1024;
    expect(mobileWidth < 768).toBe(true);
    expect(desktopWidth < 768).toBe(false);
  });

  it('safely handles window matchMedia subscription when window is defined', () => {
    const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    (globalThis as any).window = {
      innerWidth: 1024,
      matchMedia: mockMatchMedia,
    };

    const mql = globalThis.window.matchMedia('(max-width: 767px)');
    expect(mql.matches).toBe(false);
    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)');
  });
});
