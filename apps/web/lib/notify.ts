import { Resend } from "resend";
import { getSettings } from "./settings";
import { db } from "./db";

export interface ApplicationNotification {
  userId: string;
  applicationId: string;
  toEmail: string;
  toPhone?: string; // E.164 format, e.g. +919876543210
  company: string;
  title: string;
  location: string;
  ctc?: string;
  jobUrl: string;
  appliedAt: Date;
}

// Always succeeds (no third-party keys needed) — this is what powers the
// bell icon in the nav bar, independent of whether email/WhatsApp are set up.
export async function createAppNotification(n: ApplicationNotification) {
  await db.notification.create({
    data: {
      userId: n.userId,
      applicationId: n.applicationId,
      title: `Applied: ${n.title} at ${n.company}`,
      message: `${n.location} · CTC ${n.ctc ?? "not listed"} · ${n.appliedAt.toLocaleString()}`,
    },
  });
}

export async function sendEmailNotification(n: ApplicationNotification) {
  const settings = await getSettings();
  if (!settings.resendApiKey || !settings.notifyEmailFrom) {
    console.warn("Email not sent: Resend not configured yet in /settings.");
    return;
  }

  const resend = new Resend(settings.resendApiKey);
  const dateStr = n.appliedAt.toLocaleDateString();
  const timeStr = n.appliedAt.toLocaleTimeString();

  await resend.emails.send({
    from: settings.notifyEmailFrom,
    to: n.toEmail,
    subject: `Applied: ${n.title} at ${n.company}`,
    html: `
      <p>Your job bot just applied to a new role.</p>
      <ul>
        <li><b>Date:</b> ${dateStr}</li>
        <li><b>Time:</b> ${timeStr}</li>
        <li><b>Company:</b> ${n.company}</li>
        <li><b>Designation / Position:</b> ${n.title}</li>
        <li><b>Location:</b> ${n.location}</li>
        <li><b>CTC:</b> ${n.ctc ?? "Not listed"}</li>
        <li><b>Job link:</b> <a href="${n.jobUrl}">${n.jobUrl}</a></li>
      </ul>
    `,
  });
}

export async function sendWhatsAppNotification(n: ApplicationNotification) {
  if (!n.toPhone) return; // user hasn't provided a phone number

  const settings = await getSettings();
  if (!settings.whatsappPhoneId || !settings.whatsappAccessToken) {
    console.warn("WhatsApp not sent: WhatsApp Cloud API not configured yet in /settings.");
    return;
  }

  const dateStr = n.appliedAt.toLocaleDateString();
  const timeStr = n.appliedAt.toLocaleTimeString();

  const body =
    `✅ Applied to ${n.title} at ${n.company}\n` +
    `Date: ${dateStr} ${timeStr}\n` +
    `Location: ${n.location}\n` +
    `CTC: ${n.ctc ?? "Not listed"}\n` +
    `Link: ${n.jobUrl}`;

  await fetch(
    `https://graph.facebook.com/v20.0/${settings.whatsappPhoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.whatsappAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: n.toPhone,
        type: "text",
        text: { body },
      }),
    }
  );
}
