import { useContext } from 'react'
import { ThemeContext, type ThemeContextValue } from './ThemeContext'

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme は <ThemeProvider> の内側でしか使えません')
  }
  return ctx
}
