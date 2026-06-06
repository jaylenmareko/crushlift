import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { OnboardingData, PlanDay, WorkoutHistoryEntry, CardioEntry } from '@/lib/types'

// TODO: remove DUMMY_PLAN and uncomment Anthropic call once API is funded
const DUMMY_PLAN: { days: PlanDay[] } = {
  days: [
    {
      dayNumber: 1,
      dayName: 'Push Day',
      exercises: [
        { id: '1-1', name: 'Barbell Bench Press', sets: 4, reps: '5-6' },
        { id: '1-2', name: 'Incline Dumbbell Press', sets: 3, reps: '8-10' },
        { id: '1-3', name: 'Cable Lateral Raise', sets: 4, reps: '12-15' },
        { id: '1-4', name: 'Overhead Press', sets: 3, reps: '8-10' },
        { id: '1-5', name: 'Tricep Rope Pushdown', sets: 3, reps: '12-15' },
        { id: '1-6', name: 'Overhead Tricep Extension', sets: 3, reps: '10-12' },
      ],
    },
    {
      dayNumber: 2,
      dayName: 'Pull Day',
      exercises: [
        { id: '2-1', name: 'Barbell Row', sets: 4, reps: '6-8' },
        { id: '2-2', name: 'Lat Pulldown', sets: 3, reps: '10-12' },
        { id: '2-3', name: 'Seated Cable Row', sets: 3, reps: '10-12' },
        { id: '2-4', name: 'Face Pull', sets: 3, reps: '15-20' },
        { id: '2-5', name: 'Dumbbell Curl', sets: 3, reps: '10-12' },
        { id: '2-6', name: 'Hammer Curl', sets: 3, reps: '10-12' },
      ],
    },
    {
      dayNumber: 3,
      dayName: 'Leg Day',
      exercises: [
        { id: '3-1', name: 'Barbell Back Squat', sets: 4, reps: '5-6' },
        { id: '3-2', name: 'Romanian Deadlift', sets: 3, reps: '8-10' },
        { id: '3-3', name: 'Leg Press', sets: 3, reps: '10-12' },
        { id: '3-4', name: 'Walking Lunges', sets: 3, reps: '12 each leg' },
        { id: '3-5', name: 'Leg Curl', sets: 3, reps: '12-15' },
        { id: '3-6', name: 'Standing Calf Raise', sets: 4, reps: '15-20' },
      ],
    },
    {
      dayNumber: 4,
      dayName: 'Upper Strength',
      exercises: [
        { id: '4-1', name: 'Weighted Pull-Up', sets: 4, reps: '4-6' },
        { id: '4-2', name: 'Close Grip Bench Press', sets: 4, reps: '5-6' },
        { id: '4-3', name: 'Dumbbell Row', sets: 3, reps: '8-10 each' },
        { id: '4-4', name: 'Dumbbell Shoulder Press', sets: 3, reps: '8-10' },
        { id: '4-5', name: 'Cable Curl', sets: 3, reps: '12-15' },
        { id: '4-6', name: 'Skull Crusher', sets: 3, reps: '10-12' },
      ],
    },
  ],
}

interface RequestBody {
  onboarding: OnboardingData
  workoutHistory?: WorkoutHistoryEntry[]
  sorenessLog?: Record<string, Record<string, number>>
  cardioLog?: CardioEntry[]
}

function buildContext(
  onboarding: OnboardingData,
  workoutHistory: WorkoutHistoryEntry[],
  sorenessLog: Record<string, Record<string, number>>,
  cardioLog: CardioEntry[]
): string {
  const lines: string[] = []

  // --- GOAL ---
  lines.push('GOAL')
  const goalLabel = onboarding.goalCustom || onboarding.goal
  if (onboarding.goalTarget) {
    lines.push(`${goalLabel} — ${onboarding.goalTarget}`)
  } else if (onboarding.liftGoals?.length) {
    lines.push(goalLabel)
    onboarding.liftGoals.forEach(g => {
      lines.push(`  • ${g.lift}: currently ${g.current || '?'} → goal ${g.target || '?'}`)
    })
  } else {
    lines.push(goalLabel)
  }

  // --- PROFILE ---
  lines.push('\nPROFILE')
  const profileParts = [
    onboarding.experience && `Experience: ${onboarding.experience}`,
    onboarding.sex && onboarding.sex !== 'Prefer not to say' && `Sex: ${onboarding.sex}`,
    onboarding.age && `Age: ${onboarding.age}`,
    onboarding.height && `Height: ${onboarding.height}`,
    onboarding.weight && `Weight: ${onboarding.weight} lbs`,
  ].filter(Boolean)
  lines.push(profileParts.join(' | '))

  // --- SCHEDULE ---
  lines.push('\nSCHEDULE')
  const scheduleParts = [
    `${onboarding.daysPerWeek} days/week`,
    onboarding.sessionLength && `${onboarding.sessionLength} min sessions`,
    onboarding.splitType && onboarding.splitType !== 'not_sure' && `${onboarding.splitType} split`,
    onboarding.trainingDays?.length && `Training days: ${onboarding.trainingDays.join(', ')}`,
  ].filter(Boolean)
  lines.push(scheduleParts.join(' · '))

  // --- EQUIPMENT ---
  lines.push('\nEQUIPMENT')
  lines.push(onboarding.equipmentCustom || onboarding.equipment)

  // --- BODY COMPOSITION ---
  if (onboarding.bodyComp) {
    lines.push('\nBODY COMPOSITION FOCUS')
    lines.push(onboarding.bodyComp)
  }

  // --- MUSCLE PRIORITY ---
  if (onboarding.musclePriority?.length) {
    lines.push('\nMUSCLE PRIORITY (emphasize these)')
    lines.push(onboarding.musclePriority.join(', '))
  }

  // --- RECOVERY ---
  if (onboarding.recovery) {
    lines.push('\nRECOVERY CAPACITY')
    lines.push(onboarding.recovery)
  }

  // --- INJURIES ---
  if (onboarding.injuryNotes) {
    lines.push('\nINJURIES / LIMITATIONS')
    lines.push(onboarding.injuryNotes)
  }

  // --- CARDIO ---
  if (onboarding.cardio && onboarding.cardio !== 'none') {
    lines.push('\nCARDIO HABITS')
    lines.push(onboarding.cardio)
  }

  // --- NOTES ---
  if (onboarding.notes) {
    lines.push('\nUSER NOTES')
    lines.push(onboarding.notes)
  }

  // --- RECENT WORKOUTS ---
  const recentWorkouts = workoutHistory.slice(0, 5)
  if (recentWorkouts.length) {
    lines.push('\nRECENT WORKOUTS')
    recentWorkouts.forEach(w => {
      const date = new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const exerciseSummary = w.exercises.slice(0, 3).map(ex => {
        const topSet = ex.sets.filter(s => s.completed).sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))[0]
        return topSet ? `${ex.name} ${topSet.weight ?? '?'}×${topSet.reps ?? '?'}` : ex.name
      }).join(', ')
      lines.push(`• ${date}: ${w.dayName}${exerciseSummary ? ` — ${exerciseSummary}` : ''}`)
    })
  }

  // --- RECENT SORENESS ---
  const sorenessEntries = Object.entries(sorenessLog)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 3)
  if (sorenessEntries.length) {
    lines.push('\nRECENT SORENESS')
    sorenessEntries.forEach(([date, areas]) => {
      const d = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const soreList = Object.entries(areas)
        .filter(([, v]) => v > 0)
        .map(([area, v]) => `${area} (${['', 'mild', 'moderate', 'sore'][v]})`)
        .join(', ')
      if (soreList) lines.push(`• ${d}: ${soreList}`)
    })
  }

  // --- RECENT CARDIO LOG ---
  const recentCardio = cardioLog.slice(0, 5)
  if (recentCardio.length) {
    lines.push('\nRECENT CARDIO')
    recentCardio.forEach(c => {
      const date = new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const detail = [c.distance, c.duration, c.intensity].filter(Boolean).join(', ')
      lines.push(`• ${date}: ${c.type}${detail ? ` — ${detail}` : ''}`)
    })
  }

  return lines.join('\n')
}

export async function POST(req: NextRequest) {
  const body: RequestBody = await req.json()
  const {
    onboarding,
    workoutHistory = [],
    sorenessLog = {},
    cardioLog = [],
  } = body

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const context = buildContext(onboarding, workoutHistory, sorenessLog, cardioLog)

  /* ---------------------------------------------------------
   * LIVE ANTHROPIC CALL — uncomment when API is funded
   * and remove the DUMMY_PLAN fallback below
   * ---------------------------------------------------------
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `You are a professional personal trainer. Build a personalized ${onboarding.daysPerWeek}-day/week workout plan.

${context}

${onboarding.splitType === 'not_sure' ? 'Choose the best split type based on the athlete profile above.' : ''}

Return ONLY a valid JSON object, no markdown:
{
  "days": [
    {
      "dayNumber": 1,
      "dayName": "Push Day",
      "exercises": [
        { "id": "1-1", "name": "Barbell Bench Press", "sets": 4, "reps": "6-8", "notes": "optional cue" }
      ]
    }
  ]
}

Rules:
- Exactly ${onboarding.daysPerWeek} workout days
- 4-7 exercises per day suited to the equipment
- Rep ranges as strings: "8-12", "5", "AMRAP"
- Unique IDs in "day-exercise" format: "1-1", "1-2"
- Adjust volume/intensity based on soreness and cardio load
- If injuries noted, avoid contraindicated movements
- Day names should reflect the split (Push, Pull, Legs, Upper, Lower, Full Body, etc.)`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
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
   * --------------------------------------------------------- */

  // TODO: remove once Anthropic API is funded
  const parsed: { days: PlanDay[] } = DUMMY_PLAN

  if (user) {
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

  const guestPlan = {
    id: crypto.randomUUID(),
    user_id: null,
    onboarding_data: onboarding,
    days: parsed.days,
    created_at: new Date().toISOString(),
  }
  return NextResponse.json({ plan: guestPlan, guest: true })
}
