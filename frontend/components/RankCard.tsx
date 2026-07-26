'use client'

import { motion } from 'framer-motion'
import { getRankInfo, computeTotalXP, computeStreak } from '@/backend/services/xp'
import type { WorkoutHistoryEntry } from '@/backend/types'

export default function RankCard({ history }: { history: WorkoutHistoryEntry[] }) {
  const totalXP = computeTotalXP(history)
  const { rank, nextRank, progress, xpToNext } = getRankInfo(totalXP)
  const streak = computeStreak(history)

  return (
    <div className="bg-[#1C1C1E] border border-[#252528] rounded-2xl p-4">
      <div className="flex items-center gap-4 mb-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border"
          style={{
            backgroundColor: `${rank.color}18`,
            borderColor: `${rank.color}35`,
            boxShadow: `0 0 24px ${rank.color}18`,
          }}
        >
          <span className="text-lg font-black tracking-widest" style={{ color: rank.color }}>
            {rank.abbr}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-[#636366] uppercase tracking-[0.15em] mb-0.5">Current Rank</p>
          <p className="text-xl font-black text-white leading-none">{rank.name}</p>
          <p className="text-xs text-[#636366] mt-1">{totalXP.toLocaleString()} XP</p>
        </div>

        {streak >= 2 && (
          <div className="flex flex-col items-center flex-shrink-0 bg-[#FF4500]/8 border border-[#FF4500]/20 rounded-xl px-3 py-2">
            <span className="text-xl font-black text-[#FF4500] leading-none">{streak}</span>
            <span className="text-[9px] text-[#FF4500]/70 font-bold uppercase tracking-wider mt-0.5">streak</span>
          </div>
        )}
      </div>

      {nextRank ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-[#48484A] uppercase tracking-wider">{rank.name}</span>
            <span className="text-[10px] font-semibold" style={{ color: nextRank.color }}>
              {xpToNext.toLocaleString()} XP → {nextRank.name}
            </span>
          </div>
          <div className="h-1 bg-[#252528] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress * 100, 100)}%` }}
              transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="h-full rounded-full"
              style={{ backgroundColor: rank.color }}
            />
          </div>
        </div>
      ) : (
        <p className="text-xs font-bold" style={{ color: rank.color }}>
          MAX RANK — LEGEND STATUS
        </p>
      )}
    </div>
  )
}
