'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, MoreHorizontal, X, ChevronRight, Search, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Plan, PlanDay, PlanExercise } from '@/lib/types'
import BottomNav from '@/components/BottomNav'
import PaywallModal from '@/components/PaywallModal'

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
  const [showPaywall, setShowPaywall] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  const loadPlan = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Check subscription
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single()
    const isSubscribed = profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing'
    setSubscribed(isSubscribed)

    // Load most recent plan
    const { data: plans } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (plans?.length) {
      setPlan(plans[0])
    }
    setLoading(false)
  }, [router])

  useEffect(() => { loadPlan() }, [loadPlan])

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
        equipment: plan?.onboardingData?.equipment,
        goal: plan?.onboardingData?.goal,
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
        equipment: plan?.onboardingData?.equipment,
        goal: plan?.onboardingData?.goal,
        customRequest,
      }),
    })
    const data = await res.json()
    setAlternatives(data.alternatives || [])
    setAltLoading(false)
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
    // Persist to Supabase
    const supabase = createClient()
    supabase.from('plans').update({ days: updated.days }).eq('id', plan.id)
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
    const supabase = createClient()
    supabase.from('plans').update({ days: updated.days }).eq('id', plan.id)
  }

  function startWorkout() {
    if (!subscribed) { setShowPaywall(true); return }
    if (!plan) return
    router.push(`/workout?planId=${plan.id}&day=${activeDay}`)
  }

  if (loading) {
    return (
      <div className="mobile-container flex items-center justify-center min-h-dvh bg-[#0A0A0A]">
        <Loader2 className="w-8 h-8 text-[#FF4500] animate-spin" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="mobile-container flex flex-col items-center justify-center min-h-dvh bg-[#0A0A0A] px-5 text-center">
        <p className="text-[#6B7280] mb-6">No plan yet. Let&apos;s build yours.</p>
        <button
          onClick={() => router.push('/onboarding')}
          className="bg-[#FF4500] text-white font-bold px-6 py-4 rounded-2xl"
        >
          Build My Plan
        </button>
      </div>
    )
  }

  const currentDay: PlanDay = plan.days[activeDay]

  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0A0A0A] has-bottom-nav">
      {/* Header */}
      <header className="px-5 pt-12 pb-4">
        <h1 className="text-2xl font-bold">My Plan</h1>
        <p className="text-[#6B7280] text-sm mt-1">{plan.days.length} days / week</p>
      </header>

      {/* Day tabs */}
      <div className="flex gap-2 px-5 mb-5 overflow-x-auto no-scrollbar">
        {plan.days.map((day: PlanDay, i: number) => (
          <button
            key={i}
            onClick={() => setActiveDay(i)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeDay === i
                ? 'bg-[#FF4500] text-white'
                : 'bg-[#141414] text-[#6B7280] border border-[#1F1F1F]'
            }`}
          >
            Day {day.dayNumber}
          </button>
        ))}
      </div>

      {/* Day name */}
      <div className="px-5 mb-4">
        <h2 className="text-lg font-bold">{currentDay.dayName}</h2>
        <p className="text-xs text-[#6B7280]">{currentDay.exercises.length} exercises</p>
      </div>

      {/* Exercises */}
      <div className="flex-1 px-5 flex flex-col gap-3">
        <AnimatePresence>
          {currentDay.exercises.map((ex: PlanExercise) => (
            <motion.div
              key={ex.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                {/* Play button */}
                <button
                  onClick={() => handlePlayVideo(ex)}
                  className="w-10 h-10 rounded-xl bg-[#1F1F1F] flex items-center justify-center flex-shrink-0 hover:bg-[#FF4500]/20 transition-colors"
                >
                  <Play className="w-4 h-4 text-[#FF4500] ml-0.5" />
                </button>

                {/* Exercise info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white">{ex.name}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {ex.sets} sets × {ex.reps} reps
                  </p>
                  {ex.notes && (
                    <p className="text-xs text-[#4B5563] mt-1 italic">{ex.notes}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => openReplace(ex)}
                    className="text-xs text-[#FF4500] font-medium px-3 py-1.5 rounded-lg border border-[#FF4500]/30 hover:bg-[#FF4500]/10 transition-colors"
                  >
                    Replace
                  </button>
                  <button
                    onClick={() => deleteExercise(ex.id)}
                    className="text-xs text-[#6B7280] px-2 py-1.5 rounded-lg border border-[#1F1F1F] hover:border-red-500/50 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Start Workout CTA */}
      <div className="px-5 pt-6 pb-6">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={startWorkout}
          className="w-full bg-[#FF4500] text-white font-bold text-base py-[18px] rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
        >
          Start Day {activeDay + 1}
          <ChevronRight className="w-5 h-5" />
        </motion.button>
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
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#141414] border-t border-[#1F1F1F] rounded-t-3xl z-50 pb-10"
            >
              <div className="px-5 pt-5 pb-4 border-b border-[#1F1F1F]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#6B7280] uppercase tracking-wider font-medium">Replace</p>
                    <p className="font-bold mt-0.5">{replaceTarget.name}</p>
                  </div>
                  <button onClick={() => setReplaceTarget(null)} className="text-[#6B7280]">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Custom search */}
                <div className="flex gap-2 mt-4">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-[#4B5563] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customRequest}
                      onChange={e => setCustomRequest(e.target.value)}
                      placeholder="Something specific..."
                      className="w-full bg-[#1F1F1F] border border-[#2F2F2F] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-[#4B5563] focus:outline-none focus:border-[#FF4500]"
                    />
                  </div>
                  <button
                    onClick={fetchCustomAlternatives}
                    disabled={!customRequest.trim() || altLoading}
                    className="px-4 py-2.5 bg-[#FF4500] text-white rounded-xl text-sm font-semibold disabled:opacity-40"
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="px-5 pt-4 max-h-[50vh] overflow-y-auto">
                {altLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-[#FF4500] animate-spin" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {alternatives.map(alt => (
                      <button
                        key={alt.id}
                        onClick={() => applyReplacement(alt)}
                        className="flex items-center gap-3 p-4 bg-[#1A1A1A] border border-[#1F1F1F] rounded-2xl text-left hover:border-[#FF4500]/40 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{alt.name}</p>
                          <p className="text-xs text-[#6B7280] mt-0.5">
                            {alt.sets} × {alt.reps}
                          </p>
                          {alt.notes && (
                            <p className="text-xs text-[#4B5563] mt-1 italic">{alt.notes}</p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#FF4500] flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
              onClick={() => { setVideoExercise(null); setVideoId(null) }}
              className="fixed inset-0 bg-black/90 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-[398px] mx-auto z-50 bg-[#141414] rounded-3xl overflow-hidden border border-[#1F1F1F]"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-[#1F1F1F]">
                <p className="font-bold text-sm">{videoExercise.name}</p>
                <button onClick={() => { setVideoExercise(null); setVideoId(null) }} className="text-[#6B7280]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="aspect-video bg-[#0A0A0A] flex items-center justify-center">
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
                  <p className="text-[#6B7280] text-sm">No video found</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Paywall */}
      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  )
}
