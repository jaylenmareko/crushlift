'use client'

import { useState, useRef, useEffect } from 'react'
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
  { value: 'beginner',     label: 'Beginner',         emoji: '🌱' },
  { value: 'some',         label: 'Some Experience',  emoji: '📈' },
  { value: 'intermediate', label: 'Intermediate',     emoji: '💪' },
  { value: 'advanced',     label: 'Advanced',         emoji: '🔥' },
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
  { value: 'ppl',         label: 'Push / Pull / Legs', emoji: '🔄' },
  { value: 'upper_lower', label: 'Upper / Lower',      emoji: '⬆️' },
  { value: 'full_body',   label: 'Full Body',          emoji: '💥' },
  { value: 'body_part',   label: 'Body Part Split',    emoji: '🎯' },
  { value: 'athletic',    label: 'Strength / Power',   emoji: '⚡' },
  { value: 'not_sure',    label: 'Not sure',           emoji: '🤷' },
]

const EQUIPMENT = [
  { value: 'full_gym', label: 'Full Gym', emoji: '🏋️', desc: 'Barbells, cables, machines — everything' },
  { value: 'barbell_home', label: 'Barbell + Dumbbells', emoji: '🏠', desc: 'Home setup with free weights' },
  { value: 'dumbbells', label: 'Dumbbells Only', emoji: '💪', desc: 'Adjustable or fixed dumbbells' },
  { value: 'bands', label: 'Resistance Bands', emoji: '🪢', desc: 'Portable and travel-friendly' },
  { value: 'no_equipment', label: 'Bodyweight Only', emoji: '🤸', desc: 'No equipment, anywhere' },
]

const MUSCLE_GROUPS = [
  { value: 'Chest', emoji: '🫁' },
  { value: 'Back', emoji: '🏋️' },
  { value: 'Shoulders', emoji: '🙆' },
  { value: 'Arms', emoji: '💪' },
  { value: 'Legs', emoji: '🦵' },
  { value: 'Core', emoji: '🎯' },
  { value: 'Glutes', emoji: '🍑' },
  { value: 'Calves', emoji: '🦿' },
]

const STEPS = [
  { label: 'Goal' },
  { label: 'Experience' },
  { label: 'Schedule' },
  { label: 'Equipment' },
  { label: 'Muscles' },
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
  const [splitTypes, setSplitTypes] = useState<string[]>([])
  const [trainingDays, setTrainingDays] = useState<string[]>([])
  const [equipCustom, setEquipCustom] = useState('')
  const [equipmentSelections, setEquipmentSelections] = useState<string[]>([])
  const [musclePriority, setMusclePriority] = useState<string[]>([])
  const [sex, setSex] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [injuryNotes, setInjuryNotes] = useState('')
  const [notes, setNotes] = useState('')
  const injuryRef = useRef<HTMLTextAreaElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const goalCustomRef = useRef<HTMLTextAreaElement>(null)
  const equipCustomRef = useRef<HTMLTextAreaElement>(null)
  const [firstName, setFirstName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [loading, setLoading] = useState(false)
  const [dir, setDir] = useState(1)

  useEffect(() => {
    if (!injuryRef.current) return
    injuryRef.current.style.height = '0px'
    injuryRef.current.style.height = injuryRef.current.scrollHeight + 'px'
  }, [injuryNotes])

  useEffect(() => {
    if (!notesRef.current) return
    notesRef.current.style.height = '0px'
    notesRef.current.style.height = notesRef.current.scrollHeight + 'px'
  }, [notes])

  useEffect(() => {
    if (!goalCustomRef.current) return
    goalCustomRef.current.style.height = '0px'
    goalCustomRef.current.style.height = goalCustomRef.current.scrollHeight + 'px'
  }, [goalCustom])

  useEffect(() => {
    if (!equipCustomRef.current) return
    equipCustomRef.current.style.height = '0px'
    equipCustomRef.current.style.height = equipCustomRef.current.scrollHeight + 'px'
  }, [equipCustom])

  function next() { setDir(1); setStep(s => s + 1) }
  function back() { setDir(-1); setStep(s => s - 1) }

  function toggleEquipment(v: string) {
    setEquipmentSelections(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
    )
    setEquipCustom('')
  }

  function toggleMuscle(m: string) {
    setMusclePriority(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    )
  }

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

  function buildPayload(): OnboardingData {
    return {
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
      splitType: splitTypes.length ? splitTypes : undefined,
      trainingDays: trainingDays.length ? trainingDays : undefined,
      equipment: equipmentSelections.length ? equipmentSelections.join(', ') : equipCustom || '',
      equipmentCustom: equipCustom || undefined,
      musclePriority: musclePriority.length ? musclePriority : undefined,
      sex: sex || undefined,
      weight: weight ? parseFloat(weight) : (currentWeightGoal ? parseFloat(currentWeightGoal) : undefined),
      height: height || undefined,
      age: age ? parseInt(age) : undefined,
      injuryNotes: injuryNotes || undefined,
      notes: notes || undefined,
    }
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
      case 2: return !!data.daysPerWeek && !!data.sessionLength && splitTypes.length > 0
      case 3: return equipmentSelections.length > 0 || !!equipCustom
      case TOTAL_STEPS - 1: return !!firstName.trim() && /^[a-z0-9_]{3,20}$/.test(username) && /\S+@\S+\.\S+/.test(email) && password.length >= 8
      default: return true
    }
  }

  async function handleSubmit() {
    setSignupError('')
    setLoading(true)
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
    if (authData.user) {
      await supabase.from('profiles').upsert({ id: authData.user.id, email: email.trim(), username: username.trim(), first_name: firstName.trim() })
    }
    sessionStorage.setItem('trainmaxxing_onboarding', JSON.stringify(buildPayload()))
    router.push('/plan/generating')
  }

  const ok = canContinue()
  const weightAlreadyEntered = !!(currentWeightGoal && (data.goal === 'lose_weight' || data.goal === 'build_muscle'))

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0, scale: 0.97 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0, scale: 0.97 }),
  }

  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0D0D0F] relative overflow-hidden">

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-[#FF4500]/5 blur-[100px] pointer-events-none rounded-full" />

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 relative z-10">
        <button
          onClick={step > 0 ? back : () => router.push('/')}
          className="w-9 h-9 rounded-xl bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA] hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#FF4500]">{STEPS[step].label}</span>
          <span className="text-[11px] font-semibold text-[#3A3A3C]">{step + 1}/{TOTAL_STEPS}</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Progress bar */}
      <div className="px-5 mb-8 relative z-10">
        <div className="h-[3px] bg-[#1C1C1E] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#FF4500] rounded-full shadow-[0_0_8px_rgba(255,69,0,0.6)]"
            animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col px-5 overflow-y-auto relative z-10">
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
                <h2 className="text-[2rem] font-black uppercase tracking-tight leading-[1] mb-7">
                  What&apos;s your main goal?
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
                          selected ? 'border-[#FF4500] bg-[#FF4500]/10 shadow-[0_0_20px_rgba(255,69,0,0.12)]' : 'border-[#252528] bg-[#1C1C1E] hover:border-[#3A3A3C]'
                        }`}
                      >
                        <span className="text-2xl leading-none">{g.emoji}</span>
                        <p className="flex-1 font-bold text-sm text-white">{g.label}</p>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          selected ? 'border-[#FF4500] bg-[#FF4500]' : 'border-[#3A3A3C]'
                        }`}>
                          {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                      </button>
                    )
                  })}
                  <textarea
                    ref={goalCustomRef}
                    value={goalCustom}
                    onChange={e => {
                      setGoalCustom(e.target.value)
                      setData(d => ({ ...d, goal: undefined }))
                      setCurrentWeightGoal('')
                      setTargetWeight('')
                      setLiftGoals([{ lift: '', current: '', target: '' }])
                    }}
                    placeholder="Something else? Type it here..."
                    style={{ minHeight: '52px', overflow: 'hidden' }}
                    className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors resize-none leading-relaxed mt-1"
                  />
                </div>

                <AnimatePresence>
                  {(data.goal === 'lose_weight' || data.goal === 'build_muscle') && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.18 }}
                      className="mt-5 flex gap-2.5"
                    >
                      <div className="flex-1">
                        <label className="text-[11px] font-bold text-[#FF4500]/70 uppercase tracking-widest block mb-2">Current (lbs)</label>
                        <input type="number" inputMode="decimal" value={currentWeightGoal}
                          onChange={e => setCurrentWeightGoal(e.target.value)} placeholder="e.g. 195"
                          className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors" />
                      </div>
                      <div className="flex-1">
                        <label className="text-[11px] font-bold text-[#FF4500]/70 uppercase tracking-widest block mb-2">Target (lbs)</label>
                        <input type="number" inputMode="decimal" value={targetWeight}
                          onChange={e => setTargetWeight(e.target.value)}
                          placeholder={data.goal === 'lose_weight' ? 'e.g. 165' : 'e.g. 220'}
                          className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors" />
                      </div>
                    </motion.div>
                  )}
                  {data.goal === 'get_stronger' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.18 }}
                      className="mt-5"
                    >
                      <label className="text-[11px] font-bold text-[#FF4500]/70 uppercase tracking-widest block mb-3">Lift goals</label>
                      <div className="flex flex-col gap-2.5">
                        {liftGoals.map((g, i) => (
                          <div key={i} className="bg-[#1C1C1E] border border-[#252528] rounded-2xl p-3 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <input type="text" value={g.lift} onChange={e => updateLift(i, 'lift', e.target.value)}
                                placeholder="Enter Lift (e.g. Bench Press)"
                                className="flex-1 bg-[#252528] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:ring-1 focus:ring-[#FF4500] transition-all" />
                              {liftGoals.length > 1 && (
                                <button onClick={() => removeLift(i)}
                                  className="w-7 h-7 rounded-lg bg-[#252528] flex items-center justify-center text-[#636366] hover:text-red-400 transition-colors flex-shrink-0">×</button>
                              )}
                            </div>
                            <input type="text" value={g.current} onChange={e => updateLift(i, 'current', e.target.value)}
                              placeholder="Enter Current Max (e.g. 185 lbs)"
                              className="w-full bg-[#252528] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:ring-1 focus:ring-[#FF4500] transition-all" />
                            <input type="text" value={g.target} onChange={e => updateLift(i, 'target', e.target.value)}
                              placeholder="Enter Goal (e.g. 225 lbs)"
                              className="w-full bg-[#252528] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:ring-1 focus:ring-[#FF4500] transition-all" />
                          </div>
                        ))}
                        <button onClick={addLift} disabled={!liftGoals[liftGoals.length - 1].lift.trim()}
                          className="flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[#FF4500]/40 text-sm font-semibold text-[#FF4500] hover:border-[#FF4500] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[#3A3A3C] disabled:hover:text-[#9A9AAA]">
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
                <h2 className="text-[2rem] font-black uppercase tracking-tight leading-[1] mb-7">
                  Your experience level?
                </h2>
                <div className="flex flex-col gap-2.5">
                  {EXPERIENCE.map(e => {
                    const selected = data.experience === e.value
                    return (
                      <button key={e.value} onClick={() => setData(d => ({ ...d, experience: e.value }))}
                        className={`flex items-center gap-4 px-4 py-4 rounded-2xl border text-left transition-all ${
                          selected ? 'border-[#FF4500] bg-[#FF4500]/10 shadow-[0_0_20px_rgba(255,69,0,0.12)]' : 'border-[#252528] bg-[#1C1C1E] hover:border-[#3A3A3C]'
                        }`}
                      >
                        <span className="text-2xl leading-none">{e.emoji}</span>
                      <p className="flex-1 font-bold text-sm text-white">{e.label}</p>
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
                <h2 className="text-[2rem] font-black uppercase tracking-tight leading-[1] mb-4">
                  How many days per week?
                </h2>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {DAYS.map(d => {
                    const selected = data.daysPerWeek === d.value
                    return (
                      <button key={d.value} onClick={() => setData(prev => ({ ...prev, daysPerWeek: d.value }))}
                        className={`flex items-center justify-center py-2 rounded-xl border transition-all ${
                          selected ? 'border-[#FF4500] bg-[#FF4500]/10 shadow-[0_0_20px_rgba(255,69,0,0.12)]' : 'border-[#252528] bg-[#1C1C1E] hover:border-[#3A3A3C]'
                        }`}
                      >
                        <span className={`text-xl font-black ${selected ? 'text-[#FF4500]' : 'text-white'}`}>{d.label}</span>
                      </button>
                    )
                  })}
                </div>

                <p className="text-[11px] font-bold text-[#FF4500]/70 uppercase tracking-widest mb-2">Session length</p>
                <div className="flex gap-2 mb-4">
                  {SESSION_LENGTHS.map(s => {
                    const selected = data.sessionLength === s.value
                    return (
                      <button key={s.value} onClick={() => setData(d => ({ ...d, sessionLength: s.value }))}
                        className={`flex-1 py-4 rounded-2xl border text-base font-bold transition-all ${
                          selected ? 'border-[#FF4500] bg-[#FF4500]/10 shadow-[0_0_20px_rgba(255,69,0,0.12)] text-[#FF4500]' : 'border-[#252528] bg-[#1C1C1E] text-[#9A9AAA] hover:border-[#3A3A3C] hover:text-white'
                        }`}
                      >{s.label}</button>
                    )
                  })}
                </div>

                <p className="text-[11px] font-bold text-[#FF4500]/70 uppercase tracking-widest mb-2">Workout split</p>
                <div className="flex flex-col gap-1.5 mb-4">
                  {SPLITS.map(s => {
                    const selected = splitTypes.includes(s.value)
                    return (
                      <button key={s.value} onClick={() => setSplitTypes(prev => prev.includes(s.value) ? prev.filter(x => x !== s.value) : [...prev, s.value])}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border text-left transition-all ${
                          selected ? 'border-[#FF4500] bg-[#FF4500]/10 shadow-[0_0_20px_rgba(255,69,0,0.12)]' : 'border-[#252528] bg-[#1C1C1E] hover:border-[#3A3A3C]'
                        }`}
                      >
                        <span className="text-lg leading-none">{s.emoji}</span>
                        <p className={`flex-1 text-sm font-bold ${selected ? 'text-[#FF4500]' : 'text-white'}`}>{s.label}</p>
                        <div className={`w-4 h-4 rounded-sm border-2 flex-shrink-0 transition-all flex items-center justify-center ${selected ? 'border-[#FF4500] bg-[#FF4500]' : 'border-[#3A3A3C]'}`}>
                          {selected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <p className="text-[11px] font-bold text-[#FF4500]/70 uppercase tracking-widest">Training days</p>
                  <span className="text-xs font-semibold text-[#9A9AAA]">Optional</span>
                </div>
                <div className="flex gap-1.5">
                  {TRAINING_DAYS.map(d => {
                    const selected = trainingDays.includes(d.value)
                    return (
                      <button key={d.value}
                        onClick={() => setTrainingDays(prev => prev.includes(d.value) ? prev.filter(x => x !== d.value) : [...prev, d.value])}
                        className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                          selected ? 'border-[#FF4500] bg-[#FF4500]/10 shadow-[0_0_20px_rgba(255,69,0,0.12)] text-[#FF4500]' : 'border-[#252528] bg-[#1C1C1E] text-[#9A9AAA] hover:border-[#3A3A3C] hover:text-white'
                        }`}
                      >{d.label}</button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 3 — Equipment */}
            {step === 3 && (
              <div className="flex flex-col flex-1">
                <h2 className="text-[2rem] font-black uppercase tracking-tight leading-[1] mb-2">
                  What&apos;s your equipment?
                </h2>
                <p className="text-sm font-semibold text-[#FF4500] mb-6">Select all that apply</p>
                <div className="flex flex-col gap-2.5">
                  {EQUIPMENT.map(eq => {
                    const selected = equipmentSelections.includes(eq.value)
                    return (
                      <button key={eq.value}
                        onClick={() => toggleEquipment(eq.value)}
                        className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border text-left transition-all ${
                          selected ? 'border-[#FF4500] bg-[#FF4500]/10 shadow-[0_0_20px_rgba(255,69,0,0.12)]' : 'border-[#252528] bg-[#1C1C1E] hover:border-[#3A3A3C]'
                        }`}
                      >
                        <span className="text-2xl leading-none">{eq.emoji}</span>
                        <p className={`flex-1 font-bold text-sm ${selected ? 'text-[#FF4500]' : 'text-white'}`}>{eq.label}</p>
                        <div className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          selected ? 'border-[#FF4500] bg-[#FF4500]' : 'border-[#3A3A3C]'
                        }`}>
                          {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                      </button>
                    )
                  })}
                  <textarea ref={equipCustomRef} value={equipCustom}
                    onChange={e => { setEquipCustom(e.target.value); setEquipmentSelections([]) }}
                    placeholder="I have specific equipment..."
                    style={{ minHeight: '52px', overflow: 'hidden' }}
                    className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors resize-none leading-relaxed mt-1" />
                </div>
              </div>
            )}

            {/* Step 4 — Muscle Priority */}
            {step === 4 && (
              <div className="flex flex-col flex-1">
                <h2 className="text-[2rem] font-black uppercase tracking-tight leading-[1] mb-1">
                  What to develop most?
                </h2>
                <p className="text-sm font-semibold text-[#FF4500] mb-6">Optional</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {MUSCLE_GROUPS.map(m => {
                    const selected = musclePriority.includes(m.value)
                    return (
                      <motion.button
                        key={m.value}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => toggleMuscle(m.value)}
                        className={`flex items-center gap-3 px-4 py-4 rounded-2xl border text-left transition-all ${
                          selected ? 'border-[#FF4500] bg-[#FF4500]/10 shadow-[0_0_20px_rgba(255,69,0,0.12)]' : 'border-[#252528] bg-[#1C1C1E] hover:border-[#3A3A3C]'
                        }`}
                      >
                        <span className="text-xl leading-none">{m.emoji}</span>
                        <p className={`font-bold text-sm ${selected ? 'text-[#FF4500]' : 'text-white'}`}>{m.value}</p>
                        {selected && <Check className="w-3.5 h-3.5 text-[#FF4500] ml-auto flex-shrink-0" strokeWidth={3} />}
                      </motion.button>
                    )
                  })}
                </div>
                {musclePriority.length === 0 && (
                  <p className="text-xs text-[#9A9AAA] mt-4 text-center">Skip to keep it balanced across all muscle groups</p>
                )}
              </div>
            )}

            {/* Step 5 — Body */}
            {step === 5 && (
              <div className="flex flex-col flex-1">
                <h2 className="text-[2rem] font-black uppercase tracking-tight leading-[1] mb-1">About you</h2>
                <p className="text-sm font-semibold text-[#FF4500] mb-6">Optional</p>
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-[11px] font-bold text-[#FF4500]/70 uppercase tracking-widest mb-2">Biological sex</p>
                    <div className="flex gap-2.5">
                      {[{ label: 'Male', emoji: '♂️' }, { label: 'Female', emoji: '♀️' }].map(({ label, emoji }) => (
                        <button key={label} onClick={() => setSex(label)}
                          className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all flex flex-col items-center gap-1 ${
                            sex === label ? 'border-[#FF4500] bg-[#FF4500]/10 shadow-[0_0_20px_rgba(255,69,0,0.12)] text-[#FF4500]' : 'border-[#252528] bg-[#1C1C1E] text-[#9A9AAA] hover:border-[#3A3A3C] hover:text-white'
                          }`}
                        >
                          <span className="text-lg leading-none">{emoji}</span>
                          <span className="text-xs">{label}</span>
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
                      <label className="text-[11px] font-bold text-[#FF4500]/70 uppercase tracking-widest block mb-2">⚖️ Current weight (lbs)</label>
                      <input type="number" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)}
                        placeholder="e.g. 185"
                        className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors" />
                    </div>
                  )}

                  <div className="flex gap-2.5">
                    <div className="flex-1">
                      <label className="text-[11px] font-bold text-[#FF4500]/70 uppercase tracking-widest block mb-2">📏 Height</label>
                      <input type="text" value={height} onChange={e => setHeight(e.target.value)} placeholder={`5'11"`}
                        className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[11px] font-bold text-[#FF4500]/70 uppercase tracking-widest block mb-2">🎂 Age</label>
                      <input type="number" inputMode="numeric" value={age} onChange={e => setAge(e.target.value)} placeholder="24"
                        className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6 — Injuries */}
            {step === 6 && (
              <div className="flex flex-col flex-1">
                <h2 className="text-[2rem] font-black uppercase tracking-tight leading-[1] mb-1">
                  Injuries or limitations?
                </h2>
                <p className="text-sm font-semibold text-[#FF4500] mb-6">Optional</p>
                <textarea ref={injuryRef} value={injuryNotes} onChange={e => setInjuryNotes(e.target.value)}
                  placeholder={'e.g. "Bad knees, avoid squats. Lower back issues. No running."'}
                  style={{ minHeight: '100px', overflow: 'hidden' }}
                  className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors resize-none leading-relaxed" />
              </div>
            )}

            {/* Step 7 — Notes */}
            {step === 7 && (
              <div className="flex flex-col flex-1">
                <h2 className="text-[2rem] font-black uppercase tracking-tight leading-[1] mb-1">Anything else?</h2>
                <p className="text-sm font-semibold text-[#FF4500] mb-6">Optional</p>
                <textarea ref={notesRef} value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder={'e.g. "No burpees. I do cardio 3x/week. I want bigger arms."'}
                  style={{ minHeight: '100px', overflow: 'hidden' }}
                  className="w-full bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors resize-none leading-relaxed" />
              </div>
            )}

            {/* Step 8 — Account */}
            {step === 8 && (
              <div className="flex flex-col flex-1">
                <h2 className="text-[2rem] font-black uppercase tracking-tight leading-[1] mb-7">
                  Create your account
                </h2>
                {(() => {
                  const vFirst = !!firstName.trim()
                  const vUser = /^[a-z0-9_]{3,20}$/.test(username)
                  const vEmail = /\S+@\S+\.\S+/.test(email)
                  const vPass = password.length >= 8
                  const fieldBorder = (valid: boolean, hasValue: boolean) =>
                    hasValue ? (valid ? 'border-[#22C55E]' : 'border-red-500/60') : 'border-[#252528]'
                  return (
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-[#FF4500]/70 uppercase tracking-widest block mb-2">First name</label>
                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                          placeholder="e.g. Jaylen" autoComplete="given-name"
                          className={`w-full bg-[#1C1C1E] border ${fieldBorder(vFirst, !!firstName)} rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors`} />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#FF4500]/70 uppercase tracking-widest block mb-2">Username</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#636366] text-sm font-semibold">@</span>
                          <input type="text" value={username}
                            onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            placeholder="your_handle" autoComplete="username" maxLength={20}
                            className={`w-full bg-[#1C1C1E] border ${fieldBorder(vUser, !!username)} rounded-2xl pl-8 pr-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors`} />
                        </div>
                        <p className={`text-xs mt-1.5 ${username && !vUser ? 'text-red-400' : 'text-[#9A9AAA]'}`}>3–20 chars, lowercase, letters/numbers/underscores</p>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#FF4500]/70 uppercase tracking-widest block mb-2">Email</label>
                        <input type="email" value={email} onChange={e => { setEmail(e.target.value); setSignupError('') }}
                          placeholder="you@example.com" autoComplete="email"
                          className={`w-full bg-[#1C1C1E] border ${fieldBorder(vEmail, !!email)} rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors`} />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#FF4500]/70 uppercase tracking-widest block mb-2">Password</label>
                        <div className="relative">
                          <input type={showPassword ? 'text' : 'password'} value={password}
                            onChange={e => { setPassword(e.target.value); setSignupError('') }}
                            placeholder="Min. 8 characters" autoComplete="new-password"
                            className={`w-full bg-[#1C1C1E] border ${fieldBorder(vPass, !!password)} rounded-2xl px-4 py-4 pr-12 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors`} />
                          <button type="button" onClick={() => setShowPassword(p => !p)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#636366] hover:text-[#9A9AAA] transition-colors">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {password && !vPass && <p className="text-xs text-red-400 mt-1.5">Must be at least 8 characters</p>}
                      </div>
                      {signupError && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                          {signupError}
                        </motion.p>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="px-5 pb-12 pt-5 flex flex-col gap-3 relative z-10">
        <motion.button
          onClick={step < TOTAL_STEPS - 1 ? next : handleSubmit}
          disabled={!ok || loading}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-[#FF4500] text-white font-black text-sm uppercase tracking-[0.12em] py-[20px] rounded-2xl flex items-center justify-center gap-2.5 disabled:opacity-30 shadow-[0_8px_48px_rgba(255,69,0,0.35)] transition-opacity"
        >
          {loading
            ? 'Creating account...'
            : step < TOTAL_STEPS - 1
              ? 'Continue'
              : 'Create Account & Build My Plan'}
          {!loading && <ChevronRight className="w-5 h-5" />}
        </motion.button>
      </div>
    </div>
  )
}
