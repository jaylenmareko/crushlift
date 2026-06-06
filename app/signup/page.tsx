'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Sign up happens through the onboarding flow (last step creates the account).
// Navigating directly to /signup redirects to /onboarding.
export default function SignupPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/onboarding') }, [router])
  return <div className="mobile-container min-h-dvh bg-[#0D0D0F]" />
}
