# Trainmaxxing — Folder Structure

Next.js App Router requires `app/` at the project root — it can't be relocated under `frontend/` or `backend/` without extra build config, so it stays put as the routing layer. Everything *inside* it is organized frontend vs. backend by what it imports.

```
app/                              # routing only — pages + API route handlers (thin)
├── api/
│   ├── analyze-form/route.ts
│   ├── battles/route.ts, [id]/route.ts
│   ├── compute-rank/route.ts
│   ├── exercise-demo/route.ts
│   ├── generate-plan/route.ts
│   ├── replace-exercise/route.ts
│   ├── stripe/checkout/route.ts
│   ├── stripe/webhook/route.ts
│   ├── verify-added-weight/route.ts
│   ├── verify-plates/route.ts
│   ├── verify-pr/route.ts
│   └── youtube-search/route.ts
├── compete/page.tsx, friends/page.tsx, history/page.tsx, login/page.tsx
├── onboarding/page.tsx, plan/page.tsx, plan/generating/page.tsx
├── profile/page.tsx, ranks/page.tsx, settings/page.tsx, signup/page.tsx
├── workout/page.tsx, workout/complete/page.tsx
└── layout.tsx, page.tsx, template.tsx, globals.css, manifest.ts, favicon.ico

frontend/                         # browser-facing: UI + client-side data access
├── components/
│   ├── AddedWeightPhotoModal.tsx, AppShell.tsx, BottomNav.tsx
│   ├── ChangeWeightModal.tsx, EditProfileModal.tsx, ExerciseDemoModal.tsx
│   ├── FormAnalysisModal.tsx, LoginSheet.tsx, MatchDetailSheet.tsx
│   ├── PaywallModal.tsx, PlateCheckModal.tsx, ProfileSheet.tsx
│   ├── PRVerifyModal.tsx, RankCard.tsx, RepsWeightModal.tsx, WeightGate.tsx
│   └── ui/ (badge, button, dialog, input, progress, sheet — shadcn)
├── hooks/
│   ├── usePrLogger.tsx
│   └── useUserWeight.ts
└── lib/
    ├── supabase/client.ts        # browser Supabase client
    ├── upload-pr-media.ts        # fire-and-forget client-side media upload
    ├── avatar.ts                 # initials/color helpers
    └── utils.ts                  # cn()

backend/                          # server-only: domain logic + data access
├── services/
│   ├── belts.ts                  # weight class + belt tier logic
│   ├── battles.ts                # battle resolution (DOTS-aware) — not yet wired to DB
│   ├── dots.ts                   # pound-for-pound scoring math
│   └── xp.ts                     # XP/level calculation
├── lib/
│   └── supabase/server.ts        # SSR/route-handler Supabase client
├── middleware/
│   └── proxy.ts                  # auth session-refresh middleware — not currently wired (no root middleware.ts)
└── types.ts                      # shared domain types (OnboardingData, Plan, WorkoutSet, etc.)

reference/
├── AGENT-GUIDE.md
├── ai-verification.md
└── env.md

artifacts/
└── bootstrap-prompt.md, screenshots/, *.sql

CONTEXT.md, CLAUDE.md (→ AGENTS.md), README.md
package.json, tsconfig.json, next.config.ts, components.json, postcss.config.mjs
.env.local (gitignored)
```

## Import convention

- `app/**` and `frontend/components/**` import from `@/frontend/*` for UI/browser concerns.
- `app/api/**/route.ts` import from `@/backend/*` for domain logic and DB access — route handlers stay thin (parse request → call a `backend/services/*` function → respond).
- `backend/services/*` are plain functions with no Next.js-specific imports, so they're portable if this ever splits into a standalone API service later.
- Domain types live in `backend/types.ts` — both layers import from there rather than duplicating shapes.

## ICM Layers
- **Layer 1 (Identity):** `CLAUDE.md` → `AGENTS.md`
- **Layer 3 (Stage Contract):** `CONTEXT.md`
- **Layer 4 (Reference):** `reference/`
- **Layer 5 (Artifacts):** `artifacts/`
