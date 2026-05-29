'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Dumbbell, Zap, Play, TrendingUp, ChevronRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0A0A0A]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-6 h-6 text-[#FF4500]" />
          <span className="text-lg font-bold tracking-tight">CrushLift</span>
        </div>
        <Link href="/login" className="text-sm text-[#6B7280] hover:text-white transition-colors">
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col px-5 pt-10 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex-1 flex flex-col"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#FF4500]/10 border border-[#FF4500]/20 rounded-full px-3 py-1 w-fit mb-6">
            <Zap className="w-3.5 h-3.5 text-[#FF4500]" />
            <span className="text-xs text-[#FF4500] font-semibold tracking-wide uppercase">AI-Powered</span>
          </div>

          {/* Headline */}
          <h1 className="text-[2.6rem] font-extrabold leading-[1.1] tracking-tight mb-5">
            Your perfect
            <br />
            workout plan,
            <br />
            <span className="text-[#FF4500]">built by AI.</span>
          </h1>

          <p className="text-[#9CA3AF] text-[1rem] leading-relaxed mb-10">
            Answer 5 questions. Get a personalized plan with demo videos for every exercise. Start crushing your goals today.
          </p>

          {/* Features */}
          <div className="flex flex-col gap-4 mb-12">
            {[
              { icon: Zap, text: 'AI builds your plan in seconds' },
              { icon: Play, text: 'Demo video for every exercise' },
              { icon: TrendingUp, text: 'Log sets and track progress' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#141414] border border-[#1F1F1F] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#FF4500]" />
                </div>
                <span className="text-sm text-[#D1D5DB] font-medium">{text}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-auto">
            <Link href="/signup">
              <motion.button
                whileTap={{ scale: 0.97 }}
                className="w-full bg-[#FF4500] text-white font-bold text-base py-[18px] rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.3)]"
              >
                Build My Plan
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </Link>
            <p className="text-center text-xs text-[#6B7280] mt-3">
              $9.99/month · Cancel anytime
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
