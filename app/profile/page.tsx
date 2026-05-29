'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogOut, Crown, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import BottomNav from '@/components/BottomNav'
import PaywallModal from '@/components/PaywallModal'

export default function ProfilePage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setEmail(user.email || '')
      supabase.from('profiles').select('subscription_status').eq('id', user.id).single()
        .then(({ data }) => setStatus(data?.subscription_status || null))
    })
  }, [router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  async function handleNewPlan() {
    router.push('/onboarding')
  }

  const isSubscribed = status === 'active' || status === 'trialing'

  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0A0A0A] has-bottom-nav">
      <header className="px-5 pt-12 pb-6">
        <h1 className="text-2xl font-bold">Profile</h1>
      </header>

      <div className="flex-1 px-5 flex flex-col gap-4">
        {/* Account card */}
        <div className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-4">
          <p className="text-xs text-[#6B7280] font-medium uppercase tracking-wider mb-1">Account</p>
          <p className="text-sm font-semibold truncate">{email}</p>
        </div>

        {/* Subscription card */}
        <div className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#6B7280] font-medium uppercase tracking-wider mb-1">Plan</p>
              <div className="flex items-center gap-2">
                {isSubscribed && <Crown className="w-4 h-4 text-[#FF4500]" />}
                <p className="text-sm font-semibold">
                  {isSubscribed ? 'CrushLift Pro' : 'No plan'}
                </p>
              </div>
              {status && (
                <p className="text-xs text-[#6B7280] mt-0.5 capitalize">{status}</p>
              )}
            </div>
            {!isSubscribed && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowPaywall(true)}
                className="bg-[#FF4500] text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Upgrade
              </motion.button>
            )}
          </div>
        </div>

        {/* Actions */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleNewPlan}
          className="flex items-center gap-3 bg-[#141414] border border-[#1F1F1F] rounded-2xl p-4 text-left"
        >
          <RefreshCw className="w-5 h-5 text-[#FF4500]" />
          <div>
            <p className="text-sm font-semibold">Generate New Plan</p>
            <p className="text-xs text-[#6B7280]">Answer the questions again</p>
          </div>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className="flex items-center gap-3 bg-[#141414] border border-[#1F1F1F] rounded-2xl p-4 text-left"
        >
          <LogOut className="w-5 h-5 text-red-400" />
          <p className="text-sm font-semibold text-red-400">Sign Out</p>
        </motion.button>
      </div>

      <BottomNav active="profile" />
      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  )
}
