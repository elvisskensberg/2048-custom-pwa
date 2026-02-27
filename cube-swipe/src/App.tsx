import { useState, useEffect, useMemo } from 'react'
import { Box, Typography, ThemeProvider, createTheme } from '@mui/material'
import './App.css'
import { usePWAInstallTracking } from './usePWAInstallTracking'
import { trackDeviceInfo } from './analytics'
import { BackButton } from './components/BackButton'
import { ThemeToggle } from './components/ThemeToggle'
import { UpdatePrompt } from './components/UpdatePrompt'
import { MainMenu } from './components/MainMenu'
import { GameModeSelect } from './components/GameModeSelect'
import { GameBoard } from './components/GameBoard'
import { LeaveCommentForm } from './components/LeaveCommentForm'
import { AboutSection } from './components/AboutSection'
import { TemplatesSection } from './components/TemplatesSection'
import { MonopolyDealBoard } from './components/MonopolyDealBoard'
import { OfflineIndicator } from './components/OfflineIndicator'
import { testGoogleScriptAPI } from './utils/testGoogleScript'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameMode, setGameMode] = useState<'classic' | 'fibonacci' | null>(null)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [monopolyDealOpen, setMonopolyDealOpen] = useState(false)
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
      : monopolyDealOpen
        ? 'monopolyDeal'
        : aboutOpen
          ? 'about'
          : templatesOpen
            ? 'templates'
            : commentsOpen
              ? 'comments'
              : 'menu'

  // Lock orientation to portrait for all views except Monopoly Deal
  useEffect(() => {
    const so = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void>; unlock?: () => void }
    if (!so?.lock) return
    if (currentView === 'monopolyDeal') {
      so.unlock?.()
    } else {
      so.lock('portrait').catch(() => { /* unsupported or not in standalone */ })
    }
  }, [currentView])

  const handleBack = () => {
    if (gameMode) {
      setGameMode(null)
    } else if (gameStarted) {
      setGameStarted(false)
    } else if (monopolyDealOpen) {
      setMonopolyDealOpen(false)
    } else if (aboutOpen) {
      setAboutOpen(false)
    } else if (templatesOpen) {
      setTemplatesOpen(false)
    } else if (commentsOpen) {
      setCommentsOpen(false)
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <UpdatePrompt />
      <OfflineIndicator />
      <Box
        sx={{
          height: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          bgcolor: 'background.default',
          pt: aboutOpen || templatesOpen || monopolyDealOpen ? 0 : { xs: 8, sm: 10 },
          overflow: currentView === 'menu' || currentView === 'modeSelect' || currentView === 'comments' ? 'auto' : 'hidden',
        }}
      >
        {!aboutOpen && !templatesOpen && !monopolyDealOpen && (gameStarted || commentsOpen) && (
          <BackButton onClick={handleBack} />
        )}

        {!aboutOpen && !templatesOpen && !monopolyDealOpen && (
          <ThemeToggle
            themeMode={themeMode}
            onToggle={() => setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'))}
          />
        )}

        {!aboutOpen && !templatesOpen && !monopolyDealOpen && (
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
        )}

        {currentView === 'menu' && (
          <MainMenu
            onStartGame={() => setGameStarted(true)}
            onOpenAbout={() => setAboutOpen(true)}
            onOpenTemplates={() => setTemplatesOpen(true)}
            onOpenComments={() => setCommentsOpen(true)}
            onOpenMonopolyDeal={() => setMonopolyDealOpen(true)}
          />
        )}
        {currentView === 'modeSelect' && <GameModeSelect onSelectMode={setGameMode} />}
        {currentView === 'about' && <AboutSection />}
        {currentView === 'templates' && <TemplatesSection />}
        {currentView === 'comments' && <LeaveCommentForm onClose={() => setCommentsOpen(false)} />}
        {currentView === 'game' && gameMode && <GameBoard gameMode={gameMode} />}
        {currentView === 'monopolyDeal' && <MonopolyDealBoard onBack={handleBack} />}
      </Box>
    </ThemeProvider>
  )
}

export default App
