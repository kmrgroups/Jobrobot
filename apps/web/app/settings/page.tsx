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

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setData);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setData(await res.json());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!data) return <main className="mx-auto max-w-2xl px-6 py-12 text-muted">Loading…</main>;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold text-ink">Settings</h1>
      <p className="mb-8 text-sm text-muted">
        Every key the bot needs, in one place. Nothing here requires editing a file.
      </p>

      <div className="mb-8 rounded-md border border-accent/30 bg-accent/5 p-4">
        <p className="text-sm font-medium text-ink">
          One copy-paste this app can&apos;t avoid
        </p>
        <p className="mt-1 text-sm text-muted">
          GitHub Actions (which runs the automation for free) can&apos;t read this database on
          its own — it needs to be told your app&apos;s address and this secret, once, in your
          repo&apos;s Settings → Secrets and variables → Actions. Add two secrets there:
        </p>
        <div className="mt-3 space-y-2 font-mono text-xs">
          <div className="rounded bg-white px-3 py-2">WEB_APP_URL = your Vercel URL</div>
          <div className="rounded bg-white px-3 py-2">
            INTERNAL_API_SECRET = {data.internalApiSecret}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="rounded-md border border-gray-300 p-4">
          <legend className="px-1 text-sm font-medium">Email notifications (Resend)</legend>
          <input name="resendApiKey" defaultValue={data.resendApiKey ?? ""} placeholder="Resend API key"
            className="mb-2 w-full rounded-md border border-gray-300 px-3 py-2" />
          <input name="notifyEmailFrom" defaultValue={data.notifyEmailFrom ?? ""} placeholder="Send from address, e.g. bot@yourdomain.com"
            className="w-full rounded-md border border-gray-300 px-3 py-2" />
        </fieldset>

        <fieldset className="rounded-md border border-gray-300 p-4">
          <legend className="px-1 text-sm font-medium">WhatsApp notifications (Meta Cloud API)</legend>
          <input name="whatsappPhoneId" defaultValue={data.whatsappPhoneId ?? ""} placeholder="Phone number ID"
            className="mb-2 w-full rounded-md border border-gray-300 px-3 py-2" />
          <input name="whatsappAccessToken" defaultValue={data.whatsappAccessToken ?? ""} placeholder="Access token"
            className="w-full rounded-md border border-gray-300 px-3 py-2" />
        </fieldset>

        <fieldset className="rounded-md border border-gray-300 p-4">
          <legend className="px-1 text-sm font-medium">GitHub ("Run now" button)</legend>
          <input name="githubPat" defaultValue={data.githubPat ?? ""} placeholder="Personal access token (repo scope)"
            className="mb-2 w-full rounded-md border border-gray-300 px-3 py-2" />
          <input name="githubRepo" defaultValue={data.githubRepo ?? ""} placeholder="yourname/job-bot"
            className="w-full rounded-md border border-gray-300 px-3 py-2" />
        </fieldset>

        <button type="submit" className="rounded-md bg-accent px-4 py-2 font-medium text-white hover:opacity-90">
          Save
        </button>
        {saved && <p className="text-sm text-accent">Saved.</p>}
      </form>
    </main>
  );
}
