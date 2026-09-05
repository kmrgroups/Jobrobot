"use client";

import { useEffect, useState } from "react";

interface SettingsData {
  internalApiSecret: string;
  resendApiKey?: string;
  notifyEmailFrom?: string;
  whatsappPhoneId?: string;
  whatsappAccessToken?: string;
  githubPat?: string;
  githubRepo?: string;
}

function StepBadge({ done }: { done: boolean | null }) {
  if (done === null) {
    return <span className="badge bg-paper text-muted">Manual step</span>;
  }
  return done ? (
    <span className="badge bg-success-light text-success">Done</span>
  ) : (
    <span className="badge bg-warning-light text-warning">Not yet</span>
  );
}

function LinkChip({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-light"
    >
      {children}
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M7 17 17 7M7 7h10v10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}

function Step({
  n,
  title,
  done,
  children,
}: {
  n: number;
  title: string;
  done: boolean | null;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
            {n}
          </span>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
        </div>
        <StepBadge done={done} />
      </div>
      <div className="pl-10 text-sm leading-relaxed text-muted">{children}</div>
    </div>
  );
}

export default function SetupGuidePage() {
  const [data, setData] = useState<SettingsData | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold text-ink">Complete deploy guide</h1>
      <p className="mt-1 text-sm text-muted">
        Everything needed to get Job Bot running, with the exact links. Most of it is filled in
        through this app — only two steps need copy-pasting outside it.
      </p>

      <div className="mt-8 space-y-5">
        <Step n={1} title="Create a free Postgres database" done={null}>
          <p>
            The app needs one database. Create a free one at Neon (or use Vercel&apos;s built-in
            Postgres/Neon integration in step 2 — same result, no separate signup needed).
          </p>
          <div className="mt-3">
            <LinkChip href="https://neon.tech">neon.tech — create database</LinkChip>
          </div>
        </Step>

        <Step n={2} title="Deploy the repo to Vercel" done={null}>
          <p>
            Import this repository into Vercel. Set the <b>root directory</b> to{" "}
            <code className="rounded bg-paper px-1 py-0.5 text-xs">apps/web</code>, and add one
            environment variable: <code className="rounded bg-paper px-1 py-0.5 text-xs">DATABASE_URL</code>{" "}
            (the connection string from step 1).
          </p>
          <div className="mt-3">
            <LinkChip href="https://vercel.com/new">vercel.com/new — import project</LinkChip>
          </div>
        </Step>

        <Step n={3} title="Run the database migration once" done={null}>
          <p>From your machine (or a Vercel deploy hook), after the first deploy:</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-ink px-4 py-3 text-xs text-white">
{`cd apps/web
npx prisma migrate deploy`}
          </pre>
        </Step>

        <Step n={4} title="Set up email alerts (Resend)" done={data ? !!data.resendApiKey : null}>
          <p>
            Create a free Resend account, generate an API key, and paste it into{" "}
            <a href="/settings" className="font-medium text-accent hover:underline">Settings</a>{" "}
            along with a &quot;send from&quot; address.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <LinkChip href="https://resend.com">resend.com — sign up</LinkChip>
            <LinkChip href="https://resend.com/api-keys">resend.com/api-keys</LinkChip>
          </div>
        </Step>

        <Step
          n={5}
          title="Set up WhatsApp alerts (Meta Cloud API)"
          done={data ? !!(data.whatsappPhoneId && data.whatsappAccessToken) : null}
        >
          <p>
            Create a Meta developer app with the WhatsApp product enabled. Copy the test{" "}
            <b>Phone number ID</b> and <b>temporary access token</b> into{" "}
            <a href="/settings" className="font-medium text-accent hover:underline">Settings</a>.
            Free tier covers ~1,000 conversations/month.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <LinkChip href="https://developers.facebook.com/apps">developers.facebook.com — create app</LinkChip>
            <LinkChip href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started">
              WhatsApp Cloud API — get started
            </LinkChip>
          </div>
        </Step>

        <Step n={6} title="In-app notifications" done={true}>
          <p>
            No setup needed — every applied job automatically appears in the 🔔 bell icon in the
            top nav, independent of email/WhatsApp.
          </p>
        </Step>

        <Step n={7} title="Connect GitHub Actions (free automation)" done={null}>
          <p>
            GitHub Actions runs the scheduled automation for free, but it can&apos;t read your
            app&apos;s database on its own. Paste these two values into your repo&apos;s{" "}
            <b>Settings → Secrets and variables → Actions</b> once — the exact values are shown on
            the{" "}
            <a href="/settings" className="font-medium text-accent hover:underline">Settings page</a>{" "}
            with one-click copy.
          </p>
          <div className="mt-3 space-y-1.5 font-mono text-xs">
            <div className="rounded bg-paper px-3 py-2">WEB_APP_URL = your Vercel URL</div>
            <div className="rounded bg-paper px-3 py-2">INTERNAL_API_SECRET = (from Settings page)</div>
          </div>
          <div className="mt-3">
            <LinkChip href="https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions">
              GitHub docs — Actions secrets
            </LinkChip>
          </div>
        </Step>

        <Step n={8} title="Add a GitHub token for the “Run now” button" done={data ? !!(data.githubPat && data.githubRepo) : null}>
          <p>
            Generate a personal access token with <b>repo</b> scope, then paste it plus{" "}
            <code className="rounded bg-paper px-1 py-0.5 text-xs">yourname/job-bot</code> into{" "}
            <a href="/settings" className="font-medium text-accent hover:underline">Settings</a>.
            This lets the dashboard trigger an out-of-schedule run.
          </p>
          <div className="mt-3">
            <LinkChip href="https://github.com/settings/tokens/new">github.com/settings/tokens — new token</LinkChip>
          </div>
        </Step>

        <Step n={9} title="Add your resume and portal logins" done={null}>
          <p>
            Go to{" "}
            <a href="/onboarding" className="font-medium text-accent hover:underline">Setup</a>{" "}
            and upload your resume — PDF or Word, it auto-fills skills, experience, and phone
            number. Then add your LinkedIn/Naukri logins (encrypted at rest).
          </p>
        </Step>

        <Step n={10} title="Run it" done={null}>
          <p>
            Either wait for the scheduled run (every 2 hours via GitHub Actions), or hit{" "}
            <b>Run now</b> on the{" "}
            <a href="/dashboard" className="font-medium text-accent hover:underline">Dashboard</a>.
            Every applied job logs to the dashboard and notifies you on WhatsApp, email and in-app.
          </p>
        </Step>
      </div>

      <div className="mt-8 card border-warning/30 bg-warning-light p-5">
        <p className="text-sm font-semibold text-ink">Before you rely on this</p>
        <p className="mt-1 text-sm text-muted">
          This logs into LinkedIn and Naukri with real credentials. Both portals&apos; Terms of
          Service prohibit automated use and run bot detection — LinkedIn has suspended accounts
          for scripted login/apply behavior. Use your own accounts and understand this risk is
          real. Selectors in <code className="rounded bg-white px-1 py-0.5 text-xs">worker/src/portals/*.ts</code>{" "}
          are stubs — they need to be wired to each portal&apos;s real page elements before the bot
          can actually apply.
        </p>
      </div>
    </main>
  );
}
