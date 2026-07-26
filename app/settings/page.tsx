'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import EditProfileModal from '@/frontend/components/EditProfileModal'

type Item = {
  label: string
  hint?: string
  href?: string
  action?: () => void
}

type Section = {
  title: string
  items: Item[]
}

export default function SettingsPage() {
  const router = useRouter()
  const [editProfileOpen, setEditProfileOpen] = useState(false)

  const sections: Section[] = [
    {
      title: 'Account',
      items: [
        { label: 'Edit Profile', hint: 'Name & username', action: () => setEditProfileOpen(true) },
        { label: 'Change Email' },
        { label: 'Change Password' },
      ],
    },
    {
      title: 'Subscription',
      items: [
        { label: 'Manage Plan', hint: 'Upgrade or cancel' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { label: 'Weight Units', hint: 'lbs' },
        { label: 'Notifications', hint: 'Off' },
      ],
    },
    {
      title: 'Resources',
      items: [
        { label: 'FAQ' },
        { label: 'Contact Us', hint: 'support@trainmaxxing.com' },
      ],
    },
    {
      title: 'Legal',
      items: [
        { label: 'Privacy Policy' },
        { label: 'Terms of Use' },
      ],
    },
    {
      title: 'App',
      items: [
        { label: 'Version', hint: '1.0.0' },
      ],
    },
  ]

  return (
    <div className="mobile-container flex flex-col min-h-dvh bg-[#0D0D0F]">
      <header className="flex items-center gap-3 px-5 pt-12 pb-6">
        <button
          onClick={() => router.back()}
          className="text-[#9A9AAA] hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      <div className="flex-1 px-5 flex flex-col gap-6 pb-10">
        {sections.map(section => (
          <div key={section.title}>
            <p className="text-[10px] font-bold text-[#9A9AAA] uppercase tracking-widest mb-2 px-1">
              {section.title}
            </p>
            <div className="bg-[#1C1C1E] border border-[#252528] rounded-2xl overflow-hidden">
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`w-full flex items-center justify-between px-4 py-4 text-left transition-colors hover:bg-[#252528] active:bg-[#2C2C2E] ${
                    i < section.items.length - 1 ? 'border-b border-[#252528]' : ''
                  }`}
                >
                  <span className="text-sm font-medium text-white">{item.label}</span>
                  <div className="flex items-center gap-2">
                    {item.hint && (
                      <span className="text-xs font-semibold text-[#9A9AAA]">{item.hint}</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-[#3A3A3C]" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <EditProfileModal open={editProfileOpen} onClose={() => setEditProfileOpen(false)} />
    </div>
  )
}
