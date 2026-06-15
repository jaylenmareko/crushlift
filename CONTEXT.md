# Train Maxxing

## Stage
MVP Build — core flows built, PR verification chain complete, media storage live. Now wiring real data and completing the compete system.

## Done criteria
- [x] Power Rank — per-lift belt thresholds (StrengthLevel-calibrated, Pull-up rep-based)
- [ ] Power Rank — PR detection in workout page
- [ ] Power Rank — rank stored in profiles
- [ ] 1v1 Battle flow (challenge, respond, Claude verification, W/L record update)
- [ ] Friends system (search by username, add/remove, challenge button)
- [x] Compete page belts — read from real `pr_verifications` data (verified-only)
- [ ] Compete page Rankings & Battles tabs — still `RANKINGS_DATA` / `DUMMY_BATTLES`

## Next stage
Beta — real users, real PRs, iterate on verification accuracy

## Stack
- Next.js 16 App Router (Turbopack)
- Supabase (auth, PostgreSQL, Storage — project ref: rjqwjfzvhkdkdjldlnqs)
- Tailwind CSS, Framer Motion, Lucide React
- Anthropic Claude API (claude-sonnet-4-6) — all AI calls server-side
- shadcn/ui primitives

## Repo
`jaylenmareko/crushlift` — codebase lives at `C:\Users\jdavis\train-maxxing\`

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
1. Power Rank — PR detection in workout page, rank stored in profiles
2. Compete page — replace `RANKINGS_DATA` / `DUMMY_BATTLES` with real data
3. 1v1 Battle flow
4. Friends system
