import { createContext, useState, useEffect, useContext, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const globalSaved = localStorage.getItem('krc_global_theme') || localStorage.getItem('theme_public');
    if (globalSaved) return globalSaved === 'dark';
    return document.documentElement.classList.contains('dark');
  });
  const isTransitioningRef = useRef(false);

  // Synchronize theme across user sessions and logins without resetting dark mode on logout
  useEffect(() => {
    const userKey = user?.uid ? `theme_${user.uid}` : null;
    const savedUserPref = userKey ? localStorage.getItem(userKey) : null;
    const globalPref = localStorage.getItem('krc_global_theme') || localStorage.getItem('theme_public');
    
    const activePref = savedUserPref || globalPref;
    if (activePref) {
      const isDark = activePref === 'dark';
      setDarkMode(isDark);
      document.documentElement.classList.toggle('dark', isDark);
    }
  }, [user]);

  const persistTheme = (isDark) => {
    const val = isDark ? 'dark' : 'light';
    localStorage.setItem('krc_global_theme', val);
    localStorage.setItem('theme_public', val);
    if (user?.uid) {
      localStorage.setItem(`theme_${user.uid}`, val);
    }
  };

  // Nothing Phone UI circular expand/reveal theme transition with zero stutter and zero blink
  const toggleTheme = (e) => {
    e?.preventDefault?.();
    // Prevent overlapping transitions if user clicks rapidly
    if (isTransitioningRef.current) return;

    const nextMode = !darkMode;

    if (!document.startViewTransition) {
      document.documentElement.classList.toggle('dark', nextMode);
      persistTheme(nextMode);
      setDarkMode(nextMode);
      window.dispatchEvent(new CustomEvent('krc_theme_changed', { detail: { darkMode: nextMode } }));
      return;
    }

    // Calculate circular reveal origin from click target or event coordinates
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    if (e?.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      x = Math.round(rect.left + rect.width / 2);
      y = Math.round(rect.top + rect.height / 2);
    } else if (e?.clientX !== undefined && e?.clientY !== undefined) {
      x = Math.round(e.clientX);
      y = Math.round(e.clientY);
    }

    const endRadius = Math.ceil(
      Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      )
    );

    // Apply origin coordinates and radius to CSS variables BEFORE starting view transition
    document.documentElement.style.setProperty('--theme-x', `${x}px`);
    document.documentElement.style.setProperty('--theme-y', `${y}px`);
    document.documentElement.style.setProperty('--theme-radius', `${endRadius}px`);

    isTransitioningRef.current = true;

    // Safety timeout prevents permanent lock if view transition doesn't complete
    const safetyTimer = setTimeout(() => {
      isTransitioningRef.current = false;
    }, 350);

    try {
      const transition = document.startViewTransition(() => {
        // flushSync forces React to commit DOM updates synchronously so ViewTransition captures the true new state
        flushSync(() => {
          document.documentElement.classList.toggle('dark', nextMode);
          persistTheme(nextMode);
          setDarkMode(nextMode);
        });
      });

      transition.finished
        .catch(() => {})
        .finally(() => {
          clearTimeout(safetyTimer);
          isTransitioningRef.current = false;
        });
      
      window.dispatchEvent(new CustomEvent('krc_theme_changed', { detail: { darkMode: nextMode } }));
    } catch (err) {
      clearTimeout(safetyTimer);
      isTransitioningRef.current = false;
      document.documentElement.classList.toggle('dark', nextMode);
      persistTheme(nextMode);
      setDarkMode(nextMode);
      window.dispatchEvent(new CustomEvent('krc_theme_changed', { detail: { darkMode: nextMode } }));
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
