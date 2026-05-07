import { useState } from "react";
import { X, PlayCircle, Loader2 } from "lucide-react";
import { channelApi } from "../lib/api";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddChannelModal({ onClose, onSuccess }: Props) {
  const [handle, setHandle] = useState("");
  const [channelId, setChannelId] = useState("");
  const [category, setCategory] = useState("");
  const [isOwn, setIsOwn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!handle && !channelId) {
      setError("Enter a @handle or Channel ID");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await channelApi.create({
        handle: handle || undefined,
        youtube_channel_id: channelId || undefined,
        category: category || undefined,
        is_own_channel: isOwn,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add channel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <PlayCircle className="text-red-500" size={20} />
            <h2 className="text-white font-semibold">Add YouTube Channel</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">@Handle (e.g. @MrBeast)</label>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@YourChannelHandle"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
            />
          </div>
          <div className="text-center text-xs text-gray-500">— or —</div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Channel ID (UCxxxxxxxx...)</label>
            <input
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="UCxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Category (optional)</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Technology, Gaming, Education"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is-own"
              checked={isOwn}
              onChange={(e) => setIsOwn(e.target.checked)}
              className="accent-red-500"
            />
            <label htmlFor="is-own" className="text-sm text-gray-300">This is my own channel</label>
          </div>

          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Adding..." : "Add Channel"}
          </button>
        </div>
      </div>
    </div>
  );
}
