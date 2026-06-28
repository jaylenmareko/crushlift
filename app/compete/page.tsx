'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Swords, Crown, ChevronRight, Check, X, ArrowUp, Trophy, Medal } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import WeightGate from '@/components/WeightGate'
import { useUserWeight } from '@/lib/hooks/useUserWeight'
import { WEIGHT_CLASSES, BIG_SIX } from '@/lib/belts'

const RANKINGS_DATA: Record<number, { pos: number; name: string; record: string; you: boolean; trend?: number }[]> = {
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
    { pos: 1, name: 'Marcus T.', record: '21-2', you: false },
    { pos: 2, name: 'Dre W.',    record: '15-5', you: false },
    { pos: 3, name: 'Kyle B.',   record: '10-4', you: false },
    { pos: 4, name: 'You',       record: '2-1',  you: true, trend: 2 },
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

const LAST_BATTLE = { result: 'W' as 'W' | 'L', opponent: 'Jordan S.', lift: 'Bench' }

const PENDING_CHALLENGES: { from: string; lift: string; format: 'weight' | 'reps'; hoursLeft: number }[] = [
  { from: 'Marcus T.', lift: 'Squat', format: 'weight', hoursLeft: 23 },
]

const OUTGOING_CHALLENGES: { to: string; lift: string; format: 'weight' | 'reps' }[] = [
  { to: 'Devon L.',   lift: 'Bench Press', format: 'weight' },
  { to: 'Hector V.',  lift: 'Pull-up',     format: 'reps'   },
]

type OpenFighter = { name: string; cls: number; bw: number; lift: number; record: string; you: boolean }
const OPEN_ROSTER: OpenFighter[] = [
  { name: 'Tank G.',   cls: 4, bw: 215, lift: 545, record: '30-1', you: false },
  { name: 'Goliath',   cls: 5, bw: 240, lift: 575, record: '25-0', you: false },
  { name: 'Big K.',    cls: 3, bw: 195, lift: 500, record: '22-0', you: false },
  { name: 'Marcus T.', cls: 2, bw: 170, lift: 455, record: '21-2', you: false },
  { name: 'Leon T.',   cls: 1, bw: 148, lift: 420, record: '18-1', you: false },
  { name: 'Cam R.',    cls: 0, bw: 132, lift: 365, record: '14-2', you: false },
  { name: 'You',       cls: 2, bw: 165, lift: 300, record: '2-1',  you: true  },
]

function recordParts(r: string) {
  const [w, l] = r.split('-').map(n => parseInt(n) || 0)
  return { w, l, rate: w + l > 0 ? w / (w + l) : 0 }
}

const OPEN_RANKINGS = [...OPEN_ROSTER]
  .sort((a, b) => {
    const ra = recordParts(a.record), rb = recordParts(b.record)
    return rb.w - ra.w || ra.l - rb.l || rb.rate - ra.rate
  })
  .map((f, i) => ({ ...f, pos: i + 1 }))

function shortClassName(full: string) { return full.split('·')[0].trim() }

function classWeightLabel(idx: number) {
  const { full, label } = WEIGHT_CLASSES[idx]
  const name = shortClassName(full)
  const withWeight = /weight/i.test(name) ? name : `${name} Weight`
  return `${withWeight} ${label}`
}

function initials(name: string) {
  const p = name.replace(/\./g, '').trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase()
}

const AVATAR_COLORS = ['#3B82F6', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899']
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

// Gentle ambient float — content bobs slowly at independent phases
function Float({ children, amplitude = 3, duration = 5, delay = 0, className = '' }: {
  children: React.ReactNode; amplitude?: number; duration?: number; delay?: number; className?: string
}) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -amplitude, 0] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {children}
    </motion.div>
  )
}

// SVG progress ring around the rank avatar
function RankRing({ progress }: { progress: number }) {
  const size = 80, r = 36
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(0.97, Math.max(0, progress)))
  return (
    <svg width={size} height={size} className="absolute inset-0 pointer-events-none" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#252528" strokeWidth="3" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#FF4500" strokeWidth="3" strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.4, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 }}
      />
    </svg>
  )
}

const TABS = [
  { id: 'rank',        label: 'Rank',        icon: Medal  },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'challenges',  label: 'Challenges',  icon: Swords },
] as const
type TabId = (typeof TABS)[number]['id']

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
  const [displayRank, setDisplayRank] = useState(0)
  const [matchState, setMatchState] = useState<'idle' | 'finding'>('idle')
  const [dismissed, setDismissed] = useState<Set<number>>(new Set())
  const [rankSettled, setRankSettled] = useState(false)

  const rankings  = RANKINGS_DATA[selectedClass] ?? []
  const youIdx    = rankings.findIndex(r => r.you)
  const yourEntry = youIdx >= 0 ? rankings[youIdx] : null
  const rival     = youIdx > 0 ? rankings[youIdx - 1] : null
  const [yWins, yLosses] = (yourEntry?.record ?? '0-0').split('-')
  const wNum = parseInt(yWins) || 0
  const lNum = parseInt(yLosses) || 0
  const winRate = wNum + lNum > 0 ? Math.round((wNum / (wNum + lNum)) * 100) : 0

  const rivalWins   = rival ? recordParts(rival.record).w : 0
  const ringProgress = rival
    ? Math.min(0.95, wNum / Math.max(1, rivalWins))
    : yourEntry ? 1 : 0

  // Count rank down from pos+5 → actual pos every time the Rank tab is entered
  useEffect(() => {
    if (activeTab !== 'rank') return
    setRankSettled(false)
    if (!yourEntry) { setDisplayRank(0); return }
    const target = yourEntry.pos
    let cur = Math.min(rankings.length, target + 5)
    setDisplayRank(cur)
    if (cur === target) { setTimeout(() => setRankSettled(true), 80); return }
    const id = setInterval(() => {
      cur -= 1
      setDisplayRank(cur)
      if (cur <= target) { clearInterval(id); setRankSettled(true) }
    }, 80)
    return () => clearInterval(id)
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  function changeTab(id: TabId) {
    if (id === activeTab) return
    const from = TABS.findIndex(t => t.id === activeTab)
    const to   = TABS.findIndex(t => t.id === id)
    setTabDir(to > from ? 1 : -1)
    setActiveTab(id)
  }

  function autoPickOpponent(): string {
    const candidates = rankings.filter(r => !r.you)
    if (rival) return rival.name
    if (yourEntry && youIdx < rankings.length - 1) return rankings[youIdx + 1].name
    if (candidates.length > 0) return candidates[candidates.length - 1].name
    return OPEN_RANKINGS.filter(r => !r.you).at(-1)?.name ?? ''
  }

  function openChallenge(name: string | null, superfight = false) {
    setChallengeOpponent(name)
    setChallengeSuperfight(superfight)
    setChallengeLift(null)
    setChallengeFormat('weight')
    setChallengeOpen(true)
  }

  function handleChallengeSomeone() {
    setMatchState('finding')
    setTimeout(() => {
      setMatchState('idle')
      openChallenge(autoPickOpponent())
    }, 1300)
  }

  function sendChallenge() {
    setChallengeOpen(false)
    setChallengeView('outgoing')
    changeTab('challenges')
  }

  const renderLeaderRow = (entry: (typeof rankings)[number], i: number) => {
    const rankColor =
      entry.pos === 1 ? '#FFC107' :
      entry.pos === 2 ? '#D1D5DB' :
      entry.pos === 3 ? '#CD853F' : '#636366'
    const isRival = rival?.pos === entry.pos
    const isChamp = entry.pos === 1 && !entry.you
    const av = entry.you ? '#FF4500' : avatarColor(entry.name)
    const rowStyle =
      entry.you  ? { backgroundColor: '#FF450014', borderColor: '#FF450045' }
      : isRival  ? { backgroundColor: '#FF45001A', borderColor: '#FF450055' }
      : entry.pos === 1 ? { backgroundColor: '#FFC10712', borderColor: '#FFC10740' }
      : entry.pos <= 3 ? { backgroundColor: `${rankColor}08`, borderColor: 'transparent' }
      : { backgroundColor: '#25252880', borderColor: 'transparent' }
    return (
      <motion.div
        key={entry.pos}
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.045, type: 'spring', stiffness: 320, damping: 26 }}
        className={`relative w-full flex items-center gap-3 rounded-xl border ${isChamp ? 'px-3.5 py-3.5' : 'px-2.5 py-2.5'}`}
        style={rowStyle}
      >
        {/* Rival heartbeat border */}
        {isRival && (
          <motion.div
            className="absolute inset-0 rounded-xl border border-[#FF4500]/50 pointer-events-none"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <div className={`flex items-center justify-center flex-shrink-0 ${isChamp ? 'w-6' : 'w-5'}`}>
          {entry.pos === 1
            ? <Crown className={isChamp ? 'w-5 h-5' : 'w-4 h-4'} style={{ color: rankColor }} />
            : <span className="text-xs font-black tabular-nums" style={{ color: rankColor }}>{entry.pos}</span>}
        </div>
        <div
          className={`rounded-full flex items-center justify-center flex-shrink-0 font-black ${isChamp ? 'w-11 h-11 text-sm' : 'w-9 h-9 text-[11px]'}`}
          style={{ backgroundColor: `${av}22`, color: av, border: `${isChamp ? '2px' : '1.5px'} solid ${av}55` }}
        >
          {initials(entry.you ? 'You' : entry.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-white truncate ${isChamp ? 'text-base' : 'text-sm'}`}>{entry.you ? 'You' : entry.name}</p>
          {isChamp && <p className="text-[10px] font-black uppercase tracking-widest mt-0.5" style={{ color: rankColor }}>Champion</p>}
        </div>
        <span
          className={`text-right font-bold tabular-nums flex-shrink-0 ${isChamp ? 'text-base w-12' : 'w-11 text-sm text-[#9A9AAA]'}`}
          style={isChamp ? { color: rankColor } : undefined}
        >{entry.record}</span>
        <div className="w-[64px] flex justify-end flex-shrink-0">
          {entry.you ? null : isRival
            ? <div className="relative">
                <motion.div
                  className="absolute inset-[-5px] rounded-xl border border-[#FF4500]/70 pointer-events-none"
                  animate={{ scale: [1, 1.55], opacity: [0.7, 0] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut', repeatDelay: 0.5 }}
                />
                <motion.button onClick={() => openChallenge(entry.name)} whileTap={{ scale: 0.95 }} animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} className="relative text-[10px] font-black text-white px-2.5 py-1.5 rounded-lg bg-[#FF4500] flex items-center gap-1 shadow-[0_2px_12px_rgba(255,69,0,0.4)]"><Swords className="w-3 h-3" />FIGHT</motion.button>
              </div>
            : <button onClick={() => openChallenge(entry.name)} className="text-[10px] font-semibold text-[#9A9AAA] flex items-center gap-1 border border-[#3A3A3C] rounded-lg px-2 py-1.5 active:scale-95 transition-transform"><Swords className="w-3 h-3" />Fight</button>}
        </div>
      </motion.div>
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
      <motion.div
        key={entry.pos}
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.045, type: 'spring', stiffness: 320, damping: 26 }}
        className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl border"
        style={rowStyle}
      >
        <div className="w-5 flex items-center justify-center flex-shrink-0">
          {entry.pos === 1
            ? <Crown className="w-4 h-4" style={{ color: rankColor }} />
            : <span className="text-xs font-black tabular-nums" style={{ color: rankColor }}>{entry.pos}</span>}
        </div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-black"
          style={{ backgroundColor: `${av}22`, color: av, border: `1.5px solid ${av}55` }}>
          {initials(entry.you ? 'You' : entry.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-white truncate">{entry.you ? 'You' : entry.name}</p>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#252528] text-[#9A9AAA] uppercase tracking-wider flex-shrink-0">{shortClassName(WEIGHT_CLASSES[entry.cls].full)}</span>
          </div>
        </div>
        <span className="w-11 text-right text-sm font-bold tabular-nums text-[#9A9AAA] flex-shrink-0">{entry.record}</span>
        <div className="w-7 flex justify-end flex-shrink-0">
          {entry.you ? null : <button onClick={() => openChallenge(entry.name, !sameClass)} className="active:scale-95 transition-transform"><Swords className="w-3.5 h-3.5 text-[#9A9AAA]" /></button>}
        </div>
      </motion.div>
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

  const activePending = PENDING_CHALLENGES.filter((_, i) => !dismissed.has(i))

  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0D0D0F] has-bottom-nav relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[420px] h-[220px] bg-[#FF4500]/8 blur-[110px] pointer-events-none rounded-full" />

      <div className="flex-1 overflow-y-auto -mx-6 px-11 pb-28 flex flex-col gap-3 relative">
        <AnimatePresence mode="wait" custom={tabDir} initial={false}>

        {/* ── RANK TAB ── */}
        {activeTab === 'rank' && (
        <motion.div key="rank" custom={tabDir} variants={tabVariants} initial="enter" animate="center" exit="exit" transition={tabTransition} className="flex flex-col flex-1">
        <div className="relative -mx-11 bg-gradient-to-b from-[#202023] to-[#161618] border-y border-[#2A2A2E] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex flex-col flex-1">
          <div className="h-1 bg-gradient-to-r from-[#F59E0B] via-[#FF4500] to-[#FF4500]" />
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-44 bg-[#FF4500]/15 blur-[80px] pointer-events-none rounded-full" />

          <motion.div className="relative flex-1 flex flex-col items-center justify-center text-center py-8" animate={{ y: [0, -4, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
            {/* Avatar + progress ring */}
            <div className="relative mb-4" style={{ width: 80, height: 80 }}>
              <RankRing progress={ringProgress} />
              <div
                className="absolute top-[8px] left-[8px] w-16 h-16 rounded-full flex items-center justify-center text-lg font-black"
                style={{ backgroundColor: '#FF45001f', color: '#FF4500', border: '2px solid #FF450066', boxShadow: '0 0 24px rgba(255,69,0,0.25)' }}
              >
                {initials('You')}
              </div>
              <AnimatePresence>
                {rankSettled && (
                  <motion.div
                    key="settle-ripple"
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ background: 'rgba(255,69,0,0.35)' }}
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: 2.8, opacity: 0 }}
                    transition={{ duration: 0.65, ease: 'easeOut' }}
                  />
                )}
              </AnimatePresence>
            </div>

            <span className="text-[10px] font-bold text-[#9A9AAA] uppercase tracking-[0.2em] mb-2">{classWeightLabel(selectedClass)}</span>

            {yourEntry ? (
              <>
                <motion.span
                  key={displayRank}
                  initial={{ scale: 0.88, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.06 }}
                  className="text-7xl font-black text-[#FF4500] leading-none tracking-tight drop-shadow-[0_2px_20px_rgba(255,69,0,0.35)] tabular-nums"
                >
                  #{displayRank || yourEntry.pos}
                </motion.span>
                <p className="text-xs font-bold text-[#636366] mt-2">of {rankings.length} in your class</p>
              </>
            ) : (
              <span className="text-4xl font-black text-[#636366] leading-none">Unranked</span>
            )}

            {/* Badges row */}
            <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
              {yourEntry?.trend ? (
                <span className="inline-flex items-center gap-0.5 text-xs font-black text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-1 rounded-lg">
                  <ArrowUp className="w-3.5 h-3.5" />{yourEntry.trend} this week
                </span>
              ) : null}
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${LAST_BATTLE.result === 'W' ? 'text-[#22C55E] bg-[#22C55E]/10' : 'text-[#EF4444] bg-[#EF4444]/10'}`}>
                Last: {LAST_BATTLE.result} · {LAST_BATTLE.opponent}
              </span>
            </div>
          </motion.div>

          {/* Stat strip */}
          <motion.div className="relative grid grid-cols-3 border-t border-[#252528]" animate={{ y: [0, -2, 0] }} transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}>
            <div className="py-3.5 text-center">
              <p className={`text-2xl font-black leading-none tabular-nums ${wNum > 0 ? 'text-[#22C55E]' : 'text-[#9A9AAA]'}`}>{yWins}</p>
              <p className="text-[10px] font-bold text-[#636366] uppercase tracking-widest mt-1.5">Wins</p>
            </div>
            <div className="py-3.5 text-center border-x border-[#252528]">
              <p className={`text-2xl font-black leading-none tabular-nums ${lNum > 0 ? 'text-[#EF4444]' : 'text-[#9A9AAA]'}`}>{yLosses}</p>
              <p className="text-[10px] font-bold text-[#636366] uppercase tracking-widest mt-1.5">Losses</p>
            </div>
            <div className="py-3.5 text-center">
              <p className="text-2xl font-black text-white leading-none tabular-nums">{winRate}<span className="text-sm text-[#636366]">%</span></p>
              <p className="text-[10px] font-bold text-[#636366] uppercase tracking-widest mt-1.5">Win Rate</p>
            </div>
          </motion.div>

          {/* Climb hook */}
          <button
            onClick={() => { if (rival) openChallenge(rival.name); else if (!yourEntry) changeTab('leaderboard') }}
            disabled={!rival && !!yourEntry}
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
              <>
                <Swords className="w-4 h-4 text-[#FF4500]/70 flex-shrink-0" />
                <span className="text-sm font-bold text-[#9A9AAA] flex-1">Win a battle to enter the rankings</span>
                <ChevronRight className="w-4 h-4 text-[#48484A]" />
              </>
            )}
          </button>
        </div>
        </motion.div>
        )}

        {/* ── CHALLENGES TAB ── */}
        {activeTab === 'challenges' && (
        <motion.div key="challenges" custom={tabDir} variants={tabVariants} initial="enter" animate="center" exit="exit" transition={tabTransition} className="flex flex-col gap-3">

        <div className="relative -mx-11 bg-[#161618] border-b border-[#252528] overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-[#F59E0B] via-[#FF4500] to-[#FF4500]" />
          <div className="px-6 pt-7 pb-2">
            <p className="text-[10px] font-bold text-[#FF4500] uppercase tracking-[0.2em] mb-1">1v1 Battles</p>
            <p className="text-3xl font-black text-white">Challenges</p>
          </div>
          <div className="px-6 pt-3 pb-6">
            <div className="flex bg-[#0D0D0F] rounded-xl p-1 border border-[#252528]">
              {([['incoming', 'Incoming', activePending.length], ['outgoing', 'Outgoing', OUTGOING_CHALLENGES.length]] as const).map(([v, label, count]) => (
                <button key={v} onClick={() => setChallengeView(v)}
                  className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold ${challengeView === v ? 'text-[#FF4500]' : 'text-[#636366]'}`}>
                  {challengeView === v && (
                    <motion.div layoutId="challenge-pill" className="absolute inset-0 rounded-lg bg-[#1C1C1E] shadow-sm" transition={{ type: 'spring', stiffness: 450, damping: 38 }} />
                  )}
                  <span className="relative z-10">{label}</span>
                  {count > 0 && (
                    <span className={`relative z-10 text-[10px] font-black px-1.5 py-0.5 rounded-md transition-colors ${challengeView === v ? 'bg-[#FF4500] text-white' : 'bg-[#252528] text-[#9A9AAA]'}`}>{count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
        <motion.div key={challengeView} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="flex flex-col gap-2">
          {challengeView === 'incoming' ? (
            activePending.length > 0
              ? (
                <Float amplitude={3} duration={4.5} delay={0.2}>
                <AnimatePresence>
                  {PENDING_CHALLENGES.map((c, i) => dismissed.has(i) ? null : (
                    <motion.div
                      key={i}
                      layout
                      initial={{ opacity: 0, y: 22, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                      className="rounded-2xl overflow-hidden border border-[#FF4500]/30"
                      style={{ background: 'linear-gradient(135deg, #1a0800 0%, #1C1C1E 65%)' }}
                    >
                      <div className="h-[2px] bg-gradient-to-r from-[#FF4500] to-[#FF4500]/10" />
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black"
                            style={{ backgroundColor: `${avatarColor(c.from)}22`, color: avatarColor(c.from), border: `2px solid ${avatarColor(c.from)}55` }}>
                            {initials(c.from)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500] animate-pulse flex-shrink-0" />
                              <p className="text-base font-black text-white">{c.from}</p>
                            </div>
                            <p className="text-xs font-semibold text-[#9A9AAA] mt-0.5">called you out</p>
                          </div>
                          {/* Countdown */}
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-xs font-black text-[#F59E0B] tabular-nums">{c.hoursLeft}h left</span>
                            <span className="text-[9px] text-[#636366] mt-0.5">to respond</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-[#0D0D0F] border border-[#252528] rounded-xl px-3 py-2.5 mb-4">
                          <Swords className="w-4 h-4 text-[#FF4500] flex-shrink-0" />
                          <span className="text-sm font-black text-white">{c.lift}</span>
                          <span className="text-[#3A3A3C] mx-0.5">·</span>
                          <span className="text-sm font-semibold text-[#9A9AAA]">{c.format === 'weight' ? 'Most Weight' : 'Most Reps'}</span>
                        </div>
                        <div className="flex gap-2">
                          <motion.button
                            whileTap={{ scale: 0.93 }}
                            onClick={() => setDismissed(prev => new Set([...prev, i]))}
                            className="flex-1 bg-[#FF4500] text-white font-black py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(255,69,0,0.4)]"
                          >
                            <Check className="w-4 h-4" /> Accept
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.93 }}
                            onClick={() => setDismissed(prev => new Set([...prev, i]))}
                            className="flex-1 bg-[#1C1C1E] border border-[#252528] text-[#9A9AAA] font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:text-white transition-colors"
                          >
                            <X className="w-4 h-4" /> Decline
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                </Float>
              )
              : (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-12 gap-2">
                  <Swords className="w-8 h-8 text-[#3A3A3C]" />
                  <p className="text-sm font-semibold text-[#636366]">No incoming challenges</p>
                  <p className="text-xs text-[#48484A]">When someone calls you out, it shows here</p>
                </motion.div>
              )
          ) : (
            OUTGOING_CHALLENGES.length > 0
              ? <Float amplitude={2} duration={5} delay={0.3} className="flex flex-col gap-2">{OUTGOING_CHALLENGES.map((c, i) => (
                <div key={i} className="rounded-2xl bg-[#1C1C1E] border border-[#252528] p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                    style={{ backgroundColor: `${avatarColor(c.to)}22`, color: avatarColor(c.to), border: `1.5px solid ${avatarColor(c.to)}55` }}>
                    {initials(c.to)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{c.to}</p>
                    <p className="text-xs font-semibold text-[#9A9AAA] mt-0.5 truncate">
                      {c.lift} · {c.format === 'weight' ? 'most weight' : 'most reps'} · <span className="text-[#F59E0B] font-bold">awaiting...</span>
                    </p>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} className="w-10 h-10 rounded-xl bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA] hover:text-white flex-shrink-0">
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              ))}</Float>
              : (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center py-12 gap-2">
                  <Swords className="w-8 h-8 text-[#3A3A3C]" />
                  <p className="text-sm font-semibold text-[#636366]">No outgoing challenges</p>
                  <p className="text-xs text-[#48484A]">Challenge someone from the leaderboard</p>
                </motion.div>
              )
          )}
        </motion.div>
        </AnimatePresence>
        </motion.div>
        )}

        {/* ── LEADERBOARD TAB ── */}
        {activeTab === 'leaderboard' && (
        <motion.div key="leaderboard" custom={tabDir} variants={tabVariants} initial="enter" animate="center" exit="exit" transition={tabTransition} className="flex flex-col gap-3">

        <div className="relative -mx-11 bg-[#161618] border-b border-[#252528] overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-[#F59E0B] via-[#FF4500] to-[#FF4500]" />
          <div className="px-6 pt-7 pb-2 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold text-[#FF4500] uppercase tracking-[0.2em] mb-1">{classWeightLabel(selectedClass)}</p>
              <p className="text-3xl font-black text-white">Leaderboard</p>
            </div>
            <span className="text-xs font-bold text-[#9A9AAA] pb-1">
              {boardView === 'class' ? rankings.length : OPEN_RANKINGS.length} fighters
            </span>
          </div>
          <div className="px-6 pt-3 pb-6">
            <div className="flex bg-[#0D0D0F] rounded-xl p-1 border border-[#252528]">
              {([['class', 'My Class'], ['open', 'All Classes']] as const).map(([v, l]) => (
                <button key={v} onClick={() => setBoardView(v)}
                  className={`relative flex-1 py-2 rounded-lg text-[11px] font-bold whitespace-nowrap ${boardView === v ? 'text-[#FF4500]' : 'text-[#636366]'}`}>
                  {boardView === v && (
                    <motion.div layoutId="board-pill" className="absolute inset-0 rounded-lg bg-[#1C1C1E] shadow-sm" transition={{ type: 'spring', stiffness: 450, damping: 38 }} />
                  )}
                  <span className="relative z-10">{l}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <Float amplitude={2} duration={5.2} delay={0.1} className="flex flex-col gap-1.5">
          {boardView === 'class' ? rankings.map(renderLeaderRow) : OPEN_RANKINGS.map(renderOpenRow)}
        </Float>

        {/* "You are here" anchor */}
        <Float amplitude={2} duration={4.6} delay={0.5} className="flex flex-col gap-3">
          {yourEntry && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#FF450010] border border-[#FF450030]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500] animate-pulse flex-shrink-0" />
              <span className="text-xs font-bold text-[#FF4500]">You · #{yourEntry.pos}</span>
              <span className="text-xs text-[#636366] ml-auto">{yourEntry.record}</span>
            </div>
          )}

        <motion.button whileTap={{ scale: 0.97 }}
          onClick={handleChallengeSomeone}
          className="relative w-full overflow-hidden bg-gradient-to-b from-[#FF5A1A] to-[#FF4500] text-white font-black uppercase tracking-wide py-4 rounded-2xl text-[15px] flex items-center justify-center gap-2 border border-[#FF6B35]/40 shadow-[0_10px_30px_rgba(255,69,0,0.5)]"
        >
          <span className="absolute inset-x-0 top-0 h-px bg-white/30" />
          <Swords className="w-4 h-4" />
          Challenge Someone
        </motion.button>
        </Float>
        </motion.div>
        )}

        </AnimatePresence>
      </div>

      {/* Tab bar */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[900px] px-5 z-20">
        <div className="flex bg-[#161618] rounded-xl p-1 border border-[#252528] shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            const showDot = tab.id === 'challenges' && activePending.length > 0
            return (
              <button
                key={tab.id}
                onClick={() => changeTab(tab.id)}
                className={`relative flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest ${active ? 'text-[#FF4500]' : 'text-[#636366]'}`}
              >
                {active && (
                  <motion.div
                    layoutId="compete-tab-pill"
                    className="absolute inset-0 rounded-lg bg-[#1C1C1E] shadow-sm"
                    transition={{ type: 'spring', stiffness: 450, damping: 38 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
                {showDot && <span className="absolute top-1 right-[28%] w-1.5 h-1.5 rounded-full bg-[#FF4500] animate-pulse z-20" />}
              </button>
            )
          })}
        </div>
      </div>

      <BottomNav active="compete" />

      {/* Matchmaking overlay */}
      <AnimatePresence>
        {matchState === 'finding' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 z-[55] flex flex-col items-center justify-center gap-5"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
              className="w-14 h-14 rounded-full border-2 border-[#FF4500] border-t-transparent"
            />
            <div className="text-center">
              <p className="text-white font-black text-xl">Finding your match...</p>
              <p className="text-[#9A9AAA] text-sm mt-1">Searching your weight class</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Challenge sheet */}
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
                  <p className="text-[#9A9AAA] text-sm">{challengeOpponent ? (challengeSuperfight ? `${challengeOpponent} · Superfight (P4P)` : challengeOpponent) : ''}</p>
                </div>
                <button onClick={() => setChallengeOpen(false)} className="w-9 h-9 rounded-xl bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA] hover:text-white flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-8">
                <p className="text-[11px] font-bold text-[#9A9AAA] uppercase tracking-widest mb-2">Format</p>
                <div className="flex bg-[#161618] rounded-xl p-1 border border-[#252528] mb-5">
                  {([['weight', 'Most Weight'], ['reps', 'Most Reps']] as const).map(([val, label]) => (
                    <button key={val} onClick={() => setChallengeFormat(val)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${challengeFormat === val ? 'bg-[#1C1C1E] text-white shadow-sm' : 'text-[#636366]'}`}>
                      {label}
                    </button>
                  ))}
                </div>

                <p className="text-[11px] font-bold text-[#9A9AAA] uppercase tracking-widest mb-2">Lift</p>
                <div className="flex flex-col gap-2 mb-6">
                  {BIG_SIX.map(l => (
                    <button key={l.name} onClick={() => setChallengeLift(l.name)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${challengeLift === l.name ? 'border-[#FF4500] bg-[#FF4500]/10' : 'border-[#252528] bg-[#161618]'}`}>
                      <span className={`text-sm font-bold ${challengeLift === l.name ? 'text-[#FF4500]' : 'text-white'}`}>{l.name}</span>
                      {challengeLift === l.name && <Check className="w-4 h-4 text-[#FF4500]" />}
                    </button>
                  ))}
                </div>

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
