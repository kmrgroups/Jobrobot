import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

// Never statically render/cache this route — it reads request-time
// headers/params and hits the database on every call.
export const dynamic = "force-dynamic";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Lets the dashboard's "Run now" button kick off an out-of-schedule worker
// run, on top of the regular cron in .github/workflows/run-bot.yml. The
// GitHub PAT and repo are entered once on /settings, not as env vars.
//
// GitHub's dispatch endpoint only replies "got it" — it does NOT hand back
// the ID of the run it just queued. So right after dispatching, we briefly
// poll the repo's run list to find the one that just appeared, and hand its
// ID + a direct link back to the dashboard so it can show live progress
// instead of just "triggered and... who knows".
export async function POST(_req: NextRequest) {
  const settings = await getSettings();
  if (!settings.githubPat || !settings.githubRepo) {
    return NextResponse.json(
      { error: "Add your GitHub token and repo on the Settings page first." },
      { status: 400 }
    );
  }

  const actionsUrl = `https://github.com/${settings.githubRepo}/actions`;
  const dispatchedAt = Date.now();

  const dispatchRes = await fetch(`https://api.github.com/repos/${settings.githubRepo}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.githubPat}`,
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify({ event_type: "manual-run" }),
  });

  if (!dispatchRes.ok) {
    return NextResponse.json(
      { error: "Failed to trigger workflow — check your GitHub token/repo in Settings." },
      { status: 502 }
    );
  }

  // Poll briefly for the run that was just created by this dispatch.
  for (let attempt = 0; attempt < 4; attempt++) {
    await sleep(1200);
    const runsRes = await fetch(
      `https://api.github.com/repos/${settings.githubRepo}/actions/runs?event=repository_dispatch&per_page=5`,
      {
        headers: {
          Authorization: `Bearer ${settings.githubPat}`,
          Accept: "application/vnd.github+json",
        },
      }
    );
    if (runsRes.ok) {
      const data = await runsRes.json();
      const match = (data.workflow_runs ?? []).find(
        (run: { created_at: string }) => new Date(run.created_at).getTime() >= dispatchedAt - 5000
      );
      if (match) {
        return NextResponse.json({
          triggered: true,
          runId: match.id,
          status: match.status, // "queued" | "in_progress" | "completed"
          conclusion: match.conclusion, // null until completed
          htmlUrl: match.html_url,
          actionsUrl,
        });
      }
    }
  }

  // Dispatched fine, but couldn't locate the exact run in time — the
  // dashboard can still link out to the Actions tab so nothing's a dead end.
  return NextResponse.json({ triggered: true, runId: null, actionsUrl });
}

// Polled by the dashboard every few seconds while a run is in flight, to
// show live status without the user needing to check GitHub themselves.
export async function GET(req: NextRequest) {
  const settings = await getSettings();
  if (!settings.githubPat || !settings.githubRepo) {
    return NextResponse.json({ error: "GitHub not configured" }, { status: 400 });
  }

  const runId = req.nextUrl.searchParams.get("runId");
  if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });

  const res = await fetch(
    `https://api.github.com/repos/${settings.githubRepo}/actions/runs/${runId}`,
    {
      headers: {
        Authorization: `Bearer ${settings.githubPat}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Couldn't fetch run status" }, { status: 502 });
  }

  const run = await res.json();
  return NextResponse.json({
    status: run.status, // "queued" | "in_progress" | "completed"
    conclusion: run.conclusion, // "success" | "failure" | "cancelled" | null
    htmlUrl: run.html_url,
  });
}
