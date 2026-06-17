'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Swords, TrendingUp, Crown, ChevronDown, Check, X } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import WeightGate from '@/components/WeightGate'
import { useUserWeight } from '@/lib/hooks/useUserWeight'
import { WEIGHT_CLASSES } from '@/lib/belts'

const RANKINGS_DATA: Record<number, { pos: number; name: string; record: string; you: boolean }[]> = {
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
    { pos: 4, name: 'You',       record: '2-1',  you: true  },
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

const DUMMY_BATTLES: { opponent: string; lift: string; status: 'pending' | 'won' | 'lost'; yourWeight: number | null; oppWeight: number | null }[] = [
  { opponent: 'Marcus T.', lift: 'Squat',    status: 'pending', yourWeight: null, oppWeight: null },
  { opponent: 'Dre W.',    lift: 'Bench',    status: 'won',     yourWeight: 225,  oppWeight: 205  },
  { opponent: 'Kyle B.',   lift: 'Deadlift', status: 'lost',    yourWeight: 295,  oppWeight: 315  },
]

type CompeteTab = 'rankings' | 'battles'

function shortClassName(full: string) {
  return full.split('·')[0].trim()
}

export default function CompetePage() {
  const {
    userWeight, selectedClass, setSelectedClass,
    weightInput, setWeightInput, weightLoading,
    savingWeight, weightError, saveWeight,
  } = useUserWeight()

  const [competeTab, setCompeteTab] = useState<CompeteTab>('rankings')
  const [classSheetOpen, setClassSheetOpen] = useState(false)

  const rankings  = RANKINGS_DATA[selectedClass] ?? []
  const yourEntry = rankings.find(r => r.you)
  const wins      = DUMMY_BATTLES.filter(b => b.status === 'won').length
  const losses    = DUMMY_BATTLES.filter(b => b.status === 'lost').length
  const pending   = DUMMY_BATTLES.filter(b => b.status === 'pending').length

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

      {/* You — always visible, no tab needed to see where you stand */}
      <div className="px-5 mb-3">
        <div className="rounded-2xl p-4 flex items-center gap-4 bg-[#1C1C1E] border border-[#252528]">
          <div className="flex-1">
            <p className="text-[10px] text-[#9A9AAA] uppercase tracking-widest font-bold mb-1">Your Rank</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#FF4500] leading-none">{yourEntry ? `#${yourEntry.pos}` : '—'}</span>
              <button onClick={() => setClassSheetOpen(true)} className="flex items-center gap-1">
                <span className="text-sm font-bold text-white">{shortClassName(WEIGHT_CLASSES[selectedClass].full)}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#636366]" />
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#9A9AAA] uppercase tracking-widest font-bold mb-1">Record</p>
            <p className="text-2xl font-black text-[#22C55E] leading-none">{yourEntry ? yourEntry.record : '—'}</p>
          </div>
        </div>
      </div>

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
            <motion.div key="rankings" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="flex flex-col flex-1 overflow-hidden px-5">
              <div className="bg-[#1C1C1E] border border-[#252528] rounded-2xl overflow-hidden flex-1">
                <div className="overflow-y-auto max-h-[420px] p-2 flex flex-col gap-1.5">
                  {rankings.map((entry, i) => {
                    const rankColor =
                      entry.pos === 1 ? '#FFC107' :
                      entry.pos === 2 ? '#D1D5DB' :
                      entry.pos === 3 ? '#F59E0B' : '#48484A'
                    return (
                      <motion.div key={entry.pos}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl ${entry.you ? 'border' : 'bg-[#252528]/50'}`}
                        style={entry.you ? { backgroundColor: '#FF450012', borderColor: '#FF450040' } : {}}
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${rankColor}20` }}>
                          {entry.pos === 1
                            ? <Crown className="w-4 h-4" style={{ color: rankColor }} />
                            : <span className="text-xs font-black" style={{ color: rankColor }}>{entry.pos}</span>
                          }
                        </div>
                        <p className={`flex-1 text-sm font-bold truncate ${entry.you ? 'text-white' : 'text-[#9A9AAA]'}`}>
                          {entry.name}{entry.you && <span className="text-[9px] font-black ml-1.5 text-[#FF4500]">YOU</span>}
                        </p>
                        <span className="text-sm font-bold tabular-nums text-[#9A9AAA]">{entry.record}</span>
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
                  <p className="text-2xl font-black text-white leading-none">{wins}W · {losses}L</p>
                  {pending > 0 && <p className="text-xs text-[#FF4500] mt-0.5 font-semibold">{pending} pending response{pending > 1 ? 's' : ''}</p>}
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
                  <div key={i} className="rounded-2xl bg-[#1C1C1E] border border-[#252528] overflow-hidden">
                    <div className="flex items-center justify-between px-4 pt-3">
                      <span className="text-[10px] font-bold text-[#9A9AAA] uppercase tracking-widest">{b.lift}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        b.status === 'won' ? 'bg-[#22C55E]/15 text-[#22C55E]' :
                        b.status === 'lost' ? 'bg-red-500/15 text-red-400' :
                        'bg-[#FF4500]/15 text-[#FF4500]'
                      }`}>{b.status === 'won' ? 'WON' : b.status === 'lost' ? 'LOST' : 'PENDING'}</span>
                    </div>
                    <div className="flex items-center px-4 py-4 gap-3">
                      <div className="flex-1 text-center min-w-0">
                        <p className="text-[10px] font-bold text-[#9A9AAA] uppercase tracking-widest mb-1">You</p>
                        <p className={`text-2xl font-black tabular-nums ${b.status === 'won' ? 'text-[#22C55E]' : 'text-white'}`}>{b.yourWeight ?? '—'}</p>
                      </div>
                      <span className="text-xs font-black text-[#48484A] flex-shrink-0">VS</span>
                      <div className="flex-1 text-center min-w-0">
                        <p className="text-[10px] font-bold text-[#9A9AAA] uppercase tracking-widest mb-1 truncate">{b.opponent}</p>
                        <p className={`text-2xl font-black tabular-nums ${b.status === 'lost' ? 'text-red-400' : 'text-white'}`}>{b.oppWeight ?? '—'}</p>
                      </div>
                    </div>
                    {b.status === 'pending' && (
                      <p className="text-[10px] text-[#9A9AAA] text-center pb-3">Awaiting opponent response</p>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-[#48484A] text-center">1v1 · Same weight class · Most weight moved wins</p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
      <BottomNav active="compete" />

      {/* Weight class switcher */}
      <AnimatePresence>
        {classSheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center"
            onClick={() => setClassSheetOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-[900px] bg-[#1C1C1E] border-t border-[#252528] rounded-t-3xl p-5 pb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-white">Weight Class</h2>
                <button onClick={() => setClassSheetOpen(false)} className="text-[#636366]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {WEIGHT_CLASSES.map((wc, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedClass(i); setClassSheetOpen(false) }}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                      selectedClass === i ? 'border-[#FF4500] bg-[#FF4500]/10' : 'border-[#252528] bg-[#161618]'
                    }`}
                  >
                    <span className={`text-sm font-bold ${selectedClass === i ? 'text-[#FF4500]' : 'text-white'}`}>{wc.full}</span>
                    {selectedClass === i && <Check className="w-4 h-4 text-[#FF4500]" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
