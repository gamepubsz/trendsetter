import type { YouTubeConnectionStatus } from "@/lib/youtube/types";

const statusMessages: Record<string, string> = {
  connected: "YouTube account connected successfully.",
  disconnected: "YouTube session cleared from this browser.",
  "config-error": "YouTube OAuth configuration is incomplete. Fill the required environment values first.",
  "oauth-error": "Google OAuth could not be completed. Please try again.",
};

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);

  return `${minutes}m ${remainder}s`;
}

export function YouTubeConnectionCard({
  status,
  banner,
}: {
  status: YouTubeConnectionStatus;
  banner?: string;
}) {
  return (
    <div className="list">
      {banner && statusMessages[banner] ? (
        <article className="list-item">
          <strong>{statusMessages[banner]}</strong>
        </article>
      ) : null}

      <article className="list-item">
        <h4>
          Integration status ·{" "}
          <span className="score">{status.connected ? "connected" : "not connected"}</span>
        </h4>
        <p className="muted">
          Connect a Google account that owns a YouTube channel to unlock live channel and
          analytics data.
        </p>
        <div className="chip-row">
          <span className="chip">
            Config {status.configReady ? "ready" : `missing ${status.missingConfig.length}`}
          </span>
          <span className="chip">Refresh token {status.hasRefreshToken ? "available" : "missing"}</span>
          <span className="chip">
            Analytics scopes {status.missingScopes.length === 0 ? "granted" : "incomplete"}
          </span>
        </div>
      </article>

      {status.missingConfig.length > 0 ? (
        <article className="list-item">
          <h4>Missing OAuth configuration</h4>
          <div className="chip-row">
            {status.missingConfig.map((item) => (
              <span key={item} className="chip">
                {item}
              </span>
            ))}
          </div>
        </article>
      ) : null}

      {status.channel ? (
        <article className="list-item">
          <h4>{status.channel.title}</h4>
          <p className="muted">{status.channel.description || "No public channel description."}</p>
          <div className="chip-row">
            <span className="chip">
              {status.channel.subscribers.toLocaleString("en-US")} subscribers
            </span>
            <span className="chip">{status.channel.views.toLocaleString("en-US")} views</span>
            <span className="chip">{status.channel.videos.toLocaleString("en-US")} videos</span>
          </div>
        </article>
      ) : null}

      {status.analytics ? (
        <article className="list-item">
          <h4>Last 28-day analytics</h4>
          <p className="muted">
            {status.analytics.startDate} to {status.analytics.endDate}
          </p>
          <div className="chip-row">
            <span className="chip">{status.analytics.views.toLocaleString("en-US")} views</span>
            <span className="chip">
              {status.analytics.estimatedMinutesWatched.toLocaleString("en-US")} watched minutes
            </span>
            <span className="chip">
              Avg duration {formatDuration(status.analytics.averageViewDuration)}
            </span>
            <span className="chip">
              Net subscribers {status.analytics.netSubscribers.toLocaleString("en-US")}
            </span>
            {typeof status.analytics.estimatedRevenue === "number" ? (
              <span className="chip">
                Revenue ${status.analytics.estimatedRevenue.toLocaleString("en-US")}
              </span>
            ) : null}
          </div>
        </article>
      ) : null}

      {status.missingScopes.length > 0 ? (
        <article className="list-item">
          <h4>Missing scopes</h4>
          <div className="chip-row">
            {status.missingScopes.map((scope) => (
              <span key={scope} className="chip">
                {scope}
              </span>
            ))}
          </div>
        </article>
      ) : null}

      {status.warnings.length > 0 ? (
        <article className="list-item">
          <h4>Warnings</h4>
          <ul>
            {status.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </article>
      ) : null}
    </div>
  );
}
