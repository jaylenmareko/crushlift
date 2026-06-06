'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Plan, PlanDay, PlanExercise, WorkoutSet, WorkoutHistoryEntry } from '@/lib/types'
import BottomNav from '@/components/BottomNav'

const REST_SECONDS = 90

function WorkoutContent() {
  const router = useRouter()
  const params = useSearchParams()
  const planId = params.get('planId')
  const dayIndex = parseInt(params.get('day') || '0')

  const [plan, setPlan] = useState<Plan | null>(null)
  const [sets, setSets] = useState<Record<string, WorkoutSet[]>>({})
  const [prevBests, setPrevBests] = useState<Record<string, { weight: number | null, reps: number | null }>>({})
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const [restingFor, setRestingFor] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Persist in-progress sets on every change
  useEffect(() => {
    if (!plan || Object.keys(sets).length === 0) return
    const today = new Date().toISOString().slice(0, 10)
    localStorage.setItem('crushlift_inprogress_workout', JSON.stringify({
      planId: plan.id ?? null,
      dayIndex,
      date: today,
      sets,
    }))
  }, [sets, plan, dayIndex])

  useEffect(() => {
    function initSets(data: Plan) {
      const safeIndex = Math.min(dayIndex, data.days.length - 1)
      setPlan(data)
      const day: PlanDay = data.days[safeIndex]

      // Build previous-best map from workout history
      const history: WorkoutHistoryEntry[] = JSON.parse(localStorage.getItem('crushlift_workout_history') || '[]')
      const bests: Record<string, { weight: number | null, reps: number | null }> = {}
      day.exercises.forEach((ex: PlanExercise) => {
        for (const session of history) {
          const match = session.exercises.find(e => e.name === ex.name)
          if (match) {
            const topSet = match.sets.filter(s => s.completed).sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))[0]
            if (topSet) { bests[ex.id] = { weight: topSet.weight, reps: topSet.reps }; break }
          }
        }
      })
      setPrevBests(bests)

      // Restore in-progress sets if same plan + day + today
      const today = new Date().toISOString().slice(0, 10)
      const savedRaw = localStorage.getItem('crushlift_inprogress_workout')
      if (savedRaw) {
        try {
          const saved = JSON.parse(savedRaw)
          if (saved.date === today && saved.dayIndex === safeIndex && (!planId || saved.planId === planId)) {
            setSets(saved.sets)
            return
          }
        } catch {}
      }

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

    // Always try localStorage first (works with or without planId)
    const guestRaw = localStorage.getItem('crushlift_guest_plan')
    if (guestRaw) {
      try {
        const guest = JSON.parse(guestRaw)
        if (!planId || guest.id === planId) { initSets(guest); return }
      } catch {}
    }

    // No planId and no localStorage — nothing to load
    if (!planId) return

    // Fall back to Supabase
    const supabase = createClient()
    supabase.from('plans').select('*').eq('id', planId).single().then(({ data }) => {
      if (data) initSets(data)
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
    setSets(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((s, i) =>
        i === setIndex ? { ...s, completed: !s.completed } : s
      ),
    }))
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
    localStorage.removeItem('crushlift_inprogress_workout')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const safeIdx = Math.min(dayIndex, plan.days.length - 1)
    const day = plan.days[safeIdx]

    const exercises = day.exercises.map((ex: PlanExercise) => ({
      name: ex.name,
      sets: (sets[ex.id] || []).map(s => ({
        setNumber: s.setNumber,
        weight: s.weight,
        reps: s.reps,
        completed: s.completed,
      })),
    }))

    // Save snapshot for completion screen (works for both guest and auth)
    sessionStorage.setItem('crushlift_last_workout', JSON.stringify({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      dayName: day.dayName,
      dayNumber: day.dayNumber,
      exercises,
    }))

    if (!user) {
      const entry: WorkoutHistoryEntry = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        dayName: day.dayName,
        dayNumber: day.dayNumber,
        exercises,
      }
      const existing = JSON.parse(localStorage.getItem('crushlift_workout_history') || '[]')
      localStorage.setItem('crushlift_workout_history', JSON.stringify([entry, ...existing]))
      router.push('/workout/complete')
      return
    }

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
          exercise_name: plan.days[safeIdx].exercises.find((e: PlanExercise) => e.id === exId)?.name || '',
          set_number: s.setNumber,
          weight_lbs: s.weight,
          reps: s.reps,
          completed: true,
        }))
      )
      if (allSets.length) await supabase.from('workout_sets').insert(allSets)
    }

    router.push('/workout/complete')
  }

  if (!plan) return (
    <div className="mobile-container flex flex-col items-center justify-center min-h-dvh bg-[#0D0D0F] gap-4 px-8 text-center">
      <p className="text-[#9A9AAA] text-sm">No active workout.</p>
      <button
        onClick={() => router.push('/plan')}
        className="text-sm font-semibold text-[#FF4500]"
      >
        Go to My Plan →
      </button>
    </div>
  )

  const safeDayIndex = Math.min(dayIndex, plan.days.length - 1)
  const day: PlanDay = plan.days[safeDayIndex]

  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0D0D0F] has-bottom-nav">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-[#9A9AAA]">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">{day.dayName}</h1>
          <p className="text-xs text-[#9A9AAA]">Day {day.dayNumber}</p>
        </div>
        {Object.values(sets).some(exSets => exSets.some(s => s.completed)) && (
          <span className="text-[10px] font-semibold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-lg px-2 py-1">
            Saved
          </span>
        )}
      </header>


      {/* Exercises */}
      <div className="flex-1 px-5 flex flex-col gap-6 pb-4">
        {day.exercises.map((ex: PlanExercise) => (
          <div key={ex.id} className="bg-[#1C1C1E] border border-[#252528] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-bold text-sm text-white flex-1">{ex.name}</h3>
              <span className="text-xs font-bold text-[#FF4500] bg-[#FF4500]/10 border border-[#FF4500]/20 rounded-md px-2 py-1 leading-none flex-shrink-0">
                {ex.sets}×{ex.reps}
              </span>
              <button
                onClick={() => restingFor === ex.id ? (clearInterval(timerRef.current!), setRestTimer(null), setRestingFor(null)) : startRest(ex.id)}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg border flex-shrink-0 transition-all ${
                  restingFor === ex.id
                    ? 'border-[#3B82F6]/40 bg-[#3B82F6]/10 text-[#3B82F6]'
                    : 'border-[#252528] bg-[#252528] text-[#636366] hover:text-[#9A9AAA]'
                }`}
              >
                {restingFor === ex.id && restTimer !== null
                  ? `${Math.floor(restTimer / 60)}:${String(restTimer % 60).padStart(2, '0')}`
                  : 'Rest'}
              </button>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[32px_1fr_76px_76px_36px] gap-2 mb-1 px-1">
              {['SET', 'PREV', 'LBS', 'REPS', ''].map(h => (
                <span key={h} className="text-[10px] text-[#48484A] font-bold tracking-widest text-center uppercase">{h}</span>
              ))}
            </div>

            {/* Sets */}
            <div className="flex flex-col gap-1.5">
              {(sets[ex.id] || []).map((s, i) => (
                <div
                  key={s.id}
                  className={`grid grid-cols-[32px_1fr_76px_76px_36px] gap-2 items-center px-1 py-2.5 rounded-xl transition-colors ${
                    s.completed ? 'bg-[#22C55E]/8 border border-[#22C55E]/15' : 'border border-transparent'
                  }`}
                >
                  {/* Set # */}
                  <span className={`text-xs font-bold text-center ${s.completed ? 'text-[#22C55E]' : 'text-[#636366]'}`}>
                    {s.setNumber}
                  </span>
                  {/* Previous */}
                  <span className="text-xs text-[#48484A] text-center tabular-nums">
                    {prevBests[ex.id]?.weight != null
                      ? `${prevBests[ex.id].weight} × ${prevBests[ex.id].reps ?? '?'}`
                      : '—'}
                  </span>
                  {/* Weight input */}
                  <input
                    type="number"
                    inputMode="decimal"
                    value={s.weight ?? ''}
                    onChange={e => updateSet(ex.id, i, 'weight', e.target.value)}
                    placeholder="—"
                    className={`rounded-xl px-2 py-2 text-sm font-semibold text-white text-center focus:outline-none w-full transition-colors ${
                      s.completed
                        ? 'bg-[#22C55E]/10 border border-[#22C55E]/20 focus:border-[#22C55E]'
                        : 'bg-[#1C1C1E] border border-[#252528] focus:border-[#FF4500]'
                    }`}
                  />
                  {/* Reps input */}
                  <input
                    type="number"
                    inputMode="numeric"
                    value={s.reps ?? ''}
                    onChange={e => updateSet(ex.id, i, 'reps', e.target.value)}
                    placeholder="—"
                    className={`rounded-xl px-2 py-2 text-sm font-semibold text-white text-center focus:outline-none w-full transition-colors ${
                      s.completed
                        ? 'bg-[#22C55E]/10 border border-[#22C55E]/20 focus:border-[#22C55E]'
                        : 'bg-[#1C1C1E] border border-[#252528] focus:border-[#FF4500]'
                    }`}
                  />
                  {/* Complete */}
                  <button
                    onClick={() => toggleSet(ex.id, i)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      s.completed
                        ? 'bg-[#22C55E] shadow-[0_2px_12px_rgba(34,197,94,0.35)]'
                        : 'bg-[#252528] border border-[#2C2C2E] text-[#636366] hover:border-[#22C55E]/40'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 ${s.completed ? 'text-white' : 'text-[#636366]'}`} />
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
      <div className="mobile-container flex items-center justify-center min-h-dvh bg-[#0D0D0F]">
        <div className="w-8 h-8 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <WorkoutContent />
    </Suspense>
  )
}
