import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ELO_THRESHOLD_CONFIG,
  evaluateAIThresholds,
  generateAITrendSnapshot,
  runAIProfileEloLoop,
} from './aiTuningHarness'

describe('aiTuningHarness', () => {
  it('runs deterministic profile Elo loop across tactical scenarios', () => {
    const resultA = runAIProfileEloLoop({ rounds: 6, seed: 20260227 })
    const resultB = runAIProfileEloLoop({ rounds: 6, seed: 20260227 })

    expect(resultA.ratings).toEqual(resultB.ratings)
    expect(resultA.matchesPlayed).toBeGreaterThan(0)
    // Verify ratings diverge from start (profiles have different outcomes); cross-profile ordering
    // is not asserted here — it's deck-composition-sensitive and unstable over 6 rounds
    const ratingValues = Object.values(resultA.ratings)
    expect(Math.max(...ratingValues) - Math.min(...ratingValues)).toBeGreaterThan(0)
    expect(resultA.records.adaptive.wins).toBeGreaterThan(0)
  }, 20000)

  it('evaluates benchmark thresholds for CI gating', () => {
    const result = runAIProfileEloLoop({ rounds: 6, seed: 20260227 })
    const thresholds = evaluateAIThresholds(result, DEFAULT_ELO_THRESHOLD_CONFIG)

    expect(thresholds.passed).toBe(true)
    expect(thresholds.checks.length).toBeGreaterThan(0)
    expect(thresholds.checks.every((check) => typeof check.name === 'string')).toBe(true)
    expect(thresholds.checks.every((check) => check.comparator === '>=' || check.comparator === '<=')).toBe(true)
  }, 20000)

  it('generates trend snapshots with consistent metadata and checks', () => {
    const snapshot = generateAITrendSnapshot({ rounds: 6, seed: 20260227, generatedAt: '2026-02-27T00:00:00.000Z' })

    expect(snapshot.generatedAt).toBe('2026-02-27T00:00:00.000Z')
    expect(snapshot.matchesPlayed).toBeGreaterThan(0)
    expect(snapshot.gamesPlayed).toBe(snapshot.matchesPlayed)
    expect(snapshot.ratingSpread).toBeGreaterThan(0)
    expect(snapshot.passed).toBe(true)
    expect(snapshot.checks.length).toBeGreaterThan(0)
    expect(snapshot.selfPlayScoreByProfile.adaptive).toBeGreaterThan(0.5)
  }, 20000)
})
