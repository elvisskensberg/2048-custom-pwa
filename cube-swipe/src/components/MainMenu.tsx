import { Button, Stack } from '@mui/material'
import LinkedIn from '@mui/icons-material/LinkedIn'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { AppVersion } from './AppVersion'
import cvPdf from '../assets/Elvis Skensberg CV.pdf'

interface MainMenuProps {
  onStartGame: () => void
  onOpenAbout: () => void
  onOpenComments: () => void
  onOpenTemplates: () => void
  onOpenMonopolyDeal: () => void
}

export const MainMenu = ({ onStartGame, onOpenAbout, onOpenComments, onOpenTemplates, onOpenMonopolyDeal }: MainMenuProps) => {
  const { isAppInstalled, handleInstall, handleShare } = useInstallPrompt()

  const handleDownloadCV = () => {
    const link = document.createElement('a')
    link.href = cvPdf
    link.download = 'Elvis Skensberg CV.pdf'
    link.click()
  }

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
        Play 2048
      </Button>
      <Button
        variant="contained"
        fullWidth
        onClick={onOpenMonopolyDeal}
        sx={{
          py: 1.5,
          fontSize: '1.1rem',
          textTransform: 'none',
          background: 'linear-gradient(135deg, #FF6F00 0%, #FFA726 100%)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          '&:hover': {
            background: 'linear-gradient(135deg, #FF6F00 0%, #FFA726 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(255, 111, 0, 0.4)',
          },
        }}
      >
        Monopoly Deal
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
        onClick={onOpenTemplates}
        sx={{
          py: 1.2,
          fontSize: '0.95rem',
          textTransform: 'none',
        }}
      >
        Templates
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

      <Button
        variant="contained"
        fullWidth
        onClick={handleDownloadCV}
        sx={{
          py: 1.5,
          fontSize: '1rem',
          textTransform: 'none',
          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          '&:hover': {
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(56, 239, 125, 0.4)',
          },
        }}
      >
        Recruiter? Download my CV
      </Button>

      <Button
        variant="contained"
        fullWidth
        href="https://www.linkedin.com/in/elvis-skensberg"
        target="_blank"
        rel="noopener noreferrer"
        startIcon={<LinkedIn />}
        sx={{
          py: 1.5,
          fontSize: '1rem',
          textTransform: 'none',
          background: 'linear-gradient(135deg, #0077B5 0%, #00A0DC 100%)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0077B5 0%, #00A0DC 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0, 119, 181, 0.4)',
          },
        }}
      >
        My LinkedIn
      </Button>

      <AppVersion />
    </Stack>
  )
}
