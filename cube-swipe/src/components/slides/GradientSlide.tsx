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
      background: `
        radial-gradient(circle at 20% 30%, ${page.colors.accent}40 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, ${page.colors.primary}30 0%, transparent 50%),
        linear-gradient(135deg, ${page.colors.primary} 0%, ${page.colors.secondary} 100%)
      `,
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 50% 50%, ${page.colors.accent}15 0%, transparent 70%),
          radial-gradient(circle at 20% 80%, ${page.colors.primary}10 0%, transparent 60%)
        `,
        animation: 'particleFloat 30s ease-in-out infinite',
        pointerEvents: 'none',
        '@keyframes particleFloat': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -20px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 30px) scale(0.9)' },
        },
      },
    }}
  >
    {/* Gooey liquid effect container */}
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        filter: 'contrast(20) blur(10px)',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      {/* Liquid particle 1 */}
      <Box
        sx={{
          position: 'absolute',
          top: '15%',
          left: '10%',
          width: { xs: 60, sm: 90, md: 120 },
          height: { xs: 60, sm: 90, md: 120 },
          borderRadius: '50%',
          background: `${page.colors.accent}60`,
          animation: 'liquidFloat1 12s ease-in-out infinite',
          '@keyframes liquidFloat1': {
            '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
            '25%': { transform: 'translate(50px, -30px) scale(1.3)' },
            '50%': { transform: 'translate(100px, 20px) scale(0.8)' },
            '75%': { transform: 'translate(30px, 40px) scale(1.1)' },
          },
        }}
      />
      {/* Liquid particle 2 */}
      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          left: '15%',
          width: { xs: 50, sm: 75, md: 100 },
          height: { xs: 50, sm: 75, md: 100 },
          borderRadius: '50%',
          background: `${page.colors.primary}60`,
          animation: 'liquidFloat2 15s ease-in-out infinite 3s',
          '@keyframes liquidFloat2': {
            '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
            '33%': { transform: 'translate(-40px, 50px) scale(1.2)' },
            '66%': { transform: 'translate(60px, -20px) scale(0.9)' },
          },
        }}
      />
      {/* Liquid particle 3 */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '25%',
          right: '20%',
          width: { xs: 70, sm: 100, md: 130 },
          height: { xs: 70, sm: 100, md: 130 },
          borderRadius: '50%',
          background: `${page.colors.accent}60`,
          animation: 'liquidFloat3 18s ease-in-out infinite 6s',
          '@keyframes liquidFloat3': {
            '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
            '40%': { transform: 'translate(-70px, -40px) scale(1.4)' },
            '80%': { transform: 'translate(40px, 60px) scale(0.7)' },
          },
        }}
      />
    </Box>

    {/* Animated blob shape 1 */}
    <Box
      sx={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: { xs: 200, sm: 300, md: 400 },
        height: { xs: 200, sm: 300, md: 400 },
        background: `radial-gradient(circle, ${page.colors.accent}20, transparent 70%)`,
        borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
        filter: 'blur(40px)',
        animation: 'morph 20s ease-in-out infinite',
        mixBlendMode: 'overlay',
        zIndex: 0,
        '@keyframes morph': {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
      }}
    />

    {/* Animated blob shape 2 with 3D effect */}
    <Box
      sx={{
        position: 'absolute',
        bottom: '-15%',
        left: '-10%',
        width: { xs: 250, sm: 350, md: 450 },
        height: { xs: 250, sm: 350, md: 450 },
        background: `radial-gradient(circle, ${page.colors.primary}15, transparent 70%)`,
        borderRadius: '40% 60% 60% 40% / 70% 30% 70% 30%',
        filter: 'blur(50px)',
        animation: 'morphReverse3D 15s ease-in-out infinite',
        mixBlendMode: 'soft-light',
        transform: 'perspective(800px) rotateX(10deg)',
        zIndex: 0,
        '@keyframes morphReverse3D': {
          '0%, 100%': {
            borderRadius: '40% 60% 60% 40% / 70% 30% 70% 30%',
            transform: 'perspective(800px) rotateX(10deg) rotateY(0deg)',
          },
          '50%': {
            borderRadius: '60% 40% 30% 70% / 40% 60% 50% 50%',
            transform: 'perspective(800px) rotateX(10deg) rotateY(5deg)',
          },
        },
      }}
    />

    {/* Geometric triangle */}
    <Box
      sx={{
        position: 'absolute',
        top: '15%',
        left: '8%',
        width: 0,
        height: 0,
        borderLeft: { xs: '30px solid transparent', sm: '45px solid transparent', md: '60px solid transparent' },
        borderRight: { xs: '30px solid transparent', sm: '45px solid transparent', md: '60px solid transparent' },
        borderBottom: { xs: `60px solid ${page.colors.accent}30`, sm: `90px solid ${page.colors.accent}30`, md: `120px solid ${page.colors.accent}30` },
        opacity: 0.4,
        animation: 'float 8s ease-in-out infinite',
        zIndex: 0,
        '@keyframes float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(10deg)' },
        },
      }}
    />

    {/* Geometric polygon - hexagon with 3D effect */}
    <Box
      sx={{
        position: 'absolute',
        bottom: '20%',
        right: '12%',
        width: { xs: 60, sm: 90, md: 120 },
        height: { xs: 60, sm: 90, md: 120 },
        background: `conic-gradient(from 0deg at 50% 50%, ${page.colors.accent}40, ${page.colors.primary}40, ${page.colors.accent}40)`,
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        animation: 'spin3D 25s linear infinite',
        transform: 'perspective(600px)',
        zIndex: 0,
        '@keyframes spin3D': {
          '0%': { transform: 'perspective(600px) rotateZ(0deg) rotateY(0deg)' },
          '50%': { transform: 'perspective(600px) rotateZ(180deg) rotateY(180deg)' },
          '100%': { transform: 'perspective(600px) rotateZ(360deg) rotateY(360deg)' },
        },
      }}
    />

    {/* Particle trail effect */}
    <Box
      sx={{
        position: 'absolute',
        top: '40%',
        right: '5%',
        width: { xs: 3, sm: 4, md: 5 },
        height: { xs: 3, sm: 4, md: 5 },
        borderRadius: '50%',
        background: page.colors.accent,
        boxShadow: `
          0 0 10px ${page.colors.accent},
          20px 20px 10px ${page.colors.accent}80,
          40px 40px 10px ${page.colors.accent}60,
          60px 60px 10px ${page.colors.accent}40,
          80px 80px 10px ${page.colors.accent}20
        `,
        animation: 'particleTrail 8s ease-in-out infinite',
        zIndex: 0,
        '@keyframes particleTrail': {
          '0%, 100%': { transform: 'translate(0, 0)', opacity: 0.8 },
          '50%': { transform: 'translate(-100px, 80px)', opacity: 0.3 },
        },
      }}
    />

    {/* Small decorative circles with pulse */}
    <Box
      sx={{
        position: 'absolute',
        top: '45%',
        left: '5%',
        width: { xs: 25, sm: 35, md: 45 },
        height: { xs: 25, sm: 35, md: 45 },
        borderRadius: '50%',
        background: `${page.colors.accent}40`,
        animation: 'pulse 3s ease-in-out infinite',
        zIndex: 0,
        '@keyframes pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: 0.4 },
          '50%': { transform: 'scale(1.2)', opacity: 0.6 },
        },
      }}
    />

    <Box
      sx={{
        position: 'absolute',
        top: '65%',
        right: '8%',
        width: { xs: 20, sm: 28, md: 36 },
        height: { xs: 20, sm: 28, md: 36 },
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.3)',
        animation: 'pulse 4s ease-in-out infinite 1s',
        zIndex: 0,
      }}
    />

    {/* Gradient mesh overlay circles */}
    <Box
      sx={{
        position: 'absolute',
        top: '30%',
        right: '25%',
        width: { xs: 150, sm: 200, md: 250 },
        height: { xs: 150, sm: 200, md: 250 },
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
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
        opacity: 0.03,
        background: `repeating-radial-gradient(circle at 0 0, transparent 0, #000 10px),
                     repeating-linear-gradient(#000, transparent)`,
        backgroundSize: '100px 100px, 100px 100px',
        animation: 'noiseMove 8s steps(10) infinite',
        mixBlendMode: 'overlay',
        pointerEvents: 'none',
        zIndex: 2,
        '@keyframes noiseMove': {
          '0%': { transform: 'translate(0, 0)' },
          '10%': { transform: 'translate(-5%, -10%)' },
          '20%': { transform: 'translate(-15%, 5%)' },
          '30%': { transform: 'translate(7%, -25%)' },
          '40%': { transform: 'translate(-5%, 25%)' },
          '50%': { transform: 'translate(-15%, 10%)' },
          '60%': { transform: 'translate(15%, 0%)' },
          '70%': { transform: 'translate(0%, 15%)' },
          '80%': { transform: 'translate(3%, 25%)' },
          '90%': { transform: 'translate(-10%, 10%)' },
          '100%': { transform: 'translate(0, 0)' },
        },
      }}
    />

    <Box sx={{ zIndex: 3, position: 'relative' }}>{firstPageContent}</Box>

    {/* Emoji with neon glow effect */}
    <Typography
      sx={{
        fontSize: { xs: '3rem', sm: '4.5rem', md: '6rem' },
        mb: { xs: 1, sm: 1.5, md: 2 },
        zIndex: 3,
        position: 'relative',
        filter: `
          drop-shadow(0 0 10px ${page.colors.accent})
          drop-shadow(0 0 20px ${page.colors.accent}80)
          drop-shadow(0 0 30px ${page.colors.primary}60)
        `,
        animation: 'neonPulse 3s ease-in-out infinite',
        '@keyframes neonPulse': {
          '0%, 100%': {
            filter: `
              drop-shadow(0 0 10px ${page.colors.accent})
              drop-shadow(0 0 20px ${page.colors.accent}80)
              drop-shadow(0 0 30px ${page.colors.primary}60)
            `,
          },
          '50%': {
            filter: `
              drop-shadow(0 0 15px ${page.colors.accent})
              drop-shadow(0 0 30px ${page.colors.accent})
              drop-shadow(0 0 45px ${page.colors.primary}80)
            `,
          },
        },
      }}
    >
      {page.emoji}
    </Typography>

    {/* Glassmorphism overlay container */}
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '85%',
        maxWidth: '900px',
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: { xs: '16px', sm: '20px', md: '24px' },
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.2),
          0 0 40px ${page.colors.accent}20
        `,
        padding: { xs: 3, sm: 4, md: 5 },
        zIndex: 2,
        pointerEvents: 'none',
      }}
    />

    {/* Title with neon glow */}
    <Typography
      sx={{
        fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3.5rem' },
        fontWeight: 900,
        color: '#FFFFFF',
        textAlign: 'center',
        textShadow: `
          0 0 10px ${page.colors.accent},
          0 0 20px ${page.colors.accent}80,
          0 0 30px ${page.colors.primary}60,
          0 2px 4px rgba(0,0,0,0.4),
          0 4px 12px rgba(0,0,0,0.5)
        `,
        fontFamily: 'Roboto, sans-serif',
        letterSpacing: '-0.02em',
        mb: { xs: 0.5, sm: 0.75, md: 1 },
        zIndex: 3,
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
