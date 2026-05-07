import crypto from "node:crypto";
import { parseEnv } from "@/lib/env";
import type { YouTubeOAuthSession } from "@/lib/youtube/types";

function getEncryptionKey(): Buffer {
  const env = parseEnv();
  return crypto.createHash("sha256").update(env.ENCRYPTION_KEY ?? "").digest();
}

export function encryptYouTubeSession(session: YouTubeOAuthSession): string {
  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const payload = Buffer.concat([
    cipher.update(JSON.stringify(session), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, payload]).toString("base64url");
}

export function decryptYouTubeSession(value: string): YouTubeOAuthSession | null {
  try {
    const decoded = Buffer.from(value, "base64url");
    const iv = decoded.subarray(0, 12);
    const authTag = decoded.subarray(12, 28);
    const payload = decoded.subarray(28);
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(payload), decipher.final()]).toString(
      "utf8",
    );

    return JSON.parse(decrypted) as YouTubeOAuthSession;
  } catch {
    return null;
  }
}
