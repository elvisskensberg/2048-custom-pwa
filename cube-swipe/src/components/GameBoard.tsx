import { useEffect } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { useGesture } from '@use-gesture/react'
import { useGameLogic } from '../hooks/useGameLogic'
import { AppVersion } from './AppVersion'

const TILE_COLORS: Record<number, string> = {
  1: '#eee4da',
  2: '#eee4da',
  3: '#ede0c8',
  4: '#ede0c8',
  5: '#f2b179',
  8: '#f2b179',
  13: '#f59563',
  16: '#f59563',
  21: '#f67c5f',
  32: '#f67c5f',
  34: '#f65e3b',
  55: '#edcf72',
  64: '#f65e3b',
  89: '#edcc61',
  128: '#edcf72',
  144: '#edc850',
  233: '#edc53f',
  256: '#edcc61',
  377: '#edc22e',
  512: '#edc850',
  610: '#3c3a32',
  987: '#3c3a32',
  1024: '#edc53f',
  2048: '#edc22e',
}

const getTileColor = (value: number): string => {
  if (value === 0) return 'grey.300'
  return TILE_COLORS[value] ?? '#3c3a32'
}

const getTileTextColor = (value: number): string => {
  return value <= 4 ? '#776e65' : '#f9f6f2'
}

type Direction = 'left' | 'right' | 'up' | 'down'

const getDoubleTapDirection = (row: number, col: number): Direction | null => {
  if (row === 0 && (col === 1 || col === 2)) return 'up'
  if (row === 3 && (col === 1 || col === 2)) return 'down'
  if (col === 0 && (row === 1 || row === 2)) return 'left'
  if (col === 3 && (row === 1 || row === 2)) return 'right'
  return null
}

interface GameBoardProps {
  gameMode: 'classic' | 'fibonacci'
}

export const GameBoard = ({ gameMode }: GameBoardProps) => {
  const { grid, score, gameOver, handleSwipe, resetGame } = useGameLogic(gameMode)

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

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          handleSwipe('up')
          break
        case 'ArrowDown':
          e.preventDefault()
          handleSwipe('down')
          break
        case 'ArrowLeft':
          e.preventDefault()
          handleSwipe('left')
          break
        case 'ArrowRight':
          e.preventDefault()
          handleSwipe('right')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameOver, handleSwipe])

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
      <Typography variant="h5" sx={{ mb: 1, color: 'text.primary', fontWeight: 'bold' }}>
        Score: {score}
      </Typography>

      <Box sx={{ position: 'relative', maxWidth: 400, width: '100%' }}>
        <Box
          {...bind()}
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 1,
            width: '100%',
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const tapDir = getDoubleTapDirection(rowIndex, colIndex)
              return (
                <Button
                  key={`${rowIndex}-${colIndex}`}
                  variant="contained"
                  disableRipple
                  onDoubleClick={tapDir ? () => handleSwipe(tapDir) : undefined}
                  sx={{
                    aspectRatio: '1',
                    minHeight: 70,
                    fontSize: cell >= 1024 ? '1rem' : '1.5rem',
                    fontWeight: 'bold',
                    bgcolor: getTileColor(cell),
                    color: getTileTextColor(cell),
                    pointerEvents: tapDir ? 'auto' : 'none',
                    cursor: tapDir ? 'pointer' : 'default',
                    '&:hover': {
                      bgcolor: getTileColor(cell),
                    },
                  }}
                >
                  {cell > 0 ? cell : ''}
                </Button>
              )
            })
          )}
        </Box>

        {gameOver && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: 1,
              gap: 2,
            }}
          >
            <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold' }}>
              Game Over!
            </Typography>
            <Typography variant="h6" sx={{ color: '#fff' }}>
              Score: {score}
            </Typography>
            <Button
              variant="contained"
              onClick={resetGame}
              sx={{ textTransform: 'none', fontSize: '1.1rem' }}
            >
              Play Again
            </Button>
          </Box>
        )}
      </Box>

      <Typography variant="body2" sx={{ mt: 4, color: 'text.secondary' }}>
        Swipe, double-tap edges, or use arrow keys to play
      </Typography>

      <AppVersion />
    </Box>
  )
}
