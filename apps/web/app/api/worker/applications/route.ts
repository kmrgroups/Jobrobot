import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmailNotification, sendWhatsAppNotification } from "@/lib/notify";
import { getSettings } from "@/lib/settings";

// Called by the worker once per job it applied to. Writes the row the
// dashboard reads, then fires email + WhatsApp notifications.
export async function POST(req: NextRequest) {
  const settings = await getSettings();
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${settings.internalApiSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { userId, portal, company, title, location, ctc, jobUrl, matchScore, status } = await req.json();

  const application = await db.application.create({
    data: { userId, portal, company, title, location, ctc, jobUrl, matchScore, status },
  });

  if (status === "APPLIED") {
    const user = await db.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (user) {
      const payload = {
        toEmail: user.email,
        toPhone: user.profile?.phone ?? undefined,
        company,
        title,
        location,
        ctc,
        jobUrl,
        appliedAt: application.appliedAt,
      };
      // Fire both, don't let one failure block the other
      await Promise.allSettled([sendEmailNotification(payload), sendWhatsAppNotification(payload)]);
    }
  }

  return NextResponse.json({ application });
}
