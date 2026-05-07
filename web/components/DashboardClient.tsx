"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

const apiBase = () =>
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

type Status = { connected: boolean; scopes: string[] };
type Channels = { channels: { id: string; title: string }[] };
type RedditItem = {
  id: string;
  title: string;
  score: number | null;
  subreddit?: string | null;
  url: string;
};
type RedditPayload = {
  configured: boolean;
  source: string;
  subreddit: string;
  items: RedditItem[];
};

export function DashboardClient() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const youtubeFlag = searchParams.get("youtube");

  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [channels, setChannels] = useState<Channels | null>(null);
  const [reddit, setReddit] = useState<RedditPayload | null>(null);
  const [redditError, setRedditError] = useState(false);

  const oauthUrl = useMemo(() => {
    const loc = locale === "zh" ? "zh" : "en";
    return `${apiBase()}/v1/auth/youtube/start?locale=${encodeURIComponent(loc)}`;
  }, [locale]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const health = await fetch(`${apiBase()}/health`, {
          cache: "no-store",
        });
        if (!health.ok) {
          throw new Error("health");
        }
        if (cancelled) return;
        setApiOk(true);

        const st = await fetch(`${apiBase()}/v1/youtube/status`, {
          cache: "no-store",
        });
        if (!st.ok) {
          throw new Error("status");
        }
        const stJson = (await st.json()) as Status;
        if (cancelled) return;
        setStatus(stJson);

        if (stJson.connected) {
          const ch = await fetch(`${apiBase()}/v1/youtube/channels`, {
            cache: "no-store",
          });
          if (ch.ok) {
            const chJson = (await ch.json()) as Channels;
            if (!cancelled) setChannels(chJson);
          } else {
            if (!cancelled) setChannels({ channels: [] });
          }
        } else {
          setChannels(null);
        }

        setRedditError(false);
        const tr = await fetch(`${apiBase()}/v1/trends/reddit?limit=8`, {
          cache: "no-store",
        });
        if (!tr.ok) {
          if (!cancelled) {
            setReddit(null);
            setRedditError(true);
          }
          return;
        }
        const trJson = (await tr.json()) as RedditPayload;
        if (!cancelled) setReddit(trJson);
      } catch {
        if (!cancelled) {
          setApiOk(false);
          setStatus(null);
          setChannels(null);
          setReddit(null);
          setRedditError(true);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [youtubeFlag]);

  const oauthBanner = useMemo(() => {
    if (!youtubeFlag) return null;
    const map: Record<string, string> = {
      connected: t("connected"),
      error: t("oauthError"),
      no_refresh: t("oauthNoRefresh"),
    };
    const label = map[youtubeFlag] ?? youtubeFlag;
    const tone =
      youtubeFlag === "connected"
        ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
        : "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100";
    return (
      <div className={`rounded-lg border px-3 py-2 text-sm ${tone}`} role="status">
        {label}
      </div>
    );
  }, [t, youtubeFlag]);

  return (
    <div className="flex flex-col gap-6">
      {oauthBanner}

      {apiOk === false && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
          {t("apiDown")}
        </div>
      )}

      {apiOk === null && (
        <div className="text-sm text-zinc-500">{t("checkingApi")}</div>
      )}

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t("connectionTitle")}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-sm">
            {status?.connected ? t("connected") : t("notConnected")}
          </span>
          <a
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            href={oauthUrl}
          >
            {t("connect")}
          </a>
        </div>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">{t("oauthNote")}</p>
        <div className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {t("scopesTitle")}
          </h3>
          <ul className="mt-2 space-y-1 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
            {(status?.scopes?.length ? status.scopes : []).map((s) => (
              <li key={s} className="break-all">
                {s}
              </li>
            ))}
            {!status?.connected && <li className="text-zinc-500">{t("scopesEmpty")}</li>}
          </ul>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">{t("apiHint")}</p>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {t("channelsTitle")}
        </h2>
        <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
          {(channels?.channels || []).map((c) => (
            <li key={c.id} className="py-2 text-sm">
              <span className="font-medium">{c.title}</span>
              <span className="ml-2 text-xs text-zinc-500">{c.id}</span>
            </li>
          ))}
          {channels && channels.channels.length === 0 && (
            <li className="py-2 text-sm text-zinc-500">{t("noChannels")}</li>
          )}
          {!channels && status?.connected === false && (
            <li className="py-2 text-sm text-zinc-500">{t("noChannels")}</li>
          )}
        </ul>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
          <h2 className="text-sm font-semibold">{t("trendsTitle")}</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("trendsBody")}</p>
          {reddit === null && apiOk && !redditError && (
            <p className="mt-3 text-sm text-zinc-500">{t("trendsLoading")}</p>
          )}
          {redditError && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{t("trendsError")}</p>
          )}
          {reddit && !reddit.configured && (
            <p className="mt-3 text-sm text-zinc-500">{t("trendsNotConfigured")}</p>
          )}
          {reddit && reddit.configured && reddit.items.length === 0 && (
            <p className="mt-3 text-sm text-zinc-500">{t("trendsEmpty")}</p>
          )}
          {reddit && reddit.configured && reddit.items.length > 0 && (
            <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
              {reddit.items.map((it) => (
                <li key={it.id} className="flex flex-col gap-1 py-2 text-sm">
                  <span className="font-medium leading-snug">{it.title}</span>
                  <span className="text-xs text-zinc-500">
                    r/{it.subreddit ?? reddit.subreddit} · {t("trendsScore")}{" "}
                    {it.score ?? "—"}
                  </span>
                  <a
                    className="text-xs font-medium text-blue-700 hover:underline dark:text-blue-400"
                    href={it.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("trendsOpen")}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
          <h2 className="text-sm font-semibold">{t("editTitle")}</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("editBody")}</p>
        </section>
      </div>
    </div>
  );
}
