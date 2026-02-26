// ---------------------------------------------------------------------------
// Monopoly Deal — React hook (game state + AI orchestration + persistence)
// ---------------------------------------------------------------------------

import { useState, useCallback, useEffect, useRef } from 'react'
import { type PropertyColor, type MonopolyCardData } from '../monopoly-deal/cardData'
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
  getSelectedPaymentValue,
  calculateRent,
  relocateWildOnField,
  getRelocatableWilds,
  relocateBuildingOnField,
  getRelocatableBuildings,
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
  cancelAction: () => void
  confirmDoubleRent: () => void
  skipDoubleRent: () => void
  initiateWildRelocation: (wildCardId: string) => void
  completeWildRelocation: (newColor: PropertyColor) => void
  relocatableWilds: { cardId: string; currentColor: PropertyColor }[]
  initiateBuildingRelocation: (buildingCardId: string) => void
  completeBuildingRelocation: (targetColor: PropertyColor) => void
  relocatableBuildings: { cardId: string; currentColor: PropertyColor; buildingName: string }[]
  discardCard: (cardId: string) => void
  endTurn: () => void

  // AI
  isAIThinking: boolean
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

import { logState, logAction } from '../monopoly-deal/gameLogger'

const AI_ACTION_DELAY_MS = 220
const AI_RESOLUTION_DELAY_MS = 80
const MAX_AI_RESOLUTION_STEPS = 24

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function canAIAct(state: MonopolyDealState): boolean {
  if (state.currentTurn !== 'ai') return false

  switch (state.turnPhase.type) {
    case 'play':
    case 'discard':
    case 'awaitingSlyDealTarget':
    case 'awaitingDealBreakerTarget':
    case 'awaitingForcedDealSelect':
    case 'awaitingBuildingTarget':
    case 'awaitingWildColor':
    case 'awaitingRentColor':
    case 'awaitingBuildingRelocation':
      return true
    case 'awaitingPayment':
      return state.turnPhase.debt.debtor === 'ai'
    case 'awaitingJSN':
      return state.turnPhase.jsnChain.currentDecider === 'ai'
    default:
      return false
  }
}

function isWildRentCard(card: MonopolyCardData): boolean {
  return card.type === 'rent' && !card.color && !card.color2
}

const RENT_COLORS: PropertyColor[] = [
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

function selectHighestRentColor(ps: PlayerState): PropertyColor {
  let bestColor = RENT_COLORS[0]
  let bestRent = -1

  for (const color of RENT_COLORS) {
    const rent = calculateRent(ps, color, false)
    if (rent > bestRent) {
      bestRent = rent
      bestColor = color
    }
  }

  return bestColor
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
      if (state.turnPhase.type === 'awaitingBuildingRelocation' && decision.targetColor) {
        let s = relocateBuildingOnField(state, state.turnPhase.buildingCardId, decision.targetColor)
        const remaining = 3 - s.playsUsedThisTurn
        s = { ...s, turnPhase: { type: 'play', playsRemaining: remaining } }
        return s
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

    case 'wait':
      return state

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
    logState('STATE UPDATE', newState)
    setGameState(newState)
  }, [])

  // ── AI turn execution ──
  const executeAITurn = useCallback(async (state: MonopolyDealState): Promise<void> => {
    if (aiRunningRef.current) { logAction('AI', 'SKIP — already running'); return }
    aiRunningRef.current = true
    setIsAIThinking(true)
    logAction('AI', 'TURN START')

    let s = state

    // Draw phase (only when entering from draw — skip if resuming mid-turn)
    if (s.turnPhase.type === 'draw') {
      s = executeDraw(s)
      logState('AI drew cards', s)
      if (mountedRef.current) setGameState(s)
      await delay(AI_ACTION_DELAY_MS)
    }

    // Pre-resolution: handle non-draw/non-play phases when AI is triggered mid-turn
    // (e.g., after player plays JSN and AI must respond to the chain)
    let preSteps = 0
    while (
      canAIAct(s)
      && s.turnPhase.type !== 'play'
      && s.turnPhase.type !== 'draw'
      && s.turnPhase.type !== 'gameOver'
      && s.turnPhase.type !== 'discard'
      && preSteps < MAX_AI_RESOLUTION_STEPS
    ) {
      if (!mountedRef.current) break
      const response = getAIDecision(s)
      logAction('AI', `pre-resolve #${preSteps + 1}`, `${response.type} phase=${s.turnPhase.type}`)
      const next = applyAIDecision(s, response)
      if (next === s) { logAction('AI', 'pre-resolve — no change, breaking'); break }
      s = next
      logState(`AI pre-resolve #${preSteps + 1}`, s)
      if (mountedRef.current) setGameState(s)
      preSteps++
      await delay(AI_RESOLUTION_DELAY_MS)
    }
    if (s.turnPhase.type === 'gameOver') {
      logAction('AI', 'GAME OVER (pre-resolve)')
      if (mountedRef.current) { setGameState(s); setIsAIThinking(false) }
      aiRunningRef.current = false
      return
    }
    // If AI can't act after pre-resolution (e.g., JSN chain flipped to player), pause
    if (s.currentTurn === 'ai' && !canAIAct(s) && s.turnPhase.type !== 'play') {
      logAction('AI', `PAUSED after pre-resolve — phase=${s.turnPhase.type}`)
      if (mountedRef.current) { setGameState(s); setIsAIThinking(false) }
      aiRunningRef.current = false
      return
    }

    // Play phase — up to 3 plays
    for (let play = 0; play < 3; play++) {
      if (!mountedRef.current) { logAction('AI', 'ABORT — unmounted'); break }
      if (s.turnPhase.type !== 'play' || s.turnPhase.playsRemaining <= 0) {
        logAction('AI', `EXIT loop — phase=${s.turnPhase.type}`)
        break
      }
      if (s.ai.hand.length === 0) { logAction('AI', 'EXIT loop — empty hand'); break }

      const decision = getAIDecision(s)
      logAction('AI', `decision #${play + 1}`, `${decision.type} card=${decision.cardId ?? 'n/a'}`)
      if (decision.type === 'endTurn') break

      // Apply decision
      const prev = s
      s = applyAIDecision(s, decision)
      if (s === prev) { logAction('AI', 'WARNING — decision had no effect'); break }
      logState(`AI play #${play + 1}`, s)
      if (mountedRef.current) setGameState(s)
      await delay(AI_ACTION_DELAY_MS)

      // Handle any resolution phases
      let resolutionSteps = 0
      while (
        canAIAct(s)
        && s.turnPhase.type !== 'play'
        && s.turnPhase.type !== 'gameOver'
        && s.turnPhase.type !== 'discard'
        && resolutionSteps < MAX_AI_RESOLUTION_STEPS
      ) {
        if (!mountedRef.current) break
        const response = getAIDecision(s)
        logAction('AI', `resolve #${resolutionSteps + 1}`, `${response.type} phase=${s.turnPhase.type}`)
        const next = applyAIDecision(s, response)
        if (next === s) { logAction('AI', 'resolve — no change, breaking'); break }
        s = next
        logState(`AI resolve #${resolutionSteps + 1}`, s)
        if (mountedRef.current) setGameState(s)
        resolutionSteps++
        await delay(AI_RESOLUTION_DELAY_MS)
      }
      if (resolutionSteps >= MAX_AI_RESOLUTION_STEPS) {
        logAction('AI', 'WARNING — hit max resolution steps')
      }

      // Check win
      if (s.turnPhase.type === 'gameOver') { logAction('AI', 'GAME OVER'); break }
      if (s.currentTurn === 'ai' && !canAIAct(s)) {
        logAction('AI', `STUCK — phase=${s.turnPhase.type}, waiting for player`)
        break
      }
    }

    if (!mountedRef.current) { aiRunningRef.current = false; return }
    if (s.currentTurn === 'ai' && !canAIAct(s)) {
      logAction('AI', `TURN PAUSED — waiting for player (phase=${s.turnPhase.type})`)
      if (mountedRef.current) {
        setGameState(s)
        setIsAIThinking(false)
      }
      aiRunningRef.current = false
      return
    }

    // Handle discard if needed
    if (s.turnPhase.type === 'play') {
      logAction('AI', 'ending play phase')
      s = endPlayPhase(s)
    }
    if (s.turnPhase.type === 'discard') {
      logAction('AI', 'discarding to 7')
      const decision = getAIDecision(s)
      if (decision.discardCardIds) {
        s = engineDiscardCards(s, decision.discardCardIds)
      }
    }

    // If it's now player's draw phase, auto-draw
    if (s.turnPhase.type === 'draw' && s.currentTurn === 'player') {
      logAction('Player', 'auto-draw')
      s = executeDraw(s)
    }

    logState('AI TURN END', s)
    if (mountedRef.current) {
      setGameState(s)
      setIsAIThinking(false)
    }
    aiRunningRef.current = false
  }, [])

  // ── Watch for AI turn trigger (deferred to avoid sync setState in effect) ──
  // Fires on draw (start of AI turn) AND when AI can act after player resolves
  // an action mid-AI-turn (e.g. player paid Birthday debt → AI resumes playing).
  useEffect(() => {
    if (!gameState) return
    if (gameState.currentTurn !== 'ai') return
    if (aiRunningRef.current) return
    if (gameState.turnPhase.type === 'gameOver') return

    const shouldTrigger = gameState.turnPhase.type === 'draw' || canAIAct(gameState)
    if (shouldTrigger) {
      const delayMs = gameState.turnPhase.type === 'draw' ? 0 : AI_ACTION_DELAY_MS
      logAction('AI', `TRIGGER — phase=${gameState.turnPhase.type}`)
      const timer = setTimeout(() => executeAITurn(gameState), delayMs)
      return (): void => clearTimeout(timer)
    }
  }, [gameState, executeAITurn])

  // ── Auto-resolve AI responses during player's turn ──
  // When the player plays Birthday, Debt Collector, Rent, etc., the AI must pay/respond.
  // The AI turn loop doesn't handle this because currentTurn is still 'player'.
  useEffect(() => {
    if (!gameState || gameState.currentTurn !== 'player') return

    const phase = gameState.turnPhase

    // AI must pay debt
    if (phase.type === 'awaitingPayment' && phase.debt.debtor === 'ai') {
      const timer = setTimeout(() => {
        logAction('AI', 'auto-pay debt (player turn)')
        const decision = getAIDecision({ ...gameState, currentTurn: 'ai' })
        if (decision.type === 'payDebt' && decision.paymentCardIds) {
          let s = gameState
          for (const cardId of decision.paymentCardIds) {
            s = engineTogglePayment(s, cardId)
          }
          s = engineConfirmPayment(s)
          logState('AI paid debt', s)
          setGameState(s)
        } else {
          // No cards to pay — just confirm with $0
          const s = engineConfirmPayment(gameState)
          logState('AI paid debt (empty)', s)
          setGameState(s)
        }
      }, AI_ACTION_DELAY_MS)
      return (): void => clearTimeout(timer)
    }

    // AI must respond to JSN chain
    if (phase.type === 'awaitingJSN' && phase.jsnChain.currentDecider === 'ai') {
      const timer = setTimeout(() => {
        logAction('AI', 'auto-respond JSN (player turn)')
        const decision = getAIDecision({ ...gameState, currentTurn: 'ai' })
        let s: MonopolyDealState
        if (decision.type === 'useJSN' && decision.cardId) {
          s = playJustSayNo(gameState, decision.cardId)
        } else {
          s = acceptJSNOutcome(gameState)
        }
        logState('AI JSN response', s)
        setGameState(s)
      }, AI_ACTION_DELAY_MS)
      return (): void => clearTimeout(timer)
    }
  }, [gameState])

  // ── Game lifecycle ──
  const startNewGame = useCallback((): void => {
    logAction('Game', 'NEW GAME')
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

    const card = gameState.player.hand.find((c) => c.id === cardId)
    if (!card) return

    const validation = engineCanPlayCard(gameState, cardId)
    // Buildings with no valid target get auto-banked as money instead of being blocked
    if (!validation.valid && card.type === 'building') {
      logAction('Player', 'autoBankBuilding', `${card.name} — no valid target, banking as M${card.value}M`)
      const s = engineBankCard(gameState, cardId)
      updateState(s)
      return
    }
    if (!validation.valid) { logAction('Player', 'INVALID play', `${cardId}: ${validation.reason}`); return }

    logAction('Player', 'playCard', `${card.name} (${card.type}) id=${cardId}`)

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
        // Check if player has Double Rent and enough plays to combo
        const doubleRent = gameState.player.hand.find(
          (c) => c.name === 'Double Rent' && c.id !== cardId
        )
        if (doubleRent && gameState.turnPhase.type === 'play' && gameState.turnPhase.playsRemaining >= 2) {
          // Offer to pair with Double Rent
          updateState({
            ...gameState,
            turnPhase: { type: 'awaitingDoubleRentConfirm', rentCardId: cardId, doubleRentCardId: doubleRent.id },
          })
        } else if (isWildRentCard(card)) {
          const bestColor = selectHighestRentColor(gameState.player)
          const s = playRentCard(gameState, cardId, undefined, bestColor)
          updateState(s)
        } else {
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
    const phase = gameState.turnPhase
    // Allow banking from play phase or from building target dialog
    if (phase.type !== 'play' && phase.type !== 'awaitingBuildingTarget') return
    logAction('Player', 'bankCard', cardId)
    // If banking from a dialog phase, first reset to play phase then bank
    const base = phase.type === 'awaitingBuildingTarget'
      ? { ...gameState, turnPhase: { type: 'play' as const, playsRemaining: 3 - gameState.playsUsedThisTurn } }
      : gameState
    const s = engineBankCard(base, cardId)
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
    let s = engineTogglePayment(gameState, cardId)

    // Auto-pay: if selected value now covers the debt, confirm immediately
    if (s.turnPhase.type === 'awaitingPayment' && s.turnPhase.debt.debtor === 'player') {
      const { amount, selectedPayment } = s.turnPhase.debt
      const debtorState = s.player
      const payValue = getSelectedPaymentValue(debtorState, selectedPayment)
      if (payValue >= amount) {
        logAction('Player', 'auto-confirmPayment', `M${payValue}M >= M${amount}M`)
        s = engineConfirmPayment(s)
      }
    }
    updateState(s)
  }, [gameState, updateState])

  const confirmDebtPayment = useCallback((): void => {
    if (!gameState) return
    logAction('Player', 'confirmPayment')
    const s = engineConfirmPayment(gameState)
    updateState(s)
  }, [gameState, updateState])

  const respondJSN = useCallback((jsnCardId: string): void => {
    if (!gameState) return
    logAction('Player', 'Just Say No', jsnCardId)
    const s = playJustSayNo(gameState, jsnCardId)
    updateState(s)
  }, [gameState, updateState])

  const acceptIncomingAction = useCallback((): void => {
    if (!gameState) return
    logAction('Player', 'acceptAction', gameState.turnPhase.type)
    if (gameState.turnPhase.type === 'awaitingJSN') {
      const s = acceptJSNOutcome(gameState)
      updateState(s)
    } else if (gameState.turnPhase.type === 'awaitingPayment') {
      // Auto-confirm with whatever is selected
      const s = engineConfirmPayment(gameState)
      updateState(s)
    }
  }, [gameState, updateState])

  // ── Double Rent confirm / skip ──
  const confirmDoubleRent = useCallback((): void => {
    if (!gameState || gameState.turnPhase.type !== 'awaitingDoubleRentConfirm') return
    const { rentCardId, doubleRentCardId } = gameState.turnPhase
    logAction('Player', 'confirmDoubleRent', `${rentCardId} + ${doubleRentCardId}`)

    const rentCard = gameState.player.hand.find((c) => c.id === rentCardId)
    if (rentCard && isWildRentCard(rentCard)) {
      const bestColor = selectHighestRentColor(gameState.player)
      const s = playRentCard(gameState, rentCardId, doubleRentCardId, bestColor)
      updateState(s)
      return
    }

    // Move to rent color selection with double rent attached
    updateState({
      ...gameState,
      turnPhase: { type: 'awaitingRentColor', cardId: rentCardId, doubleRentCardId },
    })
  }, [gameState, updateState])

  const skipDoubleRent = useCallback((): void => {
    if (!gameState || gameState.turnPhase.type !== 'awaitingDoubleRentConfirm') return
    const { rentCardId } = gameState.turnPhase
    logAction('Player', 'skipDoubleRent', rentCardId)

    const rentCard = gameState.player.hand.find((c) => c.id === rentCardId)
    if (rentCard && isWildRentCard(rentCard)) {
      const bestColor = selectHighestRentColor(gameState.player)
      const s = playRentCard(gameState, rentCardId, undefined, bestColor)
      updateState(s)
      return
    }

    // Move to rent color selection without double rent
    updateState({
      ...gameState,
      turnPhase: { type: 'awaitingRentColor', cardId: rentCardId },
    })
  }, [gameState, updateState])

  const cancelAction = useCallback((): void => {
    if (!gameState || gameState.currentTurn !== 'player') return
    const phase = gameState.turnPhase
    // Only cancel phases where card is still in hand (not consumed)
    if (
      phase.type === 'awaitingWildColor' ||
      phase.type === 'awaitingRentColor' ||
      phase.type === 'awaitingBuildingTarget' ||
      phase.type === 'awaitingWildRelocation' ||
      phase.type === 'awaitingDoubleRentConfirm' ||
      phase.type === 'awaitingBuildingRelocation'
    ) {
      logAction('Player', 'CANCEL', phase.type)
      const remaining = 3 - gameState.playsUsedThisTurn
      updateState({
        ...gameState,
        turnPhase: { type: 'play', playsRemaining: remaining },
      })
    }
  }, [gameState, updateState])

  // ── Wild card relocation (free action — does not consume a play) ──
  const relocatableWilds = gameState && gameState.currentTurn === 'player' && gameState.turnPhase.type === 'play'
    ? getRelocatableWilds(gameState, 'player')
    : []

  const initiateWildRelocation = useCallback((wildCardId: string): void => {
    if (!gameState || gameState.currentTurn !== 'player') return
    if (gameState.turnPhase.type !== 'play') return
    // Find the wild card's current color on our field
    for (const group of gameState.player.field) {
      if (group.cards.some((c) => c.id === wildCardId && c.type === 'wild')) {
        logAction('Player', 'initiateWildRelocation', `${wildCardId} from ${group.color}`)
        updateState({
          ...gameState,
          turnPhase: { type: 'awaitingWildRelocation', wildCardId, currentColor: group.color },
        })
        return
      }
    }
  }, [gameState, updateState])

  const completeWildRelocation = useCallback((newColor: PropertyColor): void => {
    if (!gameState || gameState.turnPhase.type !== 'awaitingWildRelocation') return
    const { wildCardId } = gameState.turnPhase
    logAction('Player', 'completeWildRelocation', `${wildCardId} → ${newColor}`)
    let s = relocateWildOnField(gameState, wildCardId, newColor)
    // Restore play phase (relocation is free — does not consume a play)
    const remaining = 3 - s.playsUsedThisTurn
    s = { ...s, turnPhase: { type: 'play', playsRemaining: remaining } }
    updateState(s)
  }, [gameState, updateState])

  // ── Building relocation (free action — does not consume a play) ──
  const relocatableBuildings = gameState && gameState.currentTurn === 'player' && gameState.turnPhase.type === 'play'
    ? getRelocatableBuildings(gameState, 'player')
    : []

  const initiateBuildingRelocation = useCallback((buildingCardId: string): void => {
    if (!gameState || gameState.currentTurn !== 'player') return
    if (gameState.turnPhase.type !== 'play') return
    for (const group of gameState.player.field) {
      if (group.buildings.some((b) => b.id === buildingCardId)) {
        logAction('Player', 'initiateBuildingRelocation', `${buildingCardId} from ${group.color}`)
        updateState({
          ...gameState,
          turnPhase: { type: 'awaitingBuildingRelocation', buildingCardId, sourceColor: group.color },
        })
        return
      }
    }
  }, [gameState, updateState])

  const completeBuildingRelocation = useCallback((targetColor: PropertyColor): void => {
    if (!gameState || gameState.turnPhase.type !== 'awaitingBuildingRelocation') return
    const { buildingCardId } = gameState.turnPhase
    logAction('Player', 'completeBuildingRelocation', `${buildingCardId} → ${targetColor}`)
    let s = relocateBuildingOnField(gameState, buildingCardId, targetColor)
    // Restore play phase (relocation is free — does not consume a play)
    const remaining = 3 - s.playsUsedThisTurn
    s = { ...s, turnPhase: { type: 'play', playsRemaining: remaining } }
    updateState(s)
  }, [gameState, updateState])

  const discardCard = useCallback((cardId: string): void => {
    if (!gameState || gameState.turnPhase.type !== 'discard') return
    const s = engineDiscardCards(gameState, [cardId])
    updateState(s)
  }, [gameState, updateState])

  const endTurnFn = useCallback((): void => {
    if (!gameState || gameState.currentTurn !== 'player') return
    if (gameState.turnPhase.type !== 'play') return
    logAction('Player', 'END TURN')
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
    cancelAction,
    confirmDoubleRent,
    skipDoubleRent,
    initiateWildRelocation,
    completeWildRelocation,
    relocatableWilds,
    initiateBuildingRelocation,
    completeBuildingRelocation,
    relocatableBuildings,
    discardCard,
    endTurn: endTurnFn,
    isAIThinking,
  }
}
