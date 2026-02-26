import { Box } from '@mui/material'
import { MonopolyCard } from './MonopolyCard'
import { type MonopolyCardData } from './cardData'

interface PlayerHandProps {
  cards: MonopolyCardData[]
  size?: number
  onCardClick?: (cardId: string) => void
  selectedCardId?: string | null
  playableCardIds?: string[]
}

/** Horizontal scrollable row of face-up cards in the player's hand. */
export function PlayerHand({
  cards,
  size = 1,
  onCardClick,
  selectedCardId,
  playableCardIds,
}: PlayerHandProps): React.JSX.Element {
  return (
    <Box
      sx={{
        overflowX: 'auto',
        px: 2,
        py: 1,
        '&::-webkit-scrollbar': { display: 'none' },
        scrollbarWidth: 'none',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: 0.8,
          justifyContent: 'center',
          width: 'fit-content',
          minWidth: '100%',
        }}
      >
      {cards.map((card) => {
        const isSelected = selectedCardId === card.id
        const isPlayable = !playableCardIds || playableCardIds.includes(card.id)
        return (
          <Box
            key={card.id}
            onClick={() => onCardClick?.(card.id)}
            sx={{
              cursor: onCardClick ? 'pointer' : 'default',
              transform: isSelected ? `translateY(-${8 * size}px)` : 'none',
              transition: 'transform 0.15s ease, opacity 0.15s ease',
              opacity: isPlayable ? 1 : 0.5,
              outline: isSelected ? `2px solid #1976d2` : 'none',
              borderRadius: `${4 * size}px`,
              '&:hover': onCardClick ? { transform: `translateY(-${4 * size}px)` } : {},
            }}
          >
            <MonopolyCard card={card} size={size} />
          </Box>
        )
      })}
      </Box>
    </Box>
  )
}
