import { useTheme } from '../../contexts/ThemeContext'
import './ThemeToggle.css'

export function ThemeToggle() {
  const { theme, resolved, setTheme } = useTheme()

  function cycle() {
    const order = ['light', 'dark', 'system']
    const next = order[(order.indexOf(theme) + 1) % order.length]
    setTheme(next)
  }

  const icon = resolved === 'dark' ? '🌙' : '☀️'
  const label = theme === 'system' ? 'Auto' : theme === 'dark' ? 'Dark' : 'Light'

  return (
    <button className="theme-toggle" onClick={cycle} title={`Theme: ${label}`}>
      <span className="theme-toggle__icon">{icon}</span>
      <span className="theme-toggle__label">{label}</span>
    </button>
  )
}
