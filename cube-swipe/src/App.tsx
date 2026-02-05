import { useState, useEffect, useMemo } from 'react'
import { Button, Box, Typography, ThemeProvider, createTheme, Stack } from '@mui/material'
import './App.css'
import { usePWAInstallTracking } from './usePWAInstallTracking'
import { trackDeviceInfo } from './analytics'
import { BackButton } from './components/BackButton'
import { ThemeToggle } from './components/ThemeToggle'
import { GameBoard } from './components/GameBoard'
import { LeaveCommentForm } from './components/LeaveCommentForm'
import { AboutSection } from './components/AboutSection'
import { testGoogleScriptAPI } from './utils/testGoogleScript'

function App() {
  const [grid, setGrid] = useState<number[][]>([
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ])
  const [gameStarted, setGameStarted] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light')
  const [isAppInstalled, setIsAppInstalled] = useState(false)

  // Create Material Design 3 theme based on mode
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
          primary: {
            main: '#6750A4',
          },
          secondary: {
            main: '#625B71',
          },
        },
      }),
    [themeMode]
  )

  // Track PWA installation events
  usePWAInstallTracking()

  // Track device info on mount
  useEffect(() => {
    trackDeviceInfo()
  }, [])

  // Check if app is already installed
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    try {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true

      if (isStandalone || isIOSStandalone) {
        // Use a microtask to avoid setting state during render
        Promise.resolve().then(() => setIsAppInstalled(true))
      }
    } catch {
      // Ignore errors in test environments
    }
  }, [])

  // Expose test function in development mode
  useEffect(() => {
    if (import.meta.env.DEV) {
      // @ts-expect-error - Expose to window for testing in console
      window.testGoogleScriptAPI = testGoogleScriptAPI
      console.log('🧪 Test function available: window.testGoogleScriptAPI()')
    }
  }, [])

  const toggleTheme = () => {
    setThemeMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'))
  }

  const startGame = () => {
    setGameStarted(true)
  }

  const goBack = () => {
    setGameStarted(false)
  }

  const openAbout = () => {
    setAboutOpen(true)
  }

  const closeAbout = () => {
    setAboutOpen(false)
  }

  const openComments = () => {
    setCommentsOpen(true)
  }

  const closeComments = () => {
    setCommentsOpen(false)
  }

  const handleSwipe = (direction: 'left' | 'right' | 'up' | 'down') => {
    console.log('Swipe detected:', direction)
    // TODO: Implement 2048 game logic here
    // Example: This is where we would update the grid based on swipe direction
    setGrid((prevGrid) => {
      // For now, just return the same grid (placeholder for future logic)
      return prevGrid
    })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Cube Swipe 2048',
          text: 'Check out this awesome 2048 game!',
          url: window.location.href,
        })
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error)
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
      } catch {
        console.error('Clipboard failed')
      }
    }
  }

  const handleInstall = () => {
    const installButton = document.querySelector('.install-button') as HTMLButtonElement
    if (installButton) {
      installButton.click()
    } else {
      alert('Please use your browser\'s install option to add this app to your home screen.')
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          bgcolor: 'background.default',
          padding: { xs: 1, sm: 1.5 },
          paddingTop: { xs: 8, sm: 10 },
          position: 'fixed',
          top: 0,
          left: 0,
          overflow: 'auto',
        }}
      >
        {gameStarted && <BackButton onClick={goBack} />}

        <ThemeToggle themeMode={themeMode} onToggle={toggleTheme} />

        <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 1.5, mt: 0, color: 'text.primary' }}>
          Cube Swipe 2048
        </Typography>

        {!gameStarted && !aboutOpen && !commentsOpen ? (
          <Stack spacing={1.2} alignItems="center" sx={{ width: '100%', maxWidth: 400, px: 2 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={startGame}
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
              onClick={openAbout}
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
              onClick={openComments}
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
          </Stack>
        ) : aboutOpen ? (
          <AboutSection onClose={closeAbout} />
        ) : commentsOpen ? (
          <LeaveCommentForm onClose={closeComments} />
        ) : (
          <GameBoard grid={grid} onSwipe={handleSwipe} />
        )}

        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            bottom: 16,
            color: 'text.disabled',
            fontSize: '0.75rem'
          }}
        >
          v0.03
        </Typography>
      </Box>
    </ThemeProvider>
  )
}

export default App
