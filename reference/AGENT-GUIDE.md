# Trainmaxxing — Agent Build & Design Guide

Read this before touching any code. It covers every pattern, decision, and preference that Jaylen has established. Do not deviate without a reason.

---

## What This App Is

AI-powered workout PR verification + gamified ranking web app. Mobile-first. Dark, energetic, competitive.

**Core loops:**
1. User follows an AI-generated workout plan
2. When they hit a PR, they verify it through a photo + video chain (Claude Vision)
3. Verified PRs earn belt tiers per lift (karate-style, never taken away)
4. 1v1 battles with others in the same weight class determine leaderboard rank

**Repo:** `jaylenmareko/crushlift` (app is called Trainmaxxing, repo name is legacy)
**Supabase project ref:** `cheanydnmvqdvsexxdav` (project name "trainmaxxing"). ⚠️ NOT `rjqwjfzvhkdkdjldlnqs` — that's a stale older DB named "PJRoutes" in the same org; do not use it.

---

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 App Router, Turbopack |
| Auth + DB | Supabase (PostgreSQL + Storage) |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Icons | Lucide React |
| AI | Anthropic Claude API (claude-sonnet-4-6) |
| UI primitives | shadcn/ui (`components/ui/`) |

---

## Design System

### Colors

```
Background:     #0D0D0F   (page bg)
Cards:          #1C1C1E   (card bg)
Deep card:      #161618   (input bg inside modals)
Border:         #252528   (standard border)
Border subtle:  #3A3A3C   (secondary buttons, icons)

Accent (primary): #FF4500  (orange-red — buttons, active states, glow)
Muted text:     #9A9AAA
Faint text:     #636366
Faintest:       #48484A   (placeholder, inactive nav)

Success:        #22C55E
Warning:        #F59E0B
Error:          red-400 / red-500
```

### Belt Colors

```
Legend:  #FFC107  (gold)
Master:  #8B5CF6  (purple)
Elite:   #EF4444  (red)
Lifter:  #3B82F6  (blue)
Bronze:  #22C55E  (green)
Iron:    #636366  → display as #D1D5DB
```

**Iron display rule:** Iron's raw color (`#636366`) blends with the "locked/unearned" gray (`#9A9AAA`) on dark cards. Always use the `displayColor()` helper that swaps Iron to `#D1D5DB` for rendered output. Never show `#636366` in the UI.

```ts
function displayColor(color: string) {
  return color === '#636366' ? '#D1D5DB' : color
}
```

### Typography

| Use case | Classes |
|---|---|
| Page title | `text-2xl font-bold` |
| Section heading | `text-lg font-black text-white` |
| Orange sublabel above headings | `text-[10px] font-bold text-[#FF4500] uppercase tracking-[0.2em] mb-1` |
| Section label above lists | `text-[11px] font-bold text-[#9A9AAA] uppercase tracking-widest` |
| Metadata / timestamps | `text-xs font-semibold text-[#9A9AAA]` |
| Faintest label | `text-[10px] text-[#48484A]` |
| Badge/pill | `text-xs font-black px-2 py-0.5 rounded-md` |

### Spacing & Shape

- Page padding: `px-5`
- Page top: `pt-12` (accounts for status bar)
- Card radius: `rounded-2xl`
- Modal (center): `rounded-3xl`
- Modal (bottom sheet): `rounded-t-3xl`
- Icon containers: `rounded-xl` (small), `rounded-2xl` (large)
- Gap between cards: `gap-3`
- Gap between list items: `gap-2`

### Shadows & Glows

- Primary CTA shadow: `shadow-[0_8px_32px_rgba(255,69,0,0.25)]`
- Active BottomNav indicator: `shadow-[0_0_6px_rgba(255,69,0,0.8)]`
- Challenge button: `shadow-[0_4px_20px_rgba(255,69,0,0.3)]`
- Colored card bg: `{color}10` bg + `{color}30` border (tinted with hex opacity suffix)
- Colored icon bg: `{color}20` bg + `{color}` border (use `displayColor()`)

### Gradient Accents

Cards sometimes have a 1px colored gradient bar at the top:
```tsx
<div className="h-1 bg-gradient-to-r from-[#F59E0B] via-[#3B82F6] to-[#FF4500]" />
```
Use this for high-level hub cards (Belts card, Rankings card). Not for list items.

---

## Component Patterns

### Bottom Sheet Modal

Used for: `PRVerifyModal`, `PlateCheckModal`, `AddedWeightPhotoModal`, `RepsWeightModal`

```tsx
// Backdrop z-[60], sheet z-[70]
<motion.div
  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
  onClick={onClose}
  className="fixed inset-0 bg-black/90 z-[60]"
/>
<motion.div
  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
  className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] bg-[#0D0D0F] border-t border-[#252528] rounded-t-3xl z-[70] flex flex-col max-h-[92dvh]"
>
  {/* Drag indicator */}
  <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
    <div className="w-10 h-1 rounded-full bg-[#3A3A3C]" />
  </div>
  {/* Header */}
  <div className="flex items-center justify-between px-5 pt-2 pb-4 flex-shrink-0">
    ...
  </div>
  {/* Scrollable body */}
  <div className="flex-1 overflow-y-auto px-5 pb-8">
    ...
  </div>
</motion.div>
```

### Center Modal

Used for: weight modal, PR lift selector

```tsx
<motion.div
  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
  className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-5"
  onClick={onClose}
>
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 20, scale: 0.97 }}
    transition={{ duration: 0.18 }}
    onClick={e => e.stopPropagation()}
    className="w-full max-w-sm bg-[#1C1C1E] border border-[#252528] rounded-3xl p-5"
  >
    ...
  </motion.div>
</motion.div>
```

### Primary Button

```tsx
<motion.button
  whileTap={{ scale: 0.97 }}
  className="w-full bg-[#FF4500] text-white font-bold py-4 rounded-2xl text-sm shadow-[0_8px_32px_rgba(255,69,0,0.25)] disabled:opacity-40 disabled:cursor-not-allowed"
>
```

### Secondary Button

```tsx
<motion.button
  whileTap={{ scale: 0.97 }}
  className="w-full bg-[#1C1C1E] border border-[#252528] text-[#9A9AAA] font-semibold py-3.5 rounded-2xl text-sm hover:text-white hover:border-[#3A3A3C] transition-all"
>
```

### Destructive / Stop Button

```tsx
<motion.button
  whileTap={{ scale: 0.97 }}
  className="w-full bg-red-500/15 border-2 border-red-500 text-white font-black py-[18px] rounded-2xl flex items-center justify-center gap-2"
>
  <Square className="w-5 h-5 text-red-400 fill-red-400" />
  Stop &amp; Verify
</motion.button>
```

### Card / List Item

```tsx
<div className="bg-[#1C1C1E] border border-[#252528] rounded-2xl overflow-hidden">
```

For tappable cards:
```tsx
<motion.button whileTap={{ scale: 0.98 }} className="w-full text-left bg-[#1C1C1E] border border-[#252528] rounded-2xl overflow-hidden">
```

### Input Field

```tsx
<div className="flex items-center bg-[#1C1C1E] border border-[#252528] rounded-2xl px-4 py-4 gap-3">
  <input
    className="flex-1 bg-transparent text-white text-lg font-bold focus:outline-none placeholder:text-[#48484A]"
  />
  <span className="text-sm font-bold text-[#9A9AAA]">lbs</span>
</div>
```

Inside a modal (darker bg):
```tsx
className="flex items-center bg-[#161618] border border-[#252528] rounded-2xl px-4 py-4 gap-3"
```

### Icon Container

```tsx
<div
  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border-2"
  style={{ backgroundColor: `${color}20`, borderColor: displayColor(color) }}
>
  <Trophy className="w-5 h-5" style={{ color: displayColor(color) }} />
</div>
```

### Loading Spinner

```tsx
<div className="w-8 h-8 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
```

### Tabs (internal, within a view)

```tsx
<div className="flex mx-5 mb-3 bg-[#161618] rounded-xl p-1 border border-[#252528]">
  {tabs.map(tab => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
        activeTab === tab ? 'bg-[#1C1C1E] text-white shadow-sm' : 'text-[#636366]'
      }`}
    >
      {tab}
    </button>
  ))}
</div>
```

### Status/Result Banner

```tsx
// color = '#22C55E' (verified) or '#F59E0B' (unverified/warning)
<div
  className="rounded-2xl border p-4 flex items-center gap-3"
  style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}
>
  <CheckCircle2 className="w-6 h-6 flex-shrink-0" style={{ color }} />
  <div>
    <p className="text-sm font-black" style={{ color }}>PR Verified</p>
    <p className="text-xs text-[#9A9AAA] mt-0.5">{note}</p>
  </div>
</div>
```

### Notification Pulse Dot

```tsx
<div className="flex items-center gap-2 bg-[#FF4500]/8 border border-[#FF4500]/20 rounded-xl px-3 py-2">
  <div className="w-1.5 h-1.5 rounded-full bg-[#FF4500] animate-pulse flex-shrink-0" />
  <p className="text-xs font-semibold text-[#FF4500]">Marcus T. challenged you · Squat</p>
</div>
```

---

## Animation Patterns (Framer Motion)

### Page-level slide transitions

```ts
const slideIn  = { initial: { opacity: 0, x: 40  }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -40 }, transition: { duration: 0.22, ease: 'easeOut' } }
const slideOut = { initial: { opacity: 0, x: -40 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 40  }, transition: { duration: 0.22, ease: 'easeOut' } }
// dir = 1 → slideIn (forward), dir = -1 → slideOut (back)
```

### Tab content transition

```tsx
<motion.div
  key={tab}
  initial={{ opacity: 0, y: 6 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -6 }}
  transition={{ duration: 0.15 }}
>
```

### Accordion expand

```tsx
<motion.div
  initial={{ opacity: 0, height: 0 }}
  animate={{ opacity: 1, height: 'auto' }}
  exit={{ opacity: 0, height: 0 }}
  transition={{ duration: 0.2 }}
  className="overflow-hidden"
>
```

### Chevron rotate on accordion

```tsx
<motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
  <ChevronDown />
</motion.div>
```

### Staggered list items

```tsx
<motion.div
  initial={{ opacity: 0, x: -8 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: index * 0.04 }}
>
```

### All tappable elements

```tsx
whileTap={{ scale: 0.97 }}  // buttons
whileTap={{ scale: 0.98 }}  // cards (slightly larger target)
```

Always wrap with `<AnimatePresence>` for conditional renders. Use `mode="wait"` when switching between mutually exclusive views.

---

## BottomNav

5 tabs: Plan / Workout / Compete / Friends / Profile.

- Active tab: `text-[#FF4500]` + glowing orange top-line indicator + slightly larger icon
- Inactive: `text-[#48484A]` hover `text-[#9A9AAA]`
- Top-line: `w-6 h-[2px] bg-[#FF4500] rounded-full shadow-[0_0_6px_rgba(255,69,0,0.8)]` positioned `absolute top-0`
- Labels: `text-[9px] font-bold uppercase tracking-widest`
- Nav is `md:hidden` — desktop uses SideNav via AppShell

---

## Camera Patterns

**Critical:** Always do this when `facingMode` changes or before requesting a new camera stream — OS needs time to release.

```tsx
useEffect(() => {
  let active = true
  if (videoRef.current) videoRef.current.srcObject = null  // release immediately
  const timer = setTimeout(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode }, audio: false })
      .then(stream => {
        if (!active) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      })
      .catch(() => { if (active) setCamError(true) })
  }, 150)  // 150ms delay — do NOT remove, camera flip won't work without it
  return () => {
    active = false
    clearTimeout(timer)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }
}, [facingMode])
```

Camera flip button is only shown in `preview` stage, never while recording.

---

## MediaRecorder Pattern (PRVerifyModal)

```tsx
// Auto-detect best supported mimeType
const mimeType = ['video/webm;codecs=vp8', 'video/webm', 'video/mp4']
  .find(t => { try { return MediaRecorder.isTypeSupported(t) } catch { return false } }) ?? ''

const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
mr.ondataavailable = e => { if (e.data.size > 0) videoChunksRef.current.push(e.data) }
mr.start(1000)  // 1s timeslices so chunks arrive continuously
```

**Stop pattern** — await flush before sending for verification:
```tsx
const mr = mediaRecorderRef.current
if (mr && mr.state !== 'inactive') {
  await new Promise<void>(resolve => {
    mr.addEventListener('stop', () => resolve(), { once: true })
    mr.stop()
  })
}
```

**Guard against double-stop:**
```tsx
const stoppingRef = useRef(false)
async function stopAndVerify() {
  if (stoppingRef.current) return
  stoppingRef.current = true
  // ...
}
```

**Frame capture for Claude** — every 2.5s alongside recording:
```tsx
frameTimerRef.current = setInterval(() => {
  const f = captureFrame()
  if (f) capturedRef.current.push(f)
}, 2500)
```

**Max recording time:** 180 seconds (3 min). No visible countdown — elapsed timer only. Hard cap auto-stops at 180s.

---

## AI / Claude API Patterns

All Claude calls are server-side (`/app/api/*/route.ts`). Never call Anthropic SDK from the browser.

**Always fall back gracefully if `ANTHROPIC_API_KEY` is not set:**
```ts
if (!process.env.ANTHROPIC_API_KEY) {
  return NextResponse.json(DEMO_RESULT)
}
```

**Image content blocks:**
```ts
type ContentBlock =
  | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg'; data: string } }
  | { type: 'text'; text: string }

// Strip the data URL header before sending
function toBase64(dataUrl: string) {
  return dataUrl.replace(/^data:image\/\w+;base64,/, '')
}
```

**JSON response parsing** — Claude sometimes wraps JSON in markdown:
```ts
let result
try {
  result = JSON.parse(text)
} catch {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return NextResponse.json(DEMO_RESULT)
  result = JSON.parse(match[0])
}
```

**Model to use:** `claude-sonnet-4-6` — do not downgrade to Haiku for verification calls.

---

## Supabase Patterns

**Browser client:** `createClient()` from `@/lib/supabase/client`
**Server (SSR/API routes):** `createClient()` from `@/lib/supabase/server`

**Storage — pr-media bucket:**
- Private bucket (no public URLs)
- Store path in DB, not a signed URL — generate signed URLs on-demand when needed
- Path format: `{userId}/{sessionId}/plate-{side}.jpg` and `{userId}/{sessionId}/lift.{webm|mp4}`
- File size limit: 50MB per file

**Upload pattern:**
```ts
const { error } = await supabase.storage
  .from('pr-media')
  .upload(path, blob, { contentType: 'image/jpeg', upsert: true })
```

**Media upload is fire-and-forget** — don't block the UX result on upload:
```ts
uploadMedia(verifyResult).catch(() => {})  // after setResult() + setStage('result')
```

---

## PR Verification Chain

Three separate verification steps depending on lift type:

### Barbell lifts (Bench, Squat, Deadlift, OHP, Power Clean)
1. `PlateCheckModal` — 3 photos (left side, right side, front view)
2. `api/verify-plates` — Claude checks all 3 photos against declared weight
3. `PRVerifyModal` — video recording (user-controlled stop), side-angle instruction
4. `api/verify-pr` — Claude checks video frames + cross-references against plate photo

### Bodyweight lifts with added weight (weighted Pull-up)
1. `RepsWeightModal` — enter reps + added weight
2. `AddedWeightPhotoModal` — photo of weight on dip belt/chain
3. `api/verify-added-weight` — Claude checks photo
4. `PRVerifyModal` → `api/verify-pr` — video + cross-reference

### Bodyweight only (Pull-up, 0 added weight)
1. `RepsWeightModal` — enter reps only
2. `PRVerifyModal` → `api/verify-pr` — video only, no setup photo

### PlateCheckModal — 3-photo flow
- Steps: `left` → `right` → `front`
- Stages per step: `select` (choose camera) → `capture` → `preview` (accept or retake) → after all 3: `analyzing` → `result`
- Label: "Weight of Bar (incl. 45lb bar)" — NOT "Weight of plates"
- Why 3 photos: AI can only see outermost plate from each side — 3 angles give better coverage and cross-validation
- `onDone(weight, verified, { left, right, front })` — passes full photos object to parent

### PRVerifyModal — recording
- Instruction overlay: "Set up your phone first — Prop it to your SIDE showing full body head to floor, then press Record"
- Side angle is required: front angle doesn't show full ROM (depth on squat, lockout on bench)
- No countdown — user presses Stop when done
- Elapsed timer shown (`0:00` format) — soft reminder only, hard cap at 3:00
- Stop button: red border destructive style, "Stop & Verify"

---

## Belt System

Belt **colors** are shared; **thresholds are per-lift**. Calibrated to ~180 lb male bodyweight
using StrengthLevel standards (Beginner→Iron, Novice→Bronze, Intermediate→Lifter, Advanced→Elite,
SL-Elite→Master, world-class→Legend). Lives in `app/compete/page.tsx` as `WEIGHT_THRESHOLDS` +
`PULLUP_REP_THRESHOLDS`. Index order is always [Legend, Master, Elite, Lifter, Bronze, Iron].

```
Colors:  Legend #FFC107 · Master #8B5CF6 · Elite #EF4444 · Lifter #3B82F6 · Bronze #22C55E · Iron #636366 (display #D1D5DB)

Per-lift 1RM thresholds (lbs):       Legend Master Elite Lifter Bronze Iron
  Bench Press                          405    350   285   220    165   120
  Squat                                525    460   375   290    220   160
  Deadlift                             605    525   430   340    260   195
  Overhead Press                       275    240   190   145    105    75
  Power Clean                          375    325   265   205    155   115

Pull-up (bodyweight → rep count):      30     22    15    10      5     1   reps
```

**Future upgrade (per weight class):** thresholds are currently single-set (180 lb reference). To scale
by bodyweight without a 216-cell table, apply a DOTS/Wilks coefficient to the lifted weight before
comparing — that converts "per weight class" into one formula. Not yet implemented.

- **Per-lift and independent** — each of the Big 6 has its own belt
- **Verified PRs only** — belts read the best `verified = true` row per lift from `pr_verifications`. Unverified lifts are still recorded (ML data) but never earn a belt.
- **One-way** (karate-style) — nobody can take it from you
- **Decay:** No qualifying PR within 60 days = drop one tier. Warning kicks in at 7 days remaining.
- **Decay display:** "Dropped from Elite to Lifter belt, log a PR to climb back" (amber, `#F59E0B`)
- **At-risk display:** "⚠ 5 days left — log a PR to defend and maintain Elite belt" (amber)

**Big 6 lifts:** Bench Press, Squat, Deadlift, Overhead Press, Power Clean, Pull-up

---

## Battle / Rankings System

- W/L record from 1v1 challenges determines rank within weight class
- Rankings are scoped to weight class only (no cross-class comparison)
- Challenges: 1v1, same weight class, most weight moved on a declared lift wins
- #1 position = top of leaderboard in your class

**Weight classes:**
```
Lightweight:   < 135 lbs
Light Middle:  135–150 lbs
Middle:        150–175 lbs
Light Heavy:   175–200 lbs
Heavy:         200–220 lbs
Super Heavy:   220+ lbs
```

---

## Supabase Schema

Verified against the live `trainmaxxing` DB (cheanydnmvqdvsexxdav) via REST 2026-06-17.
(The earlier 2026-06-15 note described the WRONG `rjqwjfzvhkdkdjldlnqs`/PJRoutes DB — disregard it.)

```
profiles         — id, email, username, first_name, weight, created_at
                   (username + first_name DO exist here — Friends-by-username is unblocked)
                   MISSING until added: subscription_status, stripe_customer_id, subscription_period_end (added 2026-06-17)
plans            — id, user_id, onboarding_data (jsonb), days (jsonb), created_at
workout_sessions — id, user_id, plan_id, day_number, day_name, started_at, finished_at  (unverified — table empty)
workout_sets     — id, session_id, exercise_name, set_number, weight_lbs, reps, completed  (unverified — table empty)
pr_verifications — id, user_id, exercise_name, declared_weight, declared_reps, verified,
                   confidence, ai_note, plate_photos (jsonb), lift_video_url, added_weight_photo_url, created_at
```

`pr_verifications` has RLS: user can only insert/select their own rows.
`profiles` has RLS allowing a user to insert/update their own row (verified). There is **no DB trigger** that
auto-creates a profiles row on signup — onboarding must upsert one (`{ id, email, weight }`, keyed on `id`).
Never use `.update().eq('id', uid)` to set profile fields: if the row doesn't exist it silently writes nothing. Always upsert.
`pr-media` storage has RLS: upload path must start with `auth.uid()`.

**Schema note:** `username` + `first_name` already exist on `profiles` in the live DB (Friends-by-username unblocked).
Stripe columns (`subscription_status`, `stripe_customer_id`, `subscription_period_end`) added 2026-06-17 so
`profile`/`plan` page queries and the Stripe webhook don't error. Stripe itself (keys, products, webhook) not yet set up.

---

## File Map (current)

```
app/
  api/
    analyze-form/route.ts         — form technique scoring (Claude Vision, frames)
    generate-plan/route.ts        — AI workout plan generation
    replace-exercise/route.ts     — swap exercise with Claude + onboarding context
    stripe/checkout/route.ts      — Stripe checkout session
    stripe/webhook/route.ts       — Stripe webhook handler
    verify-added-weight/route.ts  — verify dip belt weight photo
    verify-plates/route.ts        — verify barbell plate setup (3 photos)
    verify-pr/route.ts            — verify PR video frames (rep completion + cross-check)
    youtube-search/route.ts       — exercise demo video search
  compete/page.tsx                — Belts + Rankings + Battles hub
  friends/page.tsx                — Friends list (placeholder)
  history/page.tsx                — Workout history
  login/page.tsx
  onboarding/page.tsx             — 9-step onboarding
  plan/
    generating/page.tsx           — Loading screen during plan gen
    page.tsx                      — Week view + workout launch
  profile/page.tsx
  settings/page.tsx
  signup/page.tsx
  workout/
    complete/page.tsx             — Post-workout summary
    page.tsx                      — Active workout (sets, rest timer, form check)
  layout.tsx, page.tsx, template.tsx, globals.css, manifest.ts, favicon.ico

components/
  AddedWeightPhotoModal.tsx       — Photo verification for weighted bodyweight lifts
  AppShell.tsx                    — Conditionally renders SideNav on app routes
  BottomNav.tsx                   — 5-tab mobile nav
  FormAnalysisModal.tsx           — In-workout form scoring modal
  PaywallModal.tsx                — Subscription gate
  PlateCheckModal.tsx             — 3-photo barbell plate verification
  PRVerifyModal.tsx               — Video PR recording + verification
  RankCard.tsx                    — Belt/rank display card
  RepsWeightModal.tsx             — Reps + optional added weight input (bodyweight lifts)
  SideNav.tsx                     — Desktop sidebar
  ui/                             — shadcn primitives (badge, button, dialog, input, progress, sheet)

lib/
  supabase/client.ts              — Browser Supabase client
  supabase/server.ts              — SSR Supabase client
  types.ts                        — OnboardingData, Plan, WorkoutSet, etc.
  upload-pr-media.ts              — uploadPrSession(): upload plate photos + video, insert pr_verifications row
  utils.ts                        — cn() and other shared utilities
  xp.ts                           — XP / level calculation logic

reference/
  ai-verification.md              — How each Claude verification route works
  env.md                          — Required env vars

artifacts/
  bootstrap-prompt.md
```

---

## What's Done vs TODO

### Done
- 9-step onboarding → Supabase account creation → AI plan generation
- Full workout flow (sets, reps, rest timer, form check)
- Compete page: belt ladder per lift, decay system, dummy rankings + battles data
- PR verification chain: plate photos (3-angle) + video, bodyweight added weight photo + video
- Claude Vision API routes for all 4 verification types
- Supabase Storage + `pr_verifications` table for ML training data
- Weight class assignment from user's bodyweight in `profiles`
- Camera flip (150ms delay pattern)
- MediaRecorder video (webm/mp4 auto-detect, user-controlled stop)

### TODO (priority order)
1. **Power Rank logic** — _in progress_
   - [x] Per-lift belt thresholds (`WEIGHT_THRESHOLDS` + `PULLUP_REP_THRESHOLDS`, StrengthLevel-based)
   - [x] Belts read real best **verified** PR per lift from `pr_verifications` (no more dummy data)
   - [ ] PR detection in workout page (auto-offer "Log PR" when a set beats your current best)
   - [ ] Persist computed rank/belt to `profiles` (needed so leaderboards can show others' ranks without querying their PRs — requires a profiles schema column)
   - [ ] Per-weight-class scaling via DOTS coefficient (see Belt System note)
2. **1v1 Battle flow** — challenge system, Claude verification of challenged lift, W/L record update
3. **Friends system** — search by username, add/remove, challenge button
4. **Real data on compete page** — replace dummy rankings + battles with Supabase queries

---

## Hard Rules

- **No guest mode** — every route requires auth
- **localStorage prefix:** `trainmaxxing_*`
- **Never touch production without asking Jaylen**
- **Never refactor unless asked** — do only what the task requires
- **`.env.local` is gitignored** — credentials never in repo
- **No countdown timers on recording** — user controls stop; max cap is a hard stop, not visible pressure
- **All AI calls are server-side** — no Anthropic SDK in browser code
- **Media upload is fire-and-forget** — never block the result screen on upload
- **Camera flip only in preview** — disable during active recording
- **Iron display color** — always use `displayColor()` helper, never render `#636366` directly in UI
- **Plate label** — "Weight of Bar (incl. 45lb bar)", not "Weight of plates"
- **PR video angle** — always instruct side angle (head to floor visible), never front
- **All new GitHub repos** go under `City-of-Winfield-KS` org (city projects) or `jaylenmareko` (personal/Trainmaxxing)
