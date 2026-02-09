import { IconButton, type SxProps, type Theme } from '@mui/material'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ChevronRight from '@mui/icons-material/ChevronRight'
import type { PageData } from '../aboutData'

interface NavArrowButtonProps {
  direction: 'prev' | 'next'
  onClick: () => void
  page: PageData
}

const NavArrowButton = ({ direction, onClick, page }: NavArrowButtonProps): React.JSX.Element => {
  const isGradient = page.design === 'gradient'
  const positionSx: SxProps<Theme> =
    direction === 'prev'
      ? { left: { xs: 4, sm: 10, md: 16 } }
      : { right: { xs: 4, sm: 10, md: 16 } }

  return (
    <IconButton
      onClick={onClick}
      sx={{
        position: 'fixed',
        top: '50%',
        transform: 'translateY(-50%)',
        color: isGradient ? '#FFFFFF' : page.colors.primary,
        bgcolor: isGradient ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.95)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        backdropFilter: 'blur(10px)',
        width: { xs: 36, sm: 46, md: 56 },
        height: { xs: 36, sm: 46, md: 56 },
        '&:hover': {
          bgcolor: isGradient ? 'rgba(255,255,255,0.3)' : '#FFFFFF',
          transform: 'translateY(-50%) scale(1.1)',
          boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
        },
        transition: 'all 0.2s ease',
        zIndex: 1100,
        ...positionSx,
      }}
      aria-label={direction === 'prev' ? 'Previous page' : 'Next page'}
    >
      {direction === 'prev' ? (
        <ChevronLeft sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }} />
      ) : (
        <ChevronRight sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }} />
      )}
    </IconButton>
  )
}

export default NavArrowButton
