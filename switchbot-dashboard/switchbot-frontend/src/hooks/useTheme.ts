import { useCallback, useEffect, useState } from 'react';
import { getInitialTheme, isThemeId, THEME_STORAGE_KEY, type ThemeId } from '../lib/theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function readStoredTheme(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function prefersDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches;
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(() =>
    getInitialTheme(readStoredTheme(), prefersDark()),
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (isThemeId(readStoredTheme()) || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(DARK_QUERY);
    const onChange = (e: MediaQueryListEvent) => {
      if (!isThemeId(readStoredTheme())) setThemeState(e.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage may be unavailable (e.g. private mode); the theme still applies for this session.
    }
  }, []);

  return { theme, setTheme };
}
