'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Lock, ChevronDown, Scale } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import WeightGate from '@/components/WeightGate'
import ChangeWeightModal from '@/components/ChangeWeightModal'
import { createClient } from '@/lib/supabase/client'
import { useUserWeight } from '@/lib/hooks/useUserWeight'
import { usePrLogger } from '@/lib/hooks/usePrLogger'
import {
  TIERS, BIG_SIX, WEIGHT_THRESHOLDS, PULLUP_REP_THRESHOLDS,
  displayColor, shortDate, decayDate, computeLiftData, bestOf,
  getWeightClass,
} from '@/lib/belts'

export default function RanksPage() {
  const {
    userWeight, weightInput, setWeightInput, weightLoading,
    savingWeight, weightError, saveWeight,
    weightModalOpen, setWeightModalOpen,
  } = useUserWeight()

  const [expandedLift, setExpandedLift] = useState<string | null>(null)
  const [userLifts, setUserLifts] = useState(BIG_SIX)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      // Belts read from the user's best VERIFIED PR per lift
      const { data: prs } = await supabase
        .from('pr_verifications')
        .select('exercise_name, declared_weight, declared_reps, created_at')
        .eq('user_id', user.id)
        .eq('verified', true)
      if (prs && prs.length) {
        const byLift = new Map<string, { best: number; bestReps: number | null; lastPrAt: string | null }>()
        for (const pr of prs) {
          const cur = byLift.get(pr.exercise_name) ?? { best: 0, bestReps: null, lastPrAt: null }
          if ((pr.declared_weight ?? 0) > cur.best) cur.best = pr.declared_weight ?? 0
          if (pr.declared_reps != null && (cur.bestReps == null || pr.declared_reps > cur.bestReps)) cur.bestReps = pr.declared_reps
          if (!cur.lastPrAt || new Date(pr.created_at) > new Date(cur.lastPrAt)) cur.lastPrAt = pr.created_at
          byLift.set(pr.exercise_name, cur)
        }
        setUserLifts(BIG_SIX.map(l => {
          const m = byLift.get(l.name)
          return m ? { ...l, best: m.best, bestReps: m.bestReps, lastPrAt: m.lastPrAt } : l
        }))
      }
    }).catch(() => {})
  }, [])

  const liftData = computeLiftData(userLifts)
  const bestLift = bestOf(liftData)

  const { openLogPr, modals: prModals } = usePrLogger(liftData, (liftName, weight, reps, verified) => {
    // Only verified PRs count toward a belt — unverified lifts are recorded in the DB but don't rank
    if (verified) {
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
    }
  })

  if (weightLoading) return (
    <div className="mobile-container flex items-center justify-center min-h-dvh bg-[#0D0D0F]">
      <div className="w-8 h-8 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!userWeight) return (
    <WeightGate
      active="ranks"
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
        <h1 className="text-2xl font-bold leading-none">Ranks</h1>
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
            <p className="text-[10px] text-[#9A9AAA] uppercase tracking-widest font-bold mb-0.5">Weight Class</p>
            <p className="text-base font-bold text-white">{getWeightClass(userWeight!).full}</p>
          </div>
          <button
            onClick={() => { setWeightInput(String(userWeight)); setWeightModalOpen(true) }}
            className="text-xs font-bold text-[#FF4500] flex-shrink-0"
          >
            Change
          </button>
        </div>

        {/* Per-lift belt ladders */}
        <p className="text-[11px] font-bold text-[#9A9AAA] uppercase tracking-widest px-1 mt-1">Ranks by Lift</p>
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
                      openLogPr(l.name)
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
                          <p className="text-[11px] font-bold mt-1 text-[#F59E0B]">Dropped from {l.droppedFrom} to {l.tier.name} rank, log a PR to climb back</p>
                        ) : l.atRisk ? (
                          <p className="text-[11px] font-bold mt-1 text-[#F59E0B]">⚠ {l.daysLeft} {l.daysLeft === 1 ? 'day' : 'days'} left — log a PR to defend and maintain {l.tier.name} rank</p>
                        ) : l.daysLeft !== null ? (
                          <p className="text-[11px] font-semibold text-[#9A9AAA] mt-1">Defend rank by {decayDate(l.lastPrAt!)} ({l.daysLeft} days left)</p>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-xs font-bold mt-0.5 text-[#FF4500]">Log a PR to earn this rank →</p>
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
                          const thresholds = l.name === 'Pull-up' ? PULLUP_REP_THRESHOLDS : (WEIGHT_THRESHOLDS[l.name] ?? [])
                          const unit = l.name === 'Pull-up' ? 'reps' : 'lbs'
                          const rangeLabel = i === 0
                            ? `${thresholds[i]}+ ${unit}`
                            : `${thresholds[i]}–${thresholds[i - 1] - 1} ${unit}`
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
          onClick={() => openLogPr()}
          className="w-full bg-[#FF4500] text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
        >
          <Trophy className="w-4 h-4" />
          Log a PR
        </motion.button>
      </div>
      <BottomNav active="ranks" />

      {prModals}

      <ChangeWeightModal
        open={weightModalOpen}
        onClose={() => setWeightModalOpen(false)}
        weightInput={weightInput}
        setWeightInput={setWeightInput}
        weightError={weightError}
        savingWeight={savingWeight}
        onSave={saveWeight}
      />
    </div>
  )
}
