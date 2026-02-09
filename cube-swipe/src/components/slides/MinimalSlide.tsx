import { Box, Typography, Stack } from '@mui/material'
import type { PageData } from '../aboutData'

export interface MinimalSlideProps {
  page: PageData
  firstPageContent?: React.ReactNode
}

const MinimalSlide = ({ page, firstPageContent }: MinimalSlideProps): React.JSX.Element => (
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
    {firstPageContent}

    {/* Geometric background shapes */}
    <Box
      sx={{
        position: 'absolute',
        top: -50,
        right: -50,
        width: { xs: 150, sm: 220, md: 300 },
        height: { xs: 150, sm: 220, md: 300 },
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
        width: { xs: 130, sm: 190, md: 250 },
        height: { xs: 130, sm: 190, md: 250 },
        background: page.colors.primary,
        opacity: 0.08,
        transform: 'rotate(45deg)',
      }}
    />

    {/* Content area */}
    <Box sx={{ maxWidth: '80%', px: { xs: 2, sm: 3, md: 4 }, zIndex: 1 }}>
      {/* Emoji with geometric frame */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: { xs: 1.5, sm: 2, md: 3 },
        }}
      >
        <Box
          sx={{
            width: { xs: 80, sm: 100, md: 120 },
            height: { xs: 80, sm: 100, md: 120 },
            borderRadius: { xs: '16px', sm: '20px', md: '24px' },
            background: `linear-gradient(135deg, ${page.colors.primary}, ${page.colors.accent})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'rotate(-5deg)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          }}
        >
          <Typography sx={{ fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' } }}>{page.emoji}</Typography>
        </Box>
      </Box>

      {/* Title */}
      <Typography
        sx={{
          fontSize: { xs: '1.7rem', sm: '2.4rem', md: '3.2rem' },
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
          fontSize: { xs: '1rem', sm: '1.2rem', md: '1.4rem' },
          fontWeight: 500,
          color: page.colors.accent,
          textAlign: 'center',
          mb: { xs: 2, sm: 3, md: 4 },
          fontFamily: 'sans-serif',
        }}
      >
        {page.subtitle}
      </Typography>

      {/* Divider line */}
      <Box
        sx={{
          width: { xs: 40, sm: 50, md: 60 },
          height: { xs: 3, md: 4 },
          background: page.colors.accent,
          margin: '0 auto 4',
          borderRadius: 2,
        }}
      />

      {/* Content */}
      <Stack spacing={{ xs: 1.5, sm: 2, md: 3 }}>
        {page.content.map((text, index) => (
          <Typography
            key={index}
            sx={{
              fontSize: { xs: '0.85rem', sm: '1.05rem', md: '1.2rem' },
              fontWeight: 400,
              color: '#37474F',
              textAlign: 'center',
              lineHeight: { xs: 1.6, md: 1.9 },
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

export default MinimalSlide
