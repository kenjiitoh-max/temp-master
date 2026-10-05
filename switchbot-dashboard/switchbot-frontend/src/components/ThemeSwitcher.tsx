import { useTheme } from '../theme/ThemeContext';
import { THEMES, isThemeId } from '../theme/themes';

export function ThemeSwitcher() {
  const { preference, setPreference } = useTheme();

  return (
    <label className="theme-switcher">
      <span className="theme-switcher__label">Theme</span>
      <select
        id="theme-select"
        className="select select--compact"
        value={preference}
        onChange={(e) => {
          const value = e.target.value;
          setPreference(isThemeId(value) ? value : 'system');
        }}
      >
        <option value="system">System</option>
        {THEMES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </label>
  );
}
