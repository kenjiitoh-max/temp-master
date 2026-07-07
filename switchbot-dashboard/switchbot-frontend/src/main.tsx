import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/theme.css'
import './styles/app.css'
import { ThemeProvider } from './theme/ThemeProvider'
import { Dashboard } from './components/Dashboard'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <Dashboard />
    </ThemeProvider>
  </StrictMode>,
)
