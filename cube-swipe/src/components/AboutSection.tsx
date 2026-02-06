import { useState } from 'react'
import { Box, Typography, IconButton, Stack } from '@mui/material'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ChevronRight from '@mui/icons-material/ChevronRight'
import { AppVersion } from './AppVersion'

const pages = [
  {
    title: 'Production Build (Making It Fast™)',
    content: [
      '"Can we make it smaller?" — every developer ever. Spoiler: yes.',
      '195 KB total bundle, 57 KB gzipped main. Lighter than most corporate logos.',
      'Vite config, PWA offline support, code splitting, Terser minification, asset caching.',
    ],
  },
  {
    title: 'Azure Cloud (Microsoft Money Pit)',
    content: [
      'Cloud setup is usually 47 clicks through Azure Portal. We did it through conversation.',
      'Static Web App, Application Insights monitoring, West Europe deployment.',
      'Live at: thankful-sky-020f0c103.4.azurestaticapps.net',
    ],
  },
  {
    title: 'CI/CD Pipeline (Robots Deploying Robots)',
    content: [
      'Every push triggers automated checks. Pass = deploy. Fail = shame.',
      'Quality checks → build → deploy. PR previews with auto-comments.',
      'Push at 5pm Friday. Live by 5:02pm. Go home stress-free.',
    ],
  },
  {
    title: 'Testing (Trust But Verify)',
    content: [
      '"It works on my machine" isn\'t a deployment strategy.',
      'Vitest + React Testing Library. Fast unit tests (Jest but actually fast).',
      'Current test count: 1. Coverage: optimistic. Future: TBD when we stop procrastinating.',
    ],
  },
  {
    title: 'Analytics (Big Brother, But Helpful)',
    content: [
      'Can\'t improve what you don\'t measure. Can\'t fix what you don\'t know is broken.',
      'Application Insights tracks page views, errors, PWA installs, custom events.',
      'Fun fact: 3 people installed this app. Two were testing. The third is a mystery.',
    ],
  },
  {
    title: 'Security (Keeping Secrets Secret)',
    content: [
      'Security through obscurity is not security. Actual security is security.',
      'Smart .gitignore, GitHub Secrets vault, weekly CodeQL + npm audit scans.',
      'Philosophy: Assume everything leaks. Design accordingly. Protect it anyway.',
    ],
  },
  {
    title: 'Developer Experience (Not Terrible)',
    content: [
      'Good tools → happy developers → good software. Circle of life.',
      'Vite HMR <100ms, non-blocking checks, comprehensive scripts, clear env docs.',
      'Testimonial: "I can\'t believe it works this well" — me (AI) (technically both)',
    ],
  },
  {
    title: 'E2E Testing (Testing Like Users Do)',
    content: [
      'Unit tests test code. E2E tests test reality. Reality = user experience.',
      '5 devices × 6 screens = 30 tests = 150+ screenshots. Comprehensive coverage.',
      'Philosophy: If Playwright can\'t click it, users can\'t either.',
    ],
  },
  {
    title: 'UI/UX (Making It Pretty)',
    content: [
      'Material Design 3: Light mode (morning people) + Dark mode (developers).',
      'Clean components, Web Share API, PWA install prompts, gradient buttons.',
      'Truth: Users don\'t care about architecture. They care if buttons work.',
    ],
  },
  {
    title: 'Layout & CSS (The 100vw Bug of 2025)',
    content: [
      'Responsive design is easy until it isn\'t. Here\'s what we learned:',
      '100vw includes scrollbar → chaos on Windows. Use 100% instead.',
      'Flexbox centering, absolute top corners, viewport constraints. Works on all 5 devices.',
    ],
  },
]

export const AboutSection = () => {
  const [currentPage, setCurrentPage] = useState(0)

  const handlePrevious = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : pages.length - 1))
  }

  const handleNext = () => {
    setCurrentPage((prev) => (prev < pages.length - 1 ? prev + 1 : 0))
  }

  const page = pages[currentPage]

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: 600,
        px: 2,
        pb: 8,
      }}
    >
      <Box sx={{ maxWidth: 600, textAlign: 'center', minHeight: 300 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'text.primary' }}>
          {page.title}
        </Typography>

        <Stack spacing={2} sx={{ mb: 4 }}>
          {page.content.map((text, index) => (
            <Typography
              key={index}
              variant="body1"
              sx={{
                color: 'text.primary',
                textAlign: text.startsWith('✓') ? 'left' : 'center',
              }}
            >
              {text}
            </Typography>
          ))}
        </Stack>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <IconButton
            onClick={handlePrevious}
            sx={{
              color: 'primary.main',
              '&:hover': { bgcolor: 'action.hover' },
            }}
            aria-label="Previous page"
          >
            <ChevronLeft fontSize="large" />
          </IconButton>

          <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 60 }}>
            {currentPage + 1} / {pages.length}
          </Typography>

          <IconButton
            onClick={handleNext}
            sx={{
              color: 'primary.main',
              '&:hover': { bgcolor: 'action.hover' },
            }}
            aria-label="Next page"
          >
            <ChevronRight fontSize="large" />
          </IconButton>
        </Box>
      </Box>

      <AppVersion />
    </Box>
  )
}
