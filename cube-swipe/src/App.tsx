import { useState, useEffect } from 'react'
import { Button, Box, Typography, ThemeProvider, createTheme } from '@mui/material'
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
    [0, 0, 0, 0],
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

  const handleCellClick = (row: number, col: number) => {
    const newGrid = grid.map((r, i) =>
      r.map((cell, j) => (i === row && j === col ? cell + 1 : cell))
    )
    setGrid(newGrid)
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
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4 }}>
          Cube Swipe 2048
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 2,
            maxWidth: 500,
            width: '100%',
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <Button
                key={`${rowIndex}-${colIndex}`}
                variant="contained"
                onClick={() => handleCellClick(rowIndex, colIndex)}
                sx={{
                  aspectRatio: '1',
                  minHeight: 80,
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  bgcolor: cell > 0 ? `hsl(${cell * 30}, 70%, 60%)` : 'grey.300',
                  '&:hover': {
                    bgcolor: cell > 0 ? `hsl(${cell * 30}, 70%, 50%)` : 'grey.400',
                  },
                }}
              >
                {cell > 0 ? cell : ''}
              </Button>
            ))
          )}
        </Box>

        <Typography variant="body2" sx={{ mt: 4, color: 'text.secondary' }}>
          Click tiles to increment values
        </Typography>

        <InstallPrompt />
      </Box>
    </ThemeProvider>
  )
}

export default App
