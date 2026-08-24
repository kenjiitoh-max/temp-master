import { useContext } from 'react'
import { ThemeContext } from './theme'

export { type ChartColors, type ThemeContextValue } from './theme'

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider')
  return context
}
