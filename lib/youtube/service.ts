import { google, youtubeAnalytics_v2, youtube_v3 } from "googleapis";
import { cookies } from "next/headers";
import { getMissingYouTubeOAuthEnv } from "@/lib/env";
import { requireScopes } from "@/lib/security";
import { YOUTUBE_REQUIRED_SCOPES, YOUTUBE_SESSION_COOKIE } from "@/lib/youtube/constants";
import { getAuthorizedYouTubeClient } from "@/lib/youtube/client";
import { decryptYouTubeSession } from "@/lib/youtube/session";
import type {
  YouTubeAnalyticsSummary,
  YouTubeChannelSnapshot,
  YouTubeConnectionStatus,
  YouTubeOAuthSession,
} from "@/lib/youtube/types";

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseMetric(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapChannel(
  item: youtube_v3.Schema$Channel,
): YouTubeChannelSnapshot {
  const statistics = item.statistics;
  const snippet = item.snippet;

  return {
    channelId: item.id ?? "unknown-channel",
    title: snippet?.title ?? "Untitled channel",
    description: snippet?.description ?? "",
    customUrl: snippet?.customUrl ?? undefined,
    thumbnailUrl:
      snippet?.thumbnails?.high?.url ??
      snippet?.thumbnails?.medium?.url ??
      snippet?.thumbnails?.default?.url ??
      undefined,
    subscribers: parseMetric(statistics?.subscriberCount),
    views: parseMetric(statistics?.viewCount),
    videos: parseMetric(statistics?.videoCount),
  };
}

function mapAnalyticsRow(
  headers: youtubeAnalytics_v2.Schema$ResultTableColumnHeader[],
  row: unknown[] | undefined,
  startDate: string,
  endDate: string,
): YouTubeAnalyticsSummary {
  const values = Object.fromEntries(
    headers.map((header, index) => [header.name ?? `metric_${index}`, parseMetric(row?.[index])]),
  );

  const subscribersGained = values.subscribersGained ?? 0;
  const subscribersLost = values.subscribersLost ?? 0;

  return {
    startDate,
    endDate,
    views: values.views ?? 0,
    estimatedMinutesWatched: values.estimatedMinutesWatched ?? 0,
    averageViewDuration: values.averageViewDuration ?? 0,
    subscribersGained,
    subscribersLost,
    netSubscribers: subscribersGained - subscribersLost,
    estimatedRevenue: values.estimatedRevenue,
  };
}

async function fetchChannelSnapshot(session: YouTubeOAuthSession): Promise<YouTubeChannelSnapshot> {
  const auth = await getAuthorizedYouTubeClient(session);
  const youtube = google.youtube({ version: "v3", auth });
  const response = await youtube.channels.list({
    part: ["snippet", "statistics"],
    mine: true,
  });
  const channel = response.data.items?.[0];

  if (!channel) {
    throw new Error("No YouTube channel is associated with the connected Google account.");
  }

  return mapChannel(channel);
}

async function fetchAnalyticsSummary(
  session: YouTubeOAuthSession,
  days = 28,
): Promise<YouTubeAnalyticsSummary> {
  const auth = await getAuthorizedYouTubeClient(session);
  const youtubeAnalytics = google.youtubeAnalytics({ version: "v2", auth });
  const endDate = new Date();
  endDate.setUTCDate(endDate.getUTCDate() - 1);

  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1));

  const baseParams = {
    ids: "channel==MINE",
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };

  try {
    const response = await youtubeAnalytics.reports.query({
      ...baseParams,
      metrics:
        "views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost,estimatedRevenue",
    });

    return mapAnalyticsRow(
      response.data.columnHeaders ?? [],
      response.data.rows?.[0],
      baseParams.startDate,
      baseParams.endDate,
    );
  } catch {
    const fallbackResponse = await youtubeAnalytics.reports.query({
      ...baseParams,
      metrics:
        "views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost",
    });

    return mapAnalyticsRow(
      fallbackResponse.data.columnHeaders ?? [],
      fallbackResponse.data.rows?.[0],
      baseParams.startDate,
      baseParams.endDate,
    );
  }
}

export async function getYouTubeSessionFromCookies(): Promise<YouTubeOAuthSession | null> {
  const cookieStore = await cookies();
  const encrypted = cookieStore.get(YOUTUBE_SESSION_COOKIE)?.value;

  if (!encrypted) {
    return null;
  }

  return decryptYouTubeSession(encrypted);
}

export async function getYouTubeConnectionStatus(): Promise<YouTubeConnectionStatus> {
  const missingConfig = getMissingYouTubeOAuthEnv();
  const session = await getYouTubeSessionFromCookies();

  if (!session) {
    return {
      connected: false,
      configReady: missingConfig.length === 0,
      missingConfig,
      hasRefreshToken: false,
      missingScopes: [...YOUTUBE_REQUIRED_SCOPES],
      warnings: [],
    };
  }

  const missingScopes = requireScopes(session.scope, [...YOUTUBE_REQUIRED_SCOPES]);
  const status: YouTubeConnectionStatus = {
    connected: true,
    configReady: missingConfig.length === 0,
    missingConfig,
    hasRefreshToken: Boolean(session.refreshToken),
    missingScopes,
    warnings: [],
  };

  try {
    status.channel = await fetchChannelSnapshot(session);
  } catch (error) {
    status.warnings.push(
      error instanceof Error ? error.message : "Unable to load channel information.",
    );
  }

  if (missingScopes.length === 0) {
    try {
      status.analytics = await fetchAnalyticsSummary(session);
    } catch (error) {
      status.warnings.push(
        error instanceof Error ? error.message : "Unable to load YouTube analytics.",
      );
    }
  }

  return status;
}
