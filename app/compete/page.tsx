'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Swords, Lock, Trophy, Shield, TrendingUp } from 'lucide-react'
import BottomNav from '@/components/BottomNav'

const TIERS = [
  { name: 'Legend',   color: '#FF4500' },
  { name: 'Master',   color: '#EC4899' },
  { name: 'Elite',    color: '#8B5CF6' },
  { name: 'Lifter',   color: '#3B82F6' },
  { name: 'Novice',   color: '#22C55E' },
  { name: 'Beginner', color: '#636366' },
]

const WEIGHT_CLASSES = [
  { label: '< 135',   full: 'Lightweight  ·  < 135 lbs' },
  { label: '135–150', full: 'Light Middle  ·  135–150 lbs' },
  { label: '150–175', full: 'Middle  ·  150–175 lbs' },
  { label: '175–200', full: 'Light Heavy  ·  175–200 lbs' },
  { label: '200–220', full: 'Heavy  ·  200–220 lbs' },
  { label: '220+',    full: 'Super Heavy  ·  220+ lbs' },
]

const USER_TIER = 'Lifter'
const USER_CLASS_INDEX = 2
const USER_BEST_LIFT = { name: 'Bench Press', weight: 205 }
const NEXT_TIER = 'Elite'
const NEXT_TIER_THRESHOLD = 255

const RANKINGS_DATA: Record<number, { pos: number; name: string; record: string; tier: string; you: boolean }[]> = {
  0: [
    { pos: 1, name: 'Cam R.',    record: '14-2', tier: 'Elite',    you: false },
    { pos: 2, name: 'Devon L.',  record: '11-4', tier: 'Lifter',   you: false },
    { pos: 3, name: 'Nate P.',   record: '8-5',  tier: 'Lifter',   you: false },
  ],
  1: [
    { pos: 1, name: 'Leon T.',   record: '18-1', tier: 'Master',   you: false },
    { pos: 2, name: 'Jax M.',    record: '12-3', tier: 'Elite',    you: false },
    { pos: 3, name: 'Benny A.',  record: '9-4',  tier: 'Lifter',   you: false },
    { pos: 4, name: 'Gus W.',    record: '6-6',  tier: 'Lifter',   you: false },
  ],
  2: [
    { pos: 1, name: 'Marcus T.', record: '21-2', tier: 'Elite',    you: false },
    { pos: 2, name: 'Dre W.',    record: '15-5', tier: 'Elite',    you: false },
    { pos: 3, name: 'Kyle B.',   record: '10-4', tier: 'Lifter',   you: false },
    { pos: 4, name: 'You',       record: '2-1',  tier: 'Lifter',   you: true  },
    { pos: 5, name: 'Jordan S.', record: '2-2',  tier: 'Lifter',   you: false },
    { pos: 6, name: 'Tyler M.',  record: '1-3',  tier: 'Novice',   you: false },
    { pos: 7, name: 'Chris A.',  record: '0-2',  tier: 'Novice',   you: false },
  ],
  3: [
    { pos: 1, name: 'Big K.',    record: '22-0', tier: 'Legend',   you: false },
    { pos: 2, name: 'Will H.',   record: '14-3', tier: 'Master',   you: false },
    { pos: 3, name: 'Andre M.',  record: '9-5',  tier: 'Elite',    you: false },
  ],
  4: [
    { pos: 1, name: 'Tank G.',   record: '30-1', tier: 'Legend',   you: false },
    { pos: 2, name: 'Hector V.', record: '19-4', tier: 'Master',   you: false },
    { pos: 3, name: 'Duke R.',   record: '11-6', tier: 'Elite',    you: false },
  ],
  5: [
    { pos: 1, name: 'Goliath.', record: '25-0', tier: 'Legend',   you: false },
    { pos: 2, name: 'Rex J.',   record: '18-3', tier: 'Master',   you: false },
    { pos: 3, name: 'Bull C.',  record: '12-5', tier: 'Elite',    you: false },
  ],
}

const DUMMY_BATTLES = [
  { opponent: 'Marcus T.', lift: 'Squat',    status: 'pending', weight: '—',          result: null },
  { opponent: 'Dre W.',    lift: 'Bench',    status: 'won',     weight: '225 vs 205',  result: 'W'  },
  { opponent: 'Kyle B.',   lift: 'Deadlift', status: 'lost',    weight: '315 vs 295',  result: 'L'  },
]

const TABS = [
  { key: 'belts',    label: 'Belts',    icon: Shield },
  { key: 'rankings', label: 'Rankings', icon: TrendingUp },
  { key: 'battles',  label: 'Battles',  icon: Swords },
] as const
type Tab = typeof TABS[number]['key']

export default function CompetePage() {
  const [activeTab, setActiveTab] = useState<Tab>('belts')
  const [selectedClass, setSelectedClass] = useState(USER_CLASS_INDEX)

  const userTierData = TIERS.find(t => t.name === USER_TIER)!
  const nextTierData = TIERS.find(t => t.name === NEXT_TIER)!
  const progress = Math.round((USER_BEST_LIFT.weight / NEXT_TIER_THRESHOLD) * 100)
  const rankings = RANKINGS_DATA[selectedClass] ?? []

  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0D0D0F] has-bottom-nav">
      <header className="px-5 pt-12 pb-6">
        <p className="text-[10px] font-bold text-[#FF4500] uppercase tracking-[0.2em] mb-1">Power Rank</p>
        <h1 className="text-2xl font-bold">Compete</h1>
      </header>

      <div className="flex-1 px-5 flex flex-col gap-4 pb-4">
        <div className="bg-[#1C1C1E] border border-[#252528] rounded-2xl overflow-hidden flex flex-col">
          <div className="h-1 bg-gradient-to-r from-[#FF4500] via-[#8B5CF6] to-[#3B82F6]" />

          {/* Tabs */}
          <div className="flex border-b border-[#252528] bg-[#161618]">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex-1 py-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'text-white bg-[#1C1C1E] border-r border-l border-[#252528] -mb-px pb-[13px]'
                    : 'text-[#636366] hover:text-[#9A9AAA]'
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ backgroundColor: userTierData.color }} />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* BELTS */}
            {activeTab === 'belts' && (
              <motion.div key="belts" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="p-5">
                <p className="text-xs text-[#636366] mb-4">Hit the standard. Earn the belt. Your achievement — nobody can take it.</p>

                {/* Current belt */}
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 border"
                    style={{ backgroundColor: `${userTierData.color}15`, borderColor: `${userTierData.color}40` }}
                  >
                    <Trophy className="w-5 h-5" style={{ color: userTierData.color }} />
                    <span className="text-[8px] font-black mt-0.5 uppercase tracking-wider" style={{ color: userTierData.color }}>{USER_TIER}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[#636366] font-semibold uppercase tracking-wider mb-0.5">Your Belt</p>
                    <p className="text-xl font-black text-white leading-none">{USER_TIER}</p>
                    <p className="text-xs text-[#636366] mt-1">{WEIGHT_CLASSES[USER_CLASS_INDEX].full}</p>
                    <p className="text-[10px] text-[#48484A] mt-0.5">Best: {USER_BEST_LIFT.name} — {USER_BEST_LIFT.weight} lbs</p>
                  </div>
                </div>

                {/* Progress to next belt */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-[#636366]">Next belt: {NEXT_TIER}</span>
                    <span className="text-[10px] font-bold" style={{ color: nextTierData.color }}>
                      {USER_BEST_LIFT.weight} / {NEXT_TIER_THRESHOLD} lbs
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#252528] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: nextTierData.color }}
                    />
                  </div>
                </div>

                <div className="h-px bg-[#252528] mb-3" />
                <p className="text-[10px] font-bold text-[#636366] uppercase tracking-wider mb-2">Belt Ladder</p>

                <div className="flex flex-col gap-1">
                  {TIERS.map((tier, i) => {
                    const isCurrent = tier.name === USER_TIER
                    const isEarned = TIERS.findIndex(t => t.name === USER_TIER) >= i
                    return (
                      <motion.div
                        key={tier.name}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${isCurrent ? 'border' : 'bg-[#252528]/60'}`}
                        style={isCurrent ? { backgroundColor: `${tier.color}12`, borderColor: `${tier.color}40` } : {}}
                      >
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: isEarned ? tier.color : '#3A3A3C' }} />
                        <span className="text-xs font-bold flex-1" style={{ color: isEarned ? tier.color : '#48484A' }}>{tier.name}</span>
                        {isCurrent
                          ? <span className="text-[10px] font-black" style={{ color: tier.color }}>YOUR BELT</span>
                          : isEarned
                            ? <span className="text-[10px] text-[#636366]">✓ Earned</span>
                            : <Lock className="w-3 h-3 text-[#3A3A3C]" />
                        }
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* RANKINGS */}
            {activeTab === 'rankings' && (
              <motion.div key="rankings" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="flex flex-col">
                <div className="px-4 pt-4 pb-2">
                  <p className="text-xs text-[#636366] mb-3">Fight to hold your spot. Rankings are earned through 1v1 battles — not the gym.</p>
                  {/* Weight class selector */}
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
                    {WEIGHT_CLASSES.map((wc, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedClass(i)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                          selectedClass === i
                            ? 'border-[#FF4500] bg-[#FF4500]/10 text-[#FF4500]'
                            : 'border-[#252528] bg-[#252528] text-[#636366] hover:text-[#9A9AAA]'
                        }`}
                      >
                        {wc.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-[#252528]" />

                <div className="overflow-y-auto max-h-[380px] px-4 py-3 flex flex-col gap-1">
                  {/* Column headers */}
                  <div className="grid grid-cols-[28px_1fr_52px_48px] gap-2 px-3 mb-1">
                    {['#', 'Fighter', 'Record', 'Belt'].map(h => (
                      <span key={h} className="text-[9px] font-bold text-[#48484A] uppercase tracking-widest">{h}</span>
                    ))}
                  </div>
                  {rankings.map((entry, i) => {
                    const tierColor = TIERS.find(t => t.name === entry.tier)?.color ?? '#636366'
                    return (
                      <motion.div
                        key={entry.pos}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={`grid grid-cols-[28px_1fr_52px_48px] gap-2 items-center px-3 py-2.5 rounded-xl ${entry.you ? 'border' : 'bg-[#252528]/60'}`}
                        style={entry.you ? { backgroundColor: `${userTierData.color}12`, borderColor: `${userTierData.color}40` } : {}}
                      >
                        <span className={`text-xs font-black text-center ${
                          entry.pos === 1 ? 'text-[#FF4500]' :
                          entry.pos === 2 ? 'text-[#9A9AAA]' :
                          entry.pos === 3 ? 'text-[#F59E0B]' : 'text-[#48484A]'
                        }`}>{entry.pos}</span>
                        <p className={`text-xs font-bold truncate ${entry.you ? 'text-white' : 'text-[#9A9AAA]'}`}>
                          {entry.name}{entry.you && <span className="text-[9px] font-black ml-1.5" style={{ color: userTierData.color }}>YOU</span>}
                        </p>
                        <span className="text-xs font-bold tabular-nums text-[#636366]">{entry.record}</span>
                        <span className="text-[10px] font-bold" style={{ color: tierColor }}>{entry.tier}</span>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* BATTLES */}
            {activeTab === 'battles' && (
              <motion.div key="battles" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="p-5">
                <p className="text-xs text-[#636366] mb-4">1v1. Same weight class. Most weight moved wins. Claude verifies every rep. 24 hrs to respond or forfeit.</p>

                <div className="flex flex-col gap-2 mb-4">
                  {DUMMY_BATTLES.map((b, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#252528]/60">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-black ${
                        b.result === 'W' ? 'bg-[#22C55E]/15 text-[#22C55E]' :
                        b.result === 'L' ? 'bg-red-500/15 text-red-400' :
                        'bg-[#FF4500]/15 text-[#FF4500]'
                      }`}>
                        {b.result ?? '!'}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-white">{b.opponent}</p>
                        <p className="text-[10px] text-[#636366]">{b.lift} · {b.weight}</p>
                      </div>
                      <span className={`text-[10px] font-bold ${
                        b.status === 'pending' ? 'text-[#FF4500]' :
                        b.status === 'won' ? 'text-[#22C55E]' : 'text-red-400'
                      }`}>
                        {b.status === 'pending' ? 'Pending' : b.status === 'won' ? 'Won' : 'Lost'}
                      </span>
                    </div>
                  ))}
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="w-full bg-[#FF4500] text-white font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
                >
                  <Swords className="w-4 h-4" />
                  Start a Battle
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      <BottomNav active="compete" />
    </div>
  )
}
