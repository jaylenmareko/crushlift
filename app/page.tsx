'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Dumbbell } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0D0D0F] relative overflow-hidden">

      {/* Background blobs */}
      <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-[#FF4500]/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-72 h-72 rounded-full bg-[#FF4500]/4 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-[#FF4500]/4 blur-3xl pointer-events-none" />

      {/* Brand + tagline — upper half */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#FF4500]/10 border border-[#FF4500]/15 flex items-center justify-center mb-2">
            <Dumbbell className="w-7 h-7 text-[#FF4500]" />
          </div>

          <h1 className="text-[3.25rem] font-black tracking-tight text-white leading-none">
            TRAINMAXXING
          </h1>

          <p className="text-[#636366] text-base font-medium">
            Train. Track. Improve.
          </p>
        </motion.div>
      </div>

      {/* Buttons — bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="px-6 pb-14 flex flex-col gap-3"
      >
        {/* Primary CTA with float */}
        <div className="relative">
          <motion.div
            animate={{ opacity: [0.35, 0.6, 0.35] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="absolute inset-x-8 bottom-1 h-8 bg-[#FF4500] rounded-full blur-2xl pointer-events-none"
          />
          <Link href="/onboarding">
            <motion.button
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              whileTap={{ scale: 0.97, y: 0 }}
              className="relative w-full bg-[#FF4500] text-white font-bold text-[15px] tracking-wide py-[18px] rounded-full shadow-[0_8px_40px_rgba(255,69,0,0.3)]"
            >
              GET STARTED
            </motion.button>
          </Link>
        </div>

        <Link href="/login">
          <button className="w-full bg-[#1C1C1E] border border-[#2C2C2E] text-[#9A9AAA] font-bold text-[15px] tracking-wide py-[18px] rounded-full hover:border-[#3A3A3C] hover:text-white transition-all">
            I HAVE AN ACCOUNT
          </button>
        </Link>
      </motion.div>

    </div>
  )
}
