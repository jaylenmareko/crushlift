'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Swords, TrendingUp } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import WeightGate from '@/components/WeightGate'
import { useUserWeight } from '@/lib/hooks/useUserWeight'
import { TIERS, WEIGHT_CLASSES, displayColor } from '@/lib/belts'

const USER_TIER = 'Lifter' // battle-rank tier, used on Rankings tab

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

type CompeteTab = 'rankings' | 'battles'

export default function CompetePage() {
  const {
    userWeight, selectedClass, setSelectedClass,
    weightInput, setWeightInput, weightLoading,
    savingWeight, weightError, saveWeight,
  } = useUserWeight()

  const [competeTab, setCompeteTab] = useState<CompeteTab>('rankings')

  const userTierData = TIERS.find(t => t.name === USER_TIER)!
  const rankings      = RANKINGS_DATA[selectedClass] ?? []

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
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0D0D0F] has-bottom-nav overflow-hidden">
      <header className="px-5 pt-12 pb-4">
        <p className="text-[10px] font-bold text-[#FF4500] uppercase tracking-[0.2em]">Power Rank</p>
        <h1 className="text-2xl font-bold leading-none">Compete</h1>
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
                  <p className="text-xs font-semibold text-[#9A9AAA] mt-0.5">Battle your way to #1</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#9A9AAA] uppercase tracking-widest font-bold mb-0.5">Record</p>
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
                        <span className="text-xs font-bold tabular-nums text-[#9A9AAA]">{entry.record}</span>
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
                      <p className="text-[10px] font-semibold text-[#9A9AAA]">{b.lift} · {b.weight}</p>
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
    </div>
  )
}
