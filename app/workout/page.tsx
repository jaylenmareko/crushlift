'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronLeft, Timer } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Plan, PlanDay, PlanExercise, WorkoutSet } from '@/lib/types'
import BottomNav from '@/components/BottomNav'

const REST_SECONDS = 90

function WorkoutContent() {
  const router = useRouter()
  const params = useSearchParams()
  const planId = params.get('planId')
  const dayIndex = parseInt(params.get('day') || '0')

  const [plan, setPlan] = useState<Plan | null>(null)
  const [sets, setSets] = useState<Record<string, WorkoutSet[]>>({})
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const [restingFor, setRestingFor] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!planId) return
    const supabase = createClient()
    supabase.from('plans').select('*').eq('id', planId).single().then(({ data }) => {
      if (data) {
        setPlan(data)
        const day: PlanDay = data.days[dayIndex]
        const initialSets: Record<string, WorkoutSet[]> = {}
        day.exercises.forEach((ex: PlanExercise) => {
          initialSets[ex.id] = Array.from({ length: ex.sets }, (_, i) => ({
            id: `${ex.id}-${i}`,
            setNumber: i + 1,
            weight: null,
            reps: null,
            completed: false,
          }))
        })
        setSets(initialSets)
      }
    })
  }, [planId, dayIndex])

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function startRest(exerciseId: string) {
    if (timerRef.current) clearInterval(timerRef.current)
    setRestTimer(REST_SECONDS)
    setRestingFor(exerciseId)
    timerRef.current = setInterval(() => {
      setRestTimer(t => {
        if (t === null || t <= 1) {
          clearInterval(timerRef.current!)
          setRestingFor(null)
          return null
        }
        return t - 1
      })
    }, 1000)
  }

  function toggleSet(exerciseId: string, setIndex: number) {
    setSets(prev => {
      const updated = prev[exerciseId].map((s, i) =>
        i === setIndex ? { ...s, completed: !s.completed } : s
      )
      if (updated[setIndex].completed) startRest(exerciseId)
      return { ...prev, [exerciseId]: updated }
    })
  }

  function updateSet(exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: string) {
    setSets(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((s, i) =>
        i === setIndex ? { ...s, [field]: value ? parseFloat(value) : null } : s
      ),
    }))
  }

  async function finishWorkout() {
    if (!plan) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const day = plan.days[dayIndex]

    const { data: session } = await supabase.from('workout_sessions').insert({
      user_id: user.id,
      plan_id: plan.id,
      day_number: day.dayNumber,
      day_name: day.dayName,
      started_at: new Date(Date.now() - 3600000).toISOString(),
      finished_at: new Date().toISOString(),
    }).select().single()

    if (session) {
      const allSets = Object.entries(sets).flatMap(([exId, exSets]) =>
        exSets.filter(s => s.completed).map(s => ({
          session_id: session.id,
          exercise_name: plan.days[dayIndex].exercises.find((e: PlanExercise) => e.id === exId)?.name || '',
          set_number: s.setNumber,
          weight_lbs: s.weight,
          reps: s.reps,
          completed: true,
        }))
      )
      if (allSets.length) await supabase.from('workout_sets').insert(allSets)
    }

    router.push('/history')
  }

  if (!plan) return (
    <div className="mobile-container flex items-center justify-center min-h-dvh bg-[#0A0A0A]">
      <div className="w-8 h-8 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const day: PlanDay = plan.days[dayIndex]

  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0A0A0A] has-bottom-nav">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-[#6B7280]">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold">{day.dayName}</h1>
          <p className="text-xs text-[#6B7280]">Day {day.dayNumber}</p>
        </div>
      </header>

      {/* Rest timer */}
      <AnimatePresence>
        {restTimer !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-5 mb-4 bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-2xl px-4 py-3 flex items-center gap-3"
          >
            <Timer className="w-5 h-5 text-[#3B82F6]" />
            <div>
              <p className="text-xs text-[#3B82F6] font-semibold">Rest Timer</p>
              <p className="text-2xl font-extrabold text-[#3B82F6] leading-none">
                {Math.floor(restTimer / 60)}:{String(restTimer % 60).padStart(2, '0')}
              </p>
            </div>
            <button
              onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setRestTimer(null); setRestingFor(null) }}
              className="ml-auto text-xs text-[#6B7280]"
            >
              Skip
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercises */}
      <div className="flex-1 px-5 flex flex-col gap-6 pb-4">
        {day.exercises.map((ex: PlanExercise) => (
          <div key={ex.id}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm">{ex.name}</h3>
              <span className="text-xs text-[#6B7280]">{ex.sets} × {ex.reps}</span>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[28px_1fr_80px_80px_32px] gap-2 mb-1.5 px-1">
              {['SET', 'PREV', 'LBS', 'REPS', ''].map(h => (
                <span key={h} className="text-[10px] text-[#4B5563] font-semibold text-center">{h}</span>
              ))}
            </div>

            {/* Sets */}
            <div className="flex flex-col gap-2">
              {(sets[ex.id] || []).map((s, i) => (
                <div
                  key={s.id}
                  className={`grid grid-cols-[28px_1fr_80px_80px_32px] gap-2 items-center px-1 py-2 rounded-xl transition-colors ${
                    s.completed ? 'bg-[#22C55E]/8' : ''
                  }`}
                >
                  {/* Set # */}
                  <span className={`text-xs font-bold text-center ${s.completed ? 'text-[#22C55E]' : 'text-[#6B7280]'}`}>
                    {s.setNumber}
                  </span>
                  {/* Previous */}
                  <span className="text-xs text-[#4B5563] text-center">
                    {s.previousWeight ? `${s.previousWeight}×${s.previousReps}` : '—'}
                  </span>
                  {/* Weight input */}
                  <input
                    type="number"
                    value={s.weight ?? ''}
                    onChange={e => updateSet(ex.id, i, 'weight', e.target.value)}
                    placeholder="0"
                    className="bg-[#141414] border border-[#1F1F1F] rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-[#FF4500] w-full"
                  />
                  {/* Reps input */}
                  <input
                    type="number"
                    value={s.reps ?? ''}
                    onChange={e => updateSet(ex.id, i, 'reps', e.target.value)}
                    placeholder="0"
                    className="bg-[#141414] border border-[#1F1F1F] rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-[#FF4500] w-full"
                  />
                  {/* Complete */}
                  <button
                    onClick={() => toggleSet(ex.id, i)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      s.completed
                        ? 'bg-[#22C55E] text-white'
                        : 'bg-[#1F1F1F] border border-[#2F2F2F] text-[#4B5563]'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Finish */}
      <div className="px-5 pb-6 pt-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={finishWorkout}
          className="w-full bg-[#22C55E] text-white font-bold text-base py-[18px] rounded-2xl shadow-[0_8px_32px_rgba(34,197,94,0.2)]"
        >
          Finish Workout
        </motion.button>
      </div>

      <BottomNav active="workout" />
    </div>
  )
}

export default function WorkoutPage() {
  return (
    <Suspense fallback={
      <div className="mobile-container flex items-center justify-center min-h-dvh bg-[#0A0A0A]">
        <div className="w-8 h-8 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <WorkoutContent />
    </Suspense>
  )
}
