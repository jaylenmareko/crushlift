'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Camera, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

type Stage = 'capture' | 'analyzing' | 'result'

interface VerifyResult {
  verified: boolean
  confidence: 'high' | 'medium' | 'low'
  note: string
  demo?: boolean
}

interface Props {
  liftName: string
  weight: number
  onDone: (verified: boolean, photo: string | null) => void
  onClose: () => void
}

export default function AddedWeightPhotoModal({ liftName, weight, onDone, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [stage, setStage] = useState<Stage>('capture')
  const [photo, setPhoto] = useState<string | null>(null)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [camError, setCamError] = useState(false)

  useEffect(() => {
    if (stage !== 'capture') return
    let active = true
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(stream => {
        if (!active) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      })
      .catch(() => { if (active) setCamError(true) })
    return () => {
      active = false
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [stage])

  function capturePhoto() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return
    canvas.width = 800
    canvas.height = Math.round((video.videoHeight / video.videoWidth) * 800)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const data = canvas.toDataURL('image/jpeg', 0.8)
    setPhoto(data)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    sendForVerification(data)
  }

  async function sendForVerification(photoData: string) {
    setStage('analyzing')
    try {
      const res = await fetch('/api/verify-added-weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: photoData, declaredWeight: weight, liftName }),
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

  function retakePhoto() {
    setPhoto(null)
    setResult(null)
    setStage('capture')
  }

  function handleClose() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    onClose()
  }

  const color = result ? (result.verified ? '#22C55E' : '#F59E0B') : '#FF4500'

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
            <p className="text-[10px] text-[#9A9AAA] font-semibold uppercase tracking-widest mb-0.5">Verify Added Weight</p>
            <p className="font-bold text-base truncate max-w-[260px]">{liftName} · +{weight} lbs</p>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-full bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8">

          {/* Camera */}
          {stage === 'capture' && (
            <div className="flex flex-col gap-4">
              {camError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Camera className="w-10 h-10 text-[#3A3A3C] mb-3" />
                  <p className="text-sm font-semibold text-[#9A9AAA]">Camera access denied</p>
                  <p className="text-xs text-[#9A9AAA] mt-1">Allow camera access to verify your added weight.</p>
                </div>
              ) : (
                <>
                  <div className="relative bg-[#1C1C1E] rounded-2xl overflow-hidden aspect-[3/4]">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute bottom-3 inset-x-3">
                      <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                        <p className="text-xs text-white/80">Show the weight attached to your dip belt or chain — make sure the numbers are readable</p>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={capturePhoto}
                    className="w-full bg-[#FF4500] text-white font-bold py-[18px] rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
                  >
                    <Camera className="w-5 h-5" />
                    Capture Photo
                  </motion.button>
                </>
              )}
            </div>
          )}

          {/* Analyzing */}
          {stage === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              {photo && (
                <img src={photo} alt="Captured added weight" className="w-32 h-32 object-cover rounded-2xl border border-[#252528]" />
              )}
              <Loader2 className="w-10 h-10 text-[#FF4500] animate-spin" />
              <div className="text-center">
                <p className="font-bold text-white">Checking your added weight...</p>
                <p className="text-xs text-[#9A9AAA] mt-1">Claude Vision is reading the setup</p>
              </div>
            </div>
          )}

          {/* Result */}
          {stage === 'result' && result && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
              {photo && (
                <img src={photo} alt="Captured added weight" className="w-full aspect-[3/4] object-cover rounded-2xl border border-[#252528]" />
              )}
              <div className="rounded-2xl border p-4 flex items-center gap-3" style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}>
                {result.verified
                  ? <CheckCircle2 className="w-6 h-6 flex-shrink-0" style={{ color }} />
                  : <AlertTriangle className="w-6 h-6 flex-shrink-0" style={{ color }} />
                }
                <div>
                  <p className="text-sm font-black" style={{ color }}>
                    {result.verified ? `Verified — +${weight} lbs` : 'Could not verify'}
                  </p>
                  <p className="text-xs text-[#9A9AAA] mt-0.5">{result.note}</p>
                  {result.demo && <p className="text-[10px] text-[#9A9AAA] mt-1">Demo — add ANTHROPIC_API_KEY for real verification</p>}
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onDone(result.verified, photo)}
                className="w-full bg-[#FF4500] text-white font-black py-4 rounded-2xl text-sm shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
              >
                {result.verified ? 'Continue to Recording' : 'Continue Anyway (Unverified)'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={retakePhoto}
                className="w-full bg-[#1C1C1E] border border-[#252528] text-[#9A9AAA] font-semibold py-3.5 rounded-2xl text-sm hover:text-white hover:border-[#3A3A3C] transition-all"
              >
                Retake Photo
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  )
}
