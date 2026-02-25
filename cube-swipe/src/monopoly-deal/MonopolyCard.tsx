import { Box, Typography } from '@mui/material'
import { type MonopolyCardData, type PropertyColor, COLOR_HEX, COLOR_RENT } from './cardData'
import { getCardImageUrl } from './cardImages'

interface MonopolyCardProps {
  card: MonopolyCardData
  /** Render card face-down */
  flipped?: boolean
  /** Scale multiplier (1 = 70×100 px) */
  size?: number
  /** Group color the card is placed in (used to rotate dual-color wilds) */
  groupColor?: PropertyColor
}

const BASE_W = 70
const BASE_H = 100

/** Monopoly Deal card — renders cropped image when available, CSS fallback otherwise. */
export function MonopolyCard({ card, flipped = false, size = 1, groupColor }: MonopolyCardProps): React.JSX.Element {
  const isMoney = card.type === 'money'
  const w = (isMoney ? BASE_H : BASE_W) * size
  const h = (isMoney ? BASE_W : BASE_H) * size
  // Dual-color wilds should be rotated 180° when placed with their second color showing
  const shouldRotate = groupColor && card.type === 'wild' && card.color2 === groupColor && card.color !== groupColor

  if (flipped) {
    return (
      <Box
        sx={{
          width: BASE_W * size,
          height: BASE_H * size,
          borderRadius: `${4 * size}px`,
          background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 50%, #1565C0 100%)',
          boxShadow: `0 ${2 * size}px ${6 * size}px rgba(0,0,0,0.25)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: 14 * size, opacity: 0.5 }}>
          M
        </Typography>
      </Box>
    )
  }

  // Use cropped card image when available
  const imageUrl = getCardImageUrl(card.id)
  let face: React.JSX.Element
  if (imageUrl) {
    face = <ImageFace src={imageUrl} alt={card.name} w={w} h={h} size={size} />
  } else {
    // CSS fallback for cards without images
    switch (card.type) {
      case 'money':
        face = <MoneyFace card={card} w={w} h={h} size={size} />; break
      case 'property':
        face = <PropertyFace card={card} w={w} h={h} size={size} />; break
      case 'building':
        face = <BuildingFace card={card} w={w} h={h} size={size} />; break
      case 'wild':
        face = <WildFace card={card} w={w} h={h} size={size} />; break
      case 'rent':
        face = <RentFace card={card} w={w} h={h} size={size} />; break
      default:
        face = <ActionFace card={card} w={w} h={h} size={size} />
    }
  }

  if (shouldRotate) {
    return <Box sx={{ transform: 'rotate(180deg)', width: w, height: h }}>{face}</Box>
  }
  return face
}

// ---------------------------------------------------------------------------
// Image Face — renders a cropped card image within the standard card shell
// ---------------------------------------------------------------------------

function ImageFace({ src, alt, w, h, size }: { src: string; alt: string; w: number; h: number; size: number }): React.JSX.Element {
  return (
    <Box
      sx={{
        width: w,
        height: h,
        borderRadius: `${4 * size}px`,
        boxShadow: `0 ${2 * size}px ${6 * size}px rgba(0,0,0,0.25)`,
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <Box
        component="img"
        src={src}
        alt={alt}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Shared types & helpers
// ---------------------------------------------------------------------------

interface FaceProps {
  card: MonopolyCardData
  w: number
  h: number
  size: number
}

function cardShell(w: number, h: number, bg: string, size: number): Record<string, unknown> {
  return {
    width: w,
    height: h,
    borderRadius: `${4 * size}px`,
    bgcolor: bg,
    boxShadow: `0 ${2 * size}px ${6 * size}px rgba(0,0,0,0.25)`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
    position: 'relative',
  }
}

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 160
}

function darken(hex: string, amount: number): string {
  const c = hex.replace('#', '')
  const r = Math.max(0, Math.floor(parseInt(c.substring(0, 2), 16) * (1 - amount)))
  const g = Math.max(0, Math.floor(parseInt(c.substring(2, 4), 16) * (1 - amount)))
  const b = Math.max(0, Math.floor(parseInt(c.substring(4, 6), 16) * (1 - amount)))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/** Value badge: colored rectangle with "M{X}M" text */
function ValueBadge({ value, size, bg, fg }: { value: number; size: number; bg: string; fg?: string }): React.JSX.Element {
  return (
    <Box
      sx={{
        bgcolor: bg,
        borderRadius: `${2 * size}px`,
        px: `${2 * size}px`,
        py: `${1 * size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography
        sx={{
          fontSize: 5.5 * size,
          fontWeight: 900,
          color: fg ?? (isLightColor(bg) ? '#000' : '#fff'),
          lineHeight: 1,
          fontFamily: '"Arial Black", "Arial", sans-serif',
        }}
      >
        M{value}M
      </Typography>
    </Box>
  )
}

/** Circular value badge for action cards */
function CircleBadge({ value, size, bg }: { value: number; size: number; bg: string }): React.JSX.Element {
  const d = 13 * size
  return (
    <Box
      sx={{
        width: d,
        height: d,
        borderRadius: '50%',
        bgcolor: bg,
        border: `${1 * size}px solid rgba(255,255,255,0.4)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography
        sx={{
          fontSize: 4.5 * size,
          fontWeight: 900,
          color: '#fff',
          lineHeight: 1,
          fontFamily: '"Arial Black", "Arial", sans-serif',
        }}
      >
        M{value}M
      </Typography>
    </Box>
  )
}

function getActionStyle(name: string): { borderColor: string; bgColor: string; badgeBg: string } {
  switch (name) {
    case 'Deal Breaker':
      return { borderColor: '#7B5B8D', bgColor: '#E8D5F0', badgeBg: '#7B1FA2' }
    case 'Sly Deal':
    case 'Forced Deal':
    case 'Debt Collector':
      return { borderColor: '#6B8E3A', bgColor: '#F5E6C8', badgeBg: '#2E7D32' }
    case 'Just Say No':
      return { borderColor: '#3B8686', bgColor: '#C8E8E8', badgeBg: '#00695C' }
    case "It's My Birthday":
      return { borderColor: '#2E8B8B', bgColor: '#C8E6D8', badgeBg: '#00796B' }
    case 'Pass Go':
      return { borderColor: '#6B8E3A', bgColor: '#D4E8C8', badgeBg: '#2E7D32' }
    case 'Double Rent':
      return { borderColor: '#6B8E3A', bgColor: '#F0ECD8', badgeBg: '#1565C0' }
    case 'House':
      return { borderColor: '#2E7D32', bgColor: '#C8E6C9', badgeBg: '#2E7D32' }
    case 'Hotel':
      return { borderColor: '#C62828', bgColor: '#FFCDD2', badgeBg: '#C62828' }
    default:
      return { borderColor: '#607D8B', bgColor: '#ECEFF1', badgeBg: '#2E7D32' }
  }
}

// ---------------------------------------------------------------------------
// Money Face — denomination-colored card with ornamental border & circle
// ---------------------------------------------------------------------------

/** Background + border colors per denomination (matching real Monopoly Deal) */
function getMoneyColors(value: number): { bg: string; border: string } {
  switch (value) {
    case 1:  return { bg: '#D2C896', border: '#8B7D48' }   // tan / gold
    case 2:  return { bg: '#D4B8A0', border: '#8B6E55' }   // peach
    case 3:  return { bg: '#C8C4A0', border: '#7A7750' }   // olive / khaki
    case 4:  return { bg: '#9CB8C8', border: '#5A7888' }   // steel blue
    case 5:  return { bg: '#C0A0C0', border: '#7A5A7A' }   // lavender
    case 10: return { bg: '#D4A830', border: '#8B6E10' }   // deep amber
    default: return { bg: '#C8C8A0', border: '#7A7A50' }
  }
}

function MoneyFace({ card, w, h, size }: FaceProps): React.JSX.Element {
  const { bg, border } = getMoneyColors(card.value)
  const circleD = 38 * size

  return (
    <Box sx={cardShell(w, h, bg, size)}>
      {/* Ornamental dashed inner border */}
      <Box
        sx={{
          position: 'absolute',
          inset: `${4 * size}px`,
          border: `${1 * size}px dashed ${border}`,
          borderRadius: `${3 * size}px`,
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: `${6 * size}px`,
          border: `${0.5 * size}px solid ${border}`,
          borderRadius: `${2 * size}px`,
          pointerEvents: 'none',
        }}
      />

      {/* Central circle with denomination */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: circleD,
          height: circleD,
          borderRadius: '50%',
          border: `${1.5 * size}px solid ${border}`,
          bgcolor: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          sx={{
            fontSize: 15 * size,
            fontWeight: 900,
            color: '#222',
            lineHeight: 1,
            fontFamily: '"Arial Black", "Arial", sans-serif',
          }}
        >
          M{card.value}M
        </Typography>
      </Box>

      {/* Value badge top-right */}
      <Box sx={{ position: 'absolute', top: `${2 * size}px`, right: `${2 * size}px` }}>
        <ValueBadge value={card.value} size={size * 0.7} bg={border} />
      </Box>

      {/* Upside-down value badge bottom-left */}
      <Box
        sx={{
          position: 'absolute',
          bottom: `${2 * size}px`,
          left: `${2 * size}px`,
          transform: 'rotate(180deg)',
        }}
      >
        <ValueBadge value={card.value} size={size * 0.7} bg={border} />
      </Box>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Pixel-art train icon for railroad cards
// ---------------------------------------------------------------------------

/** Renders a small pixel-art locomotive from a grid of filled/empty cells. */
function TrainIcon({ size, color = '#222' }: { size: number; color?: string }): React.JSX.Element {
  // 6×4 pixel grid: 1 = filled, 0 = empty
  const grid = [
    [0, 0, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1],
    [0, 1, 0, 1, 0, 1],
  ]
  const cell = 3.5 * size
  return (
    <Box sx={{ display: 'inline-flex', flexDirection: 'column', gap: 0 }}>
      {grid.map((row, r) => (
        <Box key={r} sx={{ display: 'flex', gap: 0 }}>
          {row.map((on, c) => (
            <Box
              key={c}
              sx={{
                width: cell,
                height: cell,
                bgcolor: on ? color : 'transparent',
                borderRadius: on ? `${0.5 * size}px` : 0,
              }}
            />
          ))}
        </Box>
      ))}
    </Box>
  )
}

/** Mini train icon for rent rows (simplified: engine shape). */
function MiniTrain({ size, color = '#222' }: { size: number; color?: string }): React.JSX.Element {
  const cell = 2.2 * size
  // 3×2 mini shape
  const grid = [
    [0, 1, 1],
    [1, 1, 1],
  ]
  return (
    <Box sx={{ display: 'inline-flex', flexDirection: 'column', gap: 0 }}>
      {grid.map((row, r) => (
        <Box key={r} sx={{ display: 'flex', gap: 0 }}>
          {row.map((on, c) => (
            <Box
              key={c}
              sx={{
                width: cell,
                height: cell,
                bgcolor: on ? color : 'transparent',
              }}
            />
          ))}
        </Box>
      ))}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Property Face — tabular rent layout matching real Monopoly Deal cards
// ---------------------------------------------------------------------------

function PropertyFace({ card, w, h, size }: FaceProps): React.JSX.Element {
  const hex = card.color ? COLOR_HEX[card.color] : '#999'
  const textOnColor = isLightColor(hex) ? '#000' : '#fff'
  const borderHex = darken(hex, 0.15)
  const isRailroad = card.color === 'railroad'

  return (
    <Box sx={cardShell(w, h, '#fff', size)}>
      {/* Value badge — colored rectangle top-left */}
      <Box sx={{ position: 'absolute', top: `${2 * size}px`, left: `${2 * size}px`, zIndex: 1 }}>
        <ValueBadge value={card.value} size={size * 0.8} bg={isRailroad ? '#222' : hex} />
      </Box>

      {isRailroad ? (
        /* ── Railroad-specific header: dark banner + gold text ── */
        <Box
          sx={{
            bgcolor: '#222',
            mt: `${12 * size}px`,
            mx: `${2 * size}px`,
            borderRadius: `${2 * size}px`,
            py: `${2 * size}px`,
            px: `${3 * size}px`,
            textAlign: 'center',
          }}
        >
          <Typography
            sx={{
              fontSize: 5.5 * size,
              fontWeight: 900,
              color: '#D4A830',
              textTransform: 'uppercase',
              lineHeight: 1.1,
              fontFamily: '"Arial Black", "Arial", sans-serif',
            }}
          >
            {card.name}
          </Typography>
        </Box>
      ) : (
        /* ── Standard property name ── */
        <Typography
          sx={{
            fontSize: 5.5 * size,
            fontWeight: 900,
            color: '#000',
            textAlign: 'center',
            textTransform: 'uppercase',
            lineHeight: 1.1,
            mt: `${12 * size}px`,
            px: `${2 * size}px`,
            fontFamily: '"Arial", sans-serif',
          }}
        >
          {card.name}
        </Typography>
      )}

      {/* Pixel-art train icon (railroad only) */}
      {isRailroad && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: `${2 * size}px` }}>
          <TrainIcon size={size} />
        </Box>
      )}

      {/* Rent table */}
      {card.rentValues && (
        <Box sx={{ flex: 1, px: `${4 * size}px`, mt: `${(isRailroad ? 1 : 2) * size}px` }}>
          {/* Column headers */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography
                sx={{
                  fontSize: 3.5 * size,
                  color: '#555',
                  lineHeight: 1.1,
                  fontStyle: 'italic',
                }}
              >
                No. of
              </Typography>
              <Typography
                sx={{
                  fontSize: 3.5 * size,
                  color: '#555',
                  lineHeight: 1.1,
                  fontStyle: 'italic',
                }}
              >
                properties
              </Typography>
            </Box>
            <Typography
              sx={{
                fontSize: 6 * size,
                fontWeight: 900,
                color: '#000',
                lineHeight: 1,
                fontFamily: '"Arial Black", "Arial", sans-serif',
              }}
            >
              RENT
            </Typography>
          </Box>

          {/* Rent rows */}
          <Box sx={{ mt: `${1.5 * size}px` }}>
            {card.rentValues.map((rent, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: `${1 * size}px`,
                }}
              >
                {/* Number + colored squares or train icons */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: `${1 * size}px` }}>
                  <Typography
                    sx={{
                      fontSize: 5 * size,
                      fontWeight: 700,
                      color: '#000',
                      lineHeight: 1,
                      minWidth: `${7 * size}px`,
                      textAlign: 'right',
                    }}
                  >
                    {i + 1}
                  </Typography>
                  {isRailroad
                    ? Array.from({ length: i + 1 }).map((_, j) => (
                        <MiniTrain key={j} size={size} color="#222" />
                      ))
                    : Array.from({ length: i + 1 }).map((_, j) => (
                        <Box
                          key={j}
                          sx={{
                            width: `${4.5 * size}px`,
                            height: `${4.5 * size}px`,
                            bgcolor: hex,
                            border: `${0.5 * size}px solid ${borderHex}`,
                            borderRadius: `${0.5 * size}px`,
                          }}
                        />
                      ))}
                </Box>
                {/* Rent value */}
                <Typography
                  sx={{
                    fontSize: 5 * size,
                    fontWeight: 800,
                    color: '#000',
                    lineHeight: 1,
                    fontFamily: '"Arial Black", "Arial", sans-serif',
                  }}
                >
                  M{rent}M
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Full set bar at bottom */}
      <Box
        sx={{
          bgcolor: isRailroad ? '#222' : hex,
          mx: `${3 * size}px`,
          mb: `${3 * size}px`,
          borderRadius: `${1.5 * size}px`,
          py: `${1.5 * size}px`,
          textAlign: 'center',
        }}
      >
        <Typography
          sx={{
            fontSize: 5 * size,
            fontWeight: 900,
            color: isRailroad ? '#D4A830' : textOnColor,
            lineHeight: 1,
            fontFamily: '"Arial Black", "Arial", sans-serif',
          }}
        >
          FULL SET M{card.rentValues?.[card.rentValues.length - 1]}M
        </Typography>
      </Box>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Action Face — colored border frame with bold card name
// ---------------------------------------------------------------------------

function ActionFace({ card, w, h, size }: FaceProps): React.JSX.Element {
  const style = getActionStyle(card.name)

  return (
    <Box sx={cardShell(w, h, '#F5F0E1', size)}>
      {/* Colored outer border overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: `${4 * size}px`,
          border: `${2.5 * size}px solid ${style.borderColor}`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* Circle badge top-left */}
      <Box sx={{ position: 'absolute', top: `${3 * size}px`, left: `${3 * size}px`, zIndex: 3 }}>
        <CircleBadge value={card.value} size={size} bg={style.badgeBg} />
      </Box>

      {/* "ACTION CARD" header */}
      <Typography
        sx={{
          fontSize: 4.5 * size,
          fontWeight: 700,
          color: '#333',
          textAlign: 'center',
          mt: `${4 * size}px`,
          letterSpacing: `${0.5 * size}px`,
          fontFamily: '"Arial", sans-serif',
          zIndex: 1,
        }}
      >
        ACTION CARD
      </Typography>

      {/* Inner panel */}
      <Box
        sx={{
          flex: 1,
          mx: `${5 * size}px`,
          mt: `${2 * size}px`,
          mb: `${14 * size}px`,
          bgcolor: style.bgColor,
          borderRadius: `${2 * size}px`,
          border: `${0.5 * size}px solid ${style.borderColor}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: `${3 * size}px`,
          py: `${2 * size}px`,
          zIndex: 1,
        }}
      >
        {card.name === 'Pass Go' ? (
          /* Pass Go — distinctive GO circle design */
          <>
            <Typography
              sx={{
                fontSize: 5.5 * size,
                fontWeight: 900,
                color: '#000',
                fontFamily: '"Arial Black", "Arial", sans-serif',
                letterSpacing: `${1 * size}px`,
              }}
            >
              PASS
            </Typography>
            <Box
              sx={{
                width: `${26 * size}px`,
                height: `${26 * size}px`,
                borderRadius: '50%',
                border: `${2 * size}px solid #C62828`,
                bgcolor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                my: `${1 * size}px`,
              }}
            >
              <Typography
                sx={{
                  fontSize: 12 * size,
                  fontWeight: 900,
                  color: '#C62828',
                  lineHeight: 1,
                  fontFamily: '"Arial Black", "Arial", sans-serif',
                }}
              >
                GO
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 3 * size, color: '#444', textAlign: 'center', lineHeight: 1.2 }}>
              {card.description}
            </Typography>
          </>
        ) : (
          /* Standard action card content */
          <>
            <Typography
              sx={{
                fontSize: 7.5 * size,
                fontWeight: 900,
                color: '#000',
                textAlign: 'center',
                lineHeight: 1.1,
                textTransform: 'uppercase',
                fontFamily: '"Arial Black", "Arial", sans-serif',
              }}
            >
              {card.name}
            </Typography>
            {card.description && (
              <Typography
                sx={{
                  fontSize: 3.2 * size,
                  color: '#444',
                  textAlign: 'center',
                  lineHeight: 1.2,
                  mt: `${2 * size}px`,
                }}
              >
                {card.description}
              </Typography>
            )}
          </>
        )}

        {/* Play instruction */}
        <Typography
          sx={{
            fontSize: 3 * size,
            color: '#666',
            textAlign: 'center',
            mt: `${1 * size}px`,
            fontStyle: 'italic',
          }}
        >
          Play into center to use.
        </Typography>
      </Box>

      {/* Upside-down circle badge bottom-right */}
      <Box
        sx={{
          position: 'absolute',
          bottom: `${3 * size}px`,
          right: `${3 * size}px`,
          transform: 'rotate(180deg)',
          zIndex: 3,
        }}
      >
        <CircleBadge value={card.value} size={size} bg={style.badgeBg} />
      </Box>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Building Face (House / Hotel) — styled like action cards with icon
// ---------------------------------------------------------------------------

function BuildingFace({ card, w, h, size }: FaceProps): React.JSX.Element {
  const isHotel = card.name === 'Hotel'
  const style = getActionStyle(card.name)

  return (
    <Box sx={cardShell(w, h, '#F5F0E1', size)}>
      {/* Colored outer border */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: `${4 * size}px`,
          border: `${2.5 * size}px solid ${style.borderColor}`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* Circle badge top-left */}
      <Box sx={{ position: 'absolute', top: `${3 * size}px`, left: `${3 * size}px`, zIndex: 3 }}>
        <CircleBadge value={card.value} size={size} bg={style.badgeBg} />
      </Box>

      {/* "ACTION CARD" header */}
      <Typography
        sx={{
          fontSize: 4.5 * size,
          fontWeight: 700,
          color: '#333',
          textAlign: 'center',
          mt: `${4 * size}px`,
          letterSpacing: `${0.5 * size}px`,
          fontFamily: '"Arial", sans-serif',
          zIndex: 1,
        }}
      >
        ACTION CARD
      </Typography>

      {/* Inner panel */}
      <Box
        sx={{
          flex: 1,
          mx: `${5 * size}px`,
          mt: `${2 * size}px`,
          mb: `${14 * size}px`,
          bgcolor: style.bgColor,
          borderRadius: `${2 * size}px`,
          border: `${0.5 * size}px solid ${style.borderColor}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: `${3 * size}px`,
          py: `${1 * size}px`,
          zIndex: 1,
        }}
      >
        {/* Building icon — CSS-drawn outline */}
        {isHotel ? (
          /* Hotel: outlined building shape */
          <Box
            sx={{
              width: `${20 * size}px`,
              height: `${18 * size}px`,
              border: `${1.5 * size}px solid #C62828`,
              borderRadius: `${1 * size}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: `${1 * size}px`,
              position: 'relative',
            }}
          >
            <Typography
              sx={{
                fontSize: 10 * size,
                fontWeight: 900,
                color: '#C62828',
                lineHeight: 1,
                fontFamily: '"Arial Black", "Arial", sans-serif',
              }}
            >
              H
            </Typography>
          </Box>
        ) : (
          /* House: outlined house shape (triangle roof + rectangle body) */
          <Box sx={{ mb: `${1 * size}px`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Roof triangle */}
            <Box
              sx={{
                width: 0,
                height: 0,
                borderLeft: `${10 * size}px solid transparent`,
                borderRight: `${10 * size}px solid transparent`,
                borderBottom: `${8 * size}px solid #2E7D32`,
              }}
            />
            {/* Body rectangle */}
            <Box
              sx={{
                width: `${16 * size}px`,
                height: `${10 * size}px`,
                border: `${1.5 * size}px solid #2E7D32`,
                borderTop: 'none',
                bgcolor: 'transparent',
              }}
            />
          </Box>
        )}

        {/* Name */}
        <Typography
          sx={{
            fontSize: 7 * size,
            fontWeight: 900,
            color: '#000',
            textTransform: 'uppercase',
            fontFamily: '"Arial Black", "Arial", sans-serif',
          }}
        >
          {card.name}
        </Typography>

        {/* Description */}
        {card.description && (
          <Typography
            sx={{
              fontSize: 3 * size,
              color: '#444',
              textAlign: 'center',
              lineHeight: 1.2,
              mt: `${1 * size}px`,
            }}
          >
            {card.description}
          </Typography>
        )}
      </Box>

      {/* Upside-down badge bottom-right */}
      <Box
        sx={{
          position: 'absolute',
          bottom: `${3 * size}px`,
          right: `${3 * size}px`,
          transform: 'rotate(180deg)',
          zIndex: 3,
        }}
      >
        <CircleBadge value={card.value} size={size} bg={style.badgeBg} />
      </Box>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Wild Face — dual-color property wild card
// ---------------------------------------------------------------------------

function WildFace({ card, w, h, size }: FaceProps): React.JSX.Element {
  if (!card.color) {
    return <RainbowWildFace w={w} h={h} size={size} />
  }

  const hex1 = COLOR_HEX[card.color]
  const hex2 = card.color2 ? COLOR_HEX[card.color2] : hex1
  const rent1 = COLOR_RENT[card.color]
  const rent2 = card.color2 ? COLOR_RENT[card.color2] : rent1
  const text1 = isLightColor(hex1) ? '#000' : '#fff'
  const text2 = isLightColor(hex2) ? '#000' : '#fff'

  return (
    <Box sx={cardShell(w, h, '#fff', size)}>
      {/* Top half — color 1 */}
      <Box
        sx={{
          height: '50%',
          bgcolor: hex1,
          borderRadius: `${4 * size}px ${4 * size}px 0 0`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: `${3 * size}px`,
          pt: `${2 * size}px`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Value badge top-left */}
        <Box sx={{ position: 'absolute', top: `${1 * size}px`, left: `${2 * size}px` }}>
          <ValueBadge value={card.value} size={size * 0.65} bg="#2E7D32" />
        </Box>

        <Typography
          sx={{
            fontSize: 4 * size,
            fontWeight: 700,
            color: text1,
            mt: `${1 * size}px`,
            letterSpacing: `${0.5 * size}px`,
          }}
        >
          PROPERTY
        </Typography>
        <Typography
          sx={{
            fontSize: 6 * size,
            fontWeight: 900,
            color: text1,
            lineHeight: 1,
            fontFamily: '"Arial Black", "Arial", sans-serif',
          }}
        >
          WILD CARD
        </Typography>
        <Typography sx={{ fontSize: 2.8 * size, color: text1, opacity: 0.85, mt: `${0.5 * size}px` }}>
          (use card either way up.)
        </Typography>

        {/* Mini rent display */}
        <Box sx={{ display: 'flex', gap: `${2 * size}px`, mt: `${1 * size}px`, alignItems: 'center' }}>
          <Typography sx={{ fontSize: 3.5 * size, fontWeight: 700, color: text1 }}>RENT</Typography>
          {rent1.map((r, i) => (
            <Typography key={i} sx={{ fontSize: 3 * size, color: text1, fontWeight: 600 }}>
              M{r}M
            </Typography>
          ))}
        </Box>
      </Box>

      {/* Bottom half — color 2 (rotated 180°) */}
      <Box
        sx={{
          height: '50%',
          bgcolor: hex2,
          borderRadius: `0 0 ${4 * size}px ${4 * size}px`,
          transform: 'rotate(180deg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: `${3 * size}px`,
          pt: `${2 * size}px`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Value badge */}
        <Box sx={{ position: 'absolute', top: `${1 * size}px`, left: `${2 * size}px` }}>
          <ValueBadge value={card.value} size={size * 0.65} bg="#2E7D32" />
        </Box>

        <Typography
          sx={{
            fontSize: 4 * size,
            fontWeight: 700,
            color: text2,
            mt: `${1 * size}px`,
            letterSpacing: `${0.5 * size}px`,
          }}
        >
          PROPERTY
        </Typography>
        <Typography
          sx={{
            fontSize: 6 * size,
            fontWeight: 900,
            color: text2,
            lineHeight: 1,
            fontFamily: '"Arial Black", "Arial", sans-serif',
          }}
        >
          WILD CARD
        </Typography>

        {/* Mini rent display */}
        <Box sx={{ display: 'flex', gap: `${2 * size}px`, mt: `${1 * size}px`, alignItems: 'center' }}>
          <Typography sx={{ fontSize: 3.5 * size, fontWeight: 700, color: text2 }}>RENT</Typography>
          {rent2.map((r, i) => (
            <Typography key={i} sx={{ fontSize: 3 * size, color: text2, fontWeight: 600 }}>
              M{r}M
            </Typography>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Rainbow Wild Face — all 10 colors
// ---------------------------------------------------------------------------

function RainbowWildFace({ w, h, size }: Omit<FaceProps, 'card'>): React.JSX.Element {
  const colors = [
    COLOR_HEX.brown, COLOR_HEX.lightBlue, COLOR_HEX.pink, COLOR_HEX.orange, COLOR_HEX.red,
    COLOR_HEX.yellow, COLOR_HEX.green, COLOR_HEX.darkBlue, COLOR_HEX.railroad, COLOR_HEX.utility,
  ]

  return (
    <Box sx={cardShell(w, h, '#FFF8E1', size)}>
      {/* Color stripes at top */}
      <Box sx={{ display: 'flex', width: '100%', height: `${8 * size}px`, flexShrink: 0 }}>
        {colors.map((c, i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              bgcolor: c,
              ...(i === 0
                ? { borderRadius: `${4 * size}px 0 0 0` }
                : i === 9
                  ? { borderRadius: `0 ${4 * size}px 0 0` }
                  : {}),
            }}
          />
        ))}
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: `${4 * size}px`,
        }}
      >
        <Typography
          sx={{
            fontSize: 4.5 * size,
            fontWeight: 700,
            color: '#333',
            letterSpacing: `${0.5 * size}px`,
          }}
        >
          PROPERTY
        </Typography>
        <Typography
          sx={{
            fontSize: 6.5 * size,
            fontWeight: 900,
            color: '#000',
            lineHeight: 1,
            fontFamily: '"Arial Black", "Arial", sans-serif',
          }}
        >
          WILD CARD
        </Typography>
        <Typography
          sx={{
            fontSize: 3 * size,
            color: '#555',
            textAlign: 'center',
            mt: `${3 * size}px`,
            lineHeight: 1.2,
          }}
        >
          This card can be used as part of any property set. This card has no monetary value.
        </Typography>
      </Box>

      {/* Color stripes at bottom */}
      <Box sx={{ display: 'flex', width: '100%', height: `${8 * size}px`, flexShrink: 0 }}>
        {colors.map((c, i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              bgcolor: c,
              ...(i === 0
                ? { borderRadius: `0 0 0 ${4 * size}px` }
                : i === 9
                  ? { borderRadius: `0 0 ${4 * size}px 0` }
                  : {}),
            }}
          />
        ))}
      </Box>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Rent Face — dual-color or wild rent card
// ---------------------------------------------------------------------------

function RentFace({ card, w, h, size }: FaceProps): React.JSX.Element {
  const isWild = !card.color
  const colors = isWild
    ? ['#8B4513', '#87CEEB', '#FF69B4', '#FF8C00', '#E53935', '#FFD700', '#2E7D32', '#1A237E', '#424242', '#66BB6A']
    : [card.color ? COLOR_HEX[card.color] : '#999', card.color2 ? COLOR_HEX[card.color2] : '#999']

  return (
    <Box sx={cardShell(w, h, '#fff', size)}>
      {/* Value badge top-left */}
      <Box sx={{ position: 'absolute', top: `${2 * size}px`, left: `${2 * size}px`, zIndex: 2 }}>
        <ValueBadge value={card.value} size={size * 0.7} bg={isWild ? '#607D8B' : colors[0]} />
      </Box>

      {/* Color stripes at top */}
      <Box sx={{ display: 'flex', width: '100%', height: `${12 * size}px`, flexShrink: 0 }}>
        {colors.map((c, i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              bgcolor: c,
              ...(i === 0
                ? { borderRadius: `${4 * size}px 0 0 0` }
                : i === colors.length - 1
                  ? { borderRadius: `0 ${4 * size}px 0 0` }
                  : {}),
            }}
          />
        ))}
      </Box>

      {/* RENT text */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', px: `${3 * size}px` }}>
        <Typography
          sx={{
            fontSize: 14 * size,
            fontWeight: 900,
            color: '#000',
            lineHeight: 1,
            fontFamily: '"Arial Black", "Arial", sans-serif',
          }}
        >
          RENT
        </Typography>

        {/* Color circles */}
        <Box sx={{ display: 'flex', gap: `${3 * size}px`, mt: `${3 * size}px` }}>
          {isWild ? (
            <Typography sx={{ fontSize: 3.5 * size, color: '#555', textAlign: 'center', lineHeight: 1.2 }}>
              Any color
            </Typography>
          ) : (
            colors.map((c, i) => (
              <Box
                key={i}
                sx={{
                  width: `${12 * size}px`,
                  height: `${12 * size}px`,
                  borderRadius: '50%',
                  bgcolor: c,
                  border: `${1 * size}px solid ${darken(c, 0.2)}`,
                }}
              />
            ))
          )}
        </Box>
      </Box>

      {/* Color stripes at bottom */}
      <Box sx={{ display: 'flex', width: '100%', height: `${12 * size}px`, flexShrink: 0 }}>
        {colors.map((c, i) => (
          <Box
            key={i}
            sx={{
              flex: 1,
              bgcolor: c,
              ...(i === 0
                ? { borderRadius: `0 0 0 ${4 * size}px` }
                : i === colors.length - 1
                  ? { borderRadius: `0 0 ${4 * size}px 0` }
                  : {}),
            }}
          />
        ))}
      </Box>
    </Box>
  )
}
