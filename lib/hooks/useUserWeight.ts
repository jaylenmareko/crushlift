import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getWeightClass } from '@/lib/belts'

// Shared bodyweight state — used by /belts and /compete, both of which gate on
// the user having entered a weight (needed for weight-class placement).
export function useUserWeight() {
  const [userWeight, setUserWeight]   = useState<number | null>(null)
  const [selectedClass, setSelectedClass] = useState(2)
  const [weightInput, setWeightInput] = useState('')
  const [weightLoading, setWeightLoading] = useState(true)
  const [savingWeight, setSavingWeight] = useState(false)
  const [weightError, setWeightError] = useState<string | null>(null)
  const [weightModalOpen, setWeightModalOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setWeightLoading(false); return }
      const { data } = await supabase.from('profiles').select('weight').eq('id', user.id).single()
      if (data?.weight) {
        setUserWeight(data.weight)
        setSelectedClass(getWeightClass(data.weight).index)
      }
      setWeightLoading(false)
    }).catch(() => {
      setWeightLoading(false)
    })
  }, [])

  async function saveWeight() {
    if (!weightInput || isNaN(parseFloat(weightInput))) return
    setSavingWeight(true)
    setWeightError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setWeightError('Not signed in.'); return }
      const w = parseFloat(weightInput)
      // upsert (not update): a profiles row may not exist yet — onboarding doesn't reliably create one.
      // update().eq() would silently match 0 rows and never persist. .select() confirms the write landed.
      const { data: saved, error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, email: user.email, weight: w }, { onConflict: 'id' })
        .select('id')
        .single()
      if (error || !saved) { setWeightError(error?.message ?? 'Could not save weight.'); return }
      setUserWeight(w)
      setSelectedClass(getWeightClass(w).index)
      setWeightModalOpen(false)
    } catch (err) {
      setWeightError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSavingWeight(false)
    }
  }

  return {
    userWeight, selectedClass, setSelectedClass,
    weightInput, setWeightInput, weightLoading,
    savingWeight, weightError, saveWeight,
    weightModalOpen, setWeightModalOpen,
  }
}
