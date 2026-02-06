import { useState } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { useGesture } from '@use-gesture/react'
import { AppVersion } from './AppVersion'

const INITIAL_GRID: number[][] = [
  [1, 1, 1, 1],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
]

export const GameBoard = () => {
  const [grid, setGrid] = useState<number[][]>(INITIAL_GRID)

  const handleSwipe = (direction: 'left' | 'right' | 'up' | 'down') => {
    console.log('Swipe detected:', direction)
    // TODO: Implement 2048 game logic here
    setGrid((prevGrid) => prevGrid)
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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        px: 2,
      }}
    >
      <Box
        {...bind()}
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1,
          maxWidth: 400,
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

      <AppVersion />
    </Box>
  )
}
