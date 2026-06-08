'use client'

import { usePathname } from 'next/navigation'
import SideNav from './SideNav'

const APP_PATHS = ['/plan', '/workout', '/compete', '/friends', '/profile', '/settings']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isApp = APP_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  return (
    <>
      {isApp && <SideNav />}
      <div className={isApp ? 'md:ml-[220px]' : ''}>
        {children}
      </div>
    </>
  )
}
