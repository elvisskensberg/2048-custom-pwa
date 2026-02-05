import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material'

interface FeedbackDialogProps {
  open: boolean
  type: 'success' | 'error'
  onClose: () => void
}

export const FeedbackDialog = ({ open, type, onClose }: FeedbackDialogProps) => {
  const isSuccess = type === 'success'

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
        <Typography variant="h4" component="div" sx={{ mb: 1 }}>
          {isSuccess ? '✓' : '✕'}
        </Typography>
        <Typography variant="h6">
          {isSuccess ? 'Success!' : 'Error'}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
        <Typography variant="body1">
          {isSuccess
            ? 'Thank you for your feedback! Your comment has been submitted.'
            : 'Sorry, there was an error submitting your comment. Please try again.'}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            px: 4,
            py: 1,
            textTransform: 'none',
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
