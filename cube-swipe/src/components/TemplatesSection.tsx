import { useState } from 'react'
import { Box } from '@mui/material'
import { getTemplateSlides, getSlide, getNextIndex, getPreviousIndex } from '../services/slidesService'
import SlideRenderer from './slides/SlideRenderer'
import NavArrowButton from './slides/NavArrowButton'
import PageCounter from './slides/PageCounter'

interface TemplatesSectionProps {
  onPageChange?: (page: number) => void
}

export const TemplatesSection = ({ onPageChange }: TemplatesSectionProps): React.JSX.Element => {
  const [currentPage, setCurrentPage] = useState(0)
  const collection = getTemplateSlides()
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

      <SlideRenderer page={page} />
    </Box>
  )
}
