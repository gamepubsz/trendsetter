import { describe, expect, it } from "vitest";
import { getMissingCriticalEnv } from "@/lib/env";
import { redactSecret, requireScopes, sanitizeConfigRecord } from "@/lib/security";

describe("security helpers", () => {
  it("redacts secrets in config previews", () => {
    const sanitized = sanitizeConfigRecord({
      OPENAI_API_KEY: "sk-this-is-a-long-key",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });

    expect(sanitized.OPENAI_API_KEY).toContain("[REDACTED]");
    expect(sanitized.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });

  it("reports missing scopes", () => {
    expect(
      requireScopes(
        ["youtube.readonly", "yt-analytics.readonly"],
        ["youtube.readonly", "youtube.upload"],
      ),
    ).toEqual(["youtube.upload"]);
  });

  it("identifies missing critical environment values", () => {
    const missing = getMissingCriticalEnv({
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });

    expect(missing).toContain("DATABASE_URL");
    expect(redactSecret("123456789")).toBe("1234...[REDACTED]...89");
  });
});
