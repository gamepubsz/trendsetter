import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Lightbulb, Sparkles, Star, StarOff, Trash2,
  ChevronDown, ChevronUp, Loader2, Plus, Tag, AlignLeft, FileText, Zap
} from "lucide-react";
import { contentApi, channelApi } from "../lib/api";
import LoadingSpinner from "../components/LoadingSpinner";
import type { Channel, ContentIdea } from "../types";
import { timeAgo } from "../lib/format";

type Tab = "ideas" | "generator";

const STATUS_ORDER = ["idea", "scripted", "filmed", "published"];

export default function Content() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("generator");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Generator state
  const [topic, setTopic] = useState("");
  const [channelStyle, setChannelStyle] = useState("");
  const [duration, setDuration] = useState(10);
  const [genType, setGenType] = useState<"titles" | "outline" | "tags" | "trend-ideas">("titles");
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [genResult, setGenResult] = useState<any>(null);
  const [genError, setGenError] = useState("");
  const [genLoading, setGenLoading] = useState(false);

  const { data: channels = [] } = useQuery<Channel[]>({
    queryKey: ["channels"],
    queryFn: () => channelApi.list(true).then((r) => r.data),
  });

  const { data: ideas = [], isLoading: ideasLoading } = useQuery<ContentIdea[]>({
    queryKey: ["ideas", filterStatus],
    queryFn: () =>
      contentApi
        .listIdeas(filterStatus !== "all" ? { status: filterStatus } : {})
        .then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => contentApi.deleteIdea(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ideas"] }),
  });

  const starMutation = useMutation({
    mutationFn: ({ id, starred }: { id: number; starred: boolean }) =>
      contentApi.updateIdea(id, { is_starred: starred }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ideas"] }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      contentApi.updateIdea(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ideas"] }),
  });

  const handleGenerate = async () => {
    if (!topic && genType !== "trend-ideas") {
      setGenError("Enter a topic");
      return;
    }
    if (genType === "trend-ideas" && !selectedChannelId) {
      setGenError("Select a channel for trend ideas");
      return;
    }
    setGenLoading(true);
    setGenError("");
    setGenResult(null);
    try {
      let res: any;
      if (genType === "titles") res = await contentApi.generateTitles(topic, channelStyle, 5);
      else if (genType === "outline") res = await contentApi.generateOutline(topic, duration);
      else if (genType === "tags") res = await contentApi.generateTags(topic);
      else if (genType === "trend-ideas") res = await contentApi.generateTrendIdeas(selectedChannelId!);
      setGenResult(res.data);
    } catch (err: any) {
      setGenError(err.message || "Generation failed");
    } finally {
      setGenLoading(false);
    }
  };

  const saveAsIdea = async (title: string, extra: object = {}) => {
    await contentApi.createIdea({
      title,
      channel_id: selectedChannelId ?? undefined,
      ...extra,
    });
    qc.invalidateQueries({ queryKey: ["ideas"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Planner</h1>
          <p className="text-gray-400 text-sm mt-0.5">AI-powered content generation & pipeline management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        {(["generator", "ideas"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              tab === t ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {t === "generator" ? "AI Generator" : "My Ideas"}
          </button>
        ))}
      </div>

      {/* ---- AI Generator ---- */}
      {tab === "generator" && (
        <div className="grid grid-cols-5 gap-5">
          {/* Controls */}
          <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Sparkles size={16} className="text-yellow-400" /> Generate Content
            </h2>

            {/* Gen type */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "titles", icon: <AlignLeft size={14} />, label: "Titles" },
                { id: "outline", icon: <FileText size={14} />, label: "Outline" },
                { id: "tags", icon: <Tag size={14} />, label: "Tags" },
                { id: "trend-ideas", icon: <Zap size={14} />, label: "Trend Ideas" },
              ].map(({ id, icon, label }) => (
                <button
                  key={id}
                  onClick={() => setGenType(id as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    genType === id
                      ? "bg-red-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            {genType !== "trend-ideas" && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  {genType === "tags" ? "Video Title / Topic" : "Topic / Keyword"}
                </label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. How to grow on YouTube in 2025"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            )}

            {genType === "titles" && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Channel Style (optional)</label>
                <input
                  value={channelStyle}
                  onChange={(e) => setChannelStyle(e.target.value)}
                  placeholder="e.g. educational, funny, dramatic"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            )}

            {genType === "outline" && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Video Duration (minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min={3}
                  max={60}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>
            )}

            {(genType === "trend-ideas" || channels.length > 0) && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Channel {genType === "trend-ideas" ? "(required)" : "(optional)"}
                </label>
                <select
                  value={selectedChannelId ?? ""}
                  onChange={(e) => setSelectedChannelId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                >
                  <option value="">Select channel...</option>
                  {channels.map((ch) => (
                    <option key={ch.id} value={ch.id}>{ch.title}</option>
                  ))}
                </select>
              </div>
            )}

            {genError && <p className="text-red-400 text-xs">{genError}</p>}

            <button
              onClick={handleGenerate}
              disabled={genLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {genLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Generating...</>
              ) : (
                <><Sparkles size={16} /> Generate</>
              )}
            </button>

            <p className="text-xs text-gray-600 text-center">
              Responses are cached for 1 hour to save tokens.
            </p>
          </div>

          {/* Results */}
          <div className="col-span-3 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Results</h2>
            {!genResult ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-600">
                <Sparkles size={36} className="mb-3 opacity-30" />
                <p className="text-sm">Choose a type and click Generate</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Token info */}
                {genResult.tokens !== undefined && (
                  <div className="flex items-center gap-3 text-xs text-gray-500 bg-gray-800 rounded-lg px-3 py-2">
                    <span>{genResult.cached ? "⚡ Cache hit" : `🔢 ${genResult.tokens} tokens used`}</span>
                    <span className="text-gray-700">·</span>
                    <span>Model: {genResult.model}</span>
                  </div>
                )}

                {/* Titles */}
                {genResult.titles && (
                  <div className="space-y-2">
                    {genResult.titles.map((t: string, i: number) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-3">
                        <span className="text-gray-500 text-xs w-4">{i + 1}</span>
                        <span className="text-white text-sm flex-1">{t}</span>
                        <button
                          onClick={() => saveAsIdea(t)}
                          className="text-gray-500 hover:text-green-400 text-xs flex items-center gap-1 transition-colors"
                          title="Save as idea"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tags */}
                {genResult.tags && (
                  <div className="flex flex-wrap gap-2">
                    {genResult.tags.map((tag: string, i: number) => (
                      <span key={i} className="bg-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Outline / text */}
                {!genResult.titles && !genResult.tags && !genResult.ideas && genResult.text && (
                  <pre className="bg-gray-800 rounded-lg p-4 text-gray-300 text-xs whitespace-pre-wrap leading-relaxed">
                    {genResult.text}
                  </pre>
                )}

                {/* Trend Ideas */}
                {genResult.ideas && genResult.ideas.length > 0 && (
                  <div className="space-y-3">
                    {genResult.ideas.map((idea: any, i: number) => (
                      <div key={i} className="bg-gray-800 rounded-xl p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-white font-medium text-sm">{idea.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                            idea.view_potential === "High"
                              ? "bg-green-900/50 text-green-300"
                              : idea.view_potential === "Medium"
                              ? "bg-yellow-900/50 text-yellow-300"
                              : "bg-gray-700 text-gray-400"
                          }`}>
                            {idea.view_potential}
                          </span>
                        </div>
                        {idea.hook && <p className="text-gray-400 text-xs"><span className="text-gray-500">Hook: </span>{idea.hook}</p>}
                        {idea.trend_reason && <p className="text-gray-500 text-xs">{idea.trend_reason}</p>}
                        <button
                          onClick={() => saveAsIdea(idea.title, { hook: idea.hook, source_trend: idea.trend_reason })}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                        >
                          <Plus size={12} /> Save idea
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- My Ideas ---- */}
      {tab === "ideas" && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2">
            {["all", ...STATUS_ORDER].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  filterStatus === s ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white bg-gray-900 border border-gray-800"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {ideasLoading ? (
            <LoadingSpinner />
          ) : ideas.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Lightbulb size={40} className="mx-auto mb-3 opacity-30" />
              <p>No ideas yet. Use the AI Generator to create some!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ideas.map((idea) => (
                <div
                  key={idea.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
                >
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
                    onClick={() => setExpandedId(expandedId === idea.id ? null : idea.id)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        starMutation.mutate({ id: idea.id, starred: !idea.is_starred });
                      }}
                      className={`flex-shrink-0 ${idea.is_starred ? "text-yellow-400" : "text-gray-600 hover:text-yellow-400"} transition-colors`}
                    >
                      {idea.is_starred ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{idea.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{timeAgo(idea.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={idea.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => statusMutation.mutate({ id: idea.id, status: e.target.value })}
                        className="bg-gray-800 border border-gray-700 text-xs text-white rounded-lg px-2 py-1"
                      >
                        {STATUS_ORDER.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {idea.has_script && (
                        <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">
                          has script
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(idea.id);
                        }}
                        className="text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                      {expandedId === idea.id ? (
                        <ChevronUp size={16} className="text-gray-500" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-500" />
                      )}
                    </div>
                  </div>
                  {expandedId === idea.id && (
                    <IdeaDetail ideaId={idea.id} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IdeaDetail({ ideaId }: { ideaId: number }) {
  const { data: idea, isLoading } = useQuery({
    queryKey: ["idea", ideaId],
    queryFn: () => contentApi.getIdea(ideaId).then((r) => r.data),
  });

  if (isLoading) return <div className="p-4"><LoadingSpinner size={20} /></div>;
  if (!idea) return null;

  return (
    <div className="border-t border-gray-800 px-4 pb-4 pt-3 space-y-3 bg-gray-800/30">
      {idea.hook && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Hook</p>
          <p className="text-gray-300 text-sm">{idea.hook}</p>
        </div>
      )}
      {idea.script_outline && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Script Outline</p>
          <pre className="text-gray-300 text-xs whitespace-pre-wrap leading-relaxed bg-gray-900 rounded-lg p-3">
            {idea.script_outline}
          </pre>
        </div>
      )}
      {idea.tags && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Tags</p>
          <p className="text-gray-400 text-xs">{idea.tags}</p>
        </div>
      )}
      {idea.source_trend && (
        <p className="text-xs text-gray-600">Source: {idea.source_trend}</p>
      )}
    </div>
  );
}
