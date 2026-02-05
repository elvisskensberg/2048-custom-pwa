import { useState, useEffect, useMemo } from 'react'
import { Button, Box, Typography, ThemeProvider, createTheme, TextField, Stack, IconButton } from '@mui/material'
import { useGesture } from '@use-gesture/react'
import './App.css'
import { usePWAInstallTracking } from './usePWAInstallTracking'
import { InstallPrompt } from './InstallPrompt'
import { trackDeviceInfo } from './analytics'

// Google Apps Script endpoint for form submissions
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwSIH1RDulC7fm0TU6EtMO8i4jzPNzKOFbp2SGRI6R0aZ1sBOIfsTp6yLpOOYh3gQe3/exec"

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
      alert('Thank you for your feedback! Your comment has been submitted.')

      // Clear form and close
      setContactInfo('')
      setComment('')
      closeComments()
    } catch (error) {
      console.error('Submission failed:', error)
      alert('Sorry, there was an error submitting your comment. Please try again.')
    }
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

  const bind = useGesture({
    onDrag: ({ movement: [mx, my], last }) => {
      if (!last) return

      const threshold = 50
      const absX = Math.abs(mx)
      const absY = Math.abs(my)

      if (absX > threshold || absY > threshold) {
        if (absX > absY) {
          handleSwipe(mx > 0 ? 'right' : 'left')
        } else {
          handleSwipe(my > 0 ? 'down' : 'up')
        }
      }
    },
  })

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
        {gameStarted && (
          <Button
            variant="outlined"
            onClick={goBack}
            sx={{
              position: 'absolute',
              top: 20,
              left: 20,
              textTransform: 'none',
            }}
          >
            ← Back
          </Button>
        )}

        <IconButton
          onClick={toggleTheme}
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
          }}
          aria-label="Toggle theme"
        >
          {themeMode === 'light' ? '🌙' : '☀️'}
        </IconButton>

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
          <>
            <Box
              {...bind()}
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 2,
                maxWidth: 500,
                width: '100%',
                touchAction: 'none',
                userSelect: 'none',
              }}
            >
              {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <Button
                    key={`${rowIndex}-${colIndex}`}
                    variant="contained"
                    disableRipple
                    sx={{
                      aspectRatio: '1',
                      minHeight: 80,
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      bgcolor: cell > 0 ? `hsl(${cell * 30}, 70%, 60%)` : 'grey.300',
                      pointerEvents: 'none',
                      cursor: 'default',
                    }}
                  >
                    {cell > 0 ? cell : ''}
                  </Button>
                ))
              )}
            </Box>

            <Typography variant="body2" sx={{ mt: 4, color: 'text.secondary' }}>
              Swipe left, right, up, or down to play
            </Typography>
          </>
        )}

        <InstallPrompt />
      </Box>
    </ThemeProvider>
  )
}

export default App
