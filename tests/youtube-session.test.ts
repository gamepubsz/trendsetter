import { describe, expect, it } from "vitest";
import { getMissingYouTubeOAuthEnv, getYouTubeRedirectUri } from "@/lib/env";
import { decryptYouTubeSession, encryptYouTubeSession } from "@/lib/youtube/session";

describe("youtube integration helpers", () => {
  it("encrypts and decrypts an oauth session", () => {
    process.env.ENCRYPTION_KEY = "12345678901234567890123456789012";

    const encrypted = encryptYouTubeSession({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiryDate: 123456,
      scope: ["scope-a", "scope-b"],
      tokenType: "Bearer",
    });

    expect(decryptYouTubeSession(encrypted)).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiryDate: 123456,
      scope: ["scope-a", "scope-b"],
      tokenType: "Bearer",
    });
  });

  it("derives the redirect uri from public app url when not explicitly set", () => {
    expect(
      getYouTubeRedirectUri({
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      }),
    ).toBe("http://localhost:3000/api/auth/youtube/callback");
  });

  it("reports missing youtube oauth requirements", () => {
    expect(
      getMissingYouTubeOAuthEnv({
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      }),
    ).toEqual(["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "ENCRYPTION_KEY"]);
  });
});
