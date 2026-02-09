import { Box, Typography } from '@mui/material'

const PREVIEW_TILES = [2, 4, 32, 4, 0, 2, 2, 256, 0, 0, 2, 8, 0, 0, 0, 4] as const

const GamePreview = (): React.JSX.Element => (
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
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: { xs: '5px', sm: '6px', md: '8px' },
        width: { xs: '180px', sm: '220px', md: '240px' },
        mb: 1,
      }}
    >
      {PREVIEW_TILES.map((value, index) => (
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
            fontSize: {
              xs: value >= 100 ? '0.85rem' : '1rem',
              sm: value >= 100 ? '1rem' : '1.25rem',
              md: value >= 100 ? '1.2rem' : '1.5rem',
            },
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
)

export default GamePreview
