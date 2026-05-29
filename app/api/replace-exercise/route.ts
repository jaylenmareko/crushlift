import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { exerciseName, equipment, goal, customRequest } = await req.json()

  const prompt = `Suggest 5 alternative exercises to replace "${exerciseName}".
Context: Equipment available: ${equipment || 'full gym'}. Goal: ${goal || 'general fitness'}.
${customRequest ? `User request: "${customRequest}"` : ''}

Return ONLY a JSON array of 5 exercises (no markdown):
[
  {
    "id": "alt-1",
    "name": "Exercise Name",
    "sets": 3,
    "reps": "8-12",
    "notes": "Why this is a good alternative"
  }
]`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '[]'

  let alternatives
  try {
    alternatives = JSON.parse(text)
  } catch {
    const match = text.match(/\[[\s\S]*\]/)
    alternatives = match ? JSON.parse(match[0]) : []
  }

  return NextResponse.json({ alternatives })
}
