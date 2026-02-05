import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(document.body).toBeTruthy()
  })

  // Add more tests as you develop features
  // Example:
  // it('displays the game board', () => {
  //   render(<App />)
  //   expect(screen.getByRole('main')).toBeInTheDocument()
  // })
})
