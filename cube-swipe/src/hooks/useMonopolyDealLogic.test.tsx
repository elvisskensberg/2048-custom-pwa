import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MonopolyDealState } from '../monopoly-deal/gameEngine'
import type { AIDecision } from '../monopoly-deal/aiStrategy'
import {
  ACTION_CARDS,
  BUILDING_CARDS,
  MONEY_CARDS,
  PROPERTY_CARDS,
  RENT_CARDS,
  WILD_CARDS,
  type MonopolyCardData,
  type PropertyColor,
} from '../monopoly-deal/cardData'
import { useMonopolyDealLogic } from './useMonopolyDealLogic'
import { getAIDecision } from '../monopoly-deal/aiStrategy'
import { loadMonopolyState } from '../utils/monopolyStateSync'

vi.mock('../monopoly-deal/aiStrategy', () => ({
  getAIDecision: vi.fn((): AIDecision => ({ type: 'endTurn' })),
}))

vi.mock('../utils/monopolyStateSync', () => ({
  saveMonopolyState: vi.fn(),
  loadMonopolyState: vi.fn(),
  clearMonopolyState: vi.fn(),
}))

vi.mock('../monopoly-deal/gameLogger', () => ({
  logState: vi.fn(),
  logAction: vi.fn(),
}))

const ALL_CARDS: MonopolyCardData[] = [
  ...PROPERTY_CARDS,
  ...ACTION_CARDS,
  ...MONEY_CARDS,
  ...BUILDING_CARDS,
  ...WILD_CARDS,
  ...RENT_CARDS,
]

function card(id: string): MonopolyCardData {
  const found = ALL_CARDS.find((c) => c.id === id)
  if (!found) throw new Error(`Card not found: ${id}`)
  return found
}

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

function group(color: PropertyColor, cardIds: string[], buildingIds: string[] = []) {
  return {
    color,
    cards: cardIds.map((id) => card(id)),
    buildings: buildingIds.map((id) => card(id)),
  }
}

function asSavedState(state: MonopolyDealState): string {
  return JSON.stringify(state)
}

async function advanceUntil(
  predicate: () => boolean,
  options?: { maxMs?: number; stepMs?: number; label?: string },
): Promise<void> {
  const maxMs = options?.maxMs ?? 4000
  const stepMs = options?.stepMs ?? 40
  const label = options?.label ?? 'condition'
  const maxSteps = Math.ceil(maxMs / stepMs)

  for (let step = 0; step <= maxSteps; step++) {
    if (predicate()) return
    await act(async () => {
      await vi.advanceTimersByTimeAsync(stepMs)
    })
  }

  throw new Error(`Timed out waiting for ${label}`)
}

function mockAIDebtPayment(paymentCardIds: string[]): void {
  vi.mocked(getAIDecision).mockImplementation((state) => {
    if (state.turnPhase.type === 'awaitingPayment' && state.turnPhase.debt.debtor === 'ai') {
      return { type: 'payDebt', paymentCardIds }
    }
    return { type: 'endTurn' }
  })
}

describe('useMonopolyDealLogic', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.mocked(getAIDecision).mockReturnValue({ type: 'endTurn' })
    vi.mocked(loadMonopolyState).mockResolvedValue(null)
  })

  afterEach(async () => {
    await vi.runOnlyPendingTimersAsync()
    vi.useRealTimers()
  })

  it('starts a new game with player draw already resolved', () => {
    // Force player to go first so assertions are deterministic
    vi.spyOn(Math, 'random').mockReturnValue(0.3)
    const { result } = renderHook(() => useMonopolyDealLogic())

    act(() => {
      result.current.startNewGame()
    })

    expect(result.current.gameState).not.toBeNull()
    expect(result.current.currentTurn).toBe('player')
    expect(result.current.turnPhase).toEqual({ type: 'play', playsRemaining: 3 })
    expect(result.current.playerHand).toHaveLength(7)
    expect(result.current.isAIThinking).toBe(false)
    vi.spyOn(Math, 'random').mockRestore()
  })

  it('does not trigger AI decisions when phase belongs to player during ai turn', async () => {
    const state = makeState({
      currentTurn: 'ai',
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
      ai: { hand: [card('m-1a')], field: [], bank: [] },
    })
    vi.mocked(loadMonopolyState).mockResolvedValue(asSavedState(state))

    const { result } = renderHook(() => useMonopolyDealLogic())

    await act(async () => {
      const resumed = await result.current.resumeGame()
      expect(resumed).toBe(true)
    })

    await advanceUntil(
      () => !result.current.isAIThinking && result.current.turnPhase.type === 'awaitingPayment',
      { label: 'AI to remain paused on player-owned payment phase' },
    )

    expect(result.current.currentTurn).toBe('ai')
    expect(result.current.turnPhase.type).toBe('awaitingPayment')
    expect(result.current.isAIThinking).toBe(false)
    expect(vi.mocked(getAIDecision)).not.toHaveBeenCalled()
  })

  it('does not trigger AI decisions when JSN decider is player during ai turn', async () => {
    const state = makeState({
      currentTurn: 'ai',
      turnPhase: {
        type: 'awaitingJSN',
        jsnChain: {
          originalAction: {
            actionCard: card('a-dc-1'),
            sourcePlayer: 'ai',
          },
          chain: [],
          currentDecider: 'player',
        },
      },
      ai: { hand: [card('a-jsn-1')], field: [], bank: [] },
    })
    vi.mocked(loadMonopolyState).mockResolvedValue(asSavedState(state))

    const { result } = renderHook(() => useMonopolyDealLogic())

    await act(async () => {
      const resumed = await result.current.resumeGame()
      expect(resumed).toBe(true)
    })

    await advanceUntil(
      () => !result.current.isAIThinking && result.current.turnPhase.type === 'awaitingJSN',
      { label: 'AI to remain paused on player-owned JSN phase' },
    )

    expect(result.current.currentTurn).toBe('ai')
    expect(result.current.turnPhase.type).toBe('awaitingJSN')
    expect(result.current.isAIThinking).toBe(false)
    expect(vi.mocked(getAIDecision)).not.toHaveBeenCalled()
  })

  it('executes ai draw->play flow and hands turn back to player', async () => {
    const state = makeState({
      currentTurn: 'ai',
      turnPhase: { type: 'draw' },
      drawPile: [card('m-2a'), card('m-3a'), card('m-4a'), card('m-5a')],
      ai: { hand: [card('m-1a')], field: [], bank: [] },
    })
    vi.mocked(loadMonopolyState).mockResolvedValue(asSavedState(state))
    vi.mocked(getAIDecision)
      .mockReturnValueOnce({ type: 'bankCard', cardId: 'm-1a' })
      .mockReturnValue({ type: 'endTurn' })

    const { result } = renderHook(() => useMonopolyDealLogic())

    await act(async () => {
      const resumed = await result.current.resumeGame()
      expect(resumed).toBe(true)
    })

    await advanceUntil(
      () => result.current.currentTurn === 'player' && result.current.turnPhase.type === 'play',
      { maxMs: 5000, label: 'AI draw->play flow to hand turn back' },
    )

    expect(result.current.currentTurn).toBe('player')
    expect(result.current.turnPhase.type).toBe('play')
    expect(result.current.aiBank.some((c) => c.id === 'm-1a')).toBe(true)
    expect(result.current.isAIThinking).toBe(false)
    expect(vi.mocked(getAIDecision).mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it('breaks out safely when AI decision does not change state', async () => {
    const state = makeState({
      currentTurn: 'ai',
      turnPhase: { type: 'play', playsRemaining: 3 },
      drawPile: [card('m-2a'), card('m-3a')],
      ai: { hand: [card('p-brown-1')], field: [], bank: [] },
    })
    vi.mocked(loadMonopolyState).mockResolvedValue(asSavedState(state))
    vi.mocked(getAIDecision).mockReturnValue({
      type: 'playProperty',
      cardId: 'not-in-hand',
      targetColor: 'brown',
    })

    const { result } = renderHook(() => useMonopolyDealLogic())

    await act(async () => {
      const resumed = await result.current.resumeGame()
      expect(resumed).toBe(true)
    })

    await advanceUntil(
      () => result.current.currentTurn === 'player' && result.current.turnPhase.type === 'play',
      { maxMs: 4000, label: 'AI no-op guard flow to stop and hand back turn' },
    )

    expect(result.current.currentTurn).toBe('player')
    expect(result.current.turnPhase.type).toBe('play')
    expect(result.current.isAIThinking).toBe(false)
    expect(vi.mocked(getAIDecision).mock.calls.length).toBeLessThanOrEqual(2)
  })

  it('auto-resolves AI debt payment while it is still player turn', async () => {
    const state = makeState({
      currentTurn: 'player',
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
      player: { hand: [], field: [], bank: [] },
      ai: { hand: [], field: [], bank: [card('m-5a')] },
    })
    vi.mocked(loadMonopolyState).mockResolvedValue(asSavedState(state))
    vi.mocked(getAIDecision).mockReturnValue({
      type: 'payDebt',
      paymentCardIds: ['m-5a'],
    })

    const { result } = renderHook(() => useMonopolyDealLogic())

    await act(async () => {
      const resumed = await result.current.resumeGame()
      expect(resumed).toBe(true)
    })

    await advanceUntil(
      () => result.current.playerBank.some((c) => c.id === 'm-5a') && result.current.turnPhase.type === 'play',
      { maxMs: 2500, label: 'AI debt auto-resolution on player turn' },
    )

    expect(result.current.currentTurn).toBe('player')
    expect(result.current.turnPhase.type).toBe('play')
    expect(result.current.playerBank.some((c) => c.id === 'm-5a')).toBe(true)
    expect(result.current.aiBank).toHaveLength(0)
    expect(vi.mocked(getAIDecision)).toHaveBeenCalled()
  })

  it('falls back to paying all AI assets when debt decision is invalid', async () => {
    const state = makeState({
      currentTurn: 'player',
      turnPhase: {
        type: 'awaitingPayment',
        debt: {
          creditor: 'player',
          debtor: 'ai',
          amount: 3,
          source: 'rent',
          selectedPayment: [],
        },
      },
      player: { hand: [], field: [], bank: [] },
      ai: { hand: [], field: [], bank: [card('m-5a')] },
    })
    vi.mocked(loadMonopolyState).mockResolvedValue(asSavedState(state))
    vi.mocked(getAIDecision).mockReturnValue({ type: 'endTurn' })

    const { result } = renderHook(() => useMonopolyDealLogic())

    await act(async () => {
      const resumed = await result.current.resumeGame()
      expect(resumed).toBe(true)
    })

    await advanceUntil(
      () => result.current.turnPhase.type === 'play' && result.current.playerBank.some((c) => c.id === 'm-5a'),
      { maxMs: 2500, label: 'AI debt fallback payment to avoid deadlock' },
    )

    expect(result.current.currentTurn).toBe('player')
    expect(result.current.turnPhase.type).toBe('play')
    expect(result.current.playerBank.some((c) => c.id === 'm-5a')).toBe(true)
    expect(result.current.aiBank).toHaveLength(0)
  })

  it('selectRentColor plays rent card from hand path', async () => {
    const state = makeState({
      currentTurn: 'player',
      turnPhase: { type: 'awaitingRentColor', cardId: 'r-db-gr-1' },
      player: {
        hand: [card('r-db-gr-1')],
        field: [group('darkBlue', ['p-db-1'])],
        bank: [],
      },
      ai: {
        hand: [],
        field: [],
        bank: [card('m-5a')],
      },
    })
    vi.mocked(loadMonopolyState).mockResolvedValue(asSavedState(state))
    mockAIDebtPayment(['m-5a'])

    const { result } = renderHook(() => useMonopolyDealLogic())
    await act(async () => {
      expect(await result.current.resumeGame()).toBe(true)
    })

    act(() => {
      result.current.selectRentColor('darkBlue')
    })

    expect(result.current.playerHand.some((c) => c.id === 'r-db-gr-1')).toBe(false)
    expect(result.current.gameState?.discardPile.some((c) => c.id === 'r-db-gr-1')).toBe(true)
    expect(result.current.turnPhase.type).toBe('awaitingPayment')
    if (result.current.turnPhase.type === 'awaitingPayment') {
      expect(result.current.turnPhase.debt.amount).toBe(3)
      expect(result.current.turnPhase.debt.debtor).toBe('ai')
    }

    await advanceUntil(
      () => result.current.turnPhase.type === 'play' && !result.current.isAIThinking,
      { maxMs: 1500, label: 'rent payment auto-resolution (hand rent)' },
    )
  })

  it('selectRentColor resolves via completeRentColor when card already in discard', async () => {
    const state = makeState({
      currentTurn: 'player',
      turnPhase: { type: 'awaitingRentColor', cardId: 'r-wild-1' },
      discardPile: [card('r-wild-1')],
      player: {
        hand: [],
        field: [group('red', ['p-red-1', 'p-red-2', 'p-red-3'])],
        bank: [],
      },
      ai: {
        hand: [],
        field: [],
        bank: [card('m-5a')],
      },
    })
    vi.mocked(loadMonopolyState).mockResolvedValue(asSavedState(state))
    mockAIDebtPayment(['m-5a'])

    const { result } = renderHook(() => useMonopolyDealLogic())
    await act(async () => {
      expect(await result.current.resumeGame()).toBe(true)
    })

    act(() => {
      result.current.selectRentColor('red')
    })

    expect(result.current.turnPhase.type).toBe('awaitingPayment')
    if (result.current.turnPhase.type === 'awaitingPayment') {
      expect(result.current.turnPhase.debt.amount).toBe(6)
      expect(result.current.turnPhase.debt.debtor).toBe('ai')
    }

    await advanceUntil(
      () => result.current.turnPhase.type === 'play' && !result.current.isAIThinking,
      { maxMs: 1500, label: 'rent payment auto-resolution (discard path)' },
    )
  })

  it('playCard enters awaitingRentColor for wild rent instead of auto-selecting', async () => {
    const state = makeState({
      currentTurn: 'player',
      turnPhase: { type: 'play', playsRemaining: 3 },
      player: {
        hand: [card('r-wild-1')],
        field: [
          group('brown', ['p-brown-1']),
          group('red', ['p-red-1', 'p-red-2', 'p-red-3']),
        ],
        bank: [],
      },
      ai: {
        hand: [],
        field: [],
        bank: [card('m-10')],
      },
    })
    vi.mocked(loadMonopolyState).mockResolvedValue(asSavedState(state))

    const { result } = renderHook(() => useMonopolyDealLogic())
    await act(async () => {
      expect(await result.current.resumeGame()).toBe(true)
    })

    act(() => {
      result.current.playCard('r-wild-1')
    })

    // Should enter color selection, NOT auto-charge
    expect(result.current.turnPhase).toEqual({
      type: 'awaitingRentColor',
      cardId: 'r-wild-1',
    })
  })

  it('wild rent full flow: play → select color → charge rent', async () => {
    const state = makeState({
      currentTurn: 'player',
      turnPhase: { type: 'play', playsRemaining: 3 },
      player: {
        hand: [card('r-wild-1')],
        field: [
          group('brown', ['p-brown-1']),
          group('red', ['p-red-1', 'p-red-2', 'p-red-3']),
        ],
        bank: [],
      },
      ai: {
        hand: [],
        field: [],
        bank: [card('m-10')],
      },
    })
    vi.mocked(loadMonopolyState).mockResolvedValue(asSavedState(state))
    mockAIDebtPayment(['m-10'])

    const { result } = renderHook(() => useMonopolyDealLogic())
    await act(async () => {
      expect(await result.current.resumeGame()).toBe(true)
    })

    act(() => {
      result.current.playCard('r-wild-1')
    })
    expect(result.current.turnPhase.type).toBe('awaitingRentColor')

    act(() => {
      result.current.selectRentColor('red')
    })

    expect(result.current.turnPhase.type).toBe('awaitingPayment')
    if (result.current.turnPhase.type === 'awaitingPayment') {
      expect(result.current.turnPhase.debt.amount).toBe(6)
      expect(result.current.turnPhase.debt.debtor).toBe('ai')
    }
    expect(result.current.playerHand.some((c) => c.id === 'r-wild-1')).toBe(false)
    expect(result.current.gameState?.discardPile.some((c) => c.id === 'r-wild-1')).toBe(true)

    await advanceUntil(
      () => result.current.turnPhase.type === 'play' && !result.current.isAIThinking,
      { maxMs: 1500, label: 'rent payment auto-resolution (wild rent)' },
    )
  })

  it('confirmDoubleRent keeps double-rent card id in rent-color phase for non-wild rent', async () => {
    const state = makeState({
      currentTurn: 'player',
      turnPhase: {
        type: 'awaitingDoubleRentConfirm',
        rentCardId: 'r-rd-yl-1',
        doubleRentCardId: 'a-dtr-1',
      },
      player: { hand: [card('r-rd-yl-1'), card('a-dtr-1')], field: [], bank: [] },
    })
    vi.mocked(loadMonopolyState).mockResolvedValue(asSavedState(state))
    const { result } = renderHook(() => useMonopolyDealLogic())

    await act(async () => {
      expect(await result.current.resumeGame()).toBe(true)
    })

    act(() => {
      result.current.confirmDoubleRent()
    })

    expect(result.current.turnPhase).toEqual({
      type: 'awaitingRentColor',
      cardId: 'r-rd-yl-1',
      doubleRentCardId: 'a-dtr-1',
    })
  })

  it('skipDoubleRent omits double-rent card id in rent-color phase for non-wild rent', async () => {
    const state = makeState({
      currentTurn: 'player',
      turnPhase: {
        type: 'awaitingDoubleRentConfirm',
        rentCardId: 'r-rd-yl-1',
        doubleRentCardId: 'a-dtr-1',
      },
      player: { hand: [card('r-rd-yl-1'), card('a-dtr-1')], field: [], bank: [] },
    })
    vi.mocked(loadMonopolyState).mockResolvedValue(asSavedState(state))
    const { result } = renderHook(() => useMonopolyDealLogic())

    await act(async () => {
      expect(await result.current.resumeGame()).toBe(true)
    })

    act(() => {
      result.current.skipDoubleRent()
    })

    expect(result.current.turnPhase).toEqual({
      type: 'awaitingRentColor',
      cardId: 'r-rd-yl-1',
    })
  })

  it('confirmDoubleRent enters awaitingRentColor for wild rent with doubleRentCardId', async () => {
    const state = makeState({
      currentTurn: 'player',
      turnPhase: {
        type: 'awaitingDoubleRentConfirm',
        rentCardId: 'r-wild-1',
        doubleRentCardId: 'a-dtr-1',
      },
      player: {
        hand: [card('r-wild-1'), card('a-dtr-1')],
        field: [group('red', ['p-red-1', 'p-red-2', 'p-red-3'])],
        bank: [],
      },
    })
    vi.mocked(loadMonopolyState).mockResolvedValue(asSavedState(state))
    const { result } = renderHook(() => useMonopolyDealLogic())

    await act(async () => {
      expect(await result.current.resumeGame()).toBe(true)
    })

    act(() => {
      result.current.confirmDoubleRent()
    })

    expect(result.current.turnPhase).toEqual({
      type: 'awaitingRentColor',
      cardId: 'r-wild-1',
      doubleRentCardId: 'a-dtr-1',
    })
  })

  it('skipDoubleRent enters awaitingRentColor for wild rent without doubleRentCardId', async () => {
    const state = makeState({
      currentTurn: 'player',
      turnPhase: {
        type: 'awaitingDoubleRentConfirm',
        rentCardId: 'r-wild-1',
        doubleRentCardId: 'a-dtr-1',
      },
      player: {
        hand: [card('r-wild-1'), card('a-dtr-1')],
        field: [group('red', ['p-red-1', 'p-red-2', 'p-red-3'])],
        bank: [],
      },
    })
    vi.mocked(loadMonopolyState).mockResolvedValue(asSavedState(state))
    const { result } = renderHook(() => useMonopolyDealLogic())

    await act(async () => {
      expect(await result.current.resumeGame()).toBe(true)
    })

    act(() => {
      result.current.skipDoubleRent()
    })

    expect(result.current.turnPhase).toEqual({
      type: 'awaitingRentColor',
      cardId: 'r-wild-1',
    })
  })

  it('cancelAction returns to play phase from modal phases', async () => {
    const state = makeState({
      currentTurn: 'player',
      playsUsedThisTurn: 1,
      turnPhase: {
        type: 'awaitingDoubleRentConfirm',
        rentCardId: 'r-rd-yl-1',
        doubleRentCardId: 'a-dtr-1',
      },
    })
    vi.mocked(loadMonopolyState).mockResolvedValue(asSavedState(state))

    const { result } = renderHook(() => useMonopolyDealLogic())
    await act(async () => {
      expect(await result.current.resumeGame()).toBe(true)
    })

    act(() => {
      result.current.cancelAction()
    })

    expect(result.current.turnPhase).toEqual({ type: 'play', playsRemaining: 2 })
  })

  it('bankCardFromHand works from awaitingBuildingTarget phase', async () => {
    const state = makeState({
      currentTurn: 'player',
      playsUsedThisTurn: 1,
      turnPhase: { type: 'awaitingBuildingTarget', cardId: 'b-house-1' },
      player: {
        hand: [card('b-house-1')],
        field: [group('brown', ['p-brown-1', 'p-brown-2'])],
        bank: [],
      },
    })
    vi.mocked(loadMonopolyState).mockResolvedValue(asSavedState(state))

    const { result } = renderHook(() => useMonopolyDealLogic())
    await act(async () => {
      expect(await result.current.resumeGame()).toBe(true)
    })

    act(() => {
      result.current.bankCardFromHand('b-house-1')
    })

    expect(result.current.playerBank.some((c) => c.id === 'b-house-1')).toBe(true)
    expect(result.current.playerHand).toHaveLength(0)
    expect(result.current.turnPhase).toEqual({ type: 'play', playsRemaining: 1 })
  })

  it('relocates wild cards and restores play phase', async () => {
    const state = makeState({
      currentTurn: 'player',
      turnPhase: { type: 'play', playsRemaining: 3 },
      player: {
        hand: [],
        field: [
          group('lightBlue', ['p-lb-1', 'w-br-lb']),
          group('brown', ['p-brown-1']),
        ],
        bank: [],
      },
    })
    vi.mocked(loadMonopolyState).mockResolvedValue(asSavedState(state))

    const { result } = renderHook(() => useMonopolyDealLogic())
    await act(async () => {
      expect(await result.current.resumeGame()).toBe(true)
    })

    act(() => {
      result.current.initiateWildRelocation('w-br-lb')
    })
    expect(result.current.turnPhase.type).toBe('awaitingWildRelocation')

    act(() => {
      result.current.completeWildRelocation('brown')
    })

    expect(result.current.turnPhase).toEqual({ type: 'play', playsRemaining: 3 })
    expect(
      result.current.playerField.find((g) => g.color === 'lightBlue')?.cards.some((c) => c.id === 'w-br-lb')
    ).toBe(false)
    expect(
      result.current.playerField.find((g) => g.color === 'brown')?.cards.some((c) => c.id === 'w-br-lb')
    ).toBe(true)
  })

  it('selectForcedDealGive and selectForcedDealTake complete swap flow', async () => {
    const state = makeState({
      currentTurn: 'player',
      turnPhase: { type: 'awaitingForcedDealSelect', phase: 'give' },
      playsUsedThisTurn: 1,
      player: {
        hand: [],
        field: [group('brown', ['p-brown-1'])],
        bank: [],
      },
      ai: {
        hand: [],
        field: [group('red', ['p-red-1'])],
        bank: [],
      },
    })
    vi.mocked(loadMonopolyState).mockResolvedValue(asSavedState(state))

    const { result } = renderHook(() => useMonopolyDealLogic())
    await act(async () => {
      expect(await result.current.resumeGame()).toBe(true)
    })

    act(() => {
      result.current.selectForcedDealGive('p-brown-1')
    })
    expect(result.current.turnPhase).toEqual({
      type: 'awaitingForcedDealSelect',
      phase: 'take',
      givenCardId: 'p-brown-1',
    })

    act(() => {
      result.current.selectForcedDealTake('p-red-1')
    })
    expect(result.current.turnPhase).toEqual({ type: 'play', playsRemaining: 2 })
    expect(result.current.playerField.find((g) => g.color === 'red')?.cards[0].id).toBe('p-red-1')
  })
})
