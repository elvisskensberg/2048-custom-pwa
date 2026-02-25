import { describe, it, expect } from 'vitest'
import { getAIDecision } from './aiStrategy'
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
    expect(decision).toEqual({ type: 'endTurn' })
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
    expect(decision.paymentCardIds).toEqual(['m-1a', 'm-2a'])
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

  it('discards lowest-value cards first', () => {
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
    expect(decision.discardCardIds).toContain('p-brown-1')
    expect(decision.discardCardIds).not.toContain('m-10')
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

  it('banks Just Say No in play phase', () => {
    const jsn = card('a-jsn-1')
    const state = makeState({ ai: { hand: [jsn], field: [], bank: [] } })
    expect(getAIDecision(state)).toEqual({ type: 'bankCard', cardId: jsn.id })
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
    expect(getAIDecision(state)).toEqual({ type: 'selectTarget', targetCardId: 'p-grn-3' })
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
    expect(getAIDecision(state)).toEqual({ type: 'selectColor', targetColor: 'red' })
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
    expect(getAIDecision(state)).toEqual({ type: 'selectColor', targetColor: 'brown' })
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
})
