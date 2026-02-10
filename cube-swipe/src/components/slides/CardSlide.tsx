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
      background: `
        radial-gradient(circle at 15% 25%, ${page.colors.accent}25 0%, transparent 45%),
        radial-gradient(circle at 85% 75%, ${page.colors.primary}20 0%, transparent 45%),
        ${page.colors.secondary}
      `,
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {firstPageContent}

    {/* Liquid gooey particles */}
    <Box
      sx={{
        position: 'absolute',
        top: '30%',
        right: '18%',
        filter: 'contrast(25) blur(8px)',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          width: { xs: 40, sm: 60, md: 80 },
          height: { xs: 40, sm: 60, md: 80 },
          borderRadius: '50%',
          background: `${page.colors.primary}70`,
          animation: 'gooeyDance1 10s ease-in-out infinite',
          '@keyframes gooeyDance1': {
            '0%, 100%': { transform: 'translate(0, 0)' },
            '33%': { transform: 'translate(30px, -25px)' },
            '66%': { transform: 'translate(-20px, 40px)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: { xs: 35, sm: 50, md: 70 },
          height: { xs: 35, sm: 50, md: 70 },
          borderRadius: '50%',
          background: `${page.colors.accent}70`,
          animation: 'gooeyDance2 12s ease-in-out infinite 2s',
          '@keyframes gooeyDance2': {
            '0%, 100%': { transform: 'translate(0, 0)' },
            '50%': { transform: 'translate(-35px, 30px)' },
          },
        }}
      />
    </Box>

    {/* Animated blob shape 1 */}
    <Box
      sx={{
        position: 'absolute',
        top: '8%',
        right: '10%',
        width: { xs: 180, sm: 240, md: 300 },
        height: { xs: 180, sm: 240, md: 300 },
        background: `radial-gradient(circle, ${page.colors.primary}20, transparent 65%)`,
        borderRadius: '45% 55% 60% 40% / 55% 45% 55% 45%',
        filter: 'blur(30px)',
        animation: 'blobMorph 18s ease-in-out infinite',
        zIndex: 0,
        '@keyframes blobMorph': {
          '0%, 100%': { borderRadius: '45% 55% 60% 40% / 55% 45% 55% 45%' },
          '50%': { borderRadius: '60% 40% 45% 55% / 40% 60% 45% 55%' },
        },
      }}
    />

    {/* Animated blob shape 2 */}
    <Box
      sx={{
        position: 'absolute',
        bottom: '5%',
        left: '8%',
        width: { xs: 200, sm: 280, md: 350 },
        height: { xs: 200, sm: 280, md: 350 },
        background: `radial-gradient(circle, ${page.colors.accent}18, transparent 65%)`,
        borderRadius: '50% 50% 30% 70% / 50% 70% 30% 50%',
        filter: 'blur(35px)',
        animation: 'blobMorphReverse 22s ease-in-out infinite',
        zIndex: 0,
        '@keyframes blobMorphReverse': {
          '0%, 100%': { borderRadius: '50% 50% 30% 70% / 50% 70% 30% 50%' },
          '50%': { borderRadius: '30% 70% 50% 50% / 70% 30% 50% 50%' },
        },
      }}
    />

    {/* Geometric circle with 3D gradient border */}
    <Box
      sx={{
        position: 'absolute',
        top: '20%',
        left: '12%',
        width: { xs: 80, sm: 110, md: 140 },
        height: { xs: 80, sm: 110, md: 140 },
        borderRadius: '50%',
        background: `conic-gradient(from 45deg, ${page.colors.primary}40, ${page.colors.accent}40, ${page.colors.primary}40)`,
        opacity: 0.3,
        animation: 'spinSlow3D 30s linear infinite',
        transform: 'perspective(500px)',
        mixBlendMode: 'multiply',
        zIndex: 0,
        '@keyframes spinSlow3D': {
          '0%': { transform: 'perspective(500px) rotateZ(0deg) rotateX(0deg)' },
          '50%': { transform: 'perspective(500px) rotateZ(180deg) rotateX(15deg)' },
          '100%': { transform: 'perspective(500px) rotateZ(360deg) rotateX(0deg)' },
        },
      }}
    />

    {/* Floating particle with trail */}
    <Box
      sx={{
        position: 'absolute',
        top: '55%',
        right: '25%',
        width: { xs: 4, sm: 5, md: 6 },
        height: { xs: 4, sm: 5, md: 6 },
        borderRadius: '50%',
        background: page.colors.primary,
        boxShadow: `
          0 0 8px ${page.colors.primary},
          -15px -15px 8px ${page.colors.primary}70,
          -30px -30px 8px ${page.colors.primary}50,
          -45px -45px 8px ${page.colors.primary}30
        `,
        animation: 'particleRise 10s ease-in-out infinite',
        zIndex: 0,
        '@keyframes particleRise': {
          '0%, 100%': { transform: 'translate(0, 0)', opacity: 0.7 },
          '50%': { transform: 'translate(60px, -90px)', opacity: 0.2 },
        },
      }}
    />

    {/* Decorative pentagon */}
    <Box
      sx={{
        position: 'absolute',
        bottom: '25%',
        right: '15%',
        width: { xs: 70, sm: 95, md: 120 },
        height: { xs: 70, sm: 95, md: 120 },
        background: `${page.colors.accent}30`,
        clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
        animation: 'float 10s ease-in-out infinite',
        zIndex: 0,
        '@keyframes float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-25px) rotate(15deg)' },
        },
      }}
    />

    {/* Decorative squares with enhanced animations */}
    <Box
      sx={{
        position: 'absolute',
        top: '5%',
        left: '5%',
        width: { xs: 60, sm: 80, md: 100 },
        height: { xs: 60, sm: 80, md: 100 },
        background: `linear-gradient(135deg, ${page.colors.accent}25, ${page.colors.primary}15)`,
        opacity: 0.4,
        transform: 'rotate(15deg)',
        animation: 'pulse 5s ease-in-out infinite',
        zIndex: 0,
        '@keyframes pulse': {
          '0%, 100%': { transform: 'rotate(15deg) scale(1)', opacity: 0.4 },
          '50%': { transform: 'rotate(15deg) scale(1.1)', opacity: 0.6 },
        },
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        bottom: '10%',
        right: '8%',
        width: { xs: 70, sm: 100, md: 120 },
        height: { xs: 70, sm: 100, md: 120 },
        background: `linear-gradient(45deg, ${page.colors.primary}20, ${page.colors.accent}15)`,
        opacity: 0.35,
        transform: 'rotate(-20deg)',
        animation: 'pulseReverse 6s ease-in-out infinite',
        zIndex: 0,
        '@keyframes pulseReverse': {
          '0%, 100%': { transform: 'rotate(-20deg) scale(1)', opacity: 0.35 },
          '50%': { transform: 'rotate(-20deg) scale(1.15)', opacity: 0.5 },
        },
      }}
    />

    {/* Small decorative circles with pulse */}
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '8%',
        width: { xs: 30, sm: 40, md: 50 },
        height: { xs: 30, sm: 40, md: 50 },
        borderRadius: '50%',
        background: `${page.colors.primary}35`,
        animation: 'softPulse 4s ease-in-out infinite',
        zIndex: 0,
        '@keyframes softPulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: 0.35 },
          '50%': { transform: 'scale(1.3)', opacity: 0.5 },
        },
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        top: '35%',
        right: '10%',
        width: { xs: 25, sm: 35, md: 45 },
        height: { xs: 25, sm: 35, md: 45 },
        borderRadius: '50%',
        background: `${page.colors.accent}40`,
        animation: 'softPulse 5s ease-in-out infinite 1.5s',
        zIndex: 0,
      }}
    />

    {/* Animated noise texture overlay */}
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.025,
        background: `repeating-radial-gradient(circle at 50% 50%, transparent 0, #000 8px),
                     repeating-linear-gradient(#000, transparent)`,
        backgroundSize: '80px 80px, 80px 80px',
        animation: 'noiseShift 8s steps(10) infinite',
        mixBlendMode: 'overlay',
        pointerEvents: 'none',
        zIndex: 2,
        '@keyframes noiseShift': {
          '0%': { transform: 'translate(0, 0) rotate(0deg)' },
          '25%': { transform: 'translate(-10%, 5%) rotate(90deg)' },
          '50%': { transform: 'translate(5%, -10%) rotate(180deg)' },
          '75%': { transform: 'translate(-5%, 10%) rotate(270deg)' },
          '100%': { transform: 'translate(0, 0) rotate(360deg)' },
        },
      }}
    />

    {/* Main card with glassmorphism and 3D tilt */}
    <Box
      sx={{
        background: `
          linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,1) 100%)
        `,
        backdropFilter: 'blur(15px) saturate(150%)',
        borderRadius: { xs: '20px', sm: '28px', md: '32px' },
        boxShadow: `
          0 20px 60px rgba(0,0,0,0.15),
          0 10px 30px rgba(0,0,0,0.1),
          0 0 0 1px ${page.colors.accent}20,
          inset 0 1px 0 rgba(255,255,255,0.8),
          0 0 60px ${page.colors.primary}15
        `,
        padding: { xs: '30px 20px', sm: '40px 35px', md: '60px 50px' },
        maxWidth: '80%',
        width: '80%',
        borderLeft: `8px solid ${page.colors.accent}`,
        borderImage: `linear-gradient(to bottom, ${page.colors.primary}, ${page.colors.accent}) 1`,
        position: 'relative',
        zIndex: 3,
        transform: 'perspective(1000px) rotateY(2deg)',
        animation: 'cardTilt 20s ease-in-out infinite',
        '@keyframes cardTilt': {
          '0%, 100%': { transform: 'perspective(1000px) rotateY(2deg)' },
          '50%': { transform: 'perspective(1000px) rotateY(-2deg)' },
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${page.colors.accent}80, transparent)`,
          opacity: 0.6,
        },
      }}
    >
      {/* Emoji badge with neon glow */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: -28, sm: -34, md: -40 },
          left: '50%',
          transform: 'translateX(-50%)',
          background: `radial-gradient(circle, ${page.colors.primary}, ${page.colors.primary}DD)`,
          borderRadius: '50%',
          width: { xs: 56, sm: 68, md: 80 },
          height: { xs: 56, sm: 68, md: 80 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `
            0 8px 24px rgba(0,0,0,0.2),
            0 0 20px ${page.colors.primary}80,
            0 0 40px ${page.colors.accent}40,
            inset 0 1px 0 rgba(255,255,255,0.3)
          `,
          border: `2px solid ${page.colors.accent}40`,
          animation: 'badgeGlow 4s ease-in-out infinite',
          '@keyframes badgeGlow': {
            '0%, 100%': {
              boxShadow: `
                0 8px 24px rgba(0,0,0,0.2),
                0 0 20px ${page.colors.primary}80,
                0 0 40px ${page.colors.accent}40,
                inset 0 1px 0 rgba(255,255,255,0.3)
              `,
            },
            '50%': {
              boxShadow: `
                0 8px 24px rgba(0,0,0,0.2),
                0 0 30px ${page.colors.primary},
                0 0 60px ${page.colors.accent}60,
                inset 0 1px 0 rgba(255,255,255,0.3)
              `,
            },
          },
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
