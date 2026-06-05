'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Dumbbell, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import BottomNav from '@/components/BottomNav'
import type { WorkoutHistoryEntry, CardioEntry } from '@/lib/types'


export default function HistoryPage() {
  const [sessions, setSessions] = useState<WorkoutHistoryEntry[]>([])
  const [cardioLog, setCardioLog] = useState<CardioEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    // Read localStorage guest history, stripping any leftover dummy seed data
    const raw = localStorage.getItem('crushlift_workout_history')
    const local: WorkoutHistoryEntry[] = (raw ? JSON.parse(raw) : [])
      .filter((e: WorkoutHistoryEntry) => !e.id.startsWith('dummy-'))
    const combined = local

    // Merge with Supabase for auth users
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setSessions(combined)
        const cardioRaw = localStorage.getItem('crushlift_cardio_log')
        setCardioLog(cardioRaw ? JSON.parse(cardioRaw) : [])
        setLoading(false)
        return
      }
      supabase
        .from('workout_sessions')
        .select('id, day_name, day_number, started_at, finished_at')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(20)
        .then(({ data }) => {
          const remote: WorkoutHistoryEntry[] = (data || []).map(s => ({
            id: s.id,
            date: s.started_at,
            dayName: s.day_name,
            dayNumber: s.day_number,
            exercises: [],
          }))
          const merged = [...combined, ...remote].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          setSessions(merged)
          const cardioRaw = localStorage.getItem('crushlift_cardio_log')
          setCardioLog(cardioRaw ? JSON.parse(cardioRaw) : [])
          setLoading(false)
        })
    })
  }, [])

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  function totalSets(entry: WorkoutHistoryEntry) {
    return entry.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0)
  }

  const INTENSITY_STYLES = {
    easy: 'text-green-400 bg-green-400/10 border-green-400/30',
    moderate: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    hard: 'text-red-400 bg-red-400/10 border-red-400/30',
  }

  // Merge workouts + cardio into one sorted timeline
  type TimelineItem =
    | { kind: 'workout'; data: WorkoutHistoryEntry }
    | { kind: 'cardio'; data: CardioEntry }

  const timeline: TimelineItem[] = [
    ...sessions.map(s => ({ kind: 'workout' as const, data: s })),
    ...cardioLog.map(c => ({ kind: 'cardio' as const, data: c })),
  ].sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())

  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0D0D0F] has-bottom-nav">
      <header className="px-5 pt-12 pb-6">
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-[#9A9AAA] text-sm mt-1">{sessions.length} workouts · {cardioLog.length} cardio</p>
      </header>

      <div className="flex-1 px-5 flex flex-col gap-3 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Dumbbell className="w-12 h-12 text-[#3A3A3C] mb-4" />
            <p className="text-[#9A9AAA]">No activity logged yet.</p>
            <p className="text-xs text-[#636366] mt-1">Start a workout or log cardio from the Plan tab.</p>
          </div>
        ) : (
          timeline.map((item, i) => {
            if (item.kind === 'cardio') {
              const c = item.data
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-[#1C1C1E] border border-[#252528] rounded-2xl p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-[#6366F1]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{c.type}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-[#9A9AAA]">
                        <Calendar className="w-3 h-3" />{formatDate(c.date)}
                      </span>
                      {c.distance && <span className="text-xs text-[#636366]">{c.distance}</span>}
                      {c.duration && <span className="text-xs text-[#636366]">{c.duration}</span>}
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-1 rounded-lg border capitalize ${INTENSITY_STYLES[c.intensity]}`}>
                    {c.intensity}
                  </span>
                </motion.div>
              )
            }

            const s = item.data
            const isOpen = expanded === s.id
            const sets = totalSets(s)
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-[#1C1C1E] border border-[#252528] rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : s.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-4 h-4 text-[#22C55E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{s.dayName}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-[#9A9AAA]">
                        <Calendar className="w-3 h-3" />{formatDate(s.date)}
                      </span>
                      {sets > 0 && <span className="text-xs text-[#636366]">{sets} sets</span>}
                    </div>
                  </div>
                  {s.exercises.length > 0 && (
                    isOpen
                      ? <ChevronUp className="w-4 h-4 text-[#636366] flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-[#636366] flex-shrink-0" />
                  )}
                </button>
                {isOpen && s.exercises.length > 0 && (
                  <div className="border-t border-[#252528] px-4 pb-4 pt-3 flex flex-col gap-3">
                    {s.exercises.map((ex, ei) => (
                      <div key={ei}>
                        <p className="text-xs font-bold text-[#9A9AAA] mb-2">{ex.name}</p>
                        <div className="flex text-[10px] text-[#48484A] font-semibold uppercase tracking-wider gap-4 mb-1 px-1">
                          <span className="w-8">Set</span><span className="flex-1">Weight</span><span className="flex-1">Reps</span>
                        </div>
                        {ex.sets.filter(s => s.completed).map((set, si) => (
                          <div key={si} className="flex items-center gap-4 px-1 py-1 border-t border-[#252528]">
                            <span className="text-xs text-[#636366] w-8">{set.setNumber}</span>
                            <span className="text-sm font-semibold flex-1">{set.weight != null ? `${set.weight} lbs` : '—'}</span>
                            <span className="text-sm font-semibold flex-1 text-[#FF4500]">{set.reps != null ? set.reps : '—'}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })
        )}
      </div>

      <BottomNav active="history" />
    </div>
  )
}
