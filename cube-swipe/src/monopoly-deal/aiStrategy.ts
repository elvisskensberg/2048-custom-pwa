// ---------------------------------------------------------------------------
// Monopoly Deal — AI opponent strategy (heuristic, priority-based)
// ---------------------------------------------------------------------------

import type { PropertyColor, MonopolyCardData } from './cardData'
import { SET_SIZE, COLOR_RENT } from './cardData'
import type {
  MonopolyDealState,
  PlayerId,
  PlayerState,
} from './gameEngine'
import {
  countCompleteSets,
  getStealableProperties,
  getCompleteSetColors,
  calculateRent,
  getPayableCards,
  canPlaceBuilding,
} from './gameEngine'

// ---------------------------------------------------------------------------
// Decision type
// ---------------------------------------------------------------------------

export interface AIDecision {
  type:
    | 'playProperty'
    | 'bankCard'
    | 'playAction'
    | 'playBuilding'
    | 'playRent'
    | 'endTurn'
    | 'payDebt'
    | 'useJSN'
    | 'acceptAction'
    | 'discard'
    | 'selectTarget'
    | 'selectColor'
  cardId?: string
  targetColor?: PropertyColor
  targetCardId?: string
  yourCardId?: string
  doubleRentCardId?: string
  paymentCardIds?: string[]
  discardCardIds?: string[]
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/** Get the next AI decision for the current game state. */
export function getAIDecision(state: MonopolyDealState): AIDecision {
  const ai = state.ai
  const phase = state.turnPhase

  switch (phase.type) {
    case 'play':
      return choosePlay(state, ai, phase.playsRemaining)
    case 'discard':
      return chooseDiscards(ai, phase.mustDiscard)
    case 'awaitingPayment':
      return choosePayment(state)
    case 'awaitingJSN':
      return chooseJSNResponse(state)
    case 'awaitingSlyDealTarget':
      return chooseSlyDealTarget(state)
    case 'awaitingDealBreakerTarget':
      return chooseDealBreakerTarget(state)
    case 'awaitingForcedDealSelect':
      return chooseForcedDealTargets(state)
    case 'awaitingBuildingTarget':
      return chooseBuildingTarget(state)
    case 'awaitingWildColor':
      return chooseWildColor(state, phase.cardId)
    case 'awaitingRentColor':
      return chooseRentColor(state)
    default:
      return { type: 'endTurn' }
  }
}

// ---------------------------------------------------------------------------
// Play phase — score and rank possible plays
// ---------------------------------------------------------------------------

interface ScoredPlay {
  decision: AIDecision
  score: number
}

function choosePlay(state: MonopolyDealState, ai: PlayerState, playsRemaining: number): AIDecision {
  if (playsRemaining <= 0 || ai.hand.length === 0) return { type: 'endTurn' }

  const plays: ScoredPlay[] = []
  const opponent = state.player

  for (const card of ai.hand) {
    // Skip Double Rent (only played with rent cards)
    if (card.name === 'Double Rent') continue

    switch (card.type) {
      case 'property': {
        const score = scorePropertyPlay(ai, card)
        plays.push({
          decision: { type: 'playProperty', cardId: card.id, targetColor: card.color! },
          score,
        })
        break
      }
      case 'wild': {
        if (card.color && card.color2) {
          // Dual wild — choose best color
          const color = pickBestWildColor(ai, card.color, card.color2)
          const score = scorePropertyPlay(ai, card, color)
          plays.push({
            decision: { type: 'playProperty', cardId: card.id, targetColor: color },
            score: score + 2, // Small bonus for flexibility
          })
        } else {
          // Rainbow wild — pick most-needed color
          const color = pickBestRainbowColor(ai)
          if (color) {
            plays.push({
              decision: { type: 'playProperty', cardId: card.id, targetColor: color },
              score: scorePropertyPlay(ai, card, color) + 5,
            })
          }
        }
        break
      }
      case 'money': {
        plays.push({
          decision: { type: 'bankCard', cardId: card.id },
          score: 20 + card.value,
        })
        break
      }
      case 'building': {
        for (const group of ai.field) {
          if (canPlaceBuilding(card, group)) {
            plays.push({
              decision: { type: 'playBuilding', cardId: card.id, targetColor: group.color },
              score: 45,
            })
          }
        }
        break
      }
      case 'rent': {
        const rentScore = scoreRentPlay(ai, card, playsRemaining)
        if (rentScore.score > 0) {
          plays.push(rentScore)
        }
        break
      }
      case 'action': {
        const actionScore = scoreActionPlay(state, ai, opponent, card)
        if (actionScore) plays.push(actionScore)
        break
      }
    }
  }

  if (plays.length === 0) return { type: 'endTurn' }

  // Sort by score descending
  plays.sort((a, b) => b.score - a.score)

  // Only play if score is above minimum threshold
  if (plays[0].score < 5) return { type: 'endTurn' }

  return plays[0].decision
}

function scorePropertyPlay(ai: PlayerState, card: MonopolyCardData, color?: PropertyColor): number {
  const targetColor = color ?? card.color
  if (!targetColor) return 0

  const group = ai.field.find((g) => g.color === targetColor)
  const current = group ? group.cards.length : 0
  const needed = SET_SIZE[targetColor]

  // Check if this completes a set
  if (current + 1 >= needed) {
    // Check if this would be the 3rd complete set (instant win!)
    const completeSets = countCompleteSets(ai)
    const wouldBeComplete = completeSets + 1
    if (wouldBeComplete >= 3) return 100 // WIN MOVE
    return 70 // Completing a set is very valuable
  }

  // Progress toward set completion
  const progressRatio = (current + 1) / needed
  return 50 * progressRatio
}

function pickBestWildColor(ai: PlayerState, c1: PropertyColor, c2: PropertyColor): PropertyColor {
  const score1 = colorNeedScore(ai, c1)
  const score2 = colorNeedScore(ai, c2)
  return score1 >= score2 ? c1 : c2
}

function pickBestRainbowColor(ai: PlayerState): PropertyColor | null {
  const colors: PropertyColor[] = [
    'brown', 'lightBlue', 'pink', 'orange', 'red',
    'yellow', 'green', 'darkBlue', 'railroad', 'utility',
  ]
  let best: PropertyColor | null = null
  let bestScore = -1
  for (const color of colors) {
    const score = colorNeedScore(ai, color)
    if (score > bestScore) {
      bestScore = score
      best = color
    }
  }
  return best
}

function colorNeedScore(ai: PlayerState, color: PropertyColor): number {
  const group = ai.field.find((g) => g.color === color)
  const current = group ? group.cards.length : 0
  const needed = SET_SIZE[color]
  if (current >= needed) return -1 // Already complete
  // Higher score = closer to completion
  return (current + 1) / needed * 10
}

function scoreRentPlay(
  ai: PlayerState,
  card: MonopolyCardData,
  playsRemaining: number,
): ScoredPlay {
  // Determine which colors this rent card covers
  const colors: PropertyColor[] = []
  if (card.color) colors.push(card.color)
  if (card.color2) colors.push(card.color2)
  if (colors.length === 0) {
    // Wild rent — all colors
    for (const group of ai.field) {
      if (group.cards.length > 0) colors.push(group.color)
    }
  }

  // Find best color to charge rent for
  let bestColor: PropertyColor | null = null
  let bestRent = 0
  for (const color of colors) {
    const rent = calculateRent(ai, color, false)
    if (rent > bestRent) {
      bestRent = rent
      bestColor = color
    }
  }

  if (!bestColor || bestRent < 1) {
    return { decision: { type: 'endTurn' }, score: 0 }
  }

  // Check for Double Rent combo
  const doubleRent = ai.hand.find((c) => c.name === 'Double Rent')
  if (doubleRent && playsRemaining >= 2) {
    return {
      decision: {
        type: 'playRent',
        cardId: card.id,
        targetColor: bestColor,
        doubleRentCardId: doubleRent.id,
      },
      score: 85, // High priority for doubled rent
    }
  }

  return {
    decision: { type: 'playRent', cardId: card.id, targetColor: bestColor },
    score: bestRent >= 3 ? 70 : 30 + bestRent * 5,
  }
}

function scoreActionPlay(
  _state: MonopolyDealState,
  ai: PlayerState,
  opponent: PlayerState,
  card: MonopolyCardData,
): ScoredPlay | null {
  switch (card.name) {
    case 'Deal Breaker': {
      const completeSets = getCompleteSetColors(opponent)
      if (completeSets.length === 0) return null
      return { decision: { type: 'playAction', cardId: card.id }, score: 90 }
    }
    case 'Sly Deal': {
      const targets = getStealableProperties(opponent)
      if (targets.length === 0) return null
      // Score by how much it helps our sets
      let bestScore = 0
      for (const t of targets) {
        const need = colorNeedScore(ai, t.groupColor)
        bestScore = Math.max(bestScore, need)
      }
      return { decision: { type: 'playAction', cardId: card.id }, score: 55 + bestScore }
    }
    case 'Forced Deal': {
      const targets = getStealableProperties(opponent)
      const myStealable = getStealableProperties(ai)
      if (targets.length === 0 || myStealable.length === 0) return null
      return { decision: { type: 'playAction', cardId: card.id }, score: 50 }
    }
    case 'Debt Collector': {
      return { decision: { type: 'playAction', cardId: card.id }, score: 35 }
    }
    case "It's My Birthday": {
      return { decision: { type: 'playAction', cardId: card.id }, score: 30 }
    }
    case 'Pass Go': {
      return { decision: { type: 'playAction', cardId: card.id }, score: 40 }
    }
    case 'Just Say No': {
      // Don't play proactively — it's a response card. Bank it.
      return { decision: { type: 'bankCard', cardId: card.id }, score: 15 }
    }
    default:
      return { decision: { type: 'bankCard', cardId: card.id }, score: 10 + card.value }
  }
}

// ---------------------------------------------------------------------------
// Target selection
// ---------------------------------------------------------------------------

function chooseSlyDealTarget(state: MonopolyDealState): AIDecision {
  const ai = state.ai
  const targets = getStealableProperties(state.player)
  if (targets.length === 0) return { type: 'endTurn' }

  // Pick the property that best helps our sets
  let best = targets[0]
  let bestScore = -1
  for (const t of targets) {
    const score = colorNeedScore(ai, t.groupColor)
    if (score > bestScore) {
      bestScore = score
      best = t
    }
  }
  return { type: 'selectTarget', targetCardId: best.card.id }
}

function chooseDealBreakerTarget(state: MonopolyDealState): AIDecision {
  const completeSets = getCompleteSetColors(state.player)
  if (completeSets.length === 0) return { type: 'endTurn' }

  // Steal the set with the highest rent value
  let bestColor = completeSets[0]
  let bestRent = 0
  for (const color of completeSets) {
    const rentIdx = SET_SIZE[color] - 1
    const rent = COLOR_RENT[color][rentIdx] ?? 0
    if (rent > bestRent) {
      bestRent = rent
      bestColor = color
    }
  }
  return { type: 'selectTarget', targetColor: bestColor }
}

function chooseForcedDealTargets(state: MonopolyDealState): AIDecision {
  const phase = state.turnPhase
  if (phase.type !== 'awaitingForcedDealSelect') return { type: 'endTurn' }

  if (phase.phase === 'give') {
    // Give our least valuable non-set-contributing property
    const myStealable = getStealableProperties(state.ai)
    if (myStealable.length === 0) return { type: 'endTurn' }
    // Sort by value ascending
    myStealable.sort((a, b) => a.card.value - b.card.value)
    return { type: 'selectTarget', yourCardId: myStealable[0].card.id }
  } else {
    // Take their most valuable property that helps our sets
    const targets = getStealableProperties(state.player)
    if (targets.length === 0) return { type: 'endTurn' }
    let best = targets[0]
    let bestScore = -1
    for (const t of targets) {
      const score = colorNeedScore(state.ai, t.groupColor)
      if (score > bestScore) {
        bestScore = score
        best = t
      }
    }
    return { type: 'selectTarget', targetCardId: best.card.id }
  }
}

function chooseBuildingTarget(state: MonopolyDealState): AIDecision {
  const phase = state.turnPhase
  if (phase.type !== 'awaitingBuildingTarget') return { type: 'endTurn' }

  const card = state.ai.hand.find((c) => c.id === phase.cardId)
  if (!card) return { type: 'endTurn' }

  for (const group of state.ai.field) {
    if (canPlaceBuilding(card, group)) {
      return { type: 'selectTarget', targetColor: group.color }
    }
  }
  return { type: 'endTurn' }
}

function chooseWildColor(state: MonopolyDealState, cardId: string): AIDecision {
  const card = state.ai.hand.find((c) => c.id === cardId)
  if (!card) return { type: 'endTurn' }

  let color: PropertyColor
  if (card.color && card.color2) {
    color = pickBestWildColor(state.ai, card.color, card.color2)
  } else {
    color = pickBestRainbowColor(state.ai) ?? 'brown'
  }
  return { type: 'selectColor', targetColor: color }
}

function chooseRentColor(state: MonopolyDealState): AIDecision {
  // Pick the color with highest rent
  let bestColor: PropertyColor | null = null
  let bestRent = 0
  for (const group of state.ai.field) {
    const rent = calculateRent(state.ai, group.color, false)
    if (rent > bestRent) {
      bestRent = rent
      bestColor = group.color
    }
  }
  return { type: 'selectColor', targetColor: bestColor ?? 'brown' }
}

// ---------------------------------------------------------------------------
// Debt payment
// ---------------------------------------------------------------------------

function choosePayment(state: MonopolyDealState): AIDecision {
  if (state.turnPhase.type !== 'awaitingPayment') return { type: 'endTurn' }
  const { amount } = state.turnPhase.debt
  const ai = state.ai

  const payable = getPayableCards(ai)
  if (payable.length === 0) return { type: 'payDebt', paymentCardIds: [] }

  // Strategy: pay with lowest-value cards first, prefer money over properties
  const sorted = [...payable].sort((a, b) => {
    // Money cards first
    const aIsMoney = a.type === 'money' ? 0 : 1
    const bIsMoney = b.type === 'money' ? 0 : 1
    if (aIsMoney !== bIsMoney) return aIsMoney - bIsMoney
    // Then by value ascending
    return a.value - b.value
  })

  const selected: string[] = []
  let total = 0
  for (const card of sorted) {
    if (total >= amount) break
    selected.push(card.id)
    total += card.value
  }

  return { type: 'payDebt', paymentCardIds: selected }
}

// ---------------------------------------------------------------------------
// Just Say No response
// ---------------------------------------------------------------------------

function chooseJSNResponse(state: MonopolyDealState): AIDecision {
  if (state.turnPhase.type !== 'awaitingJSN') return { type: 'endTurn' }
  const { jsnChain } = state.turnPhase

  const ai = state.ai
  const jsnCard = ai.hand.find((c) => c.name === 'Just Say No')
  if (!jsnCard) return { type: 'acceptAction' }

  const action = jsnChain.originalAction
  const actionName = action.actionCard.name

  // Always counter Deal Breaker
  if (actionName === 'Deal Breaker') {
    return { type: 'useJSN', cardId: jsnCard.id }
  }

  // Counter high rent
  if (action.targetColor) {
    const rent = calculateRent(
      getPlayerForAction(state, action.sourcePlayer),
      action.targetColor,
      !!action.doubleRentCardId,
    )
    if (rent >= 6) return { type: 'useJSN', cardId: jsnCard.id }
  }

  // Counter Sly Deal if it would break a near-complete set
  if (actionName === 'Sly Deal') {
    // Check if any of our groups would break
    for (const group of ai.field) {
      if (group.cards.length === SET_SIZE[group.color]) {
        return { type: 'useJSN', cardId: jsnCard.id }
      }
    }
  }

  // Don't waste JSN on small amounts
  if (actionName === "It's My Birthday") return { type: 'acceptAction' }
  if (actionName === 'Debt Collector' && ai.bank.length > 3) return { type: 'acceptAction' }

  return { type: 'acceptAction' }
}

function getPlayerForAction(state: MonopolyDealState, p: PlayerId): PlayerState {
  return p === 'player' ? state.player : state.ai
}

// ---------------------------------------------------------------------------
// Discard selection
// ---------------------------------------------------------------------------

function chooseDiscards(ai: PlayerState, mustDiscard: number): AIDecision {
  // Discard lowest-value cards
  const sorted = [...ai.hand].sort((a, b) => a.value - b.value)
  const ids = sorted.slice(0, mustDiscard).map((c) => c.id)
  return { type: 'discard', discardCardIds: ids }
}
