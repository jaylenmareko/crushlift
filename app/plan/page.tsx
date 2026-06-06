'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, MoreHorizontal, X, ChevronRight, ChevronLeft, Search, Loader2, Calendar, SlidersHorizontal, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Plan, PlanDay, PlanExercise, WorkoutHistoryEntry } from '@/lib/types'
import BottomNav from '@/components/BottomNav'


const SORENESS_AREAS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Core', 'Quads', 'Hamstrings', 'Glutes', 'Calves',
]

const SORENESS_LEVELS = [
  { label: '', color: '' },
  { label: 'Mild', color: 'amber' },
  { label: 'Moderate', color: 'orange' },
  { label: 'Sore', color: 'red' },
]

const SORENESS_STYLES: Record<string, string> = {
  '': 'border-[#252528] bg-[#1C1C1E] text-[#636366]',
  amber: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  orange: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
  red: 'border-red-500/40 bg-red-500/10 text-red-400',
}

const GRADIENTS = [
  'from-[#FF4500] to-[#FF6B35]',
  'from-[#6366F1] to-[#818CF8]',
  'from-[#22C55E] to-[#16A34A]',
  'from-[#F59E0B] to-[#D97706]',
  'from-[#EC4899] to-[#DB2777]',
  'from-[#06B6D4] to-[#0891B2]',
]

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function getWeekDays(d: Date): Date[] {
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday)
    dd.setDate(monday.getDate() + i)
    return dd
  })
}

function getMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1)
  const totalDays = new Date(year, month + 1, 0).getDate()
  const startDow = (firstDay.getDay() + 6) % 7
  const cells: (Date | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => new Date(year, month, i + 1)),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const rows: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
  return rows
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function PlanPage() {
  const router = useRouter()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeDay, setActiveDay] = useState(0)
  const [replaceTarget, setReplaceTarget] = useState<PlanExercise | null>(null)
  const [alternatives, setAlternatives] = useState<PlanExercise[]>([])
  const [altLoading, setAltLoading] = useState(false)
  const [customRequest, setCustomRequest] = useState('')
  const [videoExercise, setVideoExercise] = useState<PlanExercise | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [videoLoading, setVideoLoading] = useState(false)
  const [altPreview, setAltPreview] = useState<PlanExercise | null>(null)
  const [showEditPlan, setShowEditPlan] = useState(false)
  const [editDays, setEditDays] = useState(4)
  const [editSession, setEditSession] = useState(60)
  const [editSplit, setEditSplit] = useState('ppl')
  const [editEquipment, setEditEquipment] = useState('full_gym')
  const [editEquipCustom, setEditEquipCustom] = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const [showLogCardio, setShowLogCardio] = useState(false)
  const [cardioType, setCardioType] = useState('')
  const [cardioDistance, setCardioDistance] = useState('')
  const [cardioDuration, setCardioDuration] = useState('')
  const [cardioIntensity, setCardioIntensity] = useState<'easy' | 'moderate' | 'hard' | ''>('')
  const [cardioNotes, setCardioNotes] = useState('')
  const [soreAreas, setSoreAreas] = useState<Record<string, number>>({})
  const [sorenessLogged, setSorenessLogged] = useState(false)
  const [sorenessExpanded, setSorenessExpanded] = useState(true)
  const [showCalendar, setShowCalendar] = useState(false)
  const [calMonth, setCalMonth] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() })
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistoryEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<WorkoutHistoryEntry | null>(null)
  const [completedToday, setCompletedToday] = useState(false)
  const [thumbnails, setThumbnails] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      return JSON.parse(sessionStorage.getItem('crushlift_thumbnails') || '{}')
    } catch { return {} }
  })
  const [inProgressSets, setInProgressSets] = useState<Record<string, { completed: boolean }[]>>({})
  const [confirmDone, setConfirmDone] = useState(false)
  const [sorenessConfirmed, setSorenessConfirmed] = useState(false)

  const today = new Date()
  const weekDays = getWeekDays(today)
  const isoWeek = getISOWeek(today)
  const todayKey = today.toISOString().slice(0, 10)
  const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
  const DAY_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

  const trainingDays: string[] = (plan?.onboarding_data?.trainingDays ?? plan?.onboardingData?.trainingDays) || []

  function getEntryForDate(d: Date): WorkoutHistoryEntry | undefined {
    return workoutHistory.find(e => e.date.slice(0, 10) === d.toISOString().slice(0, 10))
  }
  function isScheduledDay(d: Date): boolean {
    return trainingDays.includes(DAY_NAMES[d.getDay()])
  }

  function getInitialDay(p: Plan): number {
    const od = p.onboarding_data ?? p.onboardingData
    const tDays = od?.trainingDays || []

    if (tDays.length) {
      const sorted = [...tDays].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))
      const todayName = DAY_NAMES[today.getDay()]
      const idx = sorted.indexOf(todayName)
      if (idx !== -1) return Math.min(idx, p.days.length - 1)
      // Rest day — find next upcoming training day's plan day
      return 0
    }

    // No training days set — use last logged workout to find next day
    const history: WorkoutHistoryEntry[] = JSON.parse(localStorage.getItem('crushlift_workout_history') || '[]')
    const lastLogged = history.find(e => p.days.some(d => d.dayNumber === e.dayNumber))
    if (lastLogged) {
      const lastDayIndex = p.days.findIndex(d => d.dayNumber === lastLogged.dayNumber)
      return Math.min(lastDayIndex + 1, p.days.length - 1)
    }
    return 0
  }

  const loadPlan = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Load most recent plan from Supabase
      const { data: plans } = await supabase
        .from('plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (plans?.length) {
        setPlan(plans[0])
        setActiveDay(getInitialDay(plans[0]))
        setLoading(false)
        return
      }
    }

    // Anonymous or no Supabase plan: try localStorage guest plan
    const guestRaw = localStorage.getItem('crushlift_guest_plan')
    if (guestRaw) {
      try {
        const p = JSON.parse(guestRaw)
        setPlan(p)
        setActiveDay(getInitialDay(p))
      } catch {}
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadPlan() }, [loadPlan])

  useEffect(() => {
    if (!plan) return
    const history: WorkoutHistoryEntry[] = JSON.parse(localStorage.getItem('crushlift_workout_history') || '[]')
    const done = history.some(e =>
      e.date.slice(0, 10) === todayKey &&
      e.dayNumber === plan.days[activeDay]?.dayNumber
    )
    setCompletedToday(done)
  }, [plan, activeDay, todayKey])

  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10)
    const raw = localStorage.getItem('crushlift_soreness_log')
    const log = raw ? JSON.parse(raw) : {}
    if (log[todayKey]) {
      setSoreAreas(log[todayKey])
      setSorenessLogged(true)
    }
  }, [])

  function tapSoreArea(area: string) {
    setSoreAreas(prev => ({ ...prev, [area]: ((prev[area] || 0) + 1) % 4 }))
  }

  function saveSoreness() {
    const todayKey = new Date().toISOString().slice(0, 10)
    const raw = localStorage.getItem('crushlift_soreness_log')
    const log = raw ? JSON.parse(raw) : {}
    log[todayKey] = soreAreas
    localStorage.setItem('crushlift_soreness_log', JSON.stringify(log))
    setSorenessLogged(true)
  }

  useEffect(() => { setConfirmDone(false) }, [activeDay])

  useEffect(() => {
    if (Object.keys(thumbnails).length > 0)
      sessionStorage.setItem('crushlift_thumbnails', JSON.stringify(thumbnails))
  }, [thumbnails])

  // Load in-progress workout sets for the active day
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const savedRaw = localStorage.getItem('crushlift_inprogress_workout')
    if (!savedRaw) { setInProgressSets({}); return }
    try {
      const saved = JSON.parse(savedRaw)
      if (saved.date === today && saved.dayIndex === activeDay) {
        setInProgressSets(saved.sets || {})
      } else {
        setInProgressSets({})
      }
    } catch { setInProgressSets({}) }
  }, [activeDay, plan?.id])

  // Prefetch thumbnails for active day
  useEffect(() => {
    if (!plan) return
    const exercises = plan.days[activeDay]?.exercises ?? []
    exercises.forEach((ex: PlanExercise) => {
      if (thumbnails[ex.id]) return
      fetch(`/api/youtube-search?q=${encodeURIComponent(ex.name)}`)
        .then(r => r.json())
        .then(data => {
          if (data.thumbnail) setThumbnails(prev => ({ ...prev, [ex.id]: data.thumbnail }))
        })
        .catch(() => {})
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, activeDay])

  useEffect(() => {
    if (!showCalendar) return
    // Guest: read from localStorage
    const raw = localStorage.getItem('crushlift_workout_history')
    const local: WorkoutHistoryEntry[] = raw ? JSON.parse(raw) : []
    // Auth: merge with Supabase
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setWorkoutHistory(local); return }
      supabase
        .from('workout_sessions')
        .select('id, day_name, day_number, started_at, finished_at')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(60)
        .then(({ data }) => {
          const remote: WorkoutHistoryEntry[] = (data || []).map(s => ({
            id: s.id,
            date: s.started_at,
            dayName: s.day_name,
            dayNumber: s.day_number,
            exercises: [],
          }))
          const combined = [...local, ...remote]
          const seen = new Set<string>()
          setWorkoutHistory(combined.filter(e => { const d = e.date.slice(0, 10); if (seen.has(d)) return false; seen.add(d); return true }))
        })
    })
  }, [showCalendar])

  async function handlePlayVideo(exercise: PlanExercise) {
    setVideoExercise(exercise)
    setVideoLoading(true)
    if (exercise.youtubeVideoId) {
      setVideoId(exercise.youtubeVideoId)
      setVideoLoading(false)
      return
    }
    const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(exercise.name)}`)
    const data = await res.json()
    setVideoId(data.videoId || null)
    if (data.thumbnail) setThumbnails(prev => ({ ...prev, [exercise.id]: data.thumbnail }))
    setVideoLoading(false)
  }

  async function openReplace(exercise: PlanExercise) {
    setReplaceTarget(exercise)
    setAlternatives([])
    setCustomRequest('')
    setAltLoading(true)
    const res = await fetch('/api/replace-exercise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseName: exercise.name,
        equipment: plan?.onboarding_data?.equipment ?? plan?.onboardingData?.equipment,
        goal: plan?.onboarding_data?.goal ?? plan?.onboardingData?.goal,
      }),
    })
    const data = await res.json()
    setAlternatives(data.alternatives || [])
    setAltLoading(false)
  }

  async function fetchCustomAlternatives() {
    if (!replaceTarget || !customRequest.trim()) return
    setAltLoading(true)
    const res = await fetch('/api/replace-exercise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseName: replaceTarget.name,
        equipment: plan?.onboarding_data?.equipment ?? plan?.onboardingData?.equipment,
        goal: plan?.onboarding_data?.goal ?? plan?.onboardingData?.goal,
        customRequest,
      }),
    })
    const data = await res.json()
    setAlternatives(data.alternatives || [])
    setAltLoading(false)
  }

  function persistPlan(updated: Plan) {
    if (updated.user_id) {
      const supabase = createClient()
      supabase.from('plans').update({ days: updated.days }).eq('id', updated.id)
    } else {
      localStorage.setItem('crushlift_guest_plan', JSON.stringify(updated))
    }
  }

  function applyReplacement(alt: PlanExercise) {
    if (!plan || !replaceTarget) return
    const updated: Plan = {
      ...plan,
      days: plan.days.map((day: PlanDay) => ({
        ...day,
        exercises: day.exercises.map((ex: PlanExercise) =>
          ex.id === replaceTarget.id ? { ...alt, id: replaceTarget.id } : ex
        ),
      })),
    }
    setPlan(updated)
    setReplaceTarget(null)
    persistPlan(updated)
  }

  function deleteExercise(exerciseId: string) {
    if (!plan) return
    const updated: Plan = {
      ...plan,
      days: plan.days.map((day: PlanDay) => ({
        ...day,
        exercises: day.exercises.filter((ex: PlanExercise) => ex.id !== exerciseId),
      })),
    }
    setPlan(updated)
    persistPlan(updated)
  }

  function saveCardio() {
    if (!cardioType.trim() || !cardioIntensity) return
    const entry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: cardioType.trim(),
      distance: cardioDistance || undefined,
      duration: cardioDuration || undefined,
      intensity: cardioIntensity,
      notes: cardioNotes || undefined,
    }
    const raw = localStorage.getItem('crushlift_cardio_log')
    const log = raw ? JSON.parse(raw) : []
    localStorage.setItem('crushlift_cardio_log', JSON.stringify([entry, ...log]))
    setCardioType(''); setCardioDistance(''); setCardioDuration(''); setCardioIntensity(''); setCardioNotes('')
    setShowLogCardio(false)
  }

  function openEditPlan() {
    const od = plan?.onboarding_data ?? plan?.onboardingData
    setEditDays(od?.daysPerWeek ?? 4)
    setEditSession(od?.sessionLength ?? 60)
    setEditSplit(od?.splitType ?? 'ppl')
    const knownEquipment = ['full_gym', 'dumbbells', 'no_equipment']
    const eq = od?.equipment ?? 'full_gym'
    if (knownEquipment.includes(eq)) {
      setEditEquipment(eq)
      setEditEquipCustom('')
    } else {
      setEditEquipment('')
      setEditEquipCustom(od?.equipmentCustom ?? eq)
    }
    setShowEditPlan(true)
  }

  async function regeneratePlan() {
    if (!plan) return
    setRegenerating(true)
    const od = plan.onboarding_data ?? plan.onboardingData ?? {}
    const updatedOnboarding = {
      ...od,
      daysPerWeek: editDays,
      sessionLength: editSession,
      splitType: editSplit,
      equipment: editEquipment || editEquipCustom,
      equipmentCustom: editEquipCustom || undefined,
    }
    const workoutHistory = JSON.parse(localStorage.getItem('crushlift_workout_history') || '[]')
    const sorenessLog = JSON.parse(localStorage.getItem('crushlift_soreness_log') || '{}')
    const cardioLog = JSON.parse(localStorage.getItem('crushlift_cardio_log') || '[]')

    const res = await fetch('/api/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onboarding: updatedOnboarding, workoutHistory, sorenessLog, cardioLog }),
    })
    const data = await res.json()
    if (data.plan) {
      const updated = { ...data.plan, id: plan.id, user_id: plan.user_id }
      setPlan(updated)
      persistPlan(updated)
    }
    setRegenerating(false)
    setShowEditPlan(false)
  }

  async function markAsDone() {
    if (!plan) return
    const day = plan.days[activeDay]
    const entry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      dayName: day.dayName,
      dayNumber: day.dayNumber,
      exercises: day.exercises.map((ex: PlanExercise) => ({
        name: ex.name,
        sets: [],
      })),
    }
    sessionStorage.setItem('crushlift_last_workout', JSON.stringify(entry))
    const existing = JSON.parse(localStorage.getItem('crushlift_workout_history') || '[]')
    localStorage.setItem('crushlift_workout_history', JSON.stringify([entry, ...existing]))

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('workout_sessions').insert({
        user_id: user.id,
        plan_id: plan.id,
        day_number: day.dayNumber,
        day_name: day.dayName,
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
      })
    }
    router.push('/workout/complete')
  }

  function startWorkout() {
    if (!plan) return
    router.push(`/workout?planId=${plan.id}&day=${activeDay}`)
  }

  if (loading) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-dvh bg-[#0D0D0F]">
        <Loader2 className="w-8 h-8 text-[#FF4500] animate-spin" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="mobile-container flex flex-col min-h-dvh bg-[#0D0D0F] has-bottom-nav">
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#FF4500]/10 border border-[#FF4500]/20 flex items-center justify-center mb-6">
            <Play className="w-7 h-7 text-[#FF4500] ml-0.5" />
          </div>
          <h2 className="text-xl font-bold mb-2">No plan yet</h2>
          <p className="text-[#9A9AAA] text-sm mb-8 leading-relaxed">
            Answer 5 quick questions and get a personalized workout plan with demo videos for every exercise.
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/onboarding')}
            className="w-full max-w-xs bg-[#FF4500] text-white font-bold py-4 rounded-2xl shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
          >
            Build My Plan
          </motion.button>
        </div>
        <BottomNav active="plan" />
      </div>
    )
  }

  const currentDay: PlanDay = plan.days[activeDay]

  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0D0D0F] has-bottom-nav">
      {/* Header */}
      <header className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold">My Plan</h1>
            <p className="text-[#9A9AAA] text-sm mt-0.5">{plan.days.length} days / week</p>
          </div>
          <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={openEditPlan}
            className="w-10 h-10 rounded-2xl bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA] hover:text-white hover:border-[#3A3A3C] transition-all"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowCalendar(true)}
            className="w-10 h-10 rounded-2xl bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA] hover:text-white hover:border-[#3A3A3C] transition-all"
          >
            <Calendar className="w-5 h-5" />
          </motion.button>
          </div>
        </div>

        {/* Week strip */}
        <div className="flex gap-1 mt-5">
          {weekDays.map((d, i) => {
            const isToday = isSameDay(d, today)
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-[#636366] uppercase">{WEEK_DAYS[i]}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isToday ? 'bg-[#FF4500] shadow-[0_4px_12px_rgba(255,69,0,0.35)]' : ''
                }`}>
                  <span className={`text-xs font-bold ${isToday ? 'text-white' : 'text-[#9A9AAA]'}`}>
                    {d.getDate()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </header>

      {/* Soreness card */}
      <div className="px-5 mb-4">
        <div className="bg-[#1C1C1E] border border-[#252528] rounded-2xl overflow-hidden">
          {/* Always-visible header row — tap to expand/collapse */}
          <button
            onClick={() => setSorenessExpanded(p => !p)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-semibold text-[#9A9AAA]">
                {today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              {sorenessLogged && Object.entries(soreAreas).filter(([, v]) => v > 0).length === 0 && (
                <span className="text-xs text-[#636366]">Feeling good</span>
              )}
              {Object.entries(soreAreas)
                .filter(([, v]) => v > 0)
                .map(([area, level]) => (
                  <span
                    key={area}
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${SORENESS_STYLES[SORENESS_LEVELS[level].color]}`}
                  >
                    {area}
                  </span>
                ))}
              {!sorenessLogged && Object.values(soreAreas).every(v => !v) && (
                <span className="text-xs text-[#636366]">How are you feeling?</span>
              )}
            </div>
            <ChevronRight className={`w-4 h-4 text-[#636366] flex-shrink-0 transition-transform duration-200 ${sorenessExpanded ? 'rotate-90' : ''}`} />
          </button>

          {/* Expandable body */}
          <AnimatePresence>
            {sorenessExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 border-t border-[#252528] pt-3">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {SORENESS_AREAS.map(area => {
                      const level = soreAreas[area] || 0
                      const { color } = SORENESS_LEVELS[level]
                      return (
                        <motion.button
                          key={area}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => tapSoreArea(area)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${SORENESS_STYLES[color]}`}
                        >
                          {level > 0 && (
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              color === 'amber' ? 'bg-amber-400'
                              : color === 'orange' ? 'bg-orange-400'
                              : 'bg-red-400'
                            }`} />
                          )}
                          {area}
                        </motion.button>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-[#636366]">Once mild · twice moderate · 3× sore</p>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        saveSoreness()
                        setSorenessConfirmed(true)
                        setTimeout(() => setSorenessConfirmed(false), 2000)
                      }}
                      className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                        sorenessConfirmed
                          ? 'bg-[#22C55E] text-white'
                          : 'bg-[#FF4500] text-white'
                      }`}
                    >
                      {sorenessConfirmed ? 'Logged ✓' : 'Log it'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Log Cardio button */}
      <div className="px-5 mb-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowLogCardio(true)}
          className="w-full flex items-center justify-between bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-3 text-left hover:border-[#3A3A3C] transition-all"
        >
          <div>
            <p className="text-sm font-semibold text-white">Log Cardio</p>
            <p className="text-xs text-[#636366] mt-0.5">Helps the AI build your lifting plan around your activity</p>
          </div>
          <ChevronRight className="w-4 h-4 text-[#636366] flex-shrink-0" />
        </motion.button>
      </div>

      {/* Day tabs */}
      <div className="flex gap-2 px-5 mb-5 overflow-x-auto no-scrollbar">
        {plan.days.map((day: PlanDay, i: number) => (
          <button
            key={i}
            onClick={() => setActiveDay(i)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeDay === i
                ? 'bg-[#FF4500] text-white'
                : 'bg-[#1C1C1E] text-[#9A9AAA] border border-[#252528]'
            }`}
          >
            Day {day.dayNumber}
          </button>
        ))}
      </div>

      {/* Day name */}
      <div className="px-5 mb-4">
        <h2 className="text-lg font-bold">{currentDay.dayName}</h2>
        <p className="text-xs text-[#9A9AAA]">{currentDay.exercises.length} exercises</p>
      </div>

      {/* Exercises */}
      <div className="flex-1 px-5 flex flex-col gap-2.5">
        <AnimatePresence>
          {currentDay.exercises.map((ex: PlanExercise, exIdx: number) => (
            <motion.div
              key={ex.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-[#1C1C1E] border border-[#252528] rounded-2xl overflow-hidden flex"
            >
              {/* Thumbnail — tap to watch video */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePlayVideo(ex)}
                className={`w-[72px] flex-shrink-0 relative overflow-hidden flex items-center justify-center ${!thumbnails[ex.id] ? `bg-gradient-to-br ${GRADIENTS[exIdx % GRADIENTS.length]}` : 'bg-black'}`}
              >
                {thumbnails[ex.id] && (
                  <img
                    src={thumbnails[ex.id]}
                    alt={ex.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                  />
                )}
                <div className="relative z-10 w-9 h-9 rounded-full bg-black/50 border border-white/20 flex items-center justify-center shadow-md">
                  <Play className="w-3.5 h-3.5 text-white ml-0.5" fill="white" />
                </div>
              </motion.button>

              {/* Exercise info + actions */}
              <div className="flex-1 min-w-0 px-3 py-3.5 flex flex-col justify-center">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white leading-tight">{ex.name}</p>
                    <span className="text-xs font-bold text-[#FF4500] bg-[#FF4500]/10 border border-[#FF4500]/20 rounded-md px-2 py-1 mt-1.5 inline-block leading-none">
                      {ex.sets}×{ex.reps}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 mt-0.5">
                    {((inProgressSets[ex.id] || []).length > 0 && (inProgressSets[ex.id] || []).every(s => s.completed)) ? (
                      <span className="text-xs font-bold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/25 rounded-lg px-2.5 py-1.5 leading-none">
                        Done ✓
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => openReplace(ex)}
                          className="text-[11px] text-[#AEAEB2] font-semibold px-2.5 py-1.5 rounded-lg bg-[#252528] border border-[#252528] hover:border-[#FF4500]/40 hover:text-[#FF4500] transition-all"
                        >
                          Swap
                        </button>
                        <button
                          onClick={() => deleteExercise(ex.id)}
                          className="w-7 h-7 rounded-lg bg-[#252528] border border-[#252528] flex items-center justify-center text-[#636366] hover:border-red-500/40 hover:text-red-400 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Start Workout CTA */}
      <div className="px-5 pt-4 pb-6 flex flex-col gap-2.5">
        {completedToday ? (
          <div className="w-full bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-2xl py-4 flex items-center justify-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#22C55E] flex items-center justify-center">
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
            <p className="text-sm font-bold text-[#22C55E]">Done today</p>
          </div>
        ) : (
          <>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={startWorkout}
              className="w-full bg-[#FF4500] text-white font-bold text-base py-[18px] rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
            >
              Start Day {activeDay + 1}
              <ChevronRight className="w-5 h-5" />
            </motion.button>
            {confirmDone ? (
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setConfirmDone(false)}
                  className="flex-1 bg-[#1C1C1E] border border-[#252528] text-[#9A9AAA] font-semibold text-sm py-3.5 rounded-2xl"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={async () => { await markAsDone(); setCompletedToday(true) }}
                  className="flex-1 bg-[#22C55E] text-white font-bold text-sm py-3.5 rounded-2xl shadow-[0_4px_16px_rgba(34,197,94,0.2)]"
                >
                  Yes, log it
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setConfirmDone(true)}
                className="w-full bg-[#1C1C1E] border border-[#252528] text-[#9A9AAA] font-semibold text-sm py-3.5 rounded-2xl hover:text-white hover:border-[#3A3A3C] transition-all"
              >
                I already did this workout
              </motion.button>
            )}
          </>
        )}
      </div>

      <BottomNav active="plan" />

      {/* Replace sheet */}
      <AnimatePresence>
        {replaceTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReplaceTarget(null)}
              className="fixed inset-0 bg-black/70 z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] bg-[#141414] border-t border-[#252528] rounded-t-3xl z-50"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-[#3A3A3C]" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-2 pb-4">
                <div>
                  <p className="text-xs text-[#636366] uppercase tracking-wider font-semibold">Replace</p>
                  <p className="font-bold text-base mt-0.5 truncate max-w-[260px]">{replaceTarget.name}</p>
                </div>
                <button
                  onClick={() => setReplaceTarget(null)}
                  className="w-8 h-8 rounded-full bg-[#252528] flex items-center justify-center text-[#9A9AAA] hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Suggestion cards */}
              {altLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 text-[#FF4500] animate-spin" />
                </div>
              ) : alternatives.length > 0 && !customRequest && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-[#636366] uppercase tracking-wider px-5 mb-3">Suggested</p>
                  <div className="flex gap-3 px-5 overflow-x-auto no-scrollbar pb-1">
                    {alternatives.map((alt, i) => {
                      return (
                        <motion.button
                          key={alt.id}
                          whileTap={{ scale: 0.93 }}
                          onClick={() => { setAltPreview(alt); handlePlayVideo(alt) }}
                          className="flex-shrink-0 w-[130px] rounded-2xl overflow-hidden bg-[#1C1C1E] border border-[#252528] hover:border-[#FF4500]/50 transition-colors text-left"
                        >
                          {/* Thumbnail */}
                          <div className={`h-[88px] bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center relative`}>
                            {/* Play button — centered */}
                            <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
                              <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                            </div>
                            {/* Muscle group badge */}
                            {alt.muscleGroup && (
                              <span className="absolute bottom-2 left-2 text-[9px] font-bold uppercase tracking-wider bg-black/40 text-white px-1.5 py-0.5 rounded-md">
                                {alt.muscleGroup}
                              </span>
                            )}
                          </div>
                          {/* Info */}
                          <div className="p-2.5">
                            <p className="text-xs font-bold text-white leading-tight line-clamp-2">{alt.name}</p>
                            <p className="text-[10px] text-[#FF4500] font-bold mt-1">{alt.sets}×{alt.reps}</p>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 px-5 my-3">
                <div className="flex-1 h-px bg-[#252528]" />
                <span className="text-xs text-[#636366] font-medium">or search</span>
                <div className="flex-1 h-px bg-[#252528]" />
              </div>

              {/* Search bar */}
              <div className="flex gap-2 px-5">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-[#636366] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customRequest}
                    onChange={e => setCustomRequest(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && fetchCustomAlternatives()}
                    placeholder="Search exercises..."
                    className="w-full bg-[#252528] border border-[#3A3A3C] rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors"
                  />
                </div>
                <button
                  onClick={fetchCustomAlternatives}
                  disabled={!customRequest.trim() || altLoading}
                  className="px-4 py-3 bg-[#FF4500] text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-opacity"
                >
                  Go
                </button>
              </div>

              {/* Search results */}
              {customRequest && (
                <div className="px-5 pt-3 pb-10 max-h-[35vh] overflow-y-auto">
                  {altLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 text-[#FF4500] animate-spin" />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {alternatives.map(alt => (
                        <button
                          key={alt.id}
                          onClick={() => { setAltPreview(alt); handlePlayVideo(alt) }}
                          className="flex items-center gap-3 p-3.5 bg-[#1C1C1E] border border-[#252528] rounded-2xl text-left hover:border-[#FF4500]/40 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-xl bg-[#252528] flex items-center justify-center flex-shrink-0">
                            <Play className="w-3.5 h-3.5 text-[#FF4500] ml-0.5" fill="currentColor" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{alt.name}</p>
                            <p className="text-xs text-[#9A9AAA] mt-0.5">{alt.sets} × {alt.reps}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#FF4500] flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!customRequest && <div className="pb-10" />}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Video modal */}
      <AnimatePresence>
        {videoExercise && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setVideoExercise(null); setVideoId(null); setAltPreview(null) }}
              className="fixed inset-0 bg-black/90 z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-[398px] mx-auto z-[70] bg-[#1C1C1E] rounded-3xl overflow-hidden border border-[#252528]"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-[#252528]">
                <div>
                  <p className="font-bold text-sm">{videoExercise.name}</p>
                  {altPreview && (
                    <p className="text-xs text-[#9A9AAA] mt-0.5">{altPreview.sets} × {altPreview.reps}</p>
                  )}
                </div>
                <button
                  onClick={() => { setVideoExercise(null); setVideoId(null); setAltPreview(null) }}
                  className="text-[#9A9AAA]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="aspect-video bg-[#0D0D0F] flex items-center justify-center">
                {videoLoading ? (
                  <Loader2 className="w-8 h-8 text-[#FF4500] animate-spin" />
                ) : videoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                ) : (
                  <p className="text-[#9A9AAA] text-sm">No video found</p>
                )}
              </div>

              {/* Replace CTA — only when previewing an alternative */}
              {altPreview && (
                <div className="px-4 py-4 border-t border-[#252528]">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      applyReplacement(altPreview)
                      setVideoExercise(null)
                      setVideoId(null)
                      setAltPreview(null)
                    }}
                    className="w-full bg-[#FF4500] text-white font-bold py-3.5 rounded-2xl text-sm shadow-[0_4px_20px_rgba(255,69,0,0.3)]"
                  >
                    Replace with {altPreview.name}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Paywall */}
      {/* Log Cardio sheet */}
      <AnimatePresence>
        {showLogCardio && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowLogCardio(false)} className="fixed inset-0 bg-black/70 z-40" />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] bg-[#141414] border-t border-[#252528] rounded-t-3xl z-50 flex flex-col max-h-[90vh]"
            >
              <div className="flex-shrink-0">
                <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-[#3A3A3C]" /></div>
                <div className="flex items-center justify-between px-5 pt-2 pb-4">
                  <div>
                    <p className="text-[10px] text-[#636366] font-semibold uppercase tracking-wider mb-0.5">
                      {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="font-bold text-base">Log Cardio</p>
                    <p className="text-xs text-[#636366] mt-0.5">So your lifting plan adjusts around your full activity</p>
                  </div>
                  <button onClick={() => setShowLogCardio(false)} className="w-8 h-8 rounded-full bg-[#252528] flex items-center justify-center text-[#9A9AAA] flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-10">
                <div className="flex flex-col gap-5">
                  {/* Activity type */}
                  <div>
                    <label className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider block mb-2">Activity</label>
                    <input
                      type="text"
                      value={cardioType}
                      onChange={e => setCardioType(e.target.value)}
                      placeholder='e.g. "Run", "Cycling", "Basketball"'
                      className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors"
                    />
                  </div>

                  {/* Distance + Duration */}
                  <div className="flex gap-2.5">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider block mb-2">Distance</label>
                      <input
                        type="text"
                        value={cardioDistance}
                        onChange={e => setCardioDistance(e.target.value)}
                        placeholder='e.g. "3 miles"'
                        className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider block mb-2">Duration</label>
                      <input
                        type="text"
                        value={cardioDuration}
                        onChange={e => setCardioDuration(e.target.value)}
                        placeholder='e.g. "28 min"'
                        className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Intensity */}
                  <div>
                    <label className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider block mb-2">Intensity</label>
                    <div className="flex gap-2.5">
                      {(['easy', 'moderate', 'hard'] as const).map(level => (
                        <button
                          key={level}
                          onClick={() => setCardioIntensity(level)}
                          className={`flex-1 py-3 rounded-xl border text-sm font-bold capitalize transition-all ${
                            cardioIntensity === level
                              ? level === 'easy' ? 'border-green-500/40 bg-green-500/10 text-green-400'
                                : level === 'moderate' ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                                : 'border-red-500/40 bg-red-500/10 text-red-400'
                              : 'border-[#252528] bg-[#1C1C1E] text-[#9A9AAA] hover:border-[#3A3A3C]'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider block mb-2">Notes <span className="text-[#636366] normal-case font-normal">(optional)</span></label>
                    <input
                      type="text"
                      value={cardioNotes}
                      onChange={e => setCardioNotes(e.target.value)}
                      placeholder='e.g. "Felt good, easy pace"'
                      className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors"
                    />
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={saveCardio}
                    disabled={!cardioType.trim() || !cardioIntensity}
                    className="w-full bg-[#FF4500] text-white font-bold py-[18px] rounded-2xl shadow-[0_8px_32px_rgba(255,69,0,0.25)] disabled:opacity-30"
                  >
                    Save
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit plan sheet */}
      <AnimatePresence>
        {showEditPlan && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowEditPlan(false)}
              className="fixed inset-0 bg-black/70 z-40"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] bg-[#141414] border-t border-[#252528] rounded-t-3xl z-50 flex flex-col max-h-[90vh]"
            >
              {/* Fixed header */}
              <div className="flex-shrink-0">
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-[#3A3A3C]" />
                </div>
                <div className="flex items-center justify-between px-5 pt-2 pb-4">
                  <div>
                    <p className="font-bold text-base">Adjust Plan</p>
                  <p className="text-xs text-[#636366] mt-0.5">Changes will regenerate your plan</p>
                </div>
                <button onClick={() => setShowEditPlan(false)} className="w-8 h-8 rounded-full bg-[#252528] flex items-center justify-center text-[#9A9AAA]">
                  <X className="w-4 h-4" />
                </button>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 pb-10">
              <div className="flex flex-col gap-6 pt-2">
                {/* Days per week */}
                <div>
                  <p className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider mb-3">Days per week</p>
                  <div className="grid grid-cols-6 gap-2">
                    {[2, 3, 4, 5, 6, 7].map(d => (
                      <button
                        key={d}
                        onClick={() => setEditDays(d)}
                        className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                          editDays === d
                            ? 'border-[#FF4500] bg-[#FF4500]/10 text-[#FF4500]'
                            : 'border-[#252528] bg-[#1C1C1E] text-[#9A9AAA] hover:border-[#3A3A3C]'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Session length */}
                <div>
                  <p className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider mb-3">Session length</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[{ v: 30, l: '30 min' }, { v: 45, l: '45 min' }, { v: 60, l: '60 min' }, { v: 90, l: '90 min+' }].map(({ v, l }) => (
                      <button
                        key={v}
                        onClick={() => setEditSession(v)}
                        className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                          editSession === v
                            ? 'border-[#FF4500] bg-[#FF4500]/10 text-[#FF4500]'
                            : 'border-[#252528] bg-[#1C1C1E] text-[#9A9AAA] hover:border-[#3A3A3C]'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Split type */}
                <div>
                  <p className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider mb-3">Workout structure</p>
                  <div className="flex flex-col gap-2">
                    {[
                      { v: 'ppl', l: 'Push / Pull / Legs', d: 'Chest+shoulders+tris / Back+bis / Legs' },
                      { v: 'upper_lower', l: 'Upper / Lower', d: 'Upper body and lower body alternating' },
                      { v: 'full_body', l: 'Full Body', d: 'Hit everything each session' },
                      { v: 'body_part', l: 'Body Part Split', d: 'One muscle group per day' },
                      { v: 'athletic', l: 'Strength / Power', d: 'Heavy compound lifts, strength-focused' },
                      { v: 'not_sure', l: 'Not sure', d: 'AI picks the best split for your goal' },
                    ].map(({ v, l, d }) => (
                      <button
                        key={v}
                        onClick={() => setEditSplit(v)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${
                          editSplit === v
                            ? 'border-[#FF4500] bg-[#FF4500]/10'
                            : 'border-[#252528] bg-[#1C1C1E] hover:border-[#3A3A3C]'
                        }`}
                      >
                        <div className="flex-1">
                          <p className={`text-sm font-bold ${editSplit === v ? 'text-[#FF4500]' : 'text-white'}`}>{l}</p>
                          <p className="text-xs text-[#636366] mt-0.5">{d}</p>
                        </div>
                        {editSplit === v && <Check className="w-4 h-4 text-[#FF4500] flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Equipment */}
                <div>
                  <p className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider mb-3">Equipment</p>
                  <div className="flex flex-col gap-2">
                    {[
                      { v: 'full_gym', l: 'Full Gym', d: 'Barbells, cables, machines' },
                      { v: 'dumbbells', l: 'Dumbbells Only', d: 'Home setup, limited gear' },
                      { v: 'no_equipment', l: 'No Equipment', d: 'Bodyweight only' },
                    ].map(({ v, l, d }) => (
                      <button
                        key={v}
                        onClick={() => { setEditEquipment(v); setEditEquipCustom('') }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${
                          editEquipment === v
                            ? 'border-[#FF4500] bg-[#FF4500]/10'
                            : 'border-[#252528] bg-[#1C1C1E] hover:border-[#3A3A3C]'
                        }`}
                      >
                        <div className="flex-1">
                          <p className={`text-sm font-bold ${editEquipment === v ? 'text-[#FF4500]' : 'text-white'}`}>{l}</p>
                          <p className="text-xs text-[#636366] mt-0.5">{d}</p>
                        </div>
                        {editEquipment === v && <Check className="w-4 h-4 text-[#FF4500] flex-shrink-0" />}
                      </button>
                    ))}
                    <input
                      type="text"
                      value={editEquipCustom}
                      onChange={e => { setEditEquipCustom(e.target.value); setEditEquipment('') }}
                      placeholder="I have specific equipment..."
                      className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors"
                    />
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={regeneratePlan}
                  disabled={regenerating}
                  className="w-full bg-[#FF4500] text-white font-bold py-[18px] rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.25)] disabled:opacity-40"
                >
                  {regenerating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Regenerating...</>
                  ) : (
                    <><SlidersHorizontal className="w-4 h-4" /> Regenerate Plan</>
                  )}
                </motion.button>
              </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Workout detail sheet */}
      <AnimatePresence>
        {selectedEntry && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEntry(null)}
              className="fixed inset-0 bg-black/70 z-[60]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] bg-[#141414] border-t border-[#252528] rounded-t-3xl z-[70] pb-10 max-h-[80vh] flex flex-col"
            >
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-[#3A3A3C]" />
              </div>
              <div className="flex items-start justify-between px-5 py-3 flex-shrink-0">
                <div>
                  <p className="font-bold text-base">{selectedEntry.dayName}</p>
                  <p className="text-xs text-[#636366] mt-0.5">
                    {new Date(selectedEntry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <button onClick={() => setSelectedEntry(null)} className="w-8 h-8 rounded-full bg-[#252528] flex items-center justify-center text-[#9A9AAA]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 flex flex-col gap-3">
                {selectedEntry.exercises.length === 0 ? (
                  <p className="text-sm text-[#636366] py-4">No exercise detail available for this session.</p>
                ) : selectedEntry.exercises.map((ex, i) => (
                  <div key={i} className="bg-[#1C1C1E] border border-[#252528] rounded-2xl p-4">
                    <p className="font-bold text-sm mb-3">{ex.name}</p>
                    <div className="flex text-[10px] font-semibold text-[#636366] uppercase tracking-wider mb-2 gap-4">
                      <span className="w-8">Set</span>
                      <span className="flex-1">Weight</span>
                      <span className="flex-1">Reps</span>
                    </div>
                    {ex.sets.filter(s => s.completed).map((s, si) => (
                      <div key={si} className="flex items-center gap-4 py-1.5 border-t border-[#252528]">
                        <span className="text-xs text-[#636366] w-8">{s.setNumber}</span>
                        <span className="text-sm font-semibold flex-1">
                          {s.weight != null ? `${s.weight} lbs` : '—'}
                        </span>
                        <span className="text-sm font-semibold flex-1 text-[#FF4500]">
                          {s.reps != null ? `${s.reps}` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Calendar sheet */}
      <AnimatePresence>
        {showCalendar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCalendar(false)}
              className="fixed inset-0 bg-black/70 z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] bg-[#141414] border-t border-[#252528] rounded-t-3xl z-50 pb-10"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-[#3A3A3C]" />
              </div>

              {/* Month nav */}
              <div className="flex items-center justify-between px-5 py-3">
                <button
                  onClick={() => setCalMonth(m => {
                    const d = new Date(m.year, m.month - 1)
                    return { year: d.getFullYear(), month: d.getMonth() }
                  })}
                  className="w-9 h-9 rounded-xl bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA] hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <p className="font-bold text-base">
                  {MONTHS[calMonth.month]} {calMonth.year}
                </p>
                <button
                  onClick={() => setCalMonth(m => {
                    const d = new Date(m.year, m.month + 1)
                    return { year: d.getFullYear(), month: d.getMonth() }
                  })}
                  className="w-9 h-9 rounded-xl bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA] hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day of week headers */}
              <div className="grid grid-cols-7 px-4 mb-2">
                {WEEK_DAYS.map((d, i) => (
                  <div key={i} className="flex justify-center">
                    <span className="text-[11px] font-semibold text-[#636366] uppercase">{d}</span>
                  </div>
                ))}
              </div>

              {/* Month grid */}
              <div className="px-4 flex flex-col gap-1">
                {getMonthGrid(calMonth.year, calMonth.month).map((row, ri) => (
                  <div key={ri} className="grid grid-cols-7">
                    {row.map((day, di) => {
                      if (!day) return <div key={di} />
                      const isToday = isSameDay(day, today)
                      const isPast = day < today && !isToday
                      const entry = getEntryForDate(day)
                      const scheduled = isScheduledDay(day) && !isPast && !isToday
                      return (
                        <div key={di} className="flex flex-col items-center py-0.5 gap-0.5">
                          <button
                            onClick={() => entry && setSelectedEntry(entry)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                              isToday
                                ? 'bg-[#FF4500] shadow-[0_4px_12px_rgba(255,69,0,0.35)]'
                                : entry
                                  ? 'bg-[#22C55E]/15 border border-[#22C55E]/40 hover:bg-[#22C55E]/25'
                                  : 'hover:bg-[#252528]'
                            }`}
                          >
                            <span className={`text-sm font-semibold ${
                              isToday ? 'text-white'
                              : entry ? 'text-[#22C55E]'
                              : isPast ? 'text-[#3A3A3C]'
                              : 'text-[#9A9AAA]'
                            }`}>
                              {day.getDate()}
                            </span>
                          </button>
                          <div className={`w-1 h-1 rounded-full ${
                            entry ? 'bg-[#22C55E]' : scheduled ? 'bg-[#FF4500]/50' : 'bg-transparent'
                          }`} />
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
