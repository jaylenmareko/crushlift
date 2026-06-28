'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, UserPlus, Search, Clock, X, Check, UserCheck } from 'lucide-react'
import BottomNav from '@/components/BottomNav'

interface FriendRequest {
  name: string
  sentAt: number
}

function timeAgo(ms: number) {
  const diff = Date.now() - ms
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  if (m > 0) return `${m}m ago`
  return 'just now'
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

const COLORS = ['#FF4500','#3B82F6','#22C55E','#F59E0B','#8B5CF6','#EF4444','#06B6D4']
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}

export default function FriendsPage() {
  const [query, setQuery] = useState('')
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([])
  const [friends, setFriends] = useState<string[]>([])

  useEffect(() => {
    try {
      setOutgoing(JSON.parse(localStorage.getItem('trainmaxxing_friend_requests') ?? '[]'))
      setFriends(JSON.parse(localStorage.getItem('trainmaxxing_friends') ?? '[]'))
    } catch {}
  }, [])

  function cancelRequest(name: string) {
    const updated = outgoing.filter(r => r.name !== name)
    setOutgoing(updated)
    localStorage.setItem('trainmaxxing_friend_requests', JSON.stringify(updated))
    // also remove from sent set
    try {
      const sent: string[] = JSON.parse(localStorage.getItem('trainmaxxing_sent_requests') ?? '[]')
      localStorage.setItem('trainmaxxing_sent_requests', JSON.stringify(sent.filter(s => s !== name)))
    } catch {}
  }

  const filteredFriends = friends.filter(f => f.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0D0D0F] has-bottom-nav">
      <header className="px-5 pt-12 pb-4">
        <p className="text-[10px] font-bold text-[#FF4500] uppercase tracking-[0.2em] mb-1">Trainmaxxing</p>
        <h1 className="text-3xl font-black text-white">Friends</h1>
        <p className="text-[#9A9AAA] text-sm mt-1 font-semibold">Challenge. Compete. Push each other.</p>
      </header>

      {/* Search */}
      <div className="px-5 mb-5">
        <div className="flex items-center gap-2 bg-[#1C1C1E] border border-[#252528] rounded-xl px-4 py-3.5">
          <Search className="w-4 h-4 text-[#636366] flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search friends..."
            className="flex-1 bg-transparent text-sm text-white placeholder-[#48484A] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-28">

        {/* Pending outgoing requests */}
        {outgoing.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-bold text-[#9A9AAA] uppercase tracking-widest mb-3">
              Pending Requests · {outgoing.length}
            </p>
            <div className="flex flex-col gap-2">
              <AnimatePresence>
                {outgoing.map(req => {
                  const av = avatarColor(req.name)
                  return (
                    <motion.div
                      key={req.name}
                      layout
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                      className="flex items-center gap-3 bg-[#1C1C1E] border border-[#252528] rounded-2xl p-3"
                    >
                      <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black"
                        style={{ backgroundColor: `${av}22`, color: av, border: `2px solid ${av}55` }}>
                        {initials(req.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{req.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3 text-[#F59E0B]" />
                          <span className="text-xs font-semibold text-[#F59E0B]">Awaiting response · {timeAgo(req.sentAt)}</span>
                        </div>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => cancelRequest(req.name)}
                        className="w-9 h-9 rounded-xl bg-[#161618] border border-[#3A3A3C] flex items-center justify-center text-[#9A9AAA] flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Friends list */}
        {friends.length > 0 ? (
          <div>
            <p className="text-[10px] font-bold text-[#9A9AAA] uppercase tracking-widest mb-3">
              Friends · {friends.length}
            </p>
            <div className="flex flex-col gap-2">
              {filteredFriends.map(name => {
                const av = avatarColor(name)
                return (
                  <div key={name} className="flex items-center gap-3 bg-[#1C1C1E] border border-[#252528] rounded-2xl p-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black"
                      style={{ backgroundColor: `${av}22`, color: av, border: `2px solid ${av}55` }}>
                      {initials(name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{name}</p>
                      <p className="text-xs font-semibold text-[#9A9AAA] mt-0.5">Friend</p>
                    </div>
                    <div className="flex items-center gap-1 text-[#22C55E]">
                      <UserCheck className="w-4 h-4" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : outgoing.length === 0 ? (
          /* Empty state — no friends, no pending */
          <div className="flex flex-col items-center justify-center text-center pt-16">
            <div className="w-20 h-20 rounded-full bg-[#1C1C1E] border border-[#252528] flex items-center justify-center mb-5">
              <Users className="w-9 h-9 text-[#3A3A3C]" />
            </div>
            <p className="font-black text-white text-lg mb-1">No friends yet</p>
            <p className="text-sm font-semibold text-[#9A9AAA] mb-2 max-w-[240px] leading-snug">
              Tap a fighter on the leaderboard or in your challenges to add them.
            </p>
          </div>
        ) : null}
      </div>

      <BottomNav active="friends" />
    </div>
  )
}
