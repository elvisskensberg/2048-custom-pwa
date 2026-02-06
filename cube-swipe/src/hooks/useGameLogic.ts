import { useState, useCallback } from 'react'

type GameMode = 'classic' | 'fibonacci'

interface UseGameLogicReturn {
  grid: number[][]
  score: number
  gameOver: boolean
  handleSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void
  resetGame: () => void
}

const GRID_SIZE = 4

const FIB_SET = new Set([1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584])

const canMergeFib = (a: number, b: number): boolean => {
  if (a === 0 || b === 0) return false
  if (a === 1 && b === 1) return true
  return FIB_SET.has(a) && FIB_SET.has(b) && FIB_SET.has(a + b)
}

type SlideFn = (line: number[]) => { result: number[]; mergeScore: number }

const createEmptyGrid = (): number[][] =>
  Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0) as number[])

const addRandomTileClassic = (grid: number[][]): number[][] => {
  const emptyCells: [number, number][] = []
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) emptyCells.push([r, c])
    }
  }
  if (emptyCells.length === 0) return grid

  const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)]
  const newGrid = grid.map((r) => [...r])
  newGrid[row][col] = Math.random() < 0.9 ? 2 : 4
  return newGrid
}

const addRandomTileFib = (grid: number[][]): number[][] => {
  const emptyCells: [number, number][] = []
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) emptyCells.push([r, c])
    }
  }
  if (emptyCells.length === 0) return grid

  const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)]
  const newGrid = grid.map((r) => [...r])
  newGrid[row][col] = 1
  return newGrid
}

const initializeGrid = (mode: GameMode): number[][] => {
  const addTile = mode === 'fibonacci' ? addRandomTileFib : addRandomTileClassic
  let grid = createEmptyGrid()
  grid = addTile(grid)
  grid = addTile(grid)
  return grid
}

const slideLineClassic: SlideFn = (line) => {
  const filtered = line.filter((v) => v !== 0)
  let mergeScore = 0

  const merged: number[] = []
  let i = 0
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const val = filtered[i] * 2
      merged.push(val)
      mergeScore += val
      i += 2
    } else {
      merged.push(filtered[i])
      i++
    }
  }

  while (merged.length < GRID_SIZE) {
    merged.push(0)
  }

  return { result: merged, mergeScore }
}

const slideLineFib: SlideFn = (line) => {
  const filtered = line.filter((v) => v !== 0)
  let mergeScore = 0

  const merged: number[] = []
  let i = 0
  while (i < filtered.length) {
    if (i + 1 < filtered.length && canMergeFib(filtered[i], filtered[i + 1])) {
      const val = filtered[i] + filtered[i + 1]
      merged.push(val)
      mergeScore += val
      i += 2
    } else {
      merged.push(filtered[i])
      i++
    }
  }

  while (merged.length < GRID_SIZE) {
    merged.push(0)
  }

  return { result: merged, mergeScore }
}

const gridsEqual = (a: number[][], b: number[][]): boolean => {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (a[r][c] !== b[r][c]) return false
    }
  }
  return true
}

const moveGrid = (
  grid: number[][],
  direction: 'left' | 'right' | 'up' | 'down',
  slideFn: SlideFn
): { newGrid: number[][]; moveScore: number } => {
  let moveScore = 0

  if (direction === 'left') {
    const newGrid = grid.map((row) => {
      const { result, mergeScore } = slideFn(row)
      moveScore += mergeScore
      return result
    })
    return { newGrid, moveScore }
  }

  if (direction === 'right') {
    const newGrid = grid.map((row) => {
      const { result, mergeScore } = slideFn([...row].reverse())
      moveScore += mergeScore
      return result.reverse()
    })
    return { newGrid, moveScore }
  }

  const newGrid = grid.map((r) => [...r])
  for (let c = 0; c < GRID_SIZE; c++) {
    const col = Array.from({ length: GRID_SIZE }, (_, r) => grid[r][c])
    const ordered = direction === 'down' ? col.reverse() : col
    const { result, mergeScore } = slideFn(ordered)
    moveScore += mergeScore
    const final = direction === 'down' ? result.reverse() : result
    for (let r = 0; r < GRID_SIZE; r++) {
      newGrid[r][c] = final[r]
    }
  }
  return { newGrid, moveScore }
}

const canMoveClassic = (grid: number[][]): boolean => {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) return true
    }
  }
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const val = grid[r][c]
      if (c + 1 < GRID_SIZE && grid[r][c + 1] === val) return true
      if (r + 1 < GRID_SIZE && grid[r + 1][c] === val) return true
    }
  }
  return false
}

const canMoveFib = (grid: number[][]): boolean => {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) return true
    }
  }
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (c + 1 < GRID_SIZE && canMergeFib(grid[r][c], grid[r][c + 1])) return true
      if (r + 1 < GRID_SIZE && canMergeFib(grid[r][c], grid[r + 1][c])) return true
    }
  }
  return false
}

export const useGameLogic = (gameMode: GameMode): UseGameLogicReturn => {
  const slideFn = gameMode === 'fibonacci' ? slideLineFib : slideLineClassic
  const addTile = gameMode === 'fibonacci' ? addRandomTileFib : addRandomTileClassic
  const checkCanMove = gameMode === 'fibonacci' ? canMoveFib : canMoveClassic

  const [grid, setGrid] = useState<number[][]>(() => initializeGrid(gameMode))
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  const handleSwipe = useCallback(
    (direction: 'left' | 'right' | 'up' | 'down') => {
      if (gameOver) return

      setGrid((prev) => {
        const { newGrid, moveScore } = moveGrid(prev, direction, slideFn)

        if (gridsEqual(prev, newGrid)) return prev

        const gridWithTile = addTile(newGrid)
        if (moveScore > 0) {
          setScore((s) => s + moveScore)
        }
        if (!checkCanMove(gridWithTile)) {
          setGameOver(true)
        }
        return gridWithTile
      })
    },
    [gameOver, slideFn, addTile, checkCanMove]
  )

  const resetGame = useCallback(() => {
    setGrid(initializeGrid(gameMode))
    setScore(0)
    setGameOver(false)
  }, [gameMode])

  return { grid, score, gameOver, handleSwipe, resetGame }
}
