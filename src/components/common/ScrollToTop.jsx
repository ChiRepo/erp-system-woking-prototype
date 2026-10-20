import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * Ensures every route change immediately resets scroll position to (0, 0)
 * Handles both the main window/html document and AppShell custom scrollable <main>
 * Completely eliminates layout jump and ghosting on navigation
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. Instant window scroll restoration
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }

    // 2. Instant reset for AppShell dashboard container
    const appShellMain = document.querySelector('main.overflow-y-auto');
    if (appShellMain) {
      appShellMain.scrollTop = 0;
    }
  }, [pathname]);

  return null;
}
