const WEB_APP_URL = process.env.WEB_APP_URL!;
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET!;

export interface RunProfile {
  resumeText: string;
  skills: string[];
  yearsExp?: number;
  desiredRoles: string[];
  desiredLocations: string[];
  minCTC?: number;
  phone?: string;
}

export interface RunUser {
  userId: string;
  email: string;
  username: string;
  password: string;
  profile: RunProfile;
}

export async function fetchRunsForPortal(portal: "LINKEDIN" | "NAUKRI"): Promise<RunUser[]> {
  const res = await fetch(`${WEB_APP_URL}/api/worker/creds?portal=${portal}`, {
    headers: { Authorization: `Bearer ${INTERNAL_API_SECRET}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch runs for ${portal}: ${res.status}`);
  const { runs } = await res.json();
  return runs;
}

export interface ApplicationResult {
  userId: string;
  portal: "LINKEDIN" | "NAUKRI";
  company: string;
  title: string;
  location: string;
  ctc?: string;
  jobUrl: string;
  matchScore: number;
  status: "APPLIED" | "SKIPPED_LOW_SCORE" | "FAILED";
}

export async function reportApplication(result: ApplicationResult) {
  const res = await fetch(`${WEB_APP_URL}/api/worker/applications`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${INTERNAL_API_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(result),
  });
  if (!res.ok) console.error(`Failed to report application: ${res.status}`);
}
