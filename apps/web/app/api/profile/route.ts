import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Never statically render/cache this route — it reads request-time
// headers/params and hits the database on every call.
export const dynamic = "force-dynamic";

// One-time setup: user submits resume text (already parsed client-side or via
// a separate /api/resume/parse route using pdf-parse/mammoth) plus structured
// profile fields used for match scoring.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    userId,
    resumeText,
    resumeFileUrl,
    skills,
    yearsExp,
    desiredRoles,
    desiredLocations,
    minCTC,
    phone,
  } = body;

  if (!userId || !resumeText) {
    return NextResponse.json({ error: "userId and resumeText are required" }, { status: 400 });
  }

  const profile = await db.profile.upsert({
    where: { userId },
    update: { resumeText, resumeFileUrl, skills, yearsExp, desiredRoles, desiredLocations, minCTC, phone },
    create: { userId, resumeText, resumeFileUrl, skills, yearsExp, desiredRoles, desiredLocations, minCTC, phone },
  });

  return NextResponse.json({ profile });
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const profile = await db.profile.findUnique({ where: { userId } });
  return NextResponse.json({ profile });
}
