'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Dumbbell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import BottomNav from '@/components/BottomNav'

interface Session {
  id: string
  day_name: string
  day_number: number
  started_at: string
  finished_at: string
  duration_seconds: number
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('workout_sessions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setSessions(data || [])
        setLoading(false)
      })
  }, [])

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function formatDuration(secs: number) {
    if (!secs) return '—'
    const m = Math.floor(secs / 60)
    return `${m} min`
  }

  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0A0A0A] has-bottom-nav">
      <header className="px-5 pt-12 pb-6">
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-[#6B7280] text-sm mt-1">{sessions.length} workouts logged</p>
      </header>

      <div className="flex-1 px-5 flex flex-col gap-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Dumbbell className="w-12 h-12 text-[#2F2F2F] mb-4" />
            <p className="text-[#6B7280]">No workouts logged yet.</p>
            <p className="text-xs text-[#4B5563] mt-1">Start your first workout from the Plan tab.</p>
          </div>
        ) : (
          sessions.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-sm">{s.day_name}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">Day {s.day_number}</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 text-[#22C55E]" />
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(s.started_at)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDuration(s.duration_seconds)}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <BottomNav active="history" />
    </div>
  )
}
