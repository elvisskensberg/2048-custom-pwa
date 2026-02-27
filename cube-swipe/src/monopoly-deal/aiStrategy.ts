// ---------------------------------------------------------------------------
// Monopoly Deal - AI opponent strategy (heuristic, priority-based)
// ---------------------------------------------------------------------------

import type { PropertyColor, MonopolyCardData } from './cardData'
import {
  SET_SIZE,
  COLOR_RENT,
  ACTION_CARDS,
  RENT_CARDS,
  PROPERTY_CARDS,
  MONEY_CARDS,
  BUILDING_CARDS,
  WILD_CARDS,
} from './cardData'
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
  canPlaceBuilding,
  getPlayerTotalValue,
  getBuildingRelocationTargets,
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
    | 'wait'
  cardId?: string
  targetColor?: PropertyColor
  targetCardId?: string
  yourCardId?: string
  doubleRentCardId?: string
  paymentCardIds?: string[]
  discardCardIds?: string[]
}

interface ScoredPlay {
  decision: AIDecision
  score: number
  meta?: {
    sourceCardId?: string
    sourceCardName?: string
    expectedRent?: number
    highImpact?: boolean
    hiddenRiskSensitive?: boolean
    appliedRiskPenalty?: number
    lookaheadBonus?: number
  }
}

interface ColorMetrics {
  cardCount: number
  needed: number
  rent: number
}

type FieldMetrics = Record<PropertyColor, ColorMetrics>

interface ScoredCard {
  card: MonopolyCardData
  score: number
}

type AIDifficultyMode = 'adaptive' | 'aggressive' | 'balanced' | 'defensive'
type ResolvedProfile = Exclude<AIDifficultyMode, 'adaptive'>

interface ProfileWeights {
  minPlayScore: number
  threatSensitivity: number
  lookaheadWeight: number
  hiddenRiskWeight: number
  aggressionScale: number
  defenseScale: number
  largeRentThreshold: number
  debtPreservationWeight: number
}

interface HiddenInfoModel {
  opponentHandCount: number
  jsnProbability: number
  rentResponseProbability: number
}

interface OpponentBehaviorModel {
  observedActions: number
  disruptionRate: number
  economyRate: number
  rentAggressionRate: number
  jsnUsageRate: number
  estimatedAggression: number
  cardTypePosterior: {
    dealBreakerRate: number
    slyDealRate: number
    forcedDealRate: number
    debtCollectorRate: number
    rentRate: number
    passGoRate: number
    birthdayRate: number
  }
  discardSignals: {
    jsnDiscardRatio: number
    rentDiscardRatio: number
    disruptionDiscardRatio: number
  }
}

interface DecisionContext {
  mode: AIDifficultyMode
  resolvedProfile: ResolvedProfile
  weights: ProfileWeights
  hidden: HiddenInfoModel
  opponentModel: OpponentBehaviorModel
}

export interface AITelemetrySnapshot {
  totalDecisions: number
  byPhase: Record<string, number>
  byProfile: Record<ResolvedProfile, number>
  lookaheadEvaluations: number
  lookaheadDepth3Evaluations: number
  lookaheadNodesVisited: number
  lookaheadBudgetHits: number
  lookaheadCacheHits: number
  lookaheadCacheMisses: number
  lookaheadBonusTotal: number
  hiddenRiskPenaltyTotal: number
  paymentSearchCalls: number
  paymentSearchNodesVisited: number
  paymentExactMatches: number
  totalDecisionMs: number
  maxDecisionMs: number
  slowDecisions: number
  recent: Array<{
    turn: number
    phase: string
    profile: ResolvedProfile
    decisionType: AIDecision['type']
    score?: number
    lookaheadBonus?: number
    riskPenalty?: number
  }>
}

const PROPERTY_COLORS: PropertyColor[] = [
  'brown', 'lightBlue', 'pink', 'orange', 'red',
  'yellow', 'green', 'darkBlue', 'railroad', 'utility',
]

const MIN_PLAY_SCORE = 6
const RECENT_OPPONENT_LOG_WINDOW = 16
const LOOKAHEAD_NODE_BUDGET_BASE = 18
const LOOKAHEAD_NODE_BUDGET_NEAR_LETHAL = 30
const SLOW_DECISION_THRESHOLD_MS = 10
const TOTAL_JSN_CARDS = ACTION_CARDS.filter((card) => card.name === 'Just Say No').length
const TOTAL_DECK_CARDS = (
  PROPERTY_CARDS.length
  + MONEY_CARDS.length
  + ACTION_CARDS.length
  + BUILDING_CARDS.length
  + WILD_CARDS.length
  + RENT_CARDS.length
)
const RENT_RESPONSE_ACTION_NAMES = new Set<string>([
  'Just Say No',
  'Deal Breaker',
  'Sly Deal',
  'Forced Deal',
  'Debt Collector',
  'Double Rent',
])
const TOTAL_RENT_RESPONSE_CARDS = (
  RENT_CARDS.length
  + ACTION_CARDS.filter((card) => RENT_RESPONSE_ACTION_NAMES.has(card.name)).length
)

const PROFILE_WEIGHTS: Record<ResolvedProfile, ProfileWeights> = {
  aggressive: {
    minPlayScore: 3,
    threatSensitivity: 1.25,
    lookaheadWeight: 0.34,
    hiddenRiskWeight: 0.8,
    aggressionScale: 1.16,
    defenseScale: 0.9,
    largeRentThreshold: 5,
    debtPreservationWeight: 0.85,
  },
  balanced: {
    minPlayScore: MIN_PLAY_SCORE,
    threatSensitivity: 1,
    lookaheadWeight: 0.28,
    hiddenRiskWeight: 1,
    aggressionScale: 1,
    defenseScale: 1,
    largeRentThreshold: 6,
    debtPreservationWeight: 1,
  },
  defensive: {
    minPlayScore: 8,
    threatSensitivity: 0.9,
    lookaheadWeight: 0.22,
    hiddenRiskWeight: 1.22,
    aggressionScale: 0.9,
    defenseScale: 1.15,
    largeRentThreshold: 7,
    debtPreservationWeight: 1.2,
  },
}

let configuredMode: AIDifficultyMode = 'adaptive'

const aiTelemetry: AITelemetrySnapshot = {
  totalDecisions: 0,
  byPhase: {},
  byProfile: { aggressive: 0, balanced: 0, defensive: 0 },
  lookaheadEvaluations: 0,
  lookaheadDepth3Evaluations: 0,
  lookaheadNodesVisited: 0,
  lookaheadBudgetHits: 0,
  lookaheadCacheHits: 0,
  lookaheadCacheMisses: 0,
  lookaheadBonusTotal: 0,
  hiddenRiskPenaltyTotal: 0,
  paymentSearchCalls: 0,
  paymentSearchNodesVisited: 0,
  paymentExactMatches: 0,
  totalDecisionMs: 0,
  maxDecisionMs: 0,
  slowDecisions: 0,
  recent: [],
}

export function setAIDifficultyMode(mode: AIDifficultyMode): void {
  configuredMode = mode
}

export function getAIDifficultyMode(): AIDifficultyMode {
  return configuredMode
}

export function resetAITelemetry(): void {
  aiTelemetry.totalDecisions = 0
  aiTelemetry.byPhase = {}
  aiTelemetry.byProfile = { aggressive: 0, balanced: 0, defensive: 0 }
  aiTelemetry.lookaheadEvaluations = 0
  aiTelemetry.lookaheadDepth3Evaluations = 0
  aiTelemetry.lookaheadNodesVisited = 0
  aiTelemetry.lookaheadBudgetHits = 0
  aiTelemetry.lookaheadCacheHits = 0
  aiTelemetry.lookaheadCacheMisses = 0
  aiTelemetry.lookaheadBonusTotal = 0
  aiTelemetry.hiddenRiskPenaltyTotal = 0
  aiTelemetry.paymentSearchCalls = 0
  aiTelemetry.paymentSearchNodesVisited = 0
  aiTelemetry.paymentExactMatches = 0
  aiTelemetry.totalDecisionMs = 0
  aiTelemetry.maxDecisionMs = 0
  aiTelemetry.slowDecisions = 0
  aiTelemetry.recent = []
}

export function getAITelemetrySnapshot(): AITelemetrySnapshot {
  return JSON.parse(JSON.stringify(aiTelemetry)) as AITelemetrySnapshot
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/** Get the next AI decision for the current game state. */
export function getAIDecision(state: MonopolyDealState): AIDecision {
  const decisionStart = Date.now()
  const ai = state.ai
  const phase = state.turnPhase
  const context = buildDecisionContext(state)
  let decision: AIDecision

  switch (phase.type) {
    case 'play':
      decision = choosePlay(state, ai, phase.playsRemaining, context)
      break
    case 'discard':
      decision = chooseDiscards(ai, phase.mustDiscard)
      break
    case 'awaitingPayment':
      decision = choosePayment(state, phase, context)
      break
    case 'awaitingJSN':
      decision = chooseJSNResponse(state, phase, context)
      break
    case 'awaitingSlyDealTarget':
      decision = chooseSlyDealTarget(state)
      break
    case 'awaitingDealBreakerTarget':
      decision = chooseDealBreakerTarget(state)
      break
    case 'awaitingForcedDealSelect':
      decision = chooseForcedDealTargets(state, phase)
      break
    case 'awaitingBuildingTarget':
      decision = chooseBuildingTarget(state, phase)
      break
    case 'awaitingBuildingRelocation':
      decision = chooseBuildingRelocationTarget(state, phase)
      break
    case 'awaitingWildColor':
      decision = chooseWildColor(state, phase.cardId)
      break
    case 'awaitingRentColor':
      decision = chooseRentColor(state)
      break
    default:
      decision = { type: 'endTurn' }
      break
  }

  const decisionDurationMs = Date.now() - decisionStart
  recordDecisionTelemetry(state, context.resolvedProfile, decision, decisionDurationMs)
  return decision
}

function buildDecisionContext(state: MonopolyDealState): DecisionContext {
  const opponentModel = buildOpponentBehaviorModel(state)
  const resolvedProfile = resolveProfile(state, opponentModel)
  const tunedWeights = applyOpponentTuning(PROFILE_WEIGHTS[resolvedProfile], opponentModel)
  return {
    mode: configuredMode,
    resolvedProfile,
    weights: tunedWeights,
    hidden: buildHiddenInfoModel(state, opponentModel),
    opponentModel,
  }
}

function resolveProfile(state: MonopolyDealState, opponentModel: OpponentBehaviorModel): ResolvedProfile {
  if (configuredMode !== 'adaptive') return configuredMode

  const aiSets = countCompleteSets(state.ai)
  const opponentSets = countCompleteSets(state.player)
  const valueDelta = getPlayerTotalValue(state.ai) - getPlayerTotalValue(state.player)
  const pressureDelta = opponentModel.estimatedAggression - opponentModel.economyRate * 0.4

  if (aiSets < opponentSets || valueDelta < -6 || pressureDelta > 0.7) return 'aggressive'
  if (aiSets > opponentSets || valueDelta > 8 || pressureDelta < 0.15) return 'defensive'
  return 'balanced'
}

function buildOpponentBehaviorModel(state: MonopolyDealState): OpponentBehaviorModel {
  const recentOpponentEntries = state.log
    .filter((entry) => entry.player === 'player')
    .slice(-RECENT_OPPONENT_LOG_WINDOW)

  if (recentOpponentEntries.length === 0) {
    const discardSignals = buildDiscardSignals(state.discardPile)
    return {
      observedActions: 0,
      disruptionRate: 0,
      economyRate: 0,
      rentAggressionRate: 0,
      jsnUsageRate: 0,
      estimatedAggression: 0.35,
      cardTypePosterior: {
        dealBreakerRate: 0,
        slyDealRate: 0,
        forcedDealRate: 0,
        debtCollectorRate: 0,
        rentRate: 0,
        passGoRate: 0,
        birthdayRate: 0,
      },
      discardSignals,
    }
  }

  let disruption = 0
  let economy = 0
  let rentAggression = 0
  let jsnUsage = 0
  let dealBreaker = 0
  let slyDeal = 0
  let forcedDeal = 0
  let debtCollector = 0
  let passGo = 0
  let birthday = 0

  for (const entry of recentOpponentEntries) {
    const action = entry.action.toLowerCase()
    if (action.includes('deal breaker')) dealBreaker++
    if (action.includes('sly deal')) slyDeal++
    if (action.includes('forced deal')) forcedDeal++
    if (action.includes('debt collector')) debtCollector++
    if (action.includes('pass go')) passGo++
    if (action.includes("it's my birthday") || action.includes('birthday')) birthday++
    if (
      action.includes('deal breaker')
      || action.includes('forced deal')
      || action.includes('sly deal')
      || action.includes('debt collector')
    ) {
      disruption++
    }
    if (action.includes('charged m') && action.includes('rent')) rentAggression++
    if (action.includes('just say no')) jsnUsage++
    if (action.includes('banked') || action.includes('drew') || action.includes('pass go')) economy++
  }

  const observed = recentOpponentEntries.length
  const disruptionRate = disruption / observed
  const economyRate = economy / observed
  const rentAggressionRate = rentAggression / observed
  const jsnUsageRate = jsnUsage / observed
  const cardTypePosterior = {
    dealBreakerRate: dealBreaker / observed,
    slyDealRate: slyDeal / observed,
    forcedDealRate: forcedDeal / observed,
    debtCollectorRate: debtCollector / observed,
    rentRate: rentAggressionRate,
    passGoRate: passGo / observed,
    birthdayRate: birthday / observed,
  }
  const discardSignals = buildDiscardSignals(state.discardPile)
  const estimatedAggression = clamp(
    0.32
    + disruptionRate * 0.36
    + rentAggressionRate * 0.28
    + jsnUsageRate * 0.2
    + cardTypePosterior.dealBreakerRate * 0.22
    + cardTypePosterior.forcedDealRate * 0.18
    + cardTypePosterior.slyDealRate * 0.14
    + cardTypePosterior.debtCollectorRate * 0.1
    - cardTypePosterior.passGoRate * 0.12
    - cardTypePosterior.birthdayRate * 0.06
    - economyRate * 0.24,
    0.05,
    0.96,
  )

  return {
    observedActions: observed,
    disruptionRate,
    economyRate,
    rentAggressionRate,
    jsnUsageRate,
    estimatedAggression,
    cardTypePosterior,
    discardSignals,
  }
}

function buildDiscardSignals(discardPile: MonopolyCardData[]): OpponentBehaviorModel['discardSignals'] {
  if (discardPile.length === 0) {
    return {
      jsnDiscardRatio: 0,
      rentDiscardRatio: 0,
      disruptionDiscardRatio: 0,
    }
  }

  let jsnDiscards = 0
  let rentDiscards = 0
  let disruptionDiscards = 0
  for (const card of discardPile) {
    if (card.name === 'Just Say No') jsnDiscards++
    if (card.type === 'rent') rentDiscards++
    if (
      card.name === 'Deal Breaker'
      || card.name === 'Sly Deal'
      || card.name === 'Forced Deal'
      || card.name === 'Debt Collector'
    ) {
      disruptionDiscards++
    }
  }

  return {
    jsnDiscardRatio: jsnDiscards / discardPile.length,
    rentDiscardRatio: rentDiscards / discardPile.length,
    disruptionDiscardRatio: disruptionDiscards / discardPile.length,
  }
}

function applyOpponentTuning(base: ProfileWeights, model: OpponentBehaviorModel): ProfileWeights {
  const threatMultiplier = clamp(
    1 + (model.disruptionRate * 0.3 + model.rentAggressionRate * 0.22 - model.economyRate * 0.16),
    0.85,
    1.35,
  )
  const hiddenRiskMultiplier = clamp(
    1 + (
      model.jsnUsageRate * 0.35
      + model.cardTypePosterior.dealBreakerRate * 0.2
      + model.cardTypePosterior.forcedDealRate * 0.16
      + model.cardTypePosterior.slyDealRate * 0.12
      + model.disruptionRate * 0.16
      - model.economyRate * 0.12
      - model.discardSignals.disruptionDiscardRatio * 0.1
    ),
    0.85,
    1.35,
  )
  const aggressionScale = clamp(
    base.aggressionScale * (1 + model.economyRate * 0.12 - model.disruptionRate * 0.08),
    0.82,
    1.32,
  )
  const defenseScale = clamp(
    base.defenseScale * (1 + model.disruptionRate * 0.12 + model.rentAggressionRate * 0.08),
    0.84,
    1.34,
  )
  const minPlayScore = clamp(
    base.minPlayScore - model.estimatedAggression * 1.2 + model.economyRate * 0.4,
    0,
    12,
  )

  return {
    ...base,
    minPlayScore,
    threatSensitivity: clamp(base.threatSensitivity * threatMultiplier, 0.7, 1.75),
    hiddenRiskWeight: clamp(base.hiddenRiskWeight * hiddenRiskMultiplier, 0.65, 1.9),
    aggressionScale,
    defenseScale,
    largeRentThreshold: clamp(
      base.largeRentThreshold - model.rentAggressionRate * 0.5 + model.economyRate * 0.25,
      4.5,
      8.5,
    ),
  }
}

function buildHiddenInfoModel(state: MonopolyDealState, opponentModel: OpponentBehaviorModel): HiddenInfoModel {
  const opponentHandCount = state.player.hand.length
  const visibleKnown = collectVisibleKnownCards(state)
  const knownJSN = countByName(visibleKnown, 'Just Say No')
  const knownRentResponses = countRentResponseCards(visibleKnown)
  const unknownPoolSize = Math.max(1, TOTAL_DECK_CARDS - visibleKnown.length)
  const remainingJSN = Math.max(0, TOTAL_JSN_CARDS - knownJSN)
  const remainingRentResponses = Math.max(0, TOTAL_RENT_RESPONSE_CARDS - knownRentResponses)
  const turnFactor = Math.min(0.1, state.turnNumber * 0.003)

  const jsnProbability = probabilityAtLeastOneInHand(
    unknownPoolSize,
    remainingJSN,
    opponentHandCount,
  )
  const responseProbability = probabilityAtLeastOneInHand(
    unknownPoolSize,
    remainingRentResponses,
    opponentHandCount,
  )
  const behaviorJSNBias = 1 + (
    opponentModel.jsnUsageRate * 0.45
    + opponentModel.cardTypePosterior.dealBreakerRate * 0.18
    + opponentModel.cardTypePosterior.forcedDealRate * 0.12
    + opponentModel.disruptionRate * 0.15
    - opponentModel.economyRate * 0.12
  )
  const behaviorRentBias = 1 + (
    opponentModel.rentAggressionRate * 0.4
    + opponentModel.cardTypePosterior.rentRate * 0.2
    + opponentModel.cardTypePosterior.debtCollectorRate * 0.15
    + opponentModel.cardTypePosterior.birthdayRate * 0.08
    + opponentModel.disruptionRate * 0.2
    - opponentModel.economyRate * 0.08
  )
  const jsnDiscardPressure = clamp(1 - opponentModel.discardSignals.jsnDiscardRatio * 0.45, 0.55, 1.05)
  const rentDiscardPressure = clamp(
    1 - (
      opponentModel.discardSignals.rentDiscardRatio * 0.22
      + opponentModel.discardSignals.disruptionDiscardRatio * 0.08
    ),
    0.62,
    1.08,
  )

  return {
    opponentHandCount,
    jsnProbability: clamp((jsnProbability + turnFactor * 0.25) * behaviorJSNBias * jsnDiscardPressure, 0.03, 0.95),
    rentResponseProbability: clamp(
      (responseProbability + turnFactor * 0.2) * behaviorRentBias * rentDiscardPressure,
      0.04,
      0.92,
    ),
  }
}

function collectVisibleKnownCards(state: MonopolyDealState): MonopolyCardData[] {
  const cards: MonopolyCardData[] = []
  addPlayerCards(cards, state.ai)
  addPublicCards(cards, state.player)
  cards.push(...state.discardPile)
  return cards
}

function addPlayerCards(target: MonopolyCardData[], player: PlayerState): void {
  target.push(...player.hand)
  addPublicCards(target, player)
}

function addPublicCards(target: MonopolyCardData[], player: PlayerState): void {
  target.push(...player.bank)
  for (const group of player.field) {
    target.push(...group.cards, ...group.buildings)
  }
}

function countByName(cards: MonopolyCardData[], name: string): number {
  let total = 0
  for (const card of cards) {
    if (card.name === name) total++
  }
  return total
}

function countRentResponseCards(cards: MonopolyCardData[]): number {
  let total = 0
  for (const card of cards) {
    if (card.type === 'rent') {
      total++
      continue
    }
    if (card.type === 'action' && RENT_RESPONSE_ACTION_NAMES.has(card.name)) {
      total++
    }
  }
  return total
}

function probabilityAtLeastOneInHand(
  poolSizeRaw: number,
  successRaw: number,
  drawsRaw: number,
): number {
  const poolSize = Math.max(0, Math.floor(poolSizeRaw))
  const successes = Math.max(0, Math.min(poolSize, Math.floor(successRaw)))
  const draws = Math.max(0, Math.min(poolSize, Math.floor(drawsRaw)))

  if (draws === 0 || successes === 0 || poolSize === 0) return 0
  if (successes >= poolSize) return 1

  const failures = poolSize - successes
  if (draws > failures) return 1

  let noSuccessProbability = 1
  for (let i = 0; i < draws; i++) {
    noSuccessProbability *= (failures - i) / (poolSize - i)
  }

  return clamp(1 - noSuccessProbability, 0, 1)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// ---------------------------------------------------------------------------
// Play phase - score possible plays in O(n) and keep only the best
// ---------------------------------------------------------------------------

function choosePlay(
  state: MonopolyDealState,
  ai: PlayerState,
  playsRemaining: number,
  context: DecisionContext,
): AIDecision {
  if (playsRemaining <= 0 || ai.hand.length === 0) return { type: 'endTurn' }

  const opponent = state.player
  const aiMetrics = getFieldMetrics(ai)
  const opponentMetrics = getFieldMetrics(opponent)
  const aiCompleteSets = countCompleteSets(ai)
  const opponentCompleteSets = countCompleteSets(opponent)
  const opponentThreat = getOpponentThreatScore(opponentMetrics, opponentCompleteSets) * context.weights.threatSensitivity

  let bestDecision: AIDecision | null = null
  let bestScore = Number.NEGATIVE_INFINITY
  let bestLookaheadBonus = 0
  let bestRiskPenalty = 0
  const lookaheadCache: LookaheadCache = new Map()

  function consider(play: ScoredPlay | null): void {
    if (!play) return
    const riskPenalty = getHiddenInfoRiskPenalty(play, context)
    const lookaheadBonus = play.meta?.highImpact
      ? getHighImpactTwoPlyBonus(
        state,
        play,
        aiMetrics,
        opponentMetrics,
        playsRemaining,
        context,
        lookaheadCache,
      )
      : 0
    const adjustedScore = play.score - riskPenalty + lookaheadBonus

    if (adjustedScore > bestScore) {
      bestScore = adjustedScore
      bestDecision = play.decision
      bestLookaheadBonus = lookaheadBonus
      bestRiskPenalty = riskPenalty
    }
  }

  for (const card of ai.hand) {
    if (card.name === 'Double Rent') continue

    switch (card.type) {
      case 'property': {
        const score = scorePropertyPlay(aiMetrics, card, card.color, aiCompleteSets)
        consider({
          decision: { type: 'playProperty', cardId: card.id, targetColor: card.color! },
          score,
        })
        break
      }
      case 'wild': {
        if (card.color && card.color2) {
          const color = pickBestWildColor(aiMetrics, card.color, card.color2)
          consider({
            decision: { type: 'playProperty', cardId: card.id, targetColor: color },
            score: scorePropertyPlay(aiMetrics, card, color, aiCompleteSets) + 3,
          })
        } else {
          const color = pickBestRainbowColor(aiMetrics)
          if (color) {
            consider({
              decision: { type: 'playProperty', cardId: card.id, targetColor: color },
              score: scorePropertyPlay(aiMetrics, card, color, aiCompleteSets) + 6,
            })
          }
        }
        break
      }
      case 'money':
        consider({
          decision: { type: 'bankCard', cardId: card.id },
          score: 18 + card.value,
        })
        break
      case 'building':
        consider(scoreBuildingPlay(ai, card))
        break
      case 'rent':
        consider(scoreRentPlay(ai, opponent, aiMetrics, card, playsRemaining, context))
        break
      case 'action':
        consider(
          scoreActionPlay(
            state,
            ai,
            opponent,
            aiMetrics,
            opponentMetrics,
            card,
            aiCompleteSets,
            opponentCompleteSets,
            opponentThreat,
            context,
          ),
        )
        break
    }
  }

  const effectiveMinScore = getEffectiveMinPlayScore(opponentThreat, ai.hand.length, context)
  if (!bestDecision || bestScore < effectiveMinScore) return { type: 'endTurn' }
  recordLookaheadTelemetry(bestLookaheadBonus, bestRiskPenalty)
  return bestDecision
}

function scorePropertyPlay(
  aiMetrics: FieldMetrics,
  card: MonopolyCardData,
  color: PropertyColor | undefined,
  completeSetCount: number,
): number {
  const targetColor = color ?? card.color
  if (!targetColor) return 0
  const metrics = aiMetrics[targetColor]

  if (metrics.cardCount >= metrics.needed) return -100

  if (metrics.cardCount + 1 === metrics.needed) {
    const wouldBeComplete = completeSetCount + 1
    if (wouldBeComplete >= 3) return 150
    return 84
  }

  const progressRatio = (metrics.cardCount + 1) / metrics.needed
  const projectedRent = COLOR_RENT[targetColor][Math.min(metrics.cardCount, COLOR_RENT[targetColor].length - 1)] ?? 0
  const shortSetBonus = metrics.needed === 2 ? 6 : 0
  return 44 * progressRatio + projectedRent * 3 + shortSetBonus
}

function scoreBuildingPlay(ai: PlayerState, card: MonopolyCardData): ScoredPlay | null {
  let best: ScoredPlay | null = null
  for (const group of ai.field) {
    if (!canPlaceBuilding(card, group)) continue
    const currentRent = calculateRent(ai, group.color, false)
    const bonus = card.name === 'House' ? 3 : card.name === 'Hotel' ? 4 : 0
    const score = 46 + currentRent * 2 + bonus * 3
    if (!best || score > best.score) {
      best = {
        decision: { type: 'playBuilding', cardId: card.id, targetColor: group.color },
        score,
      }
    }
  }
  return best
}

function scoreRentPlay(
  ai: PlayerState,
  opponent: PlayerState,
  aiMetrics: FieldMetrics,
  card: MonopolyCardData,
  playsRemaining: number,
  context: DecisionContext,
): ScoredPlay | null {
  const colors: PropertyColor[] = []
  if (card.color) colors.push(card.color)
  if (card.color2) colors.push(card.color2)
  if (colors.length === 0) {
    for (const color of PROPERTY_COLORS) {
      if (aiMetrics[color].cardCount > 0) colors.push(color)
    }
  }

  const uniqueColors = [...new Set(colors)]
  const maxCollectable = getPlayerTotalValue(opponent)

  let bestColor: PropertyColor | null = null
  let bestRent = 0
  for (const color of uniqueColors) {
    const rent = Math.min(calculateRent(ai, color, false), maxCollectable)
    if (rent > bestRent) {
      bestRent = rent
      bestColor = color
    }
  }

  if (!bestColor || bestRent < 1) return null

  const expectedRent = bestRent * (1 - context.hidden.jsnProbability * 0.6 * context.weights.hiddenRiskWeight)
  const highImpactRent = expectedRent >= context.weights.largeRentThreshold
  const doubleRent = ai.hand.find((c) => c.name === 'Double Rent')
  if (doubleRent && playsRemaining >= 2 && bestRent >= 2) {
    return {
      decision: {
        type: 'playRent',
        cardId: card.id,
        targetColor: bestColor,
        doubleRentCardId: doubleRent.id,
      },
      score: (84 + expectedRent * 8) * context.weights.aggressionScale,
      meta: {
        sourceCardId: card.id,
        sourceCardName: card.name,
        expectedRent,
        highImpact: highImpactRent || expectedRent >= 8,
        hiddenRiskSensitive: true,
      },
    }
  }

  return {
    decision: { type: 'playRent', cardId: card.id, targetColor: bestColor },
    score: (expectedRent >= 4 ? 74 : 44 + expectedRent * 6) * context.weights.aggressionScale,
    meta: {
      sourceCardId: card.id,
      sourceCardName: card.name,
      expectedRent,
      highImpact: highImpactRent,
      hiddenRiskSensitive: true,
    },
  }
}

function scoreActionPlay(
  _state: MonopolyDealState,
  ai: PlayerState,
  opponent: PlayerState,
  aiMetrics: FieldMetrics,
  opponentMetrics: FieldMetrics,
  card: MonopolyCardData,
  aiCompleteSets: number,
  opponentCompleteSets: number,
  opponentThreat: number,
  context: DecisionContext,
): ScoredPlay | null {
  switch (card.name) {
    case 'Deal Breaker': {
      const completeSets = getCompleteSetColors(opponent)
      if (completeSets.length === 0) return null

      let bestStealRent = 0
      for (const color of completeSets) {
        bestStealRent = Math.max(bestStealRent, calculateRent(opponent, color, false))
      }

      let score = 100 + bestStealRent * 3
      if (aiCompleteSets + 1 >= 3) score += 40
      if (opponentCompleteSets >= 2) score += 20
      score += Math.min(30, opponentThreat)
      score *= context.weights.aggressionScale
      return {
        decision: { type: 'playAction', cardId: card.id },
        score,
        meta: {
          sourceCardId: card.id,
          sourceCardName: card.name,
          highImpact: true,
          hiddenRiskSensitive: true,
        },
      }
    }
    case 'Sly Deal': {
      const targets = getStealableProperties(opponent)
      if (targets.length === 0) return null

      let bestDelta = 0
      for (const target of targets) {
        bestDelta = Math.max(
          bestDelta,
          scoreStealTarget(
            aiMetrics,
            opponentMetrics,
            target.groupColor,
            target.card.value,
            opponentCompleteSets,
          ),
        )
      }
      const score = (
        62
        + bestDelta * 2
        + (opponentCompleteSets >= 2 ? 10 : 0)
        + Math.min(12, opponentThreat * 0.4)
      ) * context.weights.aggressionScale
      return {
        decision: { type: 'playAction', cardId: card.id },
        score,
        meta: {
          sourceCardId: card.id,
          sourceCardName: card.name,
          highImpact: true,
          hiddenRiskSensitive: true,
        },
      }
    }
    case 'Forced Deal': {
      const targets = getStealableProperties(opponent)
      const myStealable = getStealableProperties(ai)
      if (targets.length === 0 || myStealable.length === 0) return null

      let bestTake = 0
      for (const t of targets) {
        bestTake = Math.max(
          bestTake,
          scoreStealTarget(
            aiMetrics,
            opponentMetrics,
            t.groupColor,
            t.card.value,
            opponentCompleteSets,
          ),
        )
      }

      let lowestGiveCost = Number.POSITIVE_INFINITY
      for (const mine of myStealable) {
        const cost = scoreGiveAwayCost(aiMetrics, mine.groupColor, mine.card)
        if (cost < lowestGiveCost) lowestGiveCost = cost
      }

      const netGain = bestTake - lowestGiveCost
      if (netGain <= 0 && opponentCompleteSets === 0) return null
      const score = (
        56
        + netGain * 2
        + (opponentCompleteSets >= 2 ? 8 : 0)
        + Math.min(10, opponentThreat * 0.3)
      ) * context.weights.aggressionScale
      return {
        decision: { type: 'playAction', cardId: card.id },
        score,
        meta: {
          sourceCardId: card.id,
          sourceCardName: card.name,
          highImpact: true,
          hiddenRiskSensitive: true,
        },
      }
    }
    case 'Debt Collector': {
      const opponentValue = getPlayerTotalValue(opponent)
      if (opponentValue <= 0) return null
      return {
        decision: { type: 'playAction', cardId: card.id },
        score: (38 + Math.min(10, opponentValue)) * context.weights.aggressionScale,
        meta: { sourceCardId: card.id, sourceCardName: card.name },
      }
    }
    case "It's My Birthday": {
      const opponentValue = getPlayerTotalValue(opponent)
      if (opponentValue <= 0) return null
      return {
        decision: { type: 'playAction', cardId: card.id },
        score: (30 + Math.min(6, opponentValue)) * context.weights.aggressionScale,
        meta: { sourceCardId: card.id, sourceCardName: card.name },
      }
    }
    case 'Pass Go': {
      let score = 36
      if (ai.hand.length <= 2) score = 52
      else if (ai.hand.length <= 4) score = 44
      else if (ai.hand.length >= 7) score = 28
      score -= Math.min(18, opponentThreat * 0.4)
      return {
        decision: { type: 'playAction', cardId: card.id },
        score: score * context.weights.defenseScale,
        meta: { sourceCardId: card.id, sourceCardName: card.name },
      }
    }
    case 'Just Say No':
      // Never bank JSN — it is far more valuable as a defensive card in hand.
      return null
    default:
      return {
        decision: { type: 'bankCard', cardId: card.id },
        score: (12 + card.value) * context.weights.defenseScale,
        meta: { sourceCardId: card.id, sourceCardName: card.name },
      }
  }
}

// ---------------------------------------------------------------------------
// Target selection
// ---------------------------------------------------------------------------

function chooseSlyDealTarget(state: MonopolyDealState): AIDecision {
  const targets = getStealableProperties(state.player)
  if (targets.length === 0) return { type: 'endTurn' }

  const aiMetrics = getFieldMetrics(state.ai)
  const opponentMetrics = getFieldMetrics(state.player)
  const opponentCompleteSets = countCompleteSets(state.player)

  let best = targets[0]
  let bestScore = Number.NEGATIVE_INFINITY
  for (const target of targets) {
    const score = scoreStealTarget(
      aiMetrics,
      opponentMetrics,
      target.groupColor,
      target.card.value,
      opponentCompleteSets,
    )
    if (score > bestScore) {
      bestScore = score
      best = target
    }
  }
  return { type: 'selectTarget', targetCardId: best.card.id }
}

function chooseDealBreakerTarget(state: MonopolyDealState): AIDecision {
  const completeSets = getCompleteSetColors(state.player)
  if (completeSets.length === 0) return { type: 'endTurn' }

  const aiCompleteSets = countCompleteSets(state.ai)
  let bestColor = completeSets[0]
  let bestScore = Number.NEGATIVE_INFINITY

  for (const color of completeSets) {
    const rentValue = calculateRent(state.player, color, false)
    let score = rentValue * 3
    if (aiCompleteSets + 1 >= 3) score += 100
    if (score > bestScore) {
      bestScore = score
      bestColor = color
    }
  }

  return { type: 'selectTarget', targetColor: bestColor }
}

function chooseForcedDealTargets(
  state: MonopolyDealState,
  phase: Extract<MonopolyDealState['turnPhase'], { type: 'awaitingForcedDealSelect' }>,
): AIDecision {
  if (phase.phase === 'give') {
    const myStealable = getStealableProperties(state.ai)
    if (myStealable.length === 0) return { type: 'endTurn' }

    const aiMetrics = getFieldMetrics(state.ai)
    let lowest = myStealable[0]
    let lowestCost = scoreGiveAwayCost(aiMetrics, lowest.groupColor, lowest.card)
    for (const candidate of myStealable) {
      const cost = scoreGiveAwayCost(aiMetrics, candidate.groupColor, candidate.card)
      if (cost < lowestCost) {
        lowest = candidate
        lowestCost = cost
      }
    }
    return { type: 'selectTarget', yourCardId: lowest.card.id }
  }

  const targets = getStealableProperties(state.player)
  if (targets.length === 0) return { type: 'endTurn' }

  const aiMetrics = getFieldMetrics(state.ai)
  const opponentMetrics = getFieldMetrics(state.player)
  const opponentCompleteSets = countCompleteSets(state.player)
  let best = targets[0]
  let bestScore = Number.NEGATIVE_INFINITY
  for (const target of targets) {
    const score = scoreStealTarget(
      aiMetrics,
      opponentMetrics,
      target.groupColor,
      target.card.value,
      opponentCompleteSets,
    )
    if (score > bestScore) {
      bestScore = score
      best = target
    }
  }
  return { type: 'selectTarget', targetCardId: best.card.id }
}

function chooseBuildingTarget(
  state: MonopolyDealState,
  phase: Extract<MonopolyDealState['turnPhase'], { type: 'awaitingBuildingTarget' }>,
): AIDecision {
  const card = state.ai.hand.find((c) => c.id === phase.cardId)
  if (!card) return { type: 'endTurn' }

  let bestColor: PropertyColor | null = null
  let bestScore = Number.NEGATIVE_INFINITY
  for (const group of state.ai.field) {
    if (!canPlaceBuilding(card, group)) continue
    const rent = calculateRent(state.ai, group.color, false)
    const bonus = card.name === 'House' ? 3 : card.name === 'Hotel' ? 4 : 0
    const score = rent + bonus * 2
    if (score > bestScore) {
      bestScore = score
      bestColor = group.color
    }
  }

  if (!bestColor) return { type: 'endTurn' }
  return { type: 'selectTarget', targetColor: bestColor }
}

function chooseBuildingRelocationTarget(
  state: MonopolyDealState,
  phase: Extract<MonopolyDealState['turnPhase'], { type: 'awaitingBuildingRelocation' }>,
): AIDecision {
  const targets = getBuildingRelocationTargets(state, 'ai', phase.buildingCardId, phase.sourceColor)
  if (targets.length === 0) return { type: 'endTurn' }

  // Pick the target set with the highest base rent (building boosts matter more on high-rent sets)
  let bestColor: PropertyColor = targets[0]
  let bestRent = Number.NEGATIVE_INFINITY
  for (const color of targets) {
    const rent = calculateRent(state.ai, color, false)
    if (rent > bestRent) {
      bestRent = rent
      bestColor = color
    }
  }

  return { type: 'selectTarget', targetColor: bestColor }
}

function chooseWildColor(state: MonopolyDealState, cardId: string): AIDecision {
  const card = state.ai.hand.find((c) => c.id === cardId)
  if (!card) return { type: 'endTurn' }

  const completeSets = new Set(getCompleteSetColors(state.ai))
  const aiMetrics = getFieldMetrics(state.ai)

  if (card.color && card.color2) {
    const candidates = [card.color, card.color2].filter((c) => !completeSets.has(c))
    if (candidates.length === 0) return { type: 'endTurn' }
    const color = candidates.length === 1
      ? candidates[0]
      : pickBestWildColor(aiMetrics, candidates[0], candidates[1])
    return { type: 'selectColor', targetColor: color }
  }

  // Rainbow wild: pick best non-complete color
  const available = (Object.keys(aiMetrics) as PropertyColor[]).filter((c) => !completeSets.has(c))
  if (available.length === 0) return { type: 'endTurn' }
  let best: PropertyColor = available[0]
  let bestScore = Number.NEGATIVE_INFINITY
  for (const c of available) {
    const score = colorNeedScore(aiMetrics, c)
    if (score > bestScore) { bestScore = score; best = c }
  }
  return { type: 'selectColor', targetColor: best }
}

function chooseRentColor(state: MonopolyDealState): AIDecision {
  const metrics = getFieldMetrics(state.ai)
  let bestColor: PropertyColor | null = null
  let bestRent = 0
  for (const color of PROPERTY_COLORS) {
    const rent = metrics[color].rent
    if (rent > bestRent) {
      bestRent = rent
      bestColor = color
    }
  }
  return { type: 'selectColor', targetColor: bestColor ?? 'brown' }
}

// ---------------------------------------------------------------------------
// Debt payment
// ---------------------------------------------------------------------------

function choosePayment(
  state: MonopolyDealState,
  phase: Extract<MonopolyDealState['turnPhase'], { type: 'awaitingPayment' }>,
  context: DecisionContext,
): AIDecision {
  const { amount, debtor } = phase.debt
  if (debtor !== 'ai') return { type: 'wait' }

  const ai = state.ai
  const payableCount = ai.bank.length + ai.field.reduce((n, g) => n + g.cards.length + g.buildings.length, 0)
  if (payableCount === 0) return { type: 'payDebt', paymentCardIds: [] }

  const metrics = getFieldMetrics(ai)
  const candidates: ScoredCard[] = []

  for (const bankCard of ai.bank) {
    candidates.push({ card: bankCard, score: bankCard.value * context.weights.debtPreservationWeight })
  }

  for (const group of ai.field) {
    const groupMetrics = metrics[group.color]
    for (const property of group.cards) {
      let score = 28 + property.value * 3
      if (groupMetrics.cardCount >= groupMetrics.needed) score += 55
      else if (groupMetrics.cardCount === groupMetrics.needed - 1) score += 38
      else if (groupMetrics.cardCount === groupMetrics.needed - 2) score += 18
      score += (groupMetrics.cardCount / groupMetrics.needed) * 10
      if (property.type === 'wild') score += 12
      candidates.push({ card: property, score: score * context.weights.debtPreservationWeight })
    }
    for (const building of group.buildings) {
      candidates.push({
        card: building,
        score: (95 + building.value * 4) * context.weights.debtPreservationWeight,
      })
    }
  }

  const paymentCardIds = chooseBestPaymentSubset(candidates, amount, (stats) => {
    aiTelemetry.paymentSearchCalls++
    aiTelemetry.paymentSearchNodesVisited += stats.nodesVisited
    if (stats.exactMatch) aiTelemetry.paymentExactMatches++
  })
  return { type: 'payDebt', paymentCardIds }
}

// ---------------------------------------------------------------------------
// Just Say No response
// ---------------------------------------------------------------------------

function chooseJSNResponse(
  state: MonopolyDealState,
  phase: Extract<MonopolyDealState['turnPhase'], { type: 'awaitingJSN' }>,
  context: DecisionContext,
): AIDecision {
  const { jsnChain } = phase
  if (jsnChain.currentDecider !== 'ai') return { type: 'wait' }

  const ai = state.ai
  const jsnCard = ai.hand.find((c) => c.name === 'Just Say No')
  if (!jsnCard) return { type: 'acceptAction' }

  const action = jsnChain.originalAction
  const actionName = action.actionCard.name
  const aiTotalValue = getPlayerTotalValue(ai)
  const opponentCompleteSets = countCompleteSets(getPlayerForAction(state, action.sourcePlayer))

  if (actionName === 'Deal Breaker') {
    return { type: 'useJSN', cardId: jsnCard.id }
  }

  if (action.targetColor) {
    const rent = calculateRent(
      getPlayerForAction(state, action.sourcePlayer),
      action.targetColor,
      !!action.doubleRentCardId,
    )
    const criticalRent = Math.max(
      context.weights.largeRentThreshold,
      Math.ceil(aiTotalValue * (0.5 + context.hidden.rentResponseProbability * 0.15)),
    )
    if (rent >= criticalRent) return { type: 'useJSN', cardId: jsnCard.id }
  }

  if (actionName === 'Sly Deal' && hasProtectedSet(ai)) {
    return { type: 'useJSN', cardId: jsnCard.id }
  }

  if (actionName === 'Forced Deal' && hasProtectedSet(ai)) {
    return { type: 'useJSN', cardId: jsnCard.id }
  }

  if (actionName === 'Debt Collector') {
    if (context.opponentModel.estimatedAggression >= 0.66 && ai.bank.length <= 4) {
      return { type: 'useJSN', cardId: jsnCard.id }
    }
    if (opponentCompleteSets >= 2 && ai.bank.length <= 3) {
      return { type: 'useJSN', cardId: jsnCard.id }
    }
    if (aiTotalValue <= 4 || ai.bank.length <= 1) {
      return { type: 'useJSN', cardId: jsnCard.id }
    }
    return { type: 'acceptAction' }
  }

  if (
    actionName === "It's My Birthday"
    && (aiTotalValue <= 3 || (context.opponentModel.estimatedAggression >= 0.82 && aiTotalValue <= 6))
  ) {
    return { type: 'useJSN', cardId: jsnCard.id }
  }

  return { type: 'acceptAction' }
}

function hasProtectedSet(ai: PlayerState): boolean {
  for (const group of ai.field) {
    if (group.cards.length >= SET_SIZE[group.color] - 1) return true
  }
  return false
}

function getPlayerForAction(state: MonopolyDealState, p: PlayerId): PlayerState {
  return p === 'player' ? state.player : state.ai
}

// ---------------------------------------------------------------------------
// Discard selection
// ---------------------------------------------------------------------------

function chooseDiscards(ai: PlayerState, mustDiscard: number): AIDecision {
  const metrics = getFieldMetrics(ai)
  const scored = ai.hand.map((card) => ({
    card,
    score: discardPriorityScore(ai, metrics, card),
  }))
  scored.sort((a, b) => a.score - b.score || a.card.value - b.card.value)
  return {
    type: 'discard',
    discardCardIds: scored.slice(0, mustDiscard).map((entry) => entry.card.id),
  }
}

function discardPriorityScore(ai: PlayerState, metrics: FieldMetrics, card: MonopolyCardData): number {
  switch (card.type) {
    case 'money':
      return card.value
    case 'building': {
      const usable = ai.field.some((g) => canPlaceBuilding(card, g))
      return usable ? 15 + card.value : 4 + card.value
    }
    case 'property':
    case 'wild': {
      const color = card.color ?? pickBestRainbowColor(metrics) ?? 'brown'
      const need = colorNeedScore(metrics, color)
      return need <= 0 ? 7 + card.value : 24 - need + card.value
    }
    case 'rent':
      return 12 + card.value
    case 'action': {
      if (card.name === 'Deal Breaker') return 40
      if (card.name === 'Just Say No') return 36
      if (card.name === 'Sly Deal' || card.name === 'Forced Deal') return 24
      if (card.name === 'Debt Collector') return 18
      return 10 + card.value
    }
  }
}

// ---------------------------------------------------------------------------
// Metrics and scoring helpers
// ---------------------------------------------------------------------------

function createEmptyFieldMetrics(): FieldMetrics {
  return {
    brown: { cardCount: 0, needed: SET_SIZE.brown, rent: 0 },
    lightBlue: { cardCount: 0, needed: SET_SIZE.lightBlue, rent: 0 },
    pink: { cardCount: 0, needed: SET_SIZE.pink, rent: 0 },
    orange: { cardCount: 0, needed: SET_SIZE.orange, rent: 0 },
    red: { cardCount: 0, needed: SET_SIZE.red, rent: 0 },
    yellow: { cardCount: 0, needed: SET_SIZE.yellow, rent: 0 },
    green: { cardCount: 0, needed: SET_SIZE.green, rent: 0 },
    darkBlue: { cardCount: 0, needed: SET_SIZE.darkBlue, rent: 0 },
    railroad: { cardCount: 0, needed: SET_SIZE.railroad, rent: 0 },
    utility: { cardCount: 0, needed: SET_SIZE.utility, rent: 0 },
  }
}

function getFieldMetrics(ps: PlayerState): FieldMetrics {
  const metrics = createEmptyFieldMetrics()
  for (const group of ps.field) {
    const nextCount = group.cards.length
    metrics[group.color] = {
      ...metrics[group.color],
      cardCount: nextCount,
      rent: nextCount > 0 ? calculateRent(ps, group.color, false) : 0,
    }
  }
  return metrics
}

function colorNeedScore(metrics: FieldMetrics, color: PropertyColor): number {
  const data = metrics[color]
  if (data.cardCount >= data.needed) return -1
  return ((data.cardCount + 1) / data.needed) * 10
}

function pickBestWildColor(
  metrics: FieldMetrics,
  c1: PropertyColor,
  c2: PropertyColor,
): PropertyColor {
  const score1 = colorNeedScore(metrics, c1)
  const score2 = colorNeedScore(metrics, c2)
  if (score1 !== score2) return score1 > score2 ? c1 : c2
  return metrics[c1].rent >= metrics[c2].rent ? c1 : c2
}

function pickBestRainbowColor(metrics: FieldMetrics): PropertyColor | null {
  let best: PropertyColor | null = null
  let bestScore = Number.NEGATIVE_INFINITY
  for (const color of PROPERTY_COLORS) {
    const score = colorNeedScore(metrics, color)
    if (score > bestScore) {
      bestScore = score
      best = color
    }
  }
  return best
}

function scoreStealTarget(
  aiMetrics: FieldMetrics,
  opponentMetrics: FieldMetrics,
  color: PropertyColor,
  cardValue: number,
  opponentCompleteSets: number = 0,
): number {
  const aiNeed = Math.max(0, colorNeedScore(aiMetrics, color))
  const opponentNeed = Math.max(0, colorNeedScore(opponentMetrics, color))
  const threatMultiplier = opponentCompleteSets >= 2 ? 1.5 : 1
  const blockBonus = (opponentNeed >= 9 ? 12 : opponentNeed >= 6 ? 6 : 0) * threatMultiplier
  const completeBonus = aiMetrics[color].cardCount + 1 === aiMetrics[color].needed ? 16 : 0
  return aiNeed * 2 + blockBonus + completeBonus + cardValue
}

function scoreGiveAwayCost(
  aiMetrics: FieldMetrics,
  color: PropertyColor,
  card: MonopolyCardData,
): number {
  const metrics = aiMetrics[color]
  if (metrics.cardCount <= 1) return 2 + card.value
  if (metrics.cardCount === metrics.needed - 1) return 30 + card.value
  const progressPenalty = (metrics.cardCount / metrics.needed) * 12
  const wildPenalty = card.type === 'wild' ? 4 : 0
  return 10 + progressPenalty + wildPenalty + card.value
}

function getOpponentThreatScore(
  opponentMetrics: FieldMetrics,
  opponentCompleteSets: number,
): number {
  let score = opponentCompleteSets * 22
  for (const color of PROPERTY_COLORS) {
    const metrics = opponentMetrics[color]
    if (metrics.cardCount <= 0) continue
    if (metrics.cardCount >= metrics.needed) continue
    if (metrics.cardCount === metrics.needed - 1) score += 14
    else if (metrics.cardCount === metrics.needed - 2) score += 7
  }
  return score
}

function getEffectiveMinPlayScore(
  opponentThreat: number,
  handSize: number,
  context: DecisionContext,
): number {
  if (handSize <= 2) return 0
  if (opponentThreat >= 35) return 0
  if (opponentThreat >= 20) return 3
  return context.weights.minPlayScore
}

function getHiddenInfoRiskPenalty(play: ScoredPlay, context: DecisionContext): number {
  if (!play.meta?.hiddenRiskSensitive) return 0

  const actionPenalty = play.score * context.hidden.jsnProbability * 0.32 * context.weights.hiddenRiskWeight
  const rentPenalty = (play.meta.expectedRent ?? 0) * context.hidden.rentResponseProbability * 2.4

  return actionPenalty + rentPenalty
}

interface LookaheadSnapshot {
  aiMetrics: FieldMetrics
  opponentMetrics: FieldMetrics
  aiCompleteSets: number
  opponentCompleteSets: number
  opponentTotalValue: number
}

interface LookaheadBudget {
  remaining: number
  nodesVisited: number
  exhausted: boolean
}

interface LookaheadChoice {
  score: number
  card?: MonopolyCardData
  playCost: number
}

interface LookaheadCacheEntry {
  score: number
  cardId?: string
  playCost: number
}

type LookaheadCache = Map<string, LookaheadCacheEntry>

function getHighImpactTwoPlyBonus(
  state: MonopolyDealState,
  play: ScoredPlay,
  aiMetrics: FieldMetrics,
  opponentMetrics: FieldMetrics,
  playsRemaining: number,
  context: DecisionContext,
  cache: LookaheadCache,
): number {
  const cardId = play.meta?.sourceCardId ?? play.decision.cardId
  if (!cardId) return 0
  const playCost = play.decision.type === 'playRent' && play.decision.doubleRentCardId ? 2 : 1
  const remainingPlays = playsRemaining - playCost
  if (remainingPlays <= 0) return 0

  aiTelemetry.lookaheadEvaluations++
  const budget: LookaheadBudget = {
    remaining: isNearLethalLookaheadWindow(state, play, context)
      ? LOOKAHEAD_NODE_BUDGET_NEAR_LETHAL
      : LOOKAHEAD_NODE_BUDGET_BASE,
    nodesVisited: 0,
    exhausted: false,
  }

  const snapshot = simulateHighImpactSnapshot(state, play, aiMetrics, opponentMetrics, context)
  const excludedCardIds = new Set<string>([cardId])
  if (play.decision.doubleRentCardId) excludedCardIds.add(play.decision.doubleRentCardId)

  const followUp = estimateBestFollowUp(state, snapshot, excludedCardIds, remainingPlays, context, budget, cache)
  let bonus = followUp.score * context.weights.lookaheadWeight

  const nextRemainingPlays = remainingPlays - followUp.playCost
  if (
    shouldRunThirdPly(snapshot, play, followUp, nextRemainingPlays, context)
    && followUp.card
  ) {
    aiTelemetry.lookaheadDepth3Evaluations++
    const thirdPlyExcluded = new Set(excludedCardIds)
    thirdPlyExcluded.add(followUp.card.id)
    const followUpSnapshot = simulateFollowUpSnapshot(snapshot, followUp.card, context)
    const thirdPly = estimateBestFollowUp(
      state,
      followUpSnapshot,
      thirdPlyExcluded,
      nextRemainingPlays,
      context,
      budget,
      cache,
    )
    bonus += thirdPly.score * context.weights.lookaheadWeight * 0.42
  }

  aiTelemetry.lookaheadNodesVisited += budget.nodesVisited
  if (budget.exhausted) aiTelemetry.lookaheadBudgetHits++
  return bonus
}

function simulateHighImpactSnapshot(
  state: MonopolyDealState,
  play: ScoredPlay,
  aiMetrics: FieldMetrics,
  opponentMetrics: FieldMetrics,
  context: DecisionContext,
): LookaheadSnapshot {
  const snapshot: LookaheadSnapshot = {
    aiMetrics: cloneFieldMetrics(aiMetrics),
    opponentMetrics: cloneFieldMetrics(opponentMetrics),
    aiCompleteSets: countCompleteSets(state.ai),
    opponentCompleteSets: countCompleteSets(state.player),
    opponentTotalValue: getPlayerTotalValue(state.player),
  }

  if (play.decision.type === 'playRent') {
    const transfer = (play.meta?.expectedRent ?? 0) * (1 - context.hidden.rentResponseProbability * 0.5)
    snapshot.opponentTotalValue = Math.max(0, snapshot.opponentTotalValue - transfer)
    return snapshot
  }

  if (play.decision.type !== 'playAction') return snapshot
  const cardName = play.meta?.sourceCardName
  if (!cardName) return snapshot

  if (cardName === 'Deal Breaker') {
    const targetColor = pickBestDealBreakerColor(snapshot.opponentMetrics)
    if (!targetColor) return snapshot

    const aiWasComplete = isColorComplete(snapshot.aiMetrics[targetColor], targetColor)
    const opponentWasComplete = isColorComplete(snapshot.opponentMetrics[targetColor], targetColor)

    setMetricCardCount(snapshot.aiMetrics, targetColor, Math.max(snapshot.aiMetrics[targetColor].cardCount, SET_SIZE[targetColor]))
    setMetricCardCount(snapshot.opponentMetrics, targetColor, 0)

    if (!aiWasComplete && isColorComplete(snapshot.aiMetrics[targetColor], targetColor)) snapshot.aiCompleteSets++
    if (opponentWasComplete) snapshot.opponentCompleteSets = Math.max(0, snapshot.opponentCompleteSets - 1)
    return snapshot
  }

  if (cardName === 'Sly Deal') {
    const targets = getStealableProperties(state.player)
    if (targets.length === 0) return snapshot

    const target = chooseBestStealTargetForSimulation(targets, snapshot.aiMetrics, snapshot.opponentMetrics, snapshot.opponentCompleteSets)
    setMetricCardCount(snapshot.aiMetrics, target.groupColor, snapshot.aiMetrics[target.groupColor].cardCount + 1)
    setMetricCardCount(snapshot.opponentMetrics, target.groupColor, snapshot.opponentMetrics[target.groupColor].cardCount - 1)
    snapshot.opponentTotalValue = Math.max(0, snapshot.opponentTotalValue - target.card.value)
    return snapshot
  }

  if (cardName === 'Forced Deal') {
    const targets = getStealableProperties(state.player)
    const myStealable = getStealableProperties(state.ai)
    if (targets.length === 0 || myStealable.length === 0) return snapshot

    const take = chooseBestStealTargetForSimulation(targets, snapshot.aiMetrics, snapshot.opponentMetrics, snapshot.opponentCompleteSets)
    const give = chooseWorstGiveTargetForSimulation(myStealable, snapshot.aiMetrics)

    setMetricCardCount(snapshot.aiMetrics, take.groupColor, snapshot.aiMetrics[take.groupColor].cardCount + 1)
    setMetricCardCount(snapshot.opponentMetrics, take.groupColor, snapshot.opponentMetrics[take.groupColor].cardCount - 1)
    setMetricCardCount(snapshot.aiMetrics, give.groupColor, snapshot.aiMetrics[give.groupColor].cardCount - 1)
    setMetricCardCount(snapshot.opponentMetrics, give.groupColor, snapshot.opponentMetrics[give.groupColor].cardCount + 1)

    snapshot.opponentTotalValue = Math.max(0, snapshot.opponentTotalValue - Math.max(0, take.card.value - give.card.value))
  }

  return snapshot
}

function isNearLethalLookaheadWindow(
  state: MonopolyDealState,
  play: ScoredPlay,
  context: DecisionContext,
): boolean {
  const aiSets = countCompleteSets(state.ai)
  const opponentSets = countCompleteSets(state.player)
  const expectedRent = play.meta?.expectedRent ?? 0

  return (
    aiSets >= 2
    || opponentSets >= 2
    || expectedRent >= context.weights.largeRentThreshold + 1
    || context.opponentModel.estimatedAggression >= 0.82
  )
}

function shouldRunThirdPly(
  snapshot: LookaheadSnapshot,
  play: ScoredPlay,
  followUp: LookaheadChoice,
  nextRemainingPlays: number,
  context: DecisionContext,
): boolean {
  if (nextRemainingPlays <= 0) return false
  if (!followUp.card || followUp.score <= 0) return false

  return (
    snapshot.aiCompleteSets >= 2
    || snapshot.opponentCompleteSets >= 2
    || (play.meta?.expectedRent ?? 0) >= context.weights.largeRentThreshold + 1
    || snapshot.opponentTotalValue <= 8
    || context.opponentModel.estimatedAggression >= 0.82
  )
}

function simulateFollowUpSnapshot(
  snapshot: LookaheadSnapshot,
  card: MonopolyCardData,
  context: DecisionContext,
): LookaheadSnapshot {
  const next: LookaheadSnapshot = {
    aiMetrics: cloneFieldMetrics(snapshot.aiMetrics),
    opponentMetrics: cloneFieldMetrics(snapshot.opponentMetrics),
    aiCompleteSets: snapshot.aiCompleteSets,
    opponentCompleteSets: snapshot.opponentCompleteSets,
    opponentTotalValue: snapshot.opponentTotalValue,
  }

  switch (card.type) {
    case 'property':
      if (card.color) incrementMetricForColor(next, card.color, 'ai')
      break
    case 'wild': {
      const color = card.color && card.color2
        ? pickBestWildColor(next.aiMetrics, card.color, card.color2)
        : pickBestRainbowColor(next.aiMetrics)
      if (color) incrementMetricForColor(next, color, 'ai')
      break
    }
    case 'building': {
      const targetColor = pickBestBuildingColorForSimulation(next.aiMetrics)
      if (!targetColor) break
      const bonus = card.name === 'House' ? 3 : card.name === 'Hotel' ? 4 : 0
      if (bonus > 0) {
        next.aiMetrics[targetColor] = {
          ...next.aiMetrics[targetColor],
          rent: next.aiMetrics[targetColor].rent + bonus,
        }
      }
      break
    }
    case 'rent': {
      const transfer = estimateRentTransferByMetrics(next, card, context)
      next.opponentTotalValue = Math.max(0, next.opponentTotalValue - transfer)
      break
    }
    case 'action': {
      if (card.name === 'Deal Breaker') {
        const targetColor = pickBestDealBreakerColor(next.opponentMetrics)
        if (!targetColor) break
        setMetricCardCount(next.aiMetrics, targetColor, Math.max(next.aiMetrics[targetColor].cardCount, SET_SIZE[targetColor]))
        setMetricCardCount(next.opponentMetrics, targetColor, 0)
        next.aiCompleteSets = countCompleteSetsByMetrics(next.aiMetrics)
        next.opponentCompleteSets = countCompleteSetsByMetrics(next.opponentMetrics)
      } else if (card.name === 'Sly Deal') {
        const targetColor = pickBestStealableColorByMetrics(next.aiMetrics, next.opponentMetrics, next.opponentCompleteSets)
        if (!targetColor) break
        incrementMetricForColor(next, targetColor, 'ai')
        incrementMetricForColor(next, targetColor, 'opponent', -1)
      } else if (card.name === 'Forced Deal') {
        const takeColor = pickBestStealableColorByMetrics(next.aiMetrics, next.opponentMetrics, next.opponentCompleteSets)
        const giveColor = pickWorstGiveColorByMetrics(next.aiMetrics)
        if (!takeColor || !giveColor) break
        incrementMetricForColor(next, takeColor, 'ai')
        incrementMetricForColor(next, takeColor, 'opponent', -1)
        incrementMetricForColor(next, giveColor, 'ai', -1)
        incrementMetricForColor(next, giveColor, 'opponent')
      } else if (card.name === 'Debt Collector') {
        next.opponentTotalValue = Math.max(0, next.opponentTotalValue - 5)
      } else if (card.name === "It's My Birthday") {
        next.opponentTotalValue = Math.max(0, next.opponentTotalValue - 2)
      }
      break
    }
  }

  return next
}

function incrementMetricForColor(
  snapshot: LookaheadSnapshot,
  color: PropertyColor,
  side: 'ai' | 'opponent',
  delta: number = 1,
): void {
  const metrics = side === 'ai' ? snapshot.aiMetrics : snapshot.opponentMetrics
  setMetricCardCount(metrics, color, metrics[color].cardCount + delta)
  snapshot.aiCompleteSets = countCompleteSetsByMetrics(snapshot.aiMetrics)
  snapshot.opponentCompleteSets = countCompleteSetsByMetrics(snapshot.opponentMetrics)
}

function countCompleteSetsByMetrics(metrics: FieldMetrics): number {
  let total = 0
  for (const color of PROPERTY_COLORS) {
    if (metrics[color].cardCount >= metrics[color].needed) total++
  }
  return total
}

function pickBestBuildingColorForSimulation(metrics: FieldMetrics): PropertyColor | null {
  let bestColor: PropertyColor | null = null
  let bestScore = Number.NEGATIVE_INFINITY

  for (const color of PROPERTY_COLORS) {
    if (color === 'railroad' || color === 'utility') continue
    const group = metrics[color]
    if (group.cardCount < group.needed) continue
    if (group.rent > bestScore) {
      bestScore = group.rent
      bestColor = color
    }
  }

  return bestColor
}

function estimateRentTransferByMetrics(
  snapshot: LookaheadSnapshot,
  card: MonopolyCardData,
  context: DecisionContext,
): number {
  const candidateColors: PropertyColor[] = []
  if (card.color) candidateColors.push(card.color)
  if (card.color2) candidateColors.push(card.color2)
  if (candidateColors.length === 0) {
    for (const color of PROPERTY_COLORS) {
      if (snapshot.aiMetrics[color].cardCount > 0) candidateColors.push(color)
    }
  }

  let bestRent = 0
  for (const color of new Set(candidateColors)) {
    const rent = Math.min(snapshot.aiMetrics[color].rent, snapshot.opponentTotalValue)
    if (rent > bestRent) bestRent = rent
  }
  if (bestRent <= 0) return 0

  const expectedRent = bestRent * (1 - context.hidden.jsnProbability * 0.6 * context.weights.hiddenRiskWeight)
  return expectedRent * (1 - context.hidden.rentResponseProbability * 0.45)
}

function pickBestStealableColorByMetrics(
  aiMetrics: FieldMetrics,
  opponentMetrics: FieldMetrics,
  opponentCompleteSets: number,
): PropertyColor | null {
  let bestColor: PropertyColor | null = null
  let bestScore = Number.NEGATIVE_INFINITY
  for (const color of PROPERTY_COLORS) {
    const opponentGroup = opponentMetrics[color]
    if (opponentGroup.cardCount <= 0 || opponentGroup.cardCount >= opponentGroup.needed) continue
    const simulatedCardValue = Math.max(1, Math.ceil(opponentGroup.rent / 2))
    const score = scoreStealTarget(aiMetrics, opponentMetrics, color, simulatedCardValue, opponentCompleteSets)
    if (score > bestScore) {
      bestScore = score
      bestColor = color
    }
  }
  return bestColor
}

function pickWorstGiveColorByMetrics(aiMetrics: FieldMetrics): PropertyColor | null {
  let worstColor: PropertyColor | null = null
  let lowestCost = Number.POSITIVE_INFINITY
  for (const color of PROPERTY_COLORS) {
    const group = aiMetrics[color]
    if (group.cardCount <= 0 || group.cardCount >= group.needed) continue
    const syntheticCard: MonopolyCardData = {
      id: `sim-${color}`,
      name: 'Simulated Property',
      type: 'property',
      value: Math.max(1, Math.ceil(group.rent / 2)),
      color,
    }
    const cost = scoreGiveAwayCost(aiMetrics, color, syntheticCard)
    if (cost < lowestCost) {
      lowestCost = cost
      worstColor = color
    }
  }
  return worstColor
}

function estimateBestFollowUp(
  state: MonopolyDealState,
  snapshot: LookaheadSnapshot,
  excludedCardIds: Set<string>,
  remainingPlays: number,
  context: DecisionContext,
  budget: LookaheadBudget,
  cache: LookaheadCache,
): LookaheadChoice {
  const remainingHand = state.ai.hand.filter((card) => !excludedCardIds.has(card.id))
  if (remainingHand.length === 0 || remainingPlays <= 0) return { score: 0, playCost: 0 }

  const cacheKey = buildLookaheadCacheKey(state.ai.hand, snapshot, excludedCardIds, remainingPlays)
  const cached = cache.get(cacheKey)
  if (cached) {
    aiTelemetry.lookaheadCacheHits++
    return {
      score: cached.score,
      card: cached.cardId ? remainingHand.find((c) => c.id === cached.cardId) : undefined,
      playCost: cached.playCost,
    }
  }
  aiTelemetry.lookaheadCacheMisses++

  const hasDoubleRent = remainingHand.some((card) => card.name === 'Double Rent')
  let bestScore = 0
  let bestCard: MonopolyCardData | undefined
  let bestPlayCost = 0

  for (const card of remainingHand) {
    if (card.name === 'Double Rent') continue
    if (!tryConsumeLookaheadNode(budget)) break

    let score = 0
    let playCost = 1
    switch (card.type) {
      case 'property':
        score = scorePropertyPlay(snapshot.aiMetrics, card, card.color, snapshot.aiCompleteSets)
        break
      case 'wild':
        if (card.color && card.color2) {
          const color = pickBestWildColor(snapshot.aiMetrics, card.color, card.color2)
          score = scorePropertyPlay(snapshot.aiMetrics, card, color, snapshot.aiCompleteSets) + 3
        } else {
          const color = pickBestRainbowColor(snapshot.aiMetrics)
          if (color) score = scorePropertyPlay(snapshot.aiMetrics, card, color, snapshot.aiCompleteSets) + 6
        }
        break
      case 'money':
        score = 18 + card.value
        break
      case 'building':
        score = estimateBuildingFollowUpScore(snapshot.aiMetrics, card)
        break
      case 'rent': {
        const rentFollowUp = estimateRentFollowUpScore(snapshot, card, remainingPlays, hasDoubleRent, context)
        score = rentFollowUp.score
        playCost = rentFollowUp.playCost
        break
      }
      case 'action':
        score = estimateActionFollowUpScore(snapshot, card)
        break
    }

    if (playCost > remainingPlays) continue
    if (score > bestScore) {
      bestScore = score
      bestCard = card
      bestPlayCost = playCost
    }
  }

  const result: LookaheadChoice = {
    score: bestScore,
    card: bestCard,
    playCost: bestPlayCost,
  }
  cache.set(cacheKey, {
    score: result.score,
    cardId: result.card?.id,
    playCost: result.playCost,
  })
  return result
}

function buildLookaheadCacheKey(
  hand: MonopolyCardData[],
  snapshot: LookaheadSnapshot,
  excludedCardIds: Set<string>,
  remainingPlays: number,
): string {
  const cardById = new Map(hand.map((card) => [card.id, card]))
  const excluded = [...excludedCardIds]
    .map((id) => cardFingerprint(cardById.get(id), id))
    .sort()
    .join(',')
  return [
    remainingPlays,
    snapshot.aiCompleteSets,
    snapshot.opponentCompleteSets,
    Math.round(snapshot.opponentTotalValue * 10),
    serializeMetricsForCache(snapshot.aiMetrics),
    serializeMetricsForCache(snapshot.opponentMetrics),
    excluded,
  ].join('|')
}

function cardFingerprint(card: MonopolyCardData | undefined, fallbackId: string): string {
  if (!card) return fallbackId
  return [
    card.type,
    card.name,
    card.value,
    card.color ?? '-',
    card.color2 ?? '-',
  ].join(':')
}

function serializeMetricsForCache(metrics: FieldMetrics): string {
  return PROPERTY_COLORS
    .map((color) => `${metrics[color].cardCount}:${Math.round(metrics[color].rent * 10)}`)
    .join(';')
}

function tryConsumeLookaheadNode(budget: LookaheadBudget): boolean {
  if (budget.remaining <= 0) {
    budget.exhausted = true
    return false
  }
  budget.remaining--
  budget.nodesVisited++
  return true
}

function estimateBuildingFollowUpScore(metrics: FieldMetrics, card: MonopolyCardData): number {
  let best = 0
  for (const color of PROPERTY_COLORS) {
    if (color === 'railroad' || color === 'utility') continue
    const data = metrics[color]
    if (data.cardCount < data.needed) continue
    const bonus = card.name === 'House' ? 3 : card.name === 'Hotel' ? 4 : 0
    const score = 46 + data.rent * 2 + bonus * 3
    if (score > best) best = score
  }
  return best
}

function estimateRentFollowUpScore(
  snapshot: LookaheadSnapshot,
  card: MonopolyCardData,
  remainingPlays: number,
  hasDoubleRent: boolean,
  context: DecisionContext,
): { score: number; playCost: number } {
  const colors: PropertyColor[] = []
  if (card.color) colors.push(card.color)
  if (card.color2) colors.push(card.color2)
  if (colors.length === 0) {
    for (const color of PROPERTY_COLORS) {
      if (snapshot.aiMetrics[color].cardCount > 0) colors.push(color)
    }
  }

  let bestRent = 0
  for (const color of new Set(colors)) {
    const rent = Math.min(snapshot.aiMetrics[color].rent, snapshot.opponentTotalValue)
    bestRent = Math.max(bestRent, rent)
  }
  if (bestRent <= 0) return { score: 0, playCost: 0 }

  const expectedRent = bestRent * (1 - context.hidden.jsnProbability * 0.6 * context.weights.hiddenRiskWeight)
  if (hasDoubleRent && remainingPlays >= 2 && expectedRent >= 2) {
    return {
      score: 84 + expectedRent * 8,
      playCost: 2,
    }
  }
  return {
    score: expectedRent >= 4 ? 74 : 44 + expectedRent * 6,
    playCost: 1,
  }
}

function estimateActionFollowUpScore(snapshot: LookaheadSnapshot, card: MonopolyCardData): number {
  switch (card.name) {
    case 'Deal Breaker':
      return snapshot.opponentCompleteSets > 0 ? 95 : 0
    case 'Sly Deal':
      return hasStealableByMetrics(snapshot.opponentMetrics) ? 62 : 0
    case 'Forced Deal':
      return hasStealableByMetrics(snapshot.opponentMetrics) && hasStealableByMetrics(snapshot.aiMetrics) ? 56 : 0
    case 'Debt Collector':
      return snapshot.opponentTotalValue > 0 ? 38 : 0
    case "It's My Birthday":
      return snapshot.opponentTotalValue > 0 ? 30 : 0
    case 'Pass Go':
      return 40
    default:
      return 12 + card.value
  }
}

function hasStealableByMetrics(metrics: FieldMetrics): boolean {
  for (const color of PROPERTY_COLORS) {
    const data = metrics[color]
    if (data.cardCount > 0 && data.cardCount < data.needed) return true
  }
  return false
}

function chooseBestStealTargetForSimulation(
  targets: Array<{ card: MonopolyCardData; groupColor: PropertyColor }>,
  aiMetrics: FieldMetrics,
  opponentMetrics: FieldMetrics,
  opponentCompleteSets: number,
): { card: MonopolyCardData; groupColor: PropertyColor } {
  let best = targets[0]
  let bestScore = Number.NEGATIVE_INFINITY
  for (const target of targets) {
    const score = scoreStealTarget(aiMetrics, opponentMetrics, target.groupColor, target.card.value, opponentCompleteSets)
    if (score > bestScore) {
      bestScore = score
      best = target
    }
  }
  return best
}

function chooseWorstGiveTargetForSimulation(
  candidates: Array<{ card: MonopolyCardData; groupColor: PropertyColor }>,
  aiMetrics: FieldMetrics,
): { card: MonopolyCardData; groupColor: PropertyColor } {
  let lowest = candidates[0]
  let lowestCost = scoreGiveAwayCost(aiMetrics, lowest.groupColor, lowest.card)
  for (const candidate of candidates) {
    const cost = scoreGiveAwayCost(aiMetrics, candidate.groupColor, candidate.card)
    if (cost < lowestCost) {
      lowest = candidate
      lowestCost = cost
    }
  }
  return lowest
}

function cloneFieldMetrics(metrics: FieldMetrics): FieldMetrics {
  return {
    brown: { ...metrics.brown },
    lightBlue: { ...metrics.lightBlue },
    pink: { ...metrics.pink },
    orange: { ...metrics.orange },
    red: { ...metrics.red },
    yellow: { ...metrics.yellow },
    green: { ...metrics.green },
    darkBlue: { ...metrics.darkBlue },
    railroad: { ...metrics.railroad },
    utility: { ...metrics.utility },
  }
}

function setMetricCardCount(metrics: FieldMetrics, color: PropertyColor, nextCountRaw: number): void {
  const nextCount = Math.max(0, nextCountRaw)
  const prev = metrics[color]
  const prevBaseRent = getBaseRentForCount(color, prev.cardCount)
  const buildingBonus = Math.max(0, prev.rent - prevBaseRent)
  metrics[color] = {
    ...prev,
    cardCount: nextCount,
    rent: nextCount > 0 ? getBaseRentForCount(color, nextCount) + buildingBonus : 0,
  }
}

function getBaseRentForCount(color: PropertyColor, countRaw: number): number {
  if (countRaw <= 0) return 0
  const rents = COLOR_RENT[color]
  const index = Math.min(countRaw, rents.length) - 1
  return rents[index] ?? 0
}

function isColorComplete(metric: ColorMetrics, color: PropertyColor): boolean {
  return metric.cardCount >= SET_SIZE[color]
}

function pickBestDealBreakerColor(opponentMetrics: FieldMetrics): PropertyColor | null {
  let bestColor: PropertyColor | null = null
  let bestRent = Number.NEGATIVE_INFINITY
  for (const color of PROPERTY_COLORS) {
    const data = opponentMetrics[color]
    if (data.cardCount < data.needed) continue
    if (data.rent > bestRent) {
      bestRent = data.rent
      bestColor = color
    }
  }
  return bestColor
}

function recordLookaheadTelemetry(lookaheadBonus: number, riskPenalty: number): void {
  aiTelemetry.lookaheadBonusTotal += lookaheadBonus
  aiTelemetry.hiddenRiskPenaltyTotal += riskPenalty
}

function recordDecisionTelemetry(
  state: MonopolyDealState,
  profile: ResolvedProfile,
  decision: AIDecision,
  durationMs: number,
): void {
  aiTelemetry.totalDecisions++
  aiTelemetry.byPhase[state.turnPhase.type] = (aiTelemetry.byPhase[state.turnPhase.type] ?? 0) + 1
  aiTelemetry.byProfile[profile]++
  aiTelemetry.totalDecisionMs += durationMs
  aiTelemetry.maxDecisionMs = Math.max(aiTelemetry.maxDecisionMs, durationMs)
  if (durationMs >= SLOW_DECISION_THRESHOLD_MS) aiTelemetry.slowDecisions++
  aiTelemetry.recent.push({
    turn: state.turnNumber,
    phase: state.turnPhase.type,
    profile,
    decisionType: decision.type,
  })
  if (aiTelemetry.recent.length > 40) aiTelemetry.recent.shift()
}

function chooseBestPaymentSubset(
  candidates: ScoredCard[],
  amount: number,
  onStats?: (stats: { nodesVisited: number; exactMatch: boolean }) => void,
): string[] {
  if (amount <= 0) {
    onStats?.({ nodesVisited: 1, exactMatch: true })
    return []
  }

  const totalValue = candidates.reduce((sum, candidate) => sum + candidate.card.value, 0)
  if (totalValue <= amount) {
    onStats?.({ nodesVisited: 1, exactMatch: totalValue === amount })
    return candidates.map((candidate) => candidate.card.id)
  }

  const sorted = [...candidates].sort((a, b) => a.score - b.score || b.card.value - a.card.value)
  interface PaymentDPState {
    ids: string[]
    cost: number
    count: number
  }

  const bySum: Array<PaymentDPState | null> = new Array(totalValue + 1).fill(null)
  bySum[0] = { ids: [], cost: 0, count: 0 }
  let nodesVisited = 0

  function isBetterForSameSum(candidate: PaymentDPState, current: PaymentDPState | null): boolean {
    if (!current) return true
    if (candidate.cost !== current.cost) return candidate.cost < current.cost
    if (candidate.count !== current.count) return candidate.count < current.count
    return candidate.ids.join('|') < current.ids.join('|')
  }

  for (const candidate of sorted) {
    for (let sum = totalValue - candidate.card.value; sum >= 0; sum--) {
      const prev = bySum[sum]
      if (!prev) continue
      nodesVisited++
      const nextSum = sum + candidate.card.value
      const nextState: PaymentDPState = {
        ids: [...prev.ids, candidate.card.id],
        cost: prev.cost + candidate.score,
        count: prev.count + 1,
      }
      if (isBetterForSameSum(nextState, bySum[nextSum])) {
        bySum[nextSum] = nextState
      }
    }
  }

  let best: PaymentDPState | null = null
  let bestOverpay = Number.POSITIVE_INFINITY

  for (let sum = amount; sum <= totalValue; sum++) {
    const state = bySum[sum]
    if (!state) continue

    const overpay = sum - amount
    if (
      !best
      || overpay < bestOverpay
      || (overpay === bestOverpay && state.cost < best.cost)
      || (overpay === bestOverpay && state.cost === best.cost && state.count < best.count)
    ) {
      best = state
      bestOverpay = overpay
      if (bestOverpay === 0 && best.cost === 0) break
    }
  }

  onStats?.({ nodesVisited, exactMatch: bestOverpay === 0 })
  return best?.ids ?? []
}
