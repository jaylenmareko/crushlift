import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/backend/lib/supabase/server'

// PATCH /api/battles/[id]
// body: { action: 'accept' | 'decline' | 'submit', value?: number }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { action, value } = await req.json() as {
    action: 'accept' | 'decline' | 'submit'
    value?: number
  }

  // Load the battle and verify the user is a participant
  const { data: battle, error: fetchErr } = await supabase
    .from('battles')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !battle) return NextResponse.json({ error: 'Battle not found' }, { status: 404 })

  const isChallenger = battle.challenger_id === user.id
  const isOpponent   = battle.opponent_id   === user.id
  if (!isChallenger && !isOpponent) {
    return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
  }

  if (action === 'accept') {
    if (!isOpponent) return NextResponse.json({ error: 'Only the opponent can accept' }, { status: 403 })
    if (battle.status !== 'pending') return NextResponse.json({ error: 'Battle is not pending' }, { status: 400 })

    // Snapshot opponent bodyweight
    const { data: oppProfile } = await supabase
      .from('profiles')
      .select('weight')
      .eq('id', user.id)
      .single()

    const { data: updated, error } = await supabase
      .from('battles')
      .update({
        status: 'active',
        responded_at: new Date().toISOString(),
        opponent_bw: oppProfile?.weight ?? null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ battle: updated })
  }

  if (action === 'decline') {
    if (!isOpponent) return NextResponse.json({ error: 'Only the opponent can decline' }, { status: 403 })
    if (battle.status !== 'pending') return NextResponse.json({ error: 'Battle is not pending' }, { status: 400 })

    const { data: updated, error } = await supabase
      .from('battles')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ battle: updated })
  }

  if (action === 'submit') {
    if (battle.status !== 'active') return NextResponse.json({ error: 'Battle is not active' }, { status: 400 })
    if (value == null || value <= 0) return NextResponse.json({ error: 'Invalid value' }, { status: 400 })

    const field = isChallenger ? 'challenger_value' : 'opponent_value'
    const otherValue = isChallenger ? battle.opponent_value : battle.challenger_value

    const updates: Record<string, unknown> = { [field]: value }

    // If both sides have now submitted, mark completed
    if (otherValue != null) {
      updates.status = 'completed'
      updates.completed_at = new Date().toISOString()

      // Determine winner (higher value wins for both weight and reps)
      const challengerVal = isChallenger ? value : (battle.challenger_value as number)
      const opponentVal   = isOpponent   ? value : (battle.opponent_value   as number)
      if (challengerVal > opponentVal)      updates.winner_id = battle.challenger_id
      else if (opponentVal > challengerVal) updates.winner_id = battle.opponent_id
      // else draw — winner_id stays null
    }

    const { data: updated, error } = await supabase
      .from('battles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ battle: updated })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
