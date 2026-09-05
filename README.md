# Job Bot — multi-user auto-apply assistant

Applies to LinkedIn and Naukri jobs on your behalf using a match score against
your resume + profile, logs every application to a dashboard, and pings you
on **WhatsApp, email, and an in-app notification bell** the moment it applies.

## What's in this build

- **Resume auto-fill** — upload a `.pdf` or `.docx` resume on `/onboarding`
  and the form fills itself in: skills, years of experience, likely target
  roles, and phone number, all extracted server-side (no external AI key
  needed). Every field stays editable before you save.
- **Applications dashboard** (`/dashboard`) with **Date, Time, Company,
  Designation / Position, Location, CTC, match score, status, and the
  applied-job link** — plus live stat cards (total applied, today, this week,
  average match score).
- **Three notification channels, every time the bot applies**: WhatsApp
  (Meta Cloud API), email (Resend), and an in-app notification (bell icon in
  the top nav, no extra setup required).
- **In-app deploy guide** at `/setup-guide` — every step below, with live
  ✅/⚠️ status pulled from your saved Settings, and direct links to each
  external service you need to sign up for.
- A professional, consistent visual design system (typography, color, cards,
  badges) applied across every page.

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

The same steps, with live status and one-click links, are also on the
`/setup-guide` page once the app is running — that's the easier way to
follow along.

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
4. Visit `your-app.vercel.app/settings`. Fill in:
   - **Email** — sign up at [resend.com](https://resend.com), grab an API
     key from [resend.com/api-keys](https://resend.com/api-keys).
   - **WhatsApp** — create an app at
     [developers.facebook.com/apps](https://developers.facebook.com/apps),
     enable the WhatsApp product, and copy the test Phone number ID + access
     token ([setup guide](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)).
   - **GitHub token** — generate one with `repo` scope at
     [github.com/settings/tokens/new](https://github.com/settings/tokens/new),
     for the dashboard's "Run now" button.

   You can save partial progress and come back. The page also shows the exact
   two values to paste into your GitHub repo's Actions secrets
   (`WEB_APP_URL` and `INTERNAL_API_SECRET`) — copy those in once
   ([GitHub docs on Actions secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)),
   and the free scheduled automation is live.
5. Visit `/onboarding` and drag in your resume (PDF or Word) — it auto-fills
   skills, experience, target roles, and phone number. Review, then add your
   portal logins.
6. Either wait for the next scheduled run (every 2 hours) or hit "Run now" on
   the dashboard. In-app notifications need no setup — they show up in the
   bell icon automatically the moment the bot applies.

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
│   │   ├── settings/     ← configure everything here after deploy
│   │   ├── onboarding/   ← resume upload/auto-fill, profile, portal logins
│   │   ├── dashboard/    ← applied jobs table + stats
│   │   ├── setup-guide/  ← in-app step-by-step deploy guide with live status
│   │   ├── api/resume/parse/     ← PDF/DOCX text extraction + auto-fill
│   │   ├── api/notifications/    ← powers the nav bell (in-app alerts)
│   │   └── notification-bell.tsx
│   ├── lib/
│   │   ├── notify.ts        ← email, WhatsApp, and in-app notification senders
│   │   └── resumeParser.ts  ← regex/keyword-based resume field extraction
│   └── prisma/schema.prisma
├── worker/            Playwright automation (GitHub Actions)
│   └── src/
│       ├── index.ts
│       ├── matchScore.ts
│       └── portals/{linkedin,naukri}.ts
└── .github/workflows/run-bot.yml
```
