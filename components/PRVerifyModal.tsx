'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Video, Square, Loader2, Clock, SwitchCamera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { uploadPrSession } from '@/lib/upload-pr-media'

type Stage = 'preview' | 'recording' | 'uploading' | 'submitted'

interface Props {
  exerciseName: string
  weight: number
  reps?: number
  platePhotos?: { left: string | null; right: string | null; front: string | null } | null
  onDone: (verified: boolean) => void
  onClose: () => void
}

const MAX_SECONDS = 180

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toString().padStart(2, '0')}`
}

export default function PRVerifyModal({ exerciseName, weight, reps, platePhotos, onDone, onClose }: Props) {
  const videoRef         = useRef<HTMLVideoElement>(null)
  const streamRef        = useRef<MediaStream | null>(null)
  const elapsedTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const videoChunksRef   = useRef<Blob[]>([])
  const videoMimeRef     = useRef('video/webm')
  const elapsedRef       = useRef(0)
  const stoppingRef      = useRef(false)

  const [stage, setStage]           = useState<Stage>('preview')
  const [elapsed, setElapsed]       = useState(0)
  const [camError, setCamError]     = useState(false)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')

  useEffect(() => {
    if (stage !== 'preview' && stage !== 'recording') return
    let active = true
    if (videoRef.current) videoRef.current.srcObject = null
    const timer = setTimeout(() => {
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
    }, 150)
    return () => {
      active = false
      clearTimeout(timer)
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [facingMode, stage])

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current)
  }

  function startRecording() {
    videoChunksRef.current = []
    elapsedRef.current = 0
    stoppingRef.current = false
    setElapsed(0)
    setStage('recording')

    const stream = streamRef.current
    if (stream) {
      const mimeType = ['video/webm;codecs=vp8', 'video/webm', 'video/mp4']
        .find(t => { try { return MediaRecorder.isTypeSupported(t) } catch { return false } }) ?? ''
      videoMimeRef.current = mimeType || 'video/webm'
      try {
        const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
        mr.ondataavailable = e => { if (e.data.size > 0) videoChunksRef.current.push(e.data) }
        mr.start(1000)
        mediaRecorderRef.current = mr
      } catch { /* MediaRecorder not supported */ }
    }

    elapsedTimerRef.current = setInterval(() => {
      elapsedRef.current += 1
      setElapsed(elapsedRef.current)
      if (elapsedRef.current >= MAX_SECONDS) stopAndSubmit()
    }, 1000)
  }

  async function stopAndSubmit() {
    if (stoppingRef.current) return
    stoppingRef.current = true
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current)

    const mr = mediaRecorderRef.current
    if (mr && mr.state !== 'inactive') {
      await new Promise<void>(resolve => {
        mr.addEventListener('stop', () => resolve(), { once: true })
        mr.stop()
      })
    }

    stopCamera()
    setStage('uploading')

    // Upload everything and save as pending review
    const { data: { user } } = await createClient().auth.getUser()
    if (user) {
      const videoBlob = videoChunksRef.current.length > 0
        ? new Blob(videoChunksRef.current, { type: videoMimeRef.current })
        : null
      await uploadPrSession({
        userId: user.id,
        exerciseName,
        declaredWeight: weight,
        declaredReps: reps ?? null,
        verified: false,
        confidence: 'high',
        aiNote: 'Submitted for manual review.',
        platePhotos: platePhotos ?? null,
        videoBlob,
      })
    }

    setStage('submitted')
  }

  function handleClose() {
    stopCamera()
    onClose()
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={stage === 'submitted' ? undefined : handleClose}
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
            <p className="text-[10px] text-[#9A9AAA] font-semibold uppercase tracking-widest mb-0.5">
              {stage === 'submitted' ? 'PR Submitted' : 'Step 2 of 2 · Record Lift'}
            </p>
            <p className="font-bold text-base truncate max-w-[260px]">
              {exerciseName}
              {reps ? ` · ${reps} ${reps === 1 ? 'rep' : 'reps'}` : ''}
              {weight > 0 ? ` · ${weight} lbs` : ''}
            </p>
          </div>
          {stage !== 'submitted' && (
            <button onClick={handleClose} className="w-8 h-8 rounded-full bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8">

          {/* Camera error */}
          {camError && stage !== 'submitted' && stage !== 'uploading' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Video className="w-10 h-10 text-[#3A3A3C] mb-3" />
              <p className="text-sm font-semibold text-[#9A9AAA]">Camera access denied</p>
              <p className="text-xs text-[#9A9AAA] mt-1">Allow camera access to record your PR.</p>
            </div>
          )}

          {/* Camera view — preview + recording */}
          {!camError && (stage === 'preview' || stage === 'recording') && (
            <div className="flex flex-col gap-4">
              <div className="relative bg-[#1C1C1E] rounded-2xl overflow-hidden aspect-[3/4]">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />

                {stage === 'recording' && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 rounded-xl px-3 py-1.5 backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-black text-white tabular-nums">{formatTime(elapsed)}</span>
                  </div>
                )}

                {stage === 'preview' && (
                  <>
                    <button
                      onClick={() => setFacingMode(m => m === 'environment' ? 'user' : 'environment')}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-3 inset-x-3">
                      <div className="bg-black/80 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                        <p className="text-[10px] font-bold text-[#FF4500] uppercase tracking-widest mb-0.5">Set up your phone first</p>
                        <p className="text-xs text-white/80">Prop it to your SIDE — full body head to floor, then press Record</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {stage === 'preview' && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={startRecording}
                  className="w-full bg-[#FF4500] text-white font-bold py-[18px] rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
                >
                  <Video className="w-5 h-5" />
                  Start Recording
                </motion.button>
              )}

              {stage === 'recording' && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={stopAndSubmit}
                  className="w-full bg-red-500/15 border-2 border-red-500 text-white font-black py-[18px] rounded-2xl flex items-center justify-center gap-2"
                >
                  <Square className="w-5 h-5 text-red-400 fill-red-400" />
                  Stop &amp; Submit
                </motion.button>
              )}
            </div>
          )}

          {/* Uploading */}
          {stage === 'uploading' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-10 h-10 text-[#FF4500] animate-spin" />
              <div className="text-center">
                <p className="font-bold text-white">Uploading your PR...</p>
                <p className="text-xs text-[#9A9AAA] mt-1">Hang tight, almost done</p>
              </div>
            </div>
          )}

          {/* Submitted */}
          {stage === 'submitted' && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="w-16 h-16 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/25 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-[#F59E0B]" />
                </div>
                <p className="text-xl font-black text-white text-center">Submitted for review</p>
                <p className="text-sm font-semibold text-[#9A9AAA] text-center leading-relaxed px-4">
                  Your PR and photos have been submitted. Your belt updates once it's approved.
                </p>
              </div>

              <div className="bg-[#1C1C1E] border border-[#252528] rounded-2xl p-4 flex flex-col gap-2">
                <p className="text-[10px] font-bold text-[#9A9AAA] uppercase tracking-widest">What was submitted</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{exerciseName}</span>
                  <span className="text-sm font-black text-[#FF4500]">
                    {reps ? `${reps} ${reps === 1 ? 'rep' : 'reps'}` : ''}{reps && weight > 0 ? ' · ' : ''}{weight > 0 ? `${weight} lbs` : ''}
                  </span>
                </div>
                {platePhotos && (
                  <p className="text-xs font-semibold text-[#636366]">3 plate photos · 1 lift video</p>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onDone(false)}
                className="w-full bg-[#FF4500] text-white font-black py-4 rounded-2xl text-sm shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
              >
                Done
              </motion.button>
            </motion.div>
          )}

        </div>
      </motion.div>
    </>
  )
}
