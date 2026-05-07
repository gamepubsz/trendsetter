export interface YouTubeOAuthSession {
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number | null;
  scope: string[];
  tokenType?: string | null;
}

export interface YouTubeChannelSnapshot {
  channelId: string;
  title: string;
  description: string;
  customUrl?: string;
  thumbnailUrl?: string;
  subscribers: number;
  views: number;
  videos: number;
}

export interface YouTubeAnalyticsSummary {
  startDate: string;
  endDate: string;
  views: number;
  estimatedMinutesWatched: number;
  averageViewDuration: number;
  subscribersGained: number;
  subscribersLost: number;
  netSubscribers: number;
  estimatedRevenue?: number;
}

export interface YouTubeConnectionStatus {
  connected: boolean;
  configReady: boolean;
  missingConfig: string[];
  hasRefreshToken: boolean;
  missingScopes: string[];
  channel?: YouTubeChannelSnapshot;
  analytics?: YouTubeAnalyticsSummary;
  warnings: string[];
}
