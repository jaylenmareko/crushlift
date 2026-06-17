'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Swords, Crown, ChevronRight, Check, X, ArrowUp, Flame, Trophy } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import WeightGate from '@/components/WeightGate'
import { useUserWeight } from '@/lib/hooks/useUserWeight'
import { WEIGHT_CLASSES, BIG_SIX } from '@/lib/belts'

const RANKINGS_DATA: Record<number, { pos: number; name: string; record: string; you: boolean; streak?: number; trend?: number }[]> = {
  0: [
    { pos: 1, name: 'Cam R.',    record: '14-2', you: false },
    { pos: 2, name: 'Devon L.',  record: '11-4', you: false },
    { pos: 3, name: 'Nate P.',   record: '8-5',  you: false },
  ],
  1: [
    { pos: 1, name: 'Leon T.',   record: '18-1', you: false },
    { pos: 2, name: 'Jax M.',    record: '12-3', you: false },
    { pos: 3, name: 'Benny A.',  record: '9-4',  you: false },
    { pos: 4, name: 'Gus W.',    record: '6-6',  you: false },
  ],
  2: [
    { pos: 1, name: 'Marcus T.', record: '21-2', you: false, streak: 8 },
    { pos: 2, name: 'Dre W.',    record: '15-5', you: false, streak: 4 },
    { pos: 3, name: 'Kyle B.',   record: '10-4', you: false },
    { pos: 4, name: 'You',       record: '2-1',  you: true,  trend: 2 },
    { pos: 5, name: 'Jordan S.', record: '2-2',  you: false },
    { pos: 6, name: 'Tyler M.',  record: '1-3',  you: false },
    { pos: 7, name: 'Chris A.',  record: '0-2',  you: false },
  ],
  3: [
    { pos: 1, name: 'Big K.',    record: '22-0', you: false },
    { pos: 2, name: 'Will H.',   record: '14-3', you: false },
    { pos: 3, name: 'Andre M.',  record: '9-5',  you: false },
  ],
  4: [
    { pos: 1, name: 'Tank G.',   record: '30-1', you: false },
    { pos: 2, name: 'Hector V.', record: '19-4', you: false },
    { pos: 3, name: 'Duke R.',   record: '11-6', you: false },
  ],
  5: [
    { pos: 1, name: 'Goliath.', record: '25-0', you: false },
    { pos: 2, name: 'Rex J.',   record: '18-3', you: false },
    { pos: 3, name: 'Bull C.',  record: '12-5', you: false },
  ],
}

// Incoming challenges awaiting your response — the urgent, can't-miss layer.
const PENDING_CHALLENGES: { from: string; lift: string; format: 'weight' | 'reps' }[] = [
  { from: 'Marcus T.', lift: 'Squat', format: 'weight' },
]

// Open / pound-for-pound board — everyone across all classes (cls = weight-class index).
// Fights here are superfights, scored size-adjusted (DOTS) so a smaller lifter can win.
const OPEN_RANKINGS: { pos: number; name: string; cls: number; record: string; you: boolean; streak?: number }[] = [
  { pos: 1, name: 'Tank G.',   cls: 4, record: '30-1', you: false, streak: 12 },
  { pos: 2, name: 'Goliath',   cls: 5, record: '25-0', you: false, streak: 9 },
  { pos: 3, name: 'Big K.',    cls: 3, record: '22-0', you: false, streak: 7 },
  { pos: 4, name: 'Marcus T.', cls: 2, record: '21-2', you: false, streak: 8 },
  { pos: 5, name: 'Leon T.',   cls: 1, record: '18-1', you: false },
  { pos: 6, name: 'Cam R.',    cls: 0, record: '14-2', you: false },
  { pos: 7, name: 'You',       cls: 2, record: '2-1',  you: true },
]

function shortClassName(full: string) {
  return full.split('·')[0].trim()
}

// Initials for avatars: "Marcus T." -> "MT", "You" -> "Y"
function initials(name: string) {
  const p = name.replace(/\./g, '').trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase()
}

// Deterministic avatar color from a name
const AVATAR_COLORS = ['#3B82F6', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899']
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

export default function CompetePage() {
  const {
    userWeight, selectedClass,
    weightInput, setWeightInput, weightLoading,
    savingWeight, weightError, saveWeight,
  } = useUserWeight()

  const [challengeOpponent, setChallengeOpponent] = useState<string | null>(null)
  const [challengeSuperfight, setChallengeSuperfight] = useState(false)
  const [challengeOpen, setChallengeOpen] = useState(false)
  const [challengeLift, setChallengeLift] = useState<string | null>(null)
  const [challengeFormat, setChallengeFormat] = useState<'weight' | 'reps'>('weight')
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)
  const [boardView, setBoardView] = useState<'class' | 'open'>('class')

  const rankings  = RANKINGS_DATA[selectedClass] ?? []
  const youIdx    = rankings.findIndex(r => r.you)
  const yourEntry = youIdx >= 0 ? rankings[youIdx] : null
  const rival     = youIdx > 0 ? rankings[youIdx - 1] : null  // person one spot above you
  const [yWins, yLosses] = (yourEntry?.record ?? '0-0').split('-')

  function openChallenge(name: string | null, superfight = false) {
    setChallengeOpponent(name)
    setChallengeSuperfight(superfight)
    setChallengeLift(null)
    setChallengeFormat('weight')
    setChallengeOpen(true)
  }

  const renderLeaderRow = (entry: (typeof rankings)[number], i: number) => {
    const rankColor =
      entry.pos === 1 ? '#FFC107' :
      entry.pos === 2 ? '#D1D5DB' :
      entry.pos === 3 ? '#F59E0B' : '#636366'
    const isRival = rival?.pos === entry.pos
    const av = entry.you ? '#FF4500' : avatarColor(entry.name)
    const rowStyle =
      entry.you  ? { backgroundColor: '#FF450014', borderColor: '#FF450045' }
      : isRival  ? { backgroundColor: '#FF45000F', borderColor: '#FF450033' }
      : entry.pos <= 3 ? { backgroundColor: `${rankColor}12`, borderColor: 'transparent' }
      : { backgroundColor: '#25252880', borderColor: 'transparent' }
    return (
      <motion.button
        key={entry.pos}
        disabled={entry.you}
        whileTap={entry.you ? undefined : { scale: 0.98 }}
        onClick={() => { if (!entry.you) { setLeaderboardOpen(false); openChallenge(entry.name) } }}
        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
        className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-left border"
        style={rowStyle}
      >
        <div className="w-5 flex items-center justify-center flex-shrink-0">
          {entry.pos === 1
            ? <Crown className="w-4 h-4" style={{ color: rankColor }} />
            : <span className="text-xs font-black tabular-nums" style={{ color: rankColor }}>{entry.pos}</span>}
        </div>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-black"
          style={{ backgroundColor: `${av}22`, color: av, border: `1.5px solid ${av}55` }}
        >
          {initials(entry.you ? 'You' : entry.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{entry.you ? 'You' : entry.name}</p>
          {isRival
            ? <p className="text-[10px] font-bold text-[#FF4500] uppercase tracking-wider">Rival · one spot up</p>
            : (entry.streak ?? 0) >= 3
              ? <p className="flex items-center gap-0.5 text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider"><Flame className="w-3 h-3" />{entry.streak} win streak</p>
              : null}
        </div>
        <span className="text-sm font-bold tabular-nums text-[#9A9AAA]">{entry.record}</span>
        {entry.you ? null : isRival
          ? <motion.span animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} className="text-[10px] font-black text-white px-2.5 py-1.5 rounded-lg bg-[#FF4500] flex items-center gap-1 flex-shrink-0 shadow-[0_2px_12px_rgba(255,69,0,0.4)]"><Swords className="w-3 h-3" />FIGHT</motion.span>
          : <Swords className="w-3.5 h-3.5 text-[#48484A] flex-shrink-0" />}
      </motion.button>
    )
  }

  const renderOpenRow = (entry: (typeof OPEN_RANKINGS)[number], i: number) => {
    const rankColor =
      entry.pos === 1 ? '#FFC107' :
      entry.pos === 2 ? '#D1D5DB' :
      entry.pos === 3 ? '#F59E0B' : '#636366'
    const av = entry.you ? '#FF4500' : avatarColor(entry.name)
    const sameClass = entry.cls === selectedClass
    const rowStyle =
      entry.you ? { backgroundColor: '#FF450014', borderColor: '#FF450045' }
      : entry.pos <= 3 ? { backgroundColor: `${rankColor}12`, borderColor: 'transparent' }
      : { backgroundColor: '#25252880', borderColor: 'transparent' }
    return (
      <motion.button
        key={entry.pos}
        disabled={entry.you}
        whileTap={entry.you ? undefined : { scale: 0.98 }}
        onClick={() => { if (!entry.you) { setLeaderboardOpen(false); openChallenge(entry.name, !sameClass) } }}
        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
        className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-left border"
        style={rowStyle}
      >
        <div className="w-5 flex items-center justify-center flex-shrink-0">
          {entry.pos === 1
            ? <Crown className="w-4 h-4" style={{ color: rankColor }} />
            : <span className="text-xs font-black tabular-nums" style={{ color: rankColor }}>{entry.pos}</span>}
        </div>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-black"
          style={{ backgroundColor: `${av}22`, color: av, border: `1.5px solid ${av}55` }}
        >
          {initials(entry.you ? 'You' : entry.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-white truncate">{entry.you ? 'You' : entry.name}</p>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#252528] text-[#9A9AAA] uppercase tracking-wider flex-shrink-0">{shortClassName(WEIGHT_CLASSES[entry.cls].full)}</span>
          </div>
          {(entry.streak ?? 0) >= 5 && <p className="flex items-center gap-0.5 text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider mt-0.5"><Flame className="w-3 h-3" />{entry.streak} win streak</p>}
        </div>
        <span className="text-sm font-bold tabular-nums text-[#9A9AAA]">{entry.record}</span>
        {entry.you ? null : <Swords className="w-3.5 h-3.5 text-[#48484A] flex-shrink-0" />}
      </motion.button>
    )
  }

  if (weightLoading) return (
    <div className="mobile-container flex items-center justify-center min-h-dvh bg-[#0D0D0F]">
      <div className="w-8 h-8 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!userWeight) return (
    <WeightGate
      active="compete"
      weightInput={weightInput}
      setWeightInput={setWeightInput}
      weightError={weightError}
      savingWeight={savingWeight}
      onSave={saveWeight}
    />
  )

  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0D0D0F] has-bottom-nav relative overflow-hidden">
      {/* Top glow — arena energy */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[420px] h-[220px] bg-[#FF4500]/8 blur-[110px] pointer-events-none rounded-full" />

      <header className="px-5 pt-12 pb-3 relative">
        <p className="text-[10px] font-bold text-[#FF4500] uppercase tracking-[0.2em]">Power Rank</p>
        <h1 className="text-2xl font-bold leading-none">Compete</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-3 relative">

        {/* HERO — where you stand + the climb hook */}
        <div className="rounded-2xl bg-[#1C1C1E] border border-[#252528] overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#F59E0B] via-[#FF4500] to-[#FF4500]" />
          <div className="p-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-[11px] font-bold text-[#9A9AAA] uppercase tracking-widest mb-1.5">{shortClassName(WEIGHT_CLASSES[selectedClass].full)}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-black text-[#FF4500] leading-none">{yourEntry ? `#${yourEntry.pos}` : '—'}</span>
                {yourEntry && <span className="text-sm font-bold text-[#636366]">of {rankings.length}</span>}
              </div>
              {yourEntry?.trend ? (
                <span className="inline-flex items-center gap-0.5 mt-2 text-xs font-black text-[#22C55E]">
                  <ArrowUp className="w-3.5 h-3.5" />{yourEntry.trend} this week
                </span>
              ) : null}
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#9A9AAA] uppercase tracking-widest font-bold mb-1">Record</p>
              <p className="text-2xl font-black leading-none tabular-nums">
                <span className="text-[#22C55E]">{yWins}</span>
                <span className="text-[#48484A]">-</span>
                <span className="text-[#EF4444]">{yLosses}</span>
              </p>
            </div>
          </div>
          {/* Climb hook */}
          <button
            onClick={() => rival && openChallenge(rival.name)}
            disabled={!rival}
            className="w-full flex items-center gap-2 px-4 py-3 border-t border-[#252528] text-left disabled:cursor-default"
          >
            {rival ? (
              <>
                <ArrowUp className="w-4 h-4 text-[#FF4500] flex-shrink-0" />
                <span className="text-sm font-bold text-white flex-1">Beat {rival.name} to hit #{rival.pos}</span>
                <ChevronRight className="w-4 h-4 text-[#636366]" />
              </>
            ) : yourEntry ? (
              <>
                <Crown className="w-4 h-4 text-[#FFC107] flex-shrink-0" />
                <span className="text-sm font-bold text-white flex-1">You&apos;re #1 — defend your crown</span>
              </>
            ) : (
              <span className="text-sm font-semibold text-[#9A9AAA] flex-1">Win a battle to get ranked</span>
            )}
          </button>
        </div>

        {/* PENDING — urgent, only when present */}
        {PENDING_CHALLENGES.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-bold text-[#9A9AAA] uppercase tracking-widest px-1">Incoming</p>
            {PENDING_CHALLENGES.map((c, i) => (
              <div key={i} className="rounded-2xl bg-[#FF4500]/8 border border-[#FF4500]/25 p-3 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                  style={{ backgroundColor: `${avatarColor(c.from)}22`, color: avatarColor(c.from), border: `1.5px solid ${avatarColor(c.from)}55` }}
                >
                  {initials(c.from)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500] animate-pulse flex-shrink-0" />
                    {c.from} challenged you
                  </p>
                  <p className="text-xs font-semibold text-[#9A9AAA] mt-0.5 truncate">{c.lift} · {c.format === 'weight' ? 'most weight' : 'most reps'}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <motion.button whileTap={{ scale: 0.9 }} aria-label="Accept"
                    className="w-10 h-10 rounded-xl bg-[#22C55E] flex items-center justify-center shadow-[0_2px_14px_rgba(34,197,94,0.4)]">
                    <Check className="w-5 h-5 text-white" />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} aria-label="Decline"
                    className="w-10 h-10 rounded-xl bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA] hover:text-white">
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LEADERBOARD — opens the full board on tap */}
        <button
          onClick={() => setLeaderboardOpen(true)}
          className="w-full flex items-center gap-3 rounded-2xl bg-[#1C1C1E] border border-[#252528] p-4 hover:border-[#3A3A3C] transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FF4500]/15 border border-[#FF4500]/30 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-5 h-5 text-[#FF4500]" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-white">Leaderboard</p>
            <p className="text-xs font-semibold text-[#9A9AAA]">{shortClassName(WEIGHT_CLASSES[selectedClass].full)} · {rankings.length} fighters</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#636366]" />
        </button>

      </div>

      {/* Primary action — the loudest thing on the page */}
      <div className="px-5 pb-6 pt-3 relative">
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => openChallenge(rival?.name ?? null)}
          className="w-full bg-[#FF4500] text-white font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
        >
          <Swords className="w-4 h-4" />
          Challenge
        </motion.button>
      </div>

      <BottomNav active="compete" />

      {/* Leaderboard sheet */}
      <AnimatePresence>
        {leaderboardOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setLeaderboardOpen(false)}
              className="fixed inset-0 bg-black/90 z-[60]"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] bg-[#0D0D0F] border-t border-[#252528] rounded-t-3xl z-[70] flex flex-col max-h-[92dvh]"
            >
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-[#3A3A3C]" />
              </div>
              <div className="flex items-center justify-between px-5 pt-2 pb-4 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold">Leaderboard</h2>
                  <p className="text-[#9A9AAA] text-sm">Tap a fighter to challenge</p>
                </div>
                <button onClick={() => setLeaderboardOpen(false)} className="w-9 h-9 rounded-xl bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA] hover:text-white flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-5 pb-3 flex-shrink-0">
                <div className="flex bg-[#161618] rounded-xl p-1 border border-[#252528]">
                  {([['class', 'My Class'], ['open', 'Open']] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setBoardView(v)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${boardView === v ? 'bg-[#1C1C1E] text-white shadow-sm' : 'text-[#636366]'}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-8 flex flex-col gap-1.5">
                {boardView === 'class' ? rankings.map(renderLeaderRow) : OPEN_RANKINGS.map(renderOpenRow)}
                {boardView === 'open' && <p className="text-[10px] text-[#48484A] text-center mt-2">Cross-class · pound-for-pound (size-adjusted)</p>}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Challenge sheet — opponent + lift + format */}
      <AnimatePresence>
        {challengeOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setChallengeOpen(false)}
              className="fixed inset-0 bg-black/90 z-[60]"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] bg-[#0D0D0F] border-t border-[#252528] rounded-t-3xl z-[70] flex flex-col max-h-[92dvh]"
            >
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-[#3A3A3C]" />
              </div>
              <div className="flex items-center justify-between px-5 pt-2 pb-4 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold">Challenge</h2>
                  <p className="text-[#9A9AAA] text-sm">{challengeOpponent ? (challengeSuperfight ? `${challengeOpponent} · Superfight (P4P)` : challengeOpponent) : 'Pick someone from the leaderboard'}</p>
                </div>
                <button onClick={() => setChallengeOpen(false)} className="w-9 h-9 rounded-xl bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA] hover:text-white flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-8">
                {/* Format */}
                <p className="text-[11px] font-bold text-[#9A9AAA] uppercase tracking-widest mb-2">Format</p>
                <div className="flex bg-[#161618] rounded-xl p-1 border border-[#252528] mb-5">
                  {([['weight', 'Most Weight'], ['reps', 'Most Reps']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setChallengeFormat(val)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${challengeFormat === val ? 'bg-[#1C1C1E] text-white shadow-sm' : 'text-[#636366]'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Lift */}
                <p className="text-[11px] font-bold text-[#9A9AAA] uppercase tracking-widest mb-2">Lift</p>
                <div className="flex flex-col gap-2 mb-6">
                  {BIG_SIX.map(l => (
                    <button
                      key={l.name}
                      onClick={() => setChallengeLift(l.name)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                        challengeLift === l.name ? 'border-[#FF4500] bg-[#FF4500]/10' : 'border-[#252528] bg-[#161618]'
                      }`}
                    >
                      <span className={`text-sm font-bold ${challengeLift === l.name ? 'text-[#FF4500]' : 'text-white'}`}>{l.name}</span>
                      {challengeLift === l.name && <Check className="w-4 h-4 text-[#FF4500]" />}
                    </button>
                  ))}
                </div>

                {/* Send — TODO: wire to battle backend (challenge create) */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={!challengeOpponent || !challengeLift}
                  onClick={() => setChallengeOpen(false)}
                  className="w-full bg-[#FF4500] text-white font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.25)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Swords className="w-4 h-4" />
                  Send Challenge
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}
