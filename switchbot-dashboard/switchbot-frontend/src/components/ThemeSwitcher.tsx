import { useRef, type KeyboardEvent } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { THEMES } from '../theme/themes';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const current = THEMES.findIndex((t) => t.id === theme);
    let next: number;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (current + 1) % THEMES.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (current - 1 + THEMES.length) % THEMES.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = THEMES.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    setTheme(THEMES[next].id);
    buttonRefs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      onKeyDown={handleKeyDown}
      className="flex rounded-lg border border-border bg-card p-1"
      data-testid="theme-switcher"
    >
      {THEMES.map((t, i) => {
        const active = t.id === theme;
        return (
          <button
            key={t.id}
            ref={(el) => {
              buttonRefs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
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
