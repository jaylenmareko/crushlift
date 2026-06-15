'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Video, Square, Loader2, CheckCircle2, AlertTriangle, SwitchCamera } from 'lucide-react'

type Stage = 'preview' | 'recording' | 'analyzing' | 'result'

interface VerifyResult {
  verified: boolean
  confidence: 'high' | 'medium' | 'low'
  note: string
  demo?: boolean
}

interface Props {
  exerciseName: string
  weight: number
  reps?: number
  platePhoto?: string | null
  onDone: (verified: boolean) => void
  onClose: () => void
}

const RECORD_SECONDS = 8

export default function PRVerifyModal({ exerciseName, weight, reps, platePhoto, onDone, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const capturedRef = useRef<string[]>([])

  const [stage, setStage] = useState<Stage>('preview')
  const [countdown, setCountdown] = useState(RECORD_SECONDS)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [camError, setCamError] = useState(false)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')

  useEffect(() => {
    let active = true
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode }, audio: false })
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
      stopCamera()
    }
  }, [facingMode])

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (frameTimerRef.current) clearInterval(frameTimerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
  }

  function captureFrame(): string | null {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return null
    canvas.width = 640
    canvas.height = Math.round((video.videoHeight / video.videoWidth) * 640)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.7)
  }

  function startRecording() {
    capturedRef.current = []
    setCountdown(RECORD_SECONDS)
    setStage('recording')

    frameTimerRef.current = setInterval(() => {
      const f = captureFrame()
      if (f) capturedRef.current.push(f)
    }, 2000)

    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(countdownRef.current!)
          clearInterval(frameTimerRef.current!)
          const f = captureFrame()
          if (f) capturedRef.current.push(f)
          sendForVerification(capturedRef.current)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  function stopEarly() {
    clearInterval(countdownRef.current!)
    clearInterval(frameTimerRef.current!)
    const f = captureFrame()
    if (f) capturedRef.current.push(f)
    if (capturedRef.current.length === 0) { setStage('preview'); return }
    sendForVerification(capturedRef.current)
  }

  async function sendForVerification(frames: string[]) {
    setStage('analyzing')
    try {
      const res = await fetch('/api/verify-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseName, declaredWeight: weight, reps, frames, platePhoto }),
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

  function retake() {
    setResult(null)
    capturedRef.current = []
    setStage('preview')
  }

  function handleClose() {
    stopCamera()
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
            <p className="text-[10px] text-[#9A9AAA] font-semibold uppercase tracking-widest mb-0.5">PR Verify</p>
            <p className="font-bold text-base truncate max-w-[260px]">
              {exerciseName}
              {reps ? ` · ${reps} ${reps === 1 ? 'rep' : 'reps'}` : ''}
              {weight > 0 ? ` · ${weight} lbs` : ''}
            </p>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-full bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8">

          {camError && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Video className="w-10 h-10 text-[#3A3A3C] mb-3" />
              <p className="text-sm font-semibold text-[#9A9AAA]">Camera access denied</p>
              <p className="text-xs text-[#9A9AAA] mt-1">Allow camera access to record your PR.</p>
            </div>
          )}

          {!camError && (stage === 'preview' || stage === 'recording') && (
            <div className="flex flex-col gap-4">
              <div className="relative bg-[#1C1C1E] rounded-2xl overflow-hidden aspect-[3/4]">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />

                {stage === 'recording' && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 rounded-xl px-3 py-1.5 backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold text-white">{countdown}s</span>
                  </div>
                )}

                {stage === 'preview' && (
                  <button
                    onClick={() => setFacingMode(m => m === 'environment' ? 'user' : 'environment')}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                )}

                {stage === 'preview' && (
                  <div className="absolute bottom-3 inset-x-3">
                    <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                      <p className="text-xs text-white/80">Capture the full lift — setup through lockout/finish</p>
                    </div>
                  </div>
                )}
              </div>

              {stage === 'preview' && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={startRecording}
                  className="w-full bg-[#FF4500] text-white font-bold py-[18px] rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
                >
                  <Video className="w-5 h-5" />
                  Record {RECORD_SECONDS}s PR Attempt
                </motion.button>
              )}

              {stage === 'recording' && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={stopEarly}
                  className="w-full bg-[#1C1C1E] border border-[#3A3A3C] text-white font-bold py-[18px] rounded-2xl flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4 text-red-400" />
                  Stop &amp; Verify
                </motion.button>
              )}
            </div>
          )}

          {stage === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-10 h-10 text-[#FF4500] animate-spin" />
              <div className="text-center">
                <p className="font-bold text-white">Verifying your PR...</p>
                <p className="text-xs text-[#9A9AAA] mt-1">Claude Vision is checking the rep</p>
              </div>
            </div>
          )}

          {stage === 'result' && result && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
              <div className="rounded-2xl border p-4 flex items-center gap-3" style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}>
                {result.verified
                  ? <CheckCircle2 className="w-6 h-6 flex-shrink-0" style={{ color }} />
                  : <AlertTriangle className="w-6 h-6 flex-shrink-0" style={{ color }} />
                }
                <div>
                  <p className="text-sm font-black" style={{ color }}>
                    {result.verified ? 'PR Verified' : 'Could not verify'}
                  </p>
                  <p className="text-xs text-[#9A9AAA] mt-0.5">{result.note}</p>
                  {result.demo && <p className="text-[10px] text-[#9A9AAA] mt-1">Demo — add ANTHROPIC_API_KEY for real verification</p>}
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onDone(result.verified)}
                className="w-full bg-[#FF4500] text-white font-black py-4 rounded-2xl text-sm shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
              >
                {result.verified ? 'Log PR' : 'Log Anyway (Unverified)'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={retake}
                className="w-full bg-[#1C1C1E] border border-[#252528] text-[#9A9AAA] font-semibold py-3.5 rounded-2xl text-sm hover:text-white hover:border-[#3A3A3C] transition-all"
              >
                Record Again
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  )
}
