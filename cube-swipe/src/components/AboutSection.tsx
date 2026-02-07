import { useState } from 'react'
import { Box, Typography, IconButton, Stack } from '@mui/material'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ChevronRight from '@mui/icons-material/ChevronRight'

type DesignVariant = 'gradient' | 'card' | 'minimal'

interface PageData {
  title: string
  subtitle: string
  emoji: string
  content: string[]
  design: DesignVariant
  colors: {
    primary: string
    secondary: string
    accent: string
  }
}

const baseContent = [
  {
    title: 'Production Build',
    subtitle: 'Making It Fast™',
    emoji: '⚡',
    content: [
      '"Can we make it smaller?" — every developer ever. Spoiler: yes.',
      '195 KB total bundle, 57 KB gzipped main. Lighter than most corporate logos.',
      'Vite config, PWA offline support, code splitting, Terser minification, asset caching.',
    ],
  },
  {
    title: 'Azure Cloud',
    subtitle: 'Microsoft Money Pit',
    emoji: '☁️',
    content: [
      'Cloud setup is usually 47 clicks through Azure Portal. We did it through conversation.',
      'Static Web App, Application Insights monitoring, West Europe deployment.',
      'Live at: thankful-sky-020f0c103.4.azurestaticapps.net',
    ],
  },
  {
    title: 'CI/CD Pipeline',
    subtitle: 'Robots Deploying Robots',
    emoji: '🤖',
    content: [
      'Every push triggers automated checks. Pass = deploy. Fail = shame.',
      'Quality checks → build → deploy. PR previews with auto-comments.',
      'Push at 5pm Friday. Live by 5:02pm. Go home stress-free.',
    ],
  },
  {
    title: 'Testing',
    subtitle: 'Trust But Verify',
    emoji: '✅',
    content: [
      '"It works on my machine" isn\'t a deployment strategy.',
      'Vitest + React Testing Library. Fast unit tests (Jest but actually fast).',
      'Current test count: 1. Coverage: optimistic. Future: TBD when we stop procrastinating.',
    ],
  },
  {
    title: 'Analytics',
    subtitle: 'Big Brother, But Helpful',
    emoji: '📊',
    content: [
      'Can\'t improve what you don\'t measure. Can\'t fix what you don\'t know is broken.',
      'Application Insights tracks page views, errors, PWA installs, custom events.',
      'Fun fact: 3 people installed this app. Two were testing. The third is a mystery.',
    ],
  },
  {
    title: 'Security',
    subtitle: 'Keeping Secrets Secret',
    emoji: '🔒',
    content: [
      'Security through obscurity is not security. Actual security is security.',
      'Smart .gitignore, GitHub Secrets vault, weekly CodeQL + npm audit scans.',
      'Philosophy: Assume everything leaks. Design accordingly. Protect it anyway.',
    ],
  },
  {
    title: 'Developer Experience',
    subtitle: 'Not Terrible',
    emoji: '💻',
    content: [
      'Good tools → happy developers → good software. Circle of life.',
      'Vite HMR <100ms, non-blocking checks, comprehensive scripts, clear env docs.',
      'Testimonial: "I can\'t believe it works this well" — me (AI) (technically both)',
    ],
  },
  {
    title: 'E2E Testing',
    subtitle: 'Testing Like Users Do',
    emoji: '🎭',
    content: [
      'Unit tests test code. E2E tests test reality. Reality = user experience.',
      '5 devices × 6 screens = 30 tests = 150+ screenshots. Comprehensive coverage.',
      'Philosophy: If Playwright can\'t click it, users can\'t either.',
    ],
  },
  {
    title: 'UI/UX',
    subtitle: 'Making It Pretty',
    emoji: '🎨',
    content: [
      'Material Design 3: Light mode (morning people) + Dark mode (developers).',
      'Clean components, Web Share API, PWA install prompts, gradient buttons.',
      'Truth: Users don\'t care about architecture. They care if buttons work.',
    ],
  },
  {
    title: 'Layout & CSS',
    subtitle: 'The 100vw Bug of 2025',
    emoji: '📐',
    content: [
      'Responsive design is easy until it isn\'t. Here\'s what we learned:',
      '100vw includes scrollbar → chaos on Windows. Use 100% instead.',
      'Flexbox centering, absolute top corners, viewport constraints. Works on all 5 devices.',
    ],
  },
]

const colorSchemes = [
  // Gradient variations - bold and vibrant
  { primary: '#6750A4', secondary: '#E8DEF8', accent: '#EADDFF' },
  { primary: '#D32F2F', secondary: '#FFCDD2', accent: '#EF5350' },
  { primary: '#0288D1', secondary: '#B3E5FC', accent: '#29B6F6' },
  { primary: '#388E3C', secondary: '#C8E6C9', accent: '#66BB6A' },
  { primary: '#F57C00', secondary: '#FFE0B2', accent: '#FFA726' },
  { primary: '#7B1FA2', secondary: '#E1BEE7', accent: '#BA68C8' },
  { primary: '#C2185B', secondary: '#F8BBD0', accent: '#F06292' },
  { primary: '#1976D2', secondary: '#BBDEFB', accent: '#42A5F5' },
  { primary: '#689F38', secondary: '#DCEDC8', accent: '#9CCC65' },
  { primary: '#5D4037', secondary: '#D7CCC8', accent: '#8D6E63' },

  // Card variations - professional tones
  { primary: '#2E7D32', secondary: '#A5D6A7', accent: '#4CAF50' },
  { primary: '#0097A7', secondary: '#B2EBF2', accent: '#00BCD4' },
  { primary: '#F57F17', secondary: '#FFF59D', accent: '#FFEB3B' },
  { primary: '#5E35B1', secondary: '#D1C4E9', accent: '#9575CD' },
  { primary: '#E64A19', secondary: '#FFCCBC', accent: '#FF7043' },
  { primary: '#455A64', secondary: '#CFD8DC', accent: '#78909C' },
  { primary: '#6D4C41', secondary: '#BCAAA4', accent: '#A1887F' },
  { primary: '#00695C', secondary: '#B2DFDB', accent: '#26A69A' },
  { primary: '#AD1457', secondary: '#F48FB1', accent: '#EC407A' },
  { primary: '#1565C0', secondary: '#90CAF9', accent: '#2196F3' },

  // Minimal variations - clean and modern
  { primary: '#37474F', secondary: '#ECEFF1', accent: '#607D8B' },
  { primary: '#424242', secondary: '#E0E0E0', accent: '#757575' },
  { primary: '#00897B', secondary: '#80CBC4', accent: '#00897B' },
  { primary: '#6A1B9A', secondary: '#CE93D8', accent: '#AB47BC' },
  { primary: '#EF6C00', secondary: '#FFCC80', accent: '#FB8C00' },
  { primary: '#1E88E5', secondary: '#64B5F6', accent: '#2196F3' },
  { primary: '#43A047', secondary: '#81C784', accent: '#66BB6A' },
  { primary: '#8E24AA', secondary: '#CE93D8', accent: '#AB47BC' },
  { primary: '#00ACC1', secondary: '#4DD0E1', accent: '#26C6DA' },
  { primary: '#3949AB', secondary: '#7986CB', accent: '#5C6BC0' },
]

// Create 30 pages: 3 variations × 10 topics
const pages: PageData[] = baseContent.flatMap((item, index) => [
  {
    ...item,
    design: 'gradient' as DesignVariant,
    colors: colorSchemes[index * 3],
  },
  {
    ...item,
    design: 'card' as DesignVariant,
    colors: colorSchemes[index * 3 + 1],
  },
  {
    ...item,
    design: 'minimal' as DesignVariant,
    colors: colorSchemes[index * 3 + 2],
  },
])

interface AboutSectionProps {
  onPageChange?: (page: number) => void
}

export const AboutSection = ({ onPageChange }: AboutSectionProps) => {
  const [currentPage, setCurrentPage] = useState(0)

  const handlePrevious = () => {
    setCurrentPage((prev) => {
      const newPage = prev > 0 ? prev - 1 : pages.length - 1
      onPageChange?.(newPage)
      return newPage
    })
  }

  const handleNext = () => {
    setCurrentPage((prev) => {
      const newPage = prev < pages.length - 1 ? prev + 1 : 0
      onPageChange?.(newPage)
      return newPage
    })
  }

  const page = pages[currentPage]

  const renderGradientDesign = () => (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${page.colors.primary} 0%, ${page.colors.secondary} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative circles */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '15%',
          left: '5%',
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(10px)',
        }}
      />

      {/* Main app title - only on first page */}
      {currentPage === 0 && (
        <Typography
          sx={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.95)',
            textAlign: 'center',
            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
            fontFamily: 'Roboto, sans-serif',
            letterSpacing: '-0.01em',
            mb: 2,
            lineHeight: 1.3,
          }}
        >
          Elvis Skensberg<br />AI Showcase
        </Typography>
      )}

      {/* Game Preview - only on first page */}
      {currentPage === 0 && (
        <Box
          sx={{
            mb: 3,
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '16px',
            padding: '16px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          {/* Mini game board preview */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              width: '240px',
              mb: 1,
            }}
          >
            {([2, 4, 32, 4, 0, 2, 2, 256, 0, 0, 2, 8, 0, 0, 0, 4] as const).map((value, index) => (
              <Box
                key={index}
                sx={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '8px',
                  background: value
                    ? value >= 256
                      ? '#F59E0B'
                      : value >= 32
                        ? '#F97316'
                        : value >= 8
                          ? '#FB923C'
                          : value >= 4
                            ? '#F3E5D5'
                            : '#EEE4DA'
                    : 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: value >= 100 ? '1.2rem' : '1.5rem',
                  fontWeight: 700,
                  color: value && value >= 8 ? '#FFFFFF' : '#776E65',
                }}
              >
                {value || ''}
              </Box>
            ))}
          </Box>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.8)',
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            2048 Game Preview
          </Typography>
        </Box>
      )}

      {/* Emoji */}
      <Typography sx={{ fontSize: '6rem', mb: 2 }}>{page.emoji}</Typography>

      {/* Title */}
      <Typography
        sx={{
          fontSize: '3.5rem',
          fontWeight: 900,
          color: '#FFFFFF',
          textAlign: 'center',
          textShadow: '0 4px 12px rgba(0,0,0,0.3)',
          fontFamily: 'Roboto, sans-serif',
          letterSpacing: '-0.02em',
          mb: 1,
        }}
      >
        {page.title}
      </Typography>

      {/* Subtitle */}
      <Typography
        sx={{
          fontSize: '1.5rem',
          fontWeight: 300,
          color: 'rgba(255,255,255,0.9)',
          textAlign: 'center',
          fontStyle: 'italic',
          mb: 4,
        }}
      >
        {page.subtitle}
      </Typography>

      {/* Content */}
      <Stack spacing={2.5} sx={{ maxWidth: 750, px: 4, zIndex: 1 }}>
        {page.content.map((text, index) => (
          <Typography
            key={index}
            sx={{
              fontSize: '1.25rem',
              fontWeight: 400,
              color: '#FFFFFF',
              textAlign: 'center',
              lineHeight: 1.8,
              textShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            {text}
          </Typography>
        ))}
      </Stack>
    </Box>
  )

  const renderCardDesign = () => (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: page.colors.secondary,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Main app title - only on first page */}
      {currentPage === 0 && (
        <Typography
          sx={{
            position: 'absolute',
            top: 30,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '2.2rem',
            fontWeight: 700,
            color: page.colors.primary,
            textAlign: 'center',
            fontFamily: 'Roboto, sans-serif',
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
            zIndex: 10,
          }}
        >
          Elvis Skensberg<br />AI Showcase
        </Typography>
      )}

      {/* Decorative squares */}
      <Box
        sx={{
          position: 'absolute',
          top: '5%',
          left: '5%',
          width: 100,
          height: 100,
          background: page.colors.accent,
          opacity: 0.15,
          transform: 'rotate(15deg)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          right: '8%',
          width: 120,
          height: 120,
          background: page.colors.primary,
          opacity: 0.1,
          transform: 'rotate(-20deg)',
        }}
      />

      {/* Main card */}
      <Box
        sx={{
          background: '#FFFFFF',
          borderRadius: '32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          padding: '60px 50px',
          maxWidth: 750,
          width: '85%',
          borderLeft: `8px solid ${page.colors.accent}`,
          position: 'relative',
        }}
      >
        {/* Emoji badge */}
        <Box
          sx={{
            position: 'absolute',
            top: -40,
            left: '50%',
            transform: 'translateX(-50%)',
            background: page.colors.primary,
            borderRadius: '50%',
            width: 80,
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}
        >
          <Typography sx={{ fontSize: '3rem' }}>{page.emoji}</Typography>
        </Box>

        {/* Title */}
        <Typography
          sx={{
            fontSize: '3rem',
            fontWeight: 800,
            color: page.colors.primary,
            textAlign: 'center',
            fontFamily: 'Roboto, sans-serif',
            mt: 3,
            mb: 1,
          }}
        >
          {page.title}
        </Typography>

        {/* Subtitle */}
        <Typography
          sx={{
            fontSize: '1.3rem',
            fontWeight: 400,
            color: page.colors.accent,
            textAlign: 'center',
            mb: 4,
          }}
        >
          {page.subtitle}
        </Typography>

        {/* Content */}
        <Stack spacing={2.5}>
          {page.content.map((text, index) => (
            <Typography
              key={index}
              sx={{
                fontSize: '1.15rem',
                fontWeight: 400,
                color: '#2C3E50',
                textAlign: 'center',
                lineHeight: 1.8,
              }}
            >
              {text}
            </Typography>
          ))}
        </Stack>

        {/* Decorative dot */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -15,
            right: -15,
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: page.colors.accent,
            opacity: 0.25,
          }}
        />
      </Box>
    </Box>
  )

  const renderMinimalDesign = () => (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: page.colors.secondary,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Main app title - only on first page */}
      {currentPage === 0 && (
        <Typography
          sx={{
            position: 'absolute',
            top: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '2rem',
            fontWeight: 700,
            color: page.colors.primary,
            textAlign: 'center',
            fontFamily: 'monospace',
            letterSpacing: '0.02em',
            lineHeight: 1.4,
            zIndex: 10,
          }}
        >
          ELVIS SKENSBERG<br />AI SHOWCASE
        </Typography>
      )}

      {/* Geometric background shapes */}
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: page.colors.accent,
          opacity: 0.12,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -80,
          left: -80,
          width: 250,
          height: 250,
          background: page.colors.primary,
          opacity: 0.08,
          transform: 'rotate(45deg)',
        }}
      />

      {/* Content area */}
      <Box sx={{ maxWidth: 800, px: 5, zIndex: 1 }}>
        {/* Emoji with geometric frame */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: '24px',
              background: `linear-gradient(135deg, ${page.colors.primary}, ${page.colors.accent})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'rotate(-5deg)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            }}
          >
            <Typography sx={{ fontSize: '4rem' }}>{page.emoji}</Typography>
          </Box>
        </Box>

        {/* Title */}
        <Typography
          sx={{
            fontSize: '3.2rem',
            fontWeight: 700,
            color: page.colors.primary,
            textAlign: 'center',
            fontFamily: 'monospace',
            letterSpacing: '-0.01em',
            mb: 0.5,
          }}
        >
          {page.title}
        </Typography>

        {/* Subtitle */}
        <Typography
          sx={{
            fontSize: '1.4rem',
            fontWeight: 500,
            color: page.colors.accent,
            textAlign: 'center',
            mb: 4,
            fontFamily: 'sans-serif',
          }}
        >
          {page.subtitle}
        </Typography>

        {/* Divider line */}
        <Box
          sx={{
            width: 60,
            height: 4,
            background: page.colors.accent,
            margin: '0 auto 4',
            borderRadius: 2,
          }}
        />

        {/* Content */}
        <Stack spacing={3}>
          {page.content.map((text, index) => (
            <Typography
              key={index}
              sx={{
                fontSize: '1.2rem',
                fontWeight: 400,
                color: '#37474F',
                textAlign: 'center',
                lineHeight: 1.9,
                fontFamily: 'sans-serif',
              }}
            >
              {text}
            </Typography>
          ))}
        </Stack>
      </Box>
    </Box>
  )

  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
      }}
    >
      {/* Page counter at top left */}
      <Typography
        variant="body2"
        sx={{
          position: 'fixed',
          top: 16,
          left: 16,
          color: page.design === 'gradient' ? '#FFFFFF' : page.colors.primary,
          fontSize: '0.95rem',
          zIndex: 1100,
          fontWeight: 700,
          background: page.design === 'gradient' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
          padding: '4px 12px',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
        }}
      >
        {currentPage + 1} / {pages.length}
      </Typography>

      {/* Previous arrow - left edge */}
      <IconButton
        onClick={handlePrevious}
        sx={{
          position: 'fixed',
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          color: page.design === 'gradient' ? '#FFFFFF' : page.colors.primary,
          bgcolor: page.design === 'gradient' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.95)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(10px)',
          width: 56,
          height: 56,
          '&:hover': {
            bgcolor: page.design === 'gradient' ? 'rgba(255,255,255,0.3)' : '#FFFFFF',
            transform: 'translateY(-50%) scale(1.1)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
          },
          transition: 'all 0.2s ease',
          zIndex: 1100,
        }}
        aria-label="Previous page"
      >
        <ChevronLeft fontSize="large" />
      </IconButton>

      {/* Next arrow - right edge */}
      <IconButton
        onClick={handleNext}
        sx={{
          position: 'fixed',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          color: page.design === 'gradient' ? '#FFFFFF' : page.colors.primary,
          bgcolor: page.design === 'gradient' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.95)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(10px)',
          width: 56,
          height: 56,
          '&:hover': {
            bgcolor: page.design === 'gradient' ? 'rgba(255,255,255,0.3)' : '#FFFFFF',
            transform: 'translateY(-50%) scale(1.1)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
          },
          transition: 'all 0.2s ease',
          zIndex: 1100,
        }}
        aria-label="Next page"
      >
        <ChevronRight fontSize="large" />
      </IconButton>

      {/* Render appropriate design */}
      {page.design === 'gradient' && renderGradientDesign()}
      {page.design === 'card' && renderCardDesign()}
      {page.design === 'minimal' && renderMinimalDesign()}
    </Box>
  )
}
