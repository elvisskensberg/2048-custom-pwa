import { Box } from '@mui/material'
import { MonopolyCard } from './MonopolyCard'
import { type MonopolyCardData } from './cardData'

interface PropertyStackProps {
  /** Property cards in this stack (bottom to top) */
  cards: MonopolyCardData[]
  /** Optional building cards on top (House, Hotel) */
  buildings?: MonopolyCardData[]
  size?: number
  onCardClick?: (cardId: string) => void
  highlightedCardIds?: string[]
}

/** Vertical stack of property cards with optional house/hotel on top. */
export function PropertyStack({
  cards,
  buildings = [],
  size = 1,
  onCardClick,
  highlightedCardIds,
}: PropertyStackProps): React.JSX.Element {
  const all = [...cards, ...buildings]
  const OFFSET = 18 * size

  return (
    <Box
      sx={{
        position: 'relative',
        width: 70 * size,
        height: 100 * size + (all.length - 1) * OFFSET,
        flexShrink: 0,
      }}
    >
      {all.map((card, i) => {
        const isHighlighted = highlightedCardIds?.includes(card.id)
        return (
          <Box
            key={card.id}
            onClick={() => onCardClick?.(card.id)}
            sx={{
              position: 'absolute',
              top: i * OFFSET,
              left: 0,
              zIndex: i,
              cursor: onCardClick ? 'pointer' : 'default',
              outline: isHighlighted ? '2px solid #f44336' : 'none',
              borderRadius: `${4 * size}px`,
              transition: 'outline 0.15s ease',
            }}
          >
            <MonopolyCard card={card} size={size} />
          </Box>
        )
      })}
    </Box>
  )
}
