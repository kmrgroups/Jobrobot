import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/settings";

// Never statically render/cache this route — it reads request-time
// headers/params and hits the database on every call.
export const dynamic = "force-dynamic";

// Never returns encryptionKey — it's used internally only and never needs to
// leave the server. internalApiSecret IS returned so the user can copy it
// into their GitHub Actions secrets (that's the one manual paste this app
// can't avoid — see README).
export async function GET() {
  const settings = await getSettings();
  const { encryptionKey, ...safe } = settings;
  return NextResponse.json(safe);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const updated = await updateSettings({
    resendApiKey: body.resendApiKey,
    notifyEmailFrom: body.notifyEmailFrom,
    whatsappPhoneId: body.whatsappPhoneId,
    whatsappAccessToken: body.whatsappAccessToken,
    githubPat: body.githubPat,
    githubRepo: body.githubRepo,
  });
  const { encryptionKey, ...safe } = updated;
  return NextResponse.json(safe);
}
