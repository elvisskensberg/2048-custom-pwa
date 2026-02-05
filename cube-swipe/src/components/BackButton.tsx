import { Button } from '@mui/material'

interface BackButtonProps {
  onClick: () => void
}

export const BackButton = ({ onClick }: BackButtonProps) => {
  return (
    <Button
      variant="outlined"
      onClick={onClick}
      sx={{
        position: 'absolute',
        top: 20,
        left: 20,
        textTransform: 'none',
      }}
    >
      ← Back
    </Button>
  )
}
