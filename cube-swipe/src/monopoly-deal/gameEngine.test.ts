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
  type MonopolyDealState,
  type PlayerState,
  type PropertyGroup,
} from './gameEngine'
import {
  type MonopolyCardData,
  PROPERTY_CARDS,
  ACTION_CARDS,
  MONEY_CARDS,
  BUILDING_CARDS,
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
  const card = [...PROPERTY_CARDS, ...ACTION_CARDS, ...MONEY_CARDS, ...BUILDING_CARDS]
    .find((c) => c.name === name)
  if (!card) throw new Error(`Card not found: ${name}`)
  return card
}

function findCardById(id: string): MonopolyCardData {
  const card = [...PROPERTY_CARDS, ...ACTION_CARDS, ...MONEY_CARDS, ...BUILDING_CARDS]
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
      expect(state.currentTurn).toBe('player')
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
        player: { hand: [], field: [], bank: [] },
      })

      const next = executeDraw(state)
      expect(next.player.hand).toHaveLength(2)
      expect(next.drawPile).toHaveLength(1)
      expect(next.turnPhase).toEqual({ type: 'play', playsRemaining: 3 })
      expect(next.playsUsedThisTurn).toBe(0)
    })

    it('adds a log entry', () => {
      const state = makeState({
        turnPhase: { type: 'draw' },
        drawPile: [findCard('Mediterranean Ave'), findCard('Baltic Ave')],
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
      expect(next).toBe(state)
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
    })

    it('consumes a play', () => {
      const card = findCard('Mediterranean Ave')
      const state = makeState({
        player: { hand: [card], field: [], bank: [] },
        turnPhase: { type: 'play', playsRemaining: 2 },
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
      expect(next).toBe(state) // unchanged
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
      expect(next).toBe(state) // unchanged
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
    })
  })

  describe('Forced Deal', () => {
    it('transitions to give phase', () => {
      const card = findCardById('a-fd-1')
      const state = makeState({
        player: { hand: [card], field: [], bank: [] },
      })

      const next = playForcedDeal(state, card.id)
      expect(next.turnPhase.type).toBe('awaitingForcedDealSelect')
      if (next.turnPhase.type === 'awaitingForcedDealSelect') {
        expect(next.turnPhase.phase).toBe('give')
      }
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
    })
  })

  describe('Deal Breaker', () => {
    it('transitions to target selection when opponent has complete sets', () => {
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
      expect(next).toBe(state)
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
      expect(next).toBe(state)
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
})
