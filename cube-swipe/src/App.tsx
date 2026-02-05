import { useState, useEffect } from 'react'
import { Button, Box, Typography, ThemeProvider, createTheme } from '@mui/material'
import { useGesture } from '@use-gesture/react'
import './App.css'
import { usePWAInstallTracking } from './usePWAInstallTracking'
import { InstallPrompt } from './InstallPrompt'
import { trackDeviceInfo } from './analytics'

// Create Material Design 3 theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6750A4',
    },
    secondary: {
      main: '#625B71',
    },
  },
})

function App() {
  const [grid, setGrid] = useState<number[][]>([
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ])

  // Track PWA installation events
  usePWAInstallTracking()

  // Track device info on mount
  useEffect(() => {
    trackDeviceInfo()
  }, [])

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
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4 }}>
          Cube Swipe 2048
        </Typography>

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
                  '&:hover': {
                    bgcolor: cell > 0 ? `hsl(${cell * 30}, 70%, 60%)` : 'grey.300',
                  },
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

        <InstallPrompt />
      </Box>
    </ThemeProvider>
  )
}

export default App
