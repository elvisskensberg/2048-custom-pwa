import { useState } from 'react'
import { Box, Typography } from '@mui/material'
import type { DesignVariant } from './aboutData'
import { getAboutSlides, getSlide, getNextIndex, getPreviousIndex } from '../services/slidesService'
import SlideRenderer from './slides/SlideRenderer'
import NavArrowButton from './slides/NavArrowButton'
import PageCounter from './slides/PageCounter'
import GamePreview from './slides/GamePreview'

interface AboutSectionProps {
  onPageChange?: (page: number) => void
}

const GradientFirstPageContent = (): React.JSX.Element => (
  <>
    <Typography
      sx={{
        fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
        fontWeight: 800,
        color: 'rgba(255,255,255,0.95)',
        textAlign: 'center',
        textShadow: '0 2px 8px rgba(0,0,0,0.2)',
        fontFamily: 'Roboto, sans-serif',
        letterSpacing: '-0.01em',
        mb: { xs: 1, sm: 1.5, md: 2 },
        lineHeight: 1.3,
      }}
    >
      Elvis Skensberg<br />AI Showcase
    </Typography>
    <GamePreview />
  </>
)

const CardFirstPageContent = ({ primaryColor }: { primaryColor: string }): React.JSX.Element => (
  <Typography
    sx={{
      position: 'absolute',
      top: { xs: 16, sm: 24, md: 30 },
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.2rem' },
      fontWeight: 700,
      color: primaryColor,
      textAlign: 'center',
      fontFamily: 'Roboto, sans-serif',
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
      zIndex: 10,
      width: { xs: '90%', sm: 'auto' },
    }}
  >
    Elvis Skensberg<br />AI Showcase
  </Typography>
)

const MinimalFirstPageContent = ({ primaryColor }: { primaryColor: string }): React.JSX.Element => (
  <Typography
    sx={{
      position: 'absolute',
      top: { xs: 20, sm: 30, md: 40 },
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: { xs: '1.3rem', sm: '1.7rem', md: '2rem' },
      fontWeight: 700,
      color: primaryColor,
      textAlign: 'center',
      fontFamily: 'monospace',
      letterSpacing: '0.02em',
      lineHeight: 1.4,
      zIndex: 10,
      width: { xs: '90%', sm: 'auto' },
    }}
  >
    ELVIS SKENSBERG<br />AI SHOWCASE
  </Typography>
)

const getFirstPageContent = (design: DesignVariant, primaryColor: string): React.ReactNode => {
  switch (design) {
    case 'gradient':
      return <GradientFirstPageContent />
    case 'card':
      return <CardFirstPageContent primaryColor={primaryColor} />
    case 'minimal':
      return <MinimalFirstPageContent primaryColor={primaryColor} />
  }
}

export const AboutSection = ({ onPageChange }: AboutSectionProps): React.JSX.Element => {
  const [currentPage, setCurrentPage] = useState(0)
  const collection = getAboutSlides()
  const page = getSlide(collection, currentPage)

  const handlePrevious = (): void => {
    setCurrentPage((prev) => {
      const newPage = getPreviousIndex(collection, prev)
      onPageChange?.(newPage)
      return newPage
    })
  }

  const handleNext = (): void => {
    setCurrentPage((prev) => {
      const newPage = getNextIndex(collection, prev)
      onPageChange?.(newPage)
      return newPage
    })
  }

  const firstPageContent = currentPage === 0 ? getFirstPageContent(page.design, page.colors.primary) : undefined

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
      <PageCounter
        currentPage={currentPage}
        totalPages={collection.totalCount}
        design={page.design}
        primaryColor={page.colors.primary}
      />

      <NavArrowButton direction="prev" onClick={handlePrevious} page={page} />
      <NavArrowButton direction="next" onClick={handleNext} page={page} />

      <SlideRenderer page={page} firstPageContent={firstPageContent} />
    </Box>
  )
}
