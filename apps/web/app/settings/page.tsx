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
  linkedinEnabled: boolean;
  naukriEnabled: boolean;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-white px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="truncate font-mono text-xs text-ink">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="shrink-0 rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-ink hover:bg-paper"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

function PortalToggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-white p-4">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="mt-0.5 text-xs text-muted">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-accent" : "bg-border"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [linkedinEnabled, setLinkedinEnabled] = useState(true);
  const [naukriEnabled, setNaukriEnabled] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d: SettingsData) => {
        setData(d);
        setLinkedinEnabled(d.linkedinEnabled ?? true);
        setNaukriEnabled(d.naukriEnabled ?? true);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const body = {
      ...Object.fromEntries(form.entries()),
      linkedinEnabled,
      naukriEnabled,
    };
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setData(await res.json());
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!data) return <main className="mx-auto max-w-2xl px-6 py-12 text-muted">Loading…</main>;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold text-ink">Settings</h1>
      <p className="mt-1 text-sm text-muted">
        Every key the bot needs, in one place. Nothing here requires editing a file. See the{" "}
        <a href="/setup-guide" className="font-medium text-accent hover:underline">Deploy Guide</a> for where to get each one.
      </p>

      <div className="mt-6 card border-accent/20 bg-accent-light/40 p-5">
        <p className="text-sm font-semibold text-ink">One copy-paste this app can&apos;t avoid</p>
        <p className="mt-1 text-sm text-muted">
          GitHub Actions (which runs the automation for free) can&apos;t read this database on
          its own — it needs your app&apos;s address and this secret, once, in your repo&apos;s
          <span className="font-medium text-ink"> Settings → Secrets and variables → Actions</span>.
        </p>
        <div className="mt-3 space-y-2">
          <CopyField label="WEB_APP_URL" value="your Vercel URL, e.g. https://your-app.vercel.app" />
          <CopyField label="INTERNAL_API_SECRET" value={data.internalApiSecret} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <fieldset className="card p-5">
          <legend className="px-1 text-sm font-semibold text-ink">🎯 Active portals</legend>
          <p className="mb-3 mt-1 text-xs text-muted">
            Turn a portal off to skip it completely on the next run — the bot won&apos;t log in,
            search, or apply on that site until you switch it back on.
          </p>
          <div className="space-y-3">
            <PortalToggle
              label="LinkedIn"
              hint={linkedinEnabled ? "The bot will run on LinkedIn." : "Off — LinkedIn will be skipped entirely."}
              checked={linkedinEnabled}
              onChange={setLinkedinEnabled}
            />
            <PortalToggle
              label="Naukri"
              hint={naukriEnabled ? "The bot will run on Naukri." : "Off — Naukri will be skipped entirely."}
              checked={naukriEnabled}
              onChange={setNaukriEnabled}
            />
          </div>
        </fieldset>

        <fieldset className="card p-5">
          <legend className="px-1 text-sm font-semibold text-ink">📧 Email notifications (Resend)</legend>
          <div className="mt-3 space-y-3">
            <div>
              <label className="label">Resend API key</label>
              <input name="resendApiKey" defaultValue={data.resendApiKey ?? ""} placeholder="re_xxxxxxxx" className="input" />
            </div>
            <div>
              <label className="label">Send-from address</label>
              <input name="notifyEmailFrom" defaultValue={data.notifyEmailFrom ?? ""} placeholder="bot@yourdomain.com" className="input" />
            </div>
          </div>
        </fieldset>

        <fieldset className="card p-5">
          <legend className="px-1 text-sm font-semibold text-ink">💬 WhatsApp notifications (Meta Cloud API)</legend>
          <div className="mt-3 space-y-3">
            <div>
              <label className="label">Phone number ID</label>
              <input name="whatsappPhoneId" defaultValue={data.whatsappPhoneId ?? ""} placeholder="1029384756" className="input" />
            </div>
            <div>
              <label className="label">Access token</label>
              <input name="whatsappAccessToken" defaultValue={data.whatsappAccessToken ?? ""} placeholder="EAAG..." className="input" />
            </div>
          </div>
        </fieldset>

        <fieldset className="card p-5">
          <legend className="px-1 text-sm font-semibold text-ink">⚙️ GitHub (&quot;Run now&quot; button)</legend>
          <div className="mt-3 space-y-3">
            <div>
              <label className="label">Personal access token (repo scope)</label>
              <input name="githubPat" defaultValue={data.githubPat ?? ""} placeholder="ghp_xxxxxxxx" className="input" />
            </div>
            <div>
              <label className="label">Repository</label>
              <input name="githubRepo" defaultValue={data.githubRepo ?? ""} placeholder="yourname/job-bot" className="input" />
            </div>
          </div>
        </fieldset>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save settings"}
          </button>
          {saved && <p className="text-sm text-success">Saved.</p>}
        </div>
      </form>
    </main>
  );
}
