// ---------------------------------------------------------------------------
// Monopoly Deal – Card type definitions and game data
// ---------------------------------------------------------------------------

export type CardType = 'money' | 'property' | 'action' | 'rent' | 'wild' | 'building'

export type PropertyColor =
  | 'brown'
  | 'lightBlue'
  | 'pink'
  | 'orange'
  | 'red'
  | 'yellow'
  | 'green'
  | 'darkBlue'
  | 'railroad'
  | 'utility'

export interface MonopolyCardData {
  id: string
  type: CardType
  name: string
  /** Corner value in millions (used when banked as money) */
  value: number
  /** Property / wild color (undefined for money & most actions) */
  color?: PropertyColor
  /** Second color for dual-color wilds / rent cards */
  color2?: PropertyColor
  /** Rent values indexed by number of properties in the set (1-based) */
  rentValues?: number[]
  /** Description text for action/building cards */
  description?: string
}

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------

export const COLOR_HEX: Record<PropertyColor, string> = {
  brown: '#8B4513',
  lightBlue: '#87CEEB',
  pink: '#FF69B4',
  orange: '#FF8C00',
  red: '#E53935',
  yellow: '#FFD700',
  green: '#2E7D32',
  darkBlue: '#1A237E',
  railroad: '#424242',
  utility: '#66BB6A',
}

export const COLOR_LABEL: Record<PropertyColor, string> = {
  brown: 'Brown',
  lightBlue: 'Lt. Blue',
  pink: 'Pink',
  orange: 'Orange',
  red: 'Red',
  yellow: 'Yellow',
  green: 'Green',
  darkBlue: 'Dk. Blue',
  railroad: 'Railroad',
  utility: 'Utility',
}

/** Rent values for each color (indexed by number of properties - 1) */
export const COLOR_RENT: Record<PropertyColor, number[]> = {
  brown: [1, 2],
  lightBlue: [1, 2, 3],
  pink: [1, 2, 4],
  orange: [1, 3, 5],
  red: [2, 3, 6],
  yellow: [2, 4, 6],
  green: [2, 4, 7],
  darkBlue: [3, 8],
  railroad: [1, 2, 3, 4],
  utility: [1, 2],
}

/** Number of property cards required to complete each color set */
export const SET_SIZE: Record<PropertyColor, number> = {
  brown: 2,
  lightBlue: 3,
  pink: 3,
  orange: 3,
  red: 3,
  yellow: 3,
  green: 3,
  darkBlue: 2,
  railroad: 4,
  utility: 2,
}

// ---------------------------------------------------------------------------
// Property cards
// ---------------------------------------------------------------------------

const prop = (
  id: string,
  name: string,
  color: PropertyColor,
  value: number,
  rentValues: number[],
): MonopolyCardData => ({ id, type: 'property', name, value, color, rentValues })

export const PROPERTY_CARDS: MonopolyCardData[] = [
  // Brown
  prop('p-brown-1', 'Mediterranean Ave', 'brown', 1, [1, 2]),
  prop('p-brown-2', 'Baltic Ave', 'brown', 1, [1, 2]),
  // Light Blue
  prop('p-lb-1', 'Oriental Ave', 'lightBlue', 1, [1, 2, 3]),
  prop('p-lb-2', 'Vermont Ave', 'lightBlue', 1, [1, 2, 3]),
  prop('p-lb-3', 'Connecticut Ave', 'lightBlue', 1, [1, 2, 3]),
  // Pink
  prop('p-pink-1', 'St. Charles Pl', 'pink', 2, [1, 2, 4]),
  prop('p-pink-2', 'States Ave', 'pink', 2, [1, 2, 4]),
  prop('p-pink-3', 'Virginia Ave', 'pink', 2, [1, 2, 4]),
  // Orange
  prop('p-ora-1', 'St. James Pl', 'orange', 2, [1, 3, 5]),
  prop('p-ora-2', 'Tennessee Ave', 'orange', 2, [1, 3, 5]),
  prop('p-ora-3', 'New York Ave', 'orange', 2, [1, 3, 5]),
  // Red
  prop('p-red-1', 'Kentucky Ave', 'red', 3, [2, 3, 6]),
  prop('p-red-2', 'Indiana Ave', 'red', 3, [2, 3, 6]),
  prop('p-red-3', 'Illinois Ave', 'red', 3, [2, 3, 6]),
  // Yellow
  prop('p-yel-1', 'Atlantic Ave', 'yellow', 3, [2, 4, 6]),
  prop('p-yel-2', 'Ventnor Ave', 'yellow', 3, [2, 4, 6]),
  prop('p-yel-3', 'Marvin Gardens', 'yellow', 3, [2, 4, 6]),
  // Green
  prop('p-grn-1', 'Pacific Ave', 'green', 4, [2, 4, 7]),
  prop('p-grn-2', 'N. Carolina Ave', 'green', 4, [2, 4, 7]),
  prop('p-grn-3', 'Pennsylvania Ave', 'green', 4, [2, 4, 7]),
  // Dark Blue
  prop('p-db-1', 'Park Place', 'darkBlue', 4, [3, 8]),
  prop('p-db-2', 'Boardwalk', 'darkBlue', 4, [3, 8]),
  // Railroad
  prop('p-rr-1', 'Reading RR', 'railroad', 2, [1, 2, 3, 4]),
  prop('p-rr-2', 'Pennsylvania RR', 'railroad', 2, [1, 2, 3, 4]),
  prop('p-rr-3', 'B&O RR', 'railroad', 2, [1, 2, 3, 4]),
  prop('p-rr-4', 'Short Line', 'railroad', 2, [1, 2, 3, 4]),
  // Utility
  prop('p-util-1', 'Electric Co.', 'utility', 2, [1, 2]),
  prop('p-util-2', 'Water Works', 'utility', 2, [1, 2]),
]

// ---------------------------------------------------------------------------
// Money cards
// ---------------------------------------------------------------------------

const money = (id: string, value: number): MonopolyCardData => ({
  id,
  type: 'money',
  name: `$${value}M`,
  value,
})

export const MONEY_CARDS: MonopolyCardData[] = [
  money('m-1a', 1), money('m-1b', 1), money('m-1c', 1),
  money('m-1d', 1), money('m-1e', 1), money('m-1f', 1),
  money('m-2a', 2), money('m-2b', 2), money('m-2c', 2),
  money('m-2d', 2), money('m-2e', 2),
  money('m-3a', 3), money('m-3b', 3), money('m-3c', 3),
  money('m-4a', 4), money('m-4b', 4), money('m-4c', 4),
  money('m-5a', 5), money('m-5b', 5),
  money('m-10', 10),
]

// ---------------------------------------------------------------------------
// Action cards
// ---------------------------------------------------------------------------

const action = (id: string, name: string, value: number, description: string): MonopolyCardData => ({
  id,
  type: 'action',
  name,
  value,
  description,
})

export const ACTION_CARDS: MonopolyCardData[] = [
  action('a-db-1', 'Deal Breaker', 5, 'Steal a complete set of properties from any player. (Includes any buildings.)'),
  action('a-db-2', 'Deal Breaker', 5, 'Steal a complete set of properties from any player. (Includes any buildings.)'),
  action('a-jsn-1', 'Just Say No', 4, 'Use any time when an Action Card is played against you.'),
  action('a-jsn-2', 'Just Say No', 4, 'Use any time when an Action Card is played against you.'),
  action('a-jsn-3', 'Just Say No', 4, 'Use any time when an Action Card is played against you.'),
  action('a-sly-1', 'Sly Deal', 3, 'Steal a property from the player of your choice. Cannot be part of a full set.'),
  action('a-sly-2', 'Sly Deal', 3, 'Steal a property from the player of your choice. Cannot be part of a full set.'),
  action('a-sly-3', 'Sly Deal', 3, 'Steal a property from the player of your choice. Cannot be part of a full set.'),
  action('a-fd-1', 'Forced Deal', 3, 'Swap any property with another player. Cannot be part of a full set.'),
  action('a-fd-2', 'Forced Deal', 3, 'Swap any property with another player. Cannot be part of a full set.'),
  action('a-fd-3', 'Forced Deal', 3, 'Swap any property with another player. Cannot be part of a full set.'),
  action('a-fd-4', 'Forced Deal', 3, 'Swap any property with another player. Cannot be part of a full set.'),
  action('a-dc-1', 'Debt Collector', 3, 'Force any player to pay you M5M.'),
  action('a-dc-2', 'Debt Collector', 3, 'Force any player to pay you M5M.'),
  action('a-dc-3', 'Debt Collector', 3, 'Force any player to pay you M5M.'),
  action('a-bday-1', "It's My Birthday", 2, 'All players give you M2M as a gift!'),
  action('a-bday-2', "It's My Birthday", 2, 'All players give you M2M as a gift!'),
  action('a-bday-3', "It's My Birthday", 2, 'All players give you M2M as a gift!'),
  action('a-pg-1', 'Pass Go', 1, 'Draw 2 extra cards.'),
  action('a-pg-2', 'Pass Go', 1, 'Draw 2 extra cards.'),
  action('a-pg-3', 'Pass Go', 1, 'Draw 2 extra cards.'),
  action('a-pg-4', 'Pass Go', 1, 'Draw 2 extra cards.'),
  action('a-pg-5', 'Pass Go', 1, 'Draw 2 extra cards.'),
  action('a-pg-6', 'Pass Go', 1, 'Draw 2 extra cards.'),
  action('a-pg-7', 'Pass Go', 1, 'Draw 2 extra cards.'),
  action('a-pg-8', 'Pass Go', 1, 'Draw 2 extra cards.'),
  action('a-pg-9', 'Pass Go', 1, 'Draw 2 extra cards.'),
  action('a-pg-10', 'Pass Go', 1, 'Draw 2 extra cards.'),
  action('a-dtr-1', 'Double Rent', 1, 'Needs to be played with a rent card.'),
  action('a-dtr-2', 'Double Rent', 1, 'Needs to be played with a rent card.'),
]

// ---------------------------------------------------------------------------
// Building cards (House / Hotel)
// ---------------------------------------------------------------------------

export const BUILDING_CARDS: MonopolyCardData[] = [
  { id: 'b-house-1', type: 'building', name: 'House', value: 3, description: 'Add onto any full set you own to add M3M to the rent value.' },
  { id: 'b-house-2', type: 'building', name: 'House', value: 3, description: 'Add onto any full set you own to add M3M to the rent value.' },
  { id: 'b-house-3', type: 'building', name: 'House', value: 3, description: 'Add onto any full set you own to add M3M to the rent value.' },
  { id: 'b-hotel-1', type: 'building', name: 'Hotel', value: 4, description: 'Add onto any full set you own with a House to add M4M to the rent value.' },
  { id: 'b-hotel-2', type: 'building', name: 'Hotel', value: 4, description: 'Add onto any full set you own with a House to add M4M to the rent value.' },
]

// ---------------------------------------------------------------------------
// Wild property cards (dual-color and rainbow)
// ---------------------------------------------------------------------------

export const WILD_CARDS: MonopolyCardData[] = [
  { id: 'w-br-lb', type: 'wild', name: 'Wild Property', value: 1, color: 'brown', color2: 'lightBlue' },
  { id: 'w-pk-or-1', type: 'wild', name: 'Wild Property', value: 2, color: 'pink', color2: 'orange' },
  { id: 'w-pk-or-2', type: 'wild', name: 'Wild Property', value: 2, color: 'pink', color2: 'orange' },
  { id: 'w-rd-yl-1', type: 'wild', name: 'Wild Property', value: 3, color: 'red', color2: 'yellow' },
  { id: 'w-rd-yl-2', type: 'wild', name: 'Wild Property', value: 3, color: 'red', color2: 'yellow' },
  { id: 'w-gr-db', type: 'wild', name: 'Wild Property', value: 4, color: 'green', color2: 'darkBlue' },
  { id: 'w-gr-rr', type: 'wild', name: 'Wild Property', value: 4, color: 'green', color2: 'railroad' },
  { id: 'w-lb-rr', type: 'wild', name: 'Wild Property', value: 4, color: 'lightBlue', color2: 'railroad' },
  { id: 'w-rr-ut', type: 'wild', name: 'Wild Property', value: 2, color: 'railroad', color2: 'utility' },
  { id: 'w-rainbow-1', type: 'wild', name: 'Property Wild Card', value: 0 },
  { id: 'w-rainbow-2', type: 'wild', name: 'Property Wild Card', value: 0 },
]

// ---------------------------------------------------------------------------
// Rent cards (dual-color and multi-color)
// ---------------------------------------------------------------------------

const rent = (
  id: string,
  value: number,
  color?: PropertyColor,
  color2?: PropertyColor,
): MonopolyCardData => ({
  id,
  type: 'rent',
  name: color ? 'Rent' : 'Wild Rent',
  value,
  color,
  color2,
  description: color
    ? `Charge rent for ${COLOR_LABEL[color]} or ${COLOR_LABEL[color2!]} properties.`
    : 'Charge rent for any color you own.',
})

export const RENT_CARDS: MonopolyCardData[] = [
  rent('r-db-gr-1', 1, 'darkBlue', 'green'),
  rent('r-db-gr-2', 1, 'darkBlue', 'green'),
  rent('r-lb-br-1', 1, 'lightBlue', 'brown'),
  rent('r-lb-br-2', 1, 'lightBlue', 'brown'),
  rent('r-pk-or-1', 1, 'pink', 'orange'),
  rent('r-pk-or-2', 1, 'pink', 'orange'),
  rent('r-rd-yl-1', 1, 'red', 'yellow'),
  rent('r-rd-yl-2', 1, 'red', 'yellow'),
  rent('r-rr-ut-1', 1, 'railroad', 'utility'),
  rent('r-rr-ut-2', 1, 'railroad', 'utility'),
  rent('r-wild-1', 3),
  rent('r-wild-2', 3),
  rent('r-wild-3', 3),
]

// ---------------------------------------------------------------------------
// Helpers for looking up cards by id
// ---------------------------------------------------------------------------

const ALL_CARDS = [
  ...PROPERTY_CARDS,
  ...MONEY_CARDS,
  ...ACTION_CARDS,
  ...BUILDING_CARDS,
  ...WILD_CARDS,
  ...RENT_CARDS,
]

const CARD_MAP = new Map(ALL_CARDS.map((c) => [c.id, c]))

export function getCardById(id: string): MonopolyCardData | undefined {
  return CARD_MAP.get(id)
}

/** Build the full deck (all card instances). */
export function buildFullDeck(): MonopolyCardData[] {
  return [...ALL_CARDS]
}
