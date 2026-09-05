import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encryptSecret } from "@/lib/crypto";

// Never statically render/cache this route — it reads request-time
// headers/params and hits the database on every call.
export const dynamic = "force-dynamic";

// User submits their LinkedIn/Naukri username + password once. Password is
// encrypted immediately; the plaintext is never written to the database or logs.
export async function POST(req: NextRequest) {
  const { userId, portal, username, password } = await req.json();

  if (!userId || !portal || !username || !password) {
    return NextResponse.json({ error: "userId, portal, username, password are required" }, { status: 400 });
  }
  if (portal !== "LINKEDIN" && portal !== "NAUKRI") {
    return NextResponse.json({ error: "portal must be LINKEDIN or NAUKRI" }, { status: 400 });
  }

  const { cipherText, iv, authTag } = await encryptSecret(password);

  const credential = await db.portalCredential.upsert({
    where: { userId_portal: { userId, portal } },
    update: { username, cipherText, iv, authTag },
    create: { userId, portal, username, cipherText, iv, authTag },
  });

  return NextResponse.json({ id: credential.id, portal: credential.portal, username: credential.username });
}
