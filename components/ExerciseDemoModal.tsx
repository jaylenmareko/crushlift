'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import type { ExerciseDemoData } from '@/app/api/exercise-demo/route'

interface Props {
  exerciseName: string
  onClose: () => void
}

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

export default function ExerciseDemoModal({ exerciseName, onClose }: Props) {
  const [data, setData]       = useState<ExerciseDemoData | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [stepsOpen, setStepsOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    setData(null)
    setError(null)
    fetch(`/api/exercise-demo?name=${encodeURIComponent(exerciseName)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError('network'))
      .finally(() => setLoading(false))
  }, [exerciseName])

  const badges = data ? [
    { label: cap(data.bodyPart), color: '#FF4500' },
    { label: cap(data.target),   color: '#3B82F6' },
    { label: cap(data.equipment), color: '#9A9AAA' },
  ] : []

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
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] bg-[#0D0D0F] border-t border-[#252528] rounded-t-3xl z-[70] flex flex-col max-h-[88dvh]"
      >
        {/* Drag indicator */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#3A3A3C]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 flex-shrink-0">
          <div>
            <p className="text-[10px] font-bold text-[#FF4500] uppercase tracking-widest mb-0.5">Exercise Demo</p>
            <p className="font-bold text-base">{exerciseName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 flex flex-col gap-4">

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-[#FF4500] animate-spin" />
              <p className="text-xs font-semibold text-[#9A9AAA]">Loading demo…</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <AlertTriangle className="w-8 h-8 text-[#9A9AAA]" />
              <p className="text-sm font-semibold text-[#9A9AAA]">
                {error === 'no_key'
                  ? 'Demo feature not configured yet'
                  : error === 'not_found'
                  ? 'No demo found for this exercise'
                  : 'Could not load demo — try again'}
              </p>
              {error === 'no_key' && (
                <p className="text-xs text-[#636366] max-w-[260px]">
                  Add RAPIDAPI_KEY to .env.local to enable animated exercise demos.
                </p>
              )}
            </div>
          )}

          {!loading && data && (
            <>
              {/* Animated GIF */}
              <div className="bg-[#1C1C1E] border border-[#252528] rounded-2xl overflow-hidden aspect-square flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.gifUrl}
                  alt={data.name}
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </div>

              {/* Muscle badges */}
              <div className="flex flex-wrap gap-2">
                {badges.map(b => (
                  <span
                    key={b.label}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl border"
                    style={{ color: b.color, borderColor: `${b.color}40`, backgroundColor: `${b.color}12` }}
                  >
                    {b.label}
                  </span>
                ))}
              </div>

              {/* Secondary muscles */}
              {data.secondaryMuscles.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-[#9A9AAA] uppercase tracking-widest mb-2">Also works</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.secondaryMuscles.map(m => (
                      <span key={m} className="text-[11px] font-semibold text-[#636366] bg-[#1C1C1E] border border-[#252528] px-2 py-1 rounded-lg">
                        {cap(m)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Step-by-step instructions (collapsed by default) */}
              {data.instructions.length > 0 && (
                <div className="bg-[#1C1C1E] border border-[#252528] rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setStepsOpen(o => !o)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                  >
                    <span className="text-sm font-bold text-white">How to perform</span>
                    {stepsOpen
                      ? <ChevronUp className="w-4 h-4 text-[#9A9AAA] flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-[#9A9AAA] flex-shrink-0" />
                    }
                  </button>
                  <AnimatePresence>
                    {stepsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-[#252528] pt-3">
                          {data.instructions.map((step, i) => (
                            <div key={i} className="flex gap-3">
                              <span className="text-[10px] font-black text-[#FF4500] bg-[#FF4500]/10 border border-[#FF4500]/20 rounded-lg w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <p className="text-xs font-semibold text-[#9A9AAA] leading-relaxed">{step}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </>
  )
}
