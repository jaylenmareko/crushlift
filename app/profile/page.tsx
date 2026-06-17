'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogOut, Crown, RefreshCw, Settings, Calendar, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import BottomNav from '@/components/BottomNav'
import PaywallModal from '@/components/PaywallModal'
import { initials, avatarColor } from '@/lib/avatar'
import type { WorkoutHistoryEntry } from '@/lib/types'

export default function ProfilePage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [username, setUsername] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [sessions, setSessions] = useState<WorkoutHistoryEntry[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [memoriesLoading, setMemoriesLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      const raw = localStorage.getItem('trainmaxxing_workout_history')
      const local: WorkoutHistoryEntry[] = raw
        ? JSON.parse(raw).filter((e: WorkoutHistoryEntry) => !e.id.startsWith('dummy-'))
        : []

      if (!user) {
        setSessions(local)
        setMemoriesLoading(false)
        return
      }

      setEmail(user.email || '')
      supabase.from('profiles').select('subscription_status, first_name, username').eq('id', user.id).single()
        .then(({ data }) => {
          setStatus(data?.subscription_status || null)
          // fall back to auth metadata if the profiles row predates name persistence
          setFirstName(data?.first_name || user.user_metadata?.first_name || '')
          setUsername(data?.username || user.user_metadata?.username || '')
        })

      supabase
        .from('workout_sessions')
        .select('id, day_name, day_number, started_at')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(20)
        .then(({ data }) => {
          const remote: WorkoutHistoryEntry[] = (data || []).map(s => ({
            id: s.id,
            date: s.started_at,
            dayName: s.day_name,
            dayNumber: s.day_number,
            exercises: [],
          }))
          const seen = new Set<string>()
          const merged = [...local, ...remote]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .filter(e => {
              const d = e.date.slice(0, 10)
              if (seen.has(d)) return false
              seen.add(d)
              return true
            })
          setSessions(merged)
          setMemoriesLoading(false)
        })
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    ;['trainmaxxing_workout_history', 'trainmaxxing_inprogress_workout'].forEach(k => localStorage.removeItem(k))
    sessionStorage.clear()
    router.push('/')
  }

  const isSubscribed = status === 'active' || status === 'trialing'

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  function totalSets(entry: WorkoutHistoryEntry) {
    return entry.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0)
  }

  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0D0D0F] has-bottom-nav relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[280px] bg-[#FF4500]/5 blur-[100px] pointer-events-none rounded-full" />
      <header className="flex items-center justify-between px-5 pt-12 pb-6 relative z-10">
        <div>
          <p className="text-[11px] font-bold text-[#FF4500]/70 uppercase tracking-widest mb-1">Trainmaxxing</p>
          <h1 className="text-[2rem] font-black uppercase tracking-tight leading-none">Profile</h1>
        </div>
        <button
          onClick={() => router.push('/settings')}
          className="w-9 h-9 rounded-xl bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA] hover:text-white transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 px-5 flex flex-col gap-4 pb-6 relative z-10">
        {/* Account */}
        <div className="bg-[#1C1C1E] border border-[#252528] rounded-2xl p-4">
          <p className="text-[11px] font-bold text-[#FF4500]/70 uppercase tracking-widest mb-2">Account</p>
          {email ? (
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black"
                style={{ backgroundColor: `${avatarColor(username || firstName || email)}22`, color: avatarColor(username || firstName || email), border: `1.5px solid ${avatarColor(username || firstName || email)}55` }}
              >
                {initials(firstName || username || email)}
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-white truncate">{firstName || (username ? `@${username}` : 'Athlete')}</p>
                {username && <p className="text-xs font-semibold text-[#9A9AAA] truncate">@{username}</p>}
                <p className="text-xs text-[#636366] truncate mt-0.5">{email}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#9A9AAA]">Guest</p>
              <div className="flex items-center gap-3">
                <a href="/login" className="text-xs text-[#9A9AAA] font-semibold hover:text-white transition-colors">Sign in</a>
                <a href="/onboarding" className="text-xs text-[#FF4500] font-semibold">Create account →</a>
              </div>
            </div>
          )}
        </div>

        {/* Subscription */}
        <div className="bg-[#1C1C1E] border border-[#252528] rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-[#FF4500]/70 uppercase tracking-widest mb-1">Plan</p>
              <div className="flex items-center gap-2">
                {isSubscribed && <Crown className="w-4 h-4 text-[#FF4500]" />}
                <p className="text-sm font-semibold">{isSubscribed ? 'Trainmaxxing Pro' : 'Free'}</p>
              </div>
              {status && <p className="text-xs text-[#9A9AAA] mt-0.5 capitalize">{status}</p>}
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
          onClick={() => router.push('/onboarding')}
          className="flex items-center gap-3 bg-[#1C1C1E] border border-[#252528] rounded-2xl p-4 text-left"
        >
          <RefreshCw className="w-5 h-5 text-[#FF4500]" />
          <div>
            <p className="text-sm font-semibold">Generate New Plan</p>
            <p className="text-xs text-[#9A9AAA]">Answer the questions again</p>
          </div>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className="flex items-center gap-3 bg-[#1C1C1E] border border-[#252528] rounded-2xl p-4 text-left"
        >
          <LogOut className="w-5 h-5 text-red-400" />
          <p className="text-sm font-semibold text-red-400">Sign Out</p>
        </motion.button>

        {/* Memories */}
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-lg font-black uppercase tracking-tight">Memories</p>
            {!memoriesLoading && (
              <span className="text-xs font-semibold text-[#9A9AAA]">{sessions.length} workouts</span>
            )}
          </div>

          {memoriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center bg-[#1C1C1E] border border-[#252528] rounded-2xl">
              <Dumbbell className="w-10 h-10 text-[#3A3A3C] mb-3" />
              <p className="text-sm text-[#9A9AAA]">No workouts logged yet.</p>
              <p className="text-xs font-semibold text-[#9A9AAA] mt-1">Finish a workout to see it here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sessions.map((s, i) => {
                const isOpen = expanded === s.id
                const sets = totalSets(s)
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-[#1C1C1E] border border-[#252528] rounded-2xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpanded(isOpen ? null : s.id)}
                      className="w-full flex items-center gap-3 p-4 text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center flex-shrink-0">
                        <Dumbbell className="w-4 h-4 text-[#22C55E]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{s.dayName}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-[#9A9AAA]">
                            <Calendar className="w-3 h-3" />{formatDate(s.date)}
                          </span>
                          {sets > 0 && <span className="text-xs font-semibold text-[#9A9AAA]">{sets} sets</span>}
                        </div>
                      </div>
                      {s.exercises.length > 0 && (
                        isOpen
                          ? <ChevronUp className="w-4 h-4 text-[#636366] flex-shrink-0" />
                          : <ChevronDown className="w-4 h-4 text-[#636366] flex-shrink-0" />
                      )}
                    </button>
                    {isOpen && s.exercises.length > 0 && (
                      <div className="border-t border-[#252528] px-4 pb-4 pt-3 flex flex-col gap-3">
                        {s.exercises.map((ex, ei) => (
                          <div key={ei}>
                            <p className="text-xs font-bold text-[#9A9AAA] mb-2">{ex.name}</p>
                            <div className="flex text-[10px] text-[#48484A] font-semibold uppercase tracking-wider gap-4 mb-1 px-1">
                              <span className="w-8">Set</span>
                              <span className="flex-1">Weight</span>
                              <span className="flex-1">Reps</span>
                            </div>
                            {ex.sets.filter(set => set.completed).map((set, si) => (
                              <div key={si} className="flex items-center gap-4 px-1 py-1 border-t border-[#252528]">
                                <span className="text-xs font-semibold text-[#9A9AAA] w-8">{set.setNumber}</span>
                                <span className="text-sm font-semibold flex-1">{set.weight != null ? `${set.weight} lbs` : '—'}</span>
                                <span className="text-sm font-semibold flex-1 text-[#FF4500]">{set.reps != null ? set.reps : '—'}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav active="profile" />
      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  )
}
