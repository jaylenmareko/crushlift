'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Camera, Loader2, CheckCircle2, AlertTriangle, Minus, Plus, SwitchCamera, ChevronRight, RotateCcw } from 'lucide-react'

type PhotoStep = 'left' | 'right' | 'front'
type Stage = 'select' | 'capture' | 'preview' | 'analyzing' | 'result'

interface VerifyResult {
  verified: boolean
  confidence: 'high' | 'medium' | 'low'
  note: string
  demo?: boolean
}

interface Props {
  liftName: string
  onDone: (weight: number, verified: boolean, photos: { left: string | null; right: string | null; front: string | null }) => void
  onClose: () => void
}

const BAR_WEIGHT = 45
const PLATE_SIZES = [45, 35, 25, 10, 5, 2.5]

const STEPS: { step: PhotoStep; num: number; label: string; instruction: string }[] = [
  { step: 'left',  num: 1, label: 'Left Side',  instruction: 'Stand on the LEFT side. Angle slightly forward so the outer plate number is readable.' },
  { step: 'right', num: 2, label: 'Right Side', instruction: 'Stand on the RIGHT side. Angle slightly forward — outer plate number should be visible.' },
  { step: 'front', num: 3, label: 'Front View', instruction: 'Stand directly in FRONT of the bar. Both sides should be fully visible.' },
]

export default function PlateCheckModal({ liftName, onDone, onClose }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [stage, setStage]           = useState<Stage>('select')
  const [photoStep, setPhotoStep]   = useState<PhotoStep>('left')
  const [photos, setPhotos]         = useState<Record<PhotoStep, string | null>>({ left: null, right: null, front: null })
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null)
  const [plateCounts, setPlateCounts] = useState<Record<number, number>>(
    Object.fromEntries(PLATE_SIZES.map(s => [s, 0]))
  )
  const [result, setResult]     = useState<VerifyResult | null>(null)
  const [camError, setCamError] = useState(false)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [hasMultipleCams, setHasMultipleCams] = useState(false)

  const total         = BAR_WEIGHT + 2 * PLATE_SIZES.reduce((sum, s) => sum + s * plateCounts[s], 0)
  const stepIndex     = STEPS.findIndex(s => s.step === photoStep)
  const currentStep   = STEPS[stepIndex]

  // Detect how many video inputs are available — hide flip button on single-camera devices (e.g. laptops)
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const cams = devices.filter(d => d.kind === 'videoinput')
      setHasMultipleCams(cams.length > 1)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (stage !== 'capture') return
    let active = true
    if (videoRef.current) videoRef.current.srcObject = null
    const timer = setTimeout(() => {
      // Use ideal (not exact) so single-camera devices fall back gracefully instead of erroring
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
    if (photoStep === 'left') { setPhotoStep('right'); setStage('capture') }
    else if (photoStep === 'right') { setPhotoStep('front'); setStage('capture') }
    else { sendForVerification(updated) }
  }

  function retakePhoto() {
    setCurrentPhoto(null)
    setStage('capture')
  }

  async function sendForVerification(allPhotos: Record<PhotoStep, string | null>) {
    setStage('analyzing')
    try {
      const plates = PLATE_SIZES.map(size => ({ size, count: plateCounts[size] }))
      const res = await fetch('/api/verify-plates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos: allPhotos, declaredWeight: total, plates }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setResult(data)
      setStage('result')
    } catch {
      setResult({ verified: false, confidence: 'low', note: 'Could not verify — try again.' })
      setStage('result')
    }
  }

  function handleClose() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    onClose()
  }

  const color = result ? (result.verified ? '#22C55E' : '#F59E0B') : '#FF4500'

  // Step progress bar used in capture + preview
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
            <p className="text-[10px] text-[#9A9AAA] font-semibold uppercase tracking-widest mb-0.5">Verify Weight</p>
            <p className="font-bold text-base truncate max-w-[260px]">{liftName}</p>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-full bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8">

          {/* ── SELECT PLATES ── */}
          {stage === 'select' && (
            <div className="flex flex-col gap-4">
              <div className="bg-[#1C1C1E] border border-[#252528] rounded-2xl p-4 text-center">
                <p className="text-[10px] font-bold text-[#9A9AAA] uppercase tracking-widest mb-1">Weight of Bar (incl. 45lb bar)</p>
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
                Start Photo Verification
              </motion.button>
            </div>
          )}

          {/* ── CAPTURE ── */}
          {stage === 'capture' && (
            <div className="flex flex-col gap-4">
              <StepProgress />
              {camError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Camera className="w-10 h-10 text-[#3A3A3C] mb-3" />
                  <p className="text-sm font-semibold text-[#9A9AAA]">Camera access denied</p>
                  <p className="text-xs font-semibold text-[#9A9AAA] mt-1">Allow camera access to verify your plates.</p>
                </div>
              ) : (
                <>
                  <div className="relative bg-[#1C1C1E] rounded-2xl overflow-hidden aspect-[3/4] ring-2 ring-[#FF4500]/60 animate-pulse-ring">
                    <style>{`@keyframes pulse-ring{0%,100%{box-shadow:0 0 0 0 rgba(255,69,0,0.4)}50%{box-shadow:0 0 0 6px rgba(255,69,0,0)}} .animate-pulse-ring{animation:pulse-ring 2s ease-in-out infinite}`}</style>
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Perspective side-view barbell guide — matches what user actually sees from the side */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <svg viewBox="0 0 150 200" className="w-3/4 opacity-[0.22]" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {photoStep === 'front' ? (
                          <>
                            {/* Front view: standing in front of bench, bar runs left-right, both stacks equal size */}
                            <line x1="30" y1="100" x2="120" y2="100" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                            <ellipse cx="22" cy="100" rx="7" ry="30" fill="white"/>
                            <ellipse cx="28" cy="100" rx="5" ry="22" fill="white" opacity="0.75"/>
                            <ellipse cx="128" cy="100" rx="7" ry="30" fill="white"/>
                            <ellipse cx="122" cy="100" rx="5" ry="22" fill="white" opacity="0.75"/>
                          </>
                        ) : photoStep === 'left' ? (
                          <>
                            {/* Left side: near plates on LEFT (large, face-on), bar extends right in perspective, far plates small */}
                            <ellipse cx="16" cy="100" rx="9" ry="40" fill="white"/>
                            <ellipse cx="23" cy="100" rx="7" ry="31" fill="white" opacity="0.8"/>
                            <ellipse cx="29" cy="100" rx="5" ry="22" fill="white" opacity="0.6"/>
                            <line x1="29" y1="93" x2="128" y2="95" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                            <line x1="29" y1="107" x2="128" y2="105" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                            <ellipse cx="130" cy="100" rx="4" ry="18" fill="white" opacity="0.5"/>
                            <ellipse cx="135" cy="100" rx="3" ry="13" fill="white" opacity="0.35"/>
                          </>
                        ) : (
                          <>
                            {/* Right side: near plates on RIGHT (large, face-on), bar extends left in perspective, far plates small */}
                            <ellipse cx="15" cy="100" rx="4" ry="18" fill="white" opacity="0.5"/>
                            <ellipse cx="20" cy="100" rx="3" ry="13" fill="white" opacity="0.35"/>
                            <line x1="22" y1="95" x2="121" y2="93" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                            <line x1="22" y1="105" x2="121" y2="107" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                            <ellipse cx="121" cy="100" rx="5" ry="22" fill="white" opacity="0.6"/>
                            <ellipse cx="127" cy="100" rx="7" ry="31" fill="white" opacity="0.8"/>
                            <ellipse cx="134" cy="100" rx="9" ry="40" fill="white"/>
                          </>
                        )}
                      </svg>
                    </div>

                    {hasMultipleCams && (
                      <button
                        onClick={() => setFacingMode(m => m === 'environment' ? 'user' : 'environment')}
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white"
                      >
                        <SwitchCamera className="w-4 h-4" />
                      </button>
                    )}
                    <div className="absolute bottom-3 inset-x-3">
                      <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                        <p className="text-[10px] font-bold text-[#FF4500] uppercase tracking-widest mb-0.5">
                          Photo {currentStep.num} of 3 · {currentStep.label}
                        </p>
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

          {/* ── PREVIEW ── */}
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
                  ? 'Submit for Verification'
                  : <><ChevronRight className="w-4 h-4" />Next: {STEPS[stepIndex + 1]?.label}</>
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

          {/* ── ANALYZING ── */}
          {stage === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-10 h-10 text-[#FF4500] animate-spin" />
              <div className="text-center">
                <p className="font-bold text-white">Checking all 3 photos...</p>
                <p className="text-xs font-semibold text-[#9A9AAA] mt-1">Claude Vision is cross-checking both sides and the front</p>
              </div>
            </div>
          )}

          {/* ── RESULT ── */}
          {stage === 'result' && result && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-2">
                {STEPS.map(s => photos[s.step] && (
                  <div key={s.step} className="flex flex-col gap-1">
                    <img src={photos[s.step]!} alt={s.label} className="w-full aspect-square object-cover rounded-xl border border-[#252528]" />
                    <p className="text-[9px] font-bold text-[#636366] uppercase tracking-wide text-center">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border p-4 flex items-center gap-3" style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}>
                {result.verified
                  ? <CheckCircle2 className="w-6 h-6 flex-shrink-0" style={{ color }} />
                  : <AlertTriangle className="w-6 h-6 flex-shrink-0" style={{ color }} />
                }
                <div>
                  <p className="text-sm font-black" style={{ color }}>
                    {result.verified ? `Verified — ${total} lbs` : 'Could not verify'}
                  </p>
                  <p className="text-xs text-[#9A9AAA] mt-0.5">{result.note}</p>
                  {result.demo && <p className="text-[10px] font-semibold text-[#9A9AAA] mt-1">Demo — add ANTHROPIC_API_KEY for real verification</p>}
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onDone(total, result.verified, photos)}
                className="w-full bg-[#FF4500] text-white font-black py-4 rounded-2xl text-sm shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
              >
                {result.verified ? 'Continue to Recording' : 'Continue Anyway (Unverified)'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { setPhotos({ left: null, right: null, front: null }); setPhotoStep('left'); setResult(null); setStage('capture') }}
                className="w-full bg-[#1C1C1E] border border-[#252528] text-[#9A9AAA] font-semibold py-3.5 rounded-2xl text-sm hover:text-white hover:border-[#3A3A3C] transition-all"
              >
                Retake All Photos
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  )
}
