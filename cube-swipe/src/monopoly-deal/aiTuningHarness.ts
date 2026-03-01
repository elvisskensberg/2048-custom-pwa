import type { PropertyColor } from './cardData'
import {
  getAIDecision,
  getAIDifficultyMode,
  resetAITelemetry,
  setAIDifficultyMode,
  type AIDecision,
} from './aiStrategy'
import {
  AI_BENCHMARK_SCENARIO_IDS,
  DEFAULT_BENCHMARK_PROFILES,
  runAIProfileBenchmark,
  type BenchmarkProfile,
  type ProfileBenchmarkResult,
} from './aiProfileBenchmark'
import type {
  GameLogEntry,
  JSNChainInfo,
  MonopolyDealState,
  PendingAction,
  PlayerId,
  TurnPhase,
} from './gameEngine'
import {
  bankCard,
  calculateRent,
  canPlaceBuilding,
  completeDealBreaker,
  completeForcedDeal,
  completeRentColor,
  completeSlyDeal,
  confirmPayment,
  countCompleteSets,
  createInitialState,
  discardCards,
  endPlayPhase,
  executeDraw,
  getBuildingRelocationTargets,
  getCompleteSetColors,
  getPayableCards,
  getPlayerTotalValue,
  getStealableProperties,
  playBirthday,
  playBuilding,
  playDealBreaker,
  playDebtCollector,
  playForcedDeal,
  playJustSayNo,
  playPassGo,
  playPropertyToField,
  playRentCard,
  playSlyDeal,
  relocateBuildingOnField,
  relocateWildOnField,
  togglePaymentCard,
  acceptJSNOutcome,
} from './gameEngine'

export interface AIProfileEloLoopOptions {
  rounds?: number
  seed?: number
  profiles?: BenchmarkProfile[]
  kFactor?: number
  initialRating?: number
  maxActionStepsPerGame?: number
}

export interface AIProfileRecord {
  wins: number
  losses: number
  draws: number
}

export interface AIProfileEloLoopResult {
  ratings: Record<BenchmarkProfile, number>
  rounds: number
  seed: number
  matchesPlayed: number
  gamesPlayed: number
  benchmark: Record<string, ProfileBenchmarkResult>
  records: Record<BenchmarkProfile, AIProfileRecord>
}

export interface AIThresholdCheck {
  name: string
  passed: boolean
  actual: number
  threshold: number
  comparator: '>=' | '<='
}

export interface AIThresholdEvaluation {
  passed: boolean
  checks: AIThresholdCheck[]
}

export interface EloThresholdConfig {
  minAggressiveRating: number
  minAdaptiveRating: number
  minAdaptiveVsDefensiveDelta: number
  minAdaptiveProactiveDecisions: number
  maxDefensiveEndTurnRate: number
  minAdaptiveSelfPlayScore: number
}

export interface AITrendSnapshot {
  generatedAt: string
  seed: number
  rounds: number
  ratings: Record<BenchmarkProfile, number>
  ratingSpread: number
  matchesPlayed: number
  gamesPlayed: number
  selfPlayScoreByProfile: Record<BenchmarkProfile, number>
  checks: AIThresholdCheck[]
  passed: boolean
}

const ALL_PROFILES: BenchmarkProfile[] = ['aggressive', 'balanced', 'defensive', 'adaptive']
const DEFAULT_ELO_K_FACTOR = 16
const DEFAULT_ELO_ROUNDS = 6
const DEFAULT_ELO_INITIAL_RATING = 1200
const DEFAULT_MAX_ACTION_STEPS_PER_GAME = 280

export const DEFAULT_ELO_THRESHOLD_CONFIG: EloThresholdConfig = {
  minAggressiveRating: 1188,
  minAdaptiveRating: 1225,
  minAdaptiveVsDefensiveDelta: 25,
  minAdaptiveProactiveDecisions: 3,
  maxDefensiveEndTurnRate: 0.67,
  minAdaptiveSelfPlayScore: 0.55,
}

function createSeededRandom(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0
    return value / 0x100000000
  }
}

function withSeededRandom<T>(seed: number, run: () => T): T {
  const random = createSeededRandom(seed)
  const priorRandom = Math.random
  Math.random = random
  try {
    return run()
  } finally {
    Math.random = priorRandom
  }
}

function shuffle<T>(values: readonly T[], random: () => number): T[] {
  const copy = [...values]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const temp = copy[i]
    copy[i] = copy[j]
    copy[j] = temp
  }
  return copy
}

function swapPlayerId(playerId: PlayerId): PlayerId {
  return playerId === 'player' ? 'ai' : 'player'
}

function swapPendingAction(action: PendingAction): PendingAction {
  return {
    ...action,
    sourcePlayer: swapPlayerId(action.sourcePlayer),
  }
}

function swapJSNChain(chain: JSNChainInfo): JSNChainInfo {
  return {
    ...chain,
    originalAction: swapPendingAction(chain.originalAction),
    chain: chain.chain.map((entry) => ({
      ...entry,
      player: swapPlayerId(entry.player),
    })),
    currentDecider: swapPlayerId(chain.currentDecider),
  }
}

function swapTurnPhasePerspective(phase: TurnPhase): TurnPhase {
  switch (phase.type) {
    case 'awaitingPayment':
      return {
        ...phase,
        debt: {
          ...phase.debt,
          creditor: swapPlayerId(phase.debt.creditor),
          debtor: swapPlayerId(phase.debt.debtor),
        },
      }
    case 'awaitingJSN':
      return {
        ...phase,
        jsnChain: swapJSNChain(phase.jsnChain),
      }
    case 'gameOver':
      return {
        ...phase,
        winner: swapPlayerId(phase.winner),
      }
    default:
      return phase
  }
}

function swapLogPerspective(log: GameLogEntry[]): GameLogEntry[] {
  return log.map((entry) => ({
    ...entry,
    player: swapPlayerId(entry.player),
  }))
}

function swapStatePerspective(state: MonopolyDealState): MonopolyDealState {
  return {
    ...state,
    player: state.ai,
    ai: state.player,
    currentTurn: swapPlayerId(state.currentTurn),
    turnPhase: swapTurnPhasePerspective(state.turnPhase),
    log: swapLogPerspective(state.log),
  }
}

function getDecisionOwner(state: MonopolyDealState): PlayerId | null {
  const phase = state.turnPhase
  switch (phase.type) {
    case 'awaitingPayment':
      return phase.debt.debtor
    case 'awaitingJSN':
      return phase.jsnChain.currentDecider
    case 'gameOver':
      return null
    default:
      return state.currentTurn
  }
}

function applyAIDecision(state: MonopolyDealState, decision: AIDecision): MonopolyDealState {
  switch (decision.type) {
    case 'playProperty':
      if (!decision.cardId || !decision.targetColor) return state
      return playPropertyToField(state, decision.cardId, decision.targetColor)
    case 'bankCard':
      if (!decision.cardId) return state
      return bankCard(state, decision.cardId)
    case 'playAction': {
      if (!decision.cardId) return state
      const card = state.ai.hand.find((entry) => entry.id === decision.cardId)
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
          return bankCard(state, decision.cardId)
      }
    }
    case 'playBuilding':
      if (!decision.cardId || !decision.targetColor) return state
      return playBuilding(state, decision.cardId, decision.targetColor)
    case 'playRent':
      if (!decision.cardId || !decision.targetColor) return state
      return playRentCard(state, decision.cardId, decision.doubleRentCardId, decision.targetColor)
    case 'payDebt': {
      let next = state
      if (decision.paymentCardIds) {
        for (const cardId of decision.paymentCardIds) {
          next = togglePaymentCard(next, cardId)
        }
      }
      return confirmPayment(next)
    }
    case 'useJSN':
      if (!decision.cardId) return state
      return playJustSayNo(state, decision.cardId)
    case 'acceptAction':
      return acceptJSNOutcome(state)
    case 'discard':
      if (!decision.discardCardIds) return state
      return discardCards(state, decision.discardCardIds)
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
        let next = relocateBuildingOnField(state, state.turnPhase.buildingCardId, decision.targetColor)
        const remaining = 3 - next.playsUsedThisTurn
        next = { ...next, turnPhase: { type: 'play', playsRemaining: remaining } }
        return next
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

function pickFallbackRentColor(state: MonopolyDealState): PropertyColor {
  let bestColor: PropertyColor = 'brown'
  let bestRent = 0
  for (const group of state.ai.field) {
    const rent = calculateRent(state.ai, group.color, false)
    if (rent > bestRent) {
      bestRent = rent
      bestColor = group.color
    }
  }
  return bestColor
}

function resolveStalledPhase(state: MonopolyDealState): MonopolyDealState {
  const phase = state.turnPhase
  switch (phase.type) {
    case 'draw':
      return executeDraw(state)
    case 'play':
      return endPlayPhase(state)
    case 'discard': {
      const sorted = [...state.ai.hand].sort((a, b) => a.value - b.value || a.name.localeCompare(b.name))
      const discardIds = sorted.slice(0, Math.max(0, phase.mustDiscard)).map((card) => card.id)
      return discardCards(state, discardIds)
    }
    case 'awaitingPayment': {
      let next = state
      for (const card of getPayableCards(state.ai)) {
        next = togglePaymentCard(next, card.id)
      }
      return confirmPayment(next)
    }
    case 'awaitingJSN':
      return acceptJSNOutcome(state)
    case 'awaitingSlyDealTarget': {
      const targets = getStealableProperties(state.player)
      if (targets.length === 0) return endPlayPhase(state)
      return completeSlyDeal(state, targets[0].card.id)
    }
    case 'awaitingDealBreakerTarget': {
      const targetColors = getCompleteSetColors(state.player)
      if (targetColors.length === 0) return endPlayPhase(state)
      return completeDealBreaker(state, targetColors[0])
    }
    case 'awaitingForcedDealSelect': {
      if (phase.phase === 'give') {
        const giveCandidates = getStealableProperties(state.ai)
        if (giveCandidates.length === 0) return endPlayPhase(state)
        return {
          ...state,
          turnPhase: { type: 'awaitingForcedDealSelect', phase: 'take', givenCardId: giveCandidates[0].card.id },
        }
      }
      if (!phase.givenCardId) return endPlayPhase(state)
      const takeCandidates = getStealableProperties(state.player)
      if (takeCandidates.length === 0) return endPlayPhase(state)
      return completeForcedDeal(state, phase.givenCardId, takeCandidates[0].card.id)
    }
    case 'awaitingBuildingTarget': {
      const buildingCard = state.ai.hand.find((entry) => entry.id === phase.cardId)
      if (!buildingCard) return endPlayPhase(state)
      for (const group of state.ai.field) {
        if (canPlaceBuilding(buildingCard, group)) {
          return playBuilding(state, phase.cardId, group.color)
        }
      }
      return endPlayPhase(state)
    }
    case 'awaitingBuildingRelocation': {
      const targets = getBuildingRelocationTargets(state, 'ai', phase.buildingCardId, phase.sourceColor)
      if (targets.length === 0) return endPlayPhase(state)
      const relocated = relocateBuildingOnField(state, phase.buildingCardId, targets[0])
      const remaining = 3 - relocated.playsUsedThisTurn
      return { ...relocated, turnPhase: { type: 'play', playsRemaining: remaining } }
    }
    case 'awaitingWildColor': {
      const wildCard = state.ai.hand.find((entry) => entry.id === phase.cardId)
      if (!wildCard) return endPlayPhase(state)
      const color = wildCard.color ?? 'brown'
      return playPropertyToField(state, phase.cardId, color)
    }
    case 'awaitingRentColor':
      return completeRentColor(state, pickFallbackRentColor(state))
    case 'awaitingDoubleRentConfirm':
      return playRentCard(state, phase.rentCardId, phase.doubleRentCardId)
    case 'awaitingWildRelocation': {
      const nextColor: PropertyColor = phase.currentColor === 'brown' ? 'lightBlue' : 'brown'
      return relocateWildOnField(state, phase.wildCardId, nextColor)
    }
    default:
      return state
  }
}

function evaluateBoardEdge(state: MonopolyDealState): number {
  const aiSets = countCompleteSets(state.ai)
  const playerSets = countCompleteSets(state.player)
  const aiValue = getPlayerTotalValue(state.ai)
  const playerValue = getPlayerTotalValue(state.player)
  return (aiSets - playerSets) * 140 + (aiValue - playerValue) * 0.44
}

function evaluateWinnerIfNoGameOver(state: MonopolyDealState): PlayerId | null {
  const edge = evaluateBoardEdge(state)
  if (edge > 3) return 'ai'
  if (edge < -3) return 'player'
  return null
}

function simulateSelfPlayGame(
  playerProfile: BenchmarkProfile,
  aiProfile: BenchmarkProfile,
  seed: number,
  maxActionSteps: number,
): PlayerId | null {
  return withSeededRandom(seed, () => {
    resetAITelemetry()
    const startPlayer: PlayerId = seed % 2 === 0 ? 'player' : 'ai'
    let state = createInitialState(startPlayer)
    let stalls = 0

    for (let step = 0; step < maxActionSteps; step++) {
      if (state.turnPhase.type === 'gameOver') return state.turnPhase.winner
      if (state.turnPhase.type === 'draw') {
        state = executeDraw(state)
        continue
      }

      const owner = getDecisionOwner(state)
      if (!owner) break
      const ownerProfile = owner === 'player' ? playerProfile : aiProfile
      const needsSwap = owner === 'player'
      const oriented = needsSwap ? swapStatePerspective(state) : state

      const priorMode = getAIDifficultyMode()
      setAIDifficultyMode(ownerProfile)
      const decision = getAIDecision(oriented)
      setAIDifficultyMode(priorMode)

      let nextOriented = applyAIDecision(oriented, decision)
      if (nextOriented === oriented) {
        nextOriented = resolveStalledPhase(oriented)
      }
      if (nextOriented === oriented) {
        stalls++
      } else {
        stalls = 0
      }
      state = needsSwap ? swapStatePerspective(nextOriented) : nextOriented
      if (stalls >= 8) break
    }

    if (state.turnPhase.type === 'gameOver') return state.turnPhase.winner
    return evaluateWinnerIfNoGameOver(state)
  })
}

function applyEloUpdate(
  ratings: Record<BenchmarkProfile, number>,
  profileA: BenchmarkProfile,
  profileB: BenchmarkProfile,
  outcomeA: number,
  kFactor: number,
): void {
  const ratingA = ratings[profileA]
  const ratingB = ratings[profileB]
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
  const expectedB = 1 - expectedA
  ratings[profileA] = ratingA + kFactor * (outcomeA - expectedA)
  ratings[profileB] = ratingB + kFactor * ((1 - outcomeA) - expectedB)
}

function createRecord(): AIProfileRecord {
  return { wins: 0, losses: 0, draws: 0 }
}

function getProfileSelfPlayScore(result: AIProfileEloLoopResult, profile: BenchmarkProfile): number {
  const record = result.records[profile]
  const totalGames = record.wins + record.losses + record.draws
  if (totalGames <= 0) return 0.5
  return (record.wins + record.draws * 0.5) / totalGames
}

export function runAIProfileEloLoop(options: AIProfileEloLoopOptions = {}): AIProfileEloLoopResult {
  const rounds = options.rounds ?? DEFAULT_ELO_ROUNDS
  const seed = options.seed ?? 20260227
  const kFactor = options.kFactor ?? DEFAULT_ELO_K_FACTOR
  const initialRating = options.initialRating ?? DEFAULT_ELO_INITIAL_RATING
  const maxActionSteps = options.maxActionStepsPerGame ?? DEFAULT_MAX_ACTION_STEPS_PER_GAME
  const selectedProfiles = options.profiles && options.profiles.length > 0
    ? [...new Set(options.profiles)]
    : DEFAULT_BENCHMARK_PROFILES
  const random = createSeededRandom(seed)

  const ratings: Record<BenchmarkProfile, number> = {
    aggressive: initialRating,
    balanced: initialRating,
    defensive: initialRating,
    adaptive: initialRating,
  }
  const records: Record<BenchmarkProfile, AIProfileRecord> = {
    aggressive: createRecord(),
    balanced: createRecord(),
    defensive: createRecord(),
    adaptive: createRecord(),
  }

  let matchesPlayed = 0
  let gamesPlayed = 0
  for (let round = 0; round < rounds; round++) {
    const shuffledProfiles = shuffle(selectedProfiles, random)
    for (let i = 0; i < shuffledProfiles.length; i++) {
      for (let j = i + 1; j < shuffledProfiles.length; j++) {
        const profileA = shuffledProfiles[i]
        const profileB = shuffledProfiles[j]
        const matchSeedA = seed + round * 1000 + i * 97 + j * 13
        const winnerA = simulateSelfPlayGame(profileA, profileB, matchSeedA, maxActionSteps)
        const outcomeA = winnerA === 'player' ? 1 : winnerA === 'ai' ? 0 : 0.5
        applyEloUpdate(ratings, profileA, profileB, outcomeA, kFactor)
        if (winnerA === 'player') {
          records[profileA].wins++
          records[profileB].losses++
        } else if (winnerA === 'ai') {
          records[profileA].losses++
          records[profileB].wins++
        } else {
          records[profileA].draws++
          records[profileB].draws++
        }
        matchesPlayed++
        gamesPlayed++

        const matchSeedB = matchSeedA + 1
        const winnerB = simulateSelfPlayGame(profileB, profileA, matchSeedB, maxActionSteps)
        const outcomeB = winnerB === 'player' ? 0 : winnerB === 'ai' ? 1 : 0.5
        applyEloUpdate(ratings, profileA, profileB, outcomeB, kFactor)
        if (winnerB === 'player') {
          records[profileB].wins++
          records[profileA].losses++
        } else if (winnerB === 'ai') {
          records[profileB].losses++
          records[profileA].wins++
        } else {
          records[profileA].draws++
          records[profileB].draws++
        }
        matchesPlayed++
        gamesPlayed++
      }
    }
  }

  const benchmark = runAIProfileBenchmark(selectedProfiles)
  return {
    ratings,
    rounds,
    seed,
    matchesPlayed,
    gamesPlayed,
    benchmark,
    records,
  }
}

export function evaluateAIThresholds(
  result: AIProfileEloLoopResult,
  config: EloThresholdConfig = DEFAULT_ELO_THRESHOLD_CONFIG,
): AIThresholdEvaluation {
  const adaptiveBenchmark = result.benchmark.adaptive
  const defensiveBenchmark = result.benchmark.defensive
  const adaptiveProactive = adaptiveBenchmark
    ? adaptiveBenchmark.decisionTypeCounts.playAction
      + adaptiveBenchmark.decisionTypeCounts.playRent
      + adaptiveBenchmark.decisionTypeCounts.playProperty
    : 0
  const defensiveEndTurnRate = defensiveBenchmark
    ? defensiveBenchmark.decisionTypeCounts.endTurn / Math.max(1, AI_BENCHMARK_SCENARIO_IDS.length)
    : 1
  const adaptiveSelfPlayScore = getProfileSelfPlayScore(result, 'adaptive')

  const checks: AIThresholdCheck[] = [
    {
      name: 'aggressive_min_rating',
      passed: result.ratings.aggressive >= config.minAggressiveRating,
      actual: result.ratings.aggressive,
      threshold: config.minAggressiveRating,
      comparator: '>=',
    },
    {
      name: 'adaptive_min_rating',
      passed: result.ratings.adaptive >= config.minAdaptiveRating,
      actual: result.ratings.adaptive,
      threshold: config.minAdaptiveRating,
      comparator: '>=',
    },
    {
      name: 'adaptive_vs_defensive_rating_delta',
      passed: result.ratings.adaptive - result.ratings.defensive >= config.minAdaptiveVsDefensiveDelta,
      actual: result.ratings.adaptive - result.ratings.defensive,
      threshold: config.minAdaptiveVsDefensiveDelta,
      comparator: '>=',
    },
    {
      name: 'adaptive_proactive_decisions',
      passed: adaptiveProactive >= config.minAdaptiveProactiveDecisions,
      actual: adaptiveProactive,
      threshold: config.minAdaptiveProactiveDecisions,
      comparator: '>=',
    },
    {
      name: 'defensive_end_turn_rate',
      passed: defensiveEndTurnRate <= config.maxDefensiveEndTurnRate,
      actual: defensiveEndTurnRate,
      threshold: config.maxDefensiveEndTurnRate,
      comparator: '<=',
    },
    {
      name: 'adaptive_self_play_score',
      passed: adaptiveSelfPlayScore >= config.minAdaptiveSelfPlayScore,
      actual: adaptiveSelfPlayScore,
      threshold: config.minAdaptiveSelfPlayScore,
      comparator: '>=',
    },
  ]

  return {
    passed: checks.every((check) => check.passed),
    checks,
  }
}

export function generateAITrendSnapshot(options: AIProfileEloLoopOptions & { generatedAt?: string } = {}): AITrendSnapshot {
  const loopResult = runAIProfileEloLoop(options)
  const thresholdEvaluation = evaluateAIThresholds(loopResult, DEFAULT_ELO_THRESHOLD_CONFIG)
  const selfPlayScoreByProfile: Record<BenchmarkProfile, number> = {
    aggressive: getProfileSelfPlayScore(loopResult, 'aggressive'),
    balanced: getProfileSelfPlayScore(loopResult, 'balanced'),
    defensive: getProfileSelfPlayScore(loopResult, 'defensive'),
    adaptive: getProfileSelfPlayScore(loopResult, 'adaptive'),
  }
  const ratingValues = Object.values(loopResult.ratings)
  const ratingSpread = Math.max(...ratingValues) - Math.min(...ratingValues)
  return {
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    seed: loopResult.seed,
    rounds: loopResult.rounds,
    ratings: loopResult.ratings,
    ratingSpread,
    matchesPlayed: loopResult.matchesPlayed,
    gamesPlayed: loopResult.gamesPlayed,
    selfPlayScoreByProfile,
    checks: thresholdEvaluation.checks,
    passed: thresholdEvaluation.passed,
  }
}

export function runDefaultEloGate(): AIThresholdEvaluation {
  const loopResult = runAIProfileEloLoop({
    rounds: DEFAULT_ELO_ROUNDS,
    profiles: ALL_PROFILES,
  })
  return evaluateAIThresholds(loopResult, DEFAULT_ELO_THRESHOLD_CONFIG)
}
