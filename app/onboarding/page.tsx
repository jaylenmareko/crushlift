'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Dumbbell } from 'lucide-react'
import type { OnboardingData } from '@/lib/types'

const GOALS = [
  { value: 'lose_weight', label: 'Lose Weight', emoji: '🔥' },
  { value: 'build_muscle', label: 'Build Muscle', emoji: '💪' },
  { value: 'get_stronger', label: 'Get Stronger', emoji: '⚡' },
  { value: 'stay_active', label: 'Stay Active', emoji: '🏃' },
]

const EXPERIENCE = [
  { value: 'beginner', label: 'Beginner', desc: "I'm just starting out" },
  { value: 'some', label: 'Some Experience', desc: 'Been at it a few months' },
  { value: 'advanced', label: 'Advanced', desc: "I know what I'm doing" },
]

const DAYS = [2, 3, 4, 5]

const EQUIPMENT = [
  { value: 'full_gym', label: 'Full Gym', emoji: '🏋️' },
  { value: 'dumbbells', label: 'Dumbbells Only', emoji: '🏠' },
  { value: 'no_equipment', label: 'No Equipment', emoji: '🤸' },
]

const TOTAL_STEPS = 5

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<Partial<OnboardingData>>({})
  const [goalCustom, setGoalCustom] = useState('')
  const [equipCustom, setEquipCustom] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [dir, setDir] = useState(1)

  function next() {
    setDir(1)
    setStep(s => s + 1)
  }
  function back() {
    setDir(-1)
    setStep(s => s - 1)
  }

  async function handleSubmit() {
    setLoading(true)
    const payload: OnboardingData = {
      goal: data.goal || goalCustom || '',
      goalCustom: goalCustom || undefined,
      experience: data.experience || '',
      daysPerWeek: data.daysPerWeek || 3,
      equipment: data.equipment || equipCustom || '',
      equipmentCustom: equipCustom || undefined,
      notes: notes || undefined,
    }
    sessionStorage.setItem('crushlift_onboarding', JSON.stringify(payload))
    router.push('/plan/generating')
  }

  const canContinue = [
    data.goal || goalCustom,
    data.experience,
    data.daysPerWeek,
    data.equipment || equipCustom,
    true, // notes step is optional
  ][step]

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  }

  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0A0A0A]">
      {/* Progress bar */}
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-[#FF4500]" />
            <span className="text-sm font-semibold text-[#9CA3AF]">
              {step + 1} of {TOTAL_STEPS}
            </span>
          </div>
          {step > 0 && (
            <button onClick={back} className="text-[#6B7280] hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="h-1.5 bg-[#1F1F1F] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#FF4500] rounded-full"
            animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col px-5 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex-1 flex flex-col"
          >
            {/* Step 0 — Goal */}
            {step === 0 && (
              <div className="flex flex-col flex-1">
                <h2 className="text-2xl font-bold mb-1">What&apos;s your goal?</h2>
                <p className="text-[#6B7280] text-sm mb-6">Pick the one that fits best.</p>
                <div className="flex flex-col gap-3">
                  {GOALS.map(g => (
                    <button
                      key={g.value}
                      onClick={() => setData(d => ({ ...d, goal: g.value }))}
                      className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                        data.goal === g.value
                          ? 'border-[#FF4500] bg-[#FF4500]/10'
                          : 'border-[#1F1F1F] bg-[#141414] hover:border-[#2F2F2F]'
                      }`}
                    >
                      <span className="text-2xl">{g.emoji}</span>
                      <span className="font-semibold text-sm">{g.label}</span>
                    </button>
                  ))}
                  <div className="mt-1">
                    <input
                      type="text"
                      value={goalCustom}
                      onChange={e => {
                        setGoalCustom(e.target.value)
                        setData(d => ({ ...d, goal: undefined }))
                      }}
                      placeholder="Something else? Type it here..."
                      className="w-full bg-[#141414] border border-[#1F1F1F] rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-[#4B5563] focus:outline-none focus:border-[#FF4500] transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1 — Experience */}
            {step === 1 && (
              <div className="flex flex-col flex-1">
                <h2 className="text-2xl font-bold mb-1">Your experience level?</h2>
                <p className="text-[#6B7280] text-sm mb-6">Be honest — this shapes your plan.</p>
                <div className="flex flex-col gap-3">
                  {EXPERIENCE.map(e => (
                    <button
                      key={e.value}
                      onClick={() => setData(d => ({ ...d, experience: e.value }))}
                      className={`flex flex-col p-4 rounded-2xl border text-left transition-all ${
                        data.experience === e.value
                          ? 'border-[#FF4500] bg-[#FF4500]/10'
                          : 'border-[#1F1F1F] bg-[#141414] hover:border-[#2F2F2F]'
                      }`}
                    >
                      <span className="font-semibold text-sm">{e.label}</span>
                      <span className="text-xs text-[#6B7280] mt-0.5">{e.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2 — Days/week */}
            {step === 2 && (
              <div className="flex flex-col flex-1">
                <h2 className="text-2xl font-bold mb-1">Days per week?</h2>
                <p className="text-[#6B7280] text-sm mb-6">How many days can you commit?</p>
                <div className="grid grid-cols-2 gap-3">
                  {DAYS.map(d => (
                    <button
                      key={d}
                      onClick={() => setData(prev => ({ ...prev, daysPerWeek: d }))}
                      className={`flex flex-col items-center justify-center py-6 rounded-2xl border text-center transition-all ${
                        data.daysPerWeek === d
                          ? 'border-[#FF4500] bg-[#FF4500]/10'
                          : 'border-[#1F1F1F] bg-[#141414] hover:border-[#2F2F2F]'
                      }`}
                    >
                      <span className="text-3xl font-extrabold">{d}</span>
                      <span className="text-xs text-[#6B7280] mt-1">days / week</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 — Equipment */}
            {step === 3 && (
              <div className="flex flex-col flex-1">
                <h2 className="text-2xl font-bold mb-1">What equipment do you have?</h2>
                <p className="text-[#6B7280] text-sm mb-6">We&apos;ll build around what you have.</p>
                <div className="flex flex-col gap-3">
                  {EQUIPMENT.map(eq => (
                    <button
                      key={eq.value}
                      onClick={() => {
                        setData(d => ({ ...d, equipment: eq.value }))
                        setEquipCustom('')
                      }}
                      className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                        data.equipment === eq.value
                          ? 'border-[#FF4500] bg-[#FF4500]/10'
                          : 'border-[#1F1F1F] bg-[#141414] hover:border-[#2F2F2F]'
                      }`}
                    >
                      <span className="text-2xl">{eq.emoji}</span>
                      <span className="font-semibold text-sm">{eq.label}</span>
                    </button>
                  ))}
                  <div className="mt-1">
                    <input
                      type="text"
                      value={equipCustom}
                      onChange={e => {
                        setEquipCustom(e.target.value)
                        setData(d => ({ ...d, equipment: undefined }))
                      }}
                      placeholder="I have specific equipment..."
                      className="w-full bg-[#141414] border border-[#1F1F1F] rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-[#4B5563] focus:outline-none focus:border-[#FF4500] transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 — Notes */}
            {step === 4 && (
              <div className="flex flex-col flex-1">
                <h2 className="text-2xl font-bold mb-1">Anything else?</h2>
                <p className="text-[#6B7280] text-sm mb-6">
                  Injuries, things you hate, specific goals? Tell the AI — it listens.
                </p>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder='e.g. "Bad knees, no running. I want bigger arms. Hate burpees."'
                  rows={6}
                  className="w-full bg-[#141414] border border-[#1F1F1F] rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-[#4B5563] focus:outline-none focus:border-[#FF4500] transition-colors resize-none"
                />
                <p className="text-xs text-[#4B5563] mt-2">Optional — skip if nothing special.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="px-5 pb-10 pt-4">
        <motion.button
          onClick={step < TOTAL_STEPS - 1 ? next : handleSubmit}
          disabled={!canContinue || loading}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-[#FF4500] text-white font-bold text-base py-[18px] rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40 shadow-[0_8px_32px_rgba(255,69,0,0.25)] transition-opacity"
        >
          {loading ? 'Building your plan...' : step < TOTAL_STEPS - 1 ? 'Continue' : 'Build My Plan'}
          {!loading && <ChevronRight className="w-5 h-5" />}
        </motion.button>
      </div>
    </div>
  )
}
