'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, X, Check, Video, ShieldCheck, ShieldAlert, Trophy } from 'lucide-react'
import PRVerifyModal from '@/components/PRVerifyModal'
import PlateCheckModal from '@/components/PlateCheckModal'
import RepsWeightModal from '@/components/RepsWeightModal'
import AddedWeightPhotoModal from '@/components/AddedWeightPhotoModal'
import { displayColor, type LiftWithTier } from '@/lib/belts'

type PrStep = 'select' | 'plates' | 'reps' | 'weight-photo' | 'record' | 'verify'

// Shared "Log a PR" modal chain — used by both /ranks (pick any lift, no prefill)
// and /workout (prefilled from a completed set that just beat the user's best).
// Owns the full multi-step flow: pick lift → declare weight/reps → photo verify → record video.
export function usePrLogger(
  liftData: LiftWithTier[],
  onLogged: (liftName: string, weight: number | null, reps: number | null, verified: boolean) => void
) {
  const [prModalOpen, setPrModalOpen] = useState(false)
  const [prStep, setPrStep] = useState<PrStep>('select')
  const [prLift, setPrLift] = useState<string | null>(null)
  const [prWeight, setPrWeight] = useState<number | null>(null)
  const [prReps, setPrReps] = useState<number | null>(null)
  const [prVerified, setPrVerified] = useState(false)
  const [prPlatePhotos, setPrPlatePhotos] = useState<{ left: string | null; right: string | null; front: string | null } | null>(null)

  function openLogPr(liftName?: string, prefill?: { weight?: number; reps?: number }) {
    if (!liftName) {
      setPrLift(null)
      setPrStep('select')
      setPrModalOpen(true)
      return
    }
    const lift = liftData.find(l => l.name === liftName)
    setPrLift(liftName)
    setPrWeight(prefill?.weight ?? null)
    setPrReps(prefill?.reps ?? null)
    setPrVerified(false)
    setPrPlatePhotos(null)
    setPrStep(lift?.type === 'bodyweight' ? 'reps' : 'plates')
    setPrModalOpen(true)
  }

  function logPr(liftName: string, weight: number | null, reps: number | null, verified: boolean) {
    onLogged(liftName, weight, reps, verified)
    setPrModalOpen(false)
    setPrStep('select')
    setPrLift(null)
    setPrWeight(null)
    setPrReps(null)
    setPrVerified(verified)
    setPrPlatePhotos(null)
  }

  const modals = (
    <>
      {/* Select lift / record summary */}
      <AnimatePresence>
        {prModalOpen && prStep !== 'plates' && prStep !== 'verify' && prStep !== 'reps' && prStep !== 'weight-photo' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-5"
            onClick={() => setPrModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-[#1C1C1E] border border-[#252528] rounded-3xl p-5"
            >
              {prStep === 'select' ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-black text-white">Log a PR</h2>
                    <button onClick={() => setPrModalOpen(false)} className="text-[#636366]">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 mb-4 max-h-[50vh] overflow-y-auto">
                    {liftData.map(l => (
                      <button
                        key={l.name}
                        onClick={() => setPrLift(l.name)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                          prLift === l.name ? 'border-[#FF4500] bg-[#FF4500]/10' : 'border-[#252528] bg-[#161618]'
                        }`}
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border-2"
                          style={{ backgroundColor: `${l.tier.color}20`, borderColor: displayColor(l.tier.color) }}
                        >
                          <Trophy className="w-4 h-4" style={{ color: displayColor(l.tier.color) }} />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-bold text-white">{l.name}</p>
                          <p className="text-xs font-semibold text-[#9A9AAA] mt-0.5">
                            {l.bestReps ? `Current: ${l.bestReps} ${l.bestReps === 1 ? 'rep' : 'reps'}${l.best ? ` + ${l.best} lbs` : ''}` : l.best > 0 ? `Current: ${l.best} lbs` : 'No PR logged'}
                          </p>
                        </div>
                        {prLift === l.name && <Check className="w-4 h-4 text-[#FF4500] flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={!prLift}
                    onClick={() => {
                      setPrWeight(null)
                      setPrReps(null)
                      setPrVerified(false)
                      setPrPlatePhotos(null)
                      const lift = liftData.find(x => x.name === prLift)
                      setPrStep(lift?.type === 'bodyweight' ? 'reps' : 'plates')
                    }}
                    className="w-full bg-[#FF4500] text-white font-bold py-3.5 rounded-2xl text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continue
                  </motion.button>
                </>
              ) : prStep === 'record' ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => {
                      const lift = liftData.find(x => x.name === prLift)
                      if (lift?.type === 'bodyweight') {
                        setPrStep(prWeight && prWeight > 0 ? 'weight-photo' : 'reps')
                      } else {
                        setPrStep('plates')
                      }
                    }} className="text-[#9A9AAA]"><ChevronLeft className="w-5 h-5" /></button>
                    <h2 className="text-lg font-black text-white flex-1">{prLift}</h2>
                    <button onClick={() => setPrModalOpen(false)} className="text-[#636366]">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {prReps !== null ? (
                    prWeight ? (
                      <div className="rounded-2xl border p-3 flex items-center gap-3 mb-4" style={{ backgroundColor: prVerified ? '#22C55E10' : '#F59E0B10', borderColor: prVerified ? '#22C55E30' : '#F59E0B30' }}>
                        {prVerified ? <ShieldCheck className="w-5 h-5 text-[#22C55E] flex-shrink-0" /> : <ShieldAlert className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />}
                        <div>
                          <p className="text-sm font-black text-white">
                            {prReps} {prReps === 1 ? 'rep' : 'reps'} + {prWeight} lbs
                          </p>
                          <p className="text-[10px]" style={{ color: prVerified ? '#22C55E' : '#F59E0B' }}>{prVerified ? 'Added weight verified' : 'Unverified weight'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-[#252528] bg-[#161618] p-3 flex items-center gap-3 mb-4">
                        <div>
                          <p className="text-sm font-black text-white">
                            {prReps} {prReps === 1 ? 'rep' : 'reps'} (bodyweight)
                          </p>
                          <p className="text-[10px] text-[#9A9AAA]">Logging this PR</p>
                        </div>
                      </div>
                    )
                  ) : prWeight !== null && (
                    <div className="rounded-2xl border p-3 flex items-center gap-3 mb-4" style={{ backgroundColor: prVerified ? '#22C55E10' : '#F59E0B10', borderColor: prVerified ? '#22C55E30' : '#F59E0B30' }}>
                      {prVerified ? <ShieldCheck className="w-5 h-5 text-[#22C55E] flex-shrink-0" /> : <ShieldAlert className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />}
                      <div>
                        <p className="text-sm font-black text-white">{prWeight} lbs</p>
                        <p className="text-[10px]" style={{ color: prVerified ? '#22C55E' : '#F59E0B' }}>{prVerified ? 'Plates verified' : 'Unverified weight'}</p>
                      </div>
                    </div>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setPrStep('verify')}
                    className="w-full bg-[#FF4500] text-white font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
                  >
                    <Video className="w-4 h-4" />
                    Start Recording
                  </motion.button>
                </>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {prModalOpen && prStep === 'verify' && prLift && (
          <PRVerifyModal
            exerciseName={prLift}
            weight={prWeight ?? 0}
            reps={prReps ?? undefined}
            platePhotos={prPlatePhotos}
            onClose={() => setPrStep('record')}
            onDone={verified => logPr(prLift, prWeight, prReps, verified)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {prModalOpen && prStep === 'plates' && prLift && (
          <PlateCheckModal
            liftName={prLift}
            onClose={() => setPrModalOpen(false)}
            onDone={(weight, verified, photos) => {
              setPrWeight(weight)
              setPrVerified(verified)
              setPrPlatePhotos(photos)
              setPrStep('record')
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {prModalOpen && prStep === 'reps' && prLift && (
          <RepsWeightModal
            liftName={prLift}
            initialReps={prReps ?? undefined}
            initialWeight={prWeight ?? undefined}
            onClose={() => setPrModalOpen(false)}
            onDone={(reps, weight) => {
              setPrReps(reps)
              setPrWeight(weight)
              setPrVerified(false)
              setPrPlatePhotos(null)
              setPrStep(weight > 0 ? 'weight-photo' : 'record')
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {prModalOpen && prStep === 'weight-photo' && prLift && prWeight !== null && (
          <AddedWeightPhotoModal
            liftName={prLift}
            weight={prWeight}
            onClose={() => setPrModalOpen(false)}
            onDone={(verified) => {
              setPrVerified(verified)
              setPrPlatePhotos(null)
              setPrStep('record')
            }}
          />
        )}
      </AnimatePresence>
    </>
  )

  return { openLogPr, modals }
}
