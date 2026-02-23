import {
  Box, Typography, Divider, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip, LinearProgress,
} from '@mui/material'
import { PlayerField } from '../monopoly-deal/PlayerField'
import { PlayerHand } from '../monopoly-deal/PlayerHand'
import { MonopolyCard } from '../monopoly-deal/MonopolyCard'
import { BackButton } from './BackButton'
import { AppVersion } from './AppVersion'
import { useMonopolyDealLogic } from '../hooks/useMonopolyDealLogic'
import {
  COLOR_HEX,
  COLOR_LABEL,
  type PropertyColor,
  type MonopolyCardData,
} from '../monopoly-deal/cardData'
import {
  getStealableProperties,
  getCompleteSetColors,
  getPayableCards,
  getSelectedPaymentValue,
  canPlaceBuilding,
  canPlayCard,
} from '../monopoly-deal/gameEngine'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface MonopolyDealBoardProps {
  onBack: () => void
}

export function MonopolyDealBoard({ onBack }: MonopolyDealBoardProps): React.JSX.Element {
  const game = useMonopolyDealLogic()
  const {
    gameState,
    isLoading,
    playerHand,
    playerField,
    playerBank,
    aiField,
    aiBank,
    aiHandCount,
    drawPileCount,
    currentTurn,
    turnPhase,
    winner,
    isAIThinking,
    startNewGame,
    resumeGame,
    playCard,
    selectWildColor,
    selectRentColor,
    selectTarget,
    selectBuildingTarget,
    selectForcedDealGive,
    selectForcedDealTake,
    togglePaymentCard,
    confirmDebtPayment,
    respondJSN,
    acceptIncomingAction,
    discardCard,
    endTurn,
  } = game

  // ── Loading ──
  if (isLoading) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    )
  }

  // ── Start / Resume ──
  if (!gameState) {
    return (
      <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        <BackButton onClick={onBack} />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Monopoly Deal</Typography>
          <Button variant="contained" size="large" onClick={startNewGame} sx={{ minWidth: 200 }}>
            New Game
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={async () => {
              const found = await resumeGame()
              if (!found) startNewGame()
            }}
            sx={{ minWidth: 200 }}
          >
            Resume Game
          </Button>
        </Box>
      </Box>
    )
  }

  // ── Derived UI state ──
  const playableCardIds = currentTurn === 'player' && turnPhase.type === 'play'
    ? playerHand.filter((c) => canPlayCard(gameState, c.id).valid).map((c) => c.id)
    : []

  const opponentStealable = getStealableProperties(gameState.ai)
  const opponentCompleteSets = getCompleteSetColors(gameState.ai)
  const playerStealable = getStealableProperties(gameState.player)

  let opHighStacks: PropertyColor[] | undefined
  let opHighCards: string[] | undefined
  let opSelMode: 'stack' | 'card' | null = null
  let plHighCards: string[] | undefined
  let plSelMode: 'stack' | 'card' | null = null

  if (turnPhase.type === 'awaitingDealBreakerTarget') {
    opHighStacks = opponentCompleteSets
    opSelMode = 'stack'
  } else if (turnPhase.type === 'awaitingSlyDealTarget') {
    opHighCards = opponentStealable.map((t) => t.card.id)
    opSelMode = 'card'
  } else if (turnPhase.type === 'awaitingForcedDealSelect') {
    if (turnPhase.phase === 'give') {
      plHighCards = playerStealable.map((t) => t.card.id)
      plSelMode = 'card'
    } else {
      opHighCards = opponentStealable.map((t) => t.card.id)
      opSelMode = 'card'
    }
  }

  // ── Status text ──
  const statusText = getStatusText(winner, isAIThinking, currentTurn, turnPhase)

  // ── Building target colors ──
  const buildableColors: PropertyColor[] = []
  if (turnPhase.type === 'awaitingBuildingTarget') {
    const card = gameState.player.hand.find((c) => c.id === turnPhase.cardId)
    if (card) {
      for (const group of gameState.player.field) {
        if (canPlaceBuilding(card, group)) buildableColors.push(group.color)
      }
    }
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', position: 'relative' }}>
      <BackButton onClick={onBack} />

      <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', pt: 7 }}>
        {/* Status bar */}
        <Box sx={{ px: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: winner ? 'success.main' : 'text.primary' }}>
            {statusText}
          </Typography>
          <Chip label={`Turn ${gameState.turnNumber}`} size="small" variant="outlined" />
        </Box>
        {isAIThinking && <LinearProgress sx={{ mx: 2, mb: 1 }} />}

        {/* Opponent */}
        <Box sx={{ px: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', display: 'block', mb: 0.5, transform: 'rotate(180deg)' }}>
            AI ({aiHandCount} cards)
          </Typography>
          <PlayerField
            stacks={aiField}
            moneyCards={aiBank}
            isOpponent
            onStackClick={(color) => {
              if (turnPhase.type === 'awaitingDealBreakerTarget') selectTarget(color)
            }}
            onCardClick={(cardId) => {
              if (turnPhase.type === 'awaitingSlyDealTarget') selectTarget(cardId)
              if (turnPhase.type === 'awaitingForcedDealSelect' && turnPhase.phase === 'take') selectForcedDealTake(cardId)
            }}
            highlightedStacks={opHighStacks}
            highlightedCards={opHighCards}
            selectionMode={opSelMode}
          />
        </Box>

        {/* Center */}
        <Divider sx={{ my: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', px: 1 }}>
            Draw ({drawPileCount})
          </Typography>
        </Divider>

        {/* Player field */}
        <Box sx={{ px: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', display: 'block', mb: 0.5 }}>
            Your Field
          </Typography>
          <PlayerField
            stacks={playerField}
            moneyCards={playerBank}
            onCardClick={(cardId) => {
              if (turnPhase.type === 'awaitingForcedDealSelect' && turnPhase.phase === 'give') selectForcedDealGive(cardId)
            }}
            highlightedCards={plHighCards}
            selectionMode={plSelMode}
          />
        </Box>

        {/* Action bar */}
        {currentTurn === 'player' && turnPhase.type === 'play' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, py: 1, px: 2 }}>
            <Button variant="outlined" size="small" onClick={endTurn}>End Turn</Button>
          </Box>
        )}

        {/* Player hand */}
        <Divider sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', px: 1 }}>
            Your Hand ({playerHand.length})
          </Typography>
        </Divider>
        <PlayerHand
          cards={playerHand}
          onCardClick={
            turnPhase.type === 'discard'
              ? (cardId) => discardCard(cardId)
              : turnPhase.type === 'play' && currentTurn === 'player'
                ? (cardId) => playCard(cardId)
                : undefined
          }
          playableCardIds={turnPhase.type === 'play' ? playableCardIds : undefined}
        />

        <AppVersion />
      </Box>

      {/* ── Dialogs ── */}

      <ColorPickerDialog
        open={turnPhase.type === 'awaitingWildColor' && currentTurn === 'player'}
        title="Choose Color"
        colors={turnPhase.type === 'awaitingWildColor' ? getWildColors(gameState, turnPhase.cardId) : []}
        onSelect={selectWildColor}
      />

      <ColorPickerDialog
        open={turnPhase.type === 'awaitingRentColor' && currentTurn === 'player'}
        title="Charge Rent for..."
        colors={turnPhase.type === 'awaitingRentColor' ? getRentColors(gameState, turnPhase.cardId) : []}
        onSelect={selectRentColor}
      />

      <ColorPickerDialog
        open={turnPhase.type === 'awaitingBuildingTarget' && currentTurn === 'player'}
        title="Build on which set?"
        colors={buildableColors}
        onSelect={selectBuildingTarget}
      />

      <PaymentDialog
        open={turnPhase.type === 'awaitingPayment' && turnPhase.debt.debtor === 'player' && !isAIThinking}
        debt={turnPhase.type === 'awaitingPayment' ? turnPhase.debt : null}
        player={gameState.player}
        onToggle={togglePaymentCard}
        onConfirm={confirmDebtPayment}
      />

      <JSNDialog
        open={turnPhase.type === 'awaitingJSN' && !isAIThinking && (turnPhase.jsnChain.currentDecider === 'player')}
        hasJSN={playerHand.some((c) => c.name === 'Just Say No')}
        onUseJSN={() => {
          const jsn = playerHand.find((c) => c.name === 'Just Say No')
          if (jsn) respondJSN(jsn.id)
        }}
        onAccept={acceptIncomingAction}
      />

      <Dialog open={!!winner}>
        <DialogTitle>{winner === 'player' ? 'You Win!' : 'AI Wins!'}</DialogTitle>
        <DialogContent>
          <Typography>
            {winner === 'player'
              ? 'Congratulations! You collected 3 complete property sets!'
              : 'The AI collected 3 complete property sets. Better luck next time!'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onBack}>Back to Menu</Button>
          <Button variant="contained" onClick={startNewGame}>New Game</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ColorPickerDialog({
  open, title, colors, onSelect,
}: {
  open: boolean; title: string; colors: PropertyColor[]; onSelect: (c: PropertyColor) => void
}): React.JSX.Element {
  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
          {colors.map((color) => (
            <Button
              key={color}
              variant="contained"
              onClick={() => onSelect(color)}
              sx={{
                bgcolor: COLOR_HEX[color],
                color: isLight(COLOR_HEX[color]) ? '#000' : '#fff',
                '&:hover': { bgcolor: COLOR_HEX[color], opacity: 0.85 },
                minWidth: 100,
                fontWeight: 700,
              }}
            >
              {COLOR_LABEL[color]}
            </Button>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  )
}

function PaymentDialog({
  open, debt, player, onToggle, onConfirm,
}: {
  open: boolean
  debt: { amount: number; selectedPayment: string[] } | null
  player: { hand: MonopolyCardData[]; field: { color: PropertyColor; cards: MonopolyCardData[]; buildings: MonopolyCardData[] }[]; bank: MonopolyCardData[] }
  onToggle: (id: string) => void
  onConfirm: () => void
}): React.JSX.Element {
  if (!debt) return <></>
  const payable = getPayableCards(player)
  const selectedValue = getSelectedPaymentValue(player, debt.selectedPayment)
  const totalValue = payable.reduce((s, c) => s + c.value, 0)

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>Pay M{debt.amount}M</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Selected: M{selectedValue}M / M{debt.amount}M
          {totalValue < debt.amount && ' (pay everything you have)'}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
          {payable.map((card) => (
            <Box
              key={card.id}
              onClick={() => onToggle(card.id)}
              sx={{
                cursor: 'pointer',
                outline: debt.selectedPayment.includes(card.id) ? '2px solid #1976d2' : 'none',
                borderRadius: '4px',
                opacity: debt.selectedPayment.includes(card.id) ? 1 : 0.7,
              }}
            >
              <MonopolyCard card={card} size={0.8} />
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={selectedValue < debt.amount && selectedValue < totalValue}
        >
          Pay
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function JSNDialog({
  open, hasJSN, onUseJSN, onAccept,
}: {
  open: boolean; hasJSN: boolean; onUseJSN: () => void; onAccept: () => void
}): React.JSX.Element {
  return (
    <Dialog open={open}>
      <DialogTitle>Action played against you!</DialogTitle>
      <DialogContent>
        <Typography>
          {hasJSN
            ? 'You have a Just Say No card. Block this action?'
            : "You don't have a Just Say No card."}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onAccept}>Accept</Button>
        {hasJSN && (
          <Button variant="contained" color="error" onClick={onUseJSN}>Just Say No!</Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isLight(hex: string): boolean {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 160
}

function getStatusText(
  winner: string | null,
  isAIThinking: boolean,
  currentTurn: string,
  turnPhase: { type: string; playsRemaining?: number; mustDiscard?: number; debt?: { amount: number }; phase?: string },
): string {
  if (winner) return winner === 'player' ? 'You Win!' : 'AI Wins!'
  if (isAIThinking) return 'AI is thinking...'
  if (currentTurn !== 'player') return "AI's turn"
  switch (turnPhase.type) {
    case 'draw': return 'Draw phase'
    case 'play': return `Your turn — ${turnPhase.playsRemaining} play(s) left`
    case 'discard': return `Discard ${turnPhase.mustDiscard} card(s)`
    case 'awaitingPayment': return `Pay M${turnPhase.debt?.amount}M`
    case 'awaitingJSN': return 'Play Just Say No?'
    case 'awaitingWildColor': return 'Choose a color'
    case 'awaitingRentColor': return 'Choose rent color'
    case 'awaitingDealBreakerTarget': return 'Choose a set to steal'
    case 'awaitingSlyDealTarget': return 'Choose a property to steal'
    case 'awaitingForcedDealSelect': return turnPhase.phase === 'give' ? 'Choose your property to give' : 'Choose their property to take'
    case 'awaitingBuildingTarget': return 'Choose a set to build on'
    default: return ''
  }
}

function getWildColors(state: MonopolyDealState, cardId: string): PropertyColor[] {
  const card = state.player.hand.find((c) => c.id === cardId)
  if (!card) return []
  if (card.color && card.color2) return [card.color, card.color2]
  return ['brown', 'lightBlue', 'pink', 'orange', 'red', 'yellow', 'green', 'darkBlue', 'railroad', 'utility']
}

function getRentColors(state: MonopolyDealState, cardId: string): PropertyColor[] {
  const card = state.player.hand.find((c) => c.id === cardId) ??
    state.discardPile.find((c) => c.id === cardId)
  if (!card) return []
  if (card.color && card.color2) return [card.color, card.color2]
  return state.player.field.map((g) => g.color)
}

// Re-import for type usage in helper functions
type MonopolyDealState = import('../monopoly-deal/gameEngine').MonopolyDealState
