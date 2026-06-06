import { NextRequest, NextResponse } from 'next/server'
import type { PlanExercise } from '@/lib/types'

// TODO: replace with live Anthropic call once API is funded
const ALTERNATIVES: Record<string, PlanExercise[]> = {
  'barbell bench press': [
    { id: 'alt-1', name: 'Dumbbell Bench Press', sets: 4, reps: '8-10', muscleGroup: 'Chest' },
    { id: 'alt-2', name: 'Machine Chest Press', sets: 4, reps: '10-12', muscleGroup: 'Chest' },
    { id: 'alt-3', name: 'Cable Fly', sets: 3, reps: '12-15', muscleGroup: 'Chest' },
    { id: 'alt-4', name: 'Dips (Chest Focused)', sets: 3, reps: '8-12', muscleGroup: 'Chest' },
    { id: 'alt-5', name: 'Push-Up', sets: 4, reps: '15-20', muscleGroup: 'Chest' },
  ],
  'incline dumbbell press': [
    { id: 'alt-1', name: 'Incline Barbell Press', sets: 3, reps: '6-8', muscleGroup: 'Chest' },
    { id: 'alt-2', name: 'High Cable Fly', sets: 3, reps: '12-15', muscleGroup: 'Chest' },
    { id: 'alt-3', name: 'Landmine Press', sets: 3, reps: '10-12', muscleGroup: 'Chest' },
    { id: 'alt-4', name: 'Incline Machine Press', sets: 3, reps: '10-12', muscleGroup: 'Chest' },
    { id: 'alt-5', name: 'Decline Push-Up', sets: 3, reps: '15-20', muscleGroup: 'Chest' },
  ],
  'cable lateral raise': [
    { id: 'alt-1', name: 'Dumbbell Lateral Raise', sets: 4, reps: '12-15', muscleGroup: 'Shoulders' },
    { id: 'alt-2', name: 'Machine Lateral Raise', sets: 4, reps: '12-15', muscleGroup: 'Shoulders' },
    { id: 'alt-3', name: 'Upright Row', sets: 3, reps: '10-12', muscleGroup: 'Shoulders' },
    { id: 'alt-4', name: 'Band Lateral Raise', sets: 3, reps: '15-20', muscleGroup: 'Shoulders' },
    { id: 'alt-5', name: 'Arnold Press', sets: 3, reps: '10-12', muscleGroup: 'Shoulders' },
  ],
  'overhead press': [
    { id: 'alt-1', name: 'Dumbbell Shoulder Press', sets: 3, reps: '10-12', muscleGroup: 'Shoulders' },
    { id: 'alt-2', name: 'Smith Machine Press', sets: 3, reps: '8-10', muscleGroup: 'Shoulders' },
    { id: 'alt-3', name: 'Arnold Press', sets: 3, reps: '10-12', muscleGroup: 'Shoulders' },
    { id: 'alt-4', name: 'Seated Barbell Press', sets: 3, reps: '8-10', muscleGroup: 'Shoulders' },
    { id: 'alt-5', name: 'Machine Shoulder Press', sets: 3, reps: '10-12', muscleGroup: 'Shoulders' },
  ],
  'tricep rope pushdown': [
    { id: 'alt-1', name: 'Overhead Tricep Extension', sets: 3, reps: '10-12', muscleGroup: 'Triceps' },
    { id: 'alt-2', name: 'Tricep Dips', sets: 3, reps: '10-15', muscleGroup: 'Triceps' },
    { id: 'alt-3', name: 'Close Grip Bench Press', sets: 3, reps: '8-10', muscleGroup: 'Triceps' },
    { id: 'alt-4', name: 'Skull Crusher', sets: 3, reps: '10-12', muscleGroup: 'Triceps' },
    { id: 'alt-5', name: 'Diamond Push-Up', sets: 3, reps: '12-15', muscleGroup: 'Triceps' },
  ],
  'overhead tricep extension': [
    { id: 'alt-1', name: 'Tricep Rope Pushdown', sets: 3, reps: '12-15', muscleGroup: 'Triceps' },
    { id: 'alt-2', name: 'Skull Crusher', sets: 3, reps: '10-12', muscleGroup: 'Triceps' },
    { id: 'alt-3', name: 'Tricep Dips', sets: 3, reps: '10-15', muscleGroup: 'Triceps' },
    { id: 'alt-4', name: 'Close Grip Bench Press', sets: 3, reps: '8-10', muscleGroup: 'Triceps' },
    { id: 'alt-5', name: 'Kickback', sets: 3, reps: '12-15', muscleGroup: 'Triceps' },
  ],
  'barbell row': [
    { id: 'alt-1', name: 'Dumbbell Row', sets: 4, reps: '10-12', muscleGroup: 'Back' },
    { id: 'alt-2', name: 'Chest-Supported Row', sets: 4, reps: '10-12', muscleGroup: 'Back' },
    { id: 'alt-3', name: 'Seated Cable Row', sets: 3, reps: '12-15', muscleGroup: 'Back' },
    { id: 'alt-4', name: 'Pendlay Row', sets: 4, reps: '6-8', muscleGroup: 'Back' },
    { id: 'alt-5', name: 'T-Bar Row', sets: 4, reps: '8-10', muscleGroup: 'Back' },
  ],
  'lat pulldown': [
    { id: 'alt-1', name: 'Pull-Up', sets: 4, reps: 'AMRAP', muscleGroup: 'Back' },
    { id: 'alt-2', name: 'Assisted Pull-Up', sets: 4, reps: '8-10', muscleGroup: 'Back' },
    { id: 'alt-3', name: 'Wide Grip Cable Row', sets: 3, reps: '10-12', muscleGroup: 'Back' },
    { id: 'alt-4', name: 'Straight Arm Pulldown', sets: 3, reps: '12-15', muscleGroup: 'Back' },
    { id: 'alt-5', name: 'Single Arm Pulldown', sets: 3, reps: '12 each', muscleGroup: 'Back' },
  ],
  'seated cable row': [
    { id: 'alt-1', name: 'Dumbbell Row', sets: 4, reps: '10-12', muscleGroup: 'Back' },
    { id: 'alt-2', name: 'Chest-Supported Row', sets: 3, reps: '10-12', muscleGroup: 'Back' },
    { id: 'alt-3', name: 'Barbell Row', sets: 4, reps: '8-10', muscleGroup: 'Back' },
    { id: 'alt-4', name: 'Machine Row', sets: 3, reps: '10-12', muscleGroup: 'Back' },
    { id: 'alt-5', name: 'Band Row', sets: 3, reps: '15-20', muscleGroup: 'Back' },
  ],
  'face pull': [
    { id: 'alt-1', name: 'Band Pull Apart', sets: 3, reps: '15-20', muscleGroup: 'Rear Delt' },
    { id: 'alt-2', name: 'Rear Delt Fly', sets: 3, reps: '15-20', muscleGroup: 'Rear Delt' },
    { id: 'alt-3', name: 'Reverse Pec Deck', sets: 3, reps: '15-20', muscleGroup: 'Rear Delt' },
    { id: 'alt-4', name: 'High Cable Row', sets: 3, reps: '12-15', muscleGroup: 'Rear Delt' },
    { id: 'alt-5', name: 'YTW Raise', sets: 3, reps: '10-12', muscleGroup: 'Rear Delt' },
  ],
  'dumbbell curl': [
    { id: 'alt-1', name: 'Barbell Curl', sets: 3, reps: '10-12', muscleGroup: 'Biceps' },
    { id: 'alt-2', name: 'Cable Curl', sets: 3, reps: '12-15', muscleGroup: 'Biceps' },
    { id: 'alt-3', name: 'Preacher Curl', sets: 3, reps: '10-12', muscleGroup: 'Biceps' },
    { id: 'alt-4', name: 'Concentration Curl', sets: 3, reps: '12 each', muscleGroup: 'Biceps' },
    { id: 'alt-5', name: 'Incline Dumbbell Curl', sets: 3, reps: '10-12', muscleGroup: 'Biceps' },
  ],
  'hammer curl': [
    { id: 'alt-1', name: 'Rope Hammer Curl', sets: 3, reps: '12-15', muscleGroup: 'Biceps' },
    { id: 'alt-2', name: 'Cross Body Curl', sets: 3, reps: '12 each', muscleGroup: 'Biceps' },
    { id: 'alt-3', name: 'Reverse Curl', sets: 3, reps: '12-15', muscleGroup: 'Biceps' },
    { id: 'alt-4', name: 'Neutral Grip Chin-Up', sets: 3, reps: 'AMRAP', muscleGroup: 'Biceps' },
    { id: 'alt-5', name: 'Zottman Curl', sets: 3, reps: '10-12', muscleGroup: 'Biceps' },
  ],
  'barbell back squat': [
    { id: 'alt-1', name: 'Front Squat', sets: 4, reps: '6-8', muscleGroup: 'Legs' },
    { id: 'alt-2', name: 'Hack Squat', sets: 4, reps: '10-12', muscleGroup: 'Legs' },
    { id: 'alt-3', name: 'Leg Press', sets: 4, reps: '12-15', muscleGroup: 'Legs' },
    { id: 'alt-4', name: 'Bulgarian Split Squat', sets: 3, reps: '10 each', muscleGroup: 'Legs' },
    { id: 'alt-5', name: 'Goblet Squat', sets: 3, reps: '12-15', muscleGroup: 'Legs' },
  ],
  'romanian deadlift': [
    { id: 'alt-1', name: 'Stiff Leg Deadlift', sets: 3, reps: '8-10', muscleGroup: 'Hamstrings' },
    { id: 'alt-2', name: 'Leg Curl', sets: 3, reps: '12-15', muscleGroup: 'Hamstrings' },
    { id: 'alt-3', name: 'Good Morning', sets: 3, reps: '10-12', muscleGroup: 'Hamstrings' },
    { id: 'alt-4', name: 'Nordic Curl', sets: 3, reps: '6-8', muscleGroup: 'Hamstrings' },
    { id: 'alt-5', name: 'Dumbbell RDL', sets: 3, reps: '10-12', muscleGroup: 'Hamstrings' },
  ],
  'leg press': [
    { id: 'alt-1', name: 'Barbell Back Squat', sets: 4, reps: '6-8', muscleGroup: 'Legs' },
    { id: 'alt-2', name: 'Hack Squat', sets: 4, reps: '10-12', muscleGroup: 'Legs' },
    { id: 'alt-3', name: 'Bulgarian Split Squat', sets: 3, reps: '10 each', muscleGroup: 'Legs' },
    { id: 'alt-4', name: 'Step-Up', sets: 3, reps: '12 each', muscleGroup: 'Legs' },
    { id: 'alt-5', name: 'Wall Sit', sets: 3, reps: '45 sec', muscleGroup: 'Legs' },
  ],
  'walking lunges': [
    { id: 'alt-1', name: 'Reverse Lunge', sets: 3, reps: '12 each', muscleGroup: 'Legs' },
    { id: 'alt-2', name: 'Step-Up', sets: 3, reps: '12 each', muscleGroup: 'Legs' },
    { id: 'alt-3', name: 'Bulgarian Split Squat', sets: 3, reps: '10 each', muscleGroup: 'Legs' },
    { id: 'alt-4', name: 'Lateral Lunge', sets: 3, reps: '10 each', muscleGroup: 'Legs' },
    { id: 'alt-5', name: 'Leg Press', sets: 3, reps: '12-15', muscleGroup: 'Legs' },
  ],
  'leg curl': [
    { id: 'alt-1', name: 'Romanian Deadlift', sets: 3, reps: '8-10', muscleGroup: 'Hamstrings' },
    { id: 'alt-2', name: 'Nordic Curl', sets: 3, reps: '6-8', muscleGroup: 'Hamstrings' },
    { id: 'alt-3', name: 'Glute Ham Raise', sets: 3, reps: '8-10', muscleGroup: 'Hamstrings' },
    { id: 'alt-4', name: 'Swiss Ball Curl', sets: 3, reps: '10-12', muscleGroup: 'Hamstrings' },
    { id: 'alt-5', name: 'Stiff Leg Deadlift', sets: 3, reps: '10-12', muscleGroup: 'Hamstrings' },
  ],
  'standing calf raise': [
    { id: 'alt-1', name: 'Seated Calf Raise', sets: 4, reps: '15-20', muscleGroup: 'Calves' },
    { id: 'alt-2', name: 'Leg Press Calf Raise', sets: 4, reps: '15-20', muscleGroup: 'Calves' },
    { id: 'alt-3', name: 'Single Leg Calf Raise', sets: 3, reps: '15 each', muscleGroup: 'Calves' },
    { id: 'alt-4', name: 'Donkey Calf Raise', sets: 4, reps: '15-20', muscleGroup: 'Calves' },
    { id: 'alt-5', name: 'Jump Rope', sets: 3, reps: '60 sec', muscleGroup: 'Calves' },
  ],
  'weighted pull-up': [
    { id: 'alt-1', name: 'Lat Pulldown', sets: 4, reps: '8-10', muscleGroup: 'Back' },
    { id: 'alt-2', name: 'Assisted Pull-Up', sets: 4, reps: '8-10', muscleGroup: 'Back' },
    { id: 'alt-3', name: 'Band Pull-Up', sets: 4, reps: '8-10', muscleGroup: 'Back' },
    { id: 'alt-4', name: 'Neutral Grip Pull-Up', sets: 4, reps: 'AMRAP', muscleGroup: 'Back' },
    { id: 'alt-5', name: 'Straight Arm Pulldown', sets: 3, reps: '12-15', muscleGroup: 'Back' },
  ],
  'close grip bench press': [
    { id: 'alt-1', name: 'Tricep Dips', sets: 3, reps: '10-15', muscleGroup: 'Triceps' },
    { id: 'alt-2', name: 'Skull Crusher', sets: 3, reps: '10-12', muscleGroup: 'Triceps' },
    { id: 'alt-3', name: 'Tricep Rope Pushdown', sets: 3, reps: '12-15', muscleGroup: 'Triceps' },
    { id: 'alt-4', name: 'Diamond Push-Up', sets: 3, reps: '12-15', muscleGroup: 'Triceps' },
    { id: 'alt-5', name: 'JM Press', sets: 3, reps: '8-10', muscleGroup: 'Triceps' },
  ],
  'dumbbell row': [
    { id: 'alt-1', name: 'Barbell Row', sets: 4, reps: '8-10', muscleGroup: 'Back' },
    { id: 'alt-2', name: 'Seated Cable Row', sets: 3, reps: '10-12', muscleGroup: 'Back' },
    { id: 'alt-3', name: 'Chest-Supported Row', sets: 3, reps: '10-12', muscleGroup: 'Back' },
    { id: 'alt-4', name: 'Machine Row', sets: 3, reps: '10-12', muscleGroup: 'Back' },
    { id: 'alt-5', name: 'T-Bar Row', sets: 4, reps: '8-10', muscleGroup: 'Back' },
  ],
  'dumbbell shoulder press': [
    { id: 'alt-1', name: 'Overhead Press', sets: 3, reps: '8-10', muscleGroup: 'Shoulders' },
    { id: 'alt-2', name: 'Arnold Press', sets: 3, reps: '10-12', muscleGroup: 'Shoulders' },
    { id: 'alt-3', name: 'Machine Shoulder Press', sets: 3, reps: '10-12', muscleGroup: 'Shoulders' },
    { id: 'alt-4', name: 'Push Press', sets: 3, reps: '6-8', muscleGroup: 'Shoulders' },
    { id: 'alt-5', name: 'Landmine Press', sets: 3, reps: '10-12', muscleGroup: 'Shoulders' },
  ],
  'cable curl': [
    { id: 'alt-1', name: 'Barbell Curl', sets: 3, reps: '10-12', muscleGroup: 'Biceps' },
    { id: 'alt-2', name: 'Dumbbell Curl', sets: 3, reps: '10-12', muscleGroup: 'Biceps' },
    { id: 'alt-3', name: 'Preacher Curl', sets: 3, reps: '10-12', muscleGroup: 'Biceps' },
    { id: 'alt-4', name: 'Incline Dumbbell Curl', sets: 3, reps: '10-12', muscleGroup: 'Biceps' },
    { id: 'alt-5', name: 'Concentration Curl', sets: 3, reps: '12 each', muscleGroup: 'Biceps' },
  ],
  'skull crusher': [
    { id: 'alt-1', name: 'Tricep Rope Pushdown', sets: 3, reps: '12-15', muscleGroup: 'Triceps' },
    { id: 'alt-2', name: 'Overhead Tricep Extension', sets: 3, reps: '10-12', muscleGroup: 'Triceps' },
    { id: 'alt-3', name: 'Close Grip Bench Press', sets: 3, reps: '8-10', muscleGroup: 'Triceps' },
    { id: 'alt-4', name: 'Tricep Dips', sets: 3, reps: '10-15', muscleGroup: 'Triceps' },
    { id: 'alt-5', name: 'Kickback', sets: 3, reps: '12-15', muscleGroup: 'Triceps' },
  ],
}

export async function POST(req: NextRequest) {
  const { exerciseName } = await req.json()
  const key = (exerciseName || '').toLowerCase().trim()

  // Exact match first
  if (ALTERNATIVES[key]) {
    return NextResponse.json({ alternatives: ALTERNATIVES[key] })
  }

  // Partial match — find any key that contains the exercise name or vice versa
  const partialKey = Object.keys(ALTERNATIVES).find(k => k.includes(key) || key.includes(k))
  if (partialKey) {
    return NextResponse.json({ alternatives: ALTERNATIVES[partialKey] })
  }

  // Smart fallback based on muscle group keywords in the name
  const name = key.toLowerCase()
  let fallback: PlanExercise[]

  if (name.includes('curl') || name.includes('bicep')) {
    fallback = ALTERNATIVES['dumbbell curl']
  } else if (name.includes('tricep') || name.includes('push') || name.includes('dip')) {
    fallback = ALTERNATIVES['tricep rope pushdown']
  } else if (name.includes('press') && (name.includes('bench') || name.includes('chest'))) {
    fallback = ALTERNATIVES['barbell bench press']
  } else if (name.includes('shoulder') || name.includes('press') || name.includes('delt')) {
    fallback = ALTERNATIVES['overhead press']
  } else if (name.includes('row') || name.includes('pull') || name.includes('back') || name.includes('lat')) {
    fallback = ALTERNATIVES['barbell row']
  } else if (name.includes('squat') || name.includes('lunge') || name.includes('leg')) {
    fallback = ALTERNATIVES['barbell back squat']
  } else if (name.includes('deadlift') || name.includes('hamstring')) {
    fallback = ALTERNATIVES['romanian deadlift']
  } else if (name.includes('calf')) {
    fallback = ALTERNATIVES['standing calf raise']
  } else {
    // True generic fallback with real exercise names
    fallback = [
      { id: 'alt-1', name: 'Dumbbell Press', sets: 3, reps: '10-12', muscleGroup: 'General' },
      { id: 'alt-2', name: 'Cable Row', sets: 3, reps: '12-15', muscleGroup: 'General' },
      { id: 'alt-3', name: 'Machine Press', sets: 3, reps: '12-15', muscleGroup: 'General' },
      { id: 'alt-4', name: 'Dumbbell Fly', sets: 3, reps: '12-15', muscleGroup: 'General' },
      { id: 'alt-5', name: 'Bodyweight Squat', sets: 3, reps: '15-20', muscleGroup: 'General' },
    ]
  }

  return NextResponse.json({ alternatives: fallback })
}
