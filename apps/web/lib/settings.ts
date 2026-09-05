import crypto from "crypto";
import { db } from "./db";

// Everything the app needs besides DATABASE_URL lives in this one DB row,
// editable from /settings in the browser. The two secret fields
// (encryptionKey, internalApiSecret) are generated the first time this is
// called, so nobody has to run a command to produce them.
export async function getSettings() {
  let settings = await db.settings.findUnique({ where: { id: 1 } });

  if (!settings) {
    settings = await db.settings.create({
      data: {
        id: 1,
        encryptionKey: crypto.randomBytes(32).toString("hex"),
        internalApiSecret: crypto.randomBytes(32).toString("hex"),
      },
    });
  }

  return settings;
}

export async function updateSettings(fields: Partial<{
  resendApiKey: string;
  notifyEmailFrom: string;
  whatsappPhoneId: string;
  whatsappAccessToken: string;
  githubPat: string;
  githubRepo: string;
}>) {
  await getSettings(); // ensure the row exists first
  return db.settings.update({ where: { id: 1 }, data: fields });
}
