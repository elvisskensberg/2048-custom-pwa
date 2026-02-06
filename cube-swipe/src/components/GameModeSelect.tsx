import { Button, Stack } from '@mui/material'
import { AppVersion } from './AppVersion'

interface GameModeSelectProps {
  onSelectMode: (mode: 'classic' | 'fibonacci') => void
}

export const GameModeSelect = ({ onSelectMode }: GameModeSelectProps) => {
  return (
    <Stack spacing={1.2} alignItems="center" sx={{ width: '100%', maxWidth: 400, px: 2, pb: 8 }}>
      <Button
        variant="contained"
        fullWidth
        onClick={() => onSelectMode('classic')}
        sx={{
          py: 1.5,
          fontSize: '1.1rem',
          textTransform: 'none',
        }}
      >
        Play Original 2048
      </Button>
      <Button
        variant="contained"
        fullWidth
        onClick={() => onSelectMode('fibonacci')}
        sx={{
          py: 1.5,
          fontSize: '1.1rem',
          textTransform: 'none',
        }}
      >
        Play Using Fibonacci Sequence
      </Button>

      <AppVersion />
    </Stack>
  )
}
