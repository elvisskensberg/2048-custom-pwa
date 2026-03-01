import { describe, expect, it } from 'vitest'
import {
  AI_BENCHMARK_SCENARIO_IDS,
  DEFAULT_BENCHMARK_PROFILES,
  runAIProfileBenchmark,
} from './aiProfileBenchmark'

describe('aiProfileBenchmark', () => {
  it('runs benchmark scenarios for all default profiles', () => {
    const results = runAIProfileBenchmark()
    for (const profile of DEFAULT_BENCHMARK_PROFILES) {
      const profileResult = results[profile]
      expect(profileResult).toBeDefined()
      expect(profileResult.profile).toBe(profile)
      expect(profileResult.scenarios).toHaveLength(AI_BENCHMARK_SCENARIO_IDS.length)
      expect(profileResult.telemetry.totalDecisions).toBe(AI_BENCHMARK_SCENARIO_IDS.length)
    }
  })

  it('captures deterministic scenario ids and legal decision outputs', () => {
    const results = runAIProfileBenchmark(['aggressive'])
    const aggressive = results.aggressive
    expect(aggressive).toBeDefined()
    expect(aggressive.scenarios.map((entry) => entry.scenarioId)).toEqual(AI_BENCHMARK_SCENARIO_IDS)
    for (const entry of aggressive.scenarios) {
      expect(entry.decision.type).toBeDefined()
    }
  })

  it('produces action diversity metrics useful for tuning', () => {
    const results = runAIProfileBenchmark(['aggressive', 'defensive'])
    const aggressive = results.aggressive.decisionTypeCounts
    const defensive = results.defensive.decisionTypeCounts

    const aggressiveProactive = aggressive.playAction + aggressive.playRent + aggressive.playProperty
    const defensiveProactive = defensive.playAction + defensive.playRent + defensive.playProperty
    expect(aggressiveProactive).toBeGreaterThan(0)
    expect(defensiveProactive).toBeGreaterThan(0)
  })
})
