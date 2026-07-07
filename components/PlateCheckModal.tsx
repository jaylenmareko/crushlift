'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Camera, Minus, Plus, SwitchCamera, ChevronRight, RotateCcw } from 'lucide-react'

type PhotoStep = 'left' | 'right' | 'front'
type Stage = 'select' | 'capture' | 'preview'

interface Props {
  liftName: string
  onDone: (weight: number, verified: boolean, photos: { left: string | null; right: string | null; front: string | null }) => void
  onClose: () => void
}

const BAR_WEIGHT = 45
const PLATE_SIZES = [45, 35, 25, 10, 5, 2.5]

const STEPS: { step: PhotoStep; num: number; label: string; instruction: string }[] = [
  { step: 'left',  num: 1, label: 'Left Side',  instruction: 'Stand in FRONT of your setup at the LEFT end · Aim at the plates' },
  { step: 'right', num: 2, label: 'Right Side', instruction: 'Stand in FRONT of your setup at the RIGHT end · Aim at the plates' },
  { step: 'front', num: 3, label: 'Front View', instruction: 'Stand directly FACING the bar · Both sides visible in frame' },
]

export default function PlateCheckModal({ liftName, onDone, onClose }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [stage, setStage]         = useState<Stage>('select')
  const [photoStep, setPhotoStep] = useState<PhotoStep>('left')
  const [photos, setPhotos]       = useState<Record<PhotoStep, string | null>>({ left: null, right: null, front: null })
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null)
  const [plateCounts, setPlateCounts]   = useState<Record<number, number>>(
    Object.fromEntries(PLATE_SIZES.map(s => [s, 0]))
  )
  const [camError, setCamError]         = useState(false)
  const [facingMode, setFacingMode]     = useState<'environment' | 'user'>('environment')
  const [hasMultipleCams, setHasMultipleCams] = useState(false)

  const total       = BAR_WEIGHT + 2 * PLATE_SIZES.reduce((sum, s) => sum + s * plateCounts[s], 0)
  const stepIndex   = STEPS.findIndex(s => s.step === photoStep)
  const currentStep = STEPS[stepIndex]

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      setHasMultipleCams(devices.filter(d => d.kind === 'videoinput').length > 1)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (stage !== 'capture') return
    let active = true
    if (videoRef.current) videoRef.current.srcObject = null
    const timer = setTimeout(() => {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: { ideal: facingMode } }, audio: false })
        .then(stream => {
          if (!active) { stream.getTracks().forEach(t => t.stop()); return }
          streamRef.current = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(() => {})
          }
        })
        .catch(() => { if (active) setCamError(true) })
    }, 150)
    return () => {
      active = false
      clearTimeout(timer)
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [stage, facingMode])

  function adjustPlate(size: number, delta: number) {
    setPlateCounts(prev => ({ ...prev, [size]: Math.max(0, prev[size] + delta) }))
  }

  function capturePhoto() {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return
    canvas.width  = 800
    canvas.height = Math.round((video.videoHeight / video.videoWidth) * 800)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const data = canvas.toDataURL('image/jpeg', 0.8)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCurrentPhoto(data)
    setStage('preview')
  }

  function acceptPhoto() {
    const updated = { ...photos, [photoStep]: currentPhoto }
    setPhotos(updated)
    setCurrentPhoto(null)
    if (photoStep === 'left')       { setPhotoStep('right'); setStage('capture') }
    else if (photoStep === 'right') { setPhotoStep('front'); setStage('capture') }
    else                            { onDone(total, false, updated) } // all 3 collected — proceed
  }

  function retakePhoto() {
    setCurrentPhoto(null)
    setStage('capture')
  }

  function handleClose() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    onClose()
  }

  function StepProgress() {
    return (
      <div className="flex items-center gap-1.5 mb-1">
        {STEPS.map((s, i) => (
          <div key={s.step} className="flex items-center gap-1.5 flex-1 min-w-0">
            <div className={`flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-black border flex-shrink-0 transition-all ${
              i < stepIndex  ? 'bg-[#22C55E] border-[#22C55E] text-white' :
              i === stepIndex ? 'bg-[#FF4500] border-[#FF4500] text-white' :
              'bg-transparent border-[#3A3A3C] text-[#636366]'
            }`}>{i < stepIndex ? '✓' : s.num}</div>
            <span className={`text-[10px] font-bold uppercase tracking-wide truncate ${i === stepIndex ? 'text-white' : 'text-[#636366]'}`}>{s.label}</span>
            {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < stepIndex ? 'bg-[#22C55E]' : 'bg-[#3A3A3C]'}`} />}
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={handleClose}
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
            <p className="text-[10px] text-[#9A9AAA] font-semibold uppercase tracking-widest mb-0.5">Step 1 of 2 · Weight Setup</p>
            <p className="font-bold text-base truncate max-w-[260px]">{liftName}</p>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-full bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8">

          {/* SELECT PLATES */}
          {stage === 'select' && (
            <div className="flex flex-col gap-4">
              <div className="bg-[#1C1C1E] border border-[#252528] rounded-2xl p-4 text-center">
                <p className="text-[10px] font-bold text-[#9A9AAA] uppercase tracking-widest mb-1">Total Weight (incl. 45 lb bar)</p>
                <p className="text-3xl font-black text-white">{total} lbs</p>
              </div>
              <p className="text-xs font-semibold text-[#9A9AAA]">How many plates per side?</p>
              <div className="flex flex-col gap-2">
                {PLATE_SIZES.map(size => (
                  <div key={size} className="flex items-center gap-3 bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-3">
                    <span className="text-sm font-bold text-white flex-1">{size} lb</span>
                    <button onClick={() => adjustPlate(size, -1)} className="w-9 h-9 rounded-xl bg-[#252528] flex items-center justify-center text-[#9A9AAA]">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-base font-black text-white tabular-nums">{plateCounts[size]}</span>
                    <button onClick={() => adjustPlate(size, 1)} className="w-9 h-9 rounded-xl bg-[#FF4500]/15 flex items-center justify-center text-[#FF4500]">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="bg-[#FF4500]/8 border border-[#FF4500]/20 rounded-2xl p-3">
                <p className="text-[10px] font-bold text-[#FF4500] uppercase tracking-widest mb-1">3 Photos Required</p>
                <p className="text-xs text-[#9A9AAA]">Left side → Right side → Front. Bar can be racked or on the floor.</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { setPhotoStep('left'); setStage('capture') }}
                className="w-full bg-[#FF4500] text-white font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
              >
                <Camera className="w-4 h-4" />
                Take Photos
              </motion.button>
            </div>
          )}

          {/* CAPTURE */}
          {stage === 'capture' && (
            <div className="flex flex-col gap-4">
              <StepProgress />
              {camError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Camera className="w-10 h-10 text-[#3A3A3C] mb-3" />
                  <p className="text-sm font-semibold text-[#9A9AAA]">Camera access denied</p>
                  <p className="text-xs font-semibold text-[#9A9AAA] mt-1">Allow camera access to continue.</p>
                </div>
              ) : (
                <>
                  <div className="relative bg-[#1C1C1E] rounded-2xl overflow-hidden aspect-[3/4] ring-2 ring-[#FF4500]/60">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                    {hasMultipleCams && (
                      <button
                        onClick={() => setFacingMode(m => m === 'environment' ? 'user' : 'environment')}
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white"
                      >
                        <SwitchCamera className="w-4 h-4" />
                      </button>
                    )}
                    <div className="absolute bottom-3 inset-x-3">
                      <div className="bg-black/80 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
                        <p className="text-[10px] font-bold text-[#FF4500] uppercase tracking-widest mb-1">
                          Photo {currentStep.num} of 3 · {currentStep.label}
                        </p>
                        <p className="text-xs font-semibold text-white leading-snug">{currentStep.instruction}</p>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={capturePhoto}
                    className="w-full bg-[#FF4500] text-white font-bold py-[18px] rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
                  >
                    <Camera className="w-5 h-5" />
                    Capture {currentStep.label}
                  </motion.button>
                </>
              )}
            </div>
          )}

          {/* PREVIEW */}
          {stage === 'preview' && currentPhoto && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
              <StepProgress />
              <img src={currentPhoto} alt={`${currentStep.label} photo`} className="w-full aspect-[3/4] object-cover rounded-2xl border border-[#252528]" />
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={acceptPhoto}
                className="w-full bg-[#FF4500] text-white font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
              >
                {photoStep === 'front'
                  ? <>Looks Good · Continue to Recording <ChevronRight className="w-4 h-4" /></>
                  : <>Next: {STEPS[stepIndex + 1]?.label} <ChevronRight className="w-4 h-4" /></>
                }
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={retakePhoto}
                className="w-full bg-[#1C1C1E] border border-[#252528] text-[#9A9AAA] font-semibold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 hover:text-white hover:border-[#3A3A3C] transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retake
              </motion.button>
            </motion.div>
          )}

        </div>
      </motion.div>
    </>
  )
}
