'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Video, Square, Loader2, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react'

type Stage = 'preview' | 'recording' | 'analyzing' | 'result' | 'error'

interface AnalysisResult {
  score: number
  strengths: string[]
  corrections: string[]
  tip: string
  demo?: boolean
}

interface Props {
  exerciseName: string
  onClose: () => void
}

function scoreColor(score: number) {
  if (score >= 85) return '#22C55E'
  if (score >= 65) return '#F59E0B'
  return '#EF4444'
}

function scoreLabel(score: number) {
  if (score >= 90) return 'Elite'
  if (score >= 80) return 'Solid'
  if (score >= 65) return 'Good'
  if (score >= 50) return 'Needs Work'
  return 'Major Issues'
}

const RECORD_SECONDS = 8

export default function FormAnalysisModal({ exerciseName, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const capturedRef = useRef<string[]>([])

  const [stage, setStage] = useState<Stage>('preview')
  const [countdown, setCountdown] = useState(RECORD_SECONDS)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [camError, setCamError] = useState(false)

  // Start camera on mount
  useEffect(() => {
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
      .catch(() => {
        if (active) setCamError(true)
      })
    return () => {
      active = false
      stopCamera()
    }
  }, [])

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
          sendForAnalysis(capturedRef.current)
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
    sendForAnalysis(capturedRef.current)
  }

  async function sendForAnalysis(capturedFrames: string[]) {
    setStage('analyzing')
    try {
      const res = await fetch('/api/analyze-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseName, frames: capturedFrames }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setResult(data)
      setStage('result')
    } catch {
      setStage('error')
    }
  }

  function handleClose() {
    stopCamera()
    onClose()
  }

  const color = result ? scoreColor(result.score) : '#FF4500'

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/90 z-[60]"
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] bg-[#0D0D0F] border-t border-[#252528] rounded-t-3xl z-[70] flex flex-col max-h-[92dvh]"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#3A3A3C]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 flex-shrink-0">
          <div>
            <p className="text-[10px] text-[#636366] font-semibold uppercase tracking-widest mb-0.5">Form Check</p>
            <p className="font-bold text-base truncate max-w-[260px]">{exerciseName}</p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8">

          {/* Camera error */}
          {camError && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Video className="w-10 h-10 text-[#3A3A3C] mb-3" />
              <p className="text-sm font-semibold text-[#9A9AAA]">Camera access denied</p>
              <p className="text-xs text-[#636366] mt-1">Allow camera access in your browser settings to use Form Check.</p>
            </div>
          )}

          {/* Preview + Recording */}
          {!camError && (stage === 'preview' || stage === 'recording') && (
            <div className="flex flex-col gap-4">
              {/* Camera feed */}
              <div className="relative bg-[#1C1C1E] rounded-2xl overflow-hidden aspect-[3/4]">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Recording indicator */}
                {stage === 'recording' && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 rounded-xl px-3 py-1.5 backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold text-white">{countdown}s</span>
                  </div>
                )}

                {/* Overlay guidance */}
                {stage === 'preview' && (
                  <div className="absolute bottom-3 inset-x-3">
                    <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                      <p className="text-xs text-white/80">Position yourself so your full body is visible</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              {stage === 'preview' && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={startRecording}
                  className="w-full bg-[#FF4500] text-white font-bold py-[18px] rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
                >
                  <Video className="w-5 h-5" />
                  Record {RECORD_SECONDS}s of Form
                </motion.button>
              )}

              {stage === 'recording' && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={stopEarly}
                  className="w-full bg-[#1C1C1E] border border-[#3A3A3C] text-white font-bold py-[18px] rounded-2xl flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4 text-red-400" />
                  Stop &amp; Analyze
                </motion.button>
              )}
            </div>
          )}

          {/* Analyzing */}
          {stage === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-10 h-10 text-[#FF4500] animate-spin" />
              <div className="text-center">
                <p className="font-bold text-white">Analyzing your form...</p>
                <p className="text-xs text-[#636366] mt-1">Claude Vision is reviewing your technique</p>
              </div>
            </div>
          )}

          {/* Error */}
          {stage === 'error' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <p className="text-sm font-semibold text-[#9A9AAA]">Analysis failed</p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStage('preview')}
                className="bg-[#FF4500] text-white font-bold px-6 py-3 rounded-xl text-sm"
              >
                Try again
              </motion.button>
            </div>
          )}

          {/* Result */}
          {stage === 'result' && result && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4"
              >
                {/* Score */}
                <div
                  className="rounded-2xl border p-5 flex items-center gap-4"
                  style={{ backgroundColor: `${color}10`, borderColor: `${color}25` }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 border"
                    style={{ backgroundColor: `${color}18`, borderColor: `${color}35` }}
                  >
                    <span className="text-2xl font-black leading-none" style={{ color }}>{result.score}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: `${color}99` }}>/ 100</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#636366] mb-0.5">Form Score</p>
                    <p className="text-xl font-black text-white leading-none" style={{ color }}>{scoreLabel(result.score)}</p>
                    {result.demo && (
                      <p className="text-[10px] text-[#636366] mt-1">Demo — add ANTHROPIC_API_KEY for real analysis</p>
                    )}
                  </div>
                </div>

                {/* Strengths */}
                {result.strengths.length > 0 && (
                  <div className="bg-[#1C1C1E] border border-[#252528] rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                      <p className="text-xs font-bold text-[#22C55E] uppercase tracking-wider">Strengths</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {result.strengths.map((s, i) => (
                        <p key={i} className="text-sm text-[#9A9AAA] leading-snug">{s}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Corrections */}
                {result.corrections.length > 0 && (
                  <div className="bg-[#1C1C1E] border border-[#252528] rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                      <p className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider">Fix These</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {result.corrections.map((c, i) => (
                        <p key={i} className="text-sm text-[#9A9AAA] leading-snug">{c}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tip */}
                {result.tip && (
                  <div className="bg-[#1C1C1E] border border-[#252528] rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-[#FF4500]" />
                      <p className="text-xs font-bold text-[#FF4500] uppercase tracking-wider">Coach Cue</p>
                    </div>
                    <p className="text-sm text-white leading-snug italic">&ldquo;{result.tip}&rdquo;</p>
                  </div>
                )}

                {/* Record again */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setResult(null); capturedRef.current = []; setStage('preview') }}
                  className="w-full bg-[#1C1C1E] border border-[#252528] text-[#9A9AAA] font-semibold py-4 rounded-2xl text-sm hover:text-white hover:border-[#3A3A3C] transition-all"
                >
                  Record Again
                </motion.button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </>
  )
}
