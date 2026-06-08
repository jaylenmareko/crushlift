# Trainmaxxing — Required Environment Variables

Create `.env.local` in repo root (gitignored — never commit).

```env
# Supabase (project ref: cheanydnmvqdvsexxdav)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# YouTube Data API v3
YOUTUBE_API_KEY=
```

## Where to get them
- Supabase: supabase.com → project `cheanydnmvqdvsexxdav` → Settings → API
- Anthropic: console.anthropic.com → API Keys
- Stripe: dashboard.stripe.com → Developers → API Keys; webhook secret from webhook endpoint
- YouTube: console.cloud.google.com → Credentials → API Key (enable YouTube Data API v3)
