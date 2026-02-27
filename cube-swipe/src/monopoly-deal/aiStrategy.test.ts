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
  PlayerState,
  PropertyGroup,
  TurnPhase,
} from './gameEngine'
import {
  canPlaceBuilding,
  getBuildingRelocationTargets,
  getCompleteSetColors,
  getStealableProperties,
} from './gameEngine'
import {
  type MonopolyCardData,
  type PropertyColor,
  SET_SIZE,
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

const PROPERTY_COLOR_LIST: PropertyColor[] = [
  'brown',
  'lightBlue',
  'pink',
  'orange',
  'red',
  'yellow',
  'green',
  'darkBlue',
  'railroad',
  'utility',
]

const FUZZ_HAND_BASE_IDS = [
  'p-brown-1',
  'p-red-1',
  'p-red-2',
  'p-lb-1',
  'w-br-lb',
  'w-rainbow-1',
  'm-1a',
  'm-2a',
  'm-5a',
  'r-db-gr-1',
  'r-rd-yl-1',
  'r-wild-1',
  'a-db-1',
  'a-sly-1',
  'a-fd-1',
  'a-dc-1',
  'a-bday-1',
  'a-pg-1',
  'a-jsn-1',
  'a-dtr-1',
  'b-house-1',
  'b-hotel-1',
] as const

const FUZZ_FIELD_CARDS_BY_COLOR: Record<PropertyColor, string[]> = {
  brown: ['p-brown-1', 'p-brown-2'],
  lightBlue: ['p-lb-1', 'p-lb-2', 'p-lb-3'],
  pink: ['p-pink-1', 'p-pink-2', 'p-pink-3'],
  orange: ['p-ora-1', 'p-ora-2', 'p-ora-3'],
  red: ['p-red-1', 'p-red-2', 'p-red-3'],
  yellow: ['p-yel-1', 'p-yel-2', 'p-yel-3'],
  green: ['p-grn-1', 'p-grn-2', 'p-grn-3'],
  darkBlue: ['p-db-1', 'p-db-2'],
  railroad: ['p-rr-1', 'p-rr-2', 'p-rr-3', 'p-rr-4'],
  utility: ['p-util-1', 'p-util-2'],
}

const FUZZ_MONEY_IDS = ['m-1a', 'm-2a', 'm-3a', 'm-4a', 'm-5a', 'm-10'] as const

function createSeededRandom(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0
    return value / 0x100000000
  }
}

function randomInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1))
}

function randomPick<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)]
}

function buildRandomPlayerState(random: () => number, prefix: string): PlayerState {
  let uniqueId = 0
  const nextId = (baseId: string): string => `${prefix}-${baseId}-${uniqueId++}`
  const hand: MonopolyCardData[] = []
  const bank: MonopolyCardData[] = []
  const field: PropertyGroup[] = []

  const handCount = randomInt(random, 2, 8)
  for (let i = 0; i < handCount; i++) {
    const baseId = randomPick(random, FUZZ_HAND_BASE_IDS)
    hand.push(card(baseId, nextId(baseId)))
  }

  const bankCount = randomInt(random, 0, 3)
  for (let i = 0; i < bankCount; i++) {
    const baseId = randomPick(random, FUZZ_MONEY_IDS)
    bank.push(card(baseId, nextId(baseId)))
  }

  const groupCount = randomInt(random, 0, 3)
  const availableColors = [...PROPERTY_COLOR_LIST]
  for (let gi = 0; gi < groupCount && availableColors.length > 0; gi++) {
    const colorIndex = randomInt(random, 0, availableColors.length - 1)
    const color = availableColors.splice(colorIndex, 1)[0]
    const pool = FUZZ_FIELD_CARDS_BY_COLOR[color]
    const cardsInGroup: MonopolyCardData[] = []
    const groupCardCount = randomInt(random, 1, Math.max(1, pool.length))
    for (let ci = 0; ci < groupCardCount; ci++) {
      const baseId = pool[ci % pool.length]
      cardsInGroup.push(card(baseId, nextId(baseId)))
    }

    const buildings: MonopolyCardData[] = []
    if (
      color !== 'railroad'
      && color !== 'utility'
      && cardsInGroup.length >= SET_SIZE[color]
    ) {
      if (random() < 0.45) {
        buildings.push(card('b-house-1', nextId('b-house-1')))
      }
      if (buildings.length > 0 && random() < 0.25) {
        buildings.push(card('b-hotel-1', nextId('b-hotel-1')))
      }
    }

    field.push({ color, cards: cardsInGroup, buildings })
  }

  return { hand, field, bank }
}

function ensureCardInHand(ps: PlayerState, cardId: string, uniqueId: string): PlayerState {
  if (ps.hand.some((c) => c.id === cardId)) return ps
  return { ...ps, hand: [...ps.hand, card(cardId, uniqueId)] }
}

function collectPayableIds(ps: PlayerState): Set<string> {
  const ids = new Set<string>()
  for (const cardData of ps.bank) ids.add(cardData.id)
  for (const propertyGroup of ps.field) {
    for (const fieldCard of propertyGroup.cards) ids.add(fieldCard.id)
    for (const buildingCard of propertyGroup.buildings) ids.add(buildingCard.id)
  }
  return ids
}

function makeInvariantFuzzState(random: () => number, trial: number): MonopolyDealState {
  let ai = buildRandomPlayerState(random, `ai-${trial}`)
  let player = buildRandomPlayerState(random, `pl-${trial}`)
  let turnPhase: TurnPhase = { type: 'play', playsRemaining: randomInt(random, 1, 3) }

  switch (trial % 11) {
    case 0:
      turnPhase = { type: 'play', playsRemaining: randomInt(random, 1, 3) }
      break
    case 1:
      turnPhase = {
        type: 'awaitingPayment',
        debt: {
          creditor: 'player',
          debtor: 'ai',
          amount: randomInt(random, 1, 10),
          source: 'rent',
          selectedPayment: [],
        },
      }
      if (collectPayableIds(ai).size === 0) {
        ai = { ...ai, bank: [card('m-1a', `ai-pay-${trial}`)] }
      }
      break
    case 2:
      turnPhase = {
        type: 'awaitingJSN',
        jsnChain: {
          originalAction: {
            actionCard: card(randomPick(random, ['a-db-1', 'a-sly-1', 'a-fd-1', 'a-dc-1', 'a-bday-1'])),
            sourcePlayer: 'player',
          },
          chain: [],
          currentDecider: 'ai',
        },
      }
      if (random() < 0.65) {
        ai = ensureCardInHand(ai, 'a-jsn-1', `ai-jsn-${trial}`)
      }
      break
    case 3:
      turnPhase = { type: 'awaitingSlyDealTarget' }
      break
    case 4:
      turnPhase = { type: 'awaitingDealBreakerTarget' }
      if (!player.field.some((groupData) => groupData.cards.length >= SET_SIZE[groupData.color])) {
        player = {
          ...player,
          field: [{ color: 'brown', cards: [card('p-brown-1', `pl-b1-${trial}`), card('p-brown-2', `pl-b2-${trial}`)], buildings: [] }],
        }
      }
      break
    case 5:
      turnPhase = { type: 'awaitingForcedDealSelect', phase: 'give' }
      break
    case 6:
      turnPhase = { type: 'awaitingForcedDealSelect', phase: 'take', givenCardId: `given-${trial}` }
      break
    case 7:
      turnPhase = { type: 'awaitingBuildingTarget', cardId: `ai-house-${trial}` }
      ai = ensureCardInHand(ai, 'b-house-1', `ai-house-${trial}`)
      break
    case 8: {
      const sourceColor = ai.field[0]?.color ?? 'brown'
      turnPhase = {
        type: 'awaitingBuildingRelocation',
        buildingCardId: `ai-relocate-house-${trial}`,
        sourceColor,
      }
      ai = {
        ...ai,
        field: [
          { color: 'brown', cards: [card('p-brown-1', `ai-rb1-${trial}`), card('p-brown-2', `ai-rb2-${trial}`)], buildings: [card('b-house-1', `ai-relocate-house-${trial}`)] },
          { color: 'red', cards: [card('p-red-1', `ai-rr1-${trial}`), card('p-red-2', `ai-rr2-${trial}`), card('p-red-3', `ai-rr3-${trial}`)], buildings: [] },
        ],
      }
      break
    }
    case 9:
      turnPhase = { type: 'awaitingWildColor', cardId: `ai-wild-${trial}`, context: 'play' }
      ai = ensureCardInHand(ai, random() < 0.5 ? 'w-br-lb' : 'w-rainbow-1', `ai-wild-${trial}`)
      break
    case 10:
      turnPhase = { type: 'awaitingRentColor', cardId: `ai-rent-${trial}` }
      break
  }

  return makeState({
    ai,
    player,
    turnPhase,
    currentTurn: 'ai',
    turnNumber: randomInt(random, 1, 20),
  })
}

function assertDecisionLegalForPhase(state: MonopolyDealState, decision: ReturnType<typeof getAIDecision>): void {
  const ai = state.ai
  const phase = state.turnPhase
  const handById = new Map(ai.hand.map((cardData) => [cardData.id, cardData]))

  switch (phase.type) {
    case 'play': {
      const allowed = new Set(['playProperty', 'bankCard', 'playAction', 'playBuilding', 'playRent', 'endTurn'])
      expect(allowed.has(decision.type)).toBe(true)
      if (decision.type === 'endTurn') return

      expect(typeof decision.cardId).toBe('string')
      const sourceCard = decision.cardId ? handById.get(decision.cardId) : undefined
      expect(sourceCard).toBeDefined()
      if (!sourceCard) return

      if (decision.type === 'playProperty') {
        expect(decision.targetColor).toBeDefined()
        if (sourceCard.type === 'property') expect(decision.targetColor).toBe(sourceCard.color)
        if (sourceCard.type === 'wild' && sourceCard.color && sourceCard.color2) {
          expect([sourceCard.color, sourceCard.color2]).toContain(decision.targetColor)
        }
      }

      if (decision.type === 'playBuilding') {
        expect(sourceCard.type).toBe('building')
        const targetGroup = ai.field.find((groupData) => groupData.color === decision.targetColor)
        expect(targetGroup ? canPlaceBuilding(sourceCard, targetGroup) : false).toBe(true)
      }

      if (decision.type === 'playRent') {
        expect(sourceCard.type).toBe('rent')
        expect(decision.targetColor).toBeDefined()
        if (sourceCard.color && !sourceCard.color2) expect(decision.targetColor).toBe(sourceCard.color)
        if (sourceCard.color && sourceCard.color2) expect([sourceCard.color, sourceCard.color2]).toContain(decision.targetColor)
        if (decision.doubleRentCardId) {
          const doubleRent = handById.get(decision.doubleRentCardId)
          expect(doubleRent?.name).toBe('Double Rent')
        }
      }

      if (decision.type === 'playAction') {
        expect(sourceCard.type).toBe('action')
      }
      return
    }
    case 'awaitingPayment': {
      expect(['payDebt', 'wait']).toContain(decision.type)
      if (decision.type !== 'payDebt') return
      const payableIds = collectPayableIds(ai)
      const selectedIds = decision.paymentCardIds ?? []
      expect(new Set(selectedIds).size).toBe(selectedIds.length)
      for (const selectedId of selectedIds) expect(payableIds.has(selectedId)).toBe(true)
      return
    }
    case 'awaitingJSN': {
      expect(['useJSN', 'acceptAction', 'wait']).toContain(decision.type)
      if (decision.type === 'useJSN') {
        const jsnCard = decision.cardId ? handById.get(decision.cardId) : undefined
        expect(jsnCard?.name).toBe('Just Say No')
      }
      return
    }
    case 'awaitingSlyDealTarget': {
      expect(['selectTarget', 'endTurn']).toContain(decision.type)
      if (decision.type === 'selectTarget') {
        const targetIds = new Set(getStealableProperties(state.player).map((entry) => entry.card.id))
        expect(targetIds.has(decision.targetCardId ?? '')).toBe(true)
      }
      return
    }
    case 'awaitingDealBreakerTarget': {
      expect(['selectTarget', 'endTurn']).toContain(decision.type)
      if (decision.type === 'selectTarget') {
        const colors = getCompleteSetColors(state.player)
        expect(colors).toContain(decision.targetColor)
      }
      return
    }
    case 'awaitingForcedDealSelect': {
      expect(['selectTarget', 'endTurn']).toContain(decision.type)
      if (decision.type !== 'selectTarget') return
      if (phase.phase === 'give') {
        const ids = new Set(getStealableProperties(state.ai).map((entry) => entry.card.id))
        expect(ids.has(decision.yourCardId ?? '')).toBe(true)
      } else {
        const ids = new Set(getStealableProperties(state.player).map((entry) => entry.card.id))
        expect(ids.has(decision.targetCardId ?? '')).toBe(true)
      }
      return
    }
    case 'awaitingBuildingTarget': {
      expect(['selectTarget', 'endTurn']).toContain(decision.type)
      if (decision.type === 'selectTarget') {
        const building = handById.get(phase.cardId)
        const target = state.ai.field.find((groupData) => groupData.color === decision.targetColor)
        expect(building && target ? canPlaceBuilding(building, target) : false).toBe(true)
      }
      return
    }
    case 'awaitingBuildingRelocation': {
      expect(['selectTarget', 'endTurn']).toContain(decision.type)
      if (decision.type === 'selectTarget') {
        const targets = getBuildingRelocationTargets(state, 'ai', phase.buildingCardId, phase.sourceColor)
        expect(targets).toContain(decision.targetColor)
      }
      return
    }
    case 'awaitingWildColor': {
      expect(['selectColor', 'endTurn']).toContain(decision.type)
      if (decision.type === 'selectColor') {
        expect(PROPERTY_COLOR_LIST).toContain(decision.targetColor)
      }
      return
    }
    case 'awaitingRentColor': {
      expect(['selectColor', 'endTurn']).toContain(decision.type)
      if (decision.type === 'selectColor') {
        expect(PROPERTY_COLOR_LIST).toContain(decision.targetColor)
      }
      return
    }
    default:
      return
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
  it('selects a legal Sly Deal target from stealable properties', () => {
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
    const decision = getAIDecision(state)
    expect(decision.type).toBe('selectTarget')
    const legalTargets = new Set(getStealableProperties(state.player).map((entry) => entry.card.id))
    expect(legalTargets.has(decision.targetCardId ?? '')).toBe(true)
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

  it('selects a valid rent color even when no field groups exist', () => {
    const state = makeState({
      turnPhase: { type: 'awaitingRentColor', cardId: 'r-wild-1' },
      ai: { hand: [], field: [], bank: [] },
    })
    const decision = getAIDecision(state)
    expect(decision.type).toBe('selectColor')
    expect(PROPERTY_COLOR_LIST).toContain(decision.targetColor)
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

  it('chooses a legal tempo-positive move when hand is very small', () => {
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
    const decision = getAIDecision(state)
    assertDecisionLegalForPhase(state, decision)
    expect(['playAction', 'bankCard']).toContain(decision.type)
    if (decision.type === 'playAction') expect(decision.cardId).toBe(passGo.id)
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

  it('chooses a legal tempo action under high opponent threat', () => {
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
    const decision = getAIDecision(state)
    expect(decision.type).toBe('playAction')
    expect([forcedDeal.id, passGo.id]).toContain(decision.cardId)
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

  it('chooses a legal non-passive move when hand is thin and options are limited', () => {
    const passGo = card('a-pg-1')
    const state = makeState({
      ai: {
        hand: [passGo, card('m-1a'), card('m-1b')],
        field: [],
        bank: [],
      },
    })
    const decision = getAIDecision(state)
    assertDecisionLegalForPhase(state, decision)
    expect(decision.type).not.toBe('endTurn')
    if (decision.type === 'playAction') expect(decision.cardId).toBe(passGo.id)
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
    const decision = getAIDecision(state)
    assertDecisionLegalForPhase(state, decision)
    expect(['playAction', 'bankCard']).toContain(decision.type)
    if (decision.type === 'playAction') {
      expect(decision.cardId).toBe(passGo.id)
    }
  })

  it('makes a legal non-pass move under severe opponent threat', () => {
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
    const decision = getAIDecision(state)
    expect(decision.type).not.toBe('endTurn')
    if (decision.type === 'playProperty' || decision.type === 'playAction' || decision.type === 'bankCard') {
      expect(state.ai.hand.some((cardData) => cardData.id === decision.cardId)).toBe(true)
    }
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

  describe('decision legality invariants', () => {
    it('keeps decisions phase-legal and target-legal across randomized states', () => {
      const random = createSeededRandom(20260227)
      for (let trial = 0; trial < 280; trial++) {
        const state = makeInvariantFuzzState(random, trial)
        const decision = getAIDecision(state)
        assertDecisionLegalForPhase(state, decision)
      }
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

    it('uses discard-derived posterior to reduce hidden JSN pressure as responses are exhausted', () => {
      const aggressiveLogs = [
        { turn: 1, player: 'player' as const, action: 'Played Deal Breaker!', timestamp: 1 },
        { turn: 2, player: 'player' as const, action: 'Played Just Say No!', timestamp: 2 },
        { turn: 3, player: 'player' as const, action: 'Played Forced Deal', timestamp: 3 },
        { turn: 4, player: 'player' as const, action: 'Charged M6M rent for red', timestamp: 4 },
      ]
      const baseline = makeState({
        ai: {
          hand: [card('r-wild-1')],
          field: [group('red', ['p-red-1', 'p-red-2', 'p-red-3'])],
          bank: [],
        },
        player: {
          hand: [
            card('m-1a', 'h1'),
            card('m-1b', 'h2'),
            card('m-1c', 'h3'),
            card('m-1d', 'h4'),
          ],
          field: [],
          bank: [card('m-10')],
        },
        log: aggressiveLogs,
      })
      getAIDecision(baseline)
      const baselinePenalty = getAITelemetrySnapshot().hiddenRiskPenaltyTotal
      expect(baselinePenalty).toBeGreaterThan(0)

      resetAITelemetry()
      const exhausted = makeState({
        ...baseline,
        discardPile: [
          card('a-jsn-1'),
          card('a-jsn-2'),
          card('a-jsn-3'),
          card('a-db-1'),
          card('a-db-2'),
          card('r-wild-1', 'd-rent-1'),
          card('r-wild-2', 'd-rent-2'),
        ],
      })
      getAIDecision(exhausted)
      const exhaustedPenalty = getAITelemetrySnapshot().hiddenRiskPenaltyTotal
      expect(exhaustedPenalty).toBeLessThan(baselinePenalty)
    })

    it('weights recent opponent behavior more heavily than older actions', () => {
      const aggressiveEntries = [
        { action: 'Played Deal Breaker!' },
        { action: 'Played Forced Deal' },
        { action: 'Played Sly Deal' },
        { action: 'Charged M6M rent for red' },
        { action: 'Played Deal Breaker!' },
        { action: 'Played Forced Deal' },
        { action: 'Played Sly Deal' },
        { action: 'Charged M6M rent for red' },
      ]
      const calmEntries = [
        { action: 'Banked $1M (M1M)' },
        { action: 'Drew 2 cards' },
        { action: 'Played Pass Go — drew 2 cards' },
        { action: 'Banked $2M (M2M)' },
        { action: 'Banked $1M (M1M)' },
        { action: 'Drew 2 cards' },
        { action: 'Played Pass Go — drew 2 cards' },
        { action: 'Banked $2M (M2M)' },
      ]

      const baseState = makeState({
        turnPhase: { type: 'play', playsRemaining: 3 },
        ai: {
          hand: [card('a-pg-1'), card('m-1a')],
          field: [],
          bank: [],
        },
        player: { hand: [], field: [], bank: [] },
      })

      const recentCalm = makeState({
        ...baseState,
        log: [...aggressiveEntries, ...calmEntries].map((entry, index) => ({
          turn: index + 1,
          player: 'player' as const,
          action: entry.action,
          timestamp: index + 1,
        })),
      })

      const recentAggressive = makeState({
        ...baseState,
        log: [...calmEntries, ...aggressiveEntries].map((entry, index) => ({
          turn: index + 1,
          player: 'player' as const,
          action: entry.action,
          timestamp: 100 + index + 1,
        })),
      })

      resetAITelemetry()
      getAIDecision(recentCalm)
      const calmTelemetry = getAITelemetrySnapshot()
      expect(calmTelemetry.byProfile.defensive).toBe(1)

      resetAITelemetry()
      getAIDecision(recentAggressive)
      const aggressiveTelemetry = getAITelemetrySnapshot()
      expect(aggressiveTelemetry.byProfile.defensive).toBe(0)
      expect(aggressiveTelemetry.byProfile.balanced + aggressiveTelemetry.byProfile.aggressive).toBe(1)
    })

    it('uses probabilistic response branching for top tactical lookahead lines', () => {
      setAIDifficultyMode('aggressive')
      const tacticalBase = makeState({
        ai: {
          hand: [card('a-db-1'), card('a-sly-1'), card('r-wild-1'), card('p-red-3')],
          field: [
            group('red', ['p-red-1', 'p-red-2']),
            group('utility', ['p-util-1']),
          ],
          bank: [],
        },
        player: {
          hand: [
            card('m-1a', 'hidden-1'),
            card('m-1b', 'hidden-2'),
            card('m-1c', 'hidden-3'),
            card('m-1d', 'hidden-4'),
            card('m-1e', 'hidden-5'),
            card('m-2a', 'hidden-6'),
          ],
          field: [
            group('brown', ['p-brown-1', 'p-brown-2']),
            group('darkBlue', ['p-db-1', 'p-db-2']),
            group('orange', ['p-ora-1']),
          ],
          bank: [card('m-10')],
        },
      })

      getAIDecision(tacticalBase)
      const highRiskBonus = getAITelemetrySnapshot().lookaheadBonusTotal

      resetAITelemetry()
      const responseExhausted = makeState({
        ...tacticalBase,
        discardPile: [
          card('a-jsn-1'),
          card('a-jsn-2'),
          card('a-jsn-3'),
          card('a-db-1'),
          card('a-db-2'),
          card('a-sly-1', 'd-sly-1'),
          card('a-sly-2', 'd-sly-2'),
          card('a-fd-1', 'd-fd-1'),
          card('a-fd-2', 'd-fd-2'),
          card('r-wild-1', 'd-rent-1'),
          card('r-wild-2', 'd-rent-2'),
        ],
      })

      getAIDecision(responseExhausted)
      const lowRiskBonus = getAITelemetrySnapshot().lookaheadBonusTotal
      expect(Math.abs(lowRiskBonus - highRiskBonus)).toBeGreaterThan(0.5)
    })

    it('applies stronger hidden-response swing to Deal Breaker than Sly Deal lines', () => {
      setAIDifficultyMode('aggressive')

      function getLookaheadBonusForActionCard(actionCardId: string, discardJSN: boolean): number {
        resetAITelemetry()
        const followUpCardId = 'b-house-1'
        const state = makeState({
          ai: {
            hand: [card(actionCardId), card(followUpCardId)],
            field: [
              group('red', ['p-red-1']),
              group('utility', ['p-util-1']),
            ],
            bank: [],
          },
          player: {
            hand: [
              card('m-1a', 'resp-1'),
              card('m-1b', 'resp-2'),
              card('m-1c', 'resp-3'),
              card('m-1d', 'resp-4'),
              card('m-1e', 'resp-5'),
              card('m-2a', 'resp-6'),
            ],
            field: [
              group('brown', ['p-brown-1', 'p-brown-2']),
              group('orange', ['p-ora-1']),
            ],
            bank: [card('m-5a')],
          },
          discardPile: discardJSN
            ? [card('a-jsn-1'), card('a-jsn-2'), card('a-jsn-3')]
            : [],
        })

        const decision = getAIDecision(state)
        expect(decision.type).toBe('playAction')
        expect(decision.cardId).toBe(actionCardId)
        return getAITelemetrySnapshot().lookaheadBonusTotal
      }

      const dealBreakerHighRisk = getLookaheadBonusForActionCard('a-db-1', false)
      const dealBreakerLowRisk = getLookaheadBonusForActionCard('a-db-1', true)
      const slyDealHighRisk = getLookaheadBonusForActionCard('a-sly-1', false)
      const slyDealLowRisk = getLookaheadBonusForActionCard('a-sly-1', true)

      const dealBreakerDelta = Math.abs(dealBreakerLowRisk - dealBreakerHighRisk)
      const slyDealDelta = Math.abs(slyDealLowRisk - slyDealHighRisk)
      expect(dealBreakerDelta).toBeGreaterThan(slyDealDelta)
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

    it('chooses aggressive profile and a proactive move in endgame race deficits', () => {
      setAIDifficultyMode('adaptive')
      resetAITelemetry()
      const raceDeficit = makeState({
        ai: {
          hand: [card('a-db-1'), card('a-pg-1'), card('m-1a')],
          field: [group('red', ['p-red-1', 'p-red-2'])],
          bank: [card('m-1b')],
        },
        player: {
          hand: [],
          field: [
            group('brown', ['p-brown-1', 'p-brown-2']),
            group('darkBlue', ['p-db-1', 'p-db-2']),
            group('orange', ['p-ora-1', 'p-ora-2']),
          ],
          bank: [card('m-5a')],
        },
      })

      const decision = getAIDecision(raceDeficit)
      const telemetry = getAITelemetrySnapshot()
      expect(telemetry.byProfile.aggressive).toBe(1)
      expect(decision.type).not.toBe('endTurn')
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

      const calmDecision = getAIDecision(calmState)
      expect(['acceptAction', 'useJSN']).toContain(calmDecision.type)
      if (calmDecision.type === 'useJSN') {
        expect(calmDecision.cardId).toBe('a-jsn-1')
      }

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
        card('a-db-2'),
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
      expect(telemetry.lookaheadCacheMisses).toBeGreaterThan(0)
      expect(telemetry.lookaheadCacheHits).toBeGreaterThan(0)
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
