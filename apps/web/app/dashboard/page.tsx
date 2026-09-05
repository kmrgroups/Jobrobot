import { db } from "@/lib/db";

// TODO: replace with real auth (NextAuth/Clerk) and scope to the logged-in user.
async function getApplications(userId: string) {
  return db.application.findMany({
    where: { userId },
    orderBy: { appliedAt: "desc" },
  });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { userId?: string };
}) {
  const userId = searchParams.userId;
  const applications = userId ? await getApplications(userId) : [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Applications</h1>
          <p className="text-sm text-muted">
            Every job the bot has applied to on your behalf, most recent first.
          </p>
        </div>
        <form action="/api/run" method="post">
          <button className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            Run now
          </button>
        </form>
      </div>

      {applications.length === 0 ? (
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
            {applications.map((a) => (
              <tr key={a.id} className="border-b border-gray-200">
                <td className="py-2 pr-4">{a.appliedAt.toLocaleDateString()}</td>
                <td className="py-2 pr-4">{a.appliedAt.toLocaleTimeString()}</td>
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
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
