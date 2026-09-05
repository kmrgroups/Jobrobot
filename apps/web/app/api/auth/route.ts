import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Not real authentication — there's no password, so anyone who knows the
// email could "sign in" as that user. Good enough for a personal or
// small-trusted-group tool; swap for NextAuth/Clerk before opening this to
// strangers.
export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  return NextResponse.json({ userId: user.id, email: user.email });
}
