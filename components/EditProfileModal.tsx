'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Edit display name + unique username. Writes to profiles (username has a unique index).
export default function EditProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setLoading(true)
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      const { data } = await supabase.from('profiles').select('first_name, username').eq('id', user.id).single()
      setFirstName(data?.first_name || user.user_metadata?.first_name || '')
      setUsername(data?.username || user.user_metadata?.username || '')
      setLoading(false)
    })
  }, [open])

  const vFirst = !!firstName.trim()
  const vUser = /^[a-z0-9_]{3,20}$/.test(username)
  const canSave = vFirst && vUser && !saving

  async function save() {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in.'); setSaving(false); return }
    // keep auth metadata in sync too
    await supabase.auth.updateUser({ data: { first_name: firstName.trim(), username: username.trim() } })
    const { error: e } = await supabase
      .from('profiles')
      .update({ first_name: firstName.trim(), username: username.trim() })
      .eq('id', user.id)
    if (e) {
      const taken = e.code === '23505' || /duplicate|unique/i.test(e.message)
      setError(taken ? 'That username is taken — pick another.' : e.message)
      setSaving(false)
      return
    }
    setSaving(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/90 z-[60]"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] bg-[#0D0D0F] border-t border-[#252528] rounded-t-3xl z-[70] flex flex-col max-h-[92dvh]"
          >
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-[#3A3A3C]" />
            </div>
            <div className="flex items-center justify-between px-5 pt-2 pb-4 flex-shrink-0">
              <h2 className="text-xl font-bold">Edit Profile</h2>
              <button onClick={onClose} className="w-9 h-9 rounded-xl bg-[#1C1C1E] border border-[#252528] flex items-center justify-center text-[#9A9AAA] hover:text-white flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-8">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-[#FF4500]/70 uppercase tracking-widest block mb-2">First name</label>
                    <input
                      type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                      placeholder="e.g. Jaylen"
                      className="w-full bg-[#161618] border border-[#252528] rounded-2xl px-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#FF4500]/70 uppercase tracking-widest block mb-2">Username</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#636366] text-sm font-semibold">@</span>
                      <input
                        type="text" value={username} maxLength={20}
                        onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="your_handle"
                        className="w-full bg-[#161618] border border-[#252528] rounded-2xl pl-8 pr-4 py-4 text-sm text-white placeholder:text-[#636366] focus:outline-none focus:border-[#FF4500] transition-colors"
                      />
                    </div>
                    <p className={`text-xs mt-1.5 ${username && !vUser ? 'text-red-400' : 'text-[#9A9AAA]'}`}>3–20 chars, lowercase, letters/numbers/underscores · must be unique</p>
                  </div>

                  {error && (
                    <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">{error}</p>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={!canSave}
                    onClick={save}
                    className="w-full bg-[#FF4500] text-white font-black py-4 rounded-2xl text-sm shadow-[0_8px_32px_rgba(255,69,0,0.25)] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
