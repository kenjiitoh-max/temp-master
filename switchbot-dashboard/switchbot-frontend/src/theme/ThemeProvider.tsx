import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { readChartPalette, type ChartPalette } from './chartPalette';
import { ThemeContext } from './ThemeContext';
import {
  readStoredTheme,
  systemTheme,
  watchSystemTheme,
  writeStoredTheme,
  type ThemeId,
  type ThemePreference,
} from './themes';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<ThemeId | null>(() => readStoredTheme());
  const [osTheme, setOsTheme] = useState<ThemeId>(() => systemTheme());
  const [chartPalette, setChartPalette] = useState<ChartPalette>(() => readChartPalette());

  const theme: ThemeId = stored ?? osTheme;

  useEffect(() => watchSystemTheme(setOsTheme), []);

  // Apply before paint so CSS variables and chart colours switch in the same frame.
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    setChartPalette(readChartPalette());
  }, [theme]);

  const setPreference = useCallback((preference: ThemePreference) => {
    const next = preference === 'system' ? null : preference;
    writeStoredTheme(next);
    setStored(next);
  }, []);

  const value = useMemo(
    () => ({ theme, preference: stored ?? ('system' as const), setPreference, chartPalette }),
    [theme, stored, setPreference, chartPalette],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
