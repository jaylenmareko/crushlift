'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Dumbbell, ChevronRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0D0D0F] relative overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_10%,rgba(255,69,0,0.08)_0%,transparent_70%)] pointer-events-none" />

      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-10 pb-4 relative">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-[#FF4500]" />
          <span className="text-base font-bold tracking-tight">CrushLift</span>
        </div>
        <Link href="/login" className="text-sm text-[#636366] hover:text-white transition-colors font-medium">
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col px-6 pt-12 pb-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex-1 flex flex-col justify-center"
        >
          <p className="text-[11px] font-bold text-[#FF4500] uppercase tracking-[0.2em] mb-4">
            AI-Powered
          </p>

          <h1 className="text-[3rem] font-extrabold leading-[1.0] tracking-tight mb-5">
            Your plan.
            <br />
            Built for
            <br />
            <span className="text-[#FF4500]">you.</span>
          </h1>

          <p className="text-[#636366] text-base leading-relaxed max-w-xs">
            Answer a few questions. Get a personalized workout plan with a demo video for every exercise.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative w-full">
            {/* Glow layer */}
            <motion.div
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute inset-x-6 bottom-0 h-10 bg-[#FF4500] rounded-full blur-2xl pointer-events-none"
            />
            <Link href="/onboarding" className="block w-full">
              <motion.button
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                whileTap={{ scale: 0.97, y: 0 }}
                className="relative w-full bg-[#FF4500] text-white font-bold text-base py-[20px] rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_40px_rgba(255,69,0,0.35)]"
              >
                Build My Plan — Free
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </div>

          <p className="text-xs text-[#3A3A3C]">No account required to get started</p>
        </motion.div>
      </main>
    </div>
  )
}
