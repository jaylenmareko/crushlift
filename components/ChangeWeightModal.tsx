'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

// "Update Bodyweight" modal — shared by /belts and /compete.
export default function ChangeWeightModal({
  open,
  onClose,
  weightInput,
  setWeightInput,
  weightError,
  savingWeight,
  onSave,
}: {
  open: boolean
  onClose: () => void
  weightInput: string
  setWeightInput: (v: string) => void
  weightError: string | null
  savingWeight: boolean
  onSave: () => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-5"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm bg-[#1C1C1E] border border-[#252528] rounded-3xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-white">Update Bodyweight</h2>
              <button onClick={onClose} className="text-[#636366]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs font-semibold text-[#9A9AAA] mb-3">This updates your weight class for belts and rankings.</p>
            <div className="flex items-center bg-[#161618] border border-[#252528] rounded-2xl px-4 py-4 gap-3 mb-3">
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
              className="w-full bg-[#FF4500] text-white font-bold py-3.5 rounded-2xl text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {savingWeight ? 'Saving...' : 'Save'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
