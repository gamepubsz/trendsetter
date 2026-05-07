import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  YOUTUBE_OAUTH_REDIRECT_URI: z.string().url().optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  ENCRYPTION_KEY: z.string().min(32).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

export function parseEnv(input: Record<string, string | undefined> = process.env) {
  return envSchema.parse(input);
}

export function getMissingCriticalEnv(
  input: Record<string, string | undefined> = process.env,
): string[] {
  const parsed = envSchema.safeParse(input);

  if (!parsed.success) {
    return parsed.error.issues.map((issue) => issue.path.join("."));
  }

  const criticalKeys = [
    "DATABASE_URL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "ENCRYPTION_KEY",
  ] as const;

  return criticalKeys.filter((key) => !parsed.data[key]);
}

export function getMissingYouTubeOAuthEnv(
  input: Record<string, string | undefined> = process.env,
): string[] {
  const parsed = envSchema.safeParse(input);

  if (!parsed.success) {
    return parsed.error.issues.map((issue) => issue.path.join("."));
  }

  const requiredKeys = [
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "ENCRYPTION_KEY",
  ] as const;

  return requiredKeys.filter((key) => !parsed.data[key]);
}

export function getYouTubeRedirectUri(
  input: Record<string, string | undefined> = process.env,
): string {
  const parsed = parseEnv(input);

  return parsed.YOUTUBE_OAUTH_REDIRECT_URI ?? `${parsed.NEXT_PUBLIC_APP_URL}/api/auth/youtube/callback`;
}
