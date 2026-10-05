import { createContext, useContext } from 'react';
import type { ChartPalette } from './chartPalette';
import type { ThemeId, ThemePreference } from './themes';

export interface ThemeContextValue {
  /** Theme currently applied to the page. */
  theme: ThemeId;
  /** What the user picked; 'system' follows prefers-color-scheme. */
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  chartPalette: ChartPalette;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
