import { Typography } from '@mui/material'

export const AppVersion = () => {
  return (
    <Typography
      variant="caption"
      sx={{
        mt: 'auto',
        pt: 4,
        color: 'text.disabled',
        fontSize: '0.75rem',
      }}
    >
      v0.15
    </Typography>
  )
}
