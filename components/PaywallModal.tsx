'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Zap } from 'lucide-react'

interface PaywallModalProps {
  open: boolean
  onClose: () => void
}

const FEATURES = [
  'Start and log workouts',
  'Track your progress over time',
  'AI adjusts your plan as you improve',
  'Unlimited plan regenerations',
  'AI form analysis on every exercise',
]

export default function PaywallModal({ open, onClose }: PaywallModalProps) {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] bg-[#1C1C1E] border-t border-[#252528] rounded-t-3xl z-50 px-5 pt-5 pb-10"
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-[#3A3A3C] rounded-full mx-auto mb-5" />

            <button onClick={onClose} className="absolute top-5 right-5 text-[#9A9AAA]">
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-[#FF4500]/10 border border-[#FF4500]/20 flex items-center justify-center mb-4">
              <Zap className="w-7 h-7 text-[#FF4500]" />
            </div>

            <h2 className="text-2xl font-extrabold mb-1">Unlock Trainmaxxing</h2>
            <p className="text-[#9A9AAA] text-sm mb-6">Start your first workout and crush your goals.</p>

            {/* Features */}
            <div className="flex flex-col gap-2.5 mb-6">
              {FEATURES.map(f => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#22C55E]/15 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-[#22C55E]" />
                  </div>
                  <span className="text-sm text-[#D1D5DB]">{f}</span>
                </div>
              ))}
            </div>

            {/* Plan toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setPeriod('monthly')}
                className={`flex-1 py-3.5 rounded-2xl border text-sm font-semibold transition-all ${
                  period === 'monthly'
                    ? 'border-[#FF4500] bg-[#FF4500]/10 text-white'
                    : 'border-[#252528] bg-[#252528] text-[#9A9AAA]'
                }`}
              >
                <div>Monthly</div>
                <div className="text-lg font-extrabold text-white mt-0.5">$9.99</div>
              </button>
              <button
                onClick={() => setPeriod('yearly')}
                className={`flex-1 py-3.5 rounded-2xl border text-sm font-semibold transition-all relative ${
                  period === 'yearly'
                    ? 'border-[#FF4500] bg-[#FF4500]/10 text-white'
                    : 'border-[#252528] bg-[#252528] text-[#9A9AAA]'
                }`}
              >
                {/* Best value badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#22C55E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  SAVE 50%
                </div>
                <div>Yearly</div>
                <div className="text-lg font-extrabold text-white mt-0.5">$59.99</div>
                <div className="text-[10px] text-[#9A9AAA]">$5/mo billed annually</div>
              </button>
            </div>

            {/* CTA */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-[#FF4500] text-white font-bold text-base py-[18px] rounded-2xl disabled:opacity-50 shadow-[0_8px_32px_rgba(255,69,0,0.3)]"
            >
              {loading ? 'Redirecting...' : `Get Trainmaxxing · ${period === 'monthly' ? '$9.99/mo' : '$59.99/yr'}`}
            </motion.button>

            <p className="text-center text-xs text-[#636366] mt-3">Cancel anytime. No commitment.</p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
