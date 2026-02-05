import { IconButton } from '@mui/material'

interface ThemeToggleProps {
  themeMode: 'light' | 'dark'
  onToggle: () => void
}

export const ThemeToggle = ({ themeMode, onToggle }: ThemeToggleProps) => {
  return (
    <IconButton
      onClick={onToggle}
      sx={{
        position: 'absolute',
        top: 20,
        right: 20,
        border: themeMode === 'light' ? '1px solid #6750A4' : 'none',
      }}
      aria-label="Toggle theme"
    >
      {themeMode === 'light' ? '🌙' : '☀️'}
    </IconButton>
  )
}
