import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { OnboardingData, PlanDay } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: { onboarding: OnboardingData } = await req.json()
  const { onboarding } = body

  const prompt = `You are a professional personal trainer. Build a ${onboarding.daysPerWeek}-day/week workout plan for someone with the following profile:

Goal: ${onboarding.goal}${onboarding.goalCustom ? ` (${onboarding.goalCustom})` : ''}
Experience: ${onboarding.experience}
Days per week: ${onboarding.daysPerWeek}
Equipment: ${onboarding.equipment}${onboarding.equipmentCustom ? ` (${onboarding.equipmentCustom})` : ''}
Notes: ${onboarding.notes || 'None'}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "days": [
    {
      "dayNumber": 1,
      "dayName": "Push Day",
      "exercises": [
        {
          "id": "unique-id-1",
          "name": "Barbell Bench Press",
          "sets": 4,
          "reps": "6-8",
          "notes": "Focus on full range of motion"
        }
      ]
    }
  ]
}

Rules:
- ${onboarding.daysPerWeek} workout days only
- Each day: 4-7 exercises appropriate for the equipment
- reps is a string like "8-12" or "5" or "AMRAP"
- id must be unique (use day-exercise format like "1-1")
- Day names should be descriptive (Push, Pull, Legs, Upper Body, Full Body, etc.)
- Keep it simple enough for a beginner to follow if experience is beginner`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  let parsed: { days: PlanDay[] }
  try {
    parsed = JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ error: 'Failed to parse plan' }, { status: 500 })
    parsed = JSON.parse(match[0])
  }

  const { data: plan, error } = await supabase
    .from('plans')
    .insert({
      user_id: user.id,
      onboarding_data: onboarding,
      days: parsed.days,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ plan })
}
