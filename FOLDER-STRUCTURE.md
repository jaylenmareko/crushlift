# Crushlift (Trainmaxxing) — Folder Structure

```
app/
├── api/
│   ├── analyze-form/route.ts
│   ├── generate-plan/route.ts
│   ├── replace-exercise/route.ts
│   ├── stripe/checkout/route.ts
│   ├── stripe/webhook/route.ts
│   ├── verify-added-weight/route.ts
│   ├── verify-plates/route.ts
│   ├── verify-pr/route.ts
│   └── youtube-search/route.ts
├── compete/page.tsx
├── friends/page.tsx
├── history/page.tsx
├── login/page.tsx
├── onboarding/page.tsx
├── plan/
│   ├── generating/page.tsx
│   └── page.tsx
├── profile/page.tsx
├── settings/page.tsx
├── signup/page.tsx
├── workout/
│   ├── complete/page.tsx
│   └── page.tsx
└── layout.tsx, page.tsx, template.tsx, globals.css, manifest.ts, favicon.ico

components/
├── AddedWeightPhotoModal.tsx
├── AppShell.tsx
├── BottomNav.tsx
├── FormAnalysisModal.tsx
├── PaywallModal.tsx
├── PlateCheckModal.tsx
├── PRVerifyModal.tsx
├── RankCard.tsx
├── RepsWeightModal.tsx
├── SideNav.tsx
└── ui/ (badge, button, dialog, input, progress, sheet — shadcn)

lib/
├── supabase/client.ts, server.ts
└── types.ts, utils.ts, xp.ts

reference/
├── ai-verification.md
└── env.md

artifacts/
└── bootstrap-prompt.md

CONTEXT.md, CLAUDE.md (→ AGENTS.md), README.md
package.json, tsconfig.json, next.config.ts, components.json, proxy.ts, postcss.config.mjs
.env.local (gitignored)
```

## ICM Layers
- **Layer 1 (Identity):** `CLAUDE.md` → `AGENTS.md`
- **Layer 3 (Stage Contract):** `CONTEXT.md`
- **Layer 4 (Reference):** `reference/`
- **Layer 5 (Artifacts):** `artifacts/`
