# Job Bot — multi-user auto-apply assistant

Applies to LinkedIn and Naukri jobs on your behalf using a match score against
your resume + profile, logs every application to a dashboard, and pings you
on WhatsApp and email when it applies.

## Setup — everything through the UI except two steps

Almost nothing here requires editing a file. Two things unavoidably do,
because they're the plumbing between three separate free services that can't
discover each other on their own:

1. **One environment variable** (`DATABASE_URL`) — Vercel needs this to even
   boot the app and reach the database where all your *other* settings live.
2. **One copy-paste into GitHub** — the free automation runs on GitHub
   Actions, which can't read your app's database by itself. You paste your
   app's URL and one secret into GitHub's Settings → Secrets once. The
   in-app Settings page shows you exactly what to paste (see below).

Everything else — Resend/email keys, WhatsApp keys, GitHub token for the
"Run now" button, your resume, your profile, your portal logins — is entered
through forms in the app itself, at `/settings` and `/onboarding`, and is
saved to the database. No more `.env` editing after step 1.

### Steps

1. **Database**: create a free Postgres at [neon.tech](https://neon.tech) (or
   use Vercel's own Postgres/Neon integration from the Storage tab when you
   import the project — same result, no separate signup).
2. **Deploy**: import this repo into [Vercel](https://vercel.com/new), set
   the *root directory* to `apps/web`, and set `DATABASE_URL` as the one
   environment variable.
3. Once deployed, run the database migration once (from your machine, or a
   Vercel deploy hook):
   ```bash
   cd apps/web
   npx prisma migrate deploy
   ```
4. Visit `your-app.vercel.app/settings`. Fill in Resend, WhatsApp, and GitHub
   fields as you get each one — you can save partial progress and come back.
   The page also shows the exact two values to paste into your GitHub repo's
   Actions secrets (`WEB_APP_URL` and `INTERNAL_API_SECRET`) — copy those in
   once, and the free scheduled automation is live.
5. Visit `/onboarding` to add your resume, profile, and portal logins.
6. Either wait for the next scheduled run (every 2 hours) or hit "Run now" on
   the dashboard.

## Before you rely on this: read this section

- **This automates logging into LinkedIn and Naukri with real credentials.**
  Both portals' Terms of Service prohibit automated use, and both run bot
  detection. LinkedIn in particular has suspended accounts for scripted
  login/apply behavior. Use your own accounts and understand the risk is
  real, not theoretical — no UI can remove that risk, only the actual
  automation behavior can reduce it (delays are already built in).
- Credentials are encrypted at rest (AES-256-GCM), decrypted only in memory
  during a run. You are still the one storing other people's job-portal
  passwords if you make this multi-user — treat that responsibility
  seriously.
- **Selectors in `worker/src/portals/*.ts` are stubs with `TODO` markers.**
  This is the one piece a settings page genuinely can't paper over: the
  automation needs to know the real button/field names on LinkedIn's and
  Naukri's current pages, and those change over time. I can't verify live
  selectors without a running session against the real site. Two ways
  forward, your call:
  - Open each portal, inspect the actual login/search/apply elements, and
    send me what you see — I'll wire in the real selectors with you.
  - Or: replace hardcoded selectors with an AI-guided approach (the worker
    takes a screenshot/DOM snapshot and asks an LLM to locate the right
    button by description instead of a fixed CSS selector) — more resilient
    to portal redesigns, but adds an Anthropic API key and a small per-run
    cost. I can build this if you'd rather not touch selectors at all.
- Free tier is real but capped: ~2,000 GitHub Actions minutes/month on a
  private repo, ~1,000 free WhatsApp conversations/month. Fine for personal
  or small-group use.

## Repo layout

```
job-bot/
├── apps/web/          Next.js dashboard + Settings + API (Vercel)
│   ├── app/
│   │   ├── settings/  ← configure everything here after deploy
│   │   ├── onboarding/← resume, profile, portal logins
│   │   └── dashboard/ ← applied jobs table
│   ├── lib/
│   └── prisma/schema.prisma
├── worker/            Playwright automation (GitHub Actions)
│   └── src/
│       ├── index.ts
│       ├── matchScore.ts
│       └── portals/{linkedin,naukri}.ts
└── .github/workflows/run-bot.yml
```
