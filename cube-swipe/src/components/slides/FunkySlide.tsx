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
      background: `
        radial-gradient(circle at 25% 15%, ${page.colors.accent}35 0%, transparent 40%),
        radial-gradient(circle at 75% 85%, ${page.colors.primary}25 0%, transparent 45%),
        radial-gradient(circle at 30% 20%, ${page.colors.primary} 0%, ${page.colors.secondary} 50%, ${page.colors.accent} 100%)
      `,
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    {firstPageContent}

    {/* Animated film grain texture */}
    <Box
      sx={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        right: '-10%',
        bottom: '-10%',
        opacity: 0.04,
        background: `
          repeating-radial-gradient(circle at 30% 20%, transparent 0, #000 5px),
          repeating-linear-gradient(45deg, #000 0px, transparent 1px, transparent 3px)
        `,
        backgroundSize: '60px 60px, 40px 40px',
        animation: 'filmGrain 0.2s steps(10) infinite',
        mixBlendMode: 'overlay',
        pointerEvents: 'none',
        zIndex: 1,
        '@keyframes filmGrain': {
          '0%': { transform: 'translate(0%, 0%)' },
          '10%': { transform: 'translate(-5%, -10%)' },
          '20%': { transform: 'translate(-10%, 5%)' },
          '30%': { transform: 'translate(5%, -5%)' },
          '40%': { transform: 'translate(-10%, 10%)' },
          '50%': { transform: 'translate(10%, 0%)' },
          '60%': { transform: 'translate(0%, 10%)' },
          '70%': { transform: 'translate(-10%, -5%)' },
          '80%': { transform: 'translate(10%, 5%)' },
          '90%': { transform: 'translate(5%, -10%)' },
          '100%': { transform: 'translate(0%, 0%)' },
        },
      }}
    />

    {/* Liquid fusion particles with gooey effect */}
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        filter: 'contrast(30) blur(12px)',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          width: { xs: 50, sm: 70, md: 90 },
          height: { xs: 50, sm: 70, md: 90 },
          borderRadius: '50%',
          background: `${page.colors.accent}80`,
          animation: 'liquidMerge1 14s ease-in-out infinite',
          '@keyframes liquidMerge1': {
            '0%, 100%': { transform: 'translate(-50px, -50px) scale(1)' },
            '25%': { transform: 'translate(40px, -60px) scale(1.5)' },
            '50%': { transform: 'translate(80px, 30px) scale(0.8)' },
            '75%': { transform: 'translate(-30px, 50px) scale(1.2)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: { xs: 45, sm: 65, md: 85 },
          height: { xs: 45, sm: 65, md: 85 },
          borderRadius: '50%',
          background: `${page.colors.primary}80`,
          animation: 'liquidMerge2 16s ease-in-out infinite 3s',
          '@keyframes liquidMerge2': {
            '0%, 100%': { transform: 'translate(30px, -40px) scale(1)' },
            '33%': { transform: 'translate(-50px, 50px) scale(1.3)' },
            '66%': { transform: 'translate(70px, -30px) scale(0.9)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: { xs: 40, sm: 60, md: 80 },
          height: { xs: 40, sm: 60, md: 80 },
          borderRadius: '50%',
          background: `${page.colors.accent}80`,
          animation: 'liquidMerge3 18s ease-in-out infinite 6s',
          '@keyframes liquidMerge3': {
            '0%, 100%': { transform: 'translate(-40px, 40px) scale(1)' },
            '50%': { transform: 'translate(60px, -70px) scale(1.4)' },
          },
        }}
      />
    </Box>

    {/* Large animated blob background */}
    <Box
      sx={{
        position: 'absolute',
        top: '-5%',
        left: '5%',
        width: { xs: 220, sm: 320, md: 420 },
        height: { xs: 220, sm: 320, md: 420 },
        background: `radial-gradient(circle, ${page.colors.accent}15, transparent 70%)`,
        borderRadius: '55% 45% 65% 35% / 60% 40% 60% 40%',
        filter: 'blur(45px)',
        animation: 'megaMorph 25s ease-in-out infinite',
        zIndex: 0,
        '@keyframes megaMorph': {
          '0%, 100%': {
            borderRadius: '55% 45% 65% 35% / 60% 40% 60% 40%',
            transform: 'translate(0, 0) scale(1)',
          },
          '33%': {
            borderRadius: '45% 55% 40% 60% / 50% 60% 40% 60%',
            transform: 'translate(20px, 15px) scale(1.05)',
          },
          '66%': {
            borderRadius: '65% 35% 55% 45% / 55% 45% 65% 35%',
            transform: 'translate(-15px, 20px) scale(0.98)',
          },
        },
      }}
    />

    {/* Funky decorative shapes */}
    {/* 3D Rotating triangle */}
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
        opacity: 0.25,
        animation: 'spin3DTriangle 20s linear infinite',
        transformStyle: 'preserve-3d',
        '@keyframes spin3DTriangle': {
          '0%': { transform: 'perspective(800px) rotateZ(25deg) rotateY(0deg)' },
          '50%': { transform: 'perspective(800px) rotateZ(205deg) rotateY(180deg)' },
          '100%': { transform: 'perspective(800px) rotateZ(385deg) rotateY(360deg)' },
        },
      }}
    />

    {/* Particle constellation */}
    <Box
      sx={{
        position: 'absolute',
        top: '35%',
        left: '8%',
        width: { xs: 3, sm: 4, md: 5 },
        height: { xs: 3, sm: 4, md: 5 },
        borderRadius: '50%',
        background: page.colors.accent,
        boxShadow: `
          0 0 10px ${page.colors.accent},
          25px 15px 8px ${page.colors.accent}80,
          50px 30px 6px ${page.colors.accent}60,
          75px 45px 4px ${page.colors.accent}40,
          100px 60px 2px ${page.colors.accent}20
        `,
        animation: 'constellation 12s ease-in-out infinite',
        zIndex: 0,
        '@keyframes constellation': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)', opacity: 0.8 },
          '50%': { transform: 'translate(80px, -60px) scale(1.5)', opacity: 0.4 },
        },
      }}
    />

    {/* Wavy circle with enhanced effects */}
    <Box
      sx={{
        position: 'absolute',
        bottom: '10%',
        left: '8%',
        width: { xs: 100, sm: 140, md: 180 },
        height: { xs: 100, sm: 140, md: 180 },
        borderRadius: '50% 40% 60% 50%',
        background: `
          radial-gradient(circle, rgba(255,255,255,0.25), rgba(255,255,255,0.05) 70%),
          linear-gradient(135deg, ${page.colors.primary}20, ${page.colors.accent}20)
        `,
        backdropFilter: 'blur(20px)',
        boxShadow: `0 8px 32px ${page.colors.primary}30`,
        animation: 'morph 8s ease-in-out infinite',
        '@keyframes morph': {
          '0%, 100%': { borderRadius: '50% 40% 60% 50%', transform: 'rotate(0deg)' },
          '50%': { borderRadius: '40% 60% 50% 60%', transform: 'rotate(10deg)' },
        },
      }}
    />

    {/* Star shape using clip-path */}
    <Box
      sx={{
        position: 'absolute',
        top: '18%',
        left: '15%',
        width: { xs: 50, sm: 70, md: 90 },
        height: { xs: 50, sm: 70, md: 90 },
        background: `linear-gradient(45deg, ${page.colors.accent}, ${page.colors.primary})`,
        clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
        opacity: 0.25,
        animation: 'twinkle 3s ease-in-out infinite',
        '@keyframes twinkle': {
          '0%, 100%': { opacity: 0.25, transform: 'scale(1)' },
          '50%': { opacity: 0.4, transform: 'scale(1.1)' },
        },
      }}
    />

    {/* Zigzag lines with animation */}
    <Box
      sx={{
        position: 'absolute',
        top: '45%',
        left: '5%',
        width: { xs: 60, sm: 90, md: 120 },
        height: { xs: 8, sm: 12, md: 16 },
        background: `repeating-linear-gradient(90deg, ${page.colors.primary}, ${page.colors.primary} 10px, transparent 10px, transparent 20px)`,
        opacity: 0.3,
        transform: 'rotate(-15deg)',
        animation: 'slideRight 15s linear infinite',
        '@keyframes slideRight': {
          '0%': { transform: 'translateX(-20px) rotate(-15deg)' },
          '100%': { transform: 'translateX(20px) rotate(-15deg)' },
        },
      }}
    />

    {/* 3D Hexagon shape with depth */}
    <Box
      sx={{
        position: 'absolute',
        bottom: '40%',
        right: '8%',
        width: { xs: 60, sm: 85, md: 110 },
        height: { xs: 60, sm: 85, md: 110 },
        background: `
          conic-gradient(from 60deg, ${page.colors.accent}35, ${page.colors.primary}35, ${page.colors.accent}35),
          radial-gradient(circle, rgba(255,255,255,0.2), transparent 70%)
        `,
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        animation: 'hexagon3DFlip 35s ease-in-out infinite',
        transformStyle: 'preserve-3d',
        boxShadow: `0 10px 30px ${page.colors.primary}30`,
        '@keyframes hexagon3DFlip': {
          '0%, 100%': { transform: 'perspective(800px) rotateZ(0deg) rotateX(0deg)' },
          '25%': { transform: 'perspective(800px) rotateZ(90deg) rotateX(30deg)' },
          '50%': { transform: 'perspective(800px) rotateZ(180deg) rotateX(0deg)' },
          '75%': { transform: 'perspective(800px) rotateZ(270deg) rotateX(-30deg)' },
        },
      }}
    />

    {/* Scattered dots with pulse animation */}
    <Box
      sx={{
        position: 'absolute',
        top: '25%',
        right: '25%',
        width: { xs: 20, sm: 30, md: 40 },
        height: { xs: 20, sm: 30, md: 40 },
        borderRadius: '50%',
        background: `radial-gradient(circle, ${page.colors.accent}, ${page.colors.accent}80)`,
        opacity: 0.35,
        animation: 'bounce 4s ease-in-out infinite',
        '@keyframes bounce': {
          '0%, 100%': { transform: 'translateY(0px) scale(1)', opacity: 0.35 },
          '50%': { transform: 'translateY(-15px) scale(1.2)', opacity: 0.5 },
        },
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
        background: 'radial-gradient(circle, rgba(255,255,255,0.6), rgba(255,255,255,0.3))',
        opacity: 0.6,
        animation: 'bounce 5s ease-in-out infinite 1.5s',
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        top: '60%',
        left: '20%',
        width: { xs: 18, sm: 26, md: 35 },
        height: { xs: 18, sm: 26, md: 35 },
        borderRadius: '50%',
        background: `radial-gradient(circle, ${page.colors.primary}50, ${page.colors.primary}20)`,
        animation: 'bounce 4.5s ease-in-out infinite 0.8s',
      }}
    />

    {/* Content container with glassmorphism and 3D card */}
    <Box
      sx={{
        background: `
          linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.88) 100%),
          radial-gradient(circle at 20% 30%, ${page.colors.accent}08, transparent 70%)
        `,
        backdropFilter: 'blur(25px) saturate(180%)',
        borderRadius: { xs: '24px', sm: '32px', md: '40px' },
        padding: { xs: '32px 24px', sm: '48px 40px', md: '64px 56px' },
        maxWidth: '80%',
        boxShadow: `
          0 30px 80px rgba(0,0,0,0.2),
          0 10px 30px rgba(0,0,0,0.1),
          0 0 0 1px ${page.colors.accent}30,
          inset 0 1px 0 rgba(255,255,255,0.8),
          inset 0 -1px 0 ${page.colors.primary}10,
          0 0 80px ${page.colors.primary}20
        `,
        border: `4px solid transparent`,
        borderImage: `linear-gradient(135deg, ${page.colors.primary}, ${page.colors.accent}, ${page.colors.primary}) 1`,
        animation: 'funkyCardTilt 18s ease-in-out infinite',
        position: 'relative',
        zIndex: 2,
        transformStyle: 'preserve-3d',
        '@keyframes funkyCardTilt': {
          '0%, 100%': { transform: 'perspective(1200px) rotateZ(-1deg) rotateY(3deg)' },
          '50%': { transform: 'perspective(1200px) rotateZ(1deg) rotateY(-3deg)' },
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -6,
          left: -6,
          right: -6,
          bottom: -6,
          background: `
            conic-gradient(from 45deg at 50% 50%, ${page.colors.primary}50, ${page.colors.accent}50, ${page.colors.primary}50),
            linear-gradient(135deg, ${page.colors.primary}40, ${page.colors.accent}40)
          `,
          borderRadius: { xs: '26px', sm: '34px', md: '42px' },
          zIndex: -1,
          filter: 'blur(10px)',
          opacity: 0.7,
          animation: 'neonGlowPulse 6s ease-in-out infinite',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: { xs: '24px', sm: '32px', md: '40px' },
          border: `1px solid rgba(255, 255, 255, 0.2)`,
          pointerEvents: 'none',
        },
        '@keyframes neonGlowPulse': {
          '0%, 100%': {
            opacity: 0.7,
            filter: `blur(10px) hue-rotate(0deg)`,
          },
          '50%': {
            opacity: 0.9,
            filter: `blur(15px) hue-rotate(20deg)`,
          },
        },
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
