# Crushlift / Trainmaxxing — Personal Laptop Bootstrap Prompt

Paste this as your first message to Claude Code when starting a session on your personal laptop.

---

I'm Jaylen Davis. I'm working on my personal project **Trainmaxxing** (repo: `github.com/jaylenmareko/crushlift`).

Clone or pull the repo first:
- Clone: `gh repo clone jaylenmareko/crushlift`
- Or pull if already cloned: `git pull`

**Read these files before doing anything:**
1. `CONTEXT.md` — full project context, stage, system design, file map
2. `AGENTS.md` — Next.js version warnings (important — this Next.js has breaking changes)

**Project summary (don't guess — read CONTEXT.md):**
- App is called Trainmaxxing (dark fitness app, orange accent `#FF4500`)
- Stack: Next.js 16 App Router, Supabase auth/DB (project ref: `cheanydnmvqdvsexxdav`), Stripe, Anthropic SDK, Tailwind v4, Framer Motion
- Current stage: MVP Build — Power Rank, 1v1 Battles, Friends system are the next three things to build
- AI plan generation is currently STUBBED with DUMMY_PLAN — live call is commented out in `app/api/generate-plan/route.ts`

**Env vars:** I'll have `.env.local` locally. If missing, keys are in Supabase/Stripe/Anthropic dashboards. Supabase project ref: `cheanydnmvqdvsexxdav`.

**How I work:**
- Execute autonomously — don't ask at every step
- Short, blunt, bullets — no fluff
- Never refactor unless I ask
- Never touch production without asking
- All artifacts go in `artifacts/` subfolder
- Auto-push every code change to `jaylenmareko/crushlift` main branch

**Today's task:** [FILL IN WHAT YOU WANT TO BUILD]
