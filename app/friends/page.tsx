'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, UserPlus, Search } from 'lucide-react'
import BottomNav from '@/components/BottomNav'

export default function FriendsPage() {
  const [query, setQuery] = useState('')

  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0D0D0F] has-bottom-nav">
      <header className="px-5 pt-12 pb-4">
        <h1 className="text-2xl font-bold">Friends</h1>
        <p className="text-[#9A9AAA] text-sm mt-1">Challenge. Compete. Push each other.</p>
      </header>

      {/* Search */}
      <div className="px-5 mb-4">
        <div className="flex items-center gap-2 bg-[#1C1C1E] border border-[#252528] rounded-xl px-4 py-3.5">
          <Search className="w-4 h-4 text-[#636366] flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by username..."
            className="flex-1 bg-transparent text-sm text-white placeholder-[#48484A] focus:outline-none"
          />
        </div>
      </div>

      {/* Empty state */}
      <div className="flex-1 px-5 flex flex-col items-center justify-center text-center pb-20">
        <div className="w-20 h-20 rounded-full bg-[#1C1C1E] border border-[#252528] flex items-center justify-center mb-5">
          <Users className="w-9 h-9 text-[#3A3A3C]" />
        </div>
        <p className="font-bold text-white text-lg mb-1">No friends yet</p>
        <p className="text-sm font-semibold text-[#9A9AAA] mb-6 max-w-[240px] leading-snug">
          Add friends to see their Power Rank, challenge them to battles, and push each other.
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled
          className="flex items-center gap-2 bg-[#FF4500]/10 border border-[#FF4500]/20 text-[#FF4500]/60 font-bold px-6 py-3 rounded-xl text-sm cursor-not-allowed"
        >
          <UserPlus className="w-4 h-4" />
          Find Friends
        </motion.button>
        <p className="text-[10px] text-[#48484A] mt-3">Friend system coming soon</p>
      </div>

      <BottomNav active="friends" />
    </div>
  )
}
