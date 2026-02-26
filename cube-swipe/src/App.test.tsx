import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'

vi.mock('./components/GameBoard', () => ({
  GameBoard: ({ gameMode }: { gameMode: string }) => <div>Game board: {gameMode}</div>,
}))

vi.mock('./components/MonopolyDealBoard', () => ({
  MonopolyDealBoard: ({ onBack }: { onBack: () => void }) => (
    <div>
      <p>Monopoly Deal Mock</p>
      <button onClick={onBack}>Back to Menu</button>
    </div>
  ),
}))

vi.mock('./utils/testGoogleScript', () => ({
  testGoogleScriptAPI: vi.fn(),
}))

describe('App', () => {
  it('renders the main menu actions', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /Play 2048/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Monopoly Deal/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /About/i })).toBeInTheDocument()
  }, 15000)

  it('navigates between menu, mode select, and game view via user actions', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Play 2048/i }))
    expect(screen.getByRole('button', { name: /Play Original 2048/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Play Using Fibonacci Sequence/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Play Original 2048/i }))
    expect(screen.getByText(/Game board: classic/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Back/i }))
    expect(screen.getByRole('button', { name: /Play Original 2048/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Back/i }))
    expect(screen.getByRole('button', { name: /Play 2048/i })).toBeInTheDocument()
  }, 15000)

  it('opens Monopoly Deal and returns to menu', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Monopoly Deal/i }))
    expect(screen.getByText(/Monopoly Deal Mock/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Back to Menu/i }))
    expect(screen.getByRole('button', { name: /Play 2048/i })).toBeInTheDocument()
  }, 15000)
})
