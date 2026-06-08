'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, ChevronRight, BarChart2 } from 'lucide-react'
import type { WorkoutHistoryEntry } from '@/lib/types'
import BottomNav from '@/components/BottomNav'

export default function WorkoutCompletePage() {
  const router = useRouter()
  const [entry, setEntry] = useState<WorkoutHistoryEntry | null>(null)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)

    // Prefer the just-finished snapshot saved right before routing here
    const lastRaw = sessionStorage.getItem('trainmaxxing_last_workout')
    if (lastRaw) {
      try {
        const last = JSON.parse(lastRaw)
        if (last.date?.slice(0, 10) === today) {
          setEntry(last)
          return
        }
      } catch {}
    }

    // Fall back to most recent localStorage entry (guest users)
    const raw = localStorage.getItem('trainmaxxing_workout_history')
    if (!raw) { router.push('/plan'); return }
    const history: WorkoutHistoryEntry[] = JSON.parse(raw)
    if (history.length === 0 || history[0].date.slice(0, 10) !== today) {
      router.push('/plan'); return
    }
    setEntry(history[0])
  }, [router])

  if (!entry) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-dvh bg-[#0D0D0F]">
        <div className="w-8 h-8 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const totalSets = entry.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0)
  const totalVolume = entry.exercises.reduce((acc, ex) =>
    acc + ex.sets.filter(s => s.completed).reduce((a, s) => a + ((s.weight ?? 0) * (s.reps ?? 0)), 0)
  , 0)
  const exerciseCount = entry.exercises.length

  const volumeDisplay = totalVolume === 0 ? '—'
    : totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k`
    : String(totalVolume)

  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0D0D0F] has-bottom-nav relative overflow-hidden">
      {/* Subtle green glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_30%_at_50%_30%,rgba(34,197,94,0.05)_0%,transparent_70%)] pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center px-5 text-center relative">

        {/* Check icon */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 180 }}
          className="mb-6"
        >
          <div className="w-20 h-20 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center shadow-[0_0_48px_rgba(34,197,94,0.12)]">
            <CheckCircle2 className="w-10 h-10 text-[#22C55E]" strokeWidth={1.5} />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.28 }}
        >
          <p className="text-[10px] font-bold text-[#22C55E] uppercase tracking-[0.2em] mb-2">Workout Complete</p>
          <h1 className="text-[2rem] font-black tracking-tight leading-tight mb-1">{entry.dayName}</h1>
          <p className="text-[#636366] text-sm">
            {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.28 }}
          className="grid grid-cols-3 gap-3 mt-8 w-full max-w-sm"
        >
          {[
            { label: 'Exercises', value: exerciseCount },
            { label: 'Sets', value: totalSets },
            { label: 'Volume', value: volumeDisplay, unit: totalVolume > 0 ? ' lbs' : '' },
          ].map(({ label, value, unit }) => (
            <div key={label} className="bg-[#1C1C1E] border border-[#252528] rounded-2xl p-4">
              <p className="text-2xl font-black text-white leading-none">{value}{unit}</p>
              <p className="text-[10px] text-[#636366] font-semibold uppercase tracking-wider mt-1.5">{label}</p>
            </div>
          ))}
        </motion.div>

      </div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.28 }}
        className="px-5 pb-6 pt-4 flex flex-col gap-2.5 relative"
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/plan')}
          className="w-full bg-[#FF4500] text-white font-black text-sm uppercase tracking-[0.12em] py-[20px] rounded-2xl flex items-center justify-center gap-2.5 shadow-[0_8px_48px_rgba(255,69,0,0.35)]"
        >
          Back to Plan
          <ChevronRight className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/profile')}
          className="w-full bg-[#1C1C1E] border border-[#252528] text-[#9A9AAA] font-semibold text-sm py-[18px] rounded-2xl flex items-center justify-center gap-2 hover:text-white hover:border-[#3A3A3C] transition-all"
        >
          <BarChart2 className="w-4 h-4" />
          View Memories
        </motion.button>
      </motion.div>

      <BottomNav active="workout" />
    </div>
  )
}
