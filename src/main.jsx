import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { NotesProvider } from './contexts/NotesContext.jsx'
import { UIProvider } from './contexts/UIContext.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
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
