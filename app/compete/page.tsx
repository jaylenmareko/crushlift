'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Swords, Crown, ChevronRight, Check, X, ArrowUp, Flame, Trophy, Medal } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import WeightGate from '@/components/WeightGate'
import { useUserWeight } from '@/lib/hooks/useUserWeight'
import { WEIGHT_CLASSES, BIG_SIX } from '@/lib/belts'
import { p4pDisplay, pound4poundScore } from '@/lib/dots'

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

// Outgoing challenges you've sent that are awaiting the opponent's response.
const OUTGOING_CHALLENGES: { to: string; lift: string; format: 'weight' | 'reps' }[] = [
  { to: 'Devon L.', lift: 'Bench Press', format: 'weight' },
  { to: 'Hector V.', lift: 'Pull-up', format: 'reps' },
]

// Open / pound-for-pound roster — everyone across all classes (cls = weight-class index).
// Fights here are superfights, ranked by a real DOTS score: each fighter's best lift (lbs)
// adjusted for their bodyweight (bw, lbs). A smaller lifter can out-rank a bigger one.
type OpenFighter = { name: string; cls: number; bw: number; lift: number; record: string; you: boolean; streak?: number }
const OPEN_ROSTER: OpenFighter[] = [
  { name: 'Tank G.',   cls: 4, bw: 215, lift: 545, record: '30-1', you: false, streak: 12 },
  { name: 'Goliath',   cls: 5, bw: 240, lift: 575, record: '25-0', you: false, streak: 9 },
  { name: 'Big K.',    cls: 3, bw: 195, lift: 500, record: '22-0', you: false, streak: 7 },
  { name: 'Marcus T.', cls: 2, bw: 170, lift: 455, record: '21-2', you: false, streak: 8 },
  { name: 'Leon T.',   cls: 1, bw: 148, lift: 420, record: '18-1', you: false },
  { name: 'Cam R.',    cls: 0, bw: 132, lift: 365, record: '14-2', you: false },
  { name: 'You',       cls: 2, bw: 165, lift: 300, record: '2-1',  you: true },
]
// Ranked by pound-for-pound score (highest first), then numbered.
const OPEN_RANKINGS = [...OPEN_ROSTER]
  .map(f => ({ ...f, score: p4pDisplay(f.lift, f.bw) }))
  .sort((a, b) => pound4poundScore(b.lift, b.bw) - pound4poundScore(a.lift, a.bw))
  .map((f, i) => ({ ...f, pos: i + 1 }))

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

const TABS = [
  { id: 'rank', label: 'Rank', icon: Medal },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'challenges', label: 'Challenges', icon: Swords },
] as const
type TabId = (typeof TABS)[number]['id']

// Directional roll-over between tabs: new content slides in from the side
// you're heading toward, old content slides out the opposite way.
const tabVariants = {
  enter:  (dir: number) => ({ opacity: 0, x: dir > 0 ? 28 : -28 }),
  center: { opacity: 1, x: 0 },
  exit:   (dir: number) => ({ opacity: 0, x: dir > 0 ? -28 : 28 }),
}
const tabTransition = { duration: 0.22, ease: 'easeOut' } as const

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
  const [activeTab, setActiveTab] = useState<TabId>('rank')
  const [tabDir, setTabDir] = useState(0)
  const [boardView, setBoardView] = useState<'class' | 'open'>('class')
  const [challengeView, setChallengeView] = useState<'incoming' | 'outgoing'>('incoming')

  function changeTab(id: TabId) {
    if (id === activeTab) return
    const from = TABS.findIndex(t => t.id === activeTab)
    const to = TABS.findIndex(t => t.id === id)
    setTabDir(to > from ? 1 : -1)
    setActiveTab(id)
  }

  const rankings  = RANKINGS_DATA[selectedClass] ?? []
  const youIdx    = rankings.findIndex(r => r.you)
  const yourEntry = youIdx >= 0 ? rankings[youIdx] : null
  const rival     = youIdx > 0 ? rankings[youIdx - 1] : null  // person one spot above you
  const [yWins, yLosses] = (yourEntry?.record ?? '0-0').split('-')
  const wNum = parseInt(yWins) || 0
  const lNum = parseInt(yLosses) || 0
  const winRate = wNum + lNum > 0 ? Math.round((wNum / (wNum + lNum)) * 100) : 0
  // you + the people directly above/below you, for the rank-tab mini board
  const neighborhood = yourEntry ? rankings.slice(Math.max(0, youIdx - 1), youIdx + 2) : []

  function openChallenge(name: string | null, superfight = false) {
    setChallengeOpponent(name)
    setChallengeSuperfight(superfight)
    setChallengeLift(null)
    setChallengeFormat('weight')
    setChallengeOpen(true)
  }

  // On send, close the sheet and drop the user on Challenges → Outgoing so they
  // see the challenge they just sent. (TODO: persist via battle backend.)
  function sendChallenge() {
    setChallengeOpen(false)
    setChallengeView('outgoing')
    changeTab('challenges')
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
        onClick={() => { if (!entry.you) openChallenge(entry.name) }}
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
          {(entry.streak ?? 0) >= 3
            ? <p className="flex items-center gap-0.5 text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider"><Flame className="w-3 h-3" />{entry.streak} win streak</p>
            : null}
        </div>
        <span className="w-11 text-right text-sm font-bold tabular-nums text-[#9A9AAA] flex-shrink-0">{entry.record}</span>
        <div className="w-[64px] flex justify-end flex-shrink-0">
          {entry.you ? null : isRival
            ? <motion.span animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} className="text-[10px] font-black text-white px-2.5 py-1.5 rounded-lg bg-[#FF4500] flex items-center gap-1 shadow-[0_2px_12px_rgba(255,69,0,0.4)]"><Swords className="w-3 h-3" />FIGHT</motion.span>
            : <Swords className="w-3.5 h-3.5 text-[#48484A]" />}
        </div>
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
        onClick={() => { if (!entry.you) openChallenge(entry.name, !sameClass) }}
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
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-black tabular-nums text-white leading-none">{entry.score}</p>
          <p className="text-[9px] font-bold text-[#636366] uppercase tracking-wider mt-0.5">P4P</p>
        </div>
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


      <div className="flex-1 overflow-y-auto px-5 pb-28 flex flex-col gap-3 relative">

        <AnimatePresence mode="wait" custom={tabDir} initial={false}>

        {activeTab === 'rank' && (
        <motion.div key="rank" custom={tabDir} variants={tabVariants} initial="enter" animate="center" exit="exit" transition={tabTransition} className="flex flex-col gap-3">
        {/* HERO — where you stand + the climb hook (full-bleed to screen edges) */}
        <div className="relative -mx-5 bg-gradient-to-b from-[#202023] to-[#161618] border-y border-[#2A2A2E] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <div className="h-1 bg-gradient-to-r from-[#F59E0B] via-[#FF4500] to-[#FF4500]" />
          {/* inner glow */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-44 bg-[#FF4500]/15 blur-[80px] pointer-events-none rounded-full" />

          <div className="relative pt-6 pb-5 flex flex-col items-center text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-black mb-3"
              style={{ backgroundColor: '#FF45001f', color: '#FF4500', border: '2px solid #FF450066', boxShadow: '0 0 24px rgba(255,69,0,0.25)' }}
            >
              {initials('You')}
            </div>
            <span className="text-[10px] font-bold text-[#9A9AAA] uppercase tracking-[0.2em] mb-2">{shortClassName(WEIGHT_CLASSES[selectedClass].full)}</span>
            {yourEntry ? (
              <>
                <span className="text-7xl font-black text-[#FF4500] leading-none tracking-tight drop-shadow-[0_2px_20px_rgba(255,69,0,0.35)]">#{yourEntry.pos}</span>
                <p className="text-xs font-bold text-[#636366] mt-2">of {rankings.length} in your class</p>
              </>
            ) : (
              <span className="text-4xl font-black text-[#636366] leading-none">Unranked</span>
            )}
            <div className="flex items-center gap-2 mt-3 empty:hidden">
              {yourEntry?.trend ? (
                <span className="inline-flex items-center gap-0.5 text-xs font-black text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-1 rounded-lg">
                  <ArrowUp className="w-3.5 h-3.5" />{yourEntry.trend} this week
                </span>
              ) : null}
              {(yourEntry?.streak ?? 0) >= 2 ? (
                <span className="inline-flex items-center gap-0.5 text-xs font-black text-[#F59E0B] bg-[#F59E0B]/10 px-2.5 py-1 rounded-lg">
                  <Flame className="w-3.5 h-3.5" />{yourEntry?.streak} win streak
                </span>
              ) : null}
            </div>
          </div>

          {/* Stat strip */}
          <div className="relative grid grid-cols-3 border-t border-[#252528]">
            <div className="py-3.5 text-center">
              <p className="text-2xl font-black text-[#22C55E] leading-none tabular-nums">{yWins}</p>
              <p className="text-[10px] font-bold text-[#636366] uppercase tracking-widest mt-1.5">Wins</p>
            </div>
            <div className="py-3.5 text-center border-x border-[#252528]">
              <p className="text-2xl font-black text-[#EF4444] leading-none tabular-nums">{yLosses}</p>
              <p className="text-[10px] font-bold text-[#636366] uppercase tracking-widest mt-1.5">Losses</p>
            </div>
            <div className="py-3.5 text-center">
              <p className="text-2xl font-black text-white leading-none tabular-nums">{winRate}<span className="text-sm text-[#636366]">%</span></p>
              <p className="text-[10px] font-bold text-[#636366] uppercase tracking-widest mt-1.5">Win Rate</p>
            </div>
          </div>

          {/* Climb hook */}
          <button
            onClick={() => rival && openChallenge(rival.name)}
            disabled={!rival}
            className="relative w-full flex items-center gap-2 px-4 py-3.5 border-t border-[#252528] text-left disabled:cursor-default hover:bg-[#FF4500]/5 transition-colors"
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

        {/* Your position — you + the lifters directly around you */}
        {neighborhood.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-bold text-[#9A9AAA] uppercase tracking-widest px-1">Your Position</p>
            <div className="flex flex-col gap-1.5">
              {neighborhood.map(renderLeaderRow)}
            </div>
          </div>
        )}
        </motion.div>
        )}

        {activeTab === 'challenges' && (
        <motion.div key="challenges" custom={tabDir} variants={tabVariants} initial="enter" animate="center" exit="exit" transition={tabTransition} className="flex flex-col gap-3">

        {/* Hero card — same visual language as Rank + Leaderboard tabs */}
        <div className="relative rounded-3xl bg-gradient-to-b from-[#202023] to-[#161618] border border-[#2A2A2E] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <div className="h-1 bg-gradient-to-r from-[#F59E0B] via-[#FF4500] to-[#FF4500]" />
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-44 bg-[#FF4500]/15 blur-[80px] pointer-events-none rounded-full" />

          <div className="relative px-4 pt-5 pb-4 flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#FF45001f', border: '1.5px solid #FF450066', boxShadow: '0 0 18px rgba(255,69,0,0.2)' }}
            >
              <Swords className="w-5 h-5 text-[#FF4500]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[#FF4500] uppercase tracking-[0.2em]">1v1 Battles</p>
              <p className="text-lg font-black text-white leading-tight">Challenges</p>
              <p className="text-xs font-semibold text-[#9A9AAA]">
                {PENDING_CHALLENGES.length > 0 ? `${PENDING_CHALLENGES.length} incoming · ` : ''}{OUTGOING_CHALLENGES.length} outgoing
              </p>
            </div>
            {PENDING_CHALLENGES.length > 0 && (
              <span className="flex-shrink-0 text-xs font-black text-white bg-[#FF4500] px-2.5 py-1 rounded-lg animate-pulse">
                {PENDING_CHALLENGES.length} New
              </span>
            )}
          </div>

          <div className="border-t border-[#252528] p-3">
            <div className="flex bg-[#0D0D0F] rounded-xl p-1 border border-[#252528]">
              {([['incoming', 'Incoming', PENDING_CHALLENGES.length], ['outgoing', 'Outgoing', OUTGOING_CHALLENGES.length]] as const).map(([v, label, count]) => (
                <button key={v} onClick={() => setChallengeView(v)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all ${challengeView === v ? 'bg-[#1C1C1E] text-white shadow-sm' : 'text-[#636366]'}`}>
                  {label}
                  {count > 0 && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md transition-colors ${challengeView === v ? 'bg-[#FF4500] text-white' : 'bg-[#252528] text-[#9A9AAA]'}`}>{count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
        <motion.div key={challengeView} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="flex flex-col gap-2">
          {challengeView === 'incoming' ? (
            PENDING_CHALLENGES.length > 0 ? PENDING_CHALLENGES.map((c, i) => (
              <div key={i} className="rounded-2xl bg-[#FF4500]/8 border border-[#FF4500]/25 p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                  style={{ backgroundColor: `${avatarColor(c.from)}22`, color: avatarColor(c.from), border: `1.5px solid ${avatarColor(c.from)}55` }}>
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
            )) : (
              <p className="text-sm font-semibold text-[#636366] text-center py-8">No incoming challenges</p>
            )
          ) : (
            OUTGOING_CHALLENGES.length > 0 ? OUTGOING_CHALLENGES.map((c, i) => (
              <div key={i} className="rounded-2xl bg-[#1C1C1E] border border-[#252528] p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                  style={{ backgroundColor: `${avatarColor(c.to)}22`, color: avatarColor(c.to), border: `1.5px solid ${avatarColor(c.to)}55` }}>
                  {initials(c.to)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">You challenged {c.to}</p>
                  <p className="text-xs font-semibold text-[#9A9AAA] mt-0.5 truncate">
                    {c.lift} · {c.format === 'weight' ? 'most weight' : 'most reps'} · <span className="text-[#F59E0B] font-bold">awaiting response</span>
                  </p>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} aria-label="Cancel challenge"
                  className="w-10 h-10 rounded-xl bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA] hover:text-white flex-shrink-0">
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            )) : (
              <p className="text-sm font-semibold text-[#636366] text-center py-8">No outgoing challenges</p>
            )
          )}
        </motion.div>
        </AnimatePresence>

        <motion.button whileTap={{ scale: 0.97 }}
          onClick={() => openChallenge(null)}
          className="w-full bg-[#FF4500] text-white font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
        >
          <Swords className="w-4 h-4" />
          New Challenge
        </motion.button>
        </motion.div>
        )}

        {activeTab === 'leaderboard' && (
        <motion.div key="leaderboard" custom={tabDir} variants={tabVariants} initial="enter" animate="center" exit="exit" transition={tabTransition} className="flex flex-col gap-3">

        {/* Hero card — same visual language as Rank tab */}
        <div className="relative rounded-3xl bg-gradient-to-b from-[#202023] to-[#161618] border border-[#2A2A2E] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <div className="h-1 bg-gradient-to-r from-[#F59E0B] via-[#FF4500] to-[#FF4500]" />
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-44 bg-[#FF4500]/15 blur-[80px] pointer-events-none rounded-full" />

          <div className="relative px-4 pt-5 pb-4 flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#FF45001f', border: '1.5px solid #FF450066', boxShadow: '0 0 18px rgba(255,69,0,0.2)' }}
            >
              <Trophy className="w-5 h-5 text-[#FF4500]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#FF4500] uppercase tracking-[0.2em]">{shortClassName(WEIGHT_CLASSES[selectedClass].full)}</p>
              <p className="text-lg font-black text-white leading-tight">Leaderboard</p>
              <p className="text-xs font-semibold text-[#9A9AAA]">{rankings.length} fighters ranked</p>
            </div>
          </div>

          <div className="border-t border-[#252528] p-3">
            <div className="flex bg-[#0D0D0F] rounded-xl p-1 border border-[#252528]">
              {([['class', 'My Class'], ['open', 'Pound for Pound']] as const).map(([v, l]) => (
                <button key={v} onClick={() => setBoardView(v)}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${boardView === v ? 'bg-[#1C1C1E] text-white shadow-sm' : 'text-[#636366]'}`}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {boardView === 'class' ? rankings.map(renderLeaderRow) : OPEN_RANKINGS.map(renderOpenRow)}
          {boardView === 'open' && <p className="text-[10px] text-[#48484A] text-center mt-2">Cross-class · pound-for-pound (size-adjusted)</p>}
        </div>
        </motion.div>
        )}

        </AnimatePresence>

      </div>

      {/* Section tab bar — Rank / Leaderboard / Challenges — pinned just above BottomNav, styled as its own floating pill so it doesn't read as part of BottomNav */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[900px] px-5 z-20">
        <div className="flex bg-[#161618] rounded-xl p-1 border border-[#252528] shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            const showDot = tab.id === 'challenges' && PENDING_CHALLENGES.length > 0
            return (
              <button
                key={tab.id}
                onClick={() => changeTab(tab.id)}
                className={`relative flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  active ? 'bg-[#1C1C1E] text-[#FF4500] shadow-sm' : 'text-[#636366]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {showDot && (
                  <span className="absolute top-1 right-[28%] w-1.5 h-1.5 rounded-full bg-[#FF4500] animate-pulse" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <BottomNav active="compete" />

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
                  onClick={sendChallenge}
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
