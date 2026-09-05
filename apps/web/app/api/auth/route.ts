import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Never statically render/cache this route — it reads request-time
// headers/params and hits the database on every call.
export const dynamic = "force-dynamic";

// Not real authentication — there's no password, so anyone who knows the
// email could "sign in" as that user. Good enough for a personal or
// small-trusted-group tool; swap for NextAuth/Clerk before opening this to
// strangers.
export async function POST(req: NextRequest) {
  let email: string | undefined;
  try {
    ({ email } = await req.json());
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  try {
    const user = await db.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    return NextResponse.json({ userId: user.id, email: user.email });
  } catch (err) {
    // Log the real cause server-side (visible in Vercel function logs) and
    // still return valid JSON, so the client never has to parse an empty
    // 500 body.
    console.error("POST /api/auth failed:", err);
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: "database error", detail: message },
      { status: 500 }
    );
  }
}
