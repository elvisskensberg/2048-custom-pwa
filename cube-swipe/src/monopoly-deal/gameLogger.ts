// ---------------------------------------------------------------------------
// Monopoly Deal – Game Logger (console + in-memory ring buffer)
// ---------------------------------------------------------------------------
//
// Usage in browser console:
//   mdLog()          — print all logs
//   mdLog(20)        — print last 20 entries
//   mdLogClear()     — clear log buffer
//   mdLogState()     — print current game state summary
// ---------------------------------------------------------------------------

import type { MonopolyDealState } from './gameEngine'

interface LogEntry {
  ts: number
  msg: string
}

const MAX_ENTRIES = 500
const entries: LogEntry[] = []
let stateRef: MonopolyDealState | null = null

function push(msg: string): void {
  entries.push({ ts: Date.now(), msg })
  if (entries.length > MAX_ENTRIES) entries.shift()
   
  console.info(`[MD] ${msg}`)
}

/** Log a state snapshot. */
export function logState(label: string, s: MonopolyDealState): void {
  stateRef = s
  const phase = s.turnPhase
  const phaseDetail = 'playsRemaining' in phase ? ` plays=${phase.playsRemaining}` : ''
  const debtDetail = 'debt' in phase ? ` debt=${phase.debt.amount} debtor=${phase.debt.debtor}` : ''
  push(
    `${label} | turn=${s.currentTurn} phase=${phase.type}${phaseDetail}${debtDetail}` +
    ` | P:hand=${s.player.hand.length},field=${s.player.field.length},bank=${s.player.bank.length}` +
    ` | AI:hand=${s.ai.hand.length},field=${s.ai.field.length},bank=${s.ai.bank.length}` +
    ` | draw=${s.drawPile.length} discard=${s.discardPile.length}`,
  )
}

/** Log an action. */
export function logAction(actor: string, action: string, detail?: string): void {
  push(`${actor}: ${action}${detail ? ` (${detail})` : ''}`)
}

/** Expose helpers on window for console access. */
function installGlobals(): void {
  const w = window as unknown as Record<string, unknown>

  w.mdLog = (n?: number): void => {
    const slice = n ? entries.slice(-n) : entries
    const t0 = slice.length > 0 ? slice[0].ts : 0
    for (const e of slice) {
      const delta = ((e.ts - t0) / 1000).toFixed(1).padStart(7)
       
      console.info(`${delta}s  ${e.msg}`)
    }
     
    console.info(`— ${slice.length} entries (${entries.length} total) —`)
  }

  w.mdLogClear = (): void => {
    entries.length = 0
     
    console.info('[MD] Log cleared')
  }

  w.mdLogState = (): void => {
    if (!stateRef) {
       
      console.info('[MD] No state captured yet')
      return
    }
    const s = stateRef
     
    console.info('[MD] Current state:', {
      turn: s.currentTurn,
      phase: s.turnPhase,
      playerHand: s.player.hand.map((c) => `${c.name} (${c.id})`),
      playerField: s.player.field.map((g) => `${g.color}: ${g.cards.map((c) => c.name).join(', ')}${g.buildings.length ? ` +${g.buildings.map((b) => b.name).join(',')}` : ''}`),
      playerBank: s.player.bank.map((c) => `${c.name}`),
      aiHand: s.ai.hand.length,
      aiField: s.ai.field.map((g) => `${g.color}: ${g.cards.map((c) => c.name).join(', ')}${g.buildings.length ? ` +${g.buildings.map((b) => b.name).join(',')}` : ''}`),
      aiBank: s.ai.bank.map((c) => `${c.name}`),
      drawPile: s.drawPile.length,
      discardPile: s.discardPile.length,
      playsUsed: s.playsUsedThisTurn,
    })
  }

  w.mdLogDump = (): string => {
    const t0 = entries.length > 0 ? entries[0].ts : 0
    return entries.map((e) => {
      const delta = ((e.ts - t0) / 1000).toFixed(1).padStart(7)
      return `${delta}s  ${e.msg}`
    }).join('\n')
  }
}

if (typeof window !== 'undefined') {
  installGlobals()
}
