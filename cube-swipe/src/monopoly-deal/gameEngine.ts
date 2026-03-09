// ---------------------------------------------------------------------------
// Monopoly Deal — Pure game engine (no React dependencies)
// All functions take state → return new state (immutable)
// ---------------------------------------------------------------------------

import {
  type MonopolyCardData,
  type PropertyColor,
  buildFullDeck,
  SET_SIZE,
  COLOR_RENT,
} from './cardData'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlayerId = 'player' | 'ai'

export interface PropertyGroup {
  color: PropertyColor
  cards: MonopolyCardData[]
  buildings: MonopolyCardData[]
}

export interface PlayerState {
  hand: MonopolyCardData[]
  field: PropertyGroup[]
  bank: MonopolyCardData[]
}

export interface DebtInfo {
  creditor: PlayerId
  debtor: PlayerId
  amount: number
  source: 'rent' | 'debtCollector' | 'birthday'
  selectedPayment: string[] // card IDs selected for payment
}

export interface JSNChainInfo {
  originalAction: PendingAction
  chain: Array<{ player: PlayerId; jsnCardId: string }>
  currentDecider: PlayerId
}

export interface PendingAction {
  actionCard: MonopolyCardData
  sourcePlayer: PlayerId
  doubleRentCardId?: string
  targetColor?: PropertyColor
  targetCardId?: string
  yourCardId?: string
  debtAmount?: number
  debtSource?: DebtInfo['source']
}

export interface GameLogEntry {
  turn: number
  player: PlayerId
  action: string
  timestamp: number
}

export type TurnPhase =
  | { type: 'draw' }
  | { type: 'play'; playsRemaining: number }
  | { type: 'discard'; mustDiscard: number }
  | { type: 'awaitingPayment'; debt: DebtInfo }
  | { type: 'awaitingJSN'; jsnChain: JSNChainInfo }
  | { type: 'awaitingWildColor'; cardId: string; context: 'play' | 'forcedDealGive' }
  | { type: 'awaitingRentColor'; cardId: string; doubleRentCardId?: string }
  | { type: 'awaitingDealBreakerTarget' }
  | { type: 'awaitingSlyDealTarget' }
  | { type: 'awaitingForcedDealSelect'; phase: 'give' | 'take'; givenCardId?: string }
  | { type: 'awaitingDoubleRentConfirm'; rentCardId: string; doubleRentCardId: string }
  | { type: 'awaitingBuildingTarget'; cardId: string }
  | { type: 'awaitingWildRelocation'; wildCardId: string; currentColor: PropertyColor }
  | { type: 'awaitingBuildingRelocation'; buildingCardId: string; sourceColor: PropertyColor }
  | { type: 'gameOver'; winner: PlayerId }

export interface MonopolyDealState {
  drawPile: MonopolyCardData[]
  discardPile: MonopolyCardData[]
  player: PlayerState
  ai: PlayerState
  currentTurn: PlayerId
  turnPhase: TurnPhase
  turnNumber: number
  playsUsedThisTurn: number
  log: GameLogEntry[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function opponent(p: PlayerId): PlayerId {
  return p === 'player' ? 'ai' : 'player'
}

function getPlayer(state: MonopolyDealState, p: PlayerId): PlayerState {
  return p === 'player' ? state.player : state.ai
}

function setPlayer(state: MonopolyDealState, p: PlayerId, ps: PlayerState): MonopolyDealState {
  return p === 'player' ? { ...state, player: ps } : { ...state, ai: ps }
}

function removeFromHand(ps: PlayerState, cardId: string): PlayerState {
  return { ...ps, hand: ps.hand.filter((c) => c.id !== cardId) }
}

function addToBank(ps: PlayerState, card: MonopolyCardData): PlayerState {
  return { ...ps, bank: [...ps.bank, card] }
}

function addLog(state: MonopolyDealState, player: PlayerId, action: string): MonopolyDealState {
  return {
    ...state,
    log: [...state.log, { turn: state.turnNumber, player, action, timestamp: Date.now() }],
  }
}

/** Consume a play using playsUsedThisTurn — works regardless of current phase type. */
function consumePlayFromState(state: MonopolyDealState, count: number = 1): { turnPhase: TurnPhase; playsUsedThisTurn: number } {
  const newPlaysUsed = state.playsUsedThisTurn + count
  return {
    turnPhase: { type: 'play' as const, playsRemaining: 3 - newPlaysUsed },
    playsUsedThisTurn: newPlaysUsed,
  }
}

/** Fisher-Yates shuffle (creates new array). */
export function shuffleDeck(deck: MonopolyCardData[]): MonopolyCardData[] {
  const arr = [...deck]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

function emptyPlayer(): PlayerState {
  return { hand: [], field: [], bank: [] }
}

/** Create a new game: shuffle deck, deal 5 each, random first turn. */
export function createInitialState(firstPlayer?: PlayerId): MonopolyDealState {
  const deck = shuffleDeck(buildFullDeck())
  const playerHand = deck.slice(0, 5)
  const aiHand = deck.slice(5, 10)
  const drawPile = deck.slice(10)

  return {
    drawPile,
    discardPile: [],
    player: { ...emptyPlayer(), hand: playerHand },
    ai: { ...emptyPlayer(), hand: aiHand },
    currentTurn: firstPlayer ?? (Math.random() < 0.5 ? 'player' : 'ai'),
    turnPhase: { type: 'draw' },
    turnNumber: 1,
    playsUsedThisTurn: 0,
    log: [],
  }
}

// ---------------------------------------------------------------------------
// Draw
// ---------------------------------------------------------------------------

/** Draw N cards for a player. Reshuffles discard if draw pile runs out. */
export function drawCards(state: MonopolyDealState, player: PlayerId, count: number): MonopolyDealState {
  let drawPile = [...state.drawPile]
  let discardPile = [...state.discardPile]

  // Reshuffle if needed
  if (drawPile.length < count && discardPile.length > 0) {
    drawPile = [...drawPile, ...shuffleDeck(discardPile)]
    discardPile = []
  }

  const drawn = drawPile.splice(0, Math.min(count, drawPile.length))
  const ps = getPlayer(state, player)
  const newPs = { ...ps, hand: [...ps.hand, ...drawn] }

  let s = { ...state, drawPile, discardPile }
  s = setPlayer(s, player, newPs)
  return s
}

/** Execute the mandatory draw phase (draw 2 — or 5 if hand is empty — then move to play phase). */
export function executeDraw(state: MonopolyDealState): MonopolyDealState {
  const ps = getPlayer(state, state.currentTurn)
  const drawCount = ps.hand.length === 0 ? 5 : 2
  let s = drawCards(state, state.currentTurn, drawCount)
  s = addLog(s, state.currentTurn, `Drew ${drawCount} cards`)
  s = { ...s, turnPhase: { type: 'play', playsRemaining: 3 }, playsUsedThisTurn: 0 }
  return s
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function isCompleteSet(group: PropertyGroup): boolean {
  if (group.cards.length < SET_SIZE[group.color]) return false
  // A complete set must contain at least one standard (non-wild) property card
  return group.cards.some((c) => c.type !== 'wild')
}

export function countCompleteSets(ps: PlayerState): number {
  return ps.field.filter(isCompleteSet).length
}

export function checkWinCondition(state: MonopolyDealState): PlayerId | null {
  if (countCompleteSets(state.player) >= 3) return 'player'
  if (countCompleteSets(state.ai) >= 3) return 'ai'
  return null
}

export function canPlayCard(
  state: MonopolyDealState,
  cardId: string,
): { valid: boolean; reason?: string } {
  if (state.turnPhase.type !== 'play') return { valid: false, reason: 'Not in play phase' }
  if (state.turnPhase.playsRemaining <= 0) return { valid: false, reason: 'No plays remaining' }

  const ps = getPlayer(state, state.currentTurn)
  const card = ps.hand.find((c) => c.id === cardId)
  if (!card) return { valid: false, reason: 'Card not in hand' }

  // Double Rent can only be played alongside a rent card (handled in UI)
  if (card.name === 'Double Rent') return { valid: false, reason: 'Must be played with a Rent card' }

  // Building cards need at least one valid target set
  if (card.type === 'building') {
    const hasTarget = ps.field.some((g) => canPlaceBuilding(card, g))
    if (!hasTarget) return { valid: false, reason: 'No complete set to build on' }
  }

  // Action cards that need valid targets
  const opp = getPlayer(state, opponent(state.currentTurn))
  if (card.name === 'Deal Breaker') {
    if (getCompleteSetColors(opp).length === 0) return { valid: false, reason: 'Opponent has no complete sets' }
  }
  if (card.name === 'Sly Deal') {
    if (getStealableProperties(opp).length === 0) return { valid: false, reason: 'No stealable properties' }
  }
  if (card.name === 'Forced Deal') {
    if (getStealableProperties(ps).length === 0 || getStealableProperties(opp).length === 0) {
      return { valid: false, reason: 'Both players need properties to swap' }
    }
  }

  return { valid: true }
}

export function canPlaceBuilding(card: MonopolyCardData, group: PropertyGroup): boolean {
  if (!isCompleteSet(group)) return false
  // Buildings cannot be placed on Railroad or Utility sets
  if (group.color === 'railroad' || group.color === 'utility') return false
  const hasHouse = group.buildings.some((b) => b.name === 'House')
  const hasHotel = group.buildings.some((b) => b.name === 'Hotel')
  if (card.name === 'House') return !hasHouse
  if (card.name === 'Hotel') return hasHouse && !hasHotel
  return false
}

/** Calculate rent for a color given a player's field. */
export function calculateRent(ps: PlayerState, color: PropertyColor, doubled: boolean): number {
  const group = ps.field.find((g) => g.color === color)
  if (!group || group.cards.length === 0) return 0

  const count = Math.min(group.cards.length, COLOR_RENT[color].length)
  let rent = COLOR_RENT[color][count - 1]

  // Buildings bonus
  if (group.buildings.some((b) => b.name === 'House')) rent += 3
  if (group.buildings.some((b) => b.name === 'Hotel')) rent += 4

  if (doubled) rent *= 2
  return rent
}

/** Get properties that can be stolen (not in complete sets). */
export function getStealableProperties(ps: PlayerState): Array<{ card: MonopolyCardData; groupColor: PropertyColor }> {
  const results: Array<{ card: MonopolyCardData; groupColor: PropertyColor }> = []
  for (const group of ps.field) {
    if (!isCompleteSet(group)) {
      for (const card of group.cards) {
        results.push({ card, groupColor: group.color })
      }
    }
  }
  return results
}

/** Get colors of complete sets (for Deal Breaker targeting). */
export function getCompleteSetColors(ps: PlayerState): PropertyColor[] {
  return ps.field.filter(isCompleteSet).map((g) => g.color)
}

/** Get total monetary value of a player's bank + field. */
export function getPlayerTotalValue(ps: PlayerState): number {
  let total = 0
  for (const c of ps.bank) total += c.value
  for (const g of ps.field) {
    for (const c of g.cards) total += c.value
    for (const b of g.buildings) total += b.value
  }
  return total
}

// ---------------------------------------------------------------------------
// Play actions
// ---------------------------------------------------------------------------

/** Add a property or wild card to a color group on the player's field. */
export function playPropertyToField(
  state: MonopolyDealState,
  cardId: string,
  targetColor: PropertyColor,
): MonopolyDealState {
  const p = state.currentTurn
  const ps = getPlayer(state, p)
  const card = ps.hand.find((c) => c.id === cardId)
  if (!card) return state

  // Block adding to a group that is already complete
  const existingGroup = ps.field.find((g) => g.color === targetColor)
  if (existingGroup && isCompleteSet(existingGroup)) return state

  let newPs = removeFromHand(ps, cardId)

  // Find or create the group
  const groupIdx = newPs.field.findIndex((g) => g.color === targetColor)
  if (groupIdx >= 0) {
    const newField = [...newPs.field]
    newField[groupIdx] = {
      ...newField[groupIdx],
      cards: [...newField[groupIdx].cards, card],
    }
    newPs = { ...newPs, field: newField }
  } else {
    newPs = {
      ...newPs,
      field: [...newPs.field, { color: targetColor, cards: [card], buildings: [] }],
    }
  }

  let s = setPlayer(state, p, newPs)
  s = { ...s, ...consumePlayFromState(state) }
  s = addLog(s, p, `Played ${card.name} to ${targetColor}`)

  // Check win
  const winner = checkWinCondition(s)
  if (winner) {
    s = { ...s, turnPhase: { type: 'gameOver', winner } }
  }
  return s
}

/** Bank any card from hand as money. */
export function bankCard(state: MonopolyDealState, cardId: string): MonopolyDealState {
  const p = state.currentTurn
  const ps = getPlayer(state, p)
  const card = ps.hand.find((c) => c.id === cardId)
  if (!card) return state

  let newPs = removeFromHand(ps, cardId)
  newPs = addToBank(newPs, card)

  let s = setPlayer(state, p, newPs)
  s = { ...s, ...consumePlayFromState(state) }
  s = addLog(s, p, `Banked ${card.name} (M${card.value}M)`)
  return s
}

/** Play a building onto a complete set. */
export function playBuilding(
  state: MonopolyDealState,
  cardId: string,
  targetColor: PropertyColor,
): MonopolyDealState {
  const p = state.currentTurn
  const ps = getPlayer(state, p)
  const card = ps.hand.find((c) => c.id === cardId)
  if (!card) return state

  const groupIdx = ps.field.findIndex((g) => g.color === targetColor)
  if (groupIdx < 0) return state
  if (!canPlaceBuilding(card, ps.field[groupIdx])) return state

  let newPs = removeFromHand(ps, cardId)
  const newField = [...newPs.field]
  newField[groupIdx] = {
    ...newField[groupIdx],
    buildings: [...newField[groupIdx].buildings, card],
  }
  newPs = { ...newPs, field: newField }

  let s = setPlayer(state, p, newPs)
  s = { ...s, ...consumePlayFromState(state) }
  s = addLog(s, p, `Placed ${card.name} on ${targetColor}`)
  return s
}

/** Play Pass Go — draw 2 extra cards. */
export function playPassGo(state: MonopolyDealState, cardId: string): MonopolyDealState {
  const p = state.currentTurn
  const ps = getPlayer(state, p)
  const card = ps.hand.find((c) => c.id === cardId)
  if (!card) return state

  const newPs = removeFromHand(ps, cardId)
  let s = setPlayer(state, p, newPs)
  s = { ...s, discardPile: [...s.discardPile, card] }
  s = drawCards(s, p, 2)
  s = { ...s, ...consumePlayFromState(state) }
  s = addLog(s, p, 'Played Pass Go — drew 2 cards')
  return s
}

// ---------------------------------------------------------------------------
// Rent
// ---------------------------------------------------------------------------

/** Initiate rent collection. Returns state awaiting color or payment. */
export function playRentCard(
  state: MonopolyDealState,
  rentCardId: string,
  doubleRentCardId?: string,
  targetColor?: PropertyColor,
): MonopolyDealState {
  const p = state.currentTurn
  const ps = getPlayer(state, p)
  const rentCard = ps.hand.find((c) => c.id === rentCardId)
  if (!rentCard) return state

  // If wild rent and no color specified, need to choose
  if (!rentCard.color && !targetColor) {
    let newPs = removeFromHand(ps, rentCardId)
    if (doubleRentCardId) newPs = removeFromHand(newPs, doubleRentCardId)
    let s = setPlayer(state, p, newPs)
    s = { ...s, discardPile: [...s.discardPile, rentCard] }
    if (doubleRentCardId) {
      const drCard = ps.hand.find((c) => c.id === doubleRentCardId)
      if (drCard) s = { ...s, discardPile: [...s.discardPile, drCard] }
    }
    s = { ...s, turnPhase: { type: 'awaitingRentColor', cardId: rentCardId, doubleRentCardId } }
    return s
  }

  // Determine color (from card or selection)
  const color = targetColor ?? rentCard.color
  if (!color) return state

  const doubled = !!doubleRentCardId
  const rentAmount = calculateRent(ps, color, doubled)

  // Remove cards from hand and discard them
  let newPs = removeFromHand(ps, rentCardId)
  if (doubleRentCardId) newPs = removeFromHand(newPs, doubleRentCardId)
  let s = setPlayer(state, p, newPs)
  s = { ...s, discardPile: [...s.discardPile, rentCard] }
  if (doubleRentCardId) {
    const drCard = ps.hand.find((c) => c.id === doubleRentCardId)
    if (drCard) s = { ...s, discardPile: [...s.discardPile, drCard] }
  }

  const playCount = doubleRentCardId ? 2 : 1

  if (rentAmount <= 0) {
    // No rent to collect
    s = { ...s, ...consumePlayFromState(state, playCount) }
    s = addLog(s, p, `Played Rent for ${color} but owed M0`)
    return s
  }

  s = { ...s, playsUsedThisTurn: state.playsUsedThisTurn + playCount }
  s = addLog(s, p, `Charged M${rentAmount}M rent for ${color}${doubled ? ' (doubled!)' : ''}`)

  // Skip JSN modal for money charges — JSN is offered inline in the payment dialog
  const debt: DebtInfo = {
    creditor: p,
    debtor: opponent(p),
    amount: rentAmount,
    source: 'rent',
    selectedPayment: [],
  }
  return { ...s, turnPhase: { type: 'awaitingPayment', debt } }
}

/** Complete rent after color selection (for wild rent). */
export function completeRentColor(
  state: MonopolyDealState,
  color: PropertyColor,
): MonopolyDealState {
  if (state.turnPhase.type !== 'awaitingRentColor') return state
  const { doubleRentCardId } = state.turnPhase

  const p = state.currentTurn
  const ps = getPlayer(state, p)
  const doubled = !!doubleRentCardId
  const rentAmount = calculateRent(ps, color, doubled)
  const playCount = doubleRentCardId ? 2 : 1

  if (rentAmount <= 0) {
    const s = {
      ...state,
      turnPhase: { type: 'play' as const, playsRemaining: 3 - state.playsUsedThisTurn - playCount },
      playsUsedThisTurn: state.playsUsedThisTurn + playCount,
    }
    return addLog(s, p, `Played Wild Rent for ${color} but owed M0`)
  }

  let s: MonopolyDealState = {
    ...state,
    playsUsedThisTurn: state.playsUsedThisTurn + playCount,
  }
  s = addLog(s, p, `Charged M${rentAmount}M rent for ${color}${doubled ? ' (doubled!)' : ''}`)

  // Skip JSN modal for money charges — JSN is offered inline in the payment dialog
  const debt: DebtInfo = {
    creditor: p,
    debtor: opponent(p),
    amount: rentAmount,
    source: 'rent',
    selectedPayment: [],
  }
  return { ...s, turnPhase: { type: 'awaitingPayment', debt } }
}

// ---------------------------------------------------------------------------
// JSN offer helper — check if defender has JSN before resolving action
// ---------------------------------------------------------------------------

/**
 * Before resolving an action against the opponent, check if the defender
 * has a Just Say No card and offer them a chance to block.
 * If they do, transitions to awaitingJSN; otherwise returns null (proceed).
 */
function tryOfferJSN(
  state: MonopolyDealState,
  actionCard: MonopolyCardData,
  sourcePlayer: PlayerId,
  pendingOverrides?: Partial<PendingAction>,
): MonopolyDealState | null {
  const target = opponent(sourcePlayer)
  const targetState = getPlayer(state, target)
  const hasJSN = targetState.hand.some((c) => c.name === 'Just Say No')
  if (!hasJSN) return null

  const pending: PendingAction = {
    actionCard,
    sourcePlayer,
    ...pendingOverrides,
  }
  return {
    ...state,
    turnPhase: {
      type: 'awaitingJSN',
      jsnChain: {
        originalAction: pending,
        chain: [],
        currentDecider: target,
      },
    },
  }
}

// ---------------------------------------------------------------------------
// Debt / Birthday / Debt Collector
// ---------------------------------------------------------------------------

/** Play Debt Collector — opponent owes M5. */
export function playDebtCollector(state: MonopolyDealState, cardId: string): MonopolyDealState {
  const p = state.currentTurn
  const ps = getPlayer(state, p)
  const card = ps.hand.find((c) => c.id === cardId)
  if (!card) return state

  const newPs = removeFromHand(ps, cardId)
  let s = setPlayer(state, p, newPs)
  s = { ...s, discardPile: [...s.discardPile, card], playsUsedThisTurn: state.playsUsedThisTurn + 1 }
  s = addLog(s, p, p === 'player' ? 'You played Debt Collector — AI owes M5M' : 'AI played Debt Collector — you owe M5M')

  // Skip JSN modal for money charges — JSN is offered inline in the payment dialog
  const debt: DebtInfo = {
    creditor: p,
    debtor: opponent(p),
    amount: 5,
    source: 'debtCollector',
    selectedPayment: [],
  }
  return { ...s, turnPhase: { type: 'awaitingPayment', debt } }
}

/** Play It's My Birthday — opponent owes M2. */
export function playBirthday(state: MonopolyDealState, cardId: string): MonopolyDealState {
  const p = state.currentTurn
  const ps = getPlayer(state, p)
  const card = ps.hand.find((c) => c.id === cardId)
  if (!card) return state

  const newPs = removeFromHand(ps, cardId)
  let s = setPlayer(state, p, newPs)
  s = { ...s, discardPile: [...s.discardPile, card], playsUsedThisTurn: state.playsUsedThisTurn + 1 }
  s = addLog(s, p, p === 'player' ? "You played It's My Birthday — AI owes M2M" : "AI played It's My Birthday — you owe M2M")

  // Skip JSN modal for money charges — JSN is offered inline in the payment dialog
  const debt: DebtInfo = {
    creditor: p,
    debtor: opponent(p),
    amount: 2,
    source: 'birthday',
    selectedPayment: [],
  }
  return { ...s, turnPhase: { type: 'awaitingPayment', debt } }
}

// ---------------------------------------------------------------------------
// Payment resolution
// ---------------------------------------------------------------------------

/** Toggle a card in the payment selection. */
export function togglePaymentCard(state: MonopolyDealState, cardId: string): MonopolyDealState {
  if (state.turnPhase.type !== 'awaitingPayment') return state
  const debt = state.turnPhase.debt
  const selected = debt.selectedPayment.includes(cardId)
    ? debt.selectedPayment.filter((id) => id !== cardId)
    : [...debt.selectedPayment, cardId]
  return {
    ...state,
    turnPhase: { type: 'awaitingPayment', debt: { ...debt, selectedPayment: selected } },
  }
}

/** Get all payable cards for the debtor. */
export function getPayableCards(ps: PlayerState): MonopolyCardData[] {
  const cards: MonopolyCardData[] = [...ps.bank]
  for (const g of ps.field) {
    cards.push(...g.cards, ...g.buildings)
  }
  return cards
}

/** Get total value of selected payment cards. */
export function getSelectedPaymentValue(ps: PlayerState, selectedIds: string[]): number {
  if (selectedIds.length === 0) return 0
  const selected = new Set(selectedIds)
  let total = 0
  for (const card of getPayableCards(ps)) {
    if (!selected.has(card.id)) continue
    total += card.value
    selected.delete(card.id)
    if (selected.size === 0) break
  }
  return total
}

/**
 * Use a Just Say No card from the debtor's hand to block a money charge
 * (rent, debt collector, birthday) during the payment phase.
 * If the creditor has JSN, starts a JSN chain. Otherwise, blocks immediately.
 */
export function useJSNDuringPayment(state: MonopolyDealState, jsnCardId: string): MonopolyDealState {
  if (state.turnPhase.type !== 'awaitingPayment') return state
  const { debt } = state.turnPhase
  const debtorState = getPlayer(state, debt.debtor)
  const jsnCard = debtorState.hand.find((c) => c.id === jsnCardId && c.name === 'Just Say No')
  if (!jsnCard) return state

  // Remove JSN from debtor's hand, discard it
  const newDebtorState = removeFromHand(debtorState, jsnCardId)
  let s = setPlayer(state, debt.debtor, newDebtorState)
  s = { ...s, discardPile: [...s.discardPile, jsnCard] }
  s = addLog(s, debt.debtor, debt.debtor === 'player' ? 'You played Just Say No to block payment!' : 'AI played Just Say No to block payment!')

  // Check if creditor has JSN to counter
  const creditorState = getPlayer(s, debt.creditor)
  const creditorHasJSN = creditorState.hand.some((c) => c.name === 'Just Say No')

  if (creditorHasJSN) {
    // Start JSN chain — creditor can counter
    const cardName = debt.source === 'debtCollector' ? 'Debt Collector'
      : debt.source === 'birthday' ? "It's My Birthday"
      : 'Rent'
    const dummyCard: MonopolyCardData = {
      id: 'jsn-debt-ref', name: cardName, type: 'action', value: 0,
    }
    const pending: PendingAction = {
      actionCard: dummyCard,
      sourcePlayer: debt.creditor,
      debtAmount: debt.amount,
      debtSource: debt.source,
    }
    return {
      ...s,
      turnPhase: {
        type: 'awaitingJSN',
        jsnChain: {
          originalAction: pending,
          chain: [{ player: debt.debtor, jsnCardId }],
          currentDecider: debt.creditor,
        },
      },
    }
  }

  // No counter — action blocked, return to play
  const remaining = 3 - s.playsUsedThisTurn
  return { ...s, turnPhase: { type: 'play', playsRemaining: remaining } }
}

/** Confirm payment: transfer cards from debtor to creditor. */
export function confirmPayment(state: MonopolyDealState): MonopolyDealState {
  if (state.turnPhase.type !== 'awaitingPayment') return state
  const { creditor, debtor, amount, selectedPayment } = state.turnPhase.debt

  const debtorState = getPlayer(state, debtor)
  const creditorState = getPlayer(state, creditor)

  // If debtor has nothing, auto-complete
  const allPayable = getPayableCards(debtorState)
  if (allPayable.length === 0) {
    // Return to play phase
    const remaining = 3 - state.playsUsedThisTurn
    let s: MonopolyDealState = { ...state, turnPhase: { type: 'play' as const, playsRemaining: remaining } }
    s = addLog(s, debtor, 'Had nothing to pay')
    return s
  }

  // Validate payment meets amount (or debtor gave everything)
  const paymentValue = getSelectedPaymentValue(debtorState, selectedPayment)
  const totalDebtorValue = getPlayerTotalValue(debtorState)
  if (paymentValue < amount && paymentValue < totalDebtorValue) {
    return state // Not enough selected
  }

  const selected = new Set(selectedPayment)
  const transferToBank: MonopolyCardData[] = []
  const transferToField: Array<{ card: MonopolyCardData; color: PropertyColor }> = []

  const nextDebtorBank: MonopolyCardData[] = []
  for (const card of debtorState.bank) {
    if (selected.has(card.id)) {
      selected.delete(card.id)
      transferToBank.push(card)
    } else {
      nextDebtorBank.push(card)
    }
  }

  const nextDebtorField: PropertyGroup[] = []
  for (const group of debtorState.field) {
    const remainingCards: MonopolyCardData[] = []
    for (const card of group.cards) {
      if (selected.has(card.id)) {
        selected.delete(card.id)
        transferToField.push({ card, color: group.color })
      } else {
        remainingCards.push(card)
      }
    }

    const remainingBuildings: MonopolyCardData[] = []
    for (const building of group.buildings) {
      if (selected.has(building.id)) {
        selected.delete(building.id)
        transferToBank.push(building)
      } else {
        remainingBuildings.push(building)
      }
    }

    if (remainingCards.length > 0) {
      // If set was complete before but no longer — orphan buildings to bank
      const wasComplete = group.cards.length >= SET_SIZE[group.color]
      const stillComplete = remainingCards.length >= SET_SIZE[group.color]
      if (wasComplete && !stillComplete && remainingBuildings.length > 0) {
        nextDebtorBank.push(...remainingBuildings)
        nextDebtorField.push({ ...group, cards: remainingCards, buildings: [] })
      } else {
        nextDebtorField.push({ ...group, cards: remainingCards, buildings: remainingBuildings })
      }
    } else if (remainingBuildings.length > 0) {
      // No property cards left — buildings become orphaned, move to bank
      nextDebtorBank.push(...remainingBuildings)
    }
    // else: group completely empty, drop it
  }

  const newDebtor: PlayerState = {
    ...debtorState,
    bank: nextDebtorBank,
    field: nextDebtorField,
  }

  let newCreditor: PlayerState = {
    ...creditorState,
    bank: [...creditorState.bank, ...transferToBank],
  }
  for (const { card, color } of transferToField) {
    newCreditor = addPropertyToField(newCreditor, card, color)
  }

  let s = setPlayer(state, debtor, newDebtor)
  s = setPlayer(s, creditor, newCreditor)

  // Check if creditor won via transferred properties
  const winner = checkWinCondition(s)
  if (winner) {
    s = { ...s, turnPhase: { type: 'gameOver', winner } }
    s = addLog(s, debtor, `Paid M${paymentValue}M (owed M${amount}M)`)
    return s
  }

  const remaining = 3 - s.playsUsedThisTurn
  s = { ...s, turnPhase: { type: 'play', playsRemaining: remaining } }
  s = addLog(s, debtor, `Paid M${paymentValue}M (owed M${amount}M)`)
  return s
}

/** Helper to add a property card to a player's field. */
function addPropertyToField(ps: PlayerState, card: MonopolyCardData, color: PropertyColor): PlayerState {
  const groupIdx = ps.field.findIndex((g) => g.color === color && !isCompleteSet(g))
  if (groupIdx >= 0) {
    const newField = [...ps.field]
    newField[groupIdx] = {
      ...newField[groupIdx],
      cards: [...newField[groupIdx].cards, card],
    }
    return { ...ps, field: newField }
  }
  return { ...ps, field: [...ps.field, { color, cards: [card], buildings: [] }] }
}

// ---------------------------------------------------------------------------
// Steal / Swap actions
// ---------------------------------------------------------------------------

/** Play Sly Deal — transition to target selection (or JSN offer). */
export function playSlyDeal(state: MonopolyDealState, cardId: string): MonopolyDealState {
  const p = state.currentTurn
  const ps = getPlayer(state, p)
  const card = ps.hand.find((c) => c.id === cardId)
  if (!card) return state

  const targets = getStealableProperties(getPlayer(state, opponent(p)))
  if (targets.length === 0) return state // No valid targets

  const newPs = removeFromHand(ps, cardId)
  let s = setPlayer(state, p, newPs)
  s = { ...s, discardPile: [...s.discardPile, card], playsUsedThisTurn: state.playsUsedThisTurn + 1 }
  s = addLog(s, p, p === 'player' ? 'You played Sly Deal' : 'AI played Sly Deal')

  // Offer JSN to defender
  const jsnState = tryOfferJSN(s, card, p)
  if (jsnState) return jsnState

  return { ...s, turnPhase: { type: 'awaitingSlyDealTarget' } }
}

/** Complete Sly Deal — steal a specific property. */
export function completeSlyDeal(state: MonopolyDealState, targetCardId: string): MonopolyDealState {
  const p = state.currentTurn
  const opp = opponent(p)
  const oppState = getPlayer(state, opp)

  // Find the card in opponent's field
  let stolenCard: MonopolyCardData | null = null
  let stolenColor: PropertyColor | null = null
  let newOppField = [...oppState.field]
  const orphanedBuildings: MonopolyCardData[] = []

  for (let gi = 0; gi < newOppField.length; gi++) {
    const group = newOppField[gi]
    if (isCompleteSet(group)) continue
    const idx = group.cards.findIndex((c) => c.id === targetCardId)
    if (idx >= 0) {
      stolenCard = group.cards[idx]
      stolenColor = group.color
      const remainingCards = group.cards.filter((c) => c.id !== targetCardId)
      if (remainingCards.length === 0) {
        // Group is now empty — move buildings to opponent's bank
        orphanedBuildings.push(...group.buildings)
        newOppField = newOppField.filter((_, i) => i !== gi)
      } else {
        newOppField[gi] = { ...group, cards: remainingCards }
      }
      break
    }
  }

  if (!stolenCard || !stolenColor) return state

  const newOpp = { ...oppState, field: newOppField, bank: [...oppState.bank, ...orphanedBuildings] }
  let s = setPlayer(state, opp, newOpp)

  const myState = getPlayer(s, p)
  const newMyState = addPropertyToField(myState, stolenCard, stolenColor)
  s = setPlayer(s, p, newMyState)

  const remaining = 3 - s.playsUsedThisTurn
  s = { ...s, turnPhase: { type: 'play', playsRemaining: remaining } }
  s = addLog(s, p, p === 'player' ? `You stole ${stolenCard.name} (${stolenColor}) with Sly Deal` : `AI stole your ${stolenCard.name} (${stolenColor}) with Sly Deal`)

  const winner = checkWinCondition(s)
  if (winner) s = { ...s, turnPhase: { type: 'gameOver', winner } }
  return s
}

/** Play Forced Deal — transition to swap selection (or JSN offer). */
export function playForcedDeal(state: MonopolyDealState, cardId: string): MonopolyDealState {
  const p = state.currentTurn
  const ps = getPlayer(state, p)
  const card = ps.hand.find((c) => c.id === cardId)
  if (!card) return state

  const myStealable = getStealableProperties(ps)
  const oppStealable = getStealableProperties(getPlayer(state, opponent(p)))
  if (myStealable.length === 0 || oppStealable.length === 0) return state

  const newPs = removeFromHand(ps, cardId)
  let s = setPlayer(state, p, newPs)
  s = { ...s, discardPile: [...s.discardPile, card], playsUsedThisTurn: state.playsUsedThisTurn + 1 }
  s = addLog(s, p, p === 'player' ? 'You played Forced Deal' : 'AI played Forced Deal')

  // Offer JSN to defender
  const jsnState = tryOfferJSN(s, card, p)
  if (jsnState) return jsnState

  return { ...s, turnPhase: { type: 'awaitingForcedDealSelect', phase: 'give' } }
}

/** Complete Forced Deal — swap your property for opponent's. */
export function completeForcedDeal(
  state: MonopolyDealState,
  yourCardId: string,
  theirCardId: string,
): MonopolyDealState {
  const p = state.currentTurn
  const opp = opponent(p)

  let myState = getPlayer(state, p)
  let oppState = getPlayer(state, opp)

  // Find your card
  let yourCard: MonopolyCardData | null = null
  let yourColor: PropertyColor | null = null
  for (const group of myState.field) {
    if (isCompleteSet(group)) continue
    const idx = group.cards.findIndex((c) => c.id === yourCardId)
    if (idx >= 0) {
      yourCard = group.cards[idx]
      yourColor = group.color
      break
    }
  }

  // Find their card
  let theirCard: MonopolyCardData | null = null
  let theirColor: PropertyColor | null = null
  for (const group of oppState.field) {
    if (isCompleteSet(group)) continue
    const idx = group.cards.findIndex((c) => c.id === theirCardId)
    if (idx >= 0) {
      theirCard = group.cards[idx]
      theirColor = group.color
      break
    }
  }

  if (!yourCard || !yourColor || !theirCard || !theirColor) return state

  // Remove from both sides
  myState = removeCardFromField(myState, yourCardId)
  oppState = removeCardFromField(oppState, theirCardId)

  // Add swapped cards
  myState = addPropertyToField(myState, theirCard, theirColor)
  oppState = addPropertyToField(oppState, yourCard, yourColor)

  let s = setPlayer(state, p, myState)
  s = setPlayer(s, opp, oppState)

  const remaining = 3 - s.playsUsedThisTurn
  s = { ...s, turnPhase: { type: 'play', playsRemaining: remaining } }
  s = addLog(s, p, p === 'player' ? `You swapped ${yourCard.name} for ${theirCard.name} with Forced Deal` : `AI swapped ${yourCard.name} for your ${theirCard.name} with Forced Deal`)

  const winner = checkWinCondition(s)
  if (winner) s = { ...s, turnPhase: { type: 'gameOver', winner } }
  return s
}

function removeCardFromField(ps: PlayerState, cardId: string): PlayerState {
  const newField = ps.field.map((g) => ({
    ...g,
    cards: g.cards.filter((c) => c.id !== cardId),
  })).filter((g) => g.cards.length > 0 || g.buildings.length > 0)
  return { ...ps, field: newField }
}

function addGroupToField(ps: PlayerState, group: PropertyGroup): PlayerState {
  const idx = ps.field.findIndex((g) => g.color === group.color)
  if (idx < 0) {
    return {
      ...ps,
      field: [
        ...ps.field,
        {
          ...group,
          cards: [...group.cards],
          buildings: [...group.buildings],
        },
      ],
    }
  }

  const existing = ps.field[idx]
  // Merge buildings, but enforce max 1 House + 1 Hotel (no duplicates)
  const allBuildings = [...existing.buildings, ...group.buildings]
  const mergedBuildings: MonopolyCardData[] = []
  const excessBuildings: MonopolyCardData[] = []
  let hasHouse = false
  let hasHotel = false
  for (const b of allBuildings) {
    if (b.name === 'House' && !hasHouse) { mergedBuildings.push(b); hasHouse = true }
    else if (b.name === 'Hotel' && !hasHotel) { mergedBuildings.push(b); hasHotel = true }
    else excessBuildings.push(b)
  }

  const newField = [...ps.field]
  newField[idx] = {
    ...existing,
    cards: [...existing.cards, ...group.cards],
    buildings: mergedBuildings,
  }
  // Excess duplicate buildings go to bank
  return { ...ps, field: newField, bank: [...ps.bank, ...excessBuildings] }
}

/** Play Deal Breaker — transition to set selection (or JSN offer). */
export function playDealBreaker(state: MonopolyDealState, cardId: string): MonopolyDealState {
  const p = state.currentTurn
  const ps = getPlayer(state, p)
  const card = ps.hand.find((c) => c.id === cardId)
  if (!card) return state

  const completeSets = getCompleteSetColors(getPlayer(state, opponent(p)))
  if (completeSets.length === 0) return state

  const newPs = removeFromHand(ps, cardId)
  let s = setPlayer(state, p, newPs)
  s = { ...s, discardPile: [...s.discardPile, card], playsUsedThisTurn: state.playsUsedThisTurn + 1 }
  s = addLog(s, p, p === 'player' ? 'You played Deal Breaker!' : 'AI played Deal Breaker!')

  // Offer JSN to defender
  const jsnState = tryOfferJSN(s, card, p)
  if (jsnState) return jsnState

  // Auto-select if opponent has exactly one complete set
  if (completeSets.length === 1) {
    return completeDealBreaker(s, completeSets[0])
  }

  return { ...s, turnPhase: { type: 'awaitingDealBreakerTarget' } }
}

/** Complete Deal Breaker — steal a complete set. */
export function completeDealBreaker(state: MonopolyDealState, targetColor: PropertyColor): MonopolyDealState {
  const p = state.currentTurn
  const opp = opponent(p)
  let oppState = getPlayer(state, opp)

  const groupIdx = oppState.field.findIndex((g) => g.color === targetColor && isCompleteSet(g))
  if (groupIdx < 0) return state

  const stolenGroup = oppState.field[groupIdx]
  const newOppField = oppState.field.filter((_, i) => i !== groupIdx)
  oppState = { ...oppState, field: newOppField }

  let myState = getPlayer(state, p)
  // Add the stolen group (all cards + buildings) to our field, merging same-color groups.
  myState = addGroupToField(myState, stolenGroup)

  let s = setPlayer(state, p, myState)
  s = setPlayer(s, opp, oppState)

  const remaining = 3 - s.playsUsedThisTurn
  s = { ...s, turnPhase: { type: 'play', playsRemaining: remaining } }
  s = addLog(s, p, p === 'player' ? `Deal Breaker! You stole the complete ${targetColor} set!` : `AI stole your complete ${targetColor} set with Deal Breaker!`)

  const winner = checkWinCondition(s)
  if (winner) s = { ...s, turnPhase: { type: 'gameOver', winner } }
  return s
}

// ---------------------------------------------------------------------------
// Just Say No
// ---------------------------------------------------------------------------

/** Initiate a Just Say No chain against a pending action. */
export function initiateJSN(
  state: MonopolyDealState,
  pendingAction: PendingAction,
): MonopolyDealState {
  const target = opponent(pendingAction.sourcePlayer)
  const targetState = getPlayer(state, target)
  const jsnCard = targetState.hand.find((c) => c.name === 'Just Say No')

  if (!jsnCard) return state // No JSN available

  return {
    ...state,
    turnPhase: {
      type: 'awaitingJSN',
      jsnChain: {
        originalAction: pendingAction,
        chain: [],
        currentDecider: target,
      },
    },
  }
}

/** Play Just Say No in a chain. */
export function playJustSayNo(state: MonopolyDealState, jsnCardId: string): MonopolyDealState {
  if (state.turnPhase.type !== 'awaitingJSN') return state
  const { jsnChain } = state.turnPhase

  const decider = jsnChain.currentDecider
  let ps = getPlayer(state, decider)
  const card = ps.hand.find((c) => c.id === jsnCardId)
  if (!card) return state

  ps = removeFromHand(ps, jsnCardId)
  let s = setPlayer(state, decider, ps)
  s = { ...s, discardPile: [...s.discardPile, card] }

  const newChain = [...jsnChain.chain, { player: decider, jsnCardId }]
  s = {
    ...s,
    turnPhase: {
      type: 'awaitingJSN',
      jsnChain: {
        ...jsnChain,
        chain: newChain,
        currentDecider: opponent(decider),
      },
    },
  }
  s = addLog(s, decider, decider === 'player' ? 'You played Just Say No!' : 'AI played Just Say No!')
  return s
}

/** Accept the outcome of a JSN chain (don't counter). */
export function acceptJSNOutcome(state: MonopolyDealState): MonopolyDealState {
  if (state.turnPhase.type !== 'awaitingJSN') return state
  const { jsnChain } = state.turnPhase

  // Odd chain = action blocked, even chain = action proceeds
  const actionBlocked = jsnChain.chain.length % 2 === 1

  if (actionBlocked) {
    // Action was blocked — return to play phase
    const remaining = 3 - state.playsUsedThisTurn
    let s: MonopolyDealState = { ...state, turnPhase: { type: 'play' as const, playsRemaining: remaining } }
    s = addLog(s, jsnChain.currentDecider, 'Accepted — action blocked')
    return s
  }

  // Action proceeds — re-execute the original action's effect
  // For now, reconstruct the debt/steal based on the original action
  const action = jsnChain.originalAction
  return resolveActionAfterJSN(state, action)
}

function resolveActionAfterJSN(state: MonopolyDealState, action: PendingAction): MonopolyDealState {
  const p = action.sourcePlayer

  // If this came from useJSNDuringPayment, reconstruct the debt directly
  if (action.debtAmount != null && action.debtSource) {
    const debt: DebtInfo = {
      creditor: p,
      debtor: opponent(p),
      amount: action.debtAmount,
      source: action.debtSource,
      selectedPayment: [],
    }
    return { ...state, turnPhase: { type: 'awaitingPayment', debt } }
  }

  const ps = getPlayer(state, p)
  const card = action.actionCard

  switch (card.name) {
    case 'Debt Collector': {
      const debt: DebtInfo = { creditor: p, debtor: opponent(p), amount: 5, source: 'debtCollector', selectedPayment: [] }
      return { ...state, turnPhase: { type: 'awaitingPayment', debt } }
    }
    case "It's My Birthday": {
      const debt: DebtInfo = { creditor: p, debtor: opponent(p), amount: 2, source: 'birthday', selectedPayment: [] }
      return { ...state, turnPhase: { type: 'awaitingPayment', debt } }
    }
    case 'Sly Deal':
      return { ...state, turnPhase: { type: 'awaitingSlyDealTarget' } }
    case 'Forced Deal':
      return { ...state, turnPhase: { type: 'awaitingForcedDealSelect', phase: 'give' } }
    case 'Deal Breaker':
      return { ...state, turnPhase: { type: 'awaitingDealBreakerTarget' } }
    default: {
      // Rent or similar
      if (action.targetColor) {
        const doubled = !!action.doubleRentCardId
        const rentAmount = calculateRent(ps, action.targetColor, doubled)
        const debt: DebtInfo = { creditor: p, debtor: opponent(p), amount: rentAmount, source: 'rent', selectedPayment: [] }
        return { ...state, turnPhase: { type: 'awaitingPayment', debt } }
      }
      const remaining = 3 - state.playsUsedThisTurn
      return { ...state, turnPhase: { type: 'play', playsRemaining: remaining } }
    }
  }
}

// ---------------------------------------------------------------------------
// Turn management
// ---------------------------------------------------------------------------

/** End the current play phase. Checks for discard, then switches turns. */
export function endPlayPhase(state: MonopolyDealState): MonopolyDealState {
  const p = state.currentTurn
  const ps = getPlayer(state, p)

  // Check hand limit (7 cards)
  if (ps.hand.length > 7) {
    return {
      ...state,
      turnPhase: { type: 'discard', mustDiscard: ps.hand.length - 7 },
    }
  }

  // Switch turns
  return switchTurn(state)
}

/** Discard cards to get hand to 7. */
export function discardCards(state: MonopolyDealState, cardIds: string[]): MonopolyDealState {
  if (state.turnPhase.type !== 'discard') return state

  const p = state.currentTurn
  let ps = getPlayer(state, p)
  const discarded: MonopolyCardData[] = []

  for (const id of cardIds) {
    const card = ps.hand.find((c) => c.id === id)
    if (card) {
      discarded.push(card)
      ps = removeFromHand(ps, id)
    }
  }

  let s = setPlayer(state, p, ps)
  s = { ...s, discardPile: [...s.discardPile, ...discarded] }
  s = addLog(s, p, `Discarded ${discarded.length} card(s)`)

  if (ps.hand.length <= 7) {
    return switchTurn(s)
  }

  return { ...s, turnPhase: { type: 'discard', mustDiscard: ps.hand.length - 7 } }
}

function switchTurn(state: MonopolyDealState): MonopolyDealState {
  const next = opponent(state.currentTurn)
  return {
    ...state,
    currentTurn: next,
    turnPhase: { type: 'draw' },
    turnNumber: state.turnNumber + 1,
    playsUsedThisTurn: 0,
  }
}

// ---------------------------------------------------------------------------
// Wild Card Relocation (free action — does not consume a play)
// ---------------------------------------------------------------------------

/** Move a wild card from one color group to another on the current player's field. */
export function relocateWildOnField(
  state: MonopolyDealState,
  wildCardId: string,
  newColor: PropertyColor,
): MonopolyDealState {
  const p = state.currentTurn
  const ps = getPlayer(state, p)

  // Find the wild card in the player's field
  let foundCard: MonopolyCardData | null = null
  let sourceGroupIdx = -1
  for (let i = 0; i < ps.field.length; i++) {
    const card = ps.field[i].cards.find((c) => c.id === wildCardId)
    if (card && card.type === 'wild') {
      foundCard = card
      sourceGroupIdx = i
      break
    }
  }
  if (!foundCard || sourceGroupIdx < 0) return state

  const sourceGroup = ps.field[sourceGroupIdx]
  // No-op if same color
  if (sourceGroup.color === newColor) return state
  // Block relocation from complete sets with buildings — move buildings first
  if (isCompleteSet(sourceGroup) && sourceGroup.buildings.length > 0) return state
  // Block relocation into an already-complete target group
  const targetGroup = ps.field.find((g) => g.color === newColor)
  if (targetGroup && isCompleteSet(targetGroup)) return state

  // Remove wild from source group
  let newField = [...ps.field]
  const newSourceCards = sourceGroup.cards.filter((c) => c.id !== wildCardId)
  if (newSourceCards.length === 0) {
    // Remove empty group (drop any orphaned buildings to bank)
    const orphanedBuildings = sourceGroup.buildings
    newField = newField.filter((_, i) => i !== sourceGroupIdx)
    const newPs = { ...ps, field: newField, bank: [...ps.bank, ...orphanedBuildings] }
    // Add to target group
    const result = addPropertyToField(newPs, foundCard, newColor)
    let s = setPlayer(state, p, result)
    s = addLog(s, p, `Moved ${foundCard.name} from ${sourceGroup.color} to ${newColor}`)
    return s
  }

  newField[sourceGroupIdx] = { ...sourceGroup, cards: newSourceCards }
  const newPs = { ...ps, field: newField }
  // Add to target group
  const result = addPropertyToField(newPs, foundCard, newColor)
  let s = setPlayer(state, p, result)
  s = addLog(s, p, `Moved ${foundCard.name} from ${sourceGroup.color} to ${newColor}`)
  return s
}

/** Get wild cards on a player's field that can be relocated. */
export function getRelocatableWilds(state: MonopolyDealState, playerId: PlayerId): { cardId: string; currentColor: PropertyColor }[] {
  const ps = getPlayer(state, playerId)
  const result: { cardId: string; currentColor: PropertyColor }[] = []
  for (const group of ps.field) {
    // Skip wilds in complete sets that have buildings — move buildings first
    if (isCompleteSet(group) && group.buildings.length > 0) continue
    for (const card of group.cards) {
      if (card.type === 'wild') {
        result.push({ cardId: card.id, currentColor: group.color })
      }
    }
  }
  return result
}

// ---------------------------------------------------------------------------
// Building Relocation (free action — does not consume a play)
// ---------------------------------------------------------------------------

/** Get buildings on a player's field that can be relocated to another complete set. */
export function getRelocatableBuildings(
  state: MonopolyDealState,
  playerId: PlayerId,
): { cardId: string; currentColor: PropertyColor; buildingName: string }[] {
  const ps = getPlayer(state, playerId)
  const result: { cardId: string; currentColor: PropertyColor; buildingName: string }[] = []

  // Count how many complete sets (excluding railroad/utility) can accept each building type
  const completeSets = ps.field.filter(
    (g) => isCompleteSet(g) && g.color !== 'railroad' && g.color !== 'utility',
  )
  // Need at least 2 complete sets for relocation to make sense
  if (completeSets.length < 2) return result

  for (const group of completeSets) {
    for (const building of group.buildings) {
      // Check if there's at least one valid target set
      const hasTarget = completeSets.some((target) => {
        if (target.color === group.color) return false
        if (building.name === 'House') return !target.buildings.some((b) => b.name === 'House')
        if (building.name === 'Hotel') {
          return target.buildings.some((b) => b.name === 'House') && !target.buildings.some((b) => b.name === 'Hotel')
        }
        return false
      })
      if (hasTarget) {
        result.push({ cardId: building.id, currentColor: group.color, buildingName: building.name })
      }
    }
  }
  return result
}

/** Get valid target colors for relocating a specific building. */
export function getBuildingRelocationTargets(
  state: MonopolyDealState,
  playerId: PlayerId,
  buildingCardId: string,
  sourceColor: PropertyColor,
): PropertyColor[] {
  const ps = getPlayer(state, playerId)
  const sourceGroup = ps.field.find((g) => g.color === sourceColor)
  if (!sourceGroup) return []
  const building = sourceGroup.buildings.find((b) => b.id === buildingCardId)
  if (!building) return []

  const targets: PropertyColor[] = []
  for (const group of ps.field) {
    if (group.color === sourceColor) continue
    if (!isCompleteSet(group)) continue
    if (group.color === 'railroad' || group.color === 'utility') continue
    if (building.name === 'House' && !group.buildings.some((b) => b.name === 'House')) {
      targets.push(group.color)
    }
    if (building.name === 'Hotel' && group.buildings.some((b) => b.name === 'House') && !group.buildings.some((b) => b.name === 'Hotel')) {
      targets.push(group.color)
    }
  }
  return targets
}

/** Move a building from one complete set to another on the current player's field. */
export function relocateBuildingOnField(
  state: MonopolyDealState,
  buildingCardId: string,
  targetColor: PropertyColor,
): MonopolyDealState {
  const p = state.currentTurn
  const ps = getPlayer(state, p)

  // Find the building in the player's field
  let foundBuilding: MonopolyCardData | null = null
  let sourceGroupIdx = -1
  for (let i = 0; i < ps.field.length; i++) {
    const building = ps.field[i].buildings.find((b) => b.id === buildingCardId)
    if (building) {
      foundBuilding = building
      sourceGroupIdx = i
      break
    }
  }
  if (!foundBuilding || sourceGroupIdx < 0) return state

  const sourceGroup = ps.field[sourceGroupIdx]
  if (!isCompleteSet(sourceGroup)) return state
  if (sourceGroup.color === targetColor) return state

  // Find target group
  const targetGroupIdx = ps.field.findIndex((g) => g.color === targetColor)
  if (targetGroupIdx < 0) return state
  const targetGroup = ps.field[targetGroupIdx]
  if (!isCompleteSet(targetGroup)) return state
  if (targetGroup.color === 'railroad' || targetGroup.color === 'utility') return state

  // Validate placement
  if (foundBuilding.name === 'House' && targetGroup.buildings.some((b) => b.name === 'House')) return state
  if (foundBuilding.name === 'Hotel') {
    if (!targetGroup.buildings.some((b) => b.name === 'House')) return state
    if (targetGroup.buildings.some((b) => b.name === 'Hotel')) return state
  }

  // Move building
  const newField = [...ps.field]
  newField[sourceGroupIdx] = {
    ...sourceGroup,
    buildings: sourceGroup.buildings.filter((b) => b.id !== buildingCardId),
  }
  newField[targetGroupIdx] = {
    ...targetGroup,
    buildings: [...targetGroup.buildings, foundBuilding],
  }

  const newPs = { ...ps, field: newField }
  let s = setPlayer(state, p, newPs)
  s = addLog(s, p, `Moved ${foundBuilding.name} from ${sourceGroup.color} to ${targetColor}`)
  return s
}

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

export function serializeState(state: MonopolyDealState): string {
  return JSON.stringify(state)
}

export function deserializeState(json: string): MonopolyDealState {
  return JSON.parse(json) as MonopolyDealState
}
