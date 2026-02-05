import { useState, useEffect, useMemo } from 'react'
import { Button, Box, Typography, ThemeProvider, createTheme, Stack } from '@mui/material'
import './App.css'
import { usePWAInstallTracking } from './usePWAInstallTracking'
import { InstallPrompt } from './InstallPrompt'
import { trackDeviceInfo } from './analytics'
import { BackButton } from './components/BackButton'
import { ThemeToggle } from './components/ThemeToggle'
import { GameBoard } from './components/GameBoard'
import { LeaveCommentForm } from './components/LeaveCommentForm'
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

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          padding: { xs: 2, sm: 3 },
          position: 'relative',
          overflow: 'auto',
        }}
      >
        {gameStarted && <BackButton onClick={goBack} />}

        <ThemeToggle themeMode={themeMode} onToggle={toggleTheme} />

        <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4 }}>
          Cube Swipe 2048
        </Typography>

        {!gameStarted && !aboutOpen && !commentsOpen ? (
          <Stack spacing={2} alignItems="center">
            <Button
              variant="contained"
              size="large"
              onClick={startGame}
              sx={{
                px: 6,
                py: 2,
                fontSize: '1.2rem',
                textTransform: 'none',
              }}
            >
              Start Game
            </Button>
            <Button
              variant="outlined"
              size="medium"
              onClick={openAbout}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                textTransform: 'none',
              }}
            >
              About
            </Button>
            <Button
              variant="outlined"
              size="medium"
              onClick={openComments}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                textTransform: 'none',
              }}
            >
              Leave Comment
            </Button>
          </Stack>
        ) : aboutOpen ? (
          <Box sx={{ maxWidth: 600, textAlign: 'center', px: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'text.primary' }}>
              About Cube Swipe 2048
            </Typography>
            <Typography variant="body1" paragraph sx={{ mb: 2, color: 'text.primary' }}>
              Cube Swipe 2048 is a modern take on the classic 2048 puzzle game.
              Swipe in any direction to move the tiles and combine matching numbers.
              The goal is to reach the 2048 tile!
            </Typography>
            <Typography variant="body1" paragraph sx={{ mb: 3, color: 'text.primary' }}>
              Built with React, Material Design 3, and PWA technology for a seamless
              experience across all devices. Install it on your device for offline play!
            </Typography>
            <Button
              variant="contained"
              onClick={closeAbout}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                textTransform: 'none',
              }}
            >
              Back
            </Button>
          </Box>
        ) : commentsOpen ? (
          <LeaveCommentForm onClose={closeComments} />
        ) : (
          <GameBoard grid={grid} onSwipe={handleSwipe} />
        )}

        <InstallPrompt />
      </Box>
    </ThemeProvider>
  )
}

export default App
