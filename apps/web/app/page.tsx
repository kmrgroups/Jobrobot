"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setCurrentUser } from "@/lib/currentUser";

const FEATURES = [
  { title: "Auto-apply", desc: "Matches jobs on LinkedIn & Naukri against your resume and applies for you." },
  { title: "Resume auto-fill", desc: "Upload a PDF or Word resume — skills, experience and contact details fill in automatically." },
  { title: "Instant alerts", desc: "Every application pings you by WhatsApp, email, and an in-app notification." },
  { title: "Full tracking", desc: "A live dashboard of every applied job — company, role, location, CTC and link." },
];

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        throw new Error(data?.error || `Sign-in failed (${res.status})`);
      }
      setCurrentUser(data);
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-2">
      <div>
        <span className="badge bg-accent-light text-accent">Auto-apply · Resume AI · Live alerts</span>
        <h1 className="mt-4 text-4xl font-bold leading-tight text-ink">
          Your job search,<br /> running on autopilot.
        </h1>
        <p className="mt-4 max-w-md text-base text-muted">
          Upload your resume once. Job Bot applies to matching roles on LinkedIn and Naukri,
          logs every application to a dashboard, and notifies you the moment it happens.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-4">
              <p className="text-sm font-semibold text-ink">{f.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card mx-auto w-full max-w-sm p-8">
        <h2 className="text-lg font-semibold text-ink">Sign in to continue</h2>
        <p className="mt-1 text-sm text-muted">
          Enter your email — first time here creates your account automatically.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">Email address</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Continuing…" : "Continue"}
          </button>
          {error && <p className="text-sm text-danger">{error}</p>}
        </form>
        <p className="mt-6 text-xs text-muted">
          First time setting this up?{" "}
          <a href="/setup-guide" className="font-medium text-accent hover:underline">
            See the full deploy guide →
          </a>
        </p>
      </div>
    </main>
  );
}
