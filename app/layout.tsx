import type { Metadata, Viewport } from 'next'
import './globals.css'
import AppShell from '@/frontend/components/AppShell'

export const metadata: Metadata = {
  title: 'Trainmaxxing — AI Workout Plans',
  description: 'Answer a few questions. Get a personalized workout plan with demo videos for every exercise.',
  applicationName: 'Trainmaxxing',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Trainmaxxing',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0D0D0F',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#0D0D0F] text-white antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
