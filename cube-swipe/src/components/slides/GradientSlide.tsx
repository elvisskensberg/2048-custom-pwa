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
    }}
  >
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
        zIndex: 0,
        '@keyframes morph': {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
      }}
    />

    {/* Animated blob shape 2 */}
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
        animation: 'morphReverse 15s ease-in-out infinite',
        zIndex: 0,
        '@keyframes morphReverse': {
          '0%, 100%': { borderRadius: '40% 60% 60% 40% / 70% 30% 70% 30%' },
          '50%': { borderRadius: '60% 40% 30% 70% / 40% 60% 50% 50%' },
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

    {/* Geometric polygon - hexagon */}
    <Box
      sx={{
        position: 'absolute',
        bottom: '20%',
        right: '12%',
        width: { xs: 60, sm: 90, md: 120 },
        height: { xs: 60, sm: 90, md: 120 },
        background: `${page.colors.accent}25`,
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        animation: 'spin 25s linear infinite',
        zIndex: 0,
        '@keyframes spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
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

    <Box sx={{ zIndex: 1, position: 'relative' }}>{firstPageContent}</Box>

    {/* Emoji with glow effect */}
    <Typography
      sx={{
        fontSize: { xs: '3rem', sm: '4.5rem', md: '6rem' },
        mb: { xs: 1, sm: 1.5, md: 2 },
        zIndex: 1,
        position: 'relative',
        filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))',
      }}
    >
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
