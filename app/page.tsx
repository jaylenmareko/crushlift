'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Zap, Trophy, Swords } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import LoginSheet from '@/components/LoginSheet'

const FEATURES = [
  { icon: Zap, label: 'AI Plans' },
  { icon: Trophy, label: 'Power Rank' },
  { icon: Swords, label: '1v1 Battles' },
]


export default function LandingPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { router.replace('/plan'); return }
      setReady(true)
    })
  }, [router])

  if (!ready) {
    return <div className="mobile-container min-h-dvh bg-[#0D0D0F]" />
  }

  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0D0D0F] relative overflow-hidden">
      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[320px] bg-[#FF4500]/7 blur-[120px] pointer-events-none rounded-full" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12">

        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="text-center"
        >
          <h1 className="text-[2.6rem] font-black tracking-tight text-white leading-none">TRAINMAXXING</h1>
          <p className="text-[#48484A] text-sm font-medium mt-2 tracking-wide">Train. Compete. Improve.</p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.38 }}
          className="flex gap-2 mt-5"
        >
          {FEATURES.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 bg-[#1C1C1E] border border-[#252528] rounded-full px-3 py-1.5"
            >
              <Icon className="w-3 h-3 text-[#FF4500]" />
              <span className="text-[11px] font-semibold text-[#9A9AAA]">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="px-6 pb-14 pt-6 flex flex-col gap-3"
      >
        <Link href="/onboarding">
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="w-full bg-[#FF4500] text-white font-bold text-[15px] tracking-wide py-[18px] rounded-full shadow-[0_8px_40px_rgba(255,69,0,0.3)]"
          >
            GET STARTED
          </motion.button>
        </Link>
        <button
          onClick={() => setLoginOpen(true)}
          className="w-full bg-[#1C1C1E] border border-[#2C2C2E] text-[#9A9AAA] font-bold text-[15px] tracking-wide py-[18px] rounded-full hover:border-[#3A3A3C] hover:text-white transition-all"
        >
          I HAVE AN ACCOUNT
        </button>
      </motion.div>

      <LoginSheet open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  )
}
