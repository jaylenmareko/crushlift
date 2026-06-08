# Trainmaxxing — Project Context

## What This Is
AI-powered workout planning web app with a gamified ranking system (Power Rank) and 1v1 battles.
App name: **Trainmaxxing** (repo: `crushlift`, was originally named CrushLift)

## Stage
**MVP Build** — core flows built, dummy data on compete page, auth wired up, plan generation working.

## Done Criteria (this stage)
- [ ] Power Rank logic (belt thresholds per lift per weight class, verified PR detection)
- [ ] 1v1 Battle flow (challenge, respond, Claude verification, W/L record)
- [ ] Friends system (search, add, challenge button)
- [ ] Real data replacing dummy data on compete page

## Completed (2026-06-08)
- Equipment step converted to multi-select (checkbox style, joins as comma string in payload)
- Per-field live validation on account step (green/red border, inline error hints)
- Full visual redesign — energetic/spacey design language applied to all pages:
  - Uppercase headings (`text-[2rem] font-black uppercase`), orange sublabels
  - Ambient orange glow on every page
  - Orange glow on selected card states
  - Section labels → `text-[11px] font-bold text-[#FF4500]/70 uppercase tracking-widest`
  - CTA buttons → `font-black uppercase tracking-[0.12em]` + stronger shadow
  - BottomNav: glowing orange top-line indicator on active tab, uppercase labels
  - Onboarding: step label pill (`GOAL · 1/9`), thicker progress bar with glow, energetic transitions

## Stack
- **Framework:** Next.js 16 App Router (Turbopack)
- **Auth + DB:** Supabase (`rjqwjfzvhkdkdjldlnqs`) — credentials in `.env.local` (gitignored)
- **Styling:** Tailwind CSS dark theme (`#0D0D0F` bg, `#FF4500` accent, `#1C1C1E` cards)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **AI:** Anthropic Claude API (plan generation + form verification)

## Supabase Schema
- `profiles` — id, email, username, first_name, created_at
- `plans` — id, user_id, onboarding_data (jsonb), days (jsonb), created_at
- `workout_sessions` — id, user_id, plan_id, day_number, day_name, started_at, finished_at
- `workout_sets` — id, session_id, exercise_name, set_number, weight_lbs, reps, completed

## File Map
```
app/
  page.tsx              — Landing page (wordmark, feature pills, Get Started CTA)
  onboarding/page.tsx   — 9-step onboarding flow (goal → account creation)
  plan/page.tsx         — Plan view (week calendar, exercise list, workout launch)
  workout/page.tsx      — Active workout (sets/reps input, rest timer, form check)
  workout/complete/     — Post-workout summary
  compete/page.tsx      — Compete hub (Belts / Rankings / Battles tabs)
  friends/page.tsx      — Friends list (placeholder)
  profile/page.tsx      — Profile, memories (workout history), settings link
  settings/page.tsx     — Account, subscription, preferences
  login/page.tsx        — Login
  api/generate-plan/    — Claude API route for plan generation
  api/analyze-form/     — Claude Vision route for form verification

components/
  BottomNav.tsx         — 5-tab mobile nav (Plan/Workout/Compete/Friends/Profile)
  SideNav.tsx           — Desktop sidebar
  AppShell.tsx          — Conditionally renders SideNav on app routes only
  FormAnalysisModal.tsx — In-workout form check modal
  PaywallModal.tsx      — Subscription gate

lib/
  supabase/client.ts    — Browser Supabase client
  types.ts              — OnboardingData, Plan, WorkoutSet, etc.
```

## Current Priority
1. Power Rank — belt thresholds table, PR detection in workout page, rank stored in profiles
2. 1v1 Battle flow
3. Friends system

## Compete Page System Design
Two separate systems:

**Belt System (karate-style achievement):**
- 6 belts: Beginner → Novice → Lifter → Elite → Master → Legend
- Fixed weight thresholds per lift per weight class
- Hit the threshold on any Big 6 lift = earn the belt
- Nobody can take it from you

**Battle Rankings (boxing-style competition):**
- W/L record from 1v1 battles determines your rank (#1, #2, #3...) in your weight class
- 6 weight classes: <135 / 135–150 / 150–175 / 175–200 / 200–220 / 220+
- Rankings only within your weight class
- Belt threshold tables still need to be defined per lift per class

**Big 6 lifts:** Bench Press, Squat, Deadlift, Overhead Press, Barbell Row, Pull-up

## Onboarding Flow (9 steps)
1. Goal (lose weight / build muscle / get stronger / general fitness)
2. Experience level (4 options with emojis)
3. Schedule (days/week + session length + split — multi-select + training days optional)
4. Equipment (multi-select)
5. Muscle priority (optional)
6. About you (sex, weight, height, age — optional)
7. Injuries / limitations (optional textarea)
8. Notes (optional textarea)
9. Account creation (first name, username, email, password → Supabase signUp → plan generation)

## Design System
- Background: `#0D0D0F`
- Cards: `#1C1C1E`, border `#252528`
- Accent / primary CTA: `#FF4500` (orange-red)
- Muted text: `#9A9AAA`, `#636366`, `#48484A`
- Success: `#22C55E`
- Tabs: computer/browser tab style — active tab raised white on dark tab bar, colored underline accent

## Key Rules
- No guest mode — all users must create an account
- `trainmaxxing_*` prefix on all localStorage/sessionStorage keys
- Never touch production without asking
- Never refactor unless asked
- `.env.local` is gitignored — credentials never in repo
- Supabase project ref: `rjqwjfzvhkdkdjldlnqs` (get keys from Supabase dashboard or ask Jaylen)
- YouTube API key is blank — add `YOUTUBE_API_KEY` to `.env.local` to enable exercise demo videos (Google Cloud Console → YouTube Data API v3)
