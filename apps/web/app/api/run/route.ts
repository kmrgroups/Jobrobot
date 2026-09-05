import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

// Never statically render/cache this route — it reads request-time
// headers/params and hits the database on every call.
export const dynamic = "force-dynamic";

// Lets the dashboard's "Run now" button kick off an out-of-schedule worker
// run, on top of the regular cron in .github/workflows/run-bot.yml. The
// GitHub PAT and repo are entered once on /settings, not as env vars.
export async function POST(_req: NextRequest) {
  const settings = await getSettings();
  if (!settings.githubPat || !settings.githubRepo) {
    return NextResponse.json(
      { error: "Add your GitHub token and repo on the Settings page first." },
      { status: 400 }
    );
  }

  const res = await fetch(`https://api.github.com/repos/${settings.githubRepo}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.githubPat}`,
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify({ event_type: "manual-run" }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to trigger workflow — check your GitHub token/repo in Settings." }, { status: 502 });
  }
  return NextResponse.json({ triggered: true });
}
