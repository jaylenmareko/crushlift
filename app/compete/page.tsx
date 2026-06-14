'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Swords, Lock, Trophy, TrendingUp, ChevronRight, ChevronLeft, ChevronDown, Scale, X, Check, Video, ShieldCheck, ShieldAlert } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import PRVerifyModal from '@/components/PRVerifyModal'
import PlateCheckModal from '@/components/PlateCheckModal'
import RepsWeightModal from '@/components/RepsWeightModal'
import AddedWeightPhotoModal from '@/components/AddedWeightPhotoModal'
import { createClient } from '@/lib/supabase/client'

function getWeightClass(w: number) {
  if (w < 135) return { index: 0, full: 'Lightweight  ·  < 135 lbs' }
  if (w < 151) return { index: 1, full: 'Light Middle  ·  135–150 lbs' }
  if (w < 176) return { index: 2, full: 'Middle  ·  150–175 lbs' }
  if (w < 201) return { index: 3, full: 'Light Heavy  ·  175–200 lbs' }
  if (w < 221) return { index: 4, full: 'Heavy  ·  200–220 lbs' }
  return { index: 5, full: 'Super Heavy  ·  220+ lbs' }
}

// ─── Data ────────────────────────────────────────────────────────────────────

const TIERS = [
  { name: 'Legend', color: '#FFC107', threshold: 405 },
  { name: 'Master', color: '#8B5CF6', threshold: 315 },
  { name: 'Elite',  color: '#EF4444', threshold: 255 },
  { name: 'Lifter', color: '#3B82F6', threshold: 185 },
  { name: 'Bronze', color: '#22C55E', threshold: 135 },
  { name: 'Iron',   color: '#636366', threshold: 95  },
]

// Iron's gray (#636366) is too low-contrast for text/icons on dark cards, and also matches the
// "locked/unearned" gray (#9A9AAA) — brighten it further so an earned Iron belt is visibly distinct
function displayColor(color: string) {
  return color === '#636366' ? '#D1D5DB' : color
}


const WEIGHT_CLASSES = [
  { label: '< 135',   full: 'Lightweight  ·  < 135 lbs' },
  { label: '135–150', full: 'Light Middle  ·  135–150 lbs' },
  { label: '150–175', full: 'Middle  ·  150–175 lbs' },
  { label: '175–200', full: 'Light Heavy  ·  175–200 lbs' },
  { label: '200–220', full: 'Heavy  ·  200–220 lbs' },
  { label: '220+',    full: 'Super Heavy  ·  220+ lbs' },
]

const USER_TIER = 'Lifter' // battle-rank tier, used on Rankings & Battles tab
const USER_CLASS_INDEX = 2

const UNRANKED = { name: 'Unranked', color: '#48484A', threshold: 0 }

// Belt maintenance — log a qualifying PR within this window or drop a tier
const DECAY_DAYS = 60
const WARNING_DAYS = 7

// Per-lift PRs — each Big 6 lift earns its own belt independently
const USER_LIFTS_DEFAULT: { name: string; best: number; bestReps: number | null; lastPrAt: string | null; type: 'barbell' | 'bodyweight' }[] = [
  { name: 'Bench Press',    best: 205, bestReps: null, lastPrAt: '2026-05-20', type: 'barbell' },
  { name: 'Squat',          best: 155, bestReps: null, lastPrAt: '2026-04-18', type: 'barbell' },
  { name: 'Deadlift',       best: 225, bestReps: null, lastPrAt: '2026-03-01', type: 'barbell' },
  { name: 'Overhead Press', best: 95,  bestReps: null, lastPrAt: '2026-06-05', type: 'barbell' },
  { name: 'Power Clean',    best: 115, bestReps: null, lastPrAt: '2026-06-10', type: 'barbell' },
  { name: 'Pull-up',        best: 0,   bestReps: null, lastPrAt: null,         type: 'bodyweight' },
]

// Highest tier index whose threshold the weight clears (0 = Legend, best). -1 = below Iron.
function getTierIndex(weight: number) {
  for (let i = 0; i < TIERS.length; i++) {
    if (weight >= TIERS[i].threshold) return i
  }
  return -1
}

function daysSince(dateStr: string) {
  const ms = Date.now() - new Date(dateStr).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function shortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
}

function decayDate(lastPrAt: string) {
  const d = new Date(new Date(lastPrAt).getTime() + DECAY_DAYS * 86400000)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const RANKINGS_DATA: Record<number, { pos: number; name: string; record: string; tier: string; you: boolean }[]> = {
  0: [
    { pos: 1, name: 'Cam R.',    record: '14-2', tier: 'Elite',  you: false },
    { pos: 2, name: 'Devon L.',  record: '11-4', tier: 'Lifter', you: false },
    { pos: 3, name: 'Nate P.',   record: '8-5',  tier: 'Lifter', you: false },
  ],
  1: [
    { pos: 1, name: 'Leon T.',   record: '18-1', tier: 'Master', you: false },
    { pos: 2, name: 'Jax M.',    record: '12-3', tier: 'Elite',  you: false },
    { pos: 3, name: 'Benny A.',  record: '9-4',  tier: 'Lifter', you: false },
    { pos: 4, name: 'Gus W.',    record: '6-6',  tier: 'Lifter', you: false },
  ],
  2: [
    { pos: 1, name: 'Marcus T.', record: '21-2', tier: 'Elite',  you: false },
    { pos: 2, name: 'Dre W.',    record: '15-5', tier: 'Elite',  you: false },
    { pos: 3, name: 'Kyle B.',   record: '10-4', tier: 'Lifter', you: false },
    { pos: 4, name: 'You',       record: '2-1',  tier: 'Lifter', you: true  },
    { pos: 5, name: 'Jordan S.', record: '2-2',  tier: 'Lifter', you: false },
    { pos: 6, name: 'Tyler M.',  record: '1-3',  tier: 'Novice', you: false },
    { pos: 7, name: 'Chris A.',  record: '0-2',  tier: 'Novice', you: false },
  ],
  3: [
    { pos: 1, name: 'Big K.',    record: '22-0', tier: 'Legend', you: false },
    { pos: 2, name: 'Will H.',   record: '14-3', tier: 'Master', you: false },
    { pos: 3, name: 'Andre M.',  record: '9-5',  tier: 'Elite',  you: false },
  ],
  4: [
    { pos: 1, name: 'Tank G.',   record: '30-1', tier: 'Legend', you: false },
    { pos: 2, name: 'Hector V.', record: '19-4', tier: 'Master', you: false },
    { pos: 3, name: 'Duke R.',   record: '11-6', tier: 'Elite',  you: false },
  ],
  5: [
    { pos: 1, name: 'Goliath.', record: '25-0', tier: 'Legend', you: false },
    { pos: 2, name: 'Rex J.',   record: '18-3', tier: 'Master', you: false },
    { pos: 3, name: 'Bull C.',  record: '12-5', tier: 'Elite',  you: false },
  ],
}

const DUMMY_BATTLES = [
  { opponent: 'Marcus T.', lift: 'Squat',    status: 'pending', weight: '—',          result: null },
  { opponent: 'Dre W.',    lift: 'Bench',    status: 'won',     weight: '225 vs 205',  result: 'W'  },
  { opponent: 'Kyle B.',   lift: 'Deadlift', status: 'lost',    weight: '315 vs 295',  result: 'L'  },
]

type View = 'home' | 'belts' | 'compete'
type CompeteTab = 'rankings' | 'battles'

const slideIn  = { initial: { opacity: 0, x: 40  }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -40 }, transition: { duration: 0.22, ease: 'easeOut' } }
const slideOut = { initial: { opacity: 0, x: -40 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 40  }, transition: { duration: 0.22, ease: 'easeOut' } }

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CompetePage() {
  const [view, setView]             = useState<View>('home')
  const [competeTab, setCompeteTab] = useState<CompeteTab>('rankings')
  const [selectedClass, setSelectedClass] = useState(USER_CLASS_INDEX)
  const [dir, setDir]               = useState<1 | -1>(1)
  const [expandedLift, setExpandedLift] = useState<string | null>(null)
  const [weightModalOpen, setWeightModalOpen] = useState(false)
  const [prModalOpen, setPrModalOpen] = useState(false)
  const [prStep, setPrStep] = useState<'select' | 'plates' | 'reps' | 'weight-photo' | 'record' | 'verify'>('select')
  const [prLift, setPrLift] = useState<string | null>(null)
  const [prWeight, setPrWeight] = useState<number | null>(null)
  const [prReps, setPrReps] = useState<number | null>(null)
  const [prVerified, setPrVerified] = useState(false)
  const [prPlatePhoto, setPrPlatePhoto] = useState<string | null>(null)
  const [userLifts, setUserLifts] = useState(USER_LIFTS_DEFAULT)
  const [userWeight, setUserWeight] = useState<number | null>(null)
  const [weightInput, setWeightInput] = useState('')
  const [weightLoading, setWeightLoading] = useState(true)
  const [savingWeight, setSavingWeight] = useState(false)
  const [weightError, setWeightError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setWeightLoading(false); return }
      const { data } = await supabase.from('profiles').select('weight').eq('id', user.id).single()
      if (data?.weight) {
        setUserWeight(data.weight)
        setSelectedClass(getWeightClass(data.weight).index)
      }
      setWeightLoading(false)
    }).catch(() => {
      setWeightLoading(false)
    })
  }, [])

  async function saveWeight() {
    if (!weightInput || isNaN(parseFloat(weightInput))) return
    setSavingWeight(true)
    setWeightError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setWeightError('Not signed in.'); return }
      const w = parseFloat(weightInput)
      const { error } = await supabase.from('profiles').update({ weight: w }).eq('id', user.id)
      if (error) { setWeightError(error.message); return }
      setUserWeight(w)
      setSelectedClass(getWeightClass(w).index)
      setWeightModalOpen(false)
    } catch (err) {
      setWeightError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSavingWeight(false)
    }
  }

  function logPr(liftName: string, weight: number | null, reps: number | null, verified: boolean) {
    const today = new Date().toISOString().slice(0, 10)
    setUserLifts(prev => prev.map(l => l.name === liftName
      ? {
          ...l,
          best: weight !== null && weight > l.best ? weight : l.best,
          bestReps: reps !== null && (l.bestReps === null || reps > l.bestReps) ? reps : l.bestReps,
          lastPrAt: today,
        }
      : l
    ))
    setPrModalOpen(false)
    setPrStep('select')
    setPrLift(null)
    setPrWeight(null)
    setPrReps(null)
    setPrVerified(verified)
    setPrPlatePhoto(null)
  }

  const userTierData  = TIERS.find(t => t.name === USER_TIER)!
  const rankings      = RANKINGS_DATA[selectedClass] ?? []

  // Per-lift belt data — applies decay: no qualifying PR within DECAY_DAYS drops a tier
  const liftData = userLifts.map(l => {
    const baseTierIdx = getTierIndex(l.best)
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
  const bestLift = liftData.reduce((a, b) => {
    const ai = a.tierIdx === -1 ? Infinity : a.tierIdx
    const bi = b.tierIdx === -1 ? Infinity : b.tierIdx
    return bi < ai ? b : a
  })

  function enter(v: View) { setDir(1);  setView(v) }
  function back()          { setDir(-1); setView('home') }

  const anim = dir === 1 ? slideIn : slideOut

  if (weightLoading) return (
    <div className="mobile-container flex items-center justify-center min-h-dvh bg-[#0D0D0F]">
      <div className="w-8 h-8 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!userWeight) return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0D0D0F] has-bottom-nav">
      <header className="px-5 pt-12 pb-6">
        <p className="text-[10px] font-bold text-[#FF4500] uppercase tracking-[0.2em] mb-1">Power Rank</p>
        <h1 className="text-2xl font-bold">Compete</h1>
      </header>
      <div className="flex-1 px-5 flex flex-col items-center justify-center gap-6 pb-4">
        <div className="w-20 h-20 rounded-3xl bg-[#FF4500]/10 border-2 border-[#FF4500]/30 flex items-center justify-center">
          <Scale className="w-9 h-9 text-[#FF4500]" />
        </div>
        <div className="text-center">
          <p className="text-xl font-black text-white mb-2">What's your bodyweight?</p>
          <p className="text-sm text-[#636366] leading-relaxed">We need this to place you in the right weight class for belts and battle rankings.</p>
        </div>
        <div className="w-full">
          <div className="flex items-center bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 gap-3 mb-3">
            <input
              type="number"
              inputMode="decimal"
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              placeholder="Enter your weight"
              className="flex-1 bg-transparent text-white text-lg font-bold focus:outline-none placeholder:text-[#48484A]"
            />
            <span className="text-sm font-bold text-[#636366]">lbs</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={saveWeight}
            disabled={!weightInput || savingWeight}
            className="w-full bg-[#FF4500] text-white font-bold py-4 rounded-2xl text-base shadow-[0_8px_32px_rgba(255,69,0,0.25)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {savingWeight ? 'Saving...' : 'Enter the Competition'}
          </motion.button>
        </div>
      </div>
      <BottomNav active="compete" />
    </div>
  )

  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0D0D0F] has-bottom-nav overflow-hidden">
      <AnimatePresence mode="wait">

        {/* ── HOME ── */}
        {view === 'home' && (
          <motion.div key="home" {...anim} className="flex flex-col flex-1">
            <header className="px-5 pt-12 pb-6">
              <p className="text-[10px] font-bold text-[#FF4500] uppercase tracking-[0.2em] mb-1">Power Rank</p>
              <h1 className="text-2xl font-bold">Compete</h1>
            </header>

            <div className="flex-1 px-5 flex flex-col gap-3 pb-4">

              {/* Belts card */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => enter('belts')}
                className="w-full text-left bg-[#1C1C1E] border border-[#252528] rounded-2xl overflow-hidden"
              >
                <div className="h-1 bg-gradient-to-r from-[#F59E0B] via-[#3B82F6] to-[#FF4500]" />
                <div className="p-5 flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 border-2"
                    style={{ backgroundColor: `${bestLift.tier.color}20`, borderColor: displayColor(bestLift.tier.color) }}
                  >
                    <Trophy className="w-7 h-7" style={{ color: displayColor(bestLift.tier.color) }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-black text-white leading-none">Belts</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      {liftData.map(l => (
                        <div key={l.name} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: displayColor(l.tier.color) }} />
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#3A3A3C] flex-shrink-0" />
                </div>
              </motion.button>

              {/* Rankings & Battles card */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => enter('compete')}
                className="w-full text-left bg-[#1C1C1E] border border-[#252528] rounded-2xl overflow-hidden"
              >
                <div className="h-1 bg-gradient-to-r from-[#FF4500] via-[#EC4899] to-[#8B5CF6]" />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#FF4500]/10 border-2 border-[#FF4500]/40 flex flex-col items-center justify-center flex-shrink-0">
                      <Swords className="w-6 h-6 text-[#FF4500]" />
                      <span className="text-[8px] font-black mt-0.5 uppercase tracking-wider text-[#FF4500]">Battle</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-[#636366] uppercase tracking-widest mb-0.5">Rankings & Battles</p>
                      <p className="text-lg font-black text-white leading-none">#4 in Middle</p>
                      <p className="text-xs text-[#636366] mt-1">Record: <span className="text-[#22C55E] font-bold">2W</span> · <span className="text-red-400 font-bold">1L</span></p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#3A3A3C] flex-shrink-0" />
                  </div>
                  {/* Pending battle callout */}
                  <div className="flex items-center gap-2 bg-[#FF4500]/8 border border-[#FF4500]/20 rounded-xl px-3 py-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF4500] animate-pulse flex-shrink-0" />
                    <p className="text-xs font-semibold text-[#FF4500]">Marcus T. challenged you · Squat</p>
                  </div>
                </div>
              </motion.button>

            </div>
            <BottomNav active="compete" />
          </motion.div>
        )}

        {/* ── BELTS ── */}
        {view === 'belts' && (
          <motion.div key="belts" {...anim} className="flex flex-col flex-1">
            <header className="px-5 pt-12 pb-4 flex items-center gap-3">
              <button onClick={back} className="text-[#9A9AAA]"><ChevronLeft className="w-5 h-5" /></button>
              <div>
                <p className="text-[10px] font-bold text-[#FF4500] uppercase tracking-[0.2em]">Power Rank</p>
                <h1 className="text-2xl font-bold leading-none">Belts</h1>
              </div>
            </header>

            <div className="flex-1 px-5 flex flex-col gap-3 pb-4 overflow-y-auto">

              {/* Weight class hero */}
              <div
                className="rounded-2xl p-4 flex items-center gap-4 border"
                style={{ backgroundColor: `${bestLift.tier.color}10`, borderColor: `${bestLift.tier.color}30` }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border-2"
                  style={{ backgroundColor: `${bestLift.tier.color}20`, borderColor: displayColor(bestLift.tier.color) }}
                >
                  <Scale className="w-6 h-6" style={{ color: displayColor(bestLift.tier.color) }} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-[#636366] uppercase tracking-widest font-bold mb-0.5">Weight Class</p>
                  <p className="text-base font-bold text-white">{getWeightClass(userWeight!).full}</p>
                </div>
                <button
                  onClick={() => { setWeightInput(String(userWeight)); setWeightError(null); setWeightModalOpen(true) }}
                  className="text-xs font-bold text-[#FF4500] flex-shrink-0"
                >
                  Change
                </button>
              </div>

              {/* Per-lift belt ladders */}
              <p className="text-[11px] font-bold text-[#636366] uppercase tracking-widest px-1 mt-1">Belts by Lift</p>
              <div className="flex flex-col gap-2">
                {liftData.map(l => {
                  const isOpen = expandedLift === l.name
                  const hasLog = l.best > 0 || (l.bestReps !== null && l.bestReps > 0)
                  return (
                    <div key={l.name} className="bg-[#1C1C1E] border border-[#252528] rounded-2xl overflow-hidden">
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (hasLog) {
                            setExpandedLift(o => o === l.name ? null : l.name)
                          } else {
                            setPrLift(l.name)
                            setPrWeight(null)
                            setPrReps(null)
                            setPrVerified(false)
                            setPrPlatePhoto(null)
                            setPrStep(l.type === 'bodyweight' ? 'reps' : 'plates')
                            setPrModalOpen(true)
                          }
                        }}
                        className="w-full text-left p-4 flex items-center gap-3"
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border-2"
                          style={{ backgroundColor: `${l.tier.color}20`, borderColor: displayColor(l.tier.color) }}
                        >
                          <Trophy className="w-5 h-5" style={{ color: displayColor(l.tier.color) }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white">{l.name}</p>
                          {hasLog ? (
                            <>
                              <span
                                className="inline-flex items-center mt-1 text-xs font-black px-2 py-0.5 rounded-md"
                                style={{ color: displayColor(l.tier.color), backgroundColor: `${l.tier.color}25` }}
                              >
                                {l.tier.name} · {l.bestReps ? `${l.bestReps} ${l.bestReps === 1 ? 'rep' : 'reps'}${l.best ? ` + ${l.best} lbs` : ''}` : `${l.best} lbs`}
                              </span>
                              {l.demoted ? (
                                <p className="text-[11px] font-bold mt-1 text-[#F59E0B]">Dropped from {l.droppedFrom} belt to {l.tier.name} belt, log a PR to climb back</p>
                              ) : l.atRisk ? (
                                <p className="text-[11px] font-bold mt-1 text-[#F59E0B]">⚠ {l.daysLeft} {l.daysLeft === 1 ? 'day' : 'days'} left — log a PR to defend and maintain {l.tier.name} belt</p>
                              ) : l.daysLeft !== null ? (
                                <p className="text-[11px] font-semibold text-[#9A9AAA] mt-1">Defend belt by {decayDate(l.lastPrAt!)} ({l.daysLeft} days left)</p>
                              ) : null}
                            </>
                          ) : (
                            <p className="text-xs font-bold mt-0.5 text-[#FF4500]">Log a PR to earn this belt →</p>
                          )}
                        </div>
                        {hasLog && (
                          <motion.div
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-7 h-7 rounded-full bg-[#252528] border border-[#3A3A3C] flex items-center justify-center flex-shrink-0"
                          >
                            <ChevronDown className="w-4 h-4 text-[#9A9AAA]" />
                          </motion.div>
                        )}
                      </motion.button>

                      <AnimatePresence>
                        {isOpen && hasLog && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden border-t border-[#252528]"
                          >
                            {l.lastPrAt && (
                              <p className="text-[11px] font-semibold text-[#9A9AAA] px-3 pt-2.5">
                                Last verified: {shortDate(l.lastPrAt)}
                              </p>
                            )}
                            <div className="flex flex-col p-2 gap-1">
                              {TIERS.map((tier, i) => {
                                const isCurrent = i === l.tierIdx
                                const isEarned  = l.tierIdx !== -1 && i >= l.tierIdx
                                const rangeLabel = i === 0
                                  ? `${tier.threshold}+ lbs`
                                  : `${tier.threshold}–${TIERS[i - 1].threshold - 1} lbs`
                                return (
                                  <div key={tier.name}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${isCurrent ? '' : 'border-transparent'}`}
                                    style={isCurrent ? { backgroundColor: `${tier.color}12`, borderColor: `${displayColor(tier.color)}40` } : {}}
                                  >
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: isEarned ? displayColor(tier.color) : '#636366' }} />
                                    <span className="text-sm font-bold flex-1" style={{ color: isEarned ? displayColor(tier.color) : '#9A9AAA' }}>{tier.name}</span>
                                    <span className="text-xs tabular-nums font-semibold" style={{ color: isEarned ? displayColor(tier.color) : '#9A9AAA' }}>{rangeLabel}</span>
                                    {isCurrent
                                      ? <span className="text-[10px] font-black px-2 py-0.5 rounded-md ml-1" style={{ color: displayColor(tier.color), backgroundColor: `${tier.color}20` }}>YOURS</span>
                                      : !isEarned
                                        ? <Lock className="w-3 h-3 text-[#636366] ml-1" />
                                        : null
                                    }
                                  </div>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>

            </div>
            <div className="px-5 pb-6 pt-3">
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => { setPrStep('select'); setPrLift(null); setPrModalOpen(true) }}
                className="w-full bg-[#FF4500] text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
              >
                <Trophy className="w-4 h-4" />
                Log a PR
              </motion.button>
            </div>
            <BottomNav active="compete" />
          </motion.div>
        )}

        {/* ── RANKINGS & BATTLES ── */}
        {view === 'compete' && (
          <motion.div key="compete" {...anim} className="flex flex-col flex-1">
            <header className="px-5 pt-12 pb-4 flex items-center gap-3">
              <button onClick={back} className="text-[#9A9AAA]"><ChevronLeft className="w-5 h-5" /></button>
              <div>
                <p className="text-[10px] font-bold text-[#FF4500] uppercase tracking-[0.2em]">Power Rank</p>
                <h1 className="text-2xl font-bold leading-none">Rankings & Battles</h1>
              </div>
            </header>

            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Tabs */}
              <div className="flex mx-5 mb-3 bg-[#161618] rounded-xl p-1 border border-[#252528]">
                {(['rankings', 'battles'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setCompeteTab(tab)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                      competeTab === tab ? 'bg-[#1C1C1E] text-white shadow-sm' : 'text-[#636366]'
                    }`}
                  >
                    {tab === 'rankings' ? <TrendingUp className="w-3 h-3" /> : <Swords className="w-3 h-3" />}
                    {tab === 'rankings' ? 'Rankings' : 'Battles'}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">

                {/* Rankings */}
                {competeTab === 'rankings' && (
                  <motion.div key="rankings" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="flex flex-col flex-1 overflow-hidden px-5 gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-black text-white leading-none">#4 in Middle</p>
                        <p className="text-xs text-[#636366] mt-0.5">Battle your way to #1</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-[#636366] uppercase tracking-widest font-bold mb-0.5">Record</p>
                        <p className="text-xl font-black" style={{ color: userTierData.color }}>2–1</p>
                      </div>
                    </div>

                    {/* Weight class pills */}
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                      {WEIGHT_CLASSES.map((wc, i) => (
                        <button key={i} onClick={() => setSelectedClass(i)}
                          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                            selectedClass === i ? 'border-[#FF4500] bg-[#FF4500]/10 text-[#FF4500]' : 'border-[#252528] bg-[#252528] text-[#636366]'
                          }`}
                        >{wc.label}</button>
                      ))}
                    </div>

                    {/* Leaderboard */}
                    <div className="bg-[#1C1C1E] border border-[#252528] rounded-2xl overflow-hidden flex-1">
                      <div className="grid grid-cols-[28px_1fr_52px_48px] gap-2 px-4 py-2.5 border-b border-[#252528]">
                        {['#', 'Fighter', 'Record', 'Belt'].map(h => (
                          <span key={h} className="text-[9px] font-bold text-[#48484A] uppercase tracking-widest">{h}</span>
                        ))}
                      </div>
                      <div className="overflow-y-auto max-h-[320px] p-2 flex flex-col gap-1">
                        {rankings.map((entry, i) => {
                          const tierColor = displayColor(TIERS.find(t => t.name === entry.tier)?.color ?? '#636366')
                          return (
                            <motion.div key={entry.pos}
                              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                              className={`grid grid-cols-[28px_1fr_52px_48px] gap-2 items-center px-3 py-2.5 rounded-xl ${entry.you ? 'border' : 'bg-[#252528]/60'}`}
                              style={entry.you ? { backgroundColor: `${userTierData.color}12`, borderColor: `${userTierData.color}40` } : {}}
                            >
                              <span className={`text-xs font-black text-center ${entry.pos === 1 ? 'text-[#FF4500]' : entry.pos === 2 ? 'text-[#9A9AAA]' : entry.pos === 3 ? 'text-[#F59E0B]' : 'text-[#48484A]'}`}>{entry.pos}</span>
                              <p className={`text-xs font-bold truncate ${entry.you ? 'text-white' : 'text-[#9A9AAA]'}`}>
                                {entry.name}{entry.you && <span className="text-[9px] font-black ml-1.5" style={{ color: userTierData.color }}> YOU</span>}
                              </p>
                              <span className="text-xs font-bold tabular-nums text-[#636366]">{entry.record}</span>
                              <span className="text-[10px] font-bold" style={{ color: tierColor }}>{entry.tier}</span>
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Battles */}
                {competeTab === 'battles' && (
                  <motion.div key="battles" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="flex flex-col flex-1 px-5 gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-black text-white leading-none">2W · 1L</p>
                        <p className="text-xs text-[#FF4500] mt-0.5 font-semibold">1 pending response</p>
                      </div>
                      <motion.button whileTap={{ scale: 0.97 }}
                        className="bg-[#FF4500] text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-[0_4px_20px_rgba(255,69,0,0.3)]"
                      >
                        <Swords className="w-3.5 h-3.5" />
                        Challenge
                      </motion.button>
                    </div>

                    <div className="flex flex-col gap-2">
                      {DUMMY_BATTLES.map((b, i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[#1C1C1E] border border-[#252528]">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black ${
                            b.result === 'W' ? 'bg-[#22C55E]/15 text-[#22C55E]' :
                            b.result === 'L' ? 'bg-red-500/15 text-red-400' :
                            'bg-[#FF4500]/15 text-[#FF4500]'
                          }`}>{b.result ?? '!'}</div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white">{b.opponent}</p>
                            <p className="text-[10px] text-[#636366]">{b.lift} · {b.weight}</p>
                          </div>
                          <span className={`text-[10px] font-bold ${
                            b.status === 'pending' ? 'text-[#FF4500]' :
                            b.status === 'won' ? 'text-[#22C55E]' : 'text-red-400'
                          }`}>{b.status === 'pending' ? 'Pending' : b.status === 'won' ? 'Won' : 'Lost'}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-[10px] text-[#48484A] text-center">1v1 · Same weight class · Most weight moved wins</p>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
            <BottomNav active="compete" />
          </motion.div>
        )}

      </AnimatePresence>

      {/* Change weight class modal */}
      <AnimatePresence>
        {weightModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-5"
            onClick={() => setWeightModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-[#1C1C1E] border border-[#252528] rounded-3xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-white">Update Bodyweight</h2>
                <button onClick={() => setWeightModalOpen(false)} className="text-[#636366]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-[#636366] mb-3">This updates your weight class for belts and rankings.</p>
              <div className="flex items-center bg-[#161618] border border-[#252528] rounded-2xl px-4 py-4 gap-3 mb-3">
                <input
                  type="number"
                  inputMode="decimal"
                  value={weightInput}
                  onChange={e => setWeightInput(e.target.value)}
                  placeholder="Enter your weight"
                  className="flex-1 bg-transparent text-white text-lg font-bold focus:outline-none placeholder:text-[#48484A]"
                />
                <span className="text-sm font-bold text-[#636366]">lbs</span>
              </div>
              {weightError && (
                <p className="text-xs text-red-400 mb-3">{weightError}</p>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={saveWeight}
                disabled={!weightInput || savingWeight}
                className="w-full bg-[#FF4500] text-white font-bold py-3.5 rounded-2xl text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {savingWeight ? 'Saving...' : 'Save'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log a PR modal */}
      <AnimatePresence>
        {prModalOpen && prStep !== 'plates' && prStep !== 'verify' && prStep !== 'reps' && prStep !== 'weight-photo' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-5"
            onClick={() => setPrModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-[#1C1C1E] border border-[#252528] rounded-3xl p-5"
            >
              {prStep === 'select' ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-black text-white">Log a PR</h2>
                    <button onClick={() => setPrModalOpen(false)} className="text-[#636366]">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 mb-4 max-h-[50vh] overflow-y-auto">
                    {liftData.map(l => (
                      <button
                        key={l.name}
                        onClick={() => setPrLift(l.name)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                          prLift === l.name ? 'border-[#FF4500] bg-[#FF4500]/10' : 'border-[#252528] bg-[#161618]'
                        }`}
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border-2"
                          style={{ backgroundColor: `${l.tier.color}20`, borderColor: displayColor(l.tier.color) }}
                        >
                          <Trophy className="w-4 h-4" style={{ color: displayColor(l.tier.color) }} />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-bold text-white">{l.name}</p>
                          <p className="text-xs font-semibold text-[#9A9AAA] mt-0.5">
                            {l.bestReps ? `Current: ${l.bestReps} ${l.bestReps === 1 ? 'rep' : 'reps'}${l.best ? ` + ${l.best} lbs` : ''}` : l.best > 0 ? `Current: ${l.best} lbs` : 'No PR logged'}
                          </p>
                        </div>
                        {prLift === l.name && <Check className="w-4 h-4 text-[#FF4500] flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={!prLift}
                    onClick={() => {
                      setPrWeight(null)
                      setPrReps(null)
                      setPrVerified(false)
                      setPrPlatePhoto(null)
                      const lift = liftData.find(x => x.name === prLift)
                      setPrStep(lift?.type === 'bodyweight' ? 'reps' : 'plates')
                    }}
                    className="w-full bg-[#FF4500] text-white font-bold py-3.5 rounded-2xl text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continue
                  </motion.button>
                </>
              ) : prStep === 'record' ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => {
                      const lift = liftData.find(x => x.name === prLift)
                      if (lift?.type === 'bodyweight') {
                        setPrStep(prWeight && prWeight > 0 ? 'weight-photo' : 'reps')
                      } else {
                        setPrStep('plates')
                      }
                    }} className="text-[#9A9AAA]"><ChevronLeft className="w-5 h-5" /></button>
                    <h2 className="text-lg font-black text-white flex-1">{prLift}</h2>
                    <button onClick={() => setPrModalOpen(false)} className="text-[#636366]">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {prReps !== null ? (
                    prWeight ? (
                      <div className="rounded-2xl border p-3 flex items-center gap-3 mb-4" style={{ backgroundColor: prVerified ? '#22C55E10' : '#F59E0B10', borderColor: prVerified ? '#22C55E30' : '#F59E0B30' }}>
                        {prVerified ? <ShieldCheck className="w-5 h-5 text-[#22C55E] flex-shrink-0" /> : <ShieldAlert className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />}
                        <div>
                          <p className="text-sm font-black text-white">
                            {prReps} {prReps === 1 ? 'rep' : 'reps'} + {prWeight} lbs
                          </p>
                          <p className="text-[10px]" style={{ color: prVerified ? '#22C55E' : '#F59E0B' }}>{prVerified ? 'Added weight verified' : 'Unverified weight'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-[#252528] bg-[#161618] p-3 flex items-center gap-3 mb-4">
                        <div>
                          <p className="text-sm font-black text-white">
                            {prReps} {prReps === 1 ? 'rep' : 'reps'} (bodyweight)
                          </p>
                          <p className="text-[10px] text-[#9A9AAA]">Logging this PR</p>
                        </div>
                      </div>
                    )
                  ) : prWeight !== null && (
                    <div className="rounded-2xl border p-3 flex items-center gap-3 mb-4" style={{ backgroundColor: prVerified ? '#22C55E10' : '#F59E0B10', borderColor: prVerified ? '#22C55E30' : '#F59E0B30' }}>
                      {prVerified ? <ShieldCheck className="w-5 h-5 text-[#22C55E] flex-shrink-0" /> : <ShieldAlert className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />}
                      <div>
                        <p className="text-sm font-black text-white">{prWeight} lbs</p>
                        <p className="text-[10px]" style={{ color: prVerified ? '#22C55E' : '#F59E0B' }}>{prVerified ? 'Plates verified' : 'Unverified weight'}</p>
                      </div>
                    </div>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPrStep('verify')}
                    className="w-full bg-[#FF4500] text-white font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
                  >
                    <Video className="w-4 h-4" />
                    Start Recording
                  </motion.button>
                </>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {prModalOpen && prStep === 'verify' && prLift && (
          <PRVerifyModal
            exerciseName={prLift}
            weight={prWeight ?? 0}
            reps={prReps ?? undefined}
            platePhoto={prPlatePhoto}
            onClose={() => setPrStep('record')}
            onDone={verified => logPr(prLift, prWeight, prReps, verified)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {prModalOpen && prStep === 'plates' && prLift && (
          <PlateCheckModal
            liftName={prLift}
            onClose={() => setPrModalOpen(false)}
            onDone={(weight, verified, photo) => {
              setPrWeight(weight)
              setPrVerified(verified)
              setPrPlatePhoto(photo)
              setPrStep('record')
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {prModalOpen && prStep === 'reps' && prLift && (
          <RepsWeightModal
            liftName={prLift}
            onClose={() => setPrModalOpen(false)}
            onDone={(reps, weight) => {
              setPrReps(reps)
              setPrWeight(weight)
              setPrVerified(false)
              setPrPlatePhoto(null)
              setPrStep(weight > 0 ? 'weight-photo' : 'record')
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {prModalOpen && prStep === 'weight-photo' && prLift && prWeight !== null && (
          <AddedWeightPhotoModal
            liftName={prLift}
            weight={prWeight}
            onClose={() => setPrModalOpen(false)}
            onDone={(verified, photo) => {
              setPrVerified(verified)
              setPrPlatePhoto(photo)
              setPrStep('record')
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
