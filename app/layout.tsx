import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CrushLift — AI Workout Plans',
  description: 'Answer 5 questions. Get a personalized workout plan with demo videos for every exercise.',
  applicationName: 'CrushLift',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0A0A0A',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#0A0A0A] text-white antialiased">
        {children}
      </body>
    </html>
  )
}
