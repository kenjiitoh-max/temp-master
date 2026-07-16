import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ThemeContext } from "./ThemeContext";
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  isThemeKey,
  type ThemeKey,
} from "./themes";

function applyTheme(theme: ThemeKey): void {
  document.documentElement.setAttribute("data-theme", theme);
}

function resolveInitialTheme(): ThemeKey {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (isThemeKey(stored)) {
    return stored;
  }
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Apply the attribute synchronously before the first render so descendants
  // (e.g. charts reading CSS variables via getComputedStyle) see the correct
  // theme immediately, avoiding a one-render color lag.
  const [theme, setThemeState] = useState<ThemeKey>(() => {
    const initial = resolveInitialTheme();
    applyTheme(initial);
    return initial;
  });

  const setTheme = useCallback((next: ThemeKey) => {
    // Update the DOM attribute synchronously so the re-render triggered by the
    // state change reads the new theme's CSS variables, keeping charts in sync.
    applyTheme(next);
    setThemeState(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
