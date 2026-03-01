import type { MonopolyCardData, PropertyColor } from './cardData'
import {
  ACTION_CARDS,
  BUILDING_CARDS,
  MONEY_CARDS,
  PROPERTY_CARDS,
  RENT_CARDS,
  WILD_CARDS,
} from './cardData'
import type { MonopolyDealState, PropertyGroup } from './gameEngine'
import {
  getAIDecision,
  getAIDifficultyMode,
  getAITelemetrySnapshot,
  resetAITelemetry,
  setAIDifficultyMode,
  type AIDecision,
  type AITelemetrySnapshot,
} from './aiStrategy'

export type BenchmarkProfile = 'aggressive' | 'balanced' | 'defensive' | 'adaptive'

export interface ProfileBenchmarkScenarioResult {
  scenarioId: string
  decision: AIDecision
}

export interface ProfileBenchmarkResult {
  profile: BenchmarkProfile
  scenarios: ProfileBenchmarkScenarioResult[]
  decisionTypeCounts: Record<AIDecision['type'], number>
  telemetry: AITelemetrySnapshot
}

export const DEFAULT_BENCHMARK_PROFILES: BenchmarkProfile[] = ['aggressive', 'balanced', 'defensive', 'adaptive']

export const AI_BENCHMARK_SCENARIO_IDS = [
  'endgame_race_deficit',
  'tactical_disruption_window',
  'rent_spike_window',
  'debt_survival',
  'jsn_chain_pressure',
  'tempo_thin_hand',
] as const

const ALL_CARDS: MonopolyCardData[] = [
  ...PROPERTY_CARDS,
  ...ACTION_CARDS,
  ...MONEY_CARDS,
  ...BUILDING_CARDS,
  ...WILD_CARDS,
  ...RENT_CARDS,
]

function card(id: string, forcedId?: string): MonopolyCardData {
  const found = ALL_CARDS.find((entry) => entry.id === id)
  if (!found) throw new Error(`Card not found: ${id}`)
  return forcedId ? { ...found, id: forcedId } : found
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

function deepCloneState(state: MonopolyDealState): MonopolyDealState {
  return JSON.parse(JSON.stringify(state)) as MonopolyDealState
}

function createBenchmarkScenarios(): Record<(typeof AI_BENCHMARK_SCENARIO_IDS)[number], MonopolyDealState> {
  return {
    endgame_race_deficit: makeState({
      ai: {
        hand: [card('a-db-1'), card('a-sly-1'), card('a-pg-1')],
        field: [group('red', ['p-red-1', 'p-red-2'])],
        bank: [card('m-1a')],
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
      log: [
        { turn: 1, player: 'player', action: 'Played Deal Breaker!', timestamp: 1 },
        { turn: 2, player: 'player', action: 'Played Forced Deal', timestamp: 2 },
      ],
    }),
    tactical_disruption_window: makeState({
      ai: {
        hand: [card('a-fd-1'), card('a-sly-1'), card('p-brown-1')],
        field: [group('railroad', ['p-rr-1'])],
        bank: [],
      },
      player: {
        hand: [],
        field: [
          group('red', ['p-red-1', 'p-red-2']),
          group('orange', ['p-ora-1']),
        ],
        bank: [card('m-2a')],
      },
    }),
    rent_spike_window: makeState({
      ai: {
        hand: [card('r-wild-1'), card('a-dtr-1'), card('a-pg-1')],
        field: [
          group('red', ['p-red-1', 'p-red-2', 'p-red-3']),
          group('brown', ['p-brown-1']),
        ],
        bank: [],
      },
      player: {
        hand: [],
        field: [],
        bank: [card('m-10')],
      },
    }),
    debt_survival: makeState({
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
      player: {
        hand: [],
        field: [],
        bank: [],
      },
    }),
    jsn_chain_pressure: makeState({
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
        hand: [card('a-jsn-1')],
        field: [group('brown', ['p-brown-1', 'p-brown-2'])],
        bank: [],
      },
      player: {
        hand: [],
        field: [group('darkBlue', ['p-db-1', 'p-db-2'])],
        bank: [],
      },
    }),
    tempo_thin_hand: makeState({
      ai: {
        hand: [card('a-pg-1'), card('m-1a')],
        field: [],
        bank: [],
      },
      player: {
        hand: [],
        field: [group('brown', ['p-brown-1'])],
        bank: [],
      },
    }),
  }
}

function createDecisionTypeCounts(): Record<AIDecision['type'], number> {
  return {
    playProperty: 0,
    bankCard: 0,
    playAction: 0,
    playBuilding: 0,
    playRent: 0,
    endTurn: 0,
    payDebt: 0,
    useJSN: 0,
    acceptAction: 0,
    discard: 0,
    selectTarget: 0,
    selectColor: 0,
    wait: 0,
  }
}

export function runAIProfileBenchmark(
  profiles: BenchmarkProfile[] = DEFAULT_BENCHMARK_PROFILES,
): Record<string, ProfileBenchmarkResult> {
  const uniqueProfiles = [...new Set(profiles)]
  const scenarios = createBenchmarkScenarios()
  const priorMode = getAIDifficultyMode()
  const results: Record<string, ProfileBenchmarkResult> = {}

  try {
    for (const profile of uniqueProfiles) {
      setAIDifficultyMode(profile)
      resetAITelemetry()
      const decisionTypeCounts = createDecisionTypeCounts()
      const scenarioResults: ProfileBenchmarkScenarioResult[] = []

      for (const scenarioId of AI_BENCHMARK_SCENARIO_IDS) {
        const scenarioState = deepCloneState(scenarios[scenarioId])
        const decision = getAIDecision(scenarioState)
        decisionTypeCounts[decision.type]++
        scenarioResults.push({ scenarioId, decision })
      }

      results[profile] = {
        profile,
        scenarios: scenarioResults,
        decisionTypeCounts,
        telemetry: getAITelemetrySnapshot(),
      }
    }
  } finally {
    setAIDifficultyMode(priorMode)
  }

  return results
}
