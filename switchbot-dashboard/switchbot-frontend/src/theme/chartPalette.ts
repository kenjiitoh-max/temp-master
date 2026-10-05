export interface ChartPalette {
  line: string;
  fill: string;
  pointHover: string;
  grid: string;
  tick: string;
  tooltipBg: string;
  tooltipText: string;
  tooltipBorder: string;
  fontFamily: string;
}

function cssVar(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  const value = styles.getPropertyValue(name).trim();
  return value || fallback;
}

/** Reads the chart colour tokens of the currently applied theme from CSS custom properties. */
export function readChartPalette(): ChartPalette {
  const styles = getComputedStyle(document.documentElement);
  return {
    line: cssVar(styles, '--chart-line', '#d9534f'),
    fill: cssVar(styles, '--chart-fill', 'rgba(217, 83, 79, 0.15)'),
    pointHover: cssVar(styles, '--chart-point-hover', '#5bc0de'),
    grid: cssVar(styles, '--chart-grid', 'rgba(0, 0, 0, 0.05)'),
    tick: cssVar(styles, '--chart-tick', '#777'),
    tooltipBg: cssVar(styles, '--chart-tooltip-bg', 'rgba(0, 0, 0, 0.8)'),
    tooltipText: cssVar(styles, '--chart-tooltip-text', '#fff'),
    tooltipBorder: cssVar(styles, '--chart-tooltip-border', 'transparent'),
    fontFamily: cssVar(styles, '--font-family', 'sans-serif'),
  };
}
