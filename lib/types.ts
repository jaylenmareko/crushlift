export interface OnboardingData {
  goal: string
  goalCustom?: string
  goalTarget?: string
  liftGoals?: Array<{ lift: string; current: string; target: string }>
  experience: string
  daysPerWeek: number
  sessionLength?: number
  splitType?: string
  trainingDays?: string[]
  equipment: string
  equipmentCustom?: string
  bodyComp?: string
  musclePriority?: string[]
  recovery?: string
  sex?: string
  weight?: number
  height?: string
  age?: number
  injuryNotes?: string
  cardio?: string
  notes?: string
}

export interface CardioEntry {
  id: string
  date: string
  type: string
  distance?: string
  duration?: string
  intensity: 'easy' | 'moderate' | 'hard'
  notes?: string
}

export interface PlanExercise {
  id: string
  exerciseId?: string
  name: string
  sets: number
  reps: string
  notes?: string
  muscleGroup?: string
  youtubeVideoId?: string
  thumbnailUrl?: string
}

export interface PlanDay {
  dayNumber: number
  dayName: string
  exercises: PlanExercise[]
}

export interface Plan {
  id: string
  user_id: string | null
  userId?: string
  onboardingData?: OnboardingData
  onboarding_data?: OnboardingData
  days: PlanDay[]
  createdAt?: string
  created_at?: string
}

export interface WorkoutSet {
  id: string
  setNumber: number
  weight: number | null
  reps: number | null
  completed: boolean
  previousWeight?: number | null
  previousReps?: number | null
}

export interface WorkoutSession {
  id: string
  userId: string
  planId: string
  dayNumber: number
  dayName: string
  startedAt: string
  finishedAt?: string
  durationSeconds?: number
}

export interface WorkoutHistoryEntry {
  id: string
  date: string
  dayName: string
  dayNumber: number
  durationSeconds?: number
  exercises: Array<{
    name: string
    sets: Array<{ setNumber: number; weight: number | null; reps: number | null; completed: boolean }>
  }>
}

export type SubscriptionStatus = 'active' | 'trialing' | 'canceled' | 'past_due' | null

export interface Profile {
  id: string
  email: string
  stripeCustomerId?: string
  subscriptionStatus: SubscriptionStatus
  subscriptionPeriodEnd?: string
}
