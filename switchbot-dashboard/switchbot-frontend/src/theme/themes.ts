export type ThemeId = 'light' | 'dark' | 'high-contrast' | 'control-room';

export type ThemePreference = ThemeId | 'system';

export const THEME_STORAGE_KEY = 'temp-master-theme';

export const THEMES: ReadonlyArray<{ id: ThemeId; label: string }> = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'high-contrast', label: 'High Contrast' },
  { id: 'control-room', label: 'Control Room' },
];

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

export function readStoredTheme(): ThemeId | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function writeStoredTheme(theme: ThemeId | null): void {
  try {
    if (theme) {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } else {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    }
  } catch {
    // Storage may be unavailable (private mode); the theme still applies for this visit.
  }
}

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function systemTheme(): ThemeId {
  return window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light';
}

export function watchSystemTheme(onChange: (theme: ThemeId) => void): () => void {
  if (!window.matchMedia) return () => {};
  const mql = window.matchMedia(DARK_QUERY);
  const listener = (e: MediaQueryListEvent) => onChange(e.matches ? 'dark' : 'light');
  mql.addEventListener('change', listener);
  return () => mql.removeEventListener('change', listener);
}
