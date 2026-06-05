import { NextRequest, NextResponse } from 'next/server'
import type { PlanExercise } from '@/lib/types'

// TODO: replace with live Anthropic call once API is funded
const DUMMY_ALTERNATIVES: Record<string, PlanExercise[]> = {
  'barbell bench press': [
    { id: 'alt-1', name: 'Dumbbell Bench Press', sets: 4, reps: '8-10', notes: 'Greater range of motion', muscleGroup: 'Chest' },
    { id: 'alt-2', name: 'Machine Chest Press', sets: 4, reps: '10-12', notes: 'Easier to control load', muscleGroup: 'Chest' },
    { id: 'alt-3', name: 'Push-Up (Weighted)', sets: 4, reps: '12-15', notes: 'Add plates on back for resistance', muscleGroup: 'Chest' },
    { id: 'alt-4', name: 'Cable Fly', sets: 3, reps: '12-15', notes: 'Constant tension through ROM', muscleGroup: 'Chest' },
    { id: 'alt-5', name: 'Dips (Chest Focused)', sets: 3, reps: '8-12', notes: 'Lean forward slightly', muscleGroup: 'Chest' },
  ],
  'incline dumbbell press': [
    { id: 'alt-1', name: 'Incline Barbell Press', sets: 3, reps: '6-8', notes: 'Heavier load possible', muscleGroup: 'Chest' },
    { id: 'alt-2', name: 'High Cable Fly', sets: 3, reps: '12-15', notes: 'Targets upper chest', muscleGroup: 'Chest' },
    { id: 'alt-3', name: 'Landmine Press', sets: 3, reps: '10-12', notes: 'Shoulder-friendly angle', muscleGroup: 'Chest' },
    { id: 'alt-4', name: 'Smith Machine Incline Press', sets: 3, reps: '10-12', notes: 'Fixed path for stability', muscleGroup: 'Chest' },
    { id: 'alt-5', name: 'Decline Push-Up', sets: 3, reps: '15-20', notes: 'Bodyweight upper chest', muscleGroup: 'Chest' },
  ],
  'barbell back squat': [
    { id: 'alt-1', name: 'Front Squat', sets: 4, reps: '6-8', notes: 'More quad emphasis', muscleGroup: 'Legs' },
    { id: 'alt-2', name: 'Hack Squat', sets: 4, reps: '10-12', notes: 'Machine-based, knee-friendly', muscleGroup: 'Legs' },
    { id: 'alt-3', name: 'Leg Press', sets: 4, reps: '12-15', notes: 'Higher load, less spinal stress', muscleGroup: 'Legs' },
    { id: 'alt-4', name: 'Bulgarian Split Squat', sets: 3, reps: '10 each', notes: 'Unilateral, great for balance', muscleGroup: 'Legs' },
    { id: 'alt-5', name: 'Goblet Squat', sets: 3, reps: '12-15', notes: 'Great for learning squat pattern', muscleGroup: 'Legs' },
  ],
  'barbell row': [
    { id: 'alt-1', name: 'Dumbbell Row', sets: 4, reps: '10-12', notes: 'Greater ROM per side', muscleGroup: 'Back' },
    { id: 'alt-2', name: 'Chest-Supported Row', sets: 4, reps: '10-12', notes: 'Eliminates lower back stress', muscleGroup: 'Back' },
    { id: 'alt-3', name: 'Seated Cable Row', sets: 3, reps: '12-15', notes: 'Constant tension', muscleGroup: 'Back' },
    { id: 'alt-4', name: 'Pendlay Row', sets: 4, reps: '6-8', notes: 'Explosive pull from floor', muscleGroup: 'Back' },
    { id: 'alt-5', name: 'Inverted Row', sets: 3, reps: 'AMRAP', notes: 'Bodyweight option', muscleGroup: 'Back' },
  ],
}

const GENERIC_ALTERNATIVES: PlanExercise[] = [
  { id: 'alt-1', name: 'Dumbbell Variation', sets: 3, reps: '10-12', notes: 'Similar movement pattern with dumbbells', muscleGroup: 'General' },
  { id: 'alt-2', name: 'Cable Variation', sets: 3, reps: '12-15', notes: 'Constant tension through full ROM', muscleGroup: 'General' },
  { id: 'alt-3', name: 'Machine Variation', sets: 3, reps: '12-15', notes: 'Fixed path, easier to focus on muscle', muscleGroup: 'General' },
  { id: 'alt-4', name: 'Bodyweight Variation', sets: 3, reps: '15-20', notes: 'No equipment needed', muscleGroup: 'General' },
  { id: 'alt-5', name: 'Band Variation', sets: 3, reps: '15-20', notes: 'Resistance band alternative', muscleGroup: 'General' },
]

export async function POST(req: NextRequest) {
  const { exerciseName } = await req.json()
  const key = (exerciseName || '').toLowerCase()
  const alternatives = DUMMY_ALTERNATIVES[key] || GENERIC_ALTERNATIVES
  return NextResponse.json({ alternatives })
}
