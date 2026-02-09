import { Typography } from '@mui/material'
import type { DesignVariant } from '../aboutData'

interface PageCounterProps {
  currentPage: number
  totalPages: number
  design: DesignVariant
  primaryColor: string
}

const PageCounter = ({ currentPage, totalPages, design, primaryColor }: PageCounterProps): React.JSX.Element => (
  <Typography
    variant="body2"
    sx={{
      position: 'fixed',
      top: { xs: 12, sm: 14, md: 16 },
      left: { xs: 8, sm: 12, md: 16 },
      color: design === 'gradient' ? '#FFFFFF' : primaryColor,
      fontSize: { xs: '0.8rem', sm: '0.875rem', md: '0.95rem' },
      zIndex: 1100,
      fontWeight: 700,
      background: design === 'gradient' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
      padding: { xs: '3px 8px', sm: '4px 10px', md: '4px 12px' },
      borderRadius: '12px',
      backdropFilter: 'blur(10px)',
    }}
  >
    {currentPage + 1} / {totalPages}
  </Typography>
)

export default PageCounter
