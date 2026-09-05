import crypto from "crypto";
import { getSettings } from "./settings";

// Portal passwords are encrypted at rest with AES-256-GCM, using the key
// stored in the Settings row (auto-generated on first use — see
// lib/settings.ts). Decryption only happens inside /api/worker/creds, in
// memory, per run.

export async function encryptSecret(plainText: string) {
  const settings = await getSettings();
  const key = Buffer.from(settings.encryptionKey, "hex");

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    cipherText: encrypted.toString("hex"),
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

export async function decryptSecret(cipherText: string, iv: string, authTag: string): Promise<string> {
  const settings = await getSettings();
  const key = Buffer.from(settings.encryptionKey, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipherText, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
