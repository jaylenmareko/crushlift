// Shared belt/weight-class data + helpers — used by both /belts and /compete pages.

export function getWeightClass(w: number) {
  if (w < 135) return { index: 0, full: 'Lightweight  ·  < 135 lbs' }
  if (w < 151) return { index: 1, full: 'Light Middle  ·  135–150 lbs' }
  if (w < 176) return { index: 2, full: 'Middle  ·  150–175 lbs' }
  if (w < 201) return { index: 3, full: 'Light Heavy  ·  175–200 lbs' }
  if (w < 221) return { index: 4, full: 'Heavy  ·  200–220 lbs' }
  return { index: 5, full: 'Super Heavy  ·  220+ lbs' }
}

export const WEIGHT_CLASSES = [
  { label: '< 135',   full: 'Lightweight  ·  < 135 lbs' },
  { label: '135–150', full: 'Light Middle  ·  135–150 lbs' },
  { label: '150–175', full: 'Middle  ·  150–175 lbs' },
  { label: '175–200', full: 'Light Heavy  ·  175–200 lbs' },
  { label: '200–220', full: 'Heavy  ·  200–220 lbs' },
  { label: '220+',    full: 'Super Heavy  ·  220+ lbs' },
]

// Belt identity (name + color), best → worst. Thresholds are per-lift (see below).
export const TIERS = [
  { name: 'Legend', color: '#FFC107' },
  { name: 'Master', color: '#8B5CF6' },
  { name: 'Elite',  color: '#EF4444' },
  { name: 'Lifter', color: '#3B82F6' },
  { name: 'Bronze', color: '#22C55E' },
  { name: 'Iron',   color: '#636366' },
]

// Per-lift 1RM belt thresholds (lbs). Index aligns with TIERS [Legend, Master, Elite, Lifter, Bronze, Iron].
// Calibrated to ~180lb male bodyweight from StrengthLevel standards; Legend ≈ world-class, snapped to milestones.
export const WEIGHT_THRESHOLDS: Record<string, number[]> = {
  'Bench Press':    [405, 350, 285, 220, 165, 120],
  'Squat':          [525, 460, 375, 290, 220, 160],
  'Deadlift':       [605, 525, 430, 340, 260, 195],
  'Overhead Press': [275, 240, 190, 145, 105,  75],
  'Power Clean':    [375, 325, 265, 205, 155, 115],
}

// Pull-up is bodyweight → belt earned by rep count. Index aligns with TIERS.
export const PULLUP_REP_THRESHOLDS = [30, 22, 15, 10, 5, 1]

// Iron's gray (#636366) is too low-contrast for text/icons on dark cards, and also matches the
// "locked/unearned" gray (#9A9AAA) — brighten it further so an earned Iron belt is visibly distinct
export function displayColor(color: string) {
  return color === '#636366' ? '#D1D5DB' : color
}

export const UNRANKED = { name: 'Unranked', color: '#48484A', threshold: 0 }

// Belt maintenance — log a qualifying PR within this window or drop a tier
export const DECAY_DAYS = 60
export const WARNING_DAYS = 7

export type Lift = { name: string; best: number; bestReps: number | null; lastPrAt: string | null; type: 'barbell' | 'bodyweight' }

// The Big 6 — each earns its own belt independently. Real bests load from pr_verifications at mount.
export const BIG_SIX: Lift[] = [
  { name: 'Bench Press',    best: 0, bestReps: null, lastPrAt: null, type: 'barbell' },
  { name: 'Squat',          best: 0, bestReps: null, lastPrAt: null, type: 'barbell' },
  { name: 'Deadlift',       best: 0, bestReps: null, lastPrAt: null, type: 'barbell' },
  { name: 'Overhead Press', best: 0, bestReps: null, lastPrAt: null, type: 'barbell' },
  { name: 'Power Clean',    best: 0, bestReps: null, lastPrAt: null, type: 'barbell' },
  { name: 'Pull-up',        best: 0, bestReps: null, lastPrAt: null, type: 'bodyweight' },
]

// Highest tier index a lift's best clears (0 = Legend, best). -1 = below Iron.
// Pull-up is rep-based; every other lift uses 1RM weight.
export function getTierIndex(lift: { name: string; best: number; bestReps: number | null }) {
  const repBased = lift.name === 'Pull-up'
  const thresholds = repBased ? PULLUP_REP_THRESHOLDS : WEIGHT_THRESHOLDS[lift.name]
  if (!thresholds) return -1
  const value = repBased ? (lift.bestReps ?? 0) : lift.best
  for (let i = 0; i < thresholds.length; i++) {
    if (value >= thresholds[i]) return i
  }
  return -1
}

export function daysSince(dateStr: string) {
  const ms = Date.now() - new Date(dateStr).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

export function shortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
}

export function decayDate(lastPrAt: string) {
  const d = new Date(new Date(lastPrAt).getTime() + DECAY_DAYS * 86400000)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export type LiftWithTier = Lift & {
  tier: { name: string; color: string }
  tierIdx: number
  next: { name: string; color: string } | null
  daysAgo: number | null
  daysLeft: number | null
  demoted: boolean
  atRisk: boolean
  droppedFrom: string | null
}

// Applies decay: no qualifying PR within DECAY_DAYS drops a tier
export function computeLiftData(userLifts: Lift[]): LiftWithTier[] {
  return userLifts.map(l => {
    const baseTierIdx = getTierIndex(l)
    const daysAgo  = l.lastPrAt ? daysSince(l.lastPrAt) : null
    const daysLeft = daysAgo !== null ? DECAY_DAYS - daysAgo : null
    const demoted  = baseTierIdx !== -1 && daysLeft !== null && daysLeft < 0
    const atRisk   = !demoted && baseTierIdx !== -1 && daysLeft !== null && daysLeft <= WARNING_DAYS

    const tierIdx = demoted ? baseTierIdx + 1 : baseTierIdx
    const tier = tierIdx === -1 || tierIdx >= TIERS.length ? UNRANKED : TIERS[tierIdx]
    const nextIdx = tierIdx === -1 ? TIERS.length - 1 : tierIdx - 1
    const next = nextIdx >= 0 ? TIERS[nextIdx] : null
    const droppedFrom = demoted ? TIERS[baseTierIdx].name : null

    return { ...l, tier, tierIdx, next, daysAgo, daysLeft, demoted, atRisk, droppedFrom }
  })
}

export function bestOf(liftData: LiftWithTier[]) {
  return liftData.reduce((a, b) => {
    const ai = a.tierIdx === -1 ? Infinity : a.tierIdx
    const bi = b.tierIdx === -1 ? Infinity : b.tierIdx
    return bi < ai ? b : a
  })
}
