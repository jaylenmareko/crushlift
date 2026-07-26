'use client'

import { motion } from 'framer-motion'
import { Scale } from 'lucide-react'
import BottomNav from '@/frontend/components/BottomNav'

// Full-screen "what's your bodyweight" prompt — shown by /belts and /compete
// before either page can place the user in a weight class.
export default function WeightGate({
  active,
  weightInput,
  setWeightInput,
  weightError,
  savingWeight,
  onSave,
}: {
  active: string
  weightInput: string
  setWeightInput: (v: string) => void
  weightError: string | null
  savingWeight: boolean
  onSave: () => void
}) {
  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0D0D0F] has-bottom-nav">
      <header className="px-5 pt-12 pb-6">
        <p className="text-[10px] font-bold text-[#FF4500] uppercase tracking-[0.2em] mb-1">Power Rank</p>
        <h1 className="text-2xl font-bold">Compete</h1>
      </header>
      <div className="flex-1 px-5 flex flex-col items-center justify-center gap-6 pb-4">
        <div className="w-20 h-20 rounded-3xl bg-[#FF4500]/10 border-2 border-[#FF4500]/30 flex items-center justify-center">
          <Scale className="w-9 h-9 text-[#FF4500]" />
        </div>
        <div className="text-center">
          <p className="text-xl font-black text-white mb-2">What's your bodyweight?</p>
          <p className="text-sm font-semibold text-[#9A9AAA] leading-relaxed">We need this to place you in the right weight class for belts and battle rankings.</p>
        </div>
        <div className="w-full">
          <div className="flex items-center bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 gap-3 mb-3">
            <input
              type="number"
              inputMode="decimal"
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              placeholder="Enter your weight"
              className="flex-1 bg-transparent text-white text-lg font-bold focus:outline-none placeholder:text-[#48484A]"
            />
            <span className="text-sm font-bold text-[#9A9AAA]">lbs</span>
          </div>
          {weightError && (
            <p className="text-xs text-red-400 mb-3">{weightError}</p>
          )}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onSave}
            disabled={!weightInput || savingWeight}
            className="w-full bg-[#FF4500] text-white font-bold py-4 rounded-2xl text-base shadow-[0_8px_32px_rgba(255,69,0,0.25)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {savingWeight ? 'Saving...' : 'Enter the Competition'}
          </motion.button>
        </div>
      </div>
      <BottomNav active={active} />
    </div>
  )
}
