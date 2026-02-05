import { useState, useEffect, useMemo } from 'react'
import { Button, Box, Typography, ThemeProvider, createTheme, TextField, Stack } from '@mui/material'
import './App.css'
import { usePWAInstallTracking } from './usePWAInstallTracking'
import { InstallPrompt } from './InstallPrompt'
import { trackDeviceInfo } from './analytics'
import { BackButton } from './components/BackButton'
import { ThemeToggle } from './components/ThemeToggle'
import { GameBoard } from './components/GameBoard'
import { FeedbackDialog } from './components/FeedbackDialog'
import { testGoogleScriptAPI } from './utils/testGoogleScript'

// Google Apps Script endpoint for form submissions
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwxSWgM5vM7UkTGshbZzBHMrC_MXQoApLBsvT-1Gu7S168EHkrno8CErULU7HiuSAQ17g/exec";

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
  const [contactInfo, setContactInfo] = useState('')
  const [comment, setComment] = useState('')
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light')
  const [feedbackDialog, setFeedbackDialog] = useState<{ open: boolean; type: 'success' | 'error' }>({
    open: false,
    type: 'success',
  })

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

  const handleSubmitComment = async () => {
    try {
      // Format the data for Google Apps Script
      const searchParams = new URLSearchParams()
      searchParams.append('contact', contactInfo)
      searchParams.append('comment', comment)
      searchParams.append('timestamp', new Date().toISOString())

      // Submit to Google Apps Script endpoint
      await fetch(SCRIPT_URL, {
        method: 'POST',
        body: searchParams,
        mode: 'no-cors' // Crucial for Google Apps Script redirects
      })

      // Note: With 'no-cors', we can't read the response body,
      // but we can assume success if no error is thrown.
      setFeedbackDialog({ open: true, type: 'success' })

      // Clear form and close
      setContactInfo('')
      setComment('')
      closeComments()
    } catch (error) {
      console.error('Submission failed:', error)
      setFeedbackDialog({ open: true, type: 'error' })
    }
  }

  const closeFeedbackDialog = () => {
    setFeedbackDialog({ ...feedbackDialog, open: false })
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
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          padding: 3,
          position: 'relative',
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
          <Box sx={{ maxWidth: 600, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              About Cube Swipe 2048
            </Typography>
            <Typography variant="body1" paragraph sx={{ mb: 2 }}>
              Cube Swipe 2048 is a modern take on the classic 2048 puzzle game.
              Swipe in any direction to move the tiles and combine matching numbers.
              The goal is to reach the 2048 tile!
            </Typography>
            <Typography variant="body1" paragraph sx={{ mb: 3 }}>
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
          <Box sx={{ maxWidth: 500, width: '100%' }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
              Leave a Comment
            </Typography>
            <Stack spacing={3}>
              <TextField
                label="Contact Info (Email/Name)"
                variant="outlined"
                fullWidth
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="Optional"
              />
              <TextField
                label="Comments"
                variant="outlined"
                fullWidth
                multiline
                rows={6}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts, suggestions, or feedback..."
              />
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="outlined"
                  onClick={closeComments}
                  sx={{
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                  }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmitComment}
                  disabled={!comment.trim()}
                  sx={{
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                  }}
                >
                  Submit
                </Button>
              </Stack>
            </Stack>
          </Box>
        ) : (
          <GameBoard grid={grid} onSwipe={handleSwipe} />
        )}

        <InstallPrompt />

        <FeedbackDialog
          open={feedbackDialog.open}
          type={feedbackDialog.type}
          onClose={closeFeedbackDialog}
        />
      </Box>
    </ThemeProvider>
  )
}

export default App
