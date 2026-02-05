import { useState } from 'react'
import { Box, Typography, TextField, Stack, Button } from '@mui/material'
import { FeedbackDialog } from './FeedbackDialog'
import { AppVersion } from './AppVersion'

interface LeaveCommentFormProps {
  onClose: () => void
}

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwxSWgM5vM7UkTGshbZzBHMrC_MXQoApLBsvT-1Gu7S168EHkrno8CErULU7HiuSAQ17g/exec"

export const LeaveCommentForm = ({ onClose }: LeaveCommentFormProps) => {
  const [contactInfo, setContactInfo] = useState('')
  const [comment, setComment] = useState('')
  const [feedbackDialog, setFeedbackDialog] = useState<{ open: boolean; type: 'success' | 'error' }>({
    open: false,
    type: 'success',
  })

  const handleSubmit = async () => {
    try {
      // Format the data for Google Apps Script
      const searchParams = new URLSearchParams()
      searchParams.append('contact', contactInfo)
      searchParams.append('comment', comment)
      searchParams.append('timestamp', new Date().toISOString())

      // Submit to Google Apps Script endpoint
      await fetch(SCRIPT_URL, {
        method: 'POST',
        body: searchParams,
        mode: 'no-cors' // Crucial for Google Apps Script redirects
      })

      // Show success dialog
      setFeedbackDialog({ open: true, type: 'success' })

      // Clear form and close
      setContactInfo('')
      setComment('')
      onClose()
    } catch (error) {
      console.error('Submission failed:', error)
      setFeedbackDialog({ open: true, type: 'error' })
    }
  }

  const closeFeedbackDialog = () => {
    setFeedbackDialog({ ...feedbackDialog, open: false })
  }

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: 600,
          px: 2,
          pb: 8,
        }}
      >
        <Box sx={{ maxWidth: 500, width: '100%' }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
            Leave a Comment
          </Typography>
          <Stack spacing={3}>
            <TextField
              label="Contact Info (Email/Name)"
              variant="outlined"
              fullWidth
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="Optional"
            />
            <TextField
              label="Comments"
              variant="outlined"
              fullWidth
              multiline
              rows={6}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts, suggestions, or feedback..."
            />
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="outlined"
                onClick={onClose}
                sx={{
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!comment.trim()}
                sx={{
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                }}
              >
                Submit
              </Button>
            </Stack>
          </Stack>
        </Box>

        <AppVersion />
      </Box>

      <FeedbackDialog
        open={feedbackDialog.open}
        type={feedbackDialog.type}
        onClose={closeFeedbackDialog}
      />
    </>
  )
}
