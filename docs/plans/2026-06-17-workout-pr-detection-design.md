# Power Rank — PR detection in workout page

## Why
CONTEXT.md priority #1. Workout page currently has zero connection to the belt/PR
system — it only compares against a localStorage "last session" best for display.
Users have to remember to go to Ranks and manually log a PR after the fact.

## Scope
PR detection only. Persisting computed rank to `profiles` (needs a prod schema
change) is a separate follow-up — out of scope here.

## Data flow
On mount, workout page fetches the user's best **verified** PR per Big-6 lift from
`pr_verifications` (same query Ranks page already runs) into a `bests` map. Separate
from the existing `prevBests` (last-session display data, unrelated system).

## Detection logic
On `toggleSet` completion, if the exercise name exactly matches a Big-6 lift:
- Barbell lifts: PR if `set.weight > runningBest.best`
- Pull-up: PR if `set.reps > runningBest.bestReps` (rep-based regardless of added
  weight, matching `lib/belts.ts`'s `getTierIndex`)

`runningBest` is per-exercise, seeded from `bests`, and updates immediately after a
mid-workout verified PR is logged — so only the single highest-beating set per
exercise shows a banner, and later sets compare against the new number.

## UI
Inline orange banner on the completed set's row — "🔥 New PR! Tap to log it,"
matching the existing Notification Pulse Dot pattern. Tapping opens the PR-logging
flow prefilled with that lift + weight/reps. Clears on: logging it, unchecking the
set, or finishing the workout. No separate dismiss control.

## Shared hook — `usePrLogger`
Extract Ranks page's modal-chain state (`prModalOpen`/`prStep`/`prLift`/`prWeight`/
`prReps`/`prVerified`/`prPlatePhotos`, `logPr()`, and the 4 `AnimatePresence` modal
blocks: select/record info, `PRVerifyModal`, `PlateCheckModal`, `RepsWeightModal`,
`AddedWeightPhotoModal`) into `lib/hooks/usePrLogger.tsx`.

Signature:
```ts
function usePrLogger(liftData: LiftWithTier[], onLogged: (liftName: string, weight: number | null, reps: number | null, verified: boolean) => void) {
  // returns { openLogPr(liftName: string, prefill?: { weight?: number, reps?: number }), modals: ReactNode }
}
```
- Ranks page switches to this hook — no behavior change, just moves the code.
- Workout page mounts the same hook, calls `openLogPr(liftName, { weight, reps })`
  from the banner tap, and its `onLogged` callback updates the in-memory `bests`/
  `runningBest` map.

## Out of scope
- Persisting computed rank to `profiles` (separate follow-up, needs prod schema sign-off).
- PR detection for non-Big-6 exercises (no thresholds exist for them).
