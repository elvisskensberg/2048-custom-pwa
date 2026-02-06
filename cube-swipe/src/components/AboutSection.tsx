import { Box, Typography, Button } from '@mui/material'
import { AppVersion } from './AppVersion'

interface AboutSectionProps {
  onClose: () => void
}

export const AboutSection = ({ onClose }: AboutSectionProps) => {
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
      <Box sx={{ maxWidth: 600, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'text.primary' }}>
          About This Showcase
        </Typography>
        <Typography variant="body1" paragraph sx={{ mb: 2, color: 'text.primary' }}>
          This is a modern implementation of the classic 2048 puzzle game,
          showcasing advanced web development skills and AI-assisted development workflows.
          Swipe in any direction to move the tiles and combine matching numbers.
        </Typography>
        <Typography variant="body1" paragraph sx={{ mb: 3, color: 'text.primary' }}>
          Built with React, Material Design 3, and PWA technology for a seamless
          experience across all devices. Install it on your device for offline play!
        </Typography>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1rem',
            textTransform: 'none',
          }}
        >
          Back
        </Button>
      </Box>

      <AppVersion />
    </Box>
  )
}
