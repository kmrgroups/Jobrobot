"use client";

import { useEffect, useState } from "react";
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
  appliedAt: string;
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

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Applications</h1>
          <p className="text-sm text-muted">
            Every job the bot has applied to on your behalf, most recent first.
          </p>
        </div>
        <button
          onClick={handleRunNow}
          disabled={running}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {running ? "Triggering…" : "Run now"}
        </button>
      </div>

      {message && <p className="mb-4 text-sm text-muted">{message}</p>}

      {applications === null ? (
        <p className="text-muted">Loading…</p>
      ) : applications.length === 0 ? (
        <p className="rounded-md border border-dashed border-gray-300 p-8 text-center text-muted">
          No applications yet. Once the bot runs, applied jobs will show up here.
        </p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-left text-muted">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Time</th>
              <th className="py-2 pr-4">Company</th>
              <th className="py-2 pr-4">Location</th>
              <th className="py-2 pr-4">CTC</th>
              <th className="py-2 pr-4">Match</th>
              <th className="py-2">Job link</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((a) => {
              const date = new Date(a.appliedAt);
              return (
                <tr key={a.id} className="border-b border-gray-200">
                  <td className="py-2 pr-4">{date.toLocaleDateString()}</td>
                  <td className="py-2 pr-4">{date.toLocaleTimeString()}</td>
                  <td className="py-2 pr-4 font-medium">{a.company}</td>
                  <td className="py-2 pr-4">{a.location}</td>
                  <td className="py-2 pr-4">{a.ctc ?? "—"}</td>
                  <td className="py-2 pr-4">{a.matchScore}%</td>
                  <td className="py-2">
                    <a href={a.jobUrl} className="text-accent underline" target="_blank" rel="noreferrer">
                      View
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
