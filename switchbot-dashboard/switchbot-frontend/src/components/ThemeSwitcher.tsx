import { useTheme } from "../theme/useTheme";
import { THEMES, isThemeKey } from "../theme/themes";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <label className="theme-switcher">
      <span>Theme:</span>
      <select
        className="theme-select"
        value={theme}
        onChange={(event) => {
          if (isThemeKey(event.target.value)) {
            setTheme(event.target.value);
          }
        }}
        aria-label="Select color theme"
      >
        {THEMES.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
