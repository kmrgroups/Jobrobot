import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";
import { getSettings } from "@/lib/settings";

// Called only by the GitHub Actions worker, authenticated with the
// internalApiSecret shown on /settings (never exposed to the dashboard UI
// beyond that page). Returns decrypted credentials + profile data for every
// user who has a credential for the requested portal.
export async function GET(req: NextRequest) {
  const settings = await getSettings();
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${settings.internalApiSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const portal = req.nextUrl.searchParams.get("portal");
  if (portal !== "LINKEDIN" && portal !== "NAUKRI") {
    return NextResponse.json({ error: "portal must be LINKEDIN or NAUKRI" }, { status: 400 });
  }

  const credentials = await db.portalCredential.findMany({
    where: { portal },
    include: { user: { include: { profile: true } } },
  });

  const runs = await Promise.all(
    credentials
      .filter((c) => c.user.profile) // skip users who haven't finished onboarding
      .map(async (c) => ({
        userId: c.userId,
        email: c.user.email,
        username: c.username,
        password: await decryptSecret(c.cipherText, c.iv, c.authTag),
        profile: c.user.profile,
      }))
  );

  return NextResponse.json({ runs });
}
