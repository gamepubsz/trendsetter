import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, Loader2, Shield } from "lucide-react";
import { settingsApi } from "../lib/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Settings() {
  const [ytValidating, setYtValidating] = useState(false);
  const [ytResult, setYtResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [oaiValidating, setOaiValidating] = useState(false);
  const [oaiResult, setOaiResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const { data: status, isLoading } = useQuery({
    queryKey: ["settings-status"],
    queryFn: () => settingsApi.status().then((r) => r.data),
  });

  const handleValidateYT = async () => {
    setYtValidating(true);
    setYtResult(null);
    try {
      const res = await settingsApi.validateYoutube();
      setYtResult({ ok: true, msg: res.data.message });
    } catch (err: any) {
      setYtResult({ ok: false, msg: err.message });
    } finally {
      setYtValidating(false);
    }
  };

  const handleValidateOAI = async () => {
    setOaiValidating(true);
    setOaiResult(null);
    try {
      const res = await settingsApi.validateOpenAI();
      setOaiResult({ ok: true, msg: `${res.data.model}: "${res.data.response}"` });
    } catch (err: any) {
      setOaiResult({ ok: false, msg: err.message });
    } finally {
      setOaiValidating(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const yt = status?.youtube_api_key;
  const oai = status?.openai_api_key;
  const reddit = status?.reddit;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-0.5">API keys and configuration status</p>
      </div>

      {/* How to configure */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4 text-sm text-blue-300">
        <p className="font-medium mb-1">How to configure API keys</p>
        <p className="text-blue-400">
          Copy <code className="bg-blue-900/50 px-1 rounded">.env.example</code> to{" "}
          <code className="bg-blue-900/50 px-1 rounded">.env</code> in the{" "}
          <code className="bg-blue-900/50 px-1 rounded">backend/</code> directory and fill in your keys.
          Restart the backend server after changes.
        </p>
      </div>

      {/* YouTube */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-900/30 rounded-lg flex items-center justify-center">
            <span className="text-red-400 text-xs font-bold">YT</span>
          </div>
          <div>
            <p className="text-white font-medium">YouTube Data API v3</p>
            <p className="text-gray-500 text-xs">Required for channel sync and trending videos</p>
          </div>
          <div className="ml-auto">
            {yt?.configured ? (
              <span className="flex items-center gap-1 text-green-400 text-xs">
                <CheckCircle size={14} /> Configured
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-400 text-xs">
                <XCircle size={14} /> Not set
              </span>
            )}
          </div>
        </div>
        {yt?.masked && (
          <p className="text-xs text-gray-600 font-mono bg-gray-800 rounded px-2 py-1">
            Key: {yt.masked}
          </p>
        )}
        {ytResult && (
          <p className={`text-xs ${ytResult.ok ? "text-green-400" : "text-red-400"}`}>
            {ytResult.ok ? "✓ " : "✗ "}{ytResult.msg}
          </p>
        )}
        <button
          onClick={handleValidateYT}
          disabled={ytValidating || !yt?.configured}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 border border-gray-700 text-white px-3 py-1.5 rounded-lg text-xs transition-colors"
        >
          {ytValidating ? <Loader2 size={12} className="animate-spin" /> : null}
          Test Connection
        </button>
      </div>

      {/* OpenAI */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-900/30 rounded-lg flex items-center justify-center">
            <span className="text-green-400 text-xs font-bold">AI</span>
          </div>
          <div>
            <p className="text-white font-medium">OpenAI API</p>
            <p className="text-gray-500 text-xs">Powers content generation (titles, scripts, analysis)</p>
          </div>
          <div className="ml-auto">
            {oai?.configured ? (
              <span className="flex items-center gap-1 text-green-400 text-xs">
                <CheckCircle size={14} /> Configured
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-400 text-xs">
                <XCircle size={14} /> Not set
              </span>
            )}
          </div>
        </div>
        {oai?.masked && (
          <p className="text-xs text-gray-600 font-mono bg-gray-800 rounded px-2 py-1">
            Key: {oai.masked}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-gray-800 rounded-lg p-2">
            <p className="text-gray-500">Default model</p>
            <p className="text-white font-mono">{oai?.default_model ?? "—"}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-2">
            <p className="text-gray-500">Advanced model</p>
            <p className="text-white font-mono">{oai?.advanced_model ?? "—"}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-2 col-span-2">
            <p className="text-gray-500">Daily token budget</p>
            <p className="text-white">{oai?.daily_token_budget === 0 ? "Unlimited" : `${oai?.daily_token_budget?.toLocaleString()} tokens`}</p>
          </div>
        </div>
        {oaiResult && (
          <p className={`text-xs ${oaiResult.ok ? "text-green-400" : "text-red-400"}`}>
            {oaiResult.ok ? "✓ " : "✗ "}{oaiResult.msg}
          </p>
        )}
        <button
          onClick={handleValidateOAI}
          disabled={oaiValidating || !oai?.configured}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 border border-gray-700 text-white px-3 py-1.5 rounded-lg text-xs transition-colors"
        >
          {oaiValidating ? <Loader2 size={12} className="animate-spin" /> : null}
          Test Connection
        </button>
      </div>

      {/* Reddit */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-900/30 rounded-lg flex items-center justify-center">
            <span className="text-orange-400 text-xs font-bold">r/</span>
          </div>
          <div>
            <p className="text-white font-medium">Reddit API</p>
            <p className="text-gray-500 text-xs">Optional — for Reddit trend analysis</p>
          </div>
          <div className="ml-auto">
            {reddit?.configured ? (
              <span className="flex items-center gap-1 text-green-400 text-xs">
                <CheckCircle size={14} /> Configured
              </span>
            ) : (
              <span className="flex items-center gap-1 text-yellow-500 text-xs">
                <XCircle size={14} /> Optional
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Security info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-medium flex items-center gap-2 mb-3">
          <Shield size={16} className="text-blue-400" /> Security Notes
        </h3>
        <ul className="space-y-1.5 text-xs text-gray-400">
          <li>• API keys are loaded from environment variables only — never hardcoded</li>
          <li>• Keys are masked in all API responses (only first 4 + last 6 chars shown)</li>
          <li>• AI responses are cached in the local DB to minimize API costs</li>
          <li>• Rate limiting is active: {status ? "60 req/min per IP" : "—"}</li>
          <li>• All user inputs are sanitized against XSS/injection before storage</li>
          <li>• CORS is restricted to configured origins only</li>
          <li>• Docs endpoint (/docs) is disabled in production mode</li>
        </ul>
      </div>

      <div className="text-xs text-gray-700 pb-4">
        Environment: <span className="text-gray-500">{status?.app_env ?? "—"}</span>
      </div>
    </div>
  );
}
