import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/ThemeContext.jsx'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const nextTheme = theme === 'dark' ? 'claro' : 'escuro'
  return <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Ativar tema ${nextTheme}`} title={`Ativar tema ${nextTheme}`}>
    <span className="theme-toggle-icon" aria-hidden="true">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</span>
    <span className="theme-toggle-label">{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
  </button>
}
