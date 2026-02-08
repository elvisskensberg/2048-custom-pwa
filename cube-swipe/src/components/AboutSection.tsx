import { useState } from 'react'
import { Box, Typography, IconButton, Stack, type SxProps, type Theme } from '@mui/material'
import ChevronLeft from '@mui/icons-material/ChevronLeft'
import ChevronRight from '@mui/icons-material/ChevronRight'
import { pages, type PageData } from './aboutData'

interface AboutSectionProps {
  onPageChange?: (page: number) => void
}

const NavArrowButton = ({
  direction,
  onClick,
  page,
}: {
  direction: 'prev' | 'next'
  onClick: () => void
  page: PageData
}): React.JSX.Element => {
  const isGradient = page.design === 'gradient'
  const positionSx: SxProps<Theme> =
    direction === 'prev'
      ? { left: { xs: 4, sm: 10, md: 16 } }
      : { right: { xs: 4, sm: 10, md: 16 } }

  return (
    <IconButton
      onClick={onClick}
      sx={{
        position: 'fixed',
        top: '50%',
        transform: 'translateY(-50%)',
        color: isGradient ? '#FFFFFF' : page.colors.primary,
        bgcolor: isGradient ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.95)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        backdropFilter: 'blur(10px)',
        width: { xs: 36, sm: 46, md: 56 },
        height: { xs: 36, sm: 46, md: 56 },
        '&:hover': {
          bgcolor: isGradient ? 'rgba(255,255,255,0.3)' : '#FFFFFF',
          transform: 'translateY(-50%) scale(1.1)',
          boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
        },
        transition: 'all 0.2s ease',
        zIndex: 1100,
        ...positionSx,
      }}
      aria-label={direction === 'prev' ? 'Previous page' : 'Next page'}
    >
      {direction === 'prev' ? (
        <ChevronLeft sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }} />
      ) : (
        <ChevronRight sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }} />
      )}
    </IconButton>
  )
}

export const AboutSection = ({ onPageChange }: AboutSectionProps): React.JSX.Element => {
  const [currentPage, setCurrentPage] = useState(0)

  const handlePrevious = (): void => {
    setCurrentPage((prev) => {
      const newPage = prev > 0 ? prev - 1 : pages.length - 1
      onPageChange?.(newPage)
      return newPage
    })
  }

  const handleNext = (): void => {
    setCurrentPage((prev) => {
      const newPage = prev < pages.length - 1 ? prev + 1 : 0
      onPageChange?.(newPage)
      return newPage
    })
  }

  const page = pages[currentPage]

  const renderGradientDesign = (): React.JSX.Element => (
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
        }}
      />

      {/* Main app title - only on first page */}
      {currentPage === 0 && (
        <Typography
          sx={{
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
            fontWeight: 800,
            color: 'rgba(255,255,255,0.95)',
            textAlign: 'center',
            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
            fontFamily: 'Roboto, sans-serif',
            letterSpacing: '-0.01em',
            mb: { xs: 1, sm: 1.5, md: 2 },
            lineHeight: 1.3,
          }}
        >
          Elvis Skensberg<br />AI Showcase
        </Typography>
      )}

      {/* Game Preview - only on first page */}
      {currentPage === 0 && (
        <Box
          sx={{
            mb: { xs: 1.5, sm: 2, md: 3 },
            background: 'rgba(0,0,0,0.2)',
            borderRadius: { xs: '12px', md: '16px' },
            padding: { xs: '10px', sm: '14px', md: '16px' },
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          {/* Mini game board preview */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: { xs: '5px', sm: '6px', md: '8px' },
              width: { xs: '180px', sm: '220px', md: '240px' },
              mb: 1,
            }}
          >
            {([2, 4, 32, 4, 0, 2, 2, 256, 0, 0, 2, 8, 0, 0, 0, 4] as const).map((value, index) => (
              <Box
                key={index}
                sx={{
                  width: { xs: '38px', sm: '48px', md: '52px' },
                  height: { xs: '38px', sm: '48px', md: '52px' },
                  borderRadius: { xs: '6px', md: '8px' },
                  background: value
                    ? value >= 256
                      ? '#F59E0B'
                      : value >= 32
                        ? '#F97316'
                        : value >= 8
                          ? '#FB923C'
                          : value >= 4
                            ? '#F3E5D5'
                            : '#EEE4DA'
                    : 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: { xs: value >= 100 ? '0.85rem' : '1rem', sm: value >= 100 ? '1rem' : '1.25rem', md: value >= 100 ? '1.2rem' : '1.5rem' },
                  fontWeight: 700,
                  color: value && value >= 8 ? '#FFFFFF' : '#776E65',
                }}
              >
                {value || ''}
              </Box>
            ))}
          </Box>
          <Typography
            sx={{
              fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
              color: 'rgba(255,255,255,0.8)',
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            2048 Game Preview
          </Typography>
        </Box>
      )}

      {/* Emoji */}
      <Typography sx={{ fontSize: { xs: '3rem', sm: '4.5rem', md: '6rem' }, mb: { xs: 1, sm: 1.5, md: 2 } }}>{page.emoji}</Typography>

      {/* Title */}
      <Typography
        sx={{
          fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3.5rem' },
          fontWeight: 900,
          color: '#FFFFFF',
          textAlign: 'center',
          textShadow: '0 4px 12px rgba(0,0,0,0.3)',
          fontFamily: 'Roboto, sans-serif',
          letterSpacing: '-0.02em',
          mb: { xs: 0.5, sm: 0.75, md: 1 },
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
          mb: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {page.subtitle}
      </Typography>

      {/* Content */}
      <Stack spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ maxWidth: { xs: '100%', sm: 600, md: 750 }, px: { xs: 2, sm: 3, md: 4 }, zIndex: 1 }}>
        {page.content.map((text, index) => (
          <Typography
            key={index}
            sx={{
              fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.25rem' },
              fontWeight: 400,
              color: '#FFFFFF',
              textAlign: 'center',
              lineHeight: { xs: 1.6, md: 1.8 },
              textShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            {text}
          </Typography>
        ))}
      </Stack>
    </Box>
  )

  const renderCardDesign = (): React.JSX.Element => (
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
      {/* Main app title - only on first page */}
      {currentPage === 0 && (
        <Typography
          sx={{
            position: 'absolute',
            top: { xs: 16, sm: 24, md: 30 },
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.2rem' },
            fontWeight: 700,
            color: page.colors.primary,
            textAlign: 'center',
            fontFamily: 'Roboto, sans-serif',
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
            zIndex: 10,
            width: { xs: '90%', sm: 'auto' },
          }}
        >
          Elvis Skensberg<br />AI Showcase
        </Typography>
      )}

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
          maxWidth: { xs: '100%', sm: 600, md: 750 },
          width: { xs: '90%', sm: '85%', md: '85%' },
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

  const renderMinimalDesign = (): React.JSX.Element => (
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
      {/* Main app title - only on first page */}
      {currentPage === 0 && (
        <Typography
          sx={{
            position: 'absolute',
            top: { xs: 20, sm: 30, md: 40 },
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: { xs: '1.3rem', sm: '1.7rem', md: '2rem' },
            fontWeight: 700,
            color: page.colors.primary,
            textAlign: 'center',
            fontFamily: 'monospace',
            letterSpacing: '0.02em',
            lineHeight: 1.4,
            zIndex: 10,
            width: { xs: '90%', sm: 'auto' },
          }}
        >
          ELVIS SKENSBERG<br />AI SHOWCASE
        </Typography>
      )}

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
      <Box sx={{ maxWidth: { xs: '100%', sm: 650, md: 800 }, px: { xs: 2, sm: 3, md: 5 }, zIndex: 1 }}>
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

  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
      }}
    >
      {/* Page counter at top left */}
      <Typography
        variant="body2"
        sx={{
          position: 'fixed',
          top: { xs: 12, sm: 14, md: 16 },
          left: { xs: 8, sm: 12, md: 16 },
          color: page.design === 'gradient' ? '#FFFFFF' : page.colors.primary,
          fontSize: { xs: '0.8rem', sm: '0.875rem', md: '0.95rem' },
          zIndex: 1100,
          fontWeight: 700,
          background: page.design === 'gradient' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
          padding: { xs: '3px 8px', sm: '4px 10px', md: '4px 12px' },
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
        }}
      >
        {currentPage + 1} / {pages.length}
      </Typography>

      <NavArrowButton direction="prev" onClick={handlePrevious} page={page} />
      <NavArrowButton direction="next" onClick={handleNext} page={page} />

      {/* Render appropriate design */}
      {page.design === 'gradient' && renderGradientDesign()}
      {page.design === 'card' && renderCardDesign()}
      {page.design === 'minimal' && renderMinimalDesign()}
    </Box>
  )
}
