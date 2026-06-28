'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, UserPlus, Search, Clock, X, UserCheck, Loader2 } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import ProfileSheet from '@/components/ProfileSheet'
import { createClient } from '@/lib/supabase/client'

interface FriendRequest {
  name: string
  sentAt: number
}

interface SearchResult {
  id: string
  username: string
  first_name: string | null
}

type Tab = 'incoming' | 'pending' | 'friends'

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
  return name.split(/[\s_]/).map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

const COLORS = ['#FF4500','#3B82F6','#22C55E','#F59E0B','#8B5CF6','#EF4444','#06B6D4']
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}

const DUMMY_FRIENDS = ['Marcus T.', 'Dre W.', 'Tyler M.']
const DUMMY_PENDING: FriendRequest[] = [
  { name: 'Kyle B.', sentAt: Date.now() - 1000 * 60 * 47 },
  { name: 'Jordan S.', sentAt: Date.now() - 1000 * 60 * 60 * 3 },
]
const DUMMY_INCOMING: FriendRequest[] = [
  { name: 'Chris A.', sentAt: Date.now() - 1000 * 60 * 12 },
  { name: 'Eli R.', sentAt: Date.now() - 1000 * 60 * 60 * 7 },
]

export default function FriendsPage() {
  const [tab, setTab] = useState<Tab>('incoming')
  const [tabDir, setTabDir] = useState(1)
  const [query, setQuery] = useState('')
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([])
  const [incoming, setIncoming] = useState<FriendRequest[]>([])
  const [friends, setFriends] = useState<string[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())
  const [profileName, setProfileName] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createClient()

  useEffect(() => {
    try {
      const storedOutgoing = JSON.parse(localStorage.getItem('trainmaxxing_friend_requests') ?? 'null')
      const storedIncoming = JSON.parse(localStorage.getItem('trainmaxxing_incoming_requests') ?? 'null')
      const storedFriends  = JSON.parse(localStorage.getItem('trainmaxxing_friends') ?? 'null')
      const storedSent     = JSON.parse(localStorage.getItem('trainmaxxing_sent_requests') ?? 'null')
      setOutgoing(storedOutgoing ?? DUMMY_PENDING)
      setIncoming(storedIncoming ?? DUMMY_INCOMING)
      setFriends(storedFriends   ?? DUMMY_FRIENDS)
      setSentIds(new Set(storedSent ?? []))
    } catch {}
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = query.trim()
    if (!q) { setSearchResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase
        .from('profiles')
        .select('id, username, first_name')
        .ilike('username', `%${q}%`)
        .neq('id', user?.id ?? '')
        .limit(10)
      setSearchResults(data ?? [])
      setSearching(false)
    }, 300)
  }, [query])

  const TAB_ORDER: Tab[] = ['incoming', 'pending', 'friends']
  function switchTab(t: Tab) {
    setTabDir(TAB_ORDER.indexOf(t) > TAB_ORDER.indexOf(tab) ? 1 : -1)
    setTab(t)
    setQuery('')
    setSearchResults([])
  }

  const sentNames = new Set(outgoing.map(r => r.name))

  function addFriendByName(name: string) {
    const existing = JSON.parse(localStorage.getItem('trainmaxxing_friend_requests') ?? '[]')
    const already = existing.some((r: { name: string }) => r.name === name)
    if (!already) {
      existing.push({ name, sentAt: Date.now() })
      localStorage.setItem('trainmaxxing_friend_requests', JSON.stringify(existing))
      setOutgoing(existing)
    }
  }

  function sendRequest(result: SearchResult) {
    const displayName = result.first_name ? `${result.first_name} (@${result.username})` : `@${result.username}`
    const updated = new Set(sentIds).add(result.id)
    setSentIds(updated)
    localStorage.setItem('trainmaxxing_sent_requests', JSON.stringify([...updated]))
    const existing = JSON.parse(localStorage.getItem('trainmaxxing_friend_requests') ?? '[]')
    const already = existing.some((r: { name: string }) => r.name === displayName)
    if (!already) {
      existing.push({ name: displayName, sentAt: Date.now() })
      localStorage.setItem('trainmaxxing_friend_requests', JSON.stringify(existing))
      setOutgoing(existing)
    }
  }

  function cancelRequest(name: string) {
    const updated = outgoing.filter(r => r.name !== name)
    setOutgoing(updated)
    localStorage.setItem('trainmaxxing_friend_requests', JSON.stringify(updated))
    try {
      const sent: string[] = JSON.parse(localStorage.getItem('trainmaxxing_sent_requests') ?? '[]')
      localStorage.setItem('trainmaxxing_sent_requests', JSON.stringify(sent.filter(s => s !== name)))
    } catch {}
  }

  function acceptIncoming(name: string) {
    const updatedIncoming = incoming.filter(r => r.name !== name)
    const updatedFriends = [...friends, name]
    setIncoming(updatedIncoming)
    setFriends(updatedFriends)
    localStorage.setItem('trainmaxxing_incoming_requests', JSON.stringify(updatedIncoming))
    localStorage.setItem('trainmaxxing_friends', JSON.stringify(updatedFriends))
  }

  function declineIncoming(name: string) {
    const updated = incoming.filter(r => r.name !== name)
    setIncoming(updated)
    localStorage.setItem('trainmaxxing_incoming_requests', JSON.stringify(updated))
  }

  const showSearch = query.trim().length > 0

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
  }

  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0D0D0F] has-bottom-nav">
      <header className="px-5 pt-12 pb-4">
        <p className="text-[10px] font-bold text-[#FF4500] uppercase tracking-[0.2em] mb-1">Trainmaxxing</p>
        <h1 className="text-3xl font-black text-white">Friends</h1>
        <p className="text-[#9A9AAA] text-sm mt-1 font-semibold">Challenge. Compete. Push each other.</p>
      </header>

      {/* Tab bar */}
      <div className="px-5 mb-4">
        <div className="flex bg-[#161618] rounded-xl p-1 border border-[#252528]">
          {([
            ['incoming', 'Incoming', incoming.length],
            ['pending',  'Pending',  outgoing.length],
            ['friends',  'Friends',  friends.length],
          ] as [Tab, string, number][]).map(([v, label, count]) => {
            const active = tab === v
            return (
              <button key={v} onClick={() => switchTab(v)}
                className="relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors z-10"
              >
                {active && (
                  <motion.div layoutId="friends-tab-pill"
                    className="absolute inset-0 rounded-lg bg-[#1C1C1E] shadow-sm"
                    transition={{ type: 'spring', stiffness: 450, damping: 38 }}
                  />
                )}
                <span className={`relative z-10 transition-colors ${active ? 'text-white' : 'text-[#636366]'}`}>{label}</span>
                {count > 0 && (
                  <span className={`relative z-10 text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                    active
                      ? v === 'incoming' ? 'bg-[#FF4500]/20 text-[#FF4500]' : 'bg-[#252528] text-[#9A9AAA]'
                      : v === 'incoming' ? 'bg-[#FF4500]/15 text-[#FF4500]' : 'bg-[#252528] text-[#636366]'
                  }`}>{count}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Search — only on Friends tab */}
      {tab === 'friends' && (
        <div className="px-5 mb-4">
          <div className="flex items-center gap-2 bg-[#1C1C1E] border border-[#252528] rounded-xl px-4 py-3.5">
            <Search className="w-4 h-4 text-[#636366] flex-shrink-0" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search by username..."
              className="flex-1 bg-transparent text-sm text-white placeholder-[#48484A] focus:outline-none" />
            {searching && <Loader2 className="w-4 h-4 text-[#636366] animate-spin flex-shrink-0" />}
            {query && !searching && (
              <button onClick={() => { setQuery(''); setSearchResults([]) }}>
                <X className="w-4 h-4 text-[#636366]" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-5 pb-28">
        <AnimatePresence mode="wait" custom={tabDir}>
          <motion.div key={tab} custom={tabDir} variants={variants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-col gap-2"
          >

            {/* Incoming tab */}
            {tab === 'incoming' && (
              incoming.length > 0 ? (
                <AnimatePresence>
                  {incoming.map(req => {
                    const av = avatarColor(req.name)
                    return (
                      <motion.div key={req.name} layout
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -40, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                        className="rounded-2xl bg-[#1C1C1E] border border-[#FF4500]/20 overflow-hidden"
                      >
                        <button onClick={() => setProfileName(req.name)} className="w-full flex items-center gap-3 p-3 text-left">
                          <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black"
                            style={{ backgroundColor: `${av}22`, color: av, border: `2px solid ${av}55` }}>
                            {initials(req.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{req.name}</p>
                            <p className="text-xs font-semibold text-[#9A9AAA] mt-0.5">wants to be friends · {timeAgo(req.sentAt)}</p>
                          </div>
                        </button>
                        <div className="flex gap-2 px-3 pb-3">
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => acceptIncoming(req.name)}
                            className="flex-1 bg-[#FF4500] text-white text-xs font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5" /> Accept
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => declineIncoming(req.name)}
                            className="flex-1 bg-[#161618] border border-[#3A3A3C] text-[#9A9AAA] text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                            <X className="w-3.5 h-3.5" /> Decline
                          </motion.button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              ) : (
                <div className="flex flex-col items-center justify-center text-center pt-16">
                  <div className="w-16 h-16 rounded-full bg-[#1C1C1E] border border-[#252528] flex items-center justify-center mb-4">
                    <Users className="w-7 h-7 text-[#3A3A3C]" />
                  </div>
                  <p className="font-bold text-white mb-1">No incoming requests</p>
                  <p className="text-sm text-[#636366]">When someone adds you, they&apos;ll appear here.</p>
                </div>
              )
            )}

            {/* Pending tab */}
            {tab === 'pending' && (
              outgoing.length > 0 ? (
                <AnimatePresence>
                  {outgoing.map(req => {
                    const av = avatarColor(req.name)
                    return (
                      <motion.div key={req.name} layout
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                        className="flex items-center gap-3 bg-[#1C1C1E] border border-[#252528] rounded-2xl p-3 cursor-pointer"
                        onClick={() => setProfileName(req.name)}
                      >
                        <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black"
                          style={{ backgroundColor: `${av}22`, color: av, border: `2px solid ${av}55` }}>
                          {initials(req.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{req.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3 text-[#F59E0B]" />
                            <span className="text-xs font-semibold text-[#F59E0B]">Awaiting · {timeAgo(req.sentAt)}</span>
                          </div>
                        </div>
                        <motion.button whileTap={{ scale: 0.9 }}
                          onClick={e => { e.stopPropagation(); cancelRequest(req.name) }}
                          className="w-9 h-9 rounded-xl bg-[#161618] border border-[#3A3A3C] flex items-center justify-center text-[#9A9AAA] flex-shrink-0">
                          <X className="w-4 h-4" />
                        </motion.button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              ) : (
                <div className="flex flex-col items-center justify-center text-center pt-16">
                  <div className="w-16 h-16 rounded-full bg-[#1C1C1E] border border-[#252528] flex items-center justify-center mb-4">
                    <Clock className="w-7 h-7 text-[#3A3A3C]" />
                  </div>
                  <p className="font-bold text-white mb-1">No pending requests</p>
                  <p className="text-sm text-[#636366]">Add someone from the leaderboard or search.</p>
                </div>
              )
            )}

            {/* Friends tab */}
            {tab === 'friends' && (
              showSearch ? (
                <>
                  <p className="text-[10px] font-bold text-[#9A9AAA] uppercase tracking-widest mb-1">
                    {searching ? 'Searching...' : `Results · ${searchResults.length}`}
                  </p>
                  {searchResults.length > 0 ? searchResults.map(r => {
                    const av = avatarColor(r.username)
                    const alreadySent = sentIds.has(r.id)
                    return (
                      <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 bg-[#1C1C1E] border border-[#252528] rounded-2xl p-3">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black"
                          style={{ backgroundColor: `${av}22`, color: av, border: `2px solid ${av}55` }}>
                          {initials(r.username)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">@{r.username}</p>
                          {r.first_name && <p className="text-xs font-semibold text-[#9A9AAA] mt-0.5 truncate">{r.first_name}</p>}
                        </div>
                        {alreadySent ? (
                          <div className="flex items-center gap-1.5 text-[#9A9AAA] text-xs font-bold flex-shrink-0">
                            <UserCheck className="w-4 h-4" /> Sent
                          </div>
                        ) : (
                          <motion.button whileTap={{ scale: 0.93 }} onClick={() => sendRequest(r)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FF4500] text-white text-xs font-black flex-shrink-0">
                            <UserPlus className="w-3.5 h-3.5" /> Add
                          </motion.button>
                        )}
                      </motion.div>
                    )
                  }) : !searching ? (
                    <div className="text-center py-8">
                      <p className="text-sm font-semibold text-[#636366]">No users found for &ldquo;{query}&rdquo;</p>
                      <p className="text-xs text-[#48484A] mt-1">Check the spelling or try a different username</p>
                    </div>
                  ) : null}
                </>
              ) : friends.length > 0 ? (
                friends.map(name => {
                  const av = avatarColor(name)
                  return (
                    <div key={name} onClick={() => setProfileName(name)}
                      className="flex items-center gap-3 bg-[#1C1C1E] border border-[#252528] rounded-2xl p-3 cursor-pointer">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black"
                        style={{ backgroundColor: `${av}22`, color: av, border: `2px solid ${av}55` }}>
                        {initials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{name}</p>
                        <p className="text-xs font-semibold text-[#9A9AAA] mt-0.5">Friend</p>
                      </div>
                      <UserCheck className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                    </div>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center text-center pt-16">
                  <div className="w-16 h-16 rounded-full bg-[#1C1C1E] border border-[#252528] flex items-center justify-center mb-4">
                    <Users className="w-7 h-7 text-[#3A3A3C]" />
                  </div>
                  <p className="font-bold text-white mb-1">No friends yet</p>
                  <p className="text-sm text-[#636366]">Search above or add someone from the leaderboard.</p>
                </div>
              )
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav active="friends" />

      <ProfileSheet
        name={profileName}
        onClose={() => setProfileName(null)}
        sentRequests={sentNames}
        isFriend={profileName ? friends.includes(profileName) : false}
        onAddFriend={name => { addFriendByName(name); setProfileName(null) }}
      />
    </div>
  )
}
