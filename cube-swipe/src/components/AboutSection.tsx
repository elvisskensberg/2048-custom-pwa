import { Box, Typography, Button } from '@mui/material'

interface AboutSectionProps {
  onClose: () => void
}

export const AboutSection = ({ onClose }: AboutSectionProps) => {
  return (
    <Box sx={{ maxWidth: 600, textAlign: 'center', px: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, color: 'text.primary' }}>
        About Cube Swipe 2048
      </Typography>
      <Typography variant="body1" paragraph sx={{ mb: 2, color: 'text.primary' }}>
        Cube Swipe 2048 is a modern take on the classic 2048 puzzle game.
        Swipe in any direction to move the tiles and combine matching numbers.
        The goal is to reach the 2048 tile!
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
  )
}
