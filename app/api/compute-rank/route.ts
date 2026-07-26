import { NextResponse } from 'next/server'
import { createClient } from '@/backend/lib/supabase/server'
import { TIERS, BIG_SIX, getTierIndex } from '@/backend/services/belts'

// Called fire-and-forget after a verified PR is saved.
// Reads all verified PRs for the authed user, computes belt tier per lift,
// and upserts { belt_ranks: { "Bench Press": "Lifter", ... } } to profiles.
export async function POST() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { data: verifications } = await supabase
    .from('pr_verifications')
    .select('exercise_name, declared_weight, declared_reps, created_at')
    .eq('user_id', user.id)
    .eq('verified', true)

  if (!verifications || verifications.length === 0) {
    return NextResponse.json({ updated: false })
  }

  // Best verified weight + reps per lift (scan all rows, keep maximums)
  const bests: Record<string, { weight: number; reps: number }> = {}
  for (const v of verifications) {
    const name = v.exercise_name as string
    if (!bests[name]) bests[name] = { weight: 0, reps: 0 }
    if ((v.declared_weight ?? 0) > bests[name].weight) bests[name].weight = v.declared_weight ?? 0
    if ((v.declared_reps  ?? 0) > bests[name].reps)   bests[name].reps   = v.declared_reps  ?? 0
  }

  const belt_ranks: Record<string, string> = {}
  for (const lift of BIG_SIX) {
    const best = bests[lift.name]
    if (!best) continue
    const idx = getTierIndex({ name: lift.name, best: best.weight, bestReps: best.reps || null })
    if (idx >= 0 && idx < TIERS.length) belt_ranks[lift.name] = TIERS[idx].name
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, belt_ranks }, { onConflict: 'id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ updated: true, belt_ranks })
}
