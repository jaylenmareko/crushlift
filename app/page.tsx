'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Zap, Trophy, Swords, ChevronRight, Flame } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import LoginSheet from '@/components/LoginSheet'

const BELT_TIERS = [
  { label: 'Iron',     color: '#A1A1AA', dot: '#A1A1AA' },
  { label: 'Bronze',   color: '#CD853F', dot: '#CD853F' },
  { label: 'Silver',   color: '#C0C0C0', dot: '#C0C0C0' },
  { label: 'Gold',     color: '#F59E0B', dot: '#F59E0B' },
  { label: 'Platinum', color: '#06B6D4', dot: '#06B6D4' },
]

const FEATURES = [
  {
    icon: Zap,
    title: 'AI Training Plans',
    desc: 'Built around your PRs, schedule, and goals. Updates as you progress.',
  },
  {
    icon: Trophy,
    title: 'Power Rank',
    desc: 'Earn a belt per lift based on real verified PRs and strength standards.',
  },
  {
    icon: Swords,
    title: '1v1 Battles',
    desc: 'Challenge lifters in your weight class. Record live. Climb the ranks.',
  },
]

const STATS = [
  { num: '1.2K', label: 'Lifters' },
  { num: '45K',  label: 'PRs' },
  { num: '3.2K', label: 'Battles' },
]

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.38, delay, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
})

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

      {/* Background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[380px] bg-[#FF4500]/8 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-40 right-0 w-[250px] h-[200px] bg-[#FF4500]/4 blur-[100px] pointer-events-none rounded-full" />

      {/* Scrollable body */}
      <div className="flex-1 flex flex-col px-5 pt-14 pb-4 overflow-y-auto">

        {/* App icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.38, delay: 0.08, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex justify-center mb-7"
        >
          <div className="w-[72px] h-[72px] rounded-[22px] bg-gradient-to-br from-[#FF4500] to-[#CC3300] flex items-center justify-center shadow-[0_0_50px_rgba(255,69,0,0.35)]">
            <Flame className="w-9 h-9 text-white" />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div {...fadeUp(0.18)} className="text-center mb-7">
          <h1 className="text-[2.75rem] font-black tracking-[-0.02em] text-white leading-[1.05] mb-3">
            Compete for rank.<br />Earn your belt.
          </h1>
          <p className="text-[#9A9AAA] text-[14px] font-medium leading-relaxed px-3">
            AI-powered training meets real competition.
            Your PRs earn you a rank — fight to keep it.
          </p>
        </motion.div>

        {/* Belt tier strip */}
        <motion.div {...fadeUp(0.28)} className="mb-7">
          <p className="text-[10px] font-bold text-[#48484A] uppercase tracking-[0.18em] text-center mb-3">Rank progression</p>
          <div className="flex items-end justify-between gap-1.5 bg-[#141416] border border-[#252528] rounded-2xl px-5 py-4">
            {BELT_TIERS.map((tier, i) => (
              <div key={tier.label} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className="w-full rounded-lg flex items-center justify-center"
                  style={{
                    height: 8 + i * 5,
                    backgroundColor: `${tier.color}20`,
                    border: `1px solid ${tier.color}35`,
                  }}
                />
                <span className="text-[8px] font-black tracking-wide" style={{ color: tier.color }}>
                  {tier.label.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div {...fadeUp(0.35)} className="mb-6">
          <div className="flex justify-between bg-[#141416] border border-[#252528] rounded-2xl px-5 py-4">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={`text-center flex-1 ${i !== STATS.length - 1 ? 'border-r border-[#252528] mr-2 pr-2' : ''}`}
              >
                <p className="text-[17px] font-black text-white leading-none">{s.num}</p>
                <p className="text-[10px] font-semibold text-[#636366] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Feature cards */}
        <motion.div {...fadeUp(0.42)} className="flex flex-col gap-2.5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-3.5 bg-[#141416] border border-[#252528] rounded-2xl px-4 py-4"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FF4500]/10 border border-[#FF4500]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-[18px] h-[18px] text-[#FF4500]" />
              </div>
              <div>
                <p className="text-sm font-black text-white">{title}</p>
                <p className="text-[12px] font-medium text-[#636366] mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

      </div>

      {/* CTAs — fixed at bottom */}
      <motion.div
        {...fadeUp(0.52)}
        className="px-5 pb-12 pt-4 flex flex-col gap-3 flex-shrink-0 bg-gradient-to-t from-[#0D0D0F] via-[#0D0D0F] to-transparent"
      >
        <Link href="/onboarding">
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="w-full bg-[#FF4500] text-white font-black text-[15px] tracking-wider py-[18px] rounded-2xl shadow-[0_8px_40px_rgba(255,69,0,0.3)] flex items-center justify-center gap-2"
          >
            GET STARTED <ChevronRight className="w-4 h-4" />
          </motion.button>
        </Link>
        <button
          onClick={() => setLoginOpen(true)}
          className="w-full bg-[#141416] border border-[#252528] text-[#9A9AAA] font-bold text-[15px] py-[18px] rounded-2xl hover:border-[#3A3A3C] hover:text-white transition-colors"
        >
          I HAVE AN ACCOUNT
        </button>
      </motion.div>

      <LoginSheet open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  )
}
