import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  getAIDecision,
  getAITelemetrySnapshot,
  getAIDifficultyMode,
  resetAITelemetry,
  setAIDifficultyMode,
} from './aiStrategy'
import type {
  MonopolyDealState,
  PropertyGroup,
} from './gameEngine'
import {
  type MonopolyCardData,
  type PropertyColor,
  ACTION_CARDS,
  BUILDING_CARDS,
  MONEY_CARDS,
  PROPERTY_CARDS,
  RENT_CARDS,
  WILD_CARDS,
} from './cardData'

const ALL_CARDS: MonopolyCardData[] = [
  ...PROPERTY_CARDS,
  ...ACTION_CARDS,
  ...MONEY_CARDS,
  ...BUILDING_CARDS,
  ...WILD_CARDS,
  ...RENT_CARDS,
]

function findCardById(id: string): MonopolyCardData {
  const card = ALL_CARDS.find((c) => c.id === id)
  if (!card) throw new Error(`Card not found: ${id}`)
  return card
}

function card(id: string, forcedId?: string): MonopolyCardData {
  return forcedId
    ? { ...findCardById(id), id: forcedId }
    : findCardById(id)
}

function group(color: PropertyColor, cardIds: string[], buildingIds: string[] = []): PropertyGroup {
  return {
    color,
    cards: cardIds.map((id) => card(id)),
    buildings: buildingIds.map((id) => card(id)),
  }
}

function makeState(overrides?: Partial<MonopolyDealState>): MonopolyDealState {
  return {
    drawPile: [],
    discardPile: [],
    player: { hand: [], field: [], bank: [] },
    ai: { hand: [], field: [], bank: [] },
    currentTurn: 'ai',
    turnPhase: { type: 'play', playsRemaining: 3 },
    turnNumber: 1,
    playsUsedThisTurn: 0,
    log: [],
    ...overrides,
  }
}

describe('aiStrategy', () => {
  beforeEach(() => {
    resetAITelemetry()
    setAIDifficultyMode('adaptive')
  })

  afterEach(() => {
    setAIDifficultyMode('adaptive')
  })

  describe('contract behavior (must/never)', () => {
  it('waits when payment is required from player (not AI)', () => {
    const state = makeState({
      turnPhase: {
        type: 'awaitingPayment',
        debt: {
          creditor: 'ai',
          debtor: 'player',
          amount: 3,
          source: 'rent',
          selectedPayment: [],
        },
      },
      ai: {
        hand: [card('m-10')],
        field: [],
        bank: [card('m-10')],
      },
    })

    const decision = getAIDecision(state)
    expect(decision.type).toBe('wait')
  })

  it('waits when JSN decision belongs to player', () => {
    const state = makeState({
      turnPhase: {
        type: 'awaitingJSN',
        jsnChain: {
          originalAction: {
            actionCard: card('a-db-1'),
            sourcePlayer: 'ai',
          },
          chain: [],
          currentDecider: 'player',
        },
      },
      ai: {
        hand: [card('a-jsn-1')],
        field: [],
        bank: [],
      },
    })

    const decision = getAIDecision(state)
    expect(decision.type).toBe('wait')
  })

  it('uses Just Say No against Deal Breaker when AI is the decider', () => {
    const jsn = card('a-jsn-1')
    const state = makeState({
      turnPhase: {
        type: 'awaitingJSN',
        jsnChain: {
          originalAction: {
            actionCard: card('a-db-1'),
            sourcePlayer: 'player',
          },
          chain: [],
          currentDecider: 'ai',
        },
      },
      ai: {
        hand: [jsn],
        field: [],
        bank: [],
      },
    })

    const decision = getAIDecision(state)
    expect(decision).toEqual({ type: 'useJSN', cardId: jsn.id })
  })

  it('uses Double Rent combo when available', () => {
    const rent = card('r-db-gr-1')
    const doubleRent = card('a-dtr-1')
    const state = makeState({
      turnPhase: { type: 'play', playsRemaining: 3 },
      ai: {
        hand: [rent, doubleRent],
        field: [group('darkBlue', ['p-db-1'])],
        bank: [],
      },
      player: {
        hand: [],
        field: [],
        bank: [card('m-5a')],
      },
    })

    const decision = getAIDecision(state)
    expect(decision).toEqual({
      type: 'playRent',
      cardId: rent.id,
      targetColor: 'darkBlue',
      doubleRentCardId: doubleRent.id,
    })
  })

  it('does not treat over-completing an already complete set as a win move', () => {
    const wild = card('w-br-lb')
    const state = makeState({
      turnPhase: { type: 'play', playsRemaining: 1 },
      ai: {
        hand: [wild],
        field: [
          group('brown', ['p-brown-1', 'p-brown-2']),
          group('lightBlue', ['p-lb-1', 'p-lb-2', 'p-lb-3']),
        ],
        bank: [],
      },
    })

    const decision = getAIDecision(state)
    if (decision.type === 'playProperty') {
      expect(decision.targetColor).not.toBe('brown')
    } else {
      expect(decision).toEqual({ type: 'endTurn' })
    }
  })

  it('pays debt using low-value cards and prioritizes money cards', () => {
    const state = makeState({
      turnPhase: {
        type: 'awaitingPayment',
        debt: {
          creditor: 'player',
          debtor: 'ai',
          amount: 3,
          source: 'debtCollector',
          selectedPayment: [],
        },
      },
      ai: {
        hand: [],
        bank: [card('m-1a'), card('m-2a'), card('m-5a')],
        field: [group('darkBlue', ['p-db-1'])],
      },
    })

    const decision = getAIDecision(state)
    expect(decision.type).toBe('payDebt')
    expect(decision.paymentCardIds).toHaveLength(2)
    expect(decision.paymentCardIds).toContain('m-1a')
    expect(decision.paymentCardIds).toContain('m-2a')
  })

  it('gives the least valuable card during Forced Deal give phase', () => {
    const state = makeState({
      turnPhase: { type: 'awaitingForcedDealSelect', phase: 'give' },
      ai: {
        hand: [],
        field: [
          group('darkBlue', ['p-db-1']),
          group('brown', ['p-brown-1']),
        ],
        bank: [],
      },
      player: {
        hand: [],
        field: [group('red', ['p-red-1'])],
        bank: [],
      },
    })

    const decision = getAIDecision(state)
    expect(decision).toEqual({ type: 'selectTarget', yourCardId: 'p-brown-1' })
  })

  it('selects the highest-rent color when choosing rent color', () => {
    const state = makeState({
      turnPhase: { type: 'awaitingRentColor', cardId: 'r-wild-1' },
      ai: {
        hand: [],
        field: [
          group('brown', ['p-brown-1']),
          group('red', ['p-red-1', 'p-red-2', 'p-red-3']),
        ],
        bank: [],
      },
    })

    const decision = getAIDecision(state)
    expect(decision).toEqual({ type: 'selectColor', targetColor: 'red' })
  })

  it('keeps strategically useful property cards when discarding', () => {
    const state = makeState({
      turnPhase: { type: 'discard', mustDiscard: 2 },
      ai: {
        hand: [card('m-10'), card('m-1a'), card('p-brown-1')],
        field: [],
        bank: [],
      },
    })

    const decision = getAIDecision(state)
    expect(decision.type).toBe('discard')
    expect(decision.discardCardIds).toHaveLength(2)
    expect(decision.discardCardIds).toContain('m-1a')
    expect(decision.discardCardIds).toContain('m-10')
    expect(decision.discardCardIds).not.toContain('p-brown-1')
  })

  it('returns endTurn for unsupported phase defaults', () => {
    const state = makeState({
      turnPhase: { type: 'draw' },
      ai: { hand: [card('m-1a')], field: [], bank: [] },
    })
    expect(getAIDecision(state)).toEqual({ type: 'endTurn' })
  })

  it('returns endTurn when no plays are available', () => {
    const state = makeState({
      turnPhase: { type: 'play', playsRemaining: 0 },
      ai: { hand: [card('m-1a')], field: [], bank: [] },
    })
    expect(getAIDecision(state)).toEqual({ type: 'endTurn' })
  })

  it('returns endTurn when AI only has Double Rent', () => {
    const state = makeState({
      ai: { hand: [card('a-dtr-1')], field: [], bank: [] },
    })
    expect(getAIDecision(state)).toEqual({ type: 'endTurn' })
  })

  it('prefers a winning property play to complete the third set', () => {
    const redFinisher = card('p-red-3')
    const state = makeState({
      ai: {
        hand: [redFinisher],
        field: [
          group('brown', ['p-brown-1', 'p-brown-2']),
          group('darkBlue', ['p-db-1', 'p-db-2']),
          group('red', ['p-red-1', 'p-red-2']),
        ],
        bank: [],
      },
    })

    expect(getAIDecision(state)).toEqual({
      type: 'playProperty',
      cardId: redFinisher.id,
      targetColor: 'red',
    })
  })

  it('plays building cards on valid complete sets', () => {
    const house = card('b-house-1')
    const state = makeState({
      ai: {
        hand: [house],
        field: [group('brown', ['p-brown-1', 'p-brown-2'])],
        bank: [],
      },
    })
    expect(getAIDecision(state)).toEqual({
      type: 'playBuilding',
      cardId: house.id,
      targetColor: 'brown',
    })
  })

  it('does not play a rent card when AI has no rentable color', () => {
    const state = makeState({
      ai: {
        hand: [card('r-db-gr-1')],
        field: [group('brown', ['p-brown-1'])],
        bank: [],
      },
    })
    expect(getAIDecision(state)).toEqual({ type: 'endTurn' })
  })

  it('plays rent without Double Rent when only one play remains', () => {
    const rent = card('r-db-gr-1')
    const state = makeState({
      turnPhase: { type: 'play', playsRemaining: 1 },
      ai: {
        hand: [rent, card('a-dtr-1')],
        field: [group('darkBlue', ['p-db-1'])],
        bank: [],
      },
      player: {
        hand: [],
        field: [],
        bank: [card('m-2a')],
      },
    })
    expect(getAIDecision(state)).toEqual({
      type: 'playRent',
      cardId: rent.id,
      targetColor: 'darkBlue',
    })
  })

  it('plays Deal Breaker action when opponent has a complete set', () => {
    const dealBreaker = card('a-db-1')
    const state = makeState({
      ai: { hand: [dealBreaker], field: [], bank: [] },
      player: { hand: [], field: [group('brown', ['p-brown-1', 'p-brown-2'])], bank: [] },
    })
    expect(getAIDecision(state)).toEqual({ type: 'playAction', cardId: dealBreaker.id })
  })

  it('does not play Deal Breaker when opponent has no complete sets', () => {
    const state = makeState({
      ai: { hand: [card('a-db-1')], field: [], bank: [] },
      player: { hand: [], field: [group('brown', ['p-brown-1'])], bank: [] },
    })
    expect(getAIDecision(state)).toEqual({ type: 'endTurn' })
  })

  it('plays Sly Deal when there are stealable targets', () => {
    const slyDeal = card('a-sly-1')
    const state = makeState({
      ai: { hand: [slyDeal], field: [], bank: [] },
      player: { hand: [], field: [group('red', ['p-red-1'])], bank: [] },
    })
    expect(getAIDecision(state)).toEqual({ type: 'playAction', cardId: slyDeal.id })
  })

  it('does not play Forced Deal when swap conditions are not met', () => {
    const state = makeState({
      ai: { hand: [card('a-fd-1')], field: [], bank: [] },
      player: { hand: [], field: [group('red', ['p-red-1'])], bank: [] },
    })
    expect(getAIDecision(state)).toEqual({ type: 'endTurn' })
  })

  it('holds Just Say No in hand when there is no discard pressure', () => {
    const jsn = card('a-jsn-1')
    const state = makeState({ ai: { hand: [jsn], field: [], bank: [] } })
    expect(getAIDecision(state)).toEqual({ type: 'endTurn' })
  })

  it('never banks Just Say No even when hand pressure is high', () => {
    const jsn = card('a-jsn-1')
    const state = makeState({
      ai: {
        hand: [
          jsn,
          card('a-dtr-1', 'temp-dtr-1'),
          card('a-dtr-2', 'temp-dtr-2'),
          card('a-dtr-1', 'temp-dtr-3'),
          card('a-dtr-2', 'temp-dtr-4'),
          card('a-dtr-1', 'temp-dtr-5'),
          card('a-dtr-2', 'temp-dtr-6'),
        ],
        field: [],
        bank: [],
      },
      player: {
        hand: [],
        field: [],
        bank: [],
      },
    })

    const decision = getAIDecision(state)
    // AI should never bank JSN — it's too valuable as a defensive card
    expect(decision.type === 'bankCard' && decision.cardId === jsn.id).toBe(false)
  })

  it('banks unknown action cards by default', () => {
    const customAction: MonopolyCardData = {
      ...card('a-pg-1'),
      id: 'a-custom-1',
      name: 'Custom Action',
      type: 'action',
      value: 7,
    }
    const state = makeState({ ai: { hand: [customAction], field: [], bank: [] } })
    expect(getAIDecision(state)).toEqual({ type: 'bankCard', cardId: customAction.id })
  })
  })

  describe('heuristic behavior (flexible scoring choices)', () => {
  it('selects best Sly Deal target based on set need', () => {
    const state = makeState({
      turnPhase: { type: 'awaitingSlyDealTarget' },
      ai: {
        hand: [],
        field: [group('red', ['p-red-1', 'p-red-2'])],
        bank: [],
      },
      player: {
        hand: [],
        field: [group('red', ['p-red-3']), group('brown', ['p-brown-1'])],
        bank: [],
      },
    })
    expect(getAIDecision(state)).toEqual({ type: 'selectTarget', targetCardId: 'p-red-3' })
  })

  it('returns endTurn for Sly Deal target phase when no target exists', () => {
    const state = makeState({
      turnPhase: { type: 'awaitingSlyDealTarget' },
      player: { hand: [], field: [group('brown', ['p-brown-1', 'p-brown-2'])], bank: [] },
    })
    expect(getAIDecision(state)).toEqual({ type: 'endTurn' })
  })

  it('selects highest-rent complete set for Deal Breaker target', () => {
    const state = makeState({
      turnPhase: { type: 'awaitingDealBreakerTarget' },
      player: {
        hand: [],
        field: [
          group('brown', ['p-brown-1', 'p-brown-2']),
          group('darkBlue', ['p-db-1', 'p-db-2']),
        ],
        bank: [],
      },
    })
    expect(getAIDecision(state)).toEqual({ type: 'selectTarget', targetColor: 'darkBlue' })
  })

  it('returns endTurn for Deal Breaker target phase when no complete sets exist', () => {
    const state = makeState({
      turnPhase: { type: 'awaitingDealBreakerTarget' },
      player: { hand: [], field: [group('red', ['p-red-1'])], bank: [] },
    })
    expect(getAIDecision(state)).toEqual({ type: 'endTurn' })
  })

  it('selects target card in Forced Deal take phase', () => {
    const state = makeState({
      turnPhase: { type: 'awaitingForcedDealSelect', phase: 'take', givenCardId: 'p-brown-1' },
      ai: {
        hand: [],
        field: [group('green', ['p-grn-1', 'p-grn-2'])],
        bank: [],
      },
      player: {
        hand: [],
        field: [group('green', ['p-grn-3']), group('brown', ['p-brown-2'])],
        bank: [],
      },
    })
    const decision = getAIDecision(state)
    expect(decision.type).toBe('selectTarget')
    expect(['p-grn-3', 'p-brown-2']).toContain(decision.targetCardId)
  })

  it('chooses building target when a valid set is available', () => {
    const house = card('b-house-1')
    const state = makeState({
      turnPhase: { type: 'awaitingBuildingTarget', cardId: house.id },
      ai: {
        hand: [house],
        field: [group('brown', ['p-brown-1', 'p-brown-2'])],
        bank: [],
      },
    })
    expect(getAIDecision(state)).toEqual({ type: 'selectTarget', targetColor: 'brown' })
  })

  it('returns endTurn when building target card is missing', () => {
    const state = makeState({
      turnPhase: { type: 'awaitingBuildingTarget', cardId: 'missing-card' },
      ai: { hand: [], field: [group('brown', ['p-brown-1', 'p-brown-2'])], bank: [] },
    })
    expect(getAIDecision(state)).toEqual({ type: 'endTurn' })
  })

  it('selects wild color from dual-color wild card', () => {
    const state = makeState({
      turnPhase: { type: 'awaitingWildColor', cardId: 'w-rd-yl-1', context: 'play' },
      ai: {
        hand: [card('w-rd-yl-1')],
        field: [group('red', ['p-red-1', 'p-red-2'])],
        bank: [],
      },
    })
    const decision = getAIDecision(state)
    expect(decision.type).toBe('selectColor')
    expect(['red', 'yellow']).toContain(decision.targetColor)
  })

  it('falls back to brown when rainbow wild has no beneficial color', () => {
    const state = makeState({
      turnPhase: { type: 'awaitingWildColor', cardId: 'w-rainbow-1', context: 'play' },
      ai: {
        hand: [card('w-rainbow-1')],
        field: [
          group('brown', ['p-brown-1', 'p-brown-2']),
          group('lightBlue', ['p-lb-1', 'p-lb-2', 'p-lb-3']),
          group('pink', ['p-pink-1', 'p-pink-2', 'p-pink-3']),
          group('orange', ['p-ora-1', 'p-ora-2', 'p-ora-3']),
          group('red', ['p-red-1', 'p-red-2', 'p-red-3']),
          group('yellow', ['p-yel-1', 'p-yel-2', 'p-yel-3']),
          group('green', ['p-grn-1', 'p-grn-2', 'p-grn-3']),
          group('darkBlue', ['p-db-1', 'p-db-2']),
          group('railroad', ['p-rr-1', 'p-rr-2', 'p-rr-3', 'p-rr-4']),
          group('utility', ['p-util-1', 'p-util-2']),
        ],
        bank: [],
      },
    })
    // All sets are already complete — AI should not try to play into a complete set
    expect(getAIDecision(state)).toEqual({ type: 'endTurn' })
  })

  it('returns endTurn when wild color card is missing from hand', () => {
    const state = makeState({
      turnPhase: { type: 'awaitingWildColor', cardId: 'missing', context: 'play' },
      ai: { hand: [], field: [], bank: [] },
    })
    expect(getAIDecision(state)).toEqual({ type: 'endTurn' })
  })

  it('falls back to brown for rent color when no field groups exist', () => {
    const state = makeState({
      turnPhase: { type: 'awaitingRentColor', cardId: 'r-wild-1' },
      ai: { hand: [], field: [], bank: [] },
    })
    expect(getAIDecision(state)).toEqual({ type: 'selectColor', targetColor: 'brown' })
  })

  it('returns empty payment when AI has no payable cards', () => {
    const state = makeState({
      turnPhase: {
        type: 'awaitingPayment',
        debt: {
          creditor: 'player',
          debtor: 'ai',
          amount: 4,
          source: 'rent',
          selectedPayment: [],
        },
      },
      ai: { hand: [], field: [], bank: [] },
    })
    expect(getAIDecision(state)).toEqual({ type: 'payDebt', paymentCardIds: [] })
  })

  it('accepts JSN outcome when AI has no Just Say No card', () => {
    const state = makeState({
      turnPhase: {
        type: 'awaitingJSN',
        jsnChain: {
          originalAction: {
            actionCard: card('a-dc-1'),
            sourcePlayer: 'player',
          },
          chain: [],
          currentDecider: 'ai',
        },
      },
      ai: { hand: [], field: [], bank: [] },
    })
    expect(getAIDecision(state)).toEqual({ type: 'acceptAction' })
  })

  it('uses JSN against high rent actions', () => {
    const jsn = card('a-jsn-1')
    const state = makeState({
      turnPhase: {
        type: 'awaitingJSN',
        jsnChain: {
          originalAction: {
            actionCard: card('r-rd-yl-1'),
            sourcePlayer: 'player',
            targetColor: 'red',
            doubleRentCardId: 'a-dtr-1',
          },
          chain: [],
          currentDecider: 'ai',
        },
      },
      ai: {
        hand: [jsn],
        field: [],
        bank: [],
      },
      player: {
        hand: [],
        field: [group('red', ['p-red-1', 'p-red-2', 'p-red-3'])],
        bank: [],
      },
    })
    expect(getAIDecision(state)).toEqual({ type: 'useJSN', cardId: jsn.id })
  })

  it('uses JSN against Sly Deal when AI has near-complete sets', () => {
    const jsn = card('a-jsn-1')
    const state = makeState({
      turnPhase: {
        type: 'awaitingJSN',
        jsnChain: {
          originalAction: {
            actionCard: card('a-sly-1'),
            sourcePlayer: 'player',
          },
          chain: [],
          currentDecider: 'ai',
        },
      },
      ai: {
        hand: [jsn],
        field: [group('red', ['p-red-1', 'p-red-2'])],
        bank: [],
      },
    })
    expect(getAIDecision(state)).toEqual({ type: 'useJSN', cardId: jsn.id })
  })

  it('accepts small Debt Collector action when AI bank is deep', () => {
    const jsn = card('a-jsn-1')
    const state = makeState({
      turnPhase: {
        type: 'awaitingJSN',
        jsnChain: {
          originalAction: {
            actionCard: card('a-dc-1'),
            sourcePlayer: 'player',
          },
          chain: [],
          currentDecider: 'ai',
        },
      },
      ai: {
        hand: [jsn],
        field: [],
        bank: [card('m-1a'), card('m-1b'), card('m-2a'), card('m-2b')],
      },
    })
    expect(getAIDecision(state)).toEqual({ type: 'acceptAction' })
  })

  it('does not spend rent plays when opponent cannot pay anything', () => {
    const state = makeState({
      ai: {
        hand: [card('r-db-gr-1'), card('a-dtr-1')],
        field: [group('darkBlue', ['p-db-1'])],
        bank: [],
      },
      player: {
        hand: [],
        field: [],
        bank: [],
      },
    })
    expect(getAIDecision(state)).toEqual({ type: 'endTurn' })
  })

  it('does not waste Debt Collector when opponent has no payable value', () => {
    const state = makeState({
      ai: { hand: [card('a-dc-1')], field: [], bank: [] },
      player: { hand: [], field: [], bank: [] },
    })
    expect(getAIDecision(state)).toEqual({ type: 'endTurn' })
  })

  it('uses Forced Deal when it can improve a near-complete set', () => {
    const forcedDeal = card('a-fd-1')
    const state = makeState({
      ai: {
        hand: [forcedDeal],
        field: [group('green', ['p-grn-1', 'p-grn-2']), group('brown', ['p-brown-1'])],
        bank: [],
      },
      player: {
        hand: [],
        field: [group('green', ['p-grn-3']), group('orange', ['p-ora-1'])],
        bank: [],
      },
    })
    expect(getAIDecision(state)).toEqual({ type: 'playAction', cardId: forcedDeal.id })
  })

  it('avoids giving near-complete-set cards during Forced Deal give phase', () => {
    const state = makeState({
      turnPhase: { type: 'awaitingForcedDealSelect', phase: 'give' },
      ai: {
        hand: [],
        field: [group('red', ['p-red-1', 'p-red-2']), group('railroad', ['p-rr-1'])],
        bank: [],
      },
      player: {
        hand: [],
        field: [group('green', ['p-grn-1'])],
        bank: [],
      },
    })
    expect(getAIDecision(state)).toEqual({ type: 'selectTarget', yourCardId: 'p-rr-1' })
  })

  it('uses JSN against Forced Deal when a near-complete set is exposed', () => {
    const jsn = card('a-jsn-1')
    const state = makeState({
      turnPhase: {
        type: 'awaitingJSN',
        jsnChain: {
          originalAction: {
            actionCard: card('a-fd-1'),
            sourcePlayer: 'player',
          },
          chain: [],
          currentDecider: 'ai',
        },
      },
      ai: {
        hand: [jsn],
        field: [group('red', ['p-red-1', 'p-red-2'])],
        bank: [],
      },
    })
    expect(getAIDecision(state)).toEqual({ type: 'useJSN', cardId: jsn.id })
  })

  it('uses JSN on Debt Collector when AI is nearly broke', () => {
    const jsn = card('a-jsn-1')
    const state = makeState({
      turnPhase: {
        type: 'awaitingJSN',
        jsnChain: {
          originalAction: {
            actionCard: card('a-dc-1'),
            sourcePlayer: 'player',
          },
          chain: [],
          currentDecider: 'ai',
        },
      },
      ai: {
        hand: [jsn],
        field: [],
        bank: [card('m-1a')],
      },
    })
    expect(getAIDecision(state)).toEqual({ type: 'useJSN', cardId: jsn.id })
  })

  it('uses JSN on Debt Collector when opponent is one set from winning', () => {
    const jsn = card('a-jsn-1')
    const state = makeState({
      turnPhase: {
        type: 'awaitingJSN',
        jsnChain: {
          originalAction: {
            actionCard: card('a-dc-1'),
            sourcePlayer: 'player',
          },
          chain: [],
          currentDecider: 'ai',
        },
      },
      ai: {
        hand: [jsn],
        field: [],
        bank: [card('m-2a'), card('m-2b'), card('m-1a')],
      },
      player: {
        hand: [],
        field: [
          group('brown', ['p-brown-1', 'p-brown-2']),
          group('darkBlue', ['p-db-1', 'p-db-2']),
        ],
        bank: [],
      },
    })
    expect(getAIDecision(state)).toEqual({ type: 'useJSN', cardId: jsn.id })
  })

  it('prefers paying from bank over breaking near-complete sets', () => {
    const state = makeState({
      turnPhase: {
        type: 'awaitingPayment',
        debt: {
          creditor: 'player',
          debtor: 'ai',
          amount: 3,
          source: 'debtCollector',
          selectedPayment: [],
        },
      },
      ai: {
        hand: [],
        bank: [card('m-1a'), card('m-2a'), card('m-5a')],
        field: [group('red', ['p-red-1', 'p-red-2'])],
      },
    })
    const decision = getAIDecision(state)
    expect(decision.type).toBe('payDebt')
    expect(decision.paymentCardIds).toHaveLength(2)
    expect(decision.paymentCardIds).toContain('m-1a')
    expect(decision.paymentCardIds).toContain('m-2a')
  })

  it('prefers Pass Go over banking when hand is very small', () => {
    const passGo = card('a-pg-1')
    const state = makeState({
      ai: {
        hand: [passGo, card('m-10')],
        field: [],
        bank: [],
      },
      player: {
        hand: [],
        field: [],
        bank: [card('m-2a')],
      },
    })
    expect(getAIDecision(state)).toEqual({ type: 'playAction', cardId: passGo.id })
  })

  it('discards unusable buildings before high-impact actions', () => {
    const state = makeState({
      turnPhase: { type: 'discard', mustDiscard: 1 },
      ai: {
        hand: [card('b-hotel-1'), card('a-db-1')],
        field: [],
        bank: [],
      },
    })
    expect(getAIDecision(state)).toEqual({ type: 'discard', discardCardIds: ['b-hotel-1'] })
  })

  it('prioritizes disruptive Forced Deal over Pass Go under high opponent threat', () => {
    const forcedDeal = card('a-fd-1')
    const passGo = card('a-pg-1')
    const state = makeState({
      ai: {
        hand: [forcedDeal, passGo],
        field: [group('railroad', ['p-rr-1'])],
        bank: [],
      },
      player: {
        hand: [],
        field: [
          group('brown', ['p-brown-1', 'p-brown-2']),
          group('darkBlue', ['p-db-1', 'p-db-2']),
          group('red', ['p-red-1']),
        ],
        bank: [],
      },
    })
    expect(getAIDecision(state)).toEqual({ type: 'playAction', cardId: forcedDeal.id })
  })

  it('chooses a building relocation target with the highest rent', () => {
    const state = makeState({
      turnPhase: {
        type: 'awaitingBuildingRelocation',
        buildingCardId: 'b-house-1',
        sourceColor: 'brown',
      },
      ai: {
        hand: [],
        field: [
          group('brown', ['p-brown-1', 'p-brown-2'], ['b-house-1']),
          group('red', ['p-red-1', 'p-red-2', 'p-red-3']),
          group('orange', ['p-ora-1', 'p-ora-2', 'p-ora-3']),
        ],
        bank: [],
      },
    })
    expect(getAIDecision(state)).toEqual({ type: 'selectTarget', targetColor: 'red' })
  })

  it('returns endTurn for building relocation when no valid target exists', () => {
    const state = makeState({
      turnPhase: {
        type: 'awaitingBuildingRelocation',
        buildingCardId: 'b-house-1',
        sourceColor: 'brown',
      },
      ai: {
        hand: [],
        field: [
          group('brown', ['p-brown-1', 'p-brown-2'], ['b-house-1']),
          group('red', ['p-red-1', 'p-red-2']),
        ],
        bank: [],
      },
    })
    expect(getAIDecision(state)).toEqual({ type: 'endTurn' })
  })

  it('plays rainbow wild as a property during play phase', () => {
    const state = makeState({
      turnPhase: { type: 'play', playsRemaining: 3 },
      ai: {
        hand: [card('w-rainbow-1')],
        field: [group('red', ['p-red-1', 'p-red-2'])],
        bank: [],
      },
    })
    expect(getAIDecision(state)).toEqual({
      type: 'playProperty',
      cardId: 'w-rainbow-1',
      targetColor: 'red',
    })
  })

  it('plays wild rent by choosing the highest-rent owned color', () => {
    const state = makeState({
      turnPhase: { type: 'play', playsRemaining: 3 },
      ai: {
        hand: [card('r-wild-1')],
        field: [
          group('brown', ['p-brown-1']),
          group('red', ['p-red-1', 'p-red-2', 'p-red-3']),
        ],
        bank: [],
      },
      player: {
        hand: [],
        field: [],
        bank: [card('m-10')],
      },
    })
    expect(getAIDecision(state)).toEqual({
      type: 'playRent',
      cardId: 'r-wild-1',
      targetColor: 'red',
    })
  })

  it('returns all payable cards when debt exceeds total payable value', () => {
    const state = makeState({
      turnPhase: {
        type: 'awaitingPayment',
        debt: {
          creditor: 'player',
          debtor: 'ai',
          amount: 20,
          source: 'rent',
          selectedPayment: [],
        },
      },
      ai: {
        hand: [],
        bank: [card('m-5a'), card('m-2a')],
        field: [],
      },
    })
    const decision = getAIDecision(state)
    expect(decision.type).toBe('payDebt')
    expect(decision.paymentCardIds).toHaveLength(2)
    expect(decision.paymentCardIds).toContain('m-5a')
    expect(decision.paymentCardIds).toContain('m-2a')
  })

  it('uses JSN against Birthday when AI is low on total value', () => {
    const jsn = card('a-jsn-1')
    const state = makeState({
      turnPhase: {
        type: 'awaitingJSN',
        jsnChain: {
          originalAction: {
            actionCard: card('a-bday-1'),
            sourcePlayer: 'player',
          },
          chain: [],
          currentDecider: 'ai',
        },
      },
      ai: {
        hand: [jsn],
        field: [],
        bank: [card('m-1a'), card('m-1b')],
      },
    })
    expect(getAIDecision(state)).toEqual({ type: 'useJSN', cardId: jsn.id })
  })

  it('prioritizes Pass Go when hand is thin and options are limited', () => {
    const passGo = card('a-pg-1')
    const state = makeState({
      ai: {
        hand: [passGo, card('m-1a'), card('m-1b')],
        field: [],
        bank: [],
      },
    })
    expect(getAIDecision(state)).toEqual({ type: 'playAction', cardId: passGo.id })
  })

  it('still plays Pass Go when it is the highest-value tempo play', () => {
    const passGo = card('a-pg-1')
    const state = makeState({
      ai: {
        hand: [passGo, card('m-1a'), card('m-1b'), card('m-1c'), card('m-1d'), card('m-1e'), card('m-2a')],
        field: [],
        bank: [],
      },
    })
    expect(getAIDecision(state)).toEqual({ type: 'playAction', cardId: passGo.id })
  })

  it('plays a low-scoring stabilizing move under severe opponent threat', () => {
    const state = makeState({
      ai: {
        hand: [card('p-brown-1'), card('a-dtr-1'), card('a-dtr-2')],
        field: [group('brown', ['p-brown-2'])],
        bank: [],
      },
      player: {
        hand: [],
        field: [
          group('brown', ['p-brown-1', 'p-brown-2']),
          group('darkBlue', ['p-db-1', 'p-db-2']),
        ],
        bank: [],
      },
    })
    expect(getAIDecision(state)).toEqual({
      type: 'playProperty',
      cardId: 'p-brown-1',
      targetColor: 'brown',
    })
  })

  it('can still pass under moderate threat when all moves are low value', () => {
    const state = makeState({
      ai: {
        hand: [card('p-brown-1'), card('a-dtr-1'), card('a-dtr-2')],
        field: [group('brown', ['p-brown-1', 'p-brown-2'])],
        bank: [],
      },
      player: {
        hand: [],
        field: [group('brown', ['p-brown-1', 'p-brown-2'])],
        bank: [],
      },
    })
    expect(getAIDecision(state)).toEqual({ type: 'endTurn' })
  })

  it('passes under low threat when no move clears baseline value', () => {
    const state = makeState({
      ai: {
        hand: [card('p-brown-1'), card('a-dtr-1'), card('a-dtr-2')],
        field: [group('brown', ['p-brown-1', 'p-brown-2'])],
        bank: [],
      },
      player: {
        hand: [],
        field: [],
        bank: [],
      },
    })
    expect(getAIDecision(state)).toEqual({ type: 'endTurn' })
  })
  })

  describe('lookahead, hidden info, and tuning telemetry', () => {
    it('tracks lookahead for Deal Breaker, Sly Deal, Forced Deal, and large rent', () => {
      setAIDifficultyMode('aggressive')
      const scenarios: MonopolyDealState[] = [
        makeState({
          ai: { hand: [card('a-db-1')], field: [], bank: [] },
          player: { hand: [], field: [group('brown', ['p-brown-1', 'p-brown-2'])], bank: [] },
        }),
        makeState({
          ai: { hand: [card('a-sly-1')], field: [], bank: [] },
          player: { hand: [], field: [group('red', ['p-red-1'])], bank: [] },
        }),
        makeState({
          ai: { hand: [card('a-fd-1')], field: [group('brown', ['p-brown-1'])], bank: [] },
          player: { hand: [], field: [group('red', ['p-red-1'])], bank: [] },
        }),
        makeState({
          ai: {
            hand: [card('r-wild-1')],
            field: [group('red', ['p-red-1', 'p-red-2', 'p-red-3'])],
            bank: [],
          },
          player: {
            hand: [],
            field: [],
            bank: [card('m-10')],
          },
        }),
      ]

      for (const scenario of scenarios) {
        getAIDecision(scenario)
      }

      const telemetry = getAITelemetrySnapshot()
      expect(telemetry.lookaheadEvaluations).toBeGreaterThanOrEqual(4)
      expect(telemetry.hiddenRiskPenaltyTotal).toBeGreaterThan(0)
    })

    it('reduces hidden-risk penalty when all Just Say No cards are publicly visible', () => {
      const baseline = makeState({
        ai: {
          hand: [card('r-wild-1')],
          field: [group('red', ['p-red-1', 'p-red-2', 'p-red-3'])],
          bank: [],
        },
        player: {
          hand: [
            card('m-1a', 'ph-1'),
            card('m-1b', 'ph-2'),
            card('m-1c', 'ph-3'),
            card('m-1d', 'ph-4'),
            card('m-1e', 'ph-5'),
          ],
          field: [],
          bank: [card('m-10')],
        },
      })

      getAIDecision(baseline)
      const baselinePenalty = getAITelemetrySnapshot().hiddenRiskPenaltyTotal
      expect(baselinePenalty).toBeGreaterThan(0)

      resetAITelemetry()
      const revealedAllJSN = makeState({
        ...baseline,
        discardPile: [card('a-jsn-1'), card('a-jsn-2'), card('a-jsn-3')],
      })

      getAIDecision(revealedAllJSN)
      const revealedPenalty = getAITelemetrySnapshot().hiddenRiskPenaltyTotal
      expect(revealedPenalty).toBeLessThan(baselinePenalty)
    })

    it('does not depend on hidden opponent hand identities when public state is unchanged', () => {
      const basePublic = {
        ai: {
          hand: [card('r-wild-1')],
          field: [group('red', ['p-red-1', 'p-red-2', 'p-red-3'])],
          bank: [],
        },
        player: {
          hand: [] as MonopolyCardData[],
          field: [],
          bank: [card('m-10')],
        },
      }

      const withHiddenJSN = makeState({
        ...basePublic,
        player: {
          ...basePublic.player,
          hand: [
            card('a-jsn-1', 'hidden-a'),
            card('a-jsn-2', 'hidden-b'),
            card('a-jsn-3', 'hidden-c'),
          ],
        },
      })

      const withHiddenMoney = makeState({
        ...basePublic,
        player: {
          ...basePublic.player,
          hand: [
            card('m-1a', 'hidden-d'),
            card('m-1b', 'hidden-e'),
            card('m-1c', 'hidden-f'),
          ],
        },
      })

      const decisionA = getAIDecision(withHiddenJSN)
      resetAITelemetry()
      const decisionB = getAIDecision(withHiddenMoney)
      expect(decisionA).toEqual(decisionB)
    })

    it('uses exact minimal-overpay subset for debt payment', () => {
      const state = makeState({
        turnPhase: {
          type: 'awaitingPayment',
          debt: {
            creditor: 'player',
            debtor: 'ai',
            amount: 6,
            source: 'rent',
            selectedPayment: [],
          },
        },
        ai: {
          hand: [],
          bank: [card('m-5a'), card('m-2a')],
          field: [group('brown', ['p-brown-1'])],
        },
      })

      const decision = getAIDecision(state)
      expect(decision.type).toBe('payDebt')
      expect(decision.paymentCardIds).toContain('m-5a')
      expect(decision.paymentCardIds).toContain('p-brown-1')
      expect(decision.paymentCardIds).not.toContain('m-2a')

      const telemetry = getAITelemetrySnapshot()
      expect(telemetry.paymentSearchCalls).toBeGreaterThan(0)
      expect(telemetry.paymentSearchNodesVisited).toBeGreaterThan(0)
      expect(telemetry.paymentExactMatches).toBeGreaterThan(0)
    })

    it('adapts profile in adaptive mode and allows explicit profile override', () => {
      setAIDifficultyMode('adaptive')
      const behind = makeState({
        ai: { hand: [card('m-1a')], field: [], bank: [] },
        player: {
          hand: [],
          field: [
            group('brown', ['p-brown-1', 'p-brown-2']),
            group('darkBlue', ['p-db-1', 'p-db-2']),
          ],
          bank: [],
        },
      })
      getAIDecision(behind)

      const ahead = makeState({
        ai: {
          hand: [card('m-1a')],
          field: [
            group('brown', ['p-brown-1', 'p-brown-2']),
            group('darkBlue', ['p-db-1', 'p-db-2']),
          ],
          bank: [card('m-10')],
        },
        player: { hand: [], field: [], bank: [] },
      })
      getAIDecision(ahead)

      let telemetry = getAITelemetrySnapshot()
      expect(telemetry.byProfile.aggressive).toBeGreaterThan(0)
      expect(telemetry.byProfile.defensive).toBeGreaterThan(0)

      setAIDifficultyMode('defensive')
      expect(getAIDifficultyMode()).toBe('defensive')
      getAIDecision(behind)
      telemetry = getAITelemetrySnapshot()
      expect(telemetry.byProfile.defensive).toBeGreaterThan(1)
    })

    it('uses opponent behavior posterior to decide Debt Collector JSN usage', () => {
      const calmState = makeState({
        turnPhase: {
          type: 'awaitingJSN',
          jsnChain: {
            originalAction: {
              actionCard: card('a-dc-1'),
              sourcePlayer: 'player',
            },
            chain: [],
            currentDecider: 'ai',
          },
        },
        ai: {
          hand: [card('a-jsn-1')],
          field: [],
          bank: [card('m-2a'), card('m-2b'), card('m-1a'), card('m-1b')],
        },
        log: [
          { turn: 1, player: 'player', action: 'Banked $1M (M1M)', timestamp: 1 },
          { turn: 2, player: 'player', action: 'Drew 2 cards', timestamp: 2 },
          { turn: 3, player: 'player', action: 'Played Pass Go — drew 2 cards', timestamp: 3 },
          { turn: 4, player: 'player', action: 'Banked $2M (M2M)', timestamp: 4 },
        ],
      })

      const aggressiveState = makeState({
        ...calmState,
        log: [
          { turn: 1, player: 'player', action: 'Played Deal Breaker!', timestamp: 11 },
          { turn: 2, player: 'player', action: 'Played Forced Deal', timestamp: 12 },
          { turn: 3, player: 'player', action: 'Played Sly Deal', timestamp: 13 },
          { turn: 4, player: 'player', action: 'Charged M6M rent for red', timestamp: 14 },
        ],
      })

      expect(getAIDecision(calmState)).toEqual({ type: 'acceptAction' })
      expect(getAIDecision(aggressiveState)).toEqual({ type: 'useJSN', cardId: 'a-jsn-1' })
    })

    it('runs selective depth-3 lookahead with telemetry in near-lethal states', () => {
      setAIDifficultyMode('aggressive')
      const nearLethal = makeState({
        ai: {
          hand: [card('a-db-1'), card('a-sly-1'), card('r-wild-1'), card('p-red-3')],
          field: [
            group('red', ['p-red-1', 'p-red-2']),
            group('utility', ['p-util-1']),
          ],
          bank: [],
        },
        player: {
          hand: [],
          field: [
            group('brown', ['p-brown-1', 'p-brown-2']),
            group('darkBlue', ['p-db-1', 'p-db-2']),
            group('orange', ['p-ora-1']),
          ],
          bank: [card('m-10')],
        },
      })

      getAIDecision(nearLethal)
      const telemetry = getAITelemetrySnapshot()
      expect(telemetry.lookaheadDepth3Evaluations).toBeGreaterThan(0)
      expect(telemetry.lookaheadNodesVisited).toBeGreaterThan(0)
      expect(telemetry.totalDecisionMs).toBeGreaterThanOrEqual(0)
      expect(telemetry.maxDecisionMs).toBeGreaterThanOrEqual(telemetry.totalDecisionMs / telemetry.totalDecisions)
    })

    it('enforces a lookahead node budget on oversized tactical branches', () => {
      setAIDifficultyMode('aggressive')
      const oversizedHand = [
        card('a-db-1'),
        ...Array.from({ length: 45 }, (_, i) => card('m-1a', `ai-m-${i}`)),
      ]
      const state = makeState({
        ai: {
          hand: oversizedHand,
          field: [],
          bank: [],
        },
        player: {
          hand: [],
          field: [
            group('brown', ['p-brown-1', 'p-brown-2']),
            group('darkBlue', ['p-db-1', 'p-db-2']),
          ],
          bank: [],
        },
      })

      getAIDecision(state)
      const telemetry = getAITelemetrySnapshot()
      expect(telemetry.lookaheadBudgetHits).toBeGreaterThan(0)
      expect(telemetry.lookaheadNodesVisited).toBeGreaterThan(0)
    })

    it('evaluates building/rent/action follow-ups in lookahead and discard building usability callback', () => {
      setAIDifficultyMode('aggressive')
      const highImpactState = makeState({
        ai: {
          hand: [card('a-db-1'), card('b-house-1'), card('r-db-gr-1'), card('a-sly-1')],
          field: [
            group('brown', ['p-brown-1', 'p-brown-2']),
            group('darkBlue', ['p-db-1']),
          ],
          bank: [],
        },
        player: {
          hand: [],
          field: [
            group('red', ['p-red-1', 'p-red-2', 'p-red-3']),
            group('orange', ['p-ora-1']),
          ],
          bank: [card('m-5a')],
        },
      })
      getAIDecision(highImpactState)

      const discardState = makeState({
        turnPhase: { type: 'discard', mustDiscard: 1 },
        ai: {
          hand: [card('b-house-1'), card('m-1a')],
          field: [group('brown', ['p-brown-1', 'p-brown-2'])],
          bank: [],
        },
      })
      const discardDecision = getAIDecision(discardState)
      expect(discardDecision).toEqual({ type: 'discard', discardCardIds: ['m-1a'] })
    })
  })
})
