# Train Maxxing

## Stage
MVP Build — core flows built, PR verification chain complete, media storage live. Now wiring real data and completing the compete system.

## Done criteria
- [x] Power Rank — per-lift belt thresholds (StrengthLevel-calibrated, Pull-up rep-based)
- [x] Power Rank — PR detection in workout page (inline "New PR!" banner on a completed set that beats the verified best, opens shared `usePrLogger` flow)
- [ ] Power Rank — rank stored in profiles
- [ ] 1v1 Battle flow (challenge, respond, Claude verification, W/L record update)
- [ ] Friends system (search by username, add/remove, challenge button)
- [x] Ranks page (`/ranks`, renamed from Belts) — split out from Compete, reads from real `pr_verifications` data (verified-only)
- [x] Compete page (`/compete`) restructured into Rank / Leaderboard / Challenges tabs (floating pill above BottomNav) — still backed by dummy `RANKINGS_DATA` / `PENDING_CHALLENGES` / `OPEN_ROSTER`, not real Supabase data

## Next stage
Beta — real users, real PRs, iterate on verification accuracy

## Stack
- Next.js 16 App Router (Turbopack)
- Supabase (auth, PostgreSQL, Storage — project ref: cheanydnmvqdvsexxdav, project name "trainmaxxing")
- Tailwind CSS, Framer Motion, Lucide React
- Anthropic Claude API (claude-sonnet-4-6) — all AI calls server-side
- shadcn/ui primitives

## Repo
`jaylenmareko/crushlift` — codebase lives at `C:\Users\jdavis\Intern\projects\dev\train-maxxing\` (canonical copy; older standalone clone at `C:\Users\jdavis\train-maxxing\` is retired/stale)

## File map
- `reference/AGENT-GUIDE.md` — full build + design system guide (read before any code work)
- `reference/ai-verification.md` — how each Claude Vision route works
- `reference/env.md` — required env vars
- `artifacts/` — session outputs

## Skills & Tools

| Skill / Tool | Stage | Purpose |
|---|---|---|
| `/run` | any | Start local dev server |
| `/verify` | any | Confirm a fix works in the running app |
| `/code-review` | before push | Review before committing |
| `/security-review` | before ship | Check city-facing app security |

## Load at session start
- `reference/AGENT-GUIDE.md` — always (design system + build rules)

## Skip
- `reference/ai-verification.md` — load only when working on a verify-* API route
- `reference/env.md` — load only when setting up env or onboarding new service

## Current priority
1. Power Rank — rank stored in profiles (needs prod Supabase schema change, sign-off required)
2. Compete page (`/compete`) — replace `RANKINGS_DATA` / `PENDING_CHALLENGES` / `OPEN_ROSTER` with real data
3. 1v1 Battle flow
4. Friends system

## Deferred (build later)
- **Matchmaking gating** — keep choose-your-opponent, but only allow challenging people in your weight class + near your rank; gray out/hide ineligible rows. Add a "Quick Match" button (auto-pick eligible opponent) + anti-farming guard (cooldown on repeat fights, weight rank movement by opponent strength). Decided model; not yet built. (Discussed 2026-06-19.)
