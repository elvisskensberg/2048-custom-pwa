import { Box, Typography, Stack } from '@mui/material'
import type { PageData } from '../aboutData'

export interface FunkySlideProps {
  page: PageData
  firstPageContent?: React.ReactNode
}

const FunkySlide = ({ page, firstPageContent }: FunkySlideProps): React.JSX.Element => (
  <Box
    sx={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: `radial-gradient(circle at 30% 20%, ${page.colors.primary} 0%, ${page.colors.secondary} 50%, ${page.colors.accent} 100%)`,
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {firstPageContent}

    {/* Funky decorative shapes */}
    {/* Rotating triangle */}
    <Box
      sx={{
        position: 'absolute',
        top: '8%',
        right: '12%',
        width: 0,
        height: 0,
        borderLeft: { xs: '40px solid transparent', sm: '60px solid transparent', md: '80px solid transparent' },
        borderRight: { xs: '40px solid transparent', sm: '60px solid transparent', md: '80px solid transparent' },
        borderBottom: { xs: `80px solid ${page.colors.accent}`, sm: `120px solid ${page.colors.accent}`, md: `160px solid ${page.colors.accent}` },
        opacity: 0.2,
        transform: 'rotate(25deg)',
        animation: 'spin 20s linear infinite',
        '@keyframes spin': {
          '0%': { transform: 'rotate(25deg)' },
          '100%': { transform: 'rotate(385deg)' },
        },
      }}
    />

    {/* Wavy circle */}
    <Box
      sx={{
        position: 'absolute',
        bottom: '10%',
        left: '8%',
        width: { xs: 100, sm: 140, md: 180 },
        height: { xs: 100, sm: 140, md: 180 },
        borderRadius: '50% 40% 60% 50%',
        background: `rgba(255,255,255,0.15)`,
        backdropFilter: 'blur(20px)',
        animation: 'morph 8s ease-in-out infinite',
        '@keyframes morph': {
          '0%, 100%': { borderRadius: '50% 40% 60% 50%' },
          '50%': { borderRadius: '40% 60% 50% 60%' },
        },
      }}
    />

    {/* Zigzag lines */}
    <Box
      sx={{
        position: 'absolute',
        top: '45%',
        left: '5%',
        width: { xs: 60, sm: 90, md: 120 },
        height: { xs: 8, sm: 12, md: 16 },
        background: `repeating-linear-gradient(90deg, ${page.colors.primary}, ${page.colors.primary} 10px, transparent 10px, transparent 20px)`,
        opacity: 0.25,
        transform: 'rotate(-15deg)',
      }}
    />

    {/* Scattered dots */}
    <Box
      sx={{
        position: 'absolute',
        top: '25%',
        right: '25%',
        width: { xs: 20, sm: 30, md: 40 },
        height: { xs: 20, sm: 30, md: 40 },
        borderRadius: '50%',
        background: page.colors.accent,
        opacity: 0.3,
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        bottom: '35%',
        right: '15%',
        width: { xs: 15, sm: 22, md: 30 },
        height: { xs: 15, sm: 22, md: 30 },
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.4)',
        opacity: 0.6,
      }}
    />

    {/* Content container with playful card */}
    <Box
      sx={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: { xs: '24px', sm: '32px', md: '40px' },
        padding: { xs: '32px 24px', sm: '48px 40px', md: '64px 56px' },
        maxWidth: '80%',
        boxShadow: '0 30px 80px rgba(0,0,0,0.2), 0 10px 30px rgba(0,0,0,0.1)',
        border: `4px solid ${page.colors.accent}`,
        transform: 'rotate(-1deg)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Starburst emoji background */}
      <Typography
        sx={{
          fontSize: { xs: '4rem', sm: '6rem', md: '8rem' },
          position: 'absolute',
          top: { xs: -40, sm: -60, md: -80 },
          right: { xs: -20, sm: -30, md: -40 },
          opacity: 0.15,
          transform: 'rotate(15deg)',
        }}
      >
        ✨
      </Typography>

      {/* LinkedIn-style profile photo (if provided) */}
      {page.image ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Box
            component="img"
            src={page.image}
            alt="Profile"
            sx={{
              width: { xs: 100, sm: 140, md: 180 },
              height: { xs: 100, sm: 140, md: 180 },
              borderRadius: '50%',
              border: `6px solid ${page.colors.accent}`,
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              objectFit: 'cover',
            }}
          />
        </Box>
      ) : (
        /* Main emoji (if no image) */
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Typography sx={{ fontSize: { xs: '3.5rem', sm: '5rem', md: '7rem' } }}>{page.emoji}</Typography>
        </Box>
      )}

      {/* Title */}
      <Typography
        sx={{
          fontSize: { xs: '2rem', sm: '3rem', md: '4rem' },
          fontWeight: 900,
          color: page.colors.primary,
          textAlign: 'center',
          fontFamily: 'Comic Sans MS, cursive, sans-serif',
          letterSpacing: '0.02em',
          mb: { xs: 1, sm: 1.5, md: 2 },
          textShadow: `3px 3px 0px ${page.colors.accent}`,
        }}
      >
        {page.title}
      </Typography>

      {/* Subtitle */}
      <Typography
        sx={{
          fontSize: { xs: '1.1rem', sm: '1.4rem', md: '1.7rem' },
          fontWeight: 600,
          color: page.colors.accent,
          textAlign: 'center',
          mb: { xs: 3, sm: 4, md: 5 },
          fontStyle: 'italic',
        }}
      >
        {page.subtitle}
      </Typography>

      {/* Content */}
      <Stack spacing={{ xs: 2, sm: 3, md: 4 }}>
        {page.content.map((text, index) => (
          <Typography
            key={index}
            sx={{
              fontSize: { xs: '1rem', sm: '1.2rem', md: '1.4rem' },
              fontWeight: 500,
              color: '#2C3E50',
              textAlign: 'center',
              lineHeight: { xs: 1.7, md: 1.9 },
            }}
          >
            {text}
          </Typography>
        ))}
      </Stack>
    </Box>
  </Box>
)

export default FunkySlide
