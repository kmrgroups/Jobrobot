"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";

interface Application {
  id: string;
  company: string;
  title: string;
  location: string;
  ctc?: string;
  jobUrl: string;
  matchScore: number;
  status: "APPLIED" | "SKIPPED_LOW_SCORE" | "FAILED";
  appliedAt: string;
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="card p-5">
      <p className="section-title">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold ${accent ?? "text-ink"}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Application["status"] }) {
  const styles: Record<Application["status"], string> = {
    APPLIED: "bg-success-light text-success",
    SKIPPED_LOW_SCORE: "bg-warning-light text-warning",
    FAILED: "bg-danger-light text-danger",
  };
  const labels: Record<Application["status"], string> = {
    APPLIED: "Applied",
    SKIPPED_LOW_SCORE: "Skipped",
    FAILED: "Failed",
  };
  return <span className={`badge ${styles[status]}`}>{labels[status]}</span>;
}

function MatchBadge({ score }: { score: number }) {
  const color = score >= 75 ? "bg-success-light text-success" : score >= 50 ? "bg-warning-light text-warning" : "bg-danger-light text-danger";
  return <span className={`badge ${color}`}>{score}%</span>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/");
      return;
    }
    fetch(`/api/applications?userId=${user.userId}`)
      .then((r) => r.json())
      .then((d) => setApplications(d.applications));
  }, [router]);

  async function handleRunNow() {
    setRunning(true);
    setMessage(null);
    const res = await fetch("/api/run", { method: "POST" });
    const data = await res.json();
    setMessage(res.ok ? "Run triggered — check back in a few minutes." : data.error);
    setRunning(false);
  }

  const stats = useMemo(() => {
    if (!applications) return null;
    const applied = applications.filter((a) => a.status === "APPLIED");
    const today = applied.filter((a) => new Date(a.appliedAt).toDateString() === new Date().toDateString());
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thisWeek = applied.filter((a) => new Date(a.appliedAt).getTime() >= weekAgo);
    const avgMatch = applied.length
      ? Math.round(applied.reduce((sum, a) => sum + a.matchScore, 0) / applied.length)
      : 0;
    return { total: applied.length, today: today.length, thisWeek: thisWeek.length, avgMatch };
  }, [applications]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Applications</h1>
          <p className="mt-0.5 text-sm text-muted">
            Every job the bot has applied to on your behalf, most recent first.
          </p>
        </div>
        <button onClick={handleRunNow} disabled={running} className="btn-primary shrink-0">
          {running ? "Triggering…" : "Run now"}
        </button>
      </div>

      {message && <p className="mb-4 text-sm text-muted">{message}</p>}

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total applied" value={stats.total} />
          <StatCard label="Today" value={stats.today} accent="text-accent" />
          <StatCard label="This week" value={stats.thisWeek} />
          <StatCard label="Avg. match score" value={`${stats.avgMatch}%`} accent="text-success" />
        </div>
      )}

      <div className="card overflow-hidden">
        {applications === null ? (
          <p className="p-8 text-center text-muted">Loading…</p>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-ink">No applications yet</p>
            <p className="mt-1 text-sm text-muted">
              Once the bot runs, applied jobs will show up here — with a notification on WhatsApp, email and in-app.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-paper text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Designation / Position</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">CTC</th>
                  <th className="px-4 py-3">Match</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Job link</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => {
                  const date = new Date(a.appliedAt);
                  return (
                    <tr key={a.id} className="border-b border-border last:border-0 hover:bg-paper/60">
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{date.toLocaleDateString()}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{date.toLocaleTimeString()}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{a.company}</td>
                      <td className="px-4 py-3 text-ink">{a.title}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{a.location}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{a.ctc ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3"><MatchBadge score={a.matchScore} /></td>
                      <td className="whitespace-nowrap px-4 py-3"><StatusBadge status={a.status} /></td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <a href={a.jobUrl} className="font-medium text-accent hover:underline" target="_blank" rel="noreferrer">
                          View →
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
