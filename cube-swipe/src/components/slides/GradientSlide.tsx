import { Box, Typography, Stack } from '@mui/material'
import type { PageData } from '../aboutData'

export interface GradientSlideProps {
  page: PageData
  firstPageContent?: React.ReactNode
}

const GradientSlide = ({ page, firstPageContent }: GradientSlideProps): React.JSX.Element => (
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
        width: { xs: 100, sm: 150, md: 200 },
        height: { xs: 100, sm: 150, md: 200 },
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        zIndex: 0,
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        bottom: '15%',
        left: '5%',
        width: { xs: 80, sm: 120, md: 150 },
        height: { xs: 80, sm: 120, md: 150 },
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(10px)',
        zIndex: 0,
      }}
    />

    <Box sx={{ zIndex: 1, position: 'relative' }}>{firstPageContent}</Box>

    {/* Emoji */}
    <Typography sx={{ fontSize: { xs: '3rem', sm: '4.5rem', md: '6rem' }, mb: { xs: 1, sm: 1.5, md: 2 }, zIndex: 1, position: 'relative' }}>
      {page.emoji}
    </Typography>

    {/* Title */}
    <Typography
      sx={{
        fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3.5rem' },
        fontWeight: 900,
        color: '#FFFFFF',
        textAlign: 'center',
        textShadow: '0 2px 4px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)',
        fontFamily: 'Roboto, sans-serif',
        letterSpacing: '-0.02em',
        mb: { xs: 0.5, sm: 0.75, md: 1 },
        zIndex: 1,
        position: 'relative',
        maxWidth: '80%',
        px: 2,
      }}
    >
      {page.title}
    </Typography>

    {/* Subtitle */}
    <Typography
      sx={{
        fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
        fontWeight: 300,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        fontStyle: 'italic',
        textShadow: '0 2px 6px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.3)',
        mb: { xs: 2, sm: 3, md: 4 },
        zIndex: 1,
        position: 'relative',
        maxWidth: '80%',
        px: 2,
      }}
    >
      {page.subtitle}
    </Typography>

    {/* Content */}
    <Stack
      spacing={{ xs: 1.5, sm: 2, md: 2.5 }}
      sx={{ maxWidth: '80%', px: { xs: 2, sm: 3, md: 4 }, zIndex: 1 }}
    >
      {page.content.map((text, index) => (
        <Typography
          key={index}
          sx={{
            fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.25rem' },
            fontWeight: 400,
            color: '#FFFFFF',
            textAlign: 'center',
            lineHeight: { xs: 1.6, md: 1.8 },
            textShadow: '0 2px 4px rgba(0,0,0,0.4), 0 4px 10px rgba(0,0,0,0.3)',
          }}
        >
          {text}
        </Typography>
      ))}
    </Stack>
  </Box>
)

export default GradientSlide
