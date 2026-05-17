import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotesProvider } from './contexts/NotesContext'
import { UIProvider } from './contexts/UIContext'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <NotesProvider>
        <UIProvider>
          <App />
        </UIProvider>
      </NotesProvider>
    </ThemeProvider>
  </StrictMode>
)
