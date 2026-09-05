import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Never statically render/cache this route — it reads request-time
// headers/params and hits the database on every call.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const applications = await db.application.findMany({
    where: { userId },
    orderBy: { appliedAt: "desc" },
  });
  return NextResponse.json({ applications });
}
