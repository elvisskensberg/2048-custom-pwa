import { describe, it, expect, beforeEach } from 'vitest'
import {
  createInitialState,
  executeDraw,
  drawCards,
  playPropertyToField,
  bankCard,
  playBuilding,
  playPassGo,
  playRentCard,
  completeRentColor,
  playDebtCollector,
  playBirthday,
  playSlyDeal,
  completeSlyDeal,
  playForcedDeal,
  completeForcedDeal,
  playDealBreaker,
  completeDealBreaker,
  playJustSayNo,
  acceptJSNOutcome,
  initiateJSN,
  togglePaymentCard,
  confirmPayment,
  discardCards,
  endPlayPhase,
  isCompleteSet,
  countCompleteSets,
  checkWinCondition,
  canPlayCard,
  canPlaceBuilding,
  calculateRent,
  getStealableProperties,
  getCompleteSetColors,
  getPlayerTotalValue,
  getPayableCards,
  getSelectedPaymentValue,
  serializeState,
  deserializeState,
  shuffleDeck,
  relocateWildOnField,
  getRelocatableWilds,
  getRelocatableBuildings,
  relocateBuildingOnField,
  useJSNDuringPayment,
  type MonopolyDealState,
  type PlayerState,
  type PropertyGroup,
} from './gameEngine'
import {
  type MonopolyCardData,
  type PropertyColor,
  PROPERTY_CARDS,
  ACTION_CARDS,
  MONEY_CARDS,
  BUILDING_CARDS,
  WILD_CARDS,
  RENT_CARDS,
  SET_SIZE,
} from './cardData'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Build a minimal state for controlled testing. */
function makeState(overrides?: Partial<MonopolyDealState>): MonopolyDealState {
  return {
    drawPile: [],
    discardPile: [],
    player: { hand: [], field: [], bank: [] },
    ai: { hand: [], field: [], bank: [] },
    currentTurn: 'player',
    turnPhase: { type: 'play', playsRemaining: 3 },
    turnNumber: 1,
    playsUsedThisTurn: 0,
    log: [],
    ...overrides,
  }
}

function findCard(name: string): MonopolyCardData {
  const card = [...PROPERTY_CARDS, ...ACTION_CARDS, ...MONEY_CARDS, ...BUILDING_CARDS, ...WILD_CARDS, ...RENT_CARDS]
    .find((c) => c.name === name)
  if (!card) throw new Error(`Card not found: ${name}`)
  return card
}

function findCardById(id: string): MonopolyCardData {
  const card = [...PROPERTY_CARDS, ...ACTION_CARDS, ...MONEY_CARDS, ...BUILDING_CARDS, ...WILD_CARDS, ...RENT_CARDS]
    .find((c) => c.id === id)
  if (!card) throw new Error(`Card not found by id: ${id}`)
  return card
}

function makeGroup(color: MonopolyCardData['color'], cardIds: string[]): PropertyGroup {
  return {
    color: color!,
    cards: cardIds.map((id) => findCardById(id)),
    buildings: [],
  }
}

function getStateCardIds(state: MonopolyDealState): string[] {
  const ids: string[] = []
  const addCards = (cards: MonopolyCardData[]): void => {
    for (const card of cards) ids.push(card.id)
  }
  const addPlayer = (player: PlayerState): void => {
    addCards(player.hand)
    addCards(player.bank)
    for (const group of player.field) {
      addCards(group.cards)
      addCards(group.buildings)
    }
  }

  addCards(state.drawPile)
  addCards(state.discardPile)
  addPlayer(state.player)
  addPlayer(state.ai)
  return ids
}

function expectNoDuplicateCardIds(state: MonopolyDealState): void {
  const ids = getStateCardIds(state)
  expect(new Set(ids).size).toBe(ids.length)
}

function expectCardConservation(before: MonopolyDealState, after: MonopolyDealState): void {
  const beforeIds = getStateCardIds(before).sort()
  const afterIds = getStateCardIds(after).sort()
  expect(afterIds).toEqual(beforeIds)
}

function createSeededRandom(seed: number): () => number {
  let s = seed >>> 0
  return (): number => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

function pickUnique<T>(items: T[], count: number, random: () => number): T[] {
  const pool = [...items]
  const target = Math.min(count, pool.length)
  const result: T[] = []
  for (let i = 0; i < target; i++) {
    const idx = Math.floor(random() * pool.length)
    result.push(pool[idx])
    pool.splice(idx, 1)
  }
  return result
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('gameEngine', () => {
  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------
  describe('createInitialState', () => {
    it('deals 5 cards to each player and sets draw phase', () => {
      const state = createInitialState()
      expect(state.player.hand).toHaveLength(5)
      expect(state.ai.hand).toHaveLength(5)
      expect(state.turnPhase).toEqual({ type: 'draw' })
      expect(['player', 'ai']).toContain(state.currentTurn)
      expect(state.turnNumber).toBe(1)
    })

    it('creates a draw pile with remaining cards', () => {
      const state = createInitialState()
      // 5 player + 5 ai + drawPile = total deck
      const totalCards = state.player.hand.length + state.ai.hand.length + state.drawPile.length
      expect(totalCards).toBeGreaterThan(10)
      expect(state.discardPile).toHaveLength(0)
    })

    it('starts with empty fields and banks', () => {
      const state = createInitialState()
      expect(state.player.field).toHaveLength(0)
      expect(state.player.bank).toHaveLength(0)
      expect(state.ai.field).toHaveLength(0)
      expect(state.ai.bank).toHaveLength(0)
    })
  })

  describe('shuffleDeck', () => {
    it('returns an array of the same length', () => {
      const deck = [findCard('Mediterranean Ave'), findCard('Baltic Ave'), findCard('Park Place')]
      const shuffled = shuffleDeck(deck)
      expect(shuffled).toHaveLength(deck.length)
    })

    it('does not mutate the original array', () => {
      const deck = [findCard('Mediterranean Ave'), findCard('Baltic Ave')]
      const original = [...deck]
      shuffleDeck(deck)
      expect(deck).toEqual(original)
    })
  })

  // -------------------------------------------------------------------------
  // Draw
  // -------------------------------------------------------------------------
  describe('executeDraw', () => {
    it('draws 2 cards and transitions to play phase with 3 plays', () => {
      const state = makeState({
        turnPhase: { type: 'draw' },
        drawPile: [findCard('Mediterranean Ave'), findCard('Baltic Ave'), findCard('Park Place')],
        player: { hand: [findCard('Kentucky Ave')], field: [], bank: [] },
      })

      const next = executeDraw(state)
      expect(next.player.hand).toHaveLength(3) // 1 existing + 2 drawn
      expect(next.drawPile).toHaveLength(1)
      expect(next.turnPhase).toEqual({ type: 'play', playsRemaining: 3 })
      expect(next.playsUsedThisTurn).toBe(0)
    })

    it('adds a log entry', () => {
      const state = makeState({
        turnPhase: { type: 'draw' },
        drawPile: [findCard('Mediterranean Ave'), findCard('Baltic Ave')],
        player: { hand: [findCard('Kentucky Ave')], field: [], bank: [] },
      })
      const next = executeDraw(state)
      expect(next.log).toHaveLength(1)
      expect(next.log[0].action).toContain('Drew 2')
    })
  })

  describe('drawCards', () => {
    it('reshuffles discard pile when draw pile is empty', () => {
      const discardCards = [findCard('Mediterranean Ave'), findCard('Baltic Ave'), findCard('Park Place')]
      const state = makeState({
        drawPile: [],
        discardPile: discardCards,
      })

      const next = drawCards(state, 'player', 2)
      expect(next.player.hand).toHaveLength(2)
      expect(next.discardPile).toHaveLength(0)
      expect(next.drawPile).toHaveLength(1)
    })

    it('draws only available cards when deck is small', () => {
      const state = makeState({
        drawPile: [findCard('Mediterranean Ave')],
        discardPile: [],
      })
      const next = drawCards(state, 'player', 5)
      expect(next.player.hand).toHaveLength(1)
    })
  })

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------
  describe('canPlayCard', () => {
    it('returns valid for a playable card in play phase', () => {
      const card = findCard('Mediterranean Ave')
      const state = makeState({
        player: { hand: [card], field: [], bank: [] },
      })
      expect(canPlayCard(state, card.id)).toEqual({ valid: true })
    })

    it('rejects when not in play phase', () => {
      const card = findCard('Mediterranean Ave')
      const state = makeState({
        turnPhase: { type: 'draw' },
        player: { hand: [card], field: [], bank: [] },
      })
      expect(canPlayCard(state, card.id).valid).toBe(false)
    })

    it('rejects when no plays remaining', () => {
      const card = findCard('Mediterranean Ave')
      const state = makeState({
        turnPhase: { type: 'play', playsRemaining: 0 },
        player: { hand: [card], field: [], bank: [] },
      })
      expect(canPlayCard(state, card.id).valid).toBe(false)
    })

    it('rejects when card not in hand', () => {
      const state = makeState({
        player: { hand: [], field: [], bank: [] },
      })
      expect(canPlayCard(state, 'nonexistent').valid).toBe(false)
    })

    it('rejects Double Rent played alone', () => {
      const card = findCardById('a-dtr-1')
      const state = makeState({
        player: { hand: [card], field: [], bank: [] },
      })
      const result = canPlayCard(state, card.id)
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('Rent')
    })
  })

  describe('isCompleteSet', () => {
    it('returns true for a complete brown set (2 cards)', () => {
      const group = makeGroup('brown', ['p-brown-1', 'p-brown-2'])
      expect(isCompleteSet(group)).toBe(true)
    })

    it('returns false for an incomplete set', () => {
      const group = makeGroup('lightBlue', ['p-lb-1'])
      expect(isCompleteSet(group)).toBe(false)
    })

    it('returns true for a complete lightBlue set (3 cards)', () => {
      const group = makeGroup('lightBlue', ['p-lb-1', 'p-lb-2', 'p-lb-3'])
      expect(isCompleteSet(group)).toBe(true)
    })
  })

  describe('countCompleteSets', () => {
    it('counts multiple complete sets', () => {
      const ps: PlayerState = {
        hand: [],
        bank: [],
        field: [
          makeGroup('brown', ['p-brown-1', 'p-brown-2']),
          makeGroup('lightBlue', ['p-lb-1', 'p-lb-2', 'p-lb-3']),
          makeGroup('red', ['p-red-1']),
        ],
      }
      expect(countCompleteSets(ps)).toBe(2)
    })

    it('returns 0 when no sets complete', () => {
      const ps: PlayerState = {
        hand: [],
        bank: [],
        field: [makeGroup('red', ['p-red-1'])],
      }
      expect(countCompleteSets(ps)).toBe(0)
    })
  })

  describe('checkWinCondition', () => {
    it('returns player when player has 3 complete sets', () => {
      const state = makeState({
        player: {
          hand: [], bank: [],
          field: [
            makeGroup('brown', ['p-brown-1', 'p-brown-2']),
            makeGroup('darkBlue', ['p-db-1', 'p-db-2']),
            makeGroup('utility', ['p-util-1', 'p-util-2']),
          ],
        },
      })
      expect(checkWinCondition(state)).toBe('player')
    })

    it('returns null when neither player has 3 sets', () => {
      const state = makeState()
      expect(checkWinCondition(state)).toBeNull()
    })
  })

  describe('canPlaceBuilding', () => {
    it('allows House on a complete set without buildings', () => {
      const house = findCardById('b-house-1')
      const group = makeGroup('brown', ['p-brown-1', 'p-brown-2'])
      expect(canPlaceBuilding(house, group)).toBe(true)
    })

    it('rejects House on an incomplete set', () => {
      const house = findCardById('b-house-1')
      const group = makeGroup('red', ['p-red-1'])
      expect(canPlaceBuilding(house, group)).toBe(false)
    })

    it('allows Hotel on a set with a House', () => {
      const hotel = findCardById('b-hotel-1')
      const group: PropertyGroup = {
        ...makeGroup('brown', ['p-brown-1', 'p-brown-2']),
        buildings: [findCardById('b-house-1')],
      }
      expect(canPlaceBuilding(hotel, group)).toBe(true)
    })

    it('rejects Hotel without a House', () => {
      const hotel = findCardById('b-hotel-1')
      const group = makeGroup('brown', ['p-brown-1', 'p-brown-2'])
      expect(canPlaceBuilding(hotel, group)).toBe(false)
    })

    it('rejects second House on same set', () => {
      const house = findCardById('b-house-2')
      const group: PropertyGroup = {
        ...makeGroup('brown', ['p-brown-1', 'p-brown-2']),
        buildings: [findCardById('b-house-1')],
      }
      expect(canPlaceBuilding(house, group)).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Play actions
  // -------------------------------------------------------------------------
  describe('playPropertyToField', () => {
    it('moves card from hand to a new group on field', () => {
      const card = findCardById('p-brown-1')
      const state = makeState({
        player: { hand: [card], field: [], bank: [] },
      })

      const next = playPropertyToField(state, card.id, 'brown')
      expect(next.player.hand).toHaveLength(0)
      expect(next.player.field).toHaveLength(1)
      expect(next.player.field[0].color).toBe('brown')
      expect(next.player.field[0].cards).toHaveLength(1)
      expectCardConservation(state, next)
      expectNoDuplicateCardIds(next)
    })

    it('adds to an existing group', () => {
      const card1 = findCardById('p-brown-1')
      const card2 = findCardById('p-brown-2')
      const state = makeState({
        player: {
          hand: [card2],
          field: [{ color: 'brown', cards: [card1], buildings: [] }],
          bank: [],
        },
      })

      const next = playPropertyToField(state, card2.id, 'brown')
      expect(next.player.field).toHaveLength(1)
      expect(next.player.field[0].cards).toHaveLength(2)
    })

    it('consumes a play', () => {
      const card = findCardById('p-brown-1')
      const state = makeState({
        player: { hand: [card], field: [], bank: [] },
        turnPhase: { type: 'play', playsRemaining: 3 },
      })

      const next = playPropertyToField(state, card.id, 'brown')
      expect(next.turnPhase).toEqual({ type: 'play', playsRemaining: 2 })
    })

    it('triggers game over if completing 3rd set', () => {
      const card = findCardById('p-db-2')
      const state = makeState({
        player: {
          hand: [card],
          field: [
            makeGroup('brown', ['p-brown-1', 'p-brown-2']),
            makeGroup('utility', ['p-util-1', 'p-util-2']),
            { color: 'darkBlue', cards: [findCardById('p-db-1')], buildings: [] },
          ],
          bank: [],
        },
      })

      const next = playPropertyToField(state, card.id, 'darkBlue')
      expect(next.turnPhase.type).toBe('gameOver')
      if (next.turnPhase.type === 'gameOver') {
        expect(next.turnPhase.winner).toBe('player')
      }
    })

    it('returns state unchanged if card not in hand', () => {
      const state = makeState({
        player: { hand: [], field: [], bank: [] },
      })
      const next = playPropertyToField(state, 'nonexistent', 'brown')
      expect(next).toEqual(state)
    })
  })

  describe('bankCard', () => {
    it('moves card from hand to bank', () => {
      const card = findCard('Mediterranean Ave')
      const state = makeState({
        player: { hand: [card], field: [], bank: [] },
      })

      const next = bankCard(state, card.id)
      expect(next.player.hand).toHaveLength(0)
      expect(next.player.bank).toHaveLength(1)
      expect(next.player.bank[0].id).toBe(card.id)
      expectCardConservation(state, next)
      expectNoDuplicateCardIds(next)
    })

    it('consumes a play', () => {
      const card = findCard('Mediterranean Ave')
      const state = makeState({
        player: { hand: [card], field: [], bank: [] },
        turnPhase: { type: 'play', playsRemaining: 2 },
        playsUsedThisTurn: 1,
      })

      const next = bankCard(state, card.id)
      expect(next.turnPhase).toEqual({ type: 'play', playsRemaining: 1 })
    })
  })

  describe('playBuilding', () => {
    it('places a House on a complete set', () => {
      const house = findCardById('b-house-1')
      const state = makeState({
        player: {
          hand: [house],
          field: [makeGroup('brown', ['p-brown-1', 'p-brown-2'])],
          bank: [],
        },
      })

      const next = playBuilding(state, house.id, 'brown')
      expect(next.player.hand).toHaveLength(0)
      expect(next.player.field[0].buildings).toHaveLength(1)
      expect(next.player.field[0].buildings[0].name).toBe('House')
    })

    it('rejects building on incomplete set', () => {
      const house = findCardById('b-house-1')
      const state = makeState({
        player: {
          hand: [house],
          field: [makeGroup('red', ['p-red-1'])],
          bank: [],
        },
      })

      const next = playBuilding(state, house.id, 'red')
      expect(next).toEqual(state)
    })
  })

  describe('playPassGo', () => {
    it('draws 2 extra cards and discards Pass Go', () => {
      const passGo = findCardById('a-pg-1')
      const drawCards = [findCard('Mediterranean Ave'), findCard('Baltic Ave'), findCard('Park Place')]
      const state = makeState({
        player: { hand: [passGo], field: [], bank: [] },
        drawPile: drawCards,
      })

      const next = playPassGo(state, passGo.id)
      expect(next.player.hand).toHaveLength(2) // drew 2
      expect(next.discardPile).toHaveLength(1) // Pass Go discarded
      expect(next.discardPile[0].name).toBe('Pass Go')
      expect(next.drawPile).toHaveLength(1) // 3 - 2 drawn
      expectCardConservation(state, next)
      expectNoDuplicateCardIds(next)
    })
  })

  // -------------------------------------------------------------------------
  // Rent
  // -------------------------------------------------------------------------
  describe('calculateRent', () => {
    it('calculates rent based on properties count', () => {
      const ps: PlayerState = {
        hand: [], bank: [],
        field: [makeGroup('brown', ['p-brown-1'])],
      }
      expect(calculateRent(ps, 'brown', false)).toBe(1)
    })

    it('increases rent with more properties', () => {
      const ps: PlayerState = {
        hand: [], bank: [],
        field: [makeGroup('brown', ['p-brown-1', 'p-brown-2'])],
      }
      expect(calculateRent(ps, 'brown', false)).toBe(2)
    })

    it('adds House bonus (+3)', () => {
      const ps: PlayerState = {
        hand: [], bank: [],
        field: [{
          ...makeGroup('brown', ['p-brown-1', 'p-brown-2']),
          buildings: [findCardById('b-house-1')],
        }],
      }
      expect(calculateRent(ps, 'brown', false)).toBe(5) // 2 + 3
    })

    it('adds Hotel bonus (+4 on top of House)', () => {
      const ps: PlayerState = {
        hand: [], bank: [],
        field: [{
          ...makeGroup('brown', ['p-brown-1', 'p-brown-2']),
          buildings: [findCardById('b-house-1'), findCardById('b-hotel-1')],
        }],
      }
      expect(calculateRent(ps, 'brown', false)).toBe(9) // 2 + 3 + 4
    })

    it('doubles rent when doubled flag is true', () => {
      const ps: PlayerState = {
        hand: [], bank: [],
        field: [makeGroup('brown', ['p-brown-1', 'p-brown-2'])],
      }
      expect(calculateRent(ps, 'brown', true)).toBe(4) // 2 * 2
    })

    it('returns 0 for a color not on the field', () => {
      const ps: PlayerState = { hand: [], bank: [], field: [] }
      expect(calculateRent(ps, 'darkBlue', false)).toBe(0)
    })
  })

  describe('playRentCard / completeRentColor', () => {
    it('creates debt when playing rent for a color the player owns', () => {
      const rentCard: MonopolyCardData = {
        id: 'r-lb-br-1', type: 'rent', name: 'Rent', value: 1,
        color: 'lightBlue', color2: 'brown',
      }
      const state = makeState({
        player: {
          hand: [rentCard],
          field: [makeGroup('brown', ['p-brown-1', 'p-brown-2'])],
          bank: [],
        },
      })

      const next = playRentCard(state, rentCard.id, undefined, 'brown')
      expect(next.turnPhase.type).toBe('awaitingPayment')
      if (next.turnPhase.type === 'awaitingPayment') {
        expect(next.turnPhase.debt.amount).toBe(2) // brown with 2 props
        expect(next.turnPhase.debt.creditor).toBe('player')
        expect(next.turnPhase.debt.debtor).toBe('ai')
      }
    })

    it('transitions to awaitingRentColor for wild rent', () => {
      const wildRent: MonopolyCardData = {
        id: 'r-wild-1', type: 'rent', name: 'Wild Rent', value: 3,
      }
      const state = makeState({
        player: {
          hand: [wildRent],
          field: [makeGroup('red', ['p-red-1'])],
          bank: [],
        },
      })

      const next = playRentCard(state, wildRent.id)
      expect(next.turnPhase.type).toBe('awaitingRentColor')
    })

    it('completeRentColor resolves the rent', () => {
      const state = makeState({
        turnPhase: { type: 'awaitingRentColor', cardId: 'r-wild-1' },
        player: {
          hand: [],
          field: [makeGroup('red', ['p-red-1', 'p-red-2'])],
          bank: [],
        },
      })

      const next = completeRentColor(state, 'red')
      expect(next.turnPhase.type).toBe('awaitingPayment')
      if (next.turnPhase.type === 'awaitingPayment') {
        expect(next.turnPhase.debt.amount).toBe(3) // red with 2 props
      }
    })
  })

  // -------------------------------------------------------------------------
  // Debt / Birthday / Debt Collector
  // -------------------------------------------------------------------------
  describe('playDebtCollector', () => {
    it('creates M5 debt for opponent', () => {
      const card = findCardById('a-dc-1')
      const state = makeState({
        player: { hand: [card], field: [], bank: [] },
      })

      const next = playDebtCollector(state, card.id)
      expect(next.turnPhase.type).toBe('awaitingPayment')
      if (next.turnPhase.type === 'awaitingPayment') {
        expect(next.turnPhase.debt.amount).toBe(5)
        expect(next.turnPhase.debt.source).toBe('debtCollector')
      }
      expect(next.discardPile).toHaveLength(1)
    })
  })

  describe('playBirthday', () => {
    it('creates M2 debt for opponent', () => {
      const card = findCardById('a-bday-1')
      const state = makeState({
        player: { hand: [card], field: [], bank: [] },
      })

      const next = playBirthday(state, card.id)
      expect(next.turnPhase.type).toBe('awaitingPayment')
      if (next.turnPhase.type === 'awaitingPayment') {
        expect(next.turnPhase.debt.amount).toBe(2)
        expect(next.turnPhase.debt.source).toBe('birthday')
      }
    })
  })

  // -------------------------------------------------------------------------
  // Payment
  // -------------------------------------------------------------------------
  describe('payment flow', () => {
    let debtState: MonopolyDealState

    beforeEach(() => {
      const moneyCard = findCardById('m-5a')
      debtState = makeState({
        turnPhase: {
          type: 'awaitingPayment',
          debt: {
            creditor: 'player',
            debtor: 'ai',
            amount: 5,
            source: 'debtCollector',
            selectedPayment: [],
          },
        },
        ai: { hand: [], field: [], bank: [moneyCard] },
      })
    })

    it('togglePaymentCard adds/removes card from selection', () => {
      const next = togglePaymentCard(debtState, 'm-5a')
      if (next.turnPhase.type === 'awaitingPayment') {
        expect(next.turnPhase.debt.selectedPayment).toContain('m-5a')
      }

      const toggled = togglePaymentCard(next, 'm-5a')
      if (toggled.turnPhase.type === 'awaitingPayment') {
        expect(toggled.turnPhase.debt.selectedPayment).not.toContain('m-5a')
      }
    })

    it('confirmPayment transfers cards from debtor to creditor', () => {
      const withSelection = togglePaymentCard(debtState, 'm-5a')
      const next = confirmPayment(withSelection)

      expect(next.ai.bank).toHaveLength(0)
      expect(next.player.bank).toHaveLength(1)
      expect(next.player.bank[0].id).toBe('m-5a')
      expect(next.turnPhase.type).toBe('play')
      expectCardConservation(withSelection, next)
      expectNoDuplicateCardIds(next)
    })

    it('auto-completes payment when debtor has nothing', () => {
      const emptyState = makeState({
        turnPhase: {
          type: 'awaitingPayment',
          debt: {
            creditor: 'player',
            debtor: 'ai',
            amount: 5,
            source: 'debtCollector',
            selectedPayment: [],
          },
        },
        ai: { hand: [], field: [], bank: [] },
      })

      const next = confirmPayment(emptyState)
      expect(next.turnPhase.type).toBe('play')
    })

    it('rejects insufficient payment when debtor has more assets', () => {
      const moneyCard1 = findCardById('m-1a')
      const moneyCard5 = findCardById('m-5a')
      const state = makeState({
        turnPhase: {
          type: 'awaitingPayment',
          debt: {
            creditor: 'player',
            debtor: 'ai',
            amount: 5,
            source: 'debtCollector',
            selectedPayment: ['m-1a'], // only M1 selected, need M5
          },
        },
        ai: { hand: [], field: [], bank: [moneyCard1, moneyCard5] },
      })

      const next = confirmPayment(state)
      // Should remain in awaitingPayment since not enough paid
      expect(next.turnPhase.type).toBe('awaitingPayment')
    })
  })

  describe('getPayableCards', () => {
    it('includes bank cards and field cards', () => {
      const ps: PlayerState = {
        hand: [findCard('Pass Go')], // hand is NOT payable
        bank: [findCardById('m-5a')],
        field: [makeGroup('brown', ['p-brown-1'])],
      }
      const payable = getPayableCards(ps)
      expect(payable).toHaveLength(2) // 1 bank + 1 field
      expect(payable.find((c) => c.id === 'm-5a')).toBeDefined()
      expect(payable.find((c) => c.id === 'p-brown-1')).toBeDefined()
    })

    it('excludes JSN in hand from payable cards (JSN in hand is a blocker, not money)', () => {
      const ps: PlayerState = {
        hand: [findCardById('a-jsn-1')],
        bank: [findCardById('m-2a')],
        field: [],
      }
      const payable = getPayableCards(ps)
      expect(payable).toHaveLength(1)
      expect(payable[0].id).toBe('m-2a')
      expect(payable.find((c) => c.id === 'a-jsn-1')).toBeUndefined()
    })

    it('includes banked JSN as payable money (not as a blocker)', () => {
      const jsnCard = findCardById('a-jsn-1')
      const ps: PlayerState = {
        hand: [],
        bank: [jsnCard, findCardById('m-1a')],
        field: [],
      }
      const payable = getPayableCards(ps)
      expect(payable).toHaveLength(2)
      expect(payable.find((c) => c.id === 'a-jsn-1')).toBeDefined()
    })
  })

  describe('useJSNDuringPayment', () => {
    it('rejects JSN from bank — banked JSN cannot be used as a blocker', () => {
      const state = makeState({
        currentTurn: 'ai',
        playsUsedThisTurn: 1,
        turnPhase: {
          type: 'awaitingPayment',
          debt: {
            creditor: 'ai',
            debtor: 'player',
            amount: 5,
            source: 'debtCollector',
            selectedPayment: [],
          },
        },
        player: { hand: [], field: [], bank: [findCardById('a-jsn-1')] },
        ai: { hand: [], field: [], bank: [] },
      })

      const next = useJSNDuringPayment(state, 'a-jsn-1')

      // State should be unchanged — banked JSN cannot block
      expect(next.turnPhase.type).toBe('awaitingPayment')
      expect(next.player.bank).toHaveLength(1)
      expect(next.player.bank[0].id).toBe('a-jsn-1')
    })

    it('blocks payment and returns to play when creditor has no JSN', () => {
      const state = makeState({
        currentTurn: 'ai',
        playsUsedThisTurn: 1,
        turnPhase: {
          type: 'awaitingPayment',
          debt: {
            creditor: 'ai',
            debtor: 'player',
            amount: 5,
            source: 'debtCollector',
            selectedPayment: [],
          },
        },
        player: { hand: [findCardById('a-jsn-1')], field: [], bank: [] },
        ai: { hand: [], field: [], bank: [] },
      })

      const next = useJSNDuringPayment(state, 'a-jsn-1')

      expect(next.turnPhase.type).toBe('play')
      expect(next.player.hand).toHaveLength(0)
      expect(next.discardPile.some((c) => c.id === 'a-jsn-1')).toBe(true)
    })

    it('starts JSN chain when creditor has JSN', () => {
      const state = makeState({
        currentTurn: 'ai',
        playsUsedThisTurn: 1,
        turnPhase: {
          type: 'awaitingPayment',
          debt: {
            creditor: 'ai',
            debtor: 'player',
            amount: 5,
            source: 'debtCollector',
            selectedPayment: [],
          },
        },
        player: { hand: [findCardById('a-jsn-1')], field: [], bank: [] },
        ai: { hand: [findCardById('a-jsn-2')], field: [], bank: [] },
      })

      const next = useJSNDuringPayment(state, 'a-jsn-1')

      expect(next.turnPhase.type).toBe('awaitingJSN')
      if (next.turnPhase.type === 'awaitingJSN') {
        expect(next.turnPhase.jsnChain.currentDecider).toBe('ai')
        expect(next.turnPhase.jsnChain.chain).toHaveLength(1)
        expect(next.turnPhase.jsnChain.originalAction.debtAmount).toBe(5)
        expect(next.turnPhase.jsnChain.originalAction.debtSource).toBe('debtCollector')
      }
    })

    it('JSN chain resolution recreates debt when action proceeds', () => {
      const state = makeState({
        currentTurn: 'ai',
        playsUsedThisTurn: 1,
        turnPhase: {
          type: 'awaitingPayment',
          debt: {
            creditor: 'ai',
            debtor: 'player',
            amount: 5,
            source: 'debtCollector',
            selectedPayment: [],
          },
        },
        player: { hand: [findCardById('a-jsn-1')], field: [], bank: [] },
        ai: { hand: [findCardById('a-jsn-2')], field: [], bank: [] },
      })

      // Player uses JSN → starts chain
      let s = useJSNDuringPayment(state, 'a-jsn-1')
      expect(s.turnPhase.type).toBe('awaitingJSN')

      // AI counters with JSN → chain length 2 (even = action proceeds)
      s = playJustSayNo(s, 'a-jsn-2')
      expect(s.turnPhase.type).toBe('awaitingJSN')

      // Player accepts → action proceeds → back to awaitingPayment
      s = acceptJSNOutcome(s)
      expect(s.turnPhase.type).toBe('awaitingPayment')
      if (s.turnPhase.type === 'awaitingPayment') {
        expect(s.turnPhase.debt.amount).toBe(5)
        expect(s.turnPhase.debt.source).toBe('debtCollector')
      }
    })

    it('does nothing when phase is not awaitingPayment', () => {
      const state = makeState({
        turnPhase: { type: 'play', playsRemaining: 3 },
        player: { hand: [findCardById('a-jsn-1')], field: [], bank: [] },
      })

      const next = useJSNDuringPayment(state, 'a-jsn-1')
      expect(next).toBe(state)
    })

    it('money charges skip JSN modal and go straight to payment', () => {
      // Debt Collector with opponent having JSN — should still go to awaitingPayment
      const dcCard = findCardById('a-dc-1')
      const state = makeState({
        currentTurn: 'player',
        turnPhase: { type: 'play', playsRemaining: 3 },
        player: { hand: [dcCard], field: [], bank: [] },
        ai: { hand: [findCardById('a-jsn-1')], field: [], bank: [findCardById('m-5a')] },
      })

      const next = playDebtCollector(state, 'a-dc-1')
      // Should go directly to awaitingPayment (NOT awaitingJSN)
      expect(next.turnPhase.type).toBe('awaitingPayment')
    })
  })

  describe('getSelectedPaymentValue', () => {
    it('sums values of selected cards', () => {
      const ps: PlayerState = {
        hand: [],
        bank: [findCardById('m-5a'), findCardById('m-2a')],
        field: [],
      }
      expect(getSelectedPaymentValue(ps, ['m-5a', 'm-2a'])).toBe(7)
    })

    it('does not count JSN in hand toward payment value', () => {
      const ps: PlayerState = {
        hand: [findCardById('a-jsn-1')], // JSN worth M4M but in hand
        bank: [findCardById('m-2a')],
        field: [],
      }
      // Even if someone passes the JSN id, getSelectedPaymentValue only looks at payable (bank+field)
      expect(getSelectedPaymentValue(ps, ['a-jsn-1', 'm-2a'])).toBe(2)
    })
  })

  describe('getPlayerTotalValue', () => {
    it('sums bank and field values', () => {
      const ps: PlayerState = {
        hand: [],
        bank: [findCardById('m-5a')],
        field: [{
          ...makeGroup('brown', ['p-brown-1', 'p-brown-2']),
          buildings: [findCardById('b-house-1')],
        }],
      }
      // m-5a(5) + p-brown-1(1) + p-brown-2(1) + b-house-1(3) = 10
      expect(getPlayerTotalValue(ps)).toBe(10)
    })
  })

  describe('invariant stress checks', () => {
    it('maintains card conservation and uniqueness across randomized payment scenarios', () => {
      const random = createSeededRandom(20260226)
      const bankPool = ['m-1a', 'm-1b', 'm-2a', 'm-2b', 'm-3a', 'm-4a', 'm-5a', 'm-10']
      const redPool = ['p-red-1', 'p-red-2', 'p-red-3']
      const brownPool = ['p-brown-1', 'p-brown-2']
      const lightBluePool = ['p-lb-1', 'p-lb-2', 'p-lb-3']
      const buildingPool = ['b-house-1', 'b-house-2', 'b-hotel-1']

      for (let trial = 0; trial < 40; trial++) {
        const bankCards = pickUnique(bankPool, 2 + Math.floor(random() * 4), random).map(findCardById)
        const redCards = pickUnique(redPool, 1 + Math.floor(random() * 3), random)
        const brownCards = pickUnique(brownPool, 1 + Math.floor(random() * 2), random)
        const lightBlueCards = pickUnique(lightBluePool, 1 + Math.floor(random() * 3), random)

        const field: PropertyGroup[] = []
        if (redCards.length > 0) {
          field.push({ color: 'red', cards: redCards.map(findCardById), buildings: [] })
        }
        if (brownCards.length > 0) {
          field.push({ color: 'brown', cards: brownCards.map(findCardById), buildings: [] })
        }
        if (lightBlueCards.length > 0) {
          field.push({ color: 'lightBlue', cards: lightBlueCards.map(findCardById), buildings: [] })
        }

        let buildingIndex = 0
        for (const group of field) {
          if (
            group.cards.length >= SET_SIZE[group.color]
            && random() < 0.5
            && buildingIndex < buildingPool.length
          ) {
            group.buildings.push(findCardById(buildingPool[buildingIndex]))
            buildingIndex++
          }
        }

        const debtor: PlayerState = { hand: [], bank: bankCards, field }
        const creditor: PlayerState = { hand: [], bank: [findCardById('m-5b')], field: [] }
        const payableIds = getPayableCards(debtor).map((c) => c.id)
        const selectedPayment = pickUnique(
          payableIds,
          Math.floor(random() * (payableIds.length + 1)),
          random,
        )
        const amount = 1 + Math.floor(random() * 12)

        const state = makeState({
          player: debtor,
          ai: creditor,
          turnPhase: {
            type: 'awaitingPayment',
            debt: {
              creditor: 'ai',
              debtor: 'player',
              amount,
              source: 'rent',
              selectedPayment,
            },
          },
        })

        expectNoDuplicateCardIds(state)
        const next = confirmPayment(state)
        expectCardConservation(state, next)
        expectNoDuplicateCardIds(next)
      }
    })

    it('maintains card conservation and uniqueness across randomized play operations', () => {
      const random = createSeededRandom(20480315)
      const handPool = [
        'p-red-1', 'p-red-2', 'p-red-3',
        'p-lb-1', 'p-lb-2', 'p-lb-3',
        'p-db-1', 'p-db-2',
        'm-1a', 'm-2a', 'm-3a', 'm-5a',
        'a-pg-1', 'a-pg-2',
        'w-br-lb', 'w-rainbow-1',
        'b-house-1', 'b-hotel-1',
      ]
      const drawPool = [
        'm-1b', 'm-1c', 'm-2b', 'm-4a',
        'a-pg-3', 'a-pg-4', 'w-rainbow-2',
        'p-ora-1', 'p-ora-2', 'p-ora-3',
      ]
      const buildTargets: PropertyColor[] = ['brown', 'red', 'lightBlue', 'darkBlue']

      for (let trial = 0; trial < 30; trial++) {
        const handIds = pickUnique(handPool, 6 + Math.floor(random() * 4), random)
        const drawIds = pickUnique(drawPool, 4 + Math.floor(random() * 3), random)
        let state = makeState({
          currentTurn: 'player',
          turnPhase: { type: 'play', playsRemaining: 3 },
          drawPile: drawIds.map(findCardById),
          player: {
            hand: handIds.map(findCardById),
            bank: [findCardById('m-1f')],
            field: [makeGroup('brown', ['p-brown-1', 'p-brown-2'])],
          },
        })

        expectNoDuplicateCardIds(state)

        for (let step = 0; step < 20; step++) {
          const before = state
          const hand = before.player.hand
          const op = Math.floor(random() * 4)
          let next = before

          if (op === 0 && hand.length > 0) {
            const selected = hand[Math.floor(random() * hand.length)]
            next = bankCard(before, selected.id)
          } else if (op === 1) {
            const propertyCandidates = hand.filter((c) => c.type === 'property' || c.type === 'wild')
            if (propertyCandidates.length > 0) {
              const selected = propertyCandidates[Math.floor(random() * propertyCandidates.length)]
              let targetColor: PropertyColor = 'brown'
              if (selected.type === 'property' && selected.color) {
                targetColor = selected.color
              } else if (selected.color && selected.color2) {
                targetColor = random() < 0.5 ? selected.color : selected.color2
              } else if (selected.color) {
                targetColor = selected.color
              }
              next = playPropertyToField(before, selected.id, targetColor)
            }
          } else if (op === 2) {
            const buildingCandidates = hand.filter((c) => c.type === 'building')
            if (buildingCandidates.length > 0) {
              const selected = buildingCandidates[Math.floor(random() * buildingCandidates.length)]
              const targetColor = buildTargets[Math.floor(random() * buildTargets.length)]
              next = playBuilding(before, selected.id, targetColor)
            }
          } else if (op === 3) {
            const passGo = hand.find((c) => c.name === 'Pass Go')
            if (passGo) next = playPassGo(before, passGo.id)
          }

          expectCardConservation(before, next)
          expectNoDuplicateCardIds(next)
          state = next
        }
      }
    })
  })

  // -------------------------------------------------------------------------
  // Steal / Swap
  // -------------------------------------------------------------------------
  describe('getStealableProperties', () => {
    it('returns cards from incomplete sets only', () => {
      const ps: PlayerState = {
        hand: [], bank: [],
        field: [
          makeGroup('brown', ['p-brown-1', 'p-brown-2']), // complete
          makeGroup('red', ['p-red-1']), // incomplete
        ],
      }
      const stealable = getStealableProperties(ps)
      expect(stealable).toHaveLength(1)
      expect(stealable[0].card.id).toBe('p-red-1')
      expect(stealable[0].groupColor).toBe('red')
    })
  })

  describe('getCompleteSetColors', () => {
    it('returns colors of complete sets', () => {
      const ps: PlayerState = {
        hand: [], bank: [],
        field: [
          makeGroup('brown', ['p-brown-1', 'p-brown-2']),
          makeGroup('red', ['p-red-1']),
        ],
      }
      expect(getCompleteSetColors(ps)).toEqual(['brown'])
    })
  })

  describe('Sly Deal', () => {
    it('transitions to target selection', () => {
      const card = findCardById('a-sly-1')
      const state = makeState({
        player: { hand: [card], field: [], bank: [] },
        ai: {
          hand: [],
          field: [makeGroup('red', ['p-red-1'])], // incomplete = stealable
          bank: [],
        },
      })

      const next = playSlyDeal(state, card.id)
      expect(next.turnPhase.type).toBe('awaitingSlyDealTarget')
      expect(next.player.hand).toHaveLength(0)
      expect(next.discardPile).toHaveLength(1)
    })

    it('does nothing when no stealable properties', () => {
      const card = findCardById('a-sly-1')
      const state = makeState({
        player: { hand: [card], field: [], bank: [] },
        ai: {
          hand: [],
          field: [makeGroup('brown', ['p-brown-1', 'p-brown-2'])], // complete
          bank: [],
        },
      })

      const next = playSlyDeal(state, card.id)
      expect(next).toEqual(state)
    })

    it('completeSlyDeal moves card to player field', () => {
      const state = makeState({
        turnPhase: { type: 'awaitingSlyDealTarget' },
        playsUsedThisTurn: 1,
        ai: {
          hand: [],
          field: [makeGroup('red', ['p-red-1', 'p-red-2'])],
          bank: [],
        },
        player: { hand: [], field: [], bank: [] },
      })

      const next = completeSlyDeal(state, 'p-red-1')
      expect(next.player.field).toHaveLength(1)
      expect(next.player.field[0].cards[0].id).toBe('p-red-1')
      expect(next.ai.field[0].cards).toHaveLength(1)
      expect(next.turnPhase.type).toBe('play')
      expectCardConservation(state, next)
      expectNoDuplicateCardIds(next)
    })
  })

  describe('Forced Deal', () => {
    it('transitions to give phase', () => {
      const card = findCardById('a-fd-1')
      const state = makeState({
        player: { hand: [card], field: [makeGroup('brown', ['p-brown-1'])], bank: [] },
        ai: { hand: [], field: [makeGroup('red', ['p-red-1'])], bank: [] },
      })

      const next = playForcedDeal(state, card.id)
      expect(next.turnPhase.type).toBe('awaitingForcedDealSelect')
      if (next.turnPhase.type === 'awaitingForcedDealSelect') {
        expect(next.turnPhase.phase).toBe('give')
      }
    })

    it('does nothing when current player has no stealable properties to give', () => {
      const card = findCardById('a-fd-1')
      const state = makeState({
        player: { hand: [card], field: [makeGroup('brown', ['p-brown-1', 'p-brown-2'])], bank: [] },
        ai: { hand: [], field: [makeGroup('red', ['p-red-1'])], bank: [] },
      })

      const next = playForcedDeal(state, card.id)
      expect(next).toEqual(state)
    })

    it('does nothing when opponent has no stealable properties to take', () => {
      const card = findCardById('a-fd-1')
      const state = makeState({
        player: { hand: [card], field: [makeGroup('brown', ['p-brown-1'])], bank: [] },
        ai: { hand: [], field: [makeGroup('red', ['p-red-1', 'p-red-2', 'p-red-3'])], bank: [] },
      })

      const next = playForcedDeal(state, card.id)
      expect(next).toEqual(state)
    })

    it('completeForcedDeal swaps properties', () => {
      const state = makeState({
        turnPhase: { type: 'awaitingForcedDealSelect', phase: 'give' },
        playsUsedThisTurn: 1,
        player: {
          hand: [],
          field: [makeGroup('brown', ['p-brown-1'])],
          bank: [],
        },
        ai: {
          hand: [],
          field: [makeGroup('red', ['p-red-1'])],
          bank: [],
        },
      })

      const next = completeForcedDeal(state, 'p-brown-1', 'p-red-1')
      // Player should now have red, AI should have brown
      expect(next.player.field.find((g) => g.color === 'red')?.cards[0].id).toBe('p-red-1')
      expect(next.ai.field.find((g) => g.color === 'brown')?.cards[0].id).toBe('p-brown-1')
      expectCardConservation(state, next)
      expectNoDuplicateCardIds(next)
    })

    it('completeForcedDeal rejects giving a card from a complete set', () => {
      const state = makeState({
        turnPhase: { type: 'awaitingForcedDealSelect', phase: 'give' },
        playsUsedThisTurn: 1,
        player: {
          hand: [],
          field: [makeGroup('brown', ['p-brown-1', 'p-brown-2'])],
          bank: [],
        },
        ai: {
          hand: [],
          field: [makeGroup('red', ['p-red-1'])],
          bank: [],
        },
      })

      const next = completeForcedDeal(state, 'p-brown-1', 'p-red-1')
      expect(next).toEqual(state)
    })
  })

  describe('Deal Breaker', () => {
    it('auto-completes when opponent has exactly one complete set', () => {
      const card = findCardById('a-db-1')
      const state = makeState({
        player: { hand: [card], field: [], bank: [] },
        ai: {
          hand: [],
          field: [makeGroup('brown', ['p-brown-1', 'p-brown-2'])],
          bank: [],
        },
      })

      const next = playDealBreaker(state, card.id)
      // Should auto-steal the only complete set
      expect(next.turnPhase.type).toBe('play')
      expect(next.player.field.some((g) => g.color === 'brown')).toBe(true)
      expect(next.ai.field.some((g) => g.color === 'brown')).toBe(false)
    })

    it('transitions to target selection when opponent has multiple complete sets', () => {
      const card = findCardById('a-db-1')
      const state = makeState({
        player: { hand: [card], field: [], bank: [] },
        ai: {
          hand: [],
          field: [
            makeGroup('brown', ['p-brown-1', 'p-brown-2']),
            makeGroup('darkBlue', ['p-db-1', 'p-db-2']),
          ],
          bank: [],
        },
      })

      const next = playDealBreaker(state, card.id)
      expect(next.turnPhase.type).toBe('awaitingDealBreakerTarget')
    })

    it('does nothing when opponent has no complete sets', () => {
      const card = findCardById('a-db-1')
      const state = makeState({
        player: { hand: [card], field: [], bank: [] },
        ai: {
          hand: [],
          field: [makeGroup('red', ['p-red-1'])],
          bank: [],
        },
      })

      const next = playDealBreaker(state, card.id)
      expect(next).toEqual(state)
    })

    it('completeDealBreaker steals entire set with buildings', () => {
      const state = makeState({
        turnPhase: { type: 'awaitingDealBreakerTarget' },
        playsUsedThisTurn: 1,
        ai: {
          hand: [],
          field: [{
            ...makeGroup('brown', ['p-brown-1', 'p-brown-2']),
            buildings: [findCardById('b-house-1')],
          }],
          bank: [],
        },
        player: { hand: [], field: [], bank: [] },
      })

      const next = completeDealBreaker(state, 'brown')
      expect(next.player.field).toHaveLength(1)
      expect(next.player.field[0].color).toBe('brown')
      expect(next.player.field[0].cards).toHaveLength(2)
      expect(next.player.field[0].buildings).toHaveLength(1)
      expect(next.ai.field).toHaveLength(0)
      expectCardConservation(state, next)
      expectNoDuplicateCardIds(next)
    })

    it('completeDealBreaker keeps stolen set separate from existing same-color group', () => {
      const myDarkBlue = { ...findCardById('p-db-1'), id: 'p-db-mine' }
      const oppDarkBlue1 = { ...findCardById('p-db-1'), id: 'p-db-opp-1' }
      const oppDarkBlue2 = { ...findCardById('p-db-2'), id: 'p-db-opp-2' }

      const state = makeState({
        turnPhase: { type: 'awaitingDealBreakerTarget' },
        playsUsedThisTurn: 1,
        player: {
          hand: [],
          field: [{
            color: 'darkBlue',
            cards: [myDarkBlue],
            buildings: [],
          }],
          bank: [],
        },
        ai: {
          hand: [],
          field: [{
            color: 'darkBlue',
            cards: [oppDarkBlue1, oppDarkBlue2],
            buildings: [findCardById('b-house-1')],
          }],
          bank: [],
        },
      })

      const next = completeDealBreaker(state, 'darkBlue')
      const darkBlueGroups = next.player.field.filter((g) => g.color === 'darkBlue')
      // Stolen complete set stays as separate group — no merging
      expect(darkBlueGroups).toHaveLength(2)
      // Original incomplete group untouched
      expect(darkBlueGroups[0].cards).toHaveLength(1)
      expect(darkBlueGroups[0].cards[0].id).toBe('p-db-mine')
      // Stolen group intact with buildings
      expect(darkBlueGroups[1].cards).toHaveLength(2)
      expect(darkBlueGroups[1].buildings).toHaveLength(1)
      expect(next.ai.field).toHaveLength(0)
      expectCardConservation(state, next)
      expectNoDuplicateCardIds(next)
    })

    it('completeDealBreaker with pink: stolen 3-card set stays separate from existing 2 pink cards', () => {
      const myPink1 = { ...findCardById('p-pink-1'), id: 'p-pink-mine-1' }
      const myPink2 = { ...findCardById('p-pink-2'), id: 'p-pink-mine-2' }
      const oppPink1 = { ...findCardById('p-pink-1'), id: 'p-pink-opp-1' }
      const oppPink2 = { ...findCardById('p-pink-2'), id: 'p-pink-opp-2' }
      const oppPink3 = { ...findCardById('p-pink-3'), id: 'p-pink-opp-3' }

      const state = makeState({
        turnPhase: { type: 'awaitingDealBreakerTarget' },
        playsUsedThisTurn: 1,
        player: {
          hand: [],
          field: [{ color: 'pink', cards: [myPink1, myPink2], buildings: [] }],
          bank: [],
        },
        ai: {
          hand: [],
          field: [{ color: 'pink', cards: [oppPink1, oppPink2, oppPink3], buildings: [] }],
          bank: [],
        },
      })

      const next = completeDealBreaker(state, 'pink')
      const pinkGroups = next.player.field.filter((g) => g.color === 'pink')
      // Two separate pink groups, not one merged 5-card group
      expect(pinkGroups).toHaveLength(2)
      expect(pinkGroups[0].cards).toHaveLength(2)
      expect(pinkGroups[1].cards).toHaveLength(3)
      expect(next.ai.field).toHaveLength(0)
      expectCardConservation(state, next)
      expectNoDuplicateCardIds(next)
    })

    it('completeDealBreaker adds stolen set normally when no existing same-color group', () => {
      const oppRed1 = { ...findCardById('p-red-1'), id: 'p-red-opp-1' }
      const oppRed2 = { ...findCardById('p-red-2'), id: 'p-red-opp-2' }
      const oppRed3 = { ...findCardById('p-red-3'), id: 'p-red-opp-3' }

      const state = makeState({
        turnPhase: { type: 'awaitingDealBreakerTarget' },
        playsUsedThisTurn: 1,
        player: {
          hand: [],
          field: [makeGroup('brown', ['p-brown-1', 'p-brown-2'])],
          bank: [],
        },
        ai: {
          hand: [],
          field: [{ color: 'red', cards: [oppRed1, oppRed2, oppRed3], buildings: [] }],
          bank: [],
        },
      })

      const next = completeDealBreaker(state, 'red')
      // Red group added to field alongside existing brown
      expect(next.player.field).toHaveLength(2)
      expect(next.player.field.find((g) => g.color === 'red')?.cards).toHaveLength(3)
      expect(next.player.field.find((g) => g.color === 'brown')?.cards).toHaveLength(2)
      expect(next.ai.field).toHaveLength(0)
      expectCardConservation(state, next)
    })

    it('completeDealBreaker preserves buildings on stolen set kept separate', () => {
      const myGreen = { ...findCardById('p-grn-1'), id: 'p-grn-mine' }
      const oppGreen1 = { ...findCardById('p-grn-1'), id: 'p-grn-opp-1' }
      const oppGreen2 = { ...findCardById('p-grn-2'), id: 'p-grn-opp-2' }
      const oppGreen3 = { ...findCardById('p-grn-3'), id: 'p-grn-opp-3' }
      const house = { ...findCardById('b-house-1'), id: 'b-house-stolen' }
      const hotel = { ...findCardById('b-hotel-1'), id: 'b-hotel-stolen' }

      const state = makeState({
        turnPhase: { type: 'awaitingDealBreakerTarget' },
        playsUsedThisTurn: 1,
        player: {
          hand: [],
          field: [{ color: 'green', cards: [myGreen], buildings: [] }],
          bank: [],
        },
        ai: {
          hand: [],
          field: [{ color: 'green', cards: [oppGreen1, oppGreen2, oppGreen3], buildings: [house, hotel] }],
          bank: [],
        },
      })

      const next = completeDealBreaker(state, 'green')
      const greenGroups = next.player.field.filter((g) => g.color === 'green')
      expect(greenGroups).toHaveLength(2)
      // Original group has no buildings
      expect(greenGroups[0].buildings).toHaveLength(0)
      // Stolen group keeps both house and hotel
      expect(greenGroups[1].buildings).toHaveLength(2)
      expect(greenGroups[1].buildings.map((b) => b.name)).toContain('House')
      expect(greenGroups[1].buildings.map((b) => b.name)).toContain('Hotel')
      expectCardConservation(state, next)
    })

    it('completeDealBreaker triggers win when stolen set is the 3rd complete set', () => {
      const state = makeState({
        turnPhase: { type: 'awaitingDealBreakerTarget' },
        playsUsedThisTurn: 1,
        player: {
          hand: [],
          field: [
            makeGroup('brown', ['p-brown-1', 'p-brown-2']),
            makeGroup('darkBlue', ['p-db-1', 'p-db-2']),
          ],
          bank: [],
        },
        ai: {
          hand: [],
          field: [makeGroup('utility', ['p-util-1', 'p-util-2'])],
          bank: [],
        },
      })

      const next = completeDealBreaker(state, 'utility')
      expect(next.turnPhase.type).toBe('gameOver')
      expect((next.turnPhase as { winner: string }).winner).toBe('player')
    })

    it('completeDealBreaker does not mutate original stolen group', () => {
      const oppBrown1 = { ...findCardById('p-brown-1'), id: 'p-brown-opp-1' }
      const oppBrown2 = { ...findCardById('p-brown-2'), id: 'p-brown-opp-2' }
      const stolenGroupCards = [oppBrown1, oppBrown2]
      const house = findCardById('b-house-1')

      const state = makeState({
        turnPhase: { type: 'awaitingDealBreakerTarget' },
        playsUsedThisTurn: 1,
        player: { hand: [], field: [], bank: [] },
        ai: {
          hand: [],
          field: [{ color: 'brown', cards: stolenGroupCards, buildings: [house] }],
          bank: [],
        },
      })

      const next = completeDealBreaker(state, 'brown')
      // Modifying the result should not affect the original state
      next.player.field[0].cards.push(findCardById('p-brown-1'))
      expect(state.ai.field[0].cards).toHaveLength(2)
      expect(stolenGroupCards).toHaveLength(2)
    })

    it('completeDealBreaker only steals from opponent, leaves other opponent groups intact', () => {
      const state = makeState({
        turnPhase: { type: 'awaitingDealBreakerTarget' },
        playsUsedThisTurn: 1,
        player: { hand: [], field: [], bank: [] },
        ai: {
          hand: [],
          field: [
            makeGroup('brown', ['p-brown-1', 'p-brown-2']),
            makeGroup('red', ['p-red-1', 'p-red-2', 'p-red-3']),
            makeGroup('utility', ['p-util-1', 'p-util-2']),
          ],
          bank: [],
        },
      })

      const next = completeDealBreaker(state, 'red')
      // Player gets red
      expect(next.player.field).toHaveLength(1)
      expect(next.player.field[0].color).toBe('red')
      // AI keeps brown and utility
      expect(next.ai.field).toHaveLength(2)
      expect(next.ai.field.map((g) => g.color)).toContain('brown')
      expect(next.ai.field.map((g) => g.color)).toContain('utility')
      expectCardConservation(state, next)
    })

    it('completeDealBreaker resumes play phase with correct remaining plays', () => {
      const state = makeState({
        turnPhase: { type: 'awaitingDealBreakerTarget' },
        playsUsedThisTurn: 2,
        player: { hand: [], field: [], bank: [] },
        ai: {
          hand: [],
          field: [makeGroup('brown', ['p-brown-1', 'p-brown-2'])],
          bank: [],
        },
      })

      const next = completeDealBreaker(state, 'brown')
      expect(next.turnPhase.type).toBe('play')
      expect((next.turnPhase as { playsRemaining: number }).playsRemaining).toBe(1)
    })
  })

  // -------------------------------------------------------------------------
  // Just Say No
  // -------------------------------------------------------------------------
  describe('Just Say No chain', () => {
    const jsnCard1 = findCardById('a-jsn-1')

    it('initiateJSN starts a chain', () => {
      const state = makeState({
        ai: { hand: [jsnCard1], field: [], bank: [] },
      })

      const pendingAction = {
        actionCard: findCardById('a-dc-1'),
        sourcePlayer: 'player' as const,
      }

      const next = initiateJSN(state, pendingAction)
      expect(next.turnPhase.type).toBe('awaitingJSN')
      if (next.turnPhase.type === 'awaitingJSN') {
        expect(next.turnPhase.jsnChain.currentDecider).toBe('ai')
      }
    })

    it('playJustSayNo adds to chain and switches decider', () => {
      const state = makeState({
        turnPhase: {
          type: 'awaitingJSN',
          jsnChain: {
            originalAction: { actionCard: findCardById('a-dc-1'), sourcePlayer: 'player' },
            chain: [],
            currentDecider: 'ai',
          },
        },
        ai: { hand: [jsnCard1], field: [], bank: [] },
      })

      const next = playJustSayNo(state, jsnCard1.id)
      if (next.turnPhase.type === 'awaitingJSN') {
        expect(next.turnPhase.jsnChain.chain).toHaveLength(1)
        expect(next.turnPhase.jsnChain.currentDecider).toBe('player')
      }
      expect(next.ai.hand).toHaveLength(0)
      expect(next.discardPile).toHaveLength(1)
    })

    it('acceptJSNOutcome blocks action when chain has odd length', () => {
      const state = makeState({
        turnPhase: {
          type: 'awaitingJSN',
          jsnChain: {
            originalAction: { actionCard: findCardById('a-dc-1'), sourcePlayer: 'player' },
            chain: [{ player: 'ai', jsnCardId: 'a-jsn-1' }], // 1 JSN = blocked
            currentDecider: 'player',
          },
        },
        playsUsedThisTurn: 1,
      })

      const next = acceptJSNOutcome(state)
      expect(next.turnPhase.type).toBe('play') // action was blocked
    })

    it('acceptJSNOutcome proceeds with action when chain has even length', () => {
      const state = makeState({
        turnPhase: {
          type: 'awaitingJSN',
          jsnChain: {
            originalAction: { actionCard: findCardById('a-dc-1'), sourcePlayer: 'player' },
            chain: [
              { player: 'ai', jsnCardId: 'a-jsn-1' },
              { player: 'player', jsnCardId: 'a-jsn-2' },
            ], // 2 JSN = action proceeds
            currentDecider: 'ai',
          },
        },
        playsUsedThisTurn: 1,
      })

      const next = acceptJSNOutcome(state)
      expect(next.turnPhase.type).toBe('awaitingPayment') // Debt Collector proceeds
    })
  })

  // -------------------------------------------------------------------------
  // Turn management
  // -------------------------------------------------------------------------
  describe('endPlayPhase', () => {
    it('switches turn when hand is 7 or fewer', () => {
      const state = makeState({
        currentTurn: 'player',
        player: { hand: Array(5).fill(findCard('Mediterranean Ave')), field: [], bank: [] },
      })

      const next = endPlayPhase(state)
      expect(next.currentTurn).toBe('ai')
      expect(next.turnPhase).toEqual({ type: 'draw' })
      expect(next.turnNumber).toBe(2)
    })

    it('forces discard when hand exceeds 7', () => {
      const cards = Array(9).fill(null).map((_, i) => ({
        ...findCard('Mediterranean Ave'),
        id: `temp-${i}`,
      }))
      const state = makeState({
        player: { hand: cards, field: [], bank: [] },
      })

      const next = endPlayPhase(state)
      expect(next.turnPhase.type).toBe('discard')
      if (next.turnPhase.type === 'discard') {
        expect(next.turnPhase.mustDiscard).toBe(2) // 9 - 7
      }
    })
  })

  describe('discardCards', () => {
    it('discards selected cards and switches turn when at 7', () => {
      const cards = Array(8).fill(null).map((_, i) => ({
        ...findCard('Mediterranean Ave'),
        id: `temp-${i}`,
      }))
      const state = makeState({
        turnPhase: { type: 'discard', mustDiscard: 1 },
        player: { hand: cards, field: [], bank: [] },
      })

      const next = discardCards(state, ['temp-0'])
      expect(next.player.hand).toHaveLength(7)
      expect(next.discardPile).toHaveLength(1)
      expect(next.currentTurn).toBe('ai') // switched turns
      expectCardConservation(state, next)
      expectNoDuplicateCardIds(next)
    })

    it('stays in discard phase when still over 7', () => {
      const cards = Array(10).fill(null).map((_, i) => ({
        ...findCard('Mediterranean Ave'),
        id: `temp-${i}`,
      }))
      const state = makeState({
        turnPhase: { type: 'discard', mustDiscard: 3 },
        player: { hand: cards, field: [], bank: [] },
      })

      const next = discardCards(state, ['temp-0'])
      expect(next.player.hand).toHaveLength(9)
      expect(next.turnPhase.type).toBe('discard')
    })

    it('ignores non-discard phase', () => {
      const state = makeState({
        turnPhase: { type: 'play', playsRemaining: 3 },
      })
      const next = discardCards(state, ['some-id'])
      expect(next).toEqual(state)
    })
  })

  // -------------------------------------------------------------------------
  // Serialization
  // -------------------------------------------------------------------------
  describe('serialization', () => {
    it('round-trips state through serialize/deserialize', () => {
      const state = createInitialState()
      const json = serializeState(state)
      const restored = deserializeState(json)

      expect(restored.player.hand).toHaveLength(state.player.hand.length)
      expect(restored.ai.hand).toHaveLength(state.ai.hand.length)
      expect(restored.drawPile).toHaveLength(state.drawPile.length)
      expect(restored.turnPhase).toEqual(state.turnPhase)
      expect(restored.currentTurn).toBe(state.currentTurn)
    })
  })

  // -------------------------------------------------------------------------
  // SET_SIZE coverage
  // -------------------------------------------------------------------------
  describe('SET_SIZE values', () => {
    it('has correct sizes for all colors', () => {
      expect(SET_SIZE.brown).toBe(2)
      expect(SET_SIZE.darkBlue).toBe(2)
      expect(SET_SIZE.utility).toBe(2)
      expect(SET_SIZE.lightBlue).toBe(3)
      expect(SET_SIZE.pink).toBe(3)
      expect(SET_SIZE.orange).toBe(3)
      expect(SET_SIZE.red).toBe(3)
      expect(SET_SIZE.yellow).toBe(3)
      expect(SET_SIZE.green).toBe(3)
      expect(SET_SIZE.railroad).toBe(4)
    })
  })

  // -------------------------------------------------------------------------
  // isCompleteSet — all-wild validation
  // -------------------------------------------------------------------------
  describe('isCompleteSet — non-wild requirement', () => {
    it('rejects a set of all wild cards', () => {
      const rainbow1 = WILD_CARDS.find((c) => c.id === 'w-rainbow-1')!
      const rainbow2 = WILD_CARDS.find((c) => c.id === 'w-rainbow-2')!
      const group: PropertyGroup = {
        color: 'brown',
        cards: [rainbow1, rainbow2],
        buildings: [],
      }
      expect(isCompleteSet(group)).toBe(false)
    })

    it('accepts a set with at least one standard property', () => {
      const brownProp = findCardById('p-brown-1')
      const wildCard = WILD_CARDS.find((c) => c.id === 'w-rainbow-1')!
      const group: PropertyGroup = {
        color: 'brown',
        cards: [brownProp, wildCard],
        buildings: [],
      }
      expect(isCompleteSet(group)).toBe(true)
    })

    it('accepts a set with dual-color wild + rainbow wilds', () => {
      const wild1 = WILD_CARDS.find((c) => c.id === 'w-gr-db')!
      const wild2 = WILD_CARDS.find((c) => c.id === 'w-rainbow-2')!
      const group: PropertyGroup = {
        color: 'green',
        cards: [wild1, wild2, WILD_CARDS.find((c) => c.id === 'w-rainbow-1')!],
        buildings: [],
      }
      // Dual-color wild counts as a "real" card — set is complete
      expect(isCompleteSet(group)).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // Wild card relocation from complete sets
  // -------------------------------------------------------------------------
  describe('wild card relocation from complete sets', () => {
    it('allows relocating a wild from a complete set', () => {
      const brownProp = findCardById('p-brown-1')
      const wildCard = WILD_CARDS.find((c) => c.id === 'w-br-lb')!
      const state = makeState({
        player: {
          hand: [],
          field: [{ color: 'brown', cards: [brownProp, wildCard], buildings: [] }],
          bank: [],
        },
      })
      const result = relocateWildOnField(state, 'w-br-lb', 'lightBlue')
      // Wild should have moved out — brown group now has 1 card
      const brownGroup = result.player.field.find((g) => g.color === 'brown')
      expect(brownGroup?.cards.length).toBe(1)
      // lightBlue group should exist with the wild
      const lbGroup = result.player.field.find((g) => g.color === 'lightBlue')
      expect(lbGroup?.cards.some((c) => c.id === 'w-br-lb')).toBe(true)
    })

    it('getRelocatableWilds includes wilds from complete sets', () => {
      const brownProp = findCardById('p-brown-1')
      const wildCard = WILD_CARDS.find((c) => c.id === 'w-br-lb')!
      const state = makeState({
        player: {
          hand: [],
          field: [{ color: 'brown', cards: [brownProp, wildCard], buildings: [] }],
          bank: [],
        },
      })
      const wilds = getRelocatableWilds(state, 'player')
      expect(wilds).toHaveLength(1)
      expect(wilds[0].cardId).toBe('w-br-lb')
    })
  })

  // -------------------------------------------------------------------------
  // Draw 5 if hand empty
  // -------------------------------------------------------------------------
  describe('executeDraw — draw 5 if hand empty', () => {
    it('draws 5 cards when hand is empty', () => {
      const cards = [...PROPERTY_CARDS.slice(0, 10)]
      const state = makeState({
        drawPile: cards,
        player: { hand: [], field: [], bank: [] },
        turnPhase: { type: 'draw' },
      })
      const result = executeDraw(state)
      expect(result.player.hand).toHaveLength(5)
    })

    it('draws 2 cards when hand is not empty', () => {
      const cards = [...PROPERTY_CARDS.slice(0, 10)]
      const state = makeState({
        drawPile: cards,
        player: { hand: [PROPERTY_CARDS[10]], field: [], bank: [] },
        turnPhase: { type: 'draw' },
      })
      const result = executeDraw(state)
      expect(result.player.hand).toHaveLength(3) // 1 existing + 2 drawn
    })
  })

  // -------------------------------------------------------------------------
  // Building relocation
  // -------------------------------------------------------------------------
  describe('building relocation', () => {
    const house = BUILDING_CARDS.find((c) => c.name === 'House')!
    const hotel = BUILDING_CARDS.find((c) => c.name === 'Hotel')!

    it('getRelocatableBuildings returns buildings that can move', () => {
      const state = makeState({
        player: {
          hand: [],
          field: [
            { color: 'brown', cards: [findCardById('p-brown-1'), findCardById('p-brown-2')], buildings: [house] },
            { color: 'darkBlue', cards: [findCardById('p-db-1'), findCardById('p-db-2')], buildings: [] },
          ],
          bank: [],
        },
      })
      const relocatable = getRelocatableBuildings(state, 'player')
      expect(relocatable).toHaveLength(1)
      expect(relocatable[0].cardId).toBe(house.id)
      expect(relocatable[0].currentColor).toBe('brown')
    })

    it('returns empty if only one complete set', () => {
      const state = makeState({
        player: {
          hand: [],
          field: [
            { color: 'brown', cards: [findCardById('p-brown-1'), findCardById('p-brown-2')], buildings: [house] },
          ],
          bank: [],
        },
      })
      expect(getRelocatableBuildings(state, 'player')).toHaveLength(0)
    })

    it('relocateBuildingOnField moves a house between complete sets', () => {
      const state = makeState({
        player: {
          hand: [],
          field: [
            { color: 'brown', cards: [findCardById('p-brown-1'), findCardById('p-brown-2')], buildings: [house] },
            { color: 'darkBlue', cards: [findCardById('p-db-1'), findCardById('p-db-2')], buildings: [] },
          ],
          bank: [],
        },
      })
      const result = relocateBuildingOnField(state, house.id, 'darkBlue')
      const brownGroup = result.player.field.find((g) => g.color === 'brown')!
      const blueGroup = result.player.field.find((g) => g.color === 'darkBlue')!
      expect(brownGroup.buildings).toHaveLength(0)
      expect(blueGroup.buildings).toHaveLength(1)
      expect(blueGroup.buildings[0].id).toBe(house.id)
    })

    it('blocks hotel relocation to set without a house', () => {
      const house2 = BUILDING_CARDS.filter((c) => c.name === 'House')[1]
      const state = makeState({
        player: {
          hand: [],
          field: [
            { color: 'brown', cards: [findCardById('p-brown-1'), findCardById('p-brown-2')], buildings: [house, hotel] },
            { color: 'darkBlue', cards: [findCardById('p-db-1'), findCardById('p-db-2')], buildings: [] },
            { color: 'red', cards: [findCardById('p-red-1'), findCardById('p-red-2'), findCardById('p-red-3')], buildings: [house2] },
          ],
          bank: [],
        },
      })
      // Hotel to darkBlue (no house) should be blocked
      const result1 = relocateBuildingOnField(state, hotel.id, 'darkBlue')
      expect(result1).toBe(state) // unchanged
      // Hotel to red (has house) should succeed
      const result2 = relocateBuildingOnField(state, hotel.id, 'red')
      expect(result2).not.toBe(state)
      const redGroup = result2.player.field.find((g) => g.color === 'red')!
      expect(redGroup.buildings.some((b) => b.name === 'Hotel')).toBe(true)
    })

    it('blocks relocation to railroad or utility', () => {
      const state = makeState({
        player: {
          hand: [],
          field: [
            { color: 'brown', cards: [findCardById('p-brown-1'), findCardById('p-brown-2')], buildings: [house] },
            { color: 'railroad', cards: [findCardById('p-rr-1'), findCardById('p-rr-2'), findCardById('p-rr-3'), findCardById('p-rr-4')], buildings: [] },
          ],
          bank: [],
        },
      })
      const result = relocateBuildingOnField(state, house.id, 'railroad')
      expect(result).toBe(state) // unchanged
    })
  })

  // -------------------------------------------------------------------------
  // Complete set protection — Sly Deal, Forced Deal, Deal Breaker
  // -------------------------------------------------------------------------

  describe('Complete set protection', () => {
    // -- getStealableProperties --

    describe('getStealableProperties excludes complete sets', () => {
      it('returns nothing when all sets are complete', () => {
        const ps: PlayerState = {
          hand: [], bank: [],
          field: [
            makeGroup('brown', ['p-brown-1', 'p-brown-2']),
            makeGroup('darkBlue', ['p-db-1', 'p-db-2']),
          ],
        }
        expect(getStealableProperties(ps)).toHaveLength(0)
      })

      it('returns only cards from incomplete sets when mix of complete and incomplete', () => {
        const ps: PlayerState = {
          hand: [], bank: [],
          field: [
            makeGroup('brown', ['p-brown-1', 'p-brown-2']),       // complete (2/2)
            makeGroup('red', ['p-red-1', 'p-red-2']),              // incomplete (2/3)
            makeGroup('lightBlue', ['p-lb-1', 'p-lb-2', 'p-lb-3']), // complete (3/3)
          ],
        }
        const stealable = getStealableProperties(ps)
        expect(stealable).toHaveLength(2)
        expect(stealable.every((s) => s.groupColor === 'red')).toBe(true)
      })

      it('includes wilds in incomplete sets as stealable', () => {
        const wild = findCardById('w-rainbow-1')
        const ps: PlayerState = {
          hand: [], bank: [],
          field: [{
            color: 'red',
            cards: [findCardById('p-red-1'), wild],
            buildings: [],
          }],
        }
        const stealable = getStealableProperties(ps)
        expect(stealable).toHaveLength(2)
        expect(stealable.some((s) => s.card.id === wild.id)).toBe(true)
      })
    })

    // -- canPlayCard validation for action cards --

    describe('canPlayCard rejects action cards without valid targets', () => {
      it('rejects Sly Deal when opponent has only complete sets', () => {
        const card = findCardById('a-sly-1')
        const state = makeState({
          player: { hand: [card], field: [], bank: [] },
          ai: {
            hand: [],
            field: [makeGroup('brown', ['p-brown-1', 'p-brown-2'])],
            bank: [],
          },
        })
        const result = canPlayCard(state, card.id)
        expect(result.valid).toBe(false)
        expect(result.reason).toContain('stealable')
      })

      it('allows Sly Deal when opponent has incomplete sets', () => {
        const card = findCardById('a-sly-1')
        const state = makeState({
          player: { hand: [card], field: [], bank: [] },
          ai: {
            hand: [],
            field: [makeGroup('red', ['p-red-1'])],
            bank: [],
          },
        })
        expect(canPlayCard(state, card.id).valid).toBe(true)
      })

      it('rejects Deal Breaker when opponent has no complete sets', () => {
        const card = findCardById('a-db-1')
        const state = makeState({
          player: { hand: [card], field: [], bank: [] },
          ai: {
            hand: [],
            field: [makeGroup('red', ['p-red-1', 'p-red-2'])],
            bank: [],
          },
        })
        const result = canPlayCard(state, card.id)
        expect(result.valid).toBe(false)
        expect(result.reason).toContain('complete sets')
      })

      it('allows Deal Breaker when opponent has a complete set', () => {
        const card = findCardById('a-db-1')
        const state = makeState({
          player: { hand: [card], field: [], bank: [] },
          ai: {
            hand: [],
            field: [makeGroup('brown', ['p-brown-1', 'p-brown-2'])],
            bank: [],
          },
        })
        expect(canPlayCard(state, card.id).valid).toBe(true)
      })

      it('rejects Forced Deal when player has only complete sets (nothing to give)', () => {
        const card = findCardById('a-fd-1')
        const state = makeState({
          player: {
            hand: [card],
            field: [makeGroup('brown', ['p-brown-1', 'p-brown-2'])],
            bank: [],
          },
          ai: {
            hand: [],
            field: [makeGroup('red', ['p-red-1'])],
            bank: [],
          },
        })
        const result = canPlayCard(state, card.id)
        expect(result.valid).toBe(false)
        expect(result.reason).toContain('properties')
      })

      it('rejects Forced Deal when opponent has only complete sets (nothing to take)', () => {
        const card = findCardById('a-fd-1')
        const state = makeState({
          player: {
            hand: [card],
            field: [makeGroup('red', ['p-red-1'])],
            bank: [],
          },
          ai: {
            hand: [],
            field: [makeGroup('brown', ['p-brown-1', 'p-brown-2'])],
            bank: [],
          },
        })
        const result = canPlayCard(state, card.id)
        expect(result.valid).toBe(false)
        expect(result.reason).toContain('properties')
      })
    })

    // -- completeSlyDeal refuses to steal from complete sets --

    describe('completeSlyDeal protects complete sets', () => {
      it('cannot steal a card from a complete set', () => {
        const state = makeState({
          turnPhase: { type: 'awaitingSlyDealTarget' },
          playsUsedThisTurn: 1,
          ai: {
            hand: [],
            field: [makeGroup('brown', ['p-brown-1', 'p-brown-2'])], // complete
            bank: [],
          },
          player: { hand: [], field: [], bank: [] },
        })

        const next = completeSlyDeal(state, 'p-brown-1')
        // Should be unchanged — card is in a complete set
        expect(next).toEqual(state)
      })

      it('can steal a card from an incomplete set next to a complete set', () => {
        const state = makeState({
          turnPhase: { type: 'awaitingSlyDealTarget' },
          playsUsedThisTurn: 1,
          ai: {
            hand: [],
            field: [
              makeGroup('brown', ['p-brown-1', 'p-brown-2']), // complete
              makeGroup('red', ['p-red-1']),                    // incomplete
            ],
            bank: [],
          },
          player: { hand: [], field: [], bank: [] },
        })

        const next = completeSlyDeal(state, 'p-red-1')
        expect(next.player.field).toHaveLength(1)
        expect(next.player.field[0].cards[0].id).toBe('p-red-1')
        // Brown set is still intact
        expect(next.ai.field).toHaveLength(1)
        expect(next.ai.field[0].color).toBe('brown')
        expect(next.ai.field[0].cards).toHaveLength(2)
      })
    })

    // -- completeForcedDeal refuses to swap from complete sets --

    describe('completeForcedDeal protects complete sets', () => {
      it('cannot take a card from opponent complete set', () => {
        const state = makeState({
          turnPhase: { type: 'awaitingForcedDealSelect', phase: 'give' },
          playsUsedThisTurn: 1,
          player: {
            hand: [],
            field: [makeGroup('red', ['p-red-1'])],
            bank: [],
          },
          ai: {
            hand: [],
            field: [makeGroup('brown', ['p-brown-1', 'p-brown-2'])], // complete
            bank: [],
          },
        })

        const next = completeForcedDeal(state, 'p-red-1', 'p-brown-1')
        expect(next).toEqual(state)
      })

      it('cannot give a card from player complete set', () => {
        const state = makeState({
          turnPhase: { type: 'awaitingForcedDealSelect', phase: 'give' },
          playsUsedThisTurn: 1,
          player: {
            hand: [],
            field: [makeGroup('brown', ['p-brown-1', 'p-brown-2'])], // complete
            bank: [],
          },
          ai: {
            hand: [],
            field: [makeGroup('red', ['p-red-1'])],
            bank: [],
          },
        })

        const next = completeForcedDeal(state, 'p-brown-1', 'p-red-1')
        expect(next).toEqual(state)
      })

      it('allows swap between incomplete sets', () => {
        const state = makeState({
          turnPhase: { type: 'awaitingForcedDealSelect', phase: 'give' },
          playsUsedThisTurn: 1,
          player: {
            hand: [],
            field: [makeGroup('orange', ['p-ora-1'])],
            bank: [],
          },
          ai: {
            hand: [],
            field: [makeGroup('red', ['p-red-1'])],
            bank: [],
          },
        })

        const next = completeForcedDeal(state, 'p-ora-1', 'p-red-1')
        expect(next.player.field.some((g) => g.cards.some((c) => c.id === 'p-red-1'))).toBe(true)
        expect(next.ai.field.some((g) => g.cards.some((c) => c.id === 'p-ora-1'))).toBe(true)
        expectCardConservation(state, next)
      })
    })

    // -- AI turn: action cards respect complete set protection --

    describe('AI Sly Deal / Forced Deal from AI turn', () => {
      it('Sly Deal does nothing when AI targets player complete set', () => {
        const card = findCardById('a-sly-1')
        const state = makeState({
          currentTurn: 'ai',
          ai: { hand: [card], field: [], bank: [] },
          player: {
            hand: [],
            field: [makeGroup('brown', ['p-brown-1', 'p-brown-2'])], // complete
            bank: [],
          },
        })

        const next = playSlyDeal(state, card.id)
        // No stealable targets → unchanged
        expect(next).toEqual(state)
      })

      it('AI Sly Deal works when player has incomplete sets', () => {
        const card = findCardById('a-sly-1')
        const state = makeState({
          currentTurn: 'ai',
          ai: { hand: [card], field: [], bank: [] },
          player: {
            hand: [],
            field: [makeGroup('red', ['p-red-1'])],
            bank: [],
          },
        })

        const next = playSlyDeal(state, card.id)
        expect(next.turnPhase.type).toBe('awaitingSlyDealTarget')
      })

      it('AI Forced Deal does nothing when player has only complete sets', () => {
        const card = findCardById('a-fd-1')
        const state = makeState({
          currentTurn: 'ai',
          ai: { hand: [card], field: [makeGroup('red', ['p-red-1'])], bank: [] },
          player: {
            hand: [],
            field: [makeGroup('brown', ['p-brown-1', 'p-brown-2'])],
            bank: [],
          },
        })

        const next = playForcedDeal(state, card.id)
        expect(next).toEqual(state)
      })
    })

    // -- Deal Breaker only targets complete sets --

    describe('Deal Breaker targets only complete sets', () => {
      it('cannot steal an incomplete set', () => {
        const state = makeState({
          turnPhase: { type: 'awaitingDealBreakerTarget' },
          playsUsedThisTurn: 1,
          ai: {
            hand: [],
            field: [makeGroup('red', ['p-red-1', 'p-red-2'])], // incomplete (2/3)
            bank: [],
          },
          player: { hand: [], field: [], bank: [] },
        })

        const next = completeDealBreaker(state, 'red')
        expect(next).toEqual(state)
      })

      it('steals only the targeted complete set, leaves other sets intact', () => {
        const state = makeState({
          turnPhase: { type: 'awaitingDealBreakerTarget' },
          playsUsedThisTurn: 1,
          ai: {
            hand: [],
            field: [
              makeGroup('brown', ['p-brown-1', 'p-brown-2']),  // complete
              makeGroup('red', ['p-red-1']),                     // incomplete
            ],
            bank: [],
          },
          player: { hand: [], field: [], bank: [] },
        })

        const next = completeDealBreaker(state, 'brown')
        expect(next.player.field.some((g) => g.color === 'brown')).toBe(true)
        // Incomplete red set stays with AI
        expect(next.ai.field).toHaveLength(1)
        expect(next.ai.field[0].color).toBe('red')
        expectCardConservation(state, next)
      })
    })

    // -- Complete set with wilds --

    describe('Complete sets with wild cards', () => {
      it('set with wild counts as complete and is protected from Sly Deal', () => {
        const wild = findCardById('w-rd-yl-1')
        const ps: PlayerState = {
          hand: [], bank: [],
          field: [{
            color: 'brown',
            cards: [findCardById('p-brown-1'), wild],
            buildings: [],
          }],
        }
        // Brown needs 2 — has 1 property + 1 wild = 2 = complete
        expect(isCompleteSet(ps.field[0])).toBe(true)
        expect(getStealableProperties(ps)).toHaveLength(0)
      })

      it('set with ONLY rainbow wilds is NOT complete', () => {
        const wild1 = findCardById('w-rainbow-1')
        const wild2 = findCardById('w-rainbow-2')
        const ps: PlayerState = {
          hand: [], bank: [],
          field: [{
            color: 'brown',
            cards: [wild1, wild2],
            buildings: [],
          }],
        }
        expect(isCompleteSet(ps.field[0])).toBe(false)
        expect(getStealableProperties(ps)).toHaveLength(2)
      })

      it('set with dual-color wild + rainbow wild IS complete', () => {
        // green/darkBlue wild in darkBlue group + rainbow wild = complete (darkBlue needs 2)
        const dualWild = findCardById('w-gr-db')
        const rainbow = findCardById('w-rainbow-1')
        const ps: PlayerState = {
          hand: [], bank: [],
          field: [{
            color: 'darkBlue',
            cards: [dualWild, rainbow],
            buildings: [],
          }],
        }
        expect(isCompleteSet(ps.field[0])).toBe(true)
        expect(getStealableProperties(ps)).toHaveLength(0)
      })
    })
  })

  describe('Stolen/transferred cards do not pile onto complete sets', () => {
    it('Sly Deal: stolen wild creates new group instead of joining complete set', () => {
      const rainbow = findCardById('w-rainbow-1')
      const slyDeal = findCardById('a-sly-1')
      const state = makeState({
        currentTurn: 'player',
        turnPhase: { type: 'awaitingSlyDealTarget' },
        playsUsedThisTurn: 1,
        player: {
          hand: [],
          bank: [],
          field: [
            // Already complete darkBlue set (2/2)
            makeGroup('darkBlue', ['p-db-1', 'p-db-2']),
          ],
        },
        ai: {
          hand: [],
          bank: [],
          field: [{
            // Incomplete green group (1/3) containing rainbow wild
            color: 'green',
            cards: [rainbow],
            buildings: [],
          }],
        },
        discardPile: [slyDeal],
      })

      // Steal the rainbow wild from AI's "green" group — stolenColor will be 'green'
      const after = completeSlyDeal(state, rainbow.id)

      // Player should have 2 groups: complete darkBlue + new green with stolen wild
      expect(after.player.field).toHaveLength(2)
      // Original complete set untouched
      expect(after.player.field[0].color).toBe('darkBlue')
      expect(after.player.field[0].cards).toHaveLength(2)
      expect(isCompleteSet(after.player.field[0])).toBe(true)
      // New group with the stolen rainbow wild
      expect(after.player.field[1].color).toBe('green')
      expect(after.player.field[1].cards).toHaveLength(1)
      expect(after.player.field[1].cards[0].id).toBe('w-rainbow-1')
    })

    it('Sly Deal: stolen card of same color as complete set creates new group', () => {
      const state = makeState({
        currentTurn: 'player',
        turnPhase: { type: 'awaitingSlyDealTarget' },
        playsUsedThisTurn: 1,
        player: {
          hand: [],
          bank: [],
          field: [
            // Already complete darkBlue set (2/2)
            makeGroup('darkBlue', ['p-db-1', 'p-db-2']),
          ],
        },
        ai: {
          hand: [],
          bank: [],
          field: [{
            // Incomplete darkBlue group with a wild
            color: 'darkBlue',
            cards: [findCardById('w-gr-db')],  // green/darkBlue wild
            buildings: [],
          }],
        },
        discardPile: [findCardById('a-sly-1')],
      })

      const after = completeSlyDeal(state, 'w-gr-db')

      // Stolen card should NOT join the complete darkBlue set
      const dbGroups = after.player.field.filter(g => g.color === 'darkBlue')
      expect(dbGroups).toHaveLength(2)
      expect(dbGroups[0].cards).toHaveLength(2) // original complete set
      expect(dbGroups[1].cards).toHaveLength(1) // new group with stolen wild
    })

    it('Forced Deal: swapped card creates new group instead of joining complete set', () => {
      const state = makeState({
        currentTurn: 'player',
        turnPhase: { type: 'awaitingForcedDealSelect', phase: 'give' },
        playsUsedThisTurn: 1,
        player: {
          hand: [],
          bank: [],
          field: [
            // Complete brown set (2/2)
            makeGroup('brown', ['p-brown-1', 'p-brown-2']),
            // Incomplete lightBlue set — will give one away
            { color: 'lightBlue', cards: [findCardById('p-lb-1'), findCardById('p-lb-2')], buildings: [] },
          ],
        },
        ai: {
          hand: [],
          bank: [],
          field: [{
            color: 'brown',
            cards: [findCardById('w-br-lb')], // brown/lightBlue wild in brown group
            buildings: [],
          }],
        },
        discardPile: [findCardById('a-fd-1')],
      })

      // Give lb-1, take the wild (which is in AI's "brown" group)
      const after = completeForcedDeal(state, 'p-lb-1', 'w-br-lb')

      // Player should have 3 groups: complete brown, reduced lightBlue, new brown with the wild
      const brownGroups = after.player.field.filter(g => g.color === 'brown')
      expect(brownGroups).toHaveLength(2)
      // Original complete set should be untouched
      const completeBrown = brownGroups.find(g => g.cards.length === 2)
      expect(completeBrown).toBeDefined()
      expect(isCompleteSet(completeBrown!)).toBe(true)
      // New group with the received wild
      const newBrown = brownGroups.find(g => g.cards.length === 1)
      expect(newBrown).toBeDefined()
      expect(newBrown!.cards[0].id).toBe('w-br-lb')
    })

    it('Payment transfer: property paid as debt does not join creditor complete set', () => {
      const state = makeState({
        currentTurn: 'player',
        playsUsedThisTurn: 1,
        turnPhase: {
          type: 'awaitingPayment',
          debt: {
            creditor: 'player',
            debtor: 'ai',
            amount: 3,
            source: 'debtCollector',
            selectedPayment: ['p-red-1'], // AI pays with a red property
          },
        },
        player: {
          hand: [],
          bank: [],
          field: [
            // Player already has complete red set (3/3)
            makeGroup('red', ['p-red-2', 'p-red-3', 'w-rd-yl-1']),
          ],
        },
        ai: {
          hand: [],
          bank: [],
          field: [{
            color: 'red',
            cards: [findCardById('p-red-1')],
            buildings: [],
          }],
        },
      })

      const after = confirmPayment(state)

      // Player should have 2 red groups, not 1 oversized group
      const redGroups = after.player.field.filter(g => g.color === 'red')
      expect(redGroups).toHaveLength(2)
      // Original complete set untouched
      const completeRed = redGroups.find(g => g.cards.length === 3)
      expect(completeRed).toBeDefined()
      expect(isCompleteSet(completeRed!)).toBe(true)
    })

    it('payment transfer to incomplete set of same color works normally', () => {
      const state = makeState({
        currentTurn: 'player',
        playsUsedThisTurn: 1,
        turnPhase: {
          type: 'awaitingPayment',
          debt: {
            creditor: 'player',
            debtor: 'ai',
            amount: 3,
            source: 'debtCollector',
            selectedPayment: ['p-red-1'],
          },
        },
        player: {
          hand: [],
          bank: [],
          field: [
            // Player has incomplete red set (1/3)
            { color: 'red', cards: [findCardById('p-red-2')], buildings: [] },
          ],
        },
        ai: {
          hand: [],
          bank: [],
          field: [{
            color: 'red',
            cards: [findCardById('p-red-1')],
            buildings: [],
          }],
        },
      })

      const after = confirmPayment(state)

      // Should join existing incomplete group
      const redGroups = after.player.field.filter(g => g.color === 'red')
      expect(redGroups).toHaveLength(1)
      expect(redGroups[0].cards).toHaveLength(2)
    })

    it('stolen wild completing a 3rd set triggers win', () => {
      const rainbow = findCardById('w-rainbow-1')
      const state = makeState({
        currentTurn: 'player',
        turnPhase: { type: 'awaitingSlyDealTarget' },
        playsUsedThisTurn: 1,
        player: {
          hand: [],
          bank: [],
          field: [
            makeGroup('darkBlue', ['p-db-1', 'p-db-2']),
            makeGroup('brown', ['p-brown-1', 'p-brown-2']),
            // Need 1 more card for lightBlue (3 needed)
            { color: 'lightBlue', cards: [findCardById('p-lb-1'), findCardById('p-lb-2')], buildings: [] },
          ],
        },
        ai: {
          hand: [],
          bank: [],
          field: [{
            color: 'lightBlue',
            cards: [rainbow],
            buildings: [],
          }],
        },
        discardPile: [findCardById('a-sly-1')],
      })

      const after = completeSlyDeal(state, rainbow.id)

      // Rainbow wild should join incomplete lightBlue (not pile onto complete darkBlue/brown)
      const lbGroup = after.player.field.find(g => g.color === 'lightBlue')
      expect(lbGroup).toBeDefined()
      expect(lbGroup!.cards).toHaveLength(3)
      expect(isCompleteSet(lbGroup!)).toBe(true)
      expect(countCompleteSets(after.player)).toBe(3)
      expect(after.turnPhase.type).toBe('gameOver')
    })
  })

  describe('Same-color incomplete groups auto-merge', () => {
    it('wild relocation merges same-color incomplete groups', () => {
      // Player has: complete lightBlue (with rainbow wild) + lone stolen lightBlue card
      const state = makeState({
        currentTurn: 'player',
        turnPhase: { type: 'play', playsRemaining: 3 },
        playsUsedThisTurn: 0,
        player: {
          hand: [],
          bank: [],
          field: [
            // Complete lightBlue set (3/3): 2 properties + 1 rainbow wild
            {
              color: 'lightBlue',
              cards: [findCardById('p-lb-1'), findCardById('p-lb-2'), findCardById('w-rainbow-1')],
              buildings: [],
            },
            // Lone stolen lightBlue card in separate group
            {
              color: 'lightBlue',
              cards: [findCardById('p-lb-3')],
              buildings: [],
            },
          ],
        },
      })

      // Relocate rainbow wild from lightBlue → green
      // This makes the first lightBlue group incomplete (2/3), triggering merge with the lone card
      const after = relocateWildOnField(state, 'w-rainbow-1', 'green')

      // Should now have 1 lightBlue group (merged: 3 cards = complete) + 1 green group
      const lbGroups = after.player.field.filter(g => g.color === 'lightBlue')
      expect(lbGroups).toHaveLength(1)
      expect(lbGroups[0].cards).toHaveLength(3)
      expect(isCompleteSet(lbGroups[0])).toBe(true)

      const greenGroups = after.player.field.filter(g => g.color === 'green')
      expect(greenGroups).toHaveLength(1)
      expect(greenGroups[0].cards[0].id).toBe('w-rainbow-1')
    })

    it('Sly Deal auto-merges stolen card with existing incomplete group', () => {
      const state = makeState({
        currentTurn: 'player',
        turnPhase: { type: 'awaitingSlyDealTarget' },
        playsUsedThisTurn: 1,
        player: {
          hand: [],
          bank: [],
          field: [
            // Complete red set
            makeGroup('red', ['p-red-1', 'p-red-2', 'p-red-3']),
            // Incomplete red group (from a previous steal that couldn't join complete set)
            { color: 'red', cards: [findCardById('w-rd-yl-1')], buildings: [] },
          ],
        },
        ai: {
          hand: [],
          bank: [],
          field: [{
            color: 'red',
            cards: [findCardById('w-rd-yl-2')],
            buildings: [],
          }],
        },
        discardPile: [findCardById('a-sly-1')],
      })

      const after = completeSlyDeal(state, 'w-rd-yl-2')

      // Stolen card should merge with existing incomplete red group, not create a 3rd
      const redGroups = after.player.field.filter(g => g.color === 'red')
      expect(redGroups).toHaveLength(2) // 1 complete + 1 merged incomplete
      const incompleteRed = redGroups.find(g => g.cards.length < 3)
      expect(incompleteRed).toBeDefined()
      expect(incompleteRed!.cards).toHaveLength(2)
    })
  })
})
