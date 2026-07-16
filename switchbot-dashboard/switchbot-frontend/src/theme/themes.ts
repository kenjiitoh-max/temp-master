export type ThemeKey = "light" | "dark" | "high-contrast" | "solarized";

export interface ThemeMeta {
  key: ThemeKey;
  label: string;
}

// Order shown in the theme switcher.
export const THEMES: ThemeMeta[] = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
  { key: "high-contrast", label: "High Contrast" },
  { key: "solarized", label: "Solarized" },
];

export const DEFAULT_THEME: ThemeKey = "light";
export const THEME_STORAGE_KEY = "temp-master-theme";

export function isThemeKey(value: unknown): value is ThemeKey {
  return (
    typeof value === "string" && THEMES.some((theme) => theme.key === value)
  );
}

// Colors used by Chart.js, resolved from the active theme's CSS custom
// properties so charts recolor whenever the theme changes.
export interface ChartColors {
  line: string;
  fill: string;
  point: string;
  pointHover: string;
  grid: string;
  tick: string;
}

function readVar(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  const value = styles.getPropertyValue(name).trim();
  return value || fallback;
}

export function getChartColors(): ChartColors {
  const styles = getComputedStyle(document.documentElement);
  return {
    line: readVar(styles, "--chart-line", "#d9534f"),
    fill: readVar(styles, "--chart-fill", "rgba(217, 83, 79, 0.15)"),
    point: readVar(styles, "--chart-point", "#d9534f"),
    pointHover: readVar(styles, "--chart-point-hover", "#5bc0de"),
    grid: readVar(styles, "--chart-grid", "rgba(0, 0, 0, 0.05)"),
    tick: readVar(styles, "--chart-tick", "#777777"),
  };
}
