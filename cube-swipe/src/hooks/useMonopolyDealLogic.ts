// ---------------------------------------------------------------------------
// Monopoly Deal — React hook (game state + AI orchestration + persistence)
// ---------------------------------------------------------------------------

import { useState, useCallback, useEffect, useRef } from 'react'
import type { PropertyColor, MonopolyCardData } from '../monopoly-deal/cardData'
import type {
  MonopolyDealState,
  PlayerId,
  TurnPhase,
  PlayerState,
  PropertyGroup,
  GameLogEntry,
} from '../monopoly-deal/gameEngine'
import {
  createInitialState,
  executeDraw,
  playPropertyToField,
  bankCard as engineBankCard,
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
  togglePaymentCard as engineTogglePayment,
  confirmPayment as engineConfirmPayment,
  discardCards as engineDiscardCards,
  endPlayPhase,
  canPlayCard as engineCanPlayCard,
  checkWinCondition,
  serializeState,
  deserializeState,
} from '../monopoly-deal/gameEngine'
import { getAIDecision, type AIDecision } from '../monopoly-deal/aiStrategy'
import {
  saveMonopolyState,
  loadMonopolyState,
  clearMonopolyState,
} from '../utils/monopolyStateSync'

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface UseMonopolyDealReturn {
  // State
  gameState: MonopolyDealState | null
  isLoading: boolean

  // Derived
  playerHand: MonopolyCardData[]
  playerField: PropertyGroup[]
  playerBank: MonopolyCardData[]
  aiField: PropertyGroup[]
  aiBank: MonopolyCardData[]
  aiHandCount: number
  drawPileCount: number
  discardPileTop: MonopolyCardData | null
  currentTurn: PlayerId
  turnPhase: TurnPhase
  log: GameLogEntry[]
  winner: PlayerId | null

  // Player actions
  startNewGame: () => void
  resumeGame: () => Promise<boolean>
  playCard: (cardId: string) => void
  bankCardFromHand: (cardId: string) => void
  selectWildColor: (color: PropertyColor) => void
  selectRentColor: (color: PropertyColor) => void
  selectTarget: (targetId: string) => void
  selectBuildingTarget: (color: PropertyColor) => void
  selectForcedDealGive: (cardId: string) => void
  selectForcedDealTake: (cardId: string) => void
  togglePaymentCard: (cardId: string) => void
  confirmDebtPayment: () => void
  respondJSN: (jsnCardId: string) => void
  acceptIncomingAction: () => void
  discardCard: (cardId: string) => void
  endTurn: () => void

  // AI
  isAIThinking: boolean
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const AI_DELAY = 800

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/** Apply an AI decision to the game state, returning the new state. */
function applyAIDecision(state: MonopolyDealState, decision: AIDecision): MonopolyDealState {
  switch (decision.type) {
    case 'playProperty':
      if (!decision.cardId || !decision.targetColor) return state
      return playPropertyToField(state, decision.cardId, decision.targetColor)

    case 'bankCard':
      if (!decision.cardId) return state
      return engineBankCard(state, decision.cardId)

    case 'playAction': {
      if (!decision.cardId) return state
      const card = state.ai.hand.find((c) => c.id === decision.cardId)
      if (!card) return state
      switch (card.name) {
        case 'Pass Go':
          return playPassGo(state, decision.cardId)
        case 'Debt Collector':
          return playDebtCollector(state, decision.cardId)
        case "It's My Birthday":
          return playBirthday(state, decision.cardId)
        case 'Sly Deal':
          return playSlyDeal(state, decision.cardId)
        case 'Forced Deal':
          return playForcedDeal(state, decision.cardId)
        case 'Deal Breaker':
          return playDealBreaker(state, decision.cardId)
        default:
          return engineBankCard(state, decision.cardId)
      }
    }

    case 'playBuilding':
      if (!decision.cardId || !decision.targetColor) return state
      return playBuilding(state, decision.cardId, decision.targetColor)

    case 'playRent':
      if (!decision.cardId || !decision.targetColor) return state
      return playRentCard(state, decision.cardId, decision.doubleRentCardId, decision.targetColor)

    case 'payDebt':
      if (decision.paymentCardIds) {
        // Toggle all selected payment cards, then confirm
        let s = state
        for (const cardId of decision.paymentCardIds) {
          s = engineTogglePayment(s, cardId)
        }
        return engineConfirmPayment(s)
      }
      return engineConfirmPayment(state)

    case 'useJSN':
      if (!decision.cardId) return state
      return playJustSayNo(state, decision.cardId)

    case 'acceptAction':
      return acceptJSNOutcome(state)

    case 'discard':
      if (!decision.discardCardIds) return state
      return engineDiscardCards(state, decision.discardCardIds)

    case 'selectTarget':
      if (state.turnPhase.type === 'awaitingSlyDealTarget' && decision.targetCardId) {
        return completeSlyDeal(state, decision.targetCardId)
      }
      if (state.turnPhase.type === 'awaitingDealBreakerTarget' && decision.targetColor) {
        return completeDealBreaker(state, decision.targetColor)
      }
      if (state.turnPhase.type === 'awaitingForcedDealSelect') {
        if (state.turnPhase.phase === 'give' && decision.yourCardId) {
          return {
            ...state,
            turnPhase: { type: 'awaitingForcedDealSelect', phase: 'take', givenCardId: decision.yourCardId },
          }
        }
        if (state.turnPhase.phase === 'take' && decision.targetCardId && state.turnPhase.givenCardId) {
          return completeForcedDeal(state, state.turnPhase.givenCardId, decision.targetCardId)
        }
      }
      if (state.turnPhase.type === 'awaitingBuildingTarget' && decision.targetColor) {
        return playBuilding(state, state.turnPhase.cardId, decision.targetColor)
      }
      return state

    case 'selectColor':
      if (!decision.targetColor) return state
      if (state.turnPhase.type === 'awaitingWildColor') {
        return playPropertyToField(state, state.turnPhase.cardId, decision.targetColor)
      }
      if (state.turnPhase.type === 'awaitingRentColor') {
        return completeRentColor(state, decision.targetColor)
      }
      return state

    case 'endTurn':
      return endPlayPhase(state)

    default:
      return state
  }
}

export function useMonopolyDealLogic(): UseMonopolyDealReturn {
  const [gameState, setGameState] = useState<MonopolyDealState | null>(null)
  const [isLoading] = useState(false)
  const [isAIThinking, setIsAIThinking] = useState(false)
  const mountedRef = useRef(true)
  const aiRunningRef = useRef(false)

  // Unmount guard
  useEffect(() => {
    mountedRef.current = true
    return (): void => { mountedRef.current = false }
  }, [])

  // ── Persistence: save after every state change ──
  useEffect(() => {
    if (!gameState) return
    if (gameState.turnPhase.type === 'gameOver') {
      clearMonopolyState()
      return
    }
    const timeout = setTimeout(() => {
      saveMonopolyState(serializeState(gameState))
    }, 300)
    return (): void => clearTimeout(timeout)
  }, [gameState])

  // ── Derived state ──
  const ps: PlayerState = gameState?.player ?? { hand: [], field: [], bank: [] }
  const ai: PlayerState = gameState?.ai ?? { hand: [], field: [], bank: [] }

  const playerHand = ps.hand
  const playerField = ps.field
  const playerBank = ps.bank
  const aiField = ai.field
  const aiBank = ai.bank
  const aiHandCount = ai.hand.length
  const drawPileCount = gameState?.drawPile.length ?? 0
  const discardPileTop = gameState?.discardPile.length
    ? gameState.discardPile[gameState.discardPile.length - 1]
    : null
  const currentTurn = gameState?.currentTurn ?? 'player'
  const turnPhase: TurnPhase = gameState?.turnPhase ?? { type: 'draw' }
  const log = gameState?.log ?? []
  const winner = gameState ? checkWinCondition(gameState) : null

  // ── Helper: update state + check for AI turn ──
  const updateState = useCallback((newState: MonopolyDealState): void => {
    setGameState(newState)
  }, [])

  // ── AI turn execution ──
  const executeAITurn = useCallback(async (state: MonopolyDealState): Promise<void> => {
    if (aiRunningRef.current) return
    aiRunningRef.current = true
    setIsAIThinking(true)

    let s = state

    // Draw phase
    s = executeDraw(s)
    if (mountedRef.current) setGameState(s)
    await delay(AI_DELAY)

    // Play phase — up to 3 plays
    for (let play = 0; play < 3; play++) {
      if (!mountedRef.current) break
      if (s.turnPhase.type !== 'play' || s.turnPhase.playsRemaining <= 0) break
      if (s.ai.hand.length === 0) break

      const decision = getAIDecision(s)
      if (decision.type === 'endTurn') break

      // Apply decision
      s = applyAIDecision(s, decision)
      if (mountedRef.current) setGameState(s)
      await delay(AI_DELAY)

      // Handle any resolution phases
      while (s.turnPhase.type !== 'play' && s.turnPhase.type !== 'gameOver' && s.turnPhase.type !== 'discard') {
        if (!mountedRef.current) break
        const response = getAIDecision(s)
        s = applyAIDecision(s, response)
        if (mountedRef.current) setGameState(s)
        await delay(AI_DELAY / 2)
      }

      // Check win
      if (s.turnPhase.type === 'gameOver') break
    }

    if (!mountedRef.current) { aiRunningRef.current = false; return }

    // Handle discard if needed
    if (s.turnPhase.type === 'play') {
      s = endPlayPhase(s)
    }
    if (s.turnPhase.type === 'discard') {
      const decision = getAIDecision(s)
      if (decision.discardCardIds) {
        s = engineDiscardCards(s, decision.discardCardIds)
      }
    }

    // If it's now player's draw phase, auto-draw
    if (s.turnPhase.type === 'draw' && s.currentTurn === 'player') {
      s = executeDraw(s)
    }

    if (mountedRef.current) {
      setGameState(s)
      setIsAIThinking(false)
    }
    aiRunningRef.current = false
  }, [])

  // ── Watch for AI turn trigger (deferred to avoid sync setState in effect) ──
  useEffect(() => {
    if (!gameState) return
    if (gameState.currentTurn === 'ai' && gameState.turnPhase.type === 'draw' && !aiRunningRef.current) {
      const timer = setTimeout(() => executeAITurn(gameState), 0)
      return (): void => clearTimeout(timer)
    }
  }, [gameState, executeAITurn])

  // ── Game lifecycle ──
  const startNewGame = useCallback((): void => {
    const state = createInitialState()
    // Auto-draw for player
    const s = executeDraw(state)
    updateState(s)
  }, [updateState])

  const resumeGame = useCallback(async (): Promise<boolean> => {
    const saved = await loadMonopolyState()
    if (!saved) return false
    try {
      const state = deserializeState(saved)
      setGameState(state)
      return true
    } catch {
      return false
    }
  }, [])

  // ── Player actions ──
  const playCard = useCallback((cardId: string): void => {
    if (!gameState || gameState.currentTurn !== 'player') return
    if (gameState.turnPhase.type !== 'play') return

    const validation = engineCanPlayCard(gameState, cardId)
    if (!validation.valid) return

    const card = gameState.player.hand.find((c) => c.id === cardId)
    if (!card) return

    switch (card.type) {
      case 'property': {
        const s = playPropertyToField(gameState, cardId, card.color!)
        updateState(s)
        break
      }
      case 'wild': {
        // Need color selection
        updateState({
          ...gameState,
          turnPhase: { type: 'awaitingWildColor', cardId, context: 'play' },
        })
        break
      }
      case 'money': {
        const s = engineBankCard(gameState, cardId)
        updateState(s)
        break
      }
      case 'building': {
        updateState({
          ...gameState,
          turnPhase: { type: 'awaitingBuildingTarget', cardId },
        })
        break
      }
      case 'rent': {
        // Check if player has Double Rent
        // For now, enter rent color selection
        if (card.color) {
          // Dual-color rent — show color picker for the 2 colors
          updateState({
            ...gameState,
            turnPhase: { type: 'awaitingRentColor', cardId },
          })
        } else {
          // Wild rent — need any color
          updateState({
            ...gameState,
            turnPhase: { type: 'awaitingRentColor', cardId },
          })
        }
        break
      }
      case 'action': {
        let s: MonopolyDealState
        switch (card.name) {
          case 'Pass Go':
            s = playPassGo(gameState, cardId)
            break
          case 'Debt Collector':
            s = playDebtCollector(gameState, cardId)
            break
          case "It's My Birthday":
            s = playBirthday(gameState, cardId)
            break
          case 'Sly Deal':
            s = playSlyDeal(gameState, cardId)
            break
          case 'Forced Deal':
            s = playForcedDeal(gameState, cardId)
            break
          case 'Deal Breaker':
            s = playDealBreaker(gameState, cardId)
            break
          default:
            // Bank other action cards
            s = engineBankCard(gameState, cardId)
            break
        }
        updateState(s)
        break
      }
    }
  }, [gameState, updateState])

  const bankCardFromHand = useCallback((cardId: string): void => {
    if (!gameState || gameState.currentTurn !== 'player') return
    if (gameState.turnPhase.type !== 'play') return
    const s = engineBankCard(gameState, cardId)
    updateState(s)
  }, [gameState, updateState])

  const selectWildColor = useCallback((color: PropertyColor): void => {
    if (!gameState || gameState.turnPhase.type !== 'awaitingWildColor') return
    const { cardId } = gameState.turnPhase
    const s = playPropertyToField(gameState, cardId, color)
    updateState(s)
  }, [gameState, updateState])

  const selectRentColor = useCallback((color: PropertyColor): void => {
    if (!gameState) return
    if (gameState.turnPhase.type === 'awaitingRentColor') {
      const { cardId, doubleRentCardId } = gameState.turnPhase
      // The rent card was already removed from hand when entering this phase
      // Use completeRentColor or playRentCard depending on flow
      const card = gameState.discardPile.find((c) => c.id === cardId) ??
        gameState.player.hand.find((c) => c.id === cardId)

      if (card && gameState.player.hand.find((c) => c.id === cardId)) {
        // Card still in hand — use playRentCard
        const s = playRentCard(gameState, cardId, doubleRentCardId, color)
        updateState(s)
      } else {
        // Card already moved — use completeRentColor
        const s = completeRentColor(gameState, color)
        updateState(s)
      }
    }
  }, [gameState, updateState])

  const selectTarget = useCallback((targetId: string): void => {
    if (!gameState) return
    const phase = gameState.turnPhase

    if (phase.type === 'awaitingSlyDealTarget') {
      const s = completeSlyDeal(gameState, targetId)
      updateState(s)
    } else if (phase.type === 'awaitingDealBreakerTarget') {
      const s = completeDealBreaker(gameState, targetId as PropertyColor)
      updateState(s)
    }
  }, [gameState, updateState])

  const selectBuildingTarget = useCallback((color: PropertyColor): void => {
    if (!gameState || gameState.turnPhase.type !== 'awaitingBuildingTarget') return
    const { cardId } = gameState.turnPhase
    const s = playBuilding(gameState, cardId, color)
    updateState(s)
  }, [gameState, updateState])

  const selectForcedDealGive = useCallback((cardId: string): void => {
    if (!gameState || gameState.turnPhase.type !== 'awaitingForcedDealSelect') return
    updateState({
      ...gameState,
      turnPhase: { type: 'awaitingForcedDealSelect', phase: 'take', givenCardId: cardId },
    })
  }, [gameState, updateState])

  const selectForcedDealTake = useCallback((cardId: string): void => {
    if (!gameState || gameState.turnPhase.type !== 'awaitingForcedDealSelect') return
    const { givenCardId } = gameState.turnPhase
    if (!givenCardId) return
    const s = completeForcedDeal(gameState, givenCardId, cardId)
    updateState(s)
  }, [gameState, updateState])

  const togglePaymentCardFn = useCallback((cardId: string): void => {
    if (!gameState) return
    const s = engineTogglePayment(gameState, cardId)
    updateState(s)
  }, [gameState, updateState])

  const confirmDebtPayment = useCallback((): void => {
    if (!gameState) return
    const s = engineConfirmPayment(gameState)
    updateState(s)
  }, [gameState, updateState])

  const respondJSN = useCallback((jsnCardId: string): void => {
    if (!gameState) return
    const s = playJustSayNo(gameState, jsnCardId)
    updateState(s)
  }, [gameState, updateState])

  const acceptIncomingAction = useCallback((): void => {
    if (!gameState) return
    if (gameState.turnPhase.type === 'awaitingJSN') {
      const s = acceptJSNOutcome(gameState)
      updateState(s)
    } else if (gameState.turnPhase.type === 'awaitingPayment') {
      // Auto-confirm with whatever is selected
      const s = engineConfirmPayment(gameState)
      updateState(s)
    }
  }, [gameState, updateState])

  const discardCard = useCallback((cardId: string): void => {
    if (!gameState || gameState.turnPhase.type !== 'discard') return
    const s = engineDiscardCards(gameState, [cardId])
    updateState(s)
  }, [gameState, updateState])

  const endTurnFn = useCallback((): void => {
    if (!gameState || gameState.currentTurn !== 'player') return
    if (gameState.turnPhase.type !== 'play') return
    const s = endPlayPhase(gameState)
    updateState(s)
  }, [gameState, updateState])

  return {
    gameState,
    isLoading,
    playerHand,
    playerField,
    playerBank,
    aiField,
    aiBank,
    aiHandCount,
    drawPileCount,
    discardPileTop,
    currentTurn,
    turnPhase,
    log,
    winner,
    startNewGame,
    resumeGame,
    playCard,
    bankCardFromHand,
    selectWildColor,
    selectRentColor,
    selectTarget,
    selectBuildingTarget,
    selectForcedDealGive,
    selectForcedDealTake,
    togglePaymentCard: togglePaymentCardFn,
    confirmDebtPayment,
    respondJSN,
    acceptIncomingAction,
    discardCard,
    endTurn: endTurnFn,
    isAIThinking,
  }
}
