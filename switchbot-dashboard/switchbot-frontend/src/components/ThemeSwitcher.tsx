import { useTheme } from '../theme/ThemeProvider';
import { THEMES } from '../theme/themes';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div role="radiogroup" aria-label="Theme" className="flex rounded-lg border border-border bg-card p-1" data-testid="theme-switcher">
      {THEMES.map((t) => {
        const active = t.id === theme;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={active}
            data-testid={`theme-${t.id}`}
            onClick={() => setTheme(t.id)}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
              active ? 'bg-accent text-accent-fg' : 'text-muted hover:text-fg'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
