export interface OnboardingData {
  goal: string
  goalCustom?: string
  experience: string
  daysPerWeek: number
  equipment: string
  equipmentCustom?: string
  notes?: string
}

export interface PlanExercise {
  id: string
  exerciseId?: string
  name: string
  sets: number
  reps: string
  notes?: string
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
  userId: string
  onboardingData: OnboardingData
  days: PlanDay[]
  createdAt: string
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

export type SubscriptionStatus = 'active' | 'trialing' | 'canceled' | 'past_due' | null

export interface Profile {
  id: string
  email: string
  stripeCustomerId?: string
  subscriptionStatus: SubscriptionStatus
  subscriptionPeriodEnd?: string
}
