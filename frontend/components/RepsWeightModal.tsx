'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Minus, Plus } from 'lucide-react'

interface Props {
  liftName: string
  initialReps?: number
  initialWeight?: number
  onDone: (reps: number, weight: number) => void
  onClose: () => void
}

export default function RepsWeightModal({ liftName, initialReps, initialWeight, onDone, onClose }: Props) {
  const [reps, setReps] = useState(initialReps ?? 1)
  const [weight, setWeight] = useState(initialWeight ?? 0)

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/90 z-[60]"
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] bg-[#0D0D0F] border-t border-[#252528] rounded-t-3xl z-[70] flex flex-col max-h-[92dvh]"
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#3A3A3C]" />
        </div>

        <div className="flex items-center justify-between px-5 pt-2 pb-4 flex-shrink-0">
          <div>
            <p className="text-[10px] text-[#9A9AAA] font-semibold uppercase tracking-widest mb-0.5">Log PR</p>
            <p className="font-bold text-base truncate max-w-[260px]">{liftName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8 flex flex-col gap-4">
          <div className="bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-sm font-bold text-white flex-1">Reps</span>
            <button onClick={() => setReps(r => Math.max(1, r - 1))} className="w-9 h-9 rounded-xl bg-[#252528] flex items-center justify-center text-[#9A9AAA]">
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-20 text-center text-lg font-black text-white tabular-nums whitespace-nowrap">{reps}</span>
            <button onClick={() => setReps(r => r + 1)} className="w-9 h-9 rounded-xl bg-[#FF4500]/15 flex items-center justify-center text-[#FF4500]">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1">
              <span className="text-sm font-bold text-white">Added Weight</span>
              <p className="text-[11px] text-[#9A9AAA] mt-0.5">0 = bodyweight only</p>
            </div>
            <button onClick={() => setWeight(w => Math.max(0, w - 2.5))} className="w-9 h-9 rounded-xl bg-[#252528] flex items-center justify-center text-[#9A9AAA]">
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-20 text-center text-lg font-black text-white tabular-nums whitespace-nowrap">{weight} lbs</span>
            <button onClick={() => setWeight(w => w + 2.5)} className="w-9 h-9 rounded-xl bg-[#FF4500]/15 flex items-center justify-center text-[#FF4500]">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onDone(reps, weight)}
            className="w-full bg-[#FF4500] text-white font-bold py-4 rounded-2xl text-sm shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
          >
            Continue
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}
