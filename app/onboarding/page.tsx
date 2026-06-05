'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check, Eye, EyeOff } from 'lucide-react'
import type { OnboardingData } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

const GOALS = [
  { value: 'lose_weight', label: 'Lose Weight', emoji: '🔥', desc: 'Burn fat, get lean' },
  { value: 'build_muscle', label: 'Build Muscle', emoji: '💪', desc: 'Add size and mass' },
  { value: 'get_stronger', label: 'Get Stronger', emoji: '⚡', desc: 'Increase strength' },
  { value: 'stay_active', label: 'Stay Active', emoji: '🏃', desc: 'Move and feel good' },
]

const EXPERIENCE = [
  { value: 'beginner', label: 'Beginner', desc: "I'm just starting out" },
  { value: 'some', label: 'Some Experience', desc: 'Been at it a few months' },
  { value: 'advanced', label: 'Advanced', desc: "I know what I'm doing" },
]

const DAYS = [
  { value: 2, label: '2', sub: 'days / week' },
  { value: 3, label: '3', sub: 'days / week' },
  { value: 4, label: '4', sub: 'days / week' },
  { value: 5, label: '5', sub: 'days / week' },
  { value: 6, label: '6', sub: 'days / week' },
  { value: 7, label: '7', sub: 'days / week' },
]

const SESSION_LENGTHS = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min+' },
]

const TRAINING_DAYS = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
]

const SPLITS = [
  { value: 'ppl', label: 'Push / Pull / Legs', desc: 'Chest+shoulders+tris / Back+bis / Legs' },
  { value: 'upper_lower', label: 'Upper / Lower', desc: 'Upper body and lower body alternating' },
  { value: 'full_body', label: 'Full Body', desc: 'Hit everything each session' },
  { value: 'body_part', label: 'Body Part Split', desc: 'One muscle group per day' },
  { value: 'athletic', label: 'Strength / Power', desc: 'Heavy compound lifts, strength-focused' },
  { value: 'not_sure', label: 'Not sure', desc: 'AI picks the best split for your goal' },
]

const EQUIPMENT = [
  { value: 'full_gym', label: 'Full Gym', emoji: '🏋️', desc: 'Barbells, cables, machines' },
  { value: 'dumbbells', label: 'Dumbbells Only', emoji: '🏠', desc: 'Home setup, limited gear' },
  { value: 'no_equipment', label: 'No Equipment', emoji: '🤸', desc: 'Bodyweight only' },
]

const STEPS = [
  { label: 'Goal' },
  { label: 'Experience' },
  { label: 'Schedule' },
  { label: 'Equipment' },
  { label: 'Body' },
  { label: 'Injuries' },
  { label: 'Notes' },
  { label: 'Account' },
]

const TOTAL_STEPS = STEPS.length

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<Partial<OnboardingData>>({})
  const [goalCustom, setGoalCustom] = useState('')
  const [currentWeightGoal, setCurrentWeightGoal] = useState('')
  const [targetWeight, setTargetWeight] = useState('')
  const [liftGoals, setLiftGoals] = useState([{ lift: '', current: '', target: '' }])
  const [trainingDays, setTrainingDays] = useState<string[]>([])
  const [equipCustom, setEquipCustom] = useState('')
  const [sex, setSex] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [injuryNotes, setInjuryNotes] = useState('')
  const [doesCardio, setDoesCardio] = useState<boolean | null>(null)
  const [cardioDetails, setCardioDetails] = useState('')
  const [notes, setNotes] = useState('')
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [loading, setLoading] = useState(false)
  const [dir, setDir] = useState(1)

  function next() { setDir(1); setStep(s => s + 1) }
  function back() { setDir(-1); setStep(s => s - 1) }

  function addLift() {
    const last = liftGoals[liftGoals.length - 1]
    if (!last.lift.trim()) return
    setLiftGoals(prev => [...prev, { lift: '', current: '', target: '' }])
  }
  function removeLift(i: number) {
    setLiftGoals(prev => prev.filter((_, idx) => idx !== i))
  }
  function updateLift(i: number, field: 'lift' | 'current' | 'target', val: string) {
    setLiftGoals(prev => prev.map((g, idx) => idx === i ? { ...g, [field]: val } : g))
  }

  function canContinue(): boolean {
    switch (step) {
      case 0: {
        const hasGoal = !!(data.goal || goalCustom)
        if (!hasGoal) return false
        if (data.goal === 'lose_weight' || data.goal === 'build_muscle')
          return !!currentWeightGoal && !!targetWeight
        if (data.goal === 'get_stronger')
          return !!liftGoals[0].lift.trim()
        return true
      }
      case 1: return !!data.experience
      case 2: return !!data.daysPerWeek && !!data.sessionLength && !!data.splitType
      case 3: return !!(data.equipment || equipCustom)
      case 7: return !!firstName.trim() && /\S+@\S+\.\S+/.test(email) && password.length >= 8
      default: return true
    }
  }

  async function handleSubmit() {
    setSignupError('')
    setLoading(true)

    // Create account
    const supabase = createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { first_name: firstName.trim() } },
    })
    if (authError) {
      setSignupError(authError.message)
      setLoading(false)
      return
    }
    // Store first_name in profiles
    if (authData.user) {
      await supabase.from('profiles').upsert({ id: authData.user.id, email: email.trim() })
    }

    const payload: OnboardingData = {
      goal: data.goal || goalCustom || '',
      goalCustom: goalCustom || undefined,
      goalTarget: (currentWeightGoal || targetWeight)
        ? `current: ${currentWeightGoal} lbs, target: ${targetWeight} lbs`
        : undefined,
      liftGoals: data.goal === 'get_stronger'
        ? liftGoals.filter(g => g.lift || g.current)
        : undefined,
      experience: data.experience || '',
      daysPerWeek: data.daysPerWeek || 3,
      sessionLength: data.sessionLength || undefined,
      splitType: data.splitType || undefined,
      trainingDays: trainingDays.length ? trainingDays : undefined,
      equipment: data.equipment || equipCustom || '',
      equipmentCustom: equipCustom || undefined,
      sex: sex || undefined,
      weight: weight ? parseFloat(weight) : (currentWeightGoal ? parseFloat(currentWeightGoal) : undefined),
      height: height || undefined,
      age: age ? parseInt(age) : undefined,
      injuryNotes: injuryNotes || undefined,
      cardio: doesCardio === false ? 'none' : cardioDetails || undefined,
      notes: notes || undefined,
    }
    sessionStorage.setItem('crushlift_onboarding', JSON.stringify(payload))
    router.push('/plan/generating')
  }

  function handleGuestContinue() {
    const payload: OnboardingData = {
      goal: data.goal || goalCustom || '',
      goalCustom: goalCustom || undefined,
      goalTarget: (currentWeightGoal || targetWeight)
        ? `current: ${currentWeightGoal} lbs, target: ${targetWeight} lbs`
        : undefined,
      liftGoals: data.goal === 'get_stronger'
        ? liftGoals.filter(g => g.lift || g.current)
        : undefined,
      experience: data.experience || '',
      daysPerWeek: data.daysPerWeek || 3,
      sessionLength: data.sessionLength || undefined,
      splitType: data.splitType || undefined,
      trainingDays: trainingDays.length ? trainingDays : undefined,
      equipment: data.equipment || equipCustom || '',
      equipmentCustom: equipCustom || undefined,
      sex: sex || undefined,
      weight: weight ? parseFloat(weight) : (currentWeightGoal ? parseFloat(currentWeightGoal) : undefined),
      height: height || undefined,
      age: age ? parseInt(age) : undefined,
      injuryNotes: injuryNotes || undefined,
      cardio: doesCardio === false ? 'none' : cardioDetails || undefined,
      notes: notes || undefined,
    }
    sessionStorage.setItem('crushlift_onboarding', JSON.stringify(payload))
    router.push('/plan/generating')
  }

  const ok = canContinue()

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 64 : -64, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -64 : 64, opacity: 0 }),
  }

  const weightAlreadyEntered = !!(currentWeightGoal && (data.goal === 'lose_weight' || data.goal === 'build_muscle'))

  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0D0D0F]">

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-12 pb-5">
        {step > 0 ? (
          <button
            onClick={back}
            className="w-9 h-9 rounded-xl bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA] hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-9" />
        )}

        <span className="text-xs font-semibold text-[#636366]">{step + 1} / {TOTAL_STEPS}</span>

        <div className="w-9" />
      </div>

      {/* Progress bar */}
      <div className="px-5 mb-6">
        <div className="h-0.5 bg-[#252528] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#FF4500] rounded-full"
            animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col px-5 overflow-y-auto">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex-1 flex flex-col"
          >

            {/* Step 0 — Goal */}
            {step === 0 && (
              <div className="flex flex-col flex-1">
                <h2 className="text-[2rem] font-black tracking-tight mb-7 leading-tight">
                  What&apos;s your<br />main goal?
                </h2>
                <div className="flex flex-col gap-2.5">
                  {GOALS.map(g => {
                    const selected = data.goal === g.value
                    return (
                      <button
                        key={g.value}
                        onClick={() => {
                          setData(d => ({ ...d, goal: g.value }))
                          setGoalCustom('')
                          setCurrentWeightGoal('')
                          setTargetWeight('')
                          setLiftGoals([{ lift: '', current: '', target: '' }])
                        }}
                        className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border text-left transition-all ${
                          selected
                            ? 'border-[#FF4500] bg-[#FF4500]/10'
                            : 'border-[#252528] bg-[#1C1C1E] hover:border-[#3A3A3C]'
                        }`}
                      >
                        <span className="text-2xl leading-none">{g.emoji}</span>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-white">{g.label}</p>
                          <p className="text-xs text-[#9A9AAA] mt-0.5">{g.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          selected ? 'border-[#FF4500] bg-[#FF4500]' : 'border-[#3A3A3C]'
                        }`}>
                          {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                      </button>
                    )
                  })}
                  <input
                    type="text"
                    value={goalCustom}
                    onChange={e => {
                      setGoalCustom(e.target.value)
                      setData(d => ({ ...d, goal: undefined }))
                      setCurrentWeightGoal('')
                      setTargetWeight('')
                      setLiftGoals([{ lift: '', current: '', target: '' }])
                    }}
                    placeholder="Something else? Type it here..."
                    className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors mt-1"
                  />
                </div>

                <AnimatePresence>
                  {(data.goal === 'lose_weight' || data.goal === 'build_muscle') && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18 }}
                      className="mt-5 flex gap-2.5"
                    >
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider block mb-2">Current (lbs)</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={currentWeightGoal}
                          onChange={e => setCurrentWeightGoal(e.target.value)}
                          placeholder="e.g. 195"
                          className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider block mb-2">Target (lbs)</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={targetWeight}
                          onChange={e => setTargetWeight(e.target.value)}
                          placeholder={data.goal === 'lose_weight' ? 'e.g. 165' : 'e.g. 220'}
                          className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors"
                        />
                      </div>
                    </motion.div>
                  )}

                  {data.goal === 'get_stronger' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18 }}
                      className="mt-5"
                    >
                      <label className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider block mb-3">Lift goals</label>
                      <div className="flex flex-col gap-2.5">
                        {liftGoals.map((g, i) => (
                          <div key={i} className="bg-[#1C1C1E] border border-[#252528] rounded-2xl p-3 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={g.lift}
                                onChange={e => updateLift(i, 'lift', e.target.value)}
                                placeholder="Lift (e.g. Bench Press)"
                                className="flex-1 bg-[#252528] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:ring-1 focus:ring-[#FF4500] transition-all"
                              />
                              {liftGoals.length > 1 && (
                                <button
                                  onClick={() => removeLift(i)}
                                  className="w-7 h-7 rounded-lg bg-[#252528] flex items-center justify-center text-[#636366] hover:text-red-400 transition-colors flex-shrink-0"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={g.current}
                              onChange={e => updateLift(i, 'current', e.target.value)}
                              placeholder="Current (e.g. 185 lbs)"
                              className="w-full bg-[#252528] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:ring-1 focus:ring-[#FF4500] transition-all"
                            />
                            <input
                              type="text"
                              value={g.target}
                              onChange={e => updateLift(i, 'target', e.target.value)}
                              placeholder="Goal (e.g. 225 lbs)"
                              className="w-full bg-[#252528] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:ring-1 focus:ring-[#FF4500] transition-all"
                            />
                          </div>
                        ))}
                        <button
                          onClick={addLift}
                          disabled={!liftGoals[liftGoals.length - 1].lift.trim()}
                          className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[#3A3A3C] text-sm font-semibold text-[#9A9AAA] hover:border-[#FF4500] hover:text-[#FF4500] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[#3A3A3C] disabled:hover:text-[#9A9AAA]"
                        >
                          <span className="text-base leading-none">+</span> Add lift
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Step 1 — Experience */}
            {step === 1 && (
              <div className="flex flex-col flex-1">
                <h2 className="text-[2rem] font-black tracking-tight mb-1 leading-tight">
                  Your experience<br />level?
                </h2>
                <p className="text-[#9A9AAA] text-sm mb-7">Be honest — this shapes your plan.</p>
                <div className="flex flex-col gap-2.5">
                  {EXPERIENCE.map(e => {
                    const selected = data.experience === e.value
                    return (
                      <button
                        key={e.value}
                        onClick={() => setData(d => ({ ...d, experience: e.value }))}
                        className={`flex items-center gap-4 px-4 py-4 rounded-2xl border text-left transition-all ${
                          selected
                            ? 'border-[#FF4500] bg-[#FF4500]/10'
                            : 'border-[#252528] bg-[#1C1C1E] hover:border-[#3A3A3C]'
                        }`}
                      >
                        <div className="flex-1">
                          <p className="font-bold text-sm text-white">{e.label}</p>
                          <p className="text-xs text-[#9A9AAA] mt-0.5">{e.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          selected ? 'border-[#FF4500] bg-[#FF4500]' : 'border-[#3A3A3C]'
                        }`}>
                          {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 2 — Schedule */}
            {step === 2 && (
              <div className="flex flex-col flex-1">
                <h2 className="text-[2rem] font-black tracking-tight mb-7 leading-tight">
                  How many days<br />per week?
                </h2>
                <div className="grid grid-cols-2 gap-2.5 mb-8">
                  {DAYS.map(d => {
                    const selected = data.daysPerWeek === d.value
                    return (
                      <button
                        key={d.value}
                        onClick={() => setData(prev => ({ ...prev, daysPerWeek: d.value }))}
                        className={`relative flex flex-col items-center justify-center py-7 rounded-2xl border text-center transition-all ${
                          selected
                            ? 'border-[#FF4500] bg-[#FF4500]/10'
                            : 'border-[#252528] bg-[#1C1C1E] hover:border-[#3A3A3C]'
                        }`}
                      >
                        {selected && (
                          <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-[#FF4500] flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                          </div>
                        )}
                        <span className={`text-4xl font-black ${selected ? 'text-[#FF4500]' : 'text-white'}`}>{d.label}</span>
                        <span className="text-xs text-[#9A9AAA] mt-1.5">{d.sub}</span>
                      </button>
                    )
                  })}
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider mb-3">How long per session?</p>
                  <div className="flex gap-2.5">
                    {SESSION_LENGTHS.map(s => {
                      const selected = data.sessionLength === s.value
                      return (
                        <button
                          key={s.value}
                          onClick={() => setData(d => ({ ...d, sessionLength: s.value }))}
                          className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                            selected
                              ? 'border-[#FF4500] bg-[#FF4500]/10 text-[#FF4500]'
                              : 'border-[#252528] bg-[#1C1C1E] text-[#9A9AAA] hover:border-[#3A3A3C] hover:text-white'
                          }`}
                        >
                          {s.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider mb-3">How do you want to split your workouts?</p>
                  <div className="flex flex-col gap-2">
                    {SPLITS.map(s => {
                      const selected = data.splitType === s.value
                      return (
                        <button
                          key={s.value}
                          onClick={() => setData(d => ({ ...d, splitType: s.value }))}
                          className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${
                            selected
                              ? 'border-[#FF4500] bg-[#FF4500]/10'
                              : 'border-[#252528] bg-[#1C1C1E] hover:border-[#3A3A3C]'
                          }`}
                        >
                          <div className="flex-1">
                            <p className={`text-sm font-bold ${selected ? 'text-[#FF4500]' : 'text-white'}`}>{s.label}</p>
                            <p className="text-xs text-[#636366] mt-0.5">{s.desc}</p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                            selected ? 'border-[#FF4500] bg-[#FF4500]' : 'border-[#3A3A3C]'
                          }`} />
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider">Which days?</p>
                      <p className="text-[10px] text-[#636366] mt-0.5">Used to auto-select today's workout</p>
                    </div>
                    {trainingDays.length > 0 && (
                      <button onClick={() => setTrainingDays([])} className="text-xs text-[#636366] hover:text-[#9A9AAA]">Clear</button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {TRAINING_DAYS.map(d => {
                      const selected = trainingDays.includes(d.value)
                      return (
                        <button
                          key={d.value}
                          onClick={() => setTrainingDays(prev =>
                            prev.includes(d.value) ? prev.filter(x => x !== d.value) : [...prev, d.value]
                          )}
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                            selected
                              ? 'border-[#FF4500] bg-[#FF4500]/10 text-[#FF4500]'
                              : 'border-[#252528] bg-[#1C1C1E] text-[#9A9AAA] hover:border-[#3A3A3C] hover:text-white'
                          }`}
                        >
                          {d.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — Equipment */}
            {step === 3 && (
              <div className="flex flex-col flex-1">
                <h2 className="text-[2rem] font-black tracking-tight mb-7 leading-tight">
                  What equipment<br />do you have?
                </h2>
                <div className="flex flex-col gap-2.5">
                  {EQUIPMENT.map(eq => {
                    const selected = data.equipment === eq.value
                    return (
                      <button
                        key={eq.value}
                        onClick={() => { setData(d => ({ ...d, equipment: eq.value })); setEquipCustom('') }}
                        className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border text-left transition-all ${
                          selected
                            ? 'border-[#FF4500] bg-[#FF4500]/10'
                            : 'border-[#252528] bg-[#1C1C1E] hover:border-[#3A3A3C]'
                        }`}
                      >
                        <span className="text-2xl leading-none">{eq.emoji}</span>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-white">{eq.label}</p>
                          <p className="text-xs text-[#9A9AAA] mt-0.5">{eq.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          selected ? 'border-[#FF4500] bg-[#FF4500]' : 'border-[#3A3A3C]'
                        }`}>
                          {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                      </button>
                    )
                  })}
                  <input
                    type="text"
                    value={equipCustom}
                    onChange={e => { setEquipCustom(e.target.value); setData(d => ({ ...d, equipment: undefined })) }}
                    placeholder="I have specific equipment..."
                    className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors mt-1"
                  />
                </div>
              </div>
            )}

            {/* Step 4 — Body */}
            {step === 4 && (
              <div className="flex flex-col flex-1">
                <h2 className="text-[2rem] font-black tracking-tight mb-7 leading-tight">
                  About you
                </h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider mb-2">Biological sex</p>
                    <div className="flex gap-2.5">
                      {['Male', 'Female', 'Prefer not to say'].map(s => (
                        <button
                          key={s}
                          onClick={() => setSex(s)}
                          className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                            sex === s
                              ? 'border-[#FF4500] bg-[#FF4500]/10 text-[#FF4500]'
                              : 'border-[#252528] bg-[#1C1C1E] text-[#9A9AAA] hover:border-[#3A3A3C] hover:text-white'
                          }`}
                        >
                          {s === 'Prefer not to say' ? 'Skip' : s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {weightAlreadyEntered ? (
                    <div className="bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-3.5 flex items-center justify-between">
                      <span className="text-xs text-[#9A9AAA] uppercase font-semibold tracking-wider">Current weight</span>
                      <span className="text-sm font-bold text-white">{currentWeightGoal} lbs</span>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider block mb-2">Current weight (lbs)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={weight}
                        onChange={e => setWeight(e.target.value)}
                        placeholder="e.g. 185"
                        className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors"
                      />
                    </div>
                  )}

                  <div className="flex gap-2.5">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider block mb-2">Height</label>
                      <input
                        type="text"
                        value={height}
                        onChange={e => setHeight(e.target.value)}
                        placeholder={`5'11"`}
                        className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider block mb-2">Age</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={age}
                        onChange={e => setAge(e.target.value)}
                        placeholder="24"
                        className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5 — Injuries */}
            {step === 5 && (
              <div className="flex flex-col flex-1">
                <h2 className="text-[2rem] font-black tracking-tight mb-7 leading-tight">
                  Any injuries or<br />limitations?
                </h2>
                <textarea
                  value={injuryNotes}
                  onChange={e => setInjuryNotes(e.target.value)}
                  placeholder={'e.g. "Bad knees, avoid squats. Lower back issues. No running."'}
                  rows={5}
                  className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors resize-none leading-relaxed"
                />
                <p className="text-xs text-[#636366] mt-2">Optional — skip if none.</p>
              </div>
            )}

            {/* Step 6 — Notes */}
            {step === 6 && (
              <div className="flex flex-col flex-1">
                <h2 className="text-[2rem] font-black tracking-tight mb-7 leading-tight">
                  Anything else?
                </h2>

                {/* Cardio question */}
                <div className="mb-6">
                  <p className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider mb-1">Do you do any cardio?</p>
                  <p className="text-xs text-[#636366] mb-3">Your lifting plan gets built around your full activity — runs, sports, anything.</p>
                  <div className="flex gap-2.5 mb-3">
                    {[{ v: true, l: 'Yes' }, { v: false, l: 'No' }].map(({ v, l }) => (
                      <button
                        key={l}
                        onClick={() => setDoesCardio(v)}
                        className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                          doesCardio === v
                            ? 'border-[#FF4500] bg-[#FF4500]/10 text-[#FF4500]'
                            : 'border-[#252528] bg-[#1C1C1E] text-[#9A9AAA] hover:border-[#3A3A3C] hover:text-white'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <AnimatePresence>
                    {doesCardio === true && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.18 }}
                      >
                        <input
                          type="text"
                          value={cardioDetails}
                          onChange={e => setCardioDetails(e.target.value)}
                          placeholder='e.g. "Run 3 miles 4x/week, basketball on weekends"'
                          className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="h-px bg-[#252528] mb-6" />

                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={'e.g. "No burpees. I want bigger arms. Keep it simple."'}
                  rows={5}
                  className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors resize-none leading-relaxed"
                />
                <p className="text-xs text-[#636366] mt-2">Optional — skip if nothing special.</p>
              </div>
            )}

            {/* Step 7 — Account */}
            {step === 7 && (
              <div className="flex flex-col flex-1">
                <h2 className="text-[2rem] font-black tracking-tight mb-1 leading-tight">
                  Create your<br />account
                </h2>
                <p className="text-[#9A9AAA] text-sm mb-7">Save your plan and track your progress.</p>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider block mb-2">First name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="e.g. Jaylen"
                      autoComplete="given-name"
                      className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider block mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setSignupError('') }}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-wider block mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setSignupError('') }}
                        placeholder="Min. 8 characters"
                        autoComplete="new-password"
                        className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 pr-12 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#636366] hover:text-[#9A9AAA] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {signupError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3"
                    >
                      {signupError}
                    </motion.p>
                  )}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="px-5 pb-10 pt-4 flex flex-col gap-3">
        <motion.button
          onClick={step < TOTAL_STEPS - 1 ? next : handleSubmit}
          disabled={!ok || loading}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-[#FF4500] text-white font-bold text-base py-[18px] rounded-2xl flex items-center justify-center gap-2 disabled:opacity-30 shadow-[0_8px_32px_rgba(255,69,0,0.25)] transition-opacity"
        >
          {loading
            ? (step === TOTAL_STEPS - 1 ? 'Creating account...' : 'Building your plan...')
            : step < TOTAL_STEPS - 1
              ? 'Continue'
              : 'Create Account & Build My Plan'}
          {!loading && <ChevronRight className="w-5 h-5" />}
        </motion.button>
        {step === TOTAL_STEPS - 1 && (
          <button
            onClick={handleGuestContinue}
            className="text-center text-sm text-[#636366] hover:text-[#9A9AAA] transition-colors py-1"
          >
            Skip for now, build as guest →
          </button>
        )}
      </div>
    </div>
  )
}
