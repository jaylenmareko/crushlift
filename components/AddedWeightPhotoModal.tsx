'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Camera, SwitchCamera, ChevronRight, RotateCcw } from 'lucide-react'

type Stage = 'capture' | 'preview'

interface Props {
  liftName: string
  weight: number
  onDone: (verified: boolean, photo: string | null) => void
  onClose: () => void
}

export default function AddedWeightPhotoModal({ liftName, weight, onDone, onClose }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [stage, setStage]           = useState<Stage>('capture')
  const [photo, setPhoto]           = useState<string | null>(null)
  const [camError, setCamError]     = useState(false)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')

  useEffect(() => {
    if (stage !== 'capture') return
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
    setPhoto(data)
    setStage('preview')
  }

  function retakePhoto() {
    setPhoto(null)
    setStage('capture')
  }

  function handleClose() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    onClose()
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
            <p className="text-[10px] text-[#9A9AAA] font-semibold uppercase tracking-widest mb-0.5">Step 1 of 2 · Added Weight</p>
            <p className="font-bold text-base truncate max-w-[260px]">{liftName} · +{weight} lbs</p>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-full bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-8">

          {/* CAPTURE */}
          {stage === 'capture' && (
            <div className="flex flex-col gap-4">
              {camError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Camera className="w-10 h-10 text-[#3A3A3C] mb-3" />
                  <p className="text-sm font-semibold text-[#9A9AAA]">Camera access denied</p>
                  <p className="text-xs text-[#9A9AAA] mt-1">Allow camera access to continue.</p>
                </div>
              ) : (
                <>
                  <div className="relative bg-[#1C1C1E] rounded-2xl overflow-hidden aspect-[3/4] ring-2 ring-[#FF4500]/60">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                    <button
                      onClick={() => setFacingMode(m => m === 'environment' ? 'user' : 'environment')}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-3 inset-x-3">
                      <div className="bg-black/80 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                        <p className="text-[10px] font-bold text-[#FF4500] uppercase tracking-widest mb-1">Added Weight Photo</p>
                        <p className="text-xs text-white/80">Show the weight on your dip belt or chain — numbers must be readable</p>
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

          {/* PREVIEW */}
          {stage === 'preview' && photo && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
              <img src={photo} alt="Added weight" className="w-full aspect-[3/4] object-cover rounded-2xl border border-[#252528]" />
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => onDone(false, photo)}
                className="w-full bg-[#FF4500] text-white font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
              >
                Looks Good · Continue to Recording <ChevronRight className="w-4 h-4" />
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
