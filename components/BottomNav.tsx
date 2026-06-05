'use client'

import Link from 'next/link'
import { Dumbbell, BarChart3, Calendar, User } from 'lucide-react'

const TABS = [
  { href: '/plan', icon: Dumbbell, label: 'Plan', key: 'plan' },
  { href: '/workout', icon: BarChart3, label: 'Workout', key: 'workout' },
  { href: '/history', icon: Calendar, label: 'History', key: 'history' },
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
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                isActive ? 'text-[#FF4500]' : 'text-[#636366] hover:text-[#9A9AAA]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
      {/* iPhone home indicator safe area */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
