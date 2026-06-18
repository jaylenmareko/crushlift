# Compete page — 3-tab restructure

## Why
Compete currently crams hero card, an always-visible "Incoming" challenge card, and a
leaderboard-button-that-opens-a-sheet into one scrolling view. Incoming challenges and
leaderboard need clearer separation, and the bottom-sheet pattern for the leaderboard
adds an extra tap for something that should be a primary destination.

## Layout
`Header ("Compete", no eyebrow) → scrollable tab content → sticky 3-tab bar → BottomNav`

The new tab bar sits just above the existing 5-tab `BottomNav`, visually distinct from it
(smaller, icon + label, active = orange accent — not a clone of BottomNav's style).

## Tabs

1. **Rank** (default on load)
   - Existing hero card: weight class, rank `#N of M`, W/L record, climb-hook button
     ("Beat {rival} to hit #{rank}" / "You're #1 — defend your crown" / no-rank state)
   - No Challenge button here anymore.

2. **Leaderboard**
   - Today's bottom-sheet content rendered inline instead of in a modal.
   - Internal toggle at top: **My Class** / **Open** (unchanged — `boardView` state).
   - Ranking rows below, unchanged behavior: tapping a row opens the Challenge sheet
     pre-filled with that opponent (and `superfight` flag for cross-class Open rows).

3. **Challenges**
   - Pending incoming challenges at top (Accept/Decline cards — same visual as today's
     "Incoming" card, just relocated).
   - "New Challenge" button below — opens the Challenge sheet with no opponent
     preselected (same sheet as lift/format picker today).
   - Tab shows a small pulsing orange dot when `PENDING_CHALLENGES.length > 0`.

## State changes
- Remove `leaderboardOpen` (no more leaderboard sheet).
- Add `activeTab: 'rank' | 'leaderboard' | 'challenges'`, defaults to `'rank'`.
- Challenge sheet (`challengeOpen`, `challengeOpponent`, `challengeSuperfight`,
  `challengeLift`, `challengeFormat`) is unchanged — now triggered from three places:
  Rank tab's climb-hook, Leaderboard row tap, Challenges tab's "New Challenge" button.

## Out of scope (separate follow-up)
- Leaderboard clarity/confusion fixes once the 3-tab structure ships and Jaylen has used it.
- Wiring Challenges/Leaderboard to real Supabase data (still `PENDING_CHALLENGES` /
  `RANKINGS_DATA` / `OPEN_ROSTER` dummy arrays — tracked separately in CONTEXT.md TODO).
