import { Box } from '@mui/material'
import { MonopolyCard } from './MonopolyCard'
import { PropertyStack } from './PropertyStack'
import { type MonopolyCardData } from './cardData'
import type { PropertyColor } from './cardData'

export interface PropertyGroup {
  cards: MonopolyCardData[]
  buildings?: MonopolyCardData[]
}

export interface GamePropertyGroup {
  color: PropertyColor
  cards: MonopolyCardData[]
  buildings: MonopolyCardData[]
}

interface PlayerFieldProps {
  /** Property stacks on the field */
  stacks: (PropertyGroup | GamePropertyGroup)[]
  /** Money cards in the bank */
  moneyCards: MonopolyCardData[]
  /** Render upside-down for the opponent */
  isOpponent?: boolean
  size?: number
  /** Click handler for stacks (Deal Breaker targeting) */
  onStackClick?: (color: PropertyColor) => void
  /** Click handler for individual cards (Sly Deal / Forced Deal) */
  onCardClick?: (cardId: string, groupColor: PropertyColor) => void
  /** Colors of highlighted stacks */
  highlightedStacks?: PropertyColor[]
  /** IDs of highlighted cards */
  highlightedCards?: string[]
  /** Selection mode */
  selectionMode?: 'stack' | 'card' | null
}

function getGroupColor(group: PropertyGroup | GamePropertyGroup): PropertyColor | undefined {
  if ('color' in group) return group.color
  if (group.cards.length > 0) return group.cards[0].color
  return undefined
}

/** One player's played area — property stacks + money bank. */
export function PlayerField({
  stacks,
  moneyCards,
  isOpponent = false,
  size = 1,
  onStackClick,
  onCardClick,
  highlightedStacks,
  highlightedCards,
  selectionMode,
}: PlayerFieldProps): React.JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 1,
        alignItems: 'flex-end',
        justifyContent: 'center',
        flexWrap: 'wrap',
        px: 1,
        py: 1,
        ...(isOpponent && { transform: 'rotate(180deg)' }),
      }}
    >
      {/* Money bank */}
      {moneyCards.map((card) => (
        <Box key={card.id} sx={{ flexShrink: 0 }}>
          <MonopolyCard card={card} size={size} />
        </Box>
      ))}

      {/* Property stacks */}
      {stacks.map((group, i) => {
        const color = getGroupColor(group)
        const isHighlighted = color ? highlightedStacks?.includes(color) : false
        return (
          <Box
            key={color ?? i}
            onClick={() => {
              if (selectionMode === 'stack' && color && onStackClick) {
                onStackClick(color)
              }
            }}
            sx={{
              cursor: selectionMode === 'stack' && isHighlighted ? 'pointer' : 'default',
              outline: isHighlighted ? '2px solid #f44336' : 'none',
              borderRadius: `${4 * size}px`,
              transition: 'outline 0.15s ease',
            }}
          >
            <PropertyStack
              cards={group.cards}
              buildings={group.buildings}
              size={size}
              onCardClick={selectionMode === 'card' && onCardClick && color
                ? (cardId) => onCardClick(cardId, color)
                : undefined
              }
              highlightedCardIds={highlightedCards}
            />
          </Box>
        )
      })}
    </Box>
  )
}
