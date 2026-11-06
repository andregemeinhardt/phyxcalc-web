/**
 * Hook to detect mobile soft keyboard visibility via window.visualViewport.
 */

import { useState, useEffect } from 'react';

export function useVirtualKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const viewport = window.visualViewport;
    const handleResize = () => {
      // If visual viewport height is substantially smaller than window.innerHeight, keyboard is active
      const threshold = window.innerHeight * 0.78;
      setIsKeyboardOpen(viewport.height < threshold);
    };

    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);

  return { isKeyboardOpen };
}
