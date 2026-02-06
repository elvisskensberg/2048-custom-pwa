import { useState, useEffect, useMemo } from 'react'
import { Box, Typography, ThemeProvider, createTheme } from '@mui/material'
import './App.css'
import { usePWAInstallTracking } from './usePWAInstallTracking'
import { trackDeviceInfo } from './analytics'
import { BackButton } from './components/BackButton'
import { ThemeToggle } from './components/ThemeToggle'
import { MainMenu } from './components/MainMenu'
import { GameModeSelect } from './components/GameModeSelect'
import { GameBoard } from './components/GameBoard'
import { LeaveCommentForm } from './components/LeaveCommentForm'
import { AboutSection } from './components/AboutSection'
import { testGoogleScriptAPI } from './utils/testGoogleScript'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameMode, setGameMode] = useState<'classic' | 'fibonacci' | null>(null)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light')

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
          primary: { main: '#6750A4' },
          secondary: { main: '#625B71' },
        },
      }),
    [themeMode]
  )

  usePWAInstallTracking()

  useEffect(() => {
    trackDeviceInfo()
  }, [])

  useEffect(() => {
    if (import.meta.env.DEV) {
      // @ts-expect-error - Expose to window for testing in console
      window.testGoogleScriptAPI = testGoogleScriptAPI
      console.log('🧪 Test function available: window.testGoogleScriptAPI()')
    }
  }, [])

  const currentView = gameStarted && gameMode
    ? 'game'
    : gameStarted
      ? 'modeSelect'
      : aboutOpen
        ? 'about'
        : commentsOpen
          ? 'comments'
          : 'menu'

  const handleBack = () => {
    if (gameMode) {
      setGameMode(null)
    } else if (gameStarted) {
      setGameStarted(false)
    } else if (aboutOpen) {
      setAboutOpen(false)
    } else if (commentsOpen) {
      setCommentsOpen(false)
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          height: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          bgcolor: 'background.default',
          pt: { xs: 8, sm: 10 },
          overflow: 'hidden',
        }}
      >
        {(gameStarted || aboutOpen || commentsOpen) && <BackButton onClick={handleBack} />}

        <ThemeToggle
          themeMode={themeMode}
          onToggle={() => setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'))}
        />

        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            mb: 1.5,
            mt: 0,
            color: 'text.primary',
            textAlign: 'center',
            lineHeight: 1.2
          }}
        >
          Elvis<br />Skensberg<br />AI Showcase
        </Typography>

        {currentView === 'menu' && (
          <MainMenu
            onStartGame={() => setGameStarted(true)}
            onOpenAbout={() => setAboutOpen(true)}
            onOpenComments={() => setCommentsOpen(true)}
          />
        )}
        {currentView === 'modeSelect' && <GameModeSelect onSelectMode={setGameMode} />}
        {currentView === 'about' && <AboutSection />}
        {currentView === 'comments' && <LeaveCommentForm onClose={() => setCommentsOpen(false)} />}
        {currentView === 'game' && gameMode && <GameBoard gameMode={gameMode} />}
      </Box>
    </ThemeProvider>
  )
}

export default App
