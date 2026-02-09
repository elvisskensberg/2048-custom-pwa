import { Box, Typography, Stack } from '@mui/material'
import type { PageData } from '../aboutData'

export interface CardSlideProps {
  page: PageData
  firstPageContent?: React.ReactNode
}

const CardSlide = ({ page, firstPageContent }: CardSlideProps): React.JSX.Element => (
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
    {firstPageContent}

    {/* Decorative squares */}
    <Box
      sx={{
        position: 'absolute',
        top: '5%',
        left: '5%',
        width: { xs: 60, sm: 80, md: 100 },
        height: { xs: 60, sm: 80, md: 100 },
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
        width: { xs: 70, sm: 100, md: 120 },
        height: { xs: 70, sm: 100, md: 120 },
        background: page.colors.primary,
        opacity: 0.1,
        transform: 'rotate(-20deg)',
      }}
    />

    {/* Main card */}
    <Box
      sx={{
        background: '#FFFFFF',
        borderRadius: { xs: '20px', sm: '28px', md: '32px' },
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        padding: { xs: '30px 20px', sm: '40px 35px', md: '60px 50px' },
        maxWidth: '80%',
        width: '80%',
        borderLeft: `8px solid ${page.colors.accent}`,
        position: 'relative',
      }}
    >
      {/* Emoji badge */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: -28, sm: -34, md: -40 },
          left: '50%',
          transform: 'translateX(-50%)',
          background: page.colors.primary,
          borderRadius: '50%',
          width: { xs: 56, sm: 68, md: 80 },
          height: { xs: 56, sm: 68, md: 80 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}
      >
        <Typography sx={{ fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' } }}>{page.emoji}</Typography>
      </Box>

      {/* Title */}
      <Typography
        sx={{
          fontSize: { xs: '1.6rem', sm: '2.2rem', md: '3rem' },
          fontWeight: 800,
          color: page.colors.primary,
          textAlign: 'center',
          fontFamily: 'Roboto, sans-serif',
          mt: { xs: 2, sm: 2.5, md: 3 },
          mb: { xs: 0.5, sm: 0.75, md: 1 },
        }}
      >
        {page.title}
      </Typography>

      {/* Subtitle */}
      <Typography
        sx={{
          fontSize: { xs: '1rem', sm: '1.15rem', md: '1.3rem' },
          fontWeight: 400,
          color: page.colors.accent,
          textAlign: 'center',
          mb: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {page.subtitle}
      </Typography>

      {/* Content */}
      <Stack spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
        {page.content.map((text, index) => (
          <Typography
            key={index}
            sx={{
              fontSize: { xs: '0.85rem', sm: '1rem', md: '1.15rem' },
              fontWeight: 400,
              color: '#2C3E50',
              textAlign: 'center',
              lineHeight: { xs: 1.6, md: 1.8 },
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
          bottom: { xs: -10, md: -15 },
          right: { xs: -10, md: -15 },
          width: { xs: 40, sm: 50, md: 60 },
          height: { xs: 40, sm: 50, md: 60 },
          borderRadius: '50%',
          background: page.colors.accent,
          opacity: 0.25,
        }}
      />
    </Box>
  </Box>
)

export default CardSlide
