import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, ExternalLink, Loader2, TrendingUp, PlayCircle, Search } from "lucide-react";
import { trendApi } from "../lib/api";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import Badge from "../components/Badge";
import type { Trend } from "../types";
import { formatNumber, timeAgo } from "../lib/format";

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  youtube: <PlayCircle size={14} className="text-red-400" />,
  google: <Search size={14} className="text-blue-400" />,
  reddit: <span className="text-orange-400 text-xs font-bold">r/</span>,
};

export default function Trends() {
  const qc = useQueryClient();
  const [activeSource, setActiveSource] = useState<string>("all");
  const [region, setRegion] = useState("US");

  const { data: summary } = useQuery({
    queryKey: ["trends-summary"],
    queryFn: () => trendApi.summary().then((r) => r.data),
  });

  const { data: trendsData = [], isLoading, error } = useQuery<Trend[]>({
    queryKey: ["trends", activeSource, region],
    queryFn: () =>
      trendApi
        .list(activeSource === "all" ? undefined : activeSource, region)
        .then((r) => r.data),
  });

  const refreshMutation = useMutation({
    mutationFn: () => trendApi.refresh(region).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trends"] });
      qc.invalidateQueries({ queryKey: ["trends-summary"] });
    },
  });

  const sources = ["all", "youtube", "google", "reddit"];
  const counts = summary?.last_24h_counts ?? {};

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trend Analysis</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            What's hot across YouTube, Google, and Reddit right now
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2"
          >
            {["US", "GB", "CA", "AU", "IN", "JP", "KR", "DE", "FR", "BR"].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            {refreshMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(counts).map(([src, count]) => (
            <div key={src} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                {SOURCE_ICONS[src] ?? <TrendingUp size={14} className="text-gray-400" />}
                <span className="text-xs text-gray-400 capitalize">{src} Trends</span>
              </div>
              <p className="text-2xl font-bold text-white">{count as number}</p>
              <p className="text-xs text-gray-500 mt-0.5">tracked (24h)</p>
            </div>
          ))}
        </div>
      )}

      {/* Source filter tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-0">
        {sources.map((s) => (
          <button
            key={s}
            onClick={() => setActiveSource(s)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
              activeSource === s
                ? "border-red-500 text-white"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {s}
            {s !== "all" && counts[s] !== undefined && (
              <span className="ml-1.5 text-xs text-gray-500">({counts[s]})</span>
            )}
          </button>
        ))}
      </div>

      {error && <ErrorBanner message={(error as Error).message} />}
      {refreshMutation.error && <ErrorBanner message={(refreshMutation.error as Error).message} />}
      {refreshMutation.data && (
        <div className="bg-green-900/30 border border-green-700 rounded-lg px-4 py-2 text-green-300 text-sm">
          {refreshMutation.data.message}
          {refreshMutation.data.saved !== undefined && ` Saved ${refreshMutation.data.saved} trends.`}
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : trendsData.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
          <p>No trend data. Click "Refresh" to fetch latest trends.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {trendsData.map((trend) => (
            <div
              key={trend.id}
              className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 flex items-start gap-4 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                {SOURCE_ICONS[trend.source] ?? <TrendingUp size={14} className="text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge label={trend.source} />
                  {trend.category && (
                    <span className="text-xs text-gray-500">{trend.category}</span>
                  )}
                </div>
                <p className="text-white text-sm font-medium leading-snug">
                  {trend.title || trend.keyword}
                </p>
                {trend.description && (
                  <p className="text-gray-500 text-xs mt-1 line-clamp-2">{trend.description}</p>
                )}
                <p className="text-gray-600 text-xs mt-1.5">{timeAgo(trend.fetched_at)}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                {trend.score !== null && (
                  <p className="text-white font-semibold text-sm">
                    {formatNumber(Math.round(trend.score))}
                  </p>
                )}
                {trend.url && (
                  <a
                    href={trend.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white inline-block mt-1"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
