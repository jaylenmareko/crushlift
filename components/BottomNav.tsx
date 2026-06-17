'use client'

import Link from 'next/link'
import { Dumbbell, Zap, Trophy, Swords, Users, User } from 'lucide-react'

const TABS = [
  { href: '/plan', icon: Dumbbell, label: 'Plan', key: 'plan' },
  { href: '/workout', icon: Zap, label: 'Workout', key: 'workout' },
  { href: '/belts', icon: Trophy, label: 'Belts', key: 'belts' },
  { href: '/compete', icon: Swords, label: 'Compete', key: 'compete' },
  { href: '/friends', icon: Users, label: 'Friends', key: 'friends' },
  { href: '/profile', icon: User, label: 'Profile', key: 'profile' },
]

export default function BottomNav({ active }: { active: string }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] bg-[#0D0D0F]/95 border-t border-[#252528] z-30 backdrop-blur-md">
      <div className="flex items-center">
        {TABS.map(({ href, icon: Icon, label, key }) => {
          const isActive = active === key
          return (
            <Link
              key={key}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all relative ${
                isActive ? 'text-[#FF4500]' : 'text-[#48484A] hover:text-[#9A9AAA]'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-[#FF4500] rounded-full shadow-[0_0_6px_rgba(255,69,0,0.8)]" />
              )}
              <Icon className={`transition-all ${isActive ? 'w-[22px] h-[22px]' : 'w-5 h-5'}`} />
              <span className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? 'text-[#FF4500]' : ''}`}>{label}</span>
            </Link>
          )
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
