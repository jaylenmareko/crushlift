'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Dumbbell, BarChart3, Calendar, User } from 'lucide-react'

const TABS = [
  { href: '/plan', icon: Dumbbell, label: 'Plan', key: 'plan' },
  { href: '/workout', icon: BarChart3, label: 'Workout', key: 'workout' },
  { href: '/history', icon: Calendar, label: 'History', key: 'history' },
  { href: '/profile', icon: User, label: 'Profile', key: 'profile' },
]

export default function SideNav() {
  const pathname = usePathname()
  const active = TABS.find(t => pathname.startsWith(t.href))?.key

  return (
    <nav className="hidden md:flex flex-col fixed left-0 top-0 h-full w-[220px] bg-[#0D0D0F] border-r border-[#252528] z-30 px-3 py-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div className="w-7 h-7 rounded-lg bg-[#FF4500] flex items-center justify-center">
          <Dumbbell className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight">Trainmaxxing</span>
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-0.5">
        {TABS.map(({ href, icon: Icon, label, key }) => {
          const isActive = active === key
          return (
            <Link
              key={key}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#FF4500]/10 text-[#FF4500]'
                  : 'text-[#9A9AAA] hover:text-white hover:bg-[#252528]'
              }`}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
