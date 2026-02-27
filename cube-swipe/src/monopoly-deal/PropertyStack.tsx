import { Box, Typography } from '@mui/material'
import { MonopolyCard } from './MonopolyCard'
import { type MonopolyCardData, type PropertyColor, COLOR_HEX, COLOR_LABEL } from './cardData'

interface PropertyStackProps {
  /** Property cards in this stack (bottom to top) */
  cards: MonopolyCardData[]
  /** Optional building cards on top (House, Hotel) */
  buildings?: MonopolyCardData[]
  /** Color of the group (for wild card rotation) */
  groupColor?: PropertyColor
  size?: number
  onCardClick?: (cardId: string) => void
  highlightedCardIds?: string[]
}

/** Vertical stack of property cards with optional house/hotel on top. */
export function PropertyStack({
  cards,
  buildings = [],
  groupColor,
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
        const isRainbowWild = card.type === 'wild' && !card.color && groupColor
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
            <MonopolyCard card={card} size={size} groupColor={groupColor} />
            {isRainbowWild && (
              <Typography
                sx={{
                  position: 'absolute',
                  bottom: `${2 * size}px`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bgcolor: COLOR_HEX[groupColor!],
                  color: '#fff',
                  fontSize: 5 * size,
                  fontWeight: 800,
                  px: `${3 * size}px`,
                  py: `${1 * size}px`,
                  borderRadius: `${2 * size}px`,
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  zIndex: 1,
                }}
              >
                {COLOR_LABEL[groupColor!]}
              </Typography>
            )}
          </Box>
        )
      })}
    </Box>
  )
}
