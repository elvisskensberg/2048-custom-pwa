import { Button, Stack } from '@mui/material'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { AppVersion } from './AppVersion'

interface MainMenuProps {
  onStartGame: () => void
  onOpenAbout: () => void
  onOpenComments: () => void
}

export const MainMenu = ({ onStartGame, onOpenAbout, onOpenComments }: MainMenuProps) => {
  const { isAppInstalled, handleInstall, handleShare } = useInstallPrompt()

  return (
    <Stack spacing={1.2} alignItems="center" sx={{ width: '100%', maxWidth: 400, px: 2, pb: 8 }}>
      <Button
        variant="contained"
        fullWidth
        onClick={onStartGame}
        sx={{
          py: 1.5,
          fontSize: '1.1rem',
          textTransform: 'none',
        }}
      >
        Start Game
      </Button>
      <Button
        variant="outlined"
        fullWidth
        onClick={onOpenAbout}
        sx={{
          py: 1.2,
          fontSize: '0.95rem',
          textTransform: 'none',
        }}
      >
        About
      </Button>
      <Button
        variant="outlined"
        fullWidth
        onClick={onOpenComments}
        sx={{
          py: 1.2,
          fontSize: '0.95rem',
          textTransform: 'none',
        }}
      >
        Leave Comment
      </Button>
      <Button
        variant="contained"
        fullWidth
        onClick={handleShare}
        sx={{
          py: 1.5,
          fontSize: '1rem',
          textTransform: 'none',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          '&:hover': {
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(245, 87, 108, 0.4)',
          },
        }}
      >
        Share
      </Button>
      {!isAppInstalled && (
        <Button
          variant="contained"
          fullWidth
          onClick={handleInstall}
          sx={{
            py: 1.5,
            fontSize: '1rem',
            textTransform: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            '&:hover': {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            },
          }}
        >
          Install The App
        </Button>
      )}

      <AppVersion />
    </Stack>
  )
}
