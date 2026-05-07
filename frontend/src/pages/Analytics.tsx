import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { BarChart2, Sparkles, Loader2 } from "lucide-react";
import { analyticsApi, channelApi } from "../lib/api";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import type { Channel } from "../types";
import { formatNumber } from "../lib/format";

const CHART_COLORS = {
  views: "#ef4444",
  likes: "#3b82f6",
  tokens: "#a855f7",
  cost: "#22c55e",
};

export default function Analytics() {
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [days, setDays] = useState(30);
  const [aiStrategy, setAiStrategy] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const { data: channels = [] } = useQuery<Channel[]>({
    queryKey: ["channels"],
    queryFn: () => channelApi.list(true).then((r) => r.data),
  });

  const { data: perf, isLoading: perfLoading, error: perfError } = useQuery({
    queryKey: ["perf", selectedChannelId, days],
    queryFn: () =>
      selectedChannelId
        ? analyticsApi.channelPerformance(selectedChannelId, days).then((r) => r.data)
        : null,
    enabled: !!selectedChannelId,
  });

  const { data: tokenData, isLoading: tokenLoading } = useQuery({
    queryKey: ["tokens", 30],
    queryFn: () => analyticsApi.tokens(30).then((r) => r.data),
  });

  const { data: tokenBreakdown = [] } = useQuery({
    queryKey: ["token-breakdown"],
    queryFn: () => analyticsApi.tokenBreakdown(7).then((r) => r.data),
  });

  const handleAiStrategy = async () => {
    if (!selectedChannelId) return;
    setAiLoading(true);
    setAiError("");
    setAiStrategy(null);
    try {
      const res = await analyticsApi.channelStrategy(selectedChannelId);
      setAiStrategy(res.data.text);
    } catch (err: any) {
      setAiError(err.message || "Failed to generate strategy");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 text-sm mt-0.5">Channel performance & AI cost tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedChannelId ?? ""}
            onChange={(e) => setSelectedChannelId(e.target.value ? Number(e.target.value) : null)}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2"
          >
            <option value="">Select channel...</option>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>{ch.title}</option>
            ))}
          </select>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-2"
          >
            {[7, 14, 30, 90].map((d) => (
              <option key={d} value={d}>Last {d} days</option>
            ))}
          </select>
        </div>
      </div>

      {/* Channel Performance */}
      {selectedChannelId && (
        <div className="space-y-4">
          {perfError && <ErrorBanner message={(perfError as Error).message} />}
          {perfLoading ? (
            <LoadingSpinner />
          ) : perf ? (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Videos Published", value: formatNumber(perf.summary.total_videos) },
                  { label: "Total Views", value: formatNumber(perf.summary.total_views) },
                  { label: "Avg Views/Video", value: formatNumber(perf.summary.avg_views_per_video) },
                  { label: "Engagement Rate", value: `${perf.summary.engagement_rate_pct}%` },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Top videos bar chart */}
              {perf.top_videos.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <h3 className="text-white font-medium mb-4">Top Videos by Views</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={perf.top_videos} layout="vertical">
                      <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="title"
                        tick={{ fill: "#9ca3af", fontSize: 10 }}
                        width={180}
                        tickFormatter={(v: string) => v.length > 30 ? v.substring(0, 30) + "…" : v}
                      />
                      <Tooltip
                        contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                        labelStyle={{ color: "#e5e7eb" }}
                        formatter={(v: unknown) => [formatNumber(Number(v)), "Views"]}
                      />
                      <Bar dataKey="view_count" fill={CHART_COLORS.views} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* AI Strategy */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <Sparkles size={16} className="text-yellow-400" />
                    AI Channel Strategy
                  </h3>
                  <button
                    onClick={handleAiStrategy}
                    disabled={aiLoading}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-3 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {aiLoading ? "Analyzing..." : "Analyze Channel"}
                  </button>
                </div>
                {aiError && <ErrorBanner message={aiError} />}
                {aiStrategy ? (
                  <pre className="text-gray-300 text-xs whitespace-pre-wrap leading-relaxed">
                    {aiStrategy}
                  </pre>
                ) : (
                  <p className="text-gray-600 text-sm">
                    Click "Analyze Channel" to get AI-powered strategic recommendations.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center text-gray-500">
              <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
              <p>No video data. Sync videos from the Dashboard first.</p>
            </div>
          )}
        </div>
      )}

      {/* Token Usage */}
      <div className="space-y-4">
        <h2 className="text-white font-semibold">AI Token Usage</h2>

        {tokenLoading ? (
          <LoadingSpinner />
        ) : tokenData ? (
          <>
            {/* Budget bar */}
            {tokenData.budget.daily_limit > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">Today's Token Budget</span>
                  <span className="text-sm text-white">
                    {formatNumber(tokenData.budget.used_today)} / {formatNumber(tokenData.budget.daily_limit)}
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (tokenData.budget.used_today / tokenData.budget.daily_limit) * 100)}%`,
                    }}
                  />
                </div>
                {tokenData.budget.remaining_today !== null && (
                  <p className="text-xs text-gray-500 mt-1.5">
                    {formatNumber(tokenData.budget.remaining_today)} tokens remaining today
                  </p>
                )}
              </div>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Total Tokens (30d)</p>
                <p className="text-2xl font-bold text-white">{formatNumber(tokenData.totals.tokens)}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Total Cost (30d)</p>
                <p className="text-2xl font-bold text-white">${tokenData.totals.cost_usd.toFixed(4)}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Cache Hits</p>
                <p className="text-2xl font-bold text-white">{formatNumber(tokenData.cache.total_hits)}</p>
                <p className="text-xs text-green-400 mt-0.5">
                  ~{formatNumber(tokenData.cache.estimated_tokens_saved)} tokens saved
                </p>
              </div>
            </div>

            {/* Daily usage chart */}
            {tokenData.daily_usage.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-white font-medium mb-4">Daily Token Usage</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={tokenData.daily_usage}>
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#6b7280", fontSize: 10 }}
                      tickFormatter={(v: string) => v.slice(5)}
                    />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                      labelStyle={{ color: "#e5e7eb" }}
                    />
                    <Line type="monotone" dataKey="tokens" stroke={CHART_COLORS.tokens} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        ) : null}

        {/* Breakdown by task type */}
        {tokenBreakdown.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-medium mb-4">Token Usage by Task (7d)</h3>
            <div className="space-y-2">
              {tokenBreakdown.map((row: any) => (
                <div key={row.task_type} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-24 capitalize">{row.task_type}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full"
                      style={{
                        width: `${Math.min(100, (row.total_tokens / (tokenBreakdown[0]?.total_tokens || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-20 text-right">{formatNumber(row.total_tokens)}</span>
                  <span className="text-xs text-gray-600 w-16 text-right">${row.total_cost_usd.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
