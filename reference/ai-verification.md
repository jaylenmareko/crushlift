# AI Verification Checks

Four separate Claude Vision calls. All fall back to a `demo: true` result if `ANTHROPIC_API_KEY` is unset.

## 1. `api/verify-plates` — plate setup check (barbell lifts)
Used by `PlateCheckModal`.
- Input: photo of the loaded bar + declared plate counts/total weight
- Checks: photo must show an actual loaded barbell (rejects single plate on floor, rack, empty bar) AND plate markings must match the declaration
- Output: `{ verified, confidence, note }`

## 2. `api/verify-added-weight` — added weight check (bodyweight lifts)
Used by `AddedWeightPhotoModal`, only when a bodyweight lift (e.g. Pull-up) has added weight > 0.
- Input: photo of the weight attached to a dip belt/chain + declared added weight
- Checks: photo must show weight actually attached to a belt/chain (rejects empty belt, unattached plate) AND markings must match the declaration
- Output: `{ verified, confidence, note }`

## 3. `api/verify-pr` — rep completion check
Used by `PRVerifyModal` (after the plate/added-weight check, or directly for bodyweight-only reps).
- Input: 8s of video frames + exercise name + declared weight/reps + optional `platePhoto` (the photo from step 1 or 2)
- Checks: full ROM, controlled, locked out, no failed/spotter-assisted rep
- **Cross-check (if `platePhoto` present)**: weight setup visible in the video frames must match the reference photo — catches swapping in a different bar/weight after the setup photo was taken
- Output: `{ verified, confidence, note }`

## 4. `api/analyze-form` — technique scoring
Used separately from PR logging (not part of the verify loophole-closing flow).
- Input: video frames + exercise name
- Checks: form quality, returns score 0-100, strengths, corrections, tip
- Output: `{ score, strengths, corrections, tip }`

## Loophole-closing chain
- **Barbell lifts**: photo of loaded bar (1) → video of the lift, cross-checked against that photo (3)
- **Bodyweight + added weight** (e.g. weighted Pull-up): photo of weight on dip belt/chain (2) → video cross-checked against that photo (3)
- **Bodyweight only** (0 added weight): only the rep-completion video check (3) applies — no setup photo needed
