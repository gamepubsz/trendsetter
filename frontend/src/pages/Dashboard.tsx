import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Eye, Video, DollarSign, Plus, RefreshCw, Loader2 } from "lucide-react";
import { analyticsApi, channelApi } from "../lib/api";
import StatCard from "../components/StatCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorBanner from "../components/ErrorBanner";
import AddChannelModal from "../components/AddChannelModal";
import type { Channel, DashboardSummary } from "../types";
import { formatNumber } from "../lib/format";

export default function Dashboard() {
  const qc = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncingId, setSyncingId] = useState<number | null>(null);

  const { data: summary, isLoading: summaryLoading, error: summaryError } =
    useQuery<DashboardSummary>({
      queryKey: ["dashboard"],
      queryFn: () => analyticsApi.dashboard().then((r) => r.data),
      refetchInterval: 60_000,
    });

  const { data: channels = [], isLoading: chLoading } = useQuery<Channel[]>({
    queryKey: ["channels"],
    queryFn: () => channelApi.list(false).then((r) => r.data),
  });

  const ownChannels = channels.filter((c) => c.is_own_channel);
  const pipeline = summary?.content_pipeline ?? {};
  const pipelineTotal = Object.values(pipeline).reduce((a, b) => a + b, 0);

  const handleSync = async (ch: Channel) => {
    setSyncingId(ch.id);
    try {
      await channelApi.sync(ch.id);
      qc.invalidateQueries({ queryKey: ["channels"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    } finally {
      setSyncingId(null);
    }
  };

  if (summaryLoading || chLoading) return <LoadingSpinner />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Overview of your YouTube empire</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add Channel
        </button>
      </div>

      {summaryError && <ErrorBanner message={(summaryError as Error).message} />}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Subscribers"
          value={formatNumber(summary?.channels.subscriber_count ?? 0)}
          subtitle={`Across ${summary?.channels.total ?? 0} channels`}
          icon={Users}
          iconColor="text-red-400"
        />
        <StatCard
          title="Total Views"
          value={formatNumber(summary?.channels.view_count ?? 0)}
          icon={Eye}
          iconColor="text-blue-400"
        />
        <StatCard
          title="Videos"
          value={formatNumber(summary?.channels.video_count ?? 0)}
          icon={Video}
          iconColor="text-purple-400"
        />
        <StatCard
          title="AI Cost Today"
          value={`$${summary?.ai_today.cost_usd.toFixed(4) ?? "0.0000"}`}
          subtitle={`${formatNumber(summary?.ai_today.tokens_used ?? 0)} tokens`}
          icon={DollarSign}
          iconColor="text-green-400"
        />
      </div>

      {/* Content pipeline */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">Content Pipeline</h2>
        <div className="grid grid-cols-4 gap-3">
          {(["idea", "scripted", "filmed", "published"] as const).map((stage) => {
            const count = pipeline[stage] ?? 0;
            const pct = pipelineTotal > 0 ? Math.round((count / pipelineTotal) * 100) : 0;
            const colors: Record<string, string> = {
              idea: "bg-gray-600",
              scripted: "bg-blue-600",
              filmed: "bg-yellow-500",
              published: "bg-green-600",
            };
            return (
              <div key={stage} className="bg-gray-800 rounded-lg p-3">
                <div className={`w-8 h-1.5 rounded-full ${colors[stage]} mb-2`} />
                <p className="text-xs text-gray-400 capitalize">{stage}</p>
                <p className="text-xl font-bold text-white">{count}</p>
                <p className="text-xs text-gray-500">{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* My Channels */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">My Channels</h2>
        {ownChannels.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>No channels added yet.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 text-red-500 text-sm hover:underline"
            >
              + Add your first channel
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {ownChannels.map((ch) => (
              <div
                key={ch.id}
                className="flex items-center gap-4 bg-gray-800 rounded-xl p-4 hover:bg-gray-750 transition-colors"
              >
                {ch.thumbnail_url ? (
                  <img
                    src={ch.thumbnail_url}
                    alt={ch.title}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-400 text-lg font-bold">
                      {ch.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{ch.title}</p>
                  <p className="text-gray-400 text-xs">{ch.handle || ch.youtube_channel_id}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center flex-shrink-0">
                  <div>
                    <p className="text-white text-sm font-semibold">{formatNumber(ch.subscriber_count)}</p>
                    <p className="text-gray-500 text-xs">Subs</p>
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{formatNumber(ch.view_count)}</p>
                    <p className="text-gray-500 text-xs">Views</p>
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{ch.video_count}</p>
                    <p className="text-gray-500 text-xs">Videos</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSync(ch)}
                  disabled={syncingId === ch.id}
                  className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors flex-shrink-0"
                  title="Sync stats"
                >
                  {syncingId === ch.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Watched Channels */}
      {channels.filter((c) => !c.is_own_channel).length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Tracked Competitors</h2>
          <div className="space-y-2">
            {channels
              .filter((c) => !c.is_own_channel)
              .map((ch) => (
                <div key={ch.id} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                  {ch.thumbnail_url && (
                    <img src={ch.thumbnail_url} alt="" className="w-8 h-8 rounded-full" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-white">{ch.title}</p>
                  </div>
                  <p className="text-xs text-gray-400">{formatNumber(ch.subscriber_count)} subs</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {showAddModal && (
        <AddChannelModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["channels"] });
            qc.invalidateQueries({ queryKey: ["dashboard"] });
          }}
        />
      )}
    </div>
  );
}
