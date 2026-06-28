'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Swords, UserPlus, UserCheck } from 'lucide-react'
import { WEIGHT_CLASSES } from '@/lib/belts'

// Dummy belt data — replaced by real belt_ranks once migration runs
const FIGHTER_BELTS: Record<string, Record<string, string>> = {
  'Marcus T.': { 'Bench Press': 'Gold',   'Squat': 'Platinum', 'Deadlift': 'Gold',   'Overhead Press': 'Silver', 'Pull-up': 'Gold',   'Power Clean': 'Silver' },
  'Dre W.':    { 'Bench Press': 'Silver',  'Squat': 'Gold',     'Deadlift': 'Silver', 'Overhead Press': 'Bronze', 'Pull-up': 'Silver', 'Power Clean': 'Bronze' },
  'Kyle B.':   { 'Bench Press': 'Bronze',  'Squat': 'Silver',   'Deadlift': 'Bronze', 'Overhead Press': 'Iron',   'Pull-up': 'Bronze', 'Power Clean': 'Iron'   },
  'Jordan S.': { 'Bench Press': 'Iron',    'Squat': 'Bronze',   'Deadlift': 'Iron',   'Overhead Press': 'Iron',   'Pull-up': 'Iron',   'Power Clean': 'Iron'   },
  'Tyler M.':  { 'Bench Press': 'Iron',    'Squat': 'Iron',     'Deadlift': 'Iron',   'Overhead Press': 'Iron',   'Pull-up': 'Iron',   'Power Clean': 'Iron'   },
  'Chris A.':  { 'Bench Press': 'Iron',    'Squat': 'Iron',     'Deadlift': 'Iron',   'Overhead Press': 'Iron',   'Pull-up': 'Iron',   'Power Clean': 'Iron'   },
}

const TIERS = [
  { name: 'Legend', color: '#FFC107' },
  { name: 'Master', color: '#8B5CF6' },
  { name: 'Elite',  color: '#EF4444' },
  { name: 'Lifter', color: '#3B82F6' },
  { name: 'Bronze', color: '#22C55E' },
  { name: 'Iron',   color: '#D1D5DB' },
  { name: 'Unranked', color: '#48484A' },
]

const DUMMY_RECORDS: Record<string, string> = {
  'Marcus T.': '12-3',
  'Dre W.':    '8-5',
  'Kyle B.':   '6-4',
  'Jordan S.': '4-7',
  'Tyler M.':  '3-2',
  'Chris A.':  '2-6',
}

const COLORS = ['#FF4500','#3B82F6','#22C55E','#F59E0B','#8B5CF6','#EF4444','#06B6D4']
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}
function initials(name: string) {
  return name.split(/[\s_]/).map(p => p[0]).join('').toUpperCase().slice(0, 2)
}
function shortClassName(full: string) { return full.split('·')[0].trim() }

interface Props {
  name: string | null
  onClose: () => void
  onChallenge?: (name: string) => void
  sentRequests?: Set<string>
  onAddFriend?: (name: string) => void
  weightClassIndex?: number
  record?: string
  rank?: number
}

export default function ProfileSheet({ name, onClose, onChallenge, sentRequests, onAddFriend, weightClassIndex = 2, record, rank }: Props) {
  if (!name) return null

  const av = avatarColor(name)
  const belts = FIGHTER_BELTS[name] ?? {}
  const rec = record ?? DUMMY_RECORDS[name] ?? '0-0'
  const [w, l] = rec.split('-').map(n => parseInt(n) || 0)
  const rate = w + l > 0 ? Math.round((w / (w + l)) * 100) : 0
  const wc = WEIGHT_CLASSES[weightClassIndex]
  const isSent = sentRequests?.has(name) ?? false
  const firstName = name.split(' ')[0]

  return (
    <AnimatePresence>
      {name && (
        <>
          <motion.div key="profile-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/85 z-[60]" />
          <motion.div
            key="profile-sheet"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] bg-[#0D0D0F] border-t border-[#252528] rounded-t-3xl z-[70]"
          >
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-[#3A3A3C]" /></div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-3 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-base font-black flex-shrink-0"
                  style={{ backgroundColor: `${av}22`, color: av, border: `2px solid ${av}55` }}>
                  {initials(name)}
                </div>
                <div>
                  <p className="text-lg font-black text-white">{name}</p>
                  <p className="text-xs font-semibold text-[#9A9AAA] mt-0.5">
                    {shortClassName(wc?.full ?? '')} {rank ? `· #${rank}` : ''}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-xl bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* W/L strip */}
            <div className="grid grid-cols-3 border-t border-b border-[#252528] mx-5 rounded-xl overflow-hidden mb-5">
              <div className="py-3 text-center">
                <p className="text-xl font-black leading-none text-[#22C55E]">{w}</p>
                <p className="text-[10px] font-bold text-[#636366] uppercase tracking-widest mt-1">Wins</p>
              </div>
              <div className="py-3 text-center">
                <p className="text-xl font-black leading-none text-[#EF4444]">{l}</p>
                <p className="text-[10px] font-bold text-[#636366] uppercase tracking-widest mt-1">Losses</p>
              </div>
              <div className="py-3 text-center">
                <p className="text-xl font-black leading-none text-[#FF4500]">{rate}%</p>
                <p className="text-[10px] font-bold text-[#636366] uppercase tracking-widest mt-1">Win Rate</p>
              </div>
            </div>

            {/* Belt tiers */}
            <div className="px-5 mb-6">
              <p className="text-[10px] font-bold text-[#9A9AAA] uppercase tracking-widest mb-3">Belts</p>
              <div className="flex flex-col gap-2">
                {['Bench Press','Squat','Deadlift','Overhead Press','Pull-up','Power Clean'].map(lift => {
                  const tierName = belts[lift] ?? 'Unranked'
                  const tier = TIERS.find(t => t.name === tierName) ?? TIERS[TIERS.length - 1]
                  return (
                    <div key={lift} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#161618] border border-[#252528]">
                      <span className="text-sm font-semibold text-white">{lift}</span>
                      <span className="text-xs font-black px-2.5 py-1 rounded-lg" style={{ backgroundColor: `${tier.color}20`, color: tier.color }}>{tier.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* CTAs */}
            <div className="px-5 pb-8 flex flex-col gap-2">
              {onChallenge && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => { onClose(); onChallenge(name) }}
                  className="w-full bg-[#FF4500] text-white font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(255,69,0,0.3)]">
                  <Swords className="w-4 h-4" /> Challenge {firstName}
                </motion.button>
              )}
              {onAddFriend && (
                isSent ? (
                  <div className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-[#3A3A3C] bg-[#1C1C1E] text-[#9A9AAA] text-sm font-bold">
                    <UserCheck className="w-4 h-4" /> Request Sent
                  </div>
                ) : (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => onAddFriend(name)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-[#3A3A3C] bg-[#1C1C1E] text-white text-sm font-bold hover:border-[#9A9AAA] transition-colors">
                    <UserPlus className="w-4 h-4" /> Add Friend
                  </motion.button>
                )
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
