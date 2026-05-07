export interface Channel {
  id: number;
  youtube_channel_id: string;
  handle: string | null;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  country: string | null;
  category: string | null;
  subscriber_count: number;
  view_count: number;
  video_count: number;
  is_monetized: boolean;
  estimated_monthly_revenue_usd: number | null;
  is_own_channel: boolean;
  notes: string | null;
  stats_synced_at: string | null;
  created_at: string;
}

export interface Video {
  id: number;
  youtube_video_id: string;
  title: string;
  thumbnail_url: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  duration_seconds: number | null;
  published_at: string | null;
}

export interface Trend {
  id: number;
  source: "youtube" | "google" | "reddit" | "twitter";
  keyword: string;
  title: string | null;
  description: string | null;
  url: string | null;
  score: number | null;
  category: string | null;
  region: string;
  fetched_at: string;
}

export interface ContentIdea {
  id: number;
  channel_id: number | null;
  title: string;
  hook: string | null;
  status: "idea" | "scripted" | "filmed" | "published";
  is_starred: boolean;
  target_keyword: string | null;
  trend_score: number | null;
  source_trend: string | null;
  has_script: boolean;
  created_at: string;
}

export interface DashboardSummary {
  channels: {
    total: number;
    subscriber_count: number;
    view_count: number;
    video_count: number;
  };
  content_pipeline: Record<string, number>;
  ai_today: {
    tokens_used: number;
    cost_usd: number;
  };
}

export interface TokenUsage {
  period_days: number;
  daily_usage: Array<{
    date: string;
    tokens: number;
    cost_usd: number;
    cache_hits: number;
  }>;
  totals: { tokens: number; cost_usd: number };
  cache: { total_hits: number; estimated_tokens_saved: number };
  budget: { daily_limit: number; used_today: number; remaining_today: number | null };
}
