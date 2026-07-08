import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/battles — all battles for the current user, joined with opponent profile
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('battles')
    .select(`
      *,
      challenger:profiles!battles_challenger_id_fkey(id, username, weight),
      opponent:profiles!battles_opponent_id_fkey(id, username, weight)
    `)
    .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ battles: data ?? [] })
}

// POST /api/battles — send a challenge
// body: { opponent_username: string, lift: string, format: 'weight'|'reps' }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { opponent_username, lift, format } = await req.json() as {
    opponent_username: string
    lift: string
    format: 'weight' | 'reps'
  }

  if (!opponent_username || !lift || !format) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Look up opponent by username
  const { data: opponent, error: opErr } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', opponent_username.trim())
    .single()

  if (opErr || !opponent) {
    return NextResponse.json({ error: 'Opponent not found' }, { status: 404 })
  }

  if (opponent.id === user.id) {
    return NextResponse.json({ error: 'Cannot challenge yourself' }, { status: 400 })
  }

  // Check for an existing pending/active battle between these two for this lift
  const { data: existing } = await supabase
    .from('battles')
    .select('id')
    .in('status', ['pending', 'active'])
    .eq('lift', lift)
    .or(
      `and(challenger_id.eq.${user.id},opponent_id.eq.${opponent.id}),` +
      `and(challenger_id.eq.${opponent.id},opponent_id.eq.${user.id})`
    )
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'A challenge for this lift already exists between you two' }, { status: 409 })
  }

  // Get challenger's current bodyweight for potential superfight DOTS
  const { data: challengerProfile } = await supabase
    .from('profiles')
    .select('weight')
    .eq('id', user.id)
    .single()

  const { data: battle, error: insertErr } = await supabase
    .from('battles')
    .insert({
      challenger_id: user.id,
      opponent_id: opponent.id,
      lift,
      format,
      kind: 'class',
      status: 'pending',
      challenger_bw: challengerProfile?.weight ?? null,
    })
    .select()
    .single()

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
  return NextResponse.json({ battle })
}
