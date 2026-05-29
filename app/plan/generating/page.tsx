'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Dumbbell } from 'lucide-react'

const MESSAGES = [
  'Reading your goals...',
  'Building your workout split...',
  'Selecting the right exercises...',
  'Calculating sets and reps...',
  'Adding finishing touches...',
  'Almost ready...',
]

export default function GeneratingPage() {
  const router = useRouter()
  const [msgIndex, setMsgIndex] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(i => Math.min(i + 1, MESSAGES.length - 1))
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const raw = sessionStorage.getItem('crushlift_onboarding')
    if (!raw) { router.push('/onboarding'); return }
    const onboarding = JSON.parse(raw)

    fetch('/api/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onboarding }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        sessionStorage.setItem('crushlift_plan_id', data.plan.id)
        sessionStorage.removeItem('crushlift_onboarding')
        router.push('/plan')
      })
      .catch(() => setError('Something went wrong. Try again.'))
  }, [router])

  if (error) {
    return (
      <div className="mobile-container flex flex-col items-center justify-center min-h-dvh bg-[#0A0A0A] px-5 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={() => router.push('/onboarding')} className="text-[#FF4500] underline text-sm">
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="mobile-container flex flex-col items-center justify-center min-h-dvh bg-[#0A0A0A] px-5 text-center">
      {/* Animated icon */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        className="mb-8"
      >
        <div className="w-20 h-20 rounded-full bg-[#FF4500]/10 border border-[#FF4500]/30 flex items-center justify-center">
          <Dumbbell className="w-9 h-9 text-[#FF4500]" />
        </div>
      </motion.div>

      <h2 className="text-2xl font-bold mb-3">Building your plan</h2>

      <motion.p
        key={msgIndex}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className="text-[#6B7280] text-base"
      >
        {MESSAGES[msgIndex]}
      </motion.p>

      {/* Progress dots */}
      <div className="flex gap-1.5 mt-8">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-[#FF4500]"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  )
}
