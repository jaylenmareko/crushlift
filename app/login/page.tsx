'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Dumbbell, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/frontend/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/plan')
    }
  }

  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0D0D0F]">
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-10">
        <div className="flex items-center gap-2 mb-10">
          <Dumbbell className="w-5 h-5 text-[#FF4500]" />
          <span className="text-base font-bold tracking-tight">Trainmaxxing</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="bg-[#1C1C1E] border border-[#252528] rounded-3xl p-6">
            <h2 className="text-xl font-bold mb-0.5">Welcome back</h2>
            <p className="text-[#9A9AAA] text-sm mb-6">Sign in to your account</p>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#9A9AAA] font-semibold uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="bg-[#0D0D0F] border border-[#2C2C2E] rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-[#48484A] focus:outline-none focus:border-[#FF4500] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#9A9AAA] font-semibold uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#0D0D0F] border border-[#2C2C2E] rounded-xl px-4 py-3.5 pr-12 text-sm text-white placeholder:text-[#48484A] focus:outline-none focus:border-[#FF4500] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#636366] hover:text-[#AEAEB2] transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-400/8 border border-red-400/15 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                className="w-full bg-[#FF4500] text-white font-bold text-sm py-4 rounded-xl mt-1 disabled:opacity-50 shadow-[0_4px_24px_rgba(255,69,0,0.25)] transition-opacity"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </motion.button>
            </form>
          </div>

          <p className="text-center text-sm text-[#9A9AAA] mt-5">
            Don&apos;t have an account?{' '}
            <Link href="/onboarding" className="text-[#FF4500] font-semibold hover:text-[#FF6020] transition-colors">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
