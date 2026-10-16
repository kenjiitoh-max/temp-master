export const THEMES = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'contrast', label: 'High Contrast' },
  { id: 'wa', label: '和 (Ai & Shu)' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

export const THEME_STORAGE_KEY = 'temp-master-theme';

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

export function getInitialTheme(storedValue: string | null, prefersDark: boolean): ThemeId {
  if (isThemeId(storedValue)) return storedValue;
  return prefersDark ? 'dark' : 'light';
}
