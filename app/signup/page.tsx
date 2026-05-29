'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Dumbbell, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/onboarding` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/onboarding')
    }
  }

  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0A0A0A] px-5">
      <header className="flex items-center justify-center pt-14 pb-10">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-6 h-6 text-[#FF4500]" />
          <span className="text-lg font-bold tracking-tight">CrushLift</span>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 flex flex-col"
      >
        <h2 className="text-2xl font-bold mb-1">Create account</h2>
        <p className="text-[#6B7280] text-sm mb-8">Start crushing your goals today</p>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#9CA3AF] font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="bg-[#141414] border border-[#1F1F1F] rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-[#4B5563] focus:outline-none focus:border-[#FF4500] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#9CA3AF] font-medium">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-[#141414] border border-[#1F1F1F] rounded-xl px-4 py-3.5 pr-12 text-sm text-white placeholder:text-[#4B5563] focus:outline-none focus:border-[#FF4500] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280]"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-[#FF4500] text-white font-bold text-base py-[18px] rounded-2xl mt-2 disabled:opacity-50 shadow-[0_8px_32px_rgba(255,69,0,0.25)]"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </motion.button>
        </form>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[#FF4500] font-medium">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
