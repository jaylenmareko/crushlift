'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Video, Square, Clock, Loader2, SwitchCamera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Stage = 'detail' | 'camera' | 'uploading' | 'submitted'

export interface ActiveMatch {
  opponent: string
  lift: string
  format: 'weight' | 'reps'
  yourSubmitted: boolean
  yourNumber: number | null
  theirSubmitted: boolean
  theirNumber: number | null
  status: 'in_progress' | 'ready' | 'decided'
  winner: string | null
  daysLeft: number
}

interface Props {
  match: ActiveMatch | null
  onClose: () => void
  onSubmitted?: (number: number) => void
}

const COLORS = ['#FF4500','#3B82F6','#22C55E','#F59E0B','#8B5CF6','#EF4444','#06B6D4']
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}
function initials(name: string) {
  return name.split(/[\s_]/).map(p => p[0]).join('').toUpperCase().slice(0, 2)
}
function formatTime(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toString().padStart(2, '0')}`
}

const MAX_SECONDS = 180

export default function MatchDetailSheet({ match, onClose, onSubmitted }: Props) {
  const [stage, setStage] = useState<Stage>('detail')
  const [isRecording, setIsRecording] = useState(false)
  const [declaredNumber, setDeclaredNumber] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [camError, setCamError] = useState(false)
  const [submittedNumber, setSubmittedNumber] = useState<number | null>(null)

  const videoRef         = useRef<HTMLVideoElement>(null)
  const streamRef        = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const videoChunksRef   = useRef<Blob[]>([])
  const videoMimeRef     = useRef('video/webm')
  const elapsedTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedRef       = useRef(0)
  const stoppingRef      = useRef(false)
  const supabase         = createClient()

  // Reset when match changes
  useEffect(() => {
    if (match) {
      setStage(match.yourSubmitted ? 'submitted' : 'detail')
      setDeclaredNumber('')
      setElapsed(0)
      setIsRecording(false)
      setCamError(false)
      stoppingRef.current = false
    }
  }, [match?.opponent])

  // Camera lifecycle — only runs when stage === 'camera'
  useEffect(() => {
    if (stage !== 'camera') return
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
  }, [stage, facingMode])

  function startRecording() {
    if (!streamRef.current || isRecording) return
    stoppingRef.current = false
    videoChunksRef.current = []
    elapsedRef.current = 0
    setElapsed(0)

    const mimeType = ['video/webm;codecs=vp8', 'video/webm', 'video/mp4']
      .find(t => { try { return MediaRecorder.isTypeSupported(t) } catch { return false } }) ?? ''
    videoMimeRef.current = mimeType || 'video/webm'

    const mr = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined)
    mr.ondataavailable = e => { if (e.data.size > 0) videoChunksRef.current.push(e.data) }
    mr.start(1000)
    mediaRecorderRef.current = mr
    setIsRecording(true)

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

    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setIsRecording(false)
    setStage('uploading')

    const blob = new Blob(videoChunksRef.current, { type: videoMimeRef.current })
    const ext  = videoMimeRef.current.includes('mp4') ? 'mp4' : 'webm'
    const num  = parseInt(declaredNumber) || 0

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const path = `${user.id}/matches/${Date.now()}/lift.${ext}`
      supabase.storage.from('pr-media')
        .upload(path, blob, { contentType: videoMimeRef.current, upsert: true })
        .catch(() => {})
    }

    setSubmittedNumber(num)
    setStage('submitted')
    onSubmitted?.(num)
  }

  if (!match) return null

  const av       = avatarColor(match.opponent)
  const unit     = match.format === 'weight' ? 'lbs' : 'reps'
  const canRecord = declaredNumber.trim() !== '' && parseInt(declaredNumber) > 0
  const isDecided = match.status === 'decided'
  const youWon    = match.winner === 'You'
  const firstName = match.opponent.split(' ')[0]
  const yourFinalNumber = submittedNumber ?? match.yourNumber

  return (
    <AnimatePresence>
      {match && (
        <>
          {/* Backdrop */}
          <motion.div key="match-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={stage === 'camera' ? undefined : onClose}
            className="fixed inset-0 bg-black/85 z-[60]"
          />

          {/* Bottom sheet */}
          <motion.div key="match-sheet"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] bg-[#0D0D0F] border-t border-[#252528] rounded-t-3xl z-[70] flex flex-col max-h-[92dvh]"
          >
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-[#3A3A3C]" />
            </div>

            <div className="flex items-center justify-between px-5 pt-2 pb-4 flex-shrink-0">
              <div>
                <p className="text-[10px] font-bold text-[#FF4500] uppercase tracking-[0.2em]">1v1 Battle</p>
                <p className="text-lg font-black text-white">vs {match.opponent}</p>
                <p className="text-xs font-semibold text-[#9A9AAA] mt-0.5">
                  {match.lift} · {match.format === 'weight' ? 'Most Weight' : 'Most Reps'}
                </p>
              </div>
              {stage !== 'camera' && (
                <button onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA]">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-8">

              {/* Fighters strip */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                <div className="flex items-center gap-2.5 bg-[#1C1C1E] border border-[#FF4500]/25 rounded-2xl p-3">
                  <div className="w-10 h-10 rounded-full bg-[#FF450022] border border-[#FF450055] flex items-center justify-center text-xs font-black text-[#FF4500] flex-shrink-0">
                    ME
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white">You</p>
                    {(stage === 'submitted' || match.yourSubmitted) && yourFinalNumber ? (
                      <p className="text-xs font-semibold text-[#22C55E] truncate">{yourFinalNumber} {unit} ✓</p>
                    ) : (
                      <p className="text-xs font-semibold text-[#636366]">Not submitted</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 bg-[#1C1C1E] border border-[#252528] rounded-2xl p-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ backgroundColor: `${av}22`, color: av, border: `2px solid ${av}55` }}>
                    {initials(match.opponent)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white truncate">{firstName}</p>
                    {match.theirSubmitted ? (
                      <p className="text-xs font-semibold text-[#9A9AAA] truncate">{match.theirNumber} {unit} ✓</p>
                    ) : (
                      <p className="text-xs font-semibold text-[#636366]">Waiting...</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status / action area */}
              {isDecided ? (
                <div className="rounded-2xl border p-5 text-center"
                  style={{ backgroundColor: youWon ? '#22C55E12' : '#EF444412', borderColor: youWon ? '#22C55E40' : '#EF444440' }}>
                  <p className="text-2xl font-black mb-1.5" style={{ color: youWon ? '#22C55E' : '#EF4444' }}>
                    {youWon ? 'You Won' : 'You Lost'}
                  </p>
                  <p className="text-xs font-semibold text-[#9A9AAA]">
                    {youWon
                      ? `${yourFinalNumber} ${unit} beat ${match.theirNumber} ${unit}`
                      : `${match.theirNumber} ${unit} beat ${yourFinalNumber} ${unit}`}
                  </p>
                </div>

              ) : stage === 'submitted' || match.yourSubmitted ? (
                <div className="rounded-2xl bg-[#1C1C1E] border border-[#252528] p-5 text-center">
                  {match.theirSubmitted ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse mx-auto mb-3" />
                      <p className="text-sm font-black text-white mb-1">Waiting for review</p>
                      <p className="text-xs font-semibold text-[#9A9AAA]">Both submissions in — results coming soon</p>
                    </>
                  ) : (
                    <>
                      <Clock className="w-6 h-6 text-[#F59E0B] mx-auto mb-3" />
                      <p className="text-sm font-black text-white mb-1">Waiting for {firstName}</p>
                      <p className="text-xs font-semibold text-[#9A9AAA]">You're locked in — they still need to record</p>
                    </>
                  )}
                </div>

              ) : stage === 'uploading' ? (
                <div className="flex flex-col items-center py-10 gap-3">
                  <Loader2 className="w-8 h-8 text-[#FF4500] animate-spin" />
                  <p className="text-sm font-semibold text-[#9A9AAA]">Submitting your lift...</p>
                </div>

              ) : (
                <>
                  <p className="text-[10px] font-bold text-[#9A9AAA] uppercase tracking-widest mb-2">
                    {match.format === 'weight' ? 'How much are you lifting?' : 'How many reps?'}
                  </p>
                  <div className="flex items-center bg-[#161618] border border-[#252528] rounded-2xl px-4 py-4 gap-3 mb-4">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={declaredNumber}
                      onChange={e => setDeclaredNumber(e.target.value)}
                      placeholder={match.format === 'weight' ? '225' : '10'}
                      className="flex-1 bg-transparent text-white text-xl font-bold focus:outline-none placeholder:text-[#48484A]"
                    />
                    <span className="text-sm font-bold text-[#9A9AAA]">{unit}</span>
                  </div>

                  <motion.button whileTap={{ scale: 0.97 }}
                    disabled={!canRecord}
                    onClick={() => setStage('camera')}
                    className="w-full bg-[#FF4500] text-white font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.25)] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Video className="w-4 h-4" /> Record Your Lift
                  </motion.button>
                  {!canRecord && (
                    <p className="text-xs text-[#636366] text-center mt-2">
                      Enter your {unit} first to unlock recording
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>

          {/* Full-screen camera overlay */}
          <AnimatePresence>
            {stage === 'camera' && (
              <motion.div key="camera-overlay"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-[80] flex flex-col"
              >
                <div className="flex-1 relative overflow-hidden">
                  {camError ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <p className="text-white text-sm font-semibold">Camera unavailable</p>
                      <button onClick={() => setStage('detail')}
                        className="text-[#FF4500] text-sm font-bold">Go back</button>
                    </div>
                  ) : (
                    <video ref={videoRef} autoPlay playsInline muted
                      className="w-full h-full object-cover" />
                  )}

                  {/* Timer — only when recording */}
                  {isRecording && (
                    <div className="absolute top-14 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 rounded-full px-4 py-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-white font-black tabular-nums text-sm">{formatTime(elapsed)}</span>
                    </div>
                  )}

                  {/* Flip camera — only before recording */}
                  {!isRecording && (
                    <button
                      onClick={() => setFacingMode(f => f === 'environment' ? 'user' : 'environment')}
                      className="absolute top-14 right-5 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center"
                    >
                      <SwitchCamera className="w-5 h-5 text-white" />
                    </button>
                  )}

                  {/* Instruction */}
                  {!isRecording && (
                    <div className="absolute bottom-36 left-0 right-0 px-5">
                      <div className="bg-black/75 rounded-2xl px-4 py-3 text-center">
                        <p className="text-white text-xs font-semibold leading-relaxed">
                          Prop phone to your SIDE — full body visible head to floor, then press Record
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="px-5 pb-10 pt-4 bg-black flex flex-col gap-3">
                  {!isRecording ? (
                    <>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={startRecording}
                        className="w-full bg-[#FF4500] text-white font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.3)]">
                        <div className="w-3 h-3 rounded-full bg-white" /> Start Recording
                      </motion.button>
                      <button onClick={() => setStage('detail')}
                        className="text-[#636366] text-sm font-semibold text-center py-2">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <motion.button whileTap={{ scale: 0.97 }} onClick={stopAndSubmit}
                      className="w-full bg-red-500/15 border-2 border-red-500 text-white font-black py-[18px] rounded-2xl flex items-center justify-center gap-2">
                      <Square className="w-5 h-5 text-red-400 fill-red-400" />
                      Stop &amp; Submit
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )
}
