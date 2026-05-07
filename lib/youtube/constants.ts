export const YOUTUBE_SESSION_COOKIE = "trendsetter_youtube_session";
export const YOUTUBE_STATE_COOKIE = "trendsetter_youtube_oauth_state";

export const YOUTUBE_REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
] as const;
