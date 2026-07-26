// Battle + Friends types and pure resolution logic.
// Mirrors the schema in artifacts/17-06-2026-battles-schema-draft.sql (not yet applied).
// Resolution is a pure function so it can be unit-tested and run client- or server-side.

import { superfightWinner } from './dots'

export type BattleFormat = 'weight' | 'reps'
export type BattleKind = 'class' | 'superfight'
export type BattleStatus = 'pending' | 'active' | 'completed' | 'declined' | 'expired'
export type FriendStatus = 'pending' | 'accepted'

export interface Battle {
  id: string
  challengerId: string
  opponentId: string
  lift: string
  format: BattleFormat
  kind: BattleKind
  status: BattleStatus
  challengerValue: number | null   // lbs (weight) or reps, per format
  opponentValue: number | null
  challengerPrId: string | null    // verified pr_verifications row backing the result
  opponentPrId: string | null
  challengerBw: number | null      // bodyweight snapshot (lbs) — for superfight DOTS
  opponentBw: number | null
  winnerId: string | null          // null + completed = draw
  createdAt: string
  respondedAt: string | null
  completedAt: string | null
}

export interface Friendship {
  id: string
  userId: string
  friendId: string
  status: FriendStatus
  createdAt: string
}

export type BattleResolution =
  | { outcome: 'challenger' | 'opponent'; winnerId: string }
  | { outcome: 'draw'; winnerId: null }
  | { outcome: 'incomplete'; winnerId: null }  // a side hasn't posted yet

/**
 * Decide a battle's winner from both posted results. Pure — no DB.
 *  - class fights: higher raw value wins (most weight or most reps).
 *  - superfights: DOTS-adjusted (uses bodyweight snapshots); falls back to raw if bw missing.
 */
export function resolveBattle(b: Battle): BattleResolution {
  if (b.challengerValue == null || b.opponentValue == null) {
    return { outcome: 'incomplete', winnerId: null }
  }

  let cmp: number  // >0 challenger wins, <0 opponent wins, 0 draw
  if (b.kind === 'superfight' && b.challengerBw != null && b.opponentBw != null && b.format === 'weight') {
    cmp = superfightWinner(
      { liftLbs: b.challengerValue, bodyweightLbs: b.challengerBw },
      { liftLbs: b.opponentValue,  bodyweightLbs: b.opponentBw },
    )
  } else {
    // raw comparison (class fights, and rep-format superfights which aren't size-scaled)
    cmp = Math.sign(b.challengerValue - b.opponentValue)
  }

  if (cmp > 0) return { outcome: 'challenger', winnerId: b.challengerId }
  if (cmp < 0) return { outcome: 'opponent',   winnerId: b.opponentId }
  return { outcome: 'draw', winnerId: null }
}
