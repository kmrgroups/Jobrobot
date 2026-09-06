"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";

interface ProfileForm {
  resumeText: string;
  skills: string;
  yearsExp: string;
  desiredRoles: string;
  desiredLocations: string;
  minCTC: string;
  phone: string;
}

const EMPTY_FORM: ProfileForm = {
  resumeText: "",
  skills: "",
  yearsExp: "",
  desiredRoles: "",
  desiredLocations: "",
  minCTC: "",
  phone: "",
};

type PortalKey = "LINKEDIN" | "NAUKRI";

export default function OnboardingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [connectedPortals, setConnectedPortals] = useState<Partial<Record<PortalKey, string>>>({});
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/");
      return;
    }
    setUserId(user.userId);

    // Load whatever was saved previously so re-visiting this page doesn't
    // look empty — this is the profile data (resume/skills/etc.) plus which
    // portals already have a login saved (never the password itself).
    (async () => {
      try {
        const [profileRes, credsRes] = await Promise.all([
          fetch(`/api/profile?userId=${user.userId}`),
          fetch(`/api/credentials?userId=${user.userId}`),
        ]);
        const profileData = await profileRes.json();
        const credsData = await credsRes.json();

        if (profileData.profile) {
          const p = profileData.profile;
          setForm({
            resumeText: p.resumeText ?? "",
            skills: (p.skills ?? []).join(", "),
            yearsExp: p.yearsExp !== null && p.yearsExp !== undefined ? String(p.yearsExp) : "",
            desiredRoles: (p.desiredRoles ?? []).join(", "),
            desiredLocations: (p.desiredLocations ?? []).join(", "),
            minCTC: p.minCTC !== null && p.minCTC !== undefined ? String(p.minCTC) : "",
            phone: p.phone ?? "",
          });
        }

        if (credsData.credentials?.length) {
          const map: Partial<Record<PortalKey, string>> = {};
          for (const c of credsData.credentials) map[c.portal as PortalKey] = c.username;
          setConnectedPortals(map);
        }
      } catch {
        // If this fails, the form just starts blank — not fatal.
      } finally {
        setLoadingExisting(false);
      }
    })();
  }, [router]);

  function update<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleFile(file: File) {
    setParseError(null);
    setParsing(true);
    setFileName(file.name);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/resume/parse", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't parse that file.");

      setForm((prev) => ({
        ...prev,
        resumeText: data.fullText ?? prev.resumeText,
        skills: data.skills?.length ? data.skills.join(", ") : prev.skills,
        yearsExp: data.yearsExp !== undefined ? String(data.yearsExp) : prev.yearsExp,
        desiredRoles: data.desiredRoles?.length ? data.desiredRoles.join(", ") : prev.desiredRoles,
        phone: data.phone ?? prev.phone,
      }));
      setAutoFilled(true);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Something went wrong reading that file.");
    } finally {
      setParsing(false);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setStatus(null);

    const formEl = e.currentTarget;
    const fd = new FormData(formEl);

    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        resumeText: form.resumeText,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        yearsExp: Number(form.yearsExp) || undefined,
        desiredRoles: form.desiredRoles.split(",").map((s) => s.trim()).filter(Boolean),
        desiredLocations: form.desiredLocations.split(",").map((s) => s.trim()).filter(Boolean),
        minCTC: Number(form.minCTC) || undefined,
        phone: form.phone,
      }),
    });

    const updatedPortals: Partial<Record<PortalKey, string>> = { ...connectedPortals };
    for (const portal of ["LINKEDIN", "NAUKRI"] as const) {
      const username = fd.get(`${portal}_username`) as string;
      const password = fd.get(`${portal}_password`) as string;
      // Only touch a portal's saved login if the user actually typed
      // something new — leaving both blank keeps the existing one intact.
      if (username && password) {
        await fetch("/api/credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, portal, username, password }),
        });
        updatedPortals[portal] = username;
      }
    }
    setConnectedPortals(updatedPortals);

    setSaving(false);
    setStatus("Saved. The bot will use this the next time it runs.");
  }

  if (!userId || loadingExisting) {
    return <main className="mx-auto max-w-3xl px-6 py-12 text-muted">Loading your saved details…</main>;
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold text-ink">One-time setup</h1>
      <p className="mt-1 text-sm text-muted">
        Upload your resume to auto-fill this form, review the details, and add your portal logins.
        Come back any time to update it — whatever you saved before is already filled in below.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Step 1: Resume upload */}
        <section className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">1</span>
            <h2 className="text-sm font-semibold text-ink">Upload your resume</h2>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
              dragOver ? "border-accent bg-accent-light/40" : "border-border bg-paper hover:border-accent/50"
            }`}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 text-muted">
              <path d="M12 16V4m0 0L7 9m5-5l5 5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm font-medium text-ink">
              {fileName ? fileName : "Drag & drop your resume, or click to browse"}
            </p>
            <p className="mt-1 text-xs text-muted">PDF or Word (.docx) — auto-fills the fields below</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {parsing && <p className="mt-3 text-sm text-accent">Reading your resume…</p>}
          {parseError && <p className="mt-3 text-sm text-danger">{parseError}</p>}
          {autoFilled && !parsing && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-success">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Auto-filled from your resume — double-check the fields below before saving.
            </p>
          )}
          {form.resumeText && !autoFilled && (
            <p className="mt-3 text-sm text-muted">Loaded from your last saved profile — upload a new file to replace it.</p>
          )}
        </section>

        {/* Step 2: Profile details */}
        <section className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">2</span>
            <h2 className="text-sm font-semibold text-ink">Profile details</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Resume text (used for match scoring)</label>
              <textarea
                required
                rows={7}
                value={form.resumeText}
                onChange={(e) => update("resumeText", e.target.value)}
                placeholder="Paste your resume text, or upload a file above to fill this in automatically"
                className="input font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Skills</label>
                <input value={form.skills} onChange={(e) => update("skills", e.target.value)}
                  placeholder="React, Node.js, SQL" className="input" />
              </div>
              <div>
                <label className="label">Years of experience</label>
                <input type="number" min={0} value={form.yearsExp} onChange={(e) => update("yearsExp", e.target.value)}
                  placeholder="3" className="input" />
              </div>
              <div>
                <label className="label">Desired roles</label>
                <input value={form.desiredRoles} onChange={(e) => update("desiredRoles", e.target.value)}
                  placeholder="Frontend Developer, Full Stack Developer" className="input" />
              </div>
              <div>
                <label className="label">Desired locations</label>
                <input value={form.desiredLocations} onChange={(e) => update("desiredLocations", e.target.value)}
                  placeholder="Bengaluru, Remote" className="input" />
              </div>
              <div>
                <label className="label">Minimum CTC (₹ LPA or annual)</label>
                <input type="number" min={0} value={form.minCTC} onChange={(e) => update("minCTC", e.target.value)}
                  placeholder="800000" className="input" />
              </div>
              <div>
                <label className="label">WhatsApp number (for alerts)</label>
                <input value={form.phone} onChange={(e) => update("phone", e.target.value)}
                  placeholder="+919876543210" className="input" />
              </div>
            </div>
          </div>
        </section>

        {/* Step 3: Portal logins */}
        <section className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">3</span>
            <h2 className="text-sm font-semibold text-ink">Portal logins</h2>
          </div>
          <p className="mb-4 text-xs text-muted">
            Stored encrypted (AES-256-GCM). Only decrypted in memory during an automation run.
            Passwords are never sent back to this page — leave both fields blank to keep what&apos;s
            already saved.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <fieldset className="rounded-lg border border-border p-4">
              <legend className="px-1 text-sm font-medium text-ink">LinkedIn</legend>
              {connectedPortals.LINKEDIN && (
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-success">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Connected as {connectedPortals.LINKEDIN}
                </p>
              )}
              <input name="LINKEDIN_username" placeholder="Email" className="input mb-2" />
              <input
                name="LINKEDIN_password"
                type="password"
                placeholder={connectedPortals.LINKEDIN ? "•••••••• (leave blank to keep)" : "Password"}
                className="input"
              />
            </fieldset>
            <fieldset className="rounded-lg border border-border p-4">
              <legend className="px-1 text-sm font-medium text-ink">Naukri</legend>
              {connectedPortals.NAUKRI && (
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-success">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Connected as {connectedPortals.NAUKRI}
                </p>
              )}
              <input name="NAUKRI_username" placeholder="Email" className="input mb-2" />
              <input
                name="NAUKRI_password"
                type="password"
                placeholder={connectedPortals.NAUKRI ? "•••••••• (leave blank to keep)" : "Password"}
                className="input"
              />
            </fieldset>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save profile"}
          </button>
          {status && <p className="text-sm text-success">{status}</p>}
        </div>
      </form>
    </main>
  );
}
