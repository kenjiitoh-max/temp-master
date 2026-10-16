import { describe, expect, it } from 'vitest';
import { getInitialTheme, isThemeId, THEMES } from './theme';

describe('theme', () => {
  it('provides at least three themes', () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(3);
    expect(THEMES.map((t) => t.id)).toEqual(expect.arrayContaining(['light', 'dark', 'contrast']));
  });

  it('prefers the stored theme', () => {
    expect(getInitialTheme('contrast', false)).toBe('contrast');
    expect(getInitialTheme('wa', true)).toBe('wa');
  });

  it('falls back to prefers-color-scheme', () => {
    expect(getInitialTheme(null, true)).toBe('dark');
    expect(getInitialTheme(null, false)).toBe('light');
    expect(getInitialTheme('bogus', true)).toBe('dark');
  });

  it('validates theme ids', () => {
    expect(isThemeId('dark')).toBe(true);
    expect(isThemeId('sepia')).toBe(false);
  });
});
