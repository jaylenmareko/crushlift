import type { WorkoutHistoryEntry } from '../types'

export const RANKS = [
  { name: 'Rookie',  minXP: 0,     color: '#636366', abbr: 'RK' },
  { name: 'Grinder', minXP: 500,   color: '#9A9AAA', abbr: 'GR' },
  { name: 'Iron',    minXP: 1500,  color: '#94A3B8', abbr: 'IR' },
  { name: 'Bronze',  minXP: 3500,  color: '#CD7F32', abbr: 'BR' },
  { name: 'Silver',  minXP: 7500,  color: '#C0C0C0', abbr: 'SV' },
  { name: 'Gold',    minXP: 15000, color: '#F59E0B', abbr: 'GD' },
  { name: 'Elite',   minXP: 30000, color: '#818CF8', abbr: 'EL' },
  { name: 'Legend',  minXP: 60000, color: '#FF4500', abbr: 'LG' },
] as const

export type Rank = (typeof RANKS)[number]

const XP_PER_WORKOUT = 50
const XP_PER_COMPLETED_SET = 3
const XP_PER_PR = 20

export function computeTotalXP(history: WorkoutHistoryEntry[]): number {
  let xp = 0
  const bests: Record<string, number> = {}

  ;[...history].reverse().forEach(session => {
    xp += XP_PER_WORKOUT
    session.exercises.forEach(ex => {
      const completed = ex.sets.filter(s => s.completed)
      xp += completed.length * XP_PER_COMPLETED_SET
      const maxW = completed.length ? Math.max(0, ...completed.map(s => s.weight ?? 0)) : 0
      if (maxW > 0) {
        if (bests[ex.name] !== undefined && maxW > bests[ex.name]) {
          xp += XP_PER_PR
        }
        bests[ex.name] = Math.max(bests[ex.name] ?? 0, maxW)
      }
    })
  })
  return xp
}

export function computeSessionXP(
  session: WorkoutHistoryEntry,
  priorHistory: WorkoutHistoryEntry[]
): { total: number; base: number; setsXP: number; prsXP: number; prNames: string[] } {
  const bests: Record<string, number> = {}
  priorHistory.forEach(s =>
    s.exercises.forEach(ex => {
      const completed = ex.sets.filter(s => s.completed)
      const maxW = completed.length ? Math.max(0, ...completed.map(s => s.weight ?? 0)) : 0
      if (maxW > 0) bests[ex.name] = Math.max(bests[ex.name] ?? 0, maxW)
    })
  )

  let setsXP = 0
  let prsXP = 0
  const prNames: string[] = []

  session.exercises.forEach(ex => {
    const completed = ex.sets.filter(s => s.completed)
    setsXP += completed.length * XP_PER_COMPLETED_SET
    const maxW = completed.length ? Math.max(0, ...completed.map(s => s.weight ?? 0)) : 0
    if (maxW > 0 && bests[ex.name] !== undefined && maxW > bests[ex.name]) {
      prsXP += XP_PER_PR
      prNames.push(ex.name)
    }
  })

  return { total: XP_PER_WORKOUT + setsXP + prsXP, base: XP_PER_WORKOUT, setsXP, prsXP, prNames }
}

export function getRankInfo(xp: number): {
  rank: Rank
  nextRank: Rank | null
  progress: number
  xpToNext: number
  rankIndex: number
} {
  let rankIndex = 0
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXP) { rankIndex = i; break }
  }
  const rank = RANKS[rankIndex]
  const nextRank = rankIndex < RANKS.length - 1 ? RANKS[rankIndex + 1] : null

  if (!nextRank) return { rank, nextRank: null, progress: 1, xpToNext: 0, rankIndex }

  const xpInRange = xp - rank.minXP
  const rangeSize = nextRank.minXP - rank.minXP
  return {
    rank,
    nextRank,
    progress: xpInRange / rangeSize,
    xpToNext: nextRank.minXP - xp,
    rankIndex,
  }
}

export function computeStreak(history: WorkoutHistoryEntry[]): number {
  if (!history.length) return 0
  const dates = [...new Set(history.map(h => h.date.slice(0, 10)))].sort().reverse()
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (dates[0] !== today && dates[0] !== yesterday) return 0
  let streak = 1
  for (let i = 1; i < dates.length; i++) {
    const a = new Date(dates[i - 1]).getTime()
    const b = new Date(dates[i]).getTime()
    if (Math.round((a - b) / 86400000) === 1) streak++
    else break
  }
  return streak
}
