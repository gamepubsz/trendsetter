"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

const apiBase = () =>
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

type Status = { connected: boolean };
type Channels = { channels: { id: string; title: string }[] };

export function DashboardClient() {
  const t = useTranslations("dashboard");
  const searchParams = useSearchParams();
  const youtubeFlag = searchParams.get("youtube");

  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [channels, setChannels] = useState<Channels | null>(null);

  const oauthUrl = useMemo(
    () => `${apiBase()}/v1/auth/youtube/start`,
    [],
  );

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
      } catch {
        if (!cancelled) {
          setApiOk(false);
          setStatus(null);
          setChannels(null);
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
        <section className="rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
          <h2 className="text-sm font-semibold">{t("trendsTitle")}</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("trendsBody")}</p>
        </section>
        <section className="rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
          <h2 className="text-sm font-semibold">{t("editTitle")}</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("editBody")}</p>
        </section>
      </div>

    </div>
  );
}
