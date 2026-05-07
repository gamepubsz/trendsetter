import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { DashboardClient } from "@/components/DashboardClient";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });

  return (
    <main className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("headline")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          {t("sub")}
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-zinc-500">{t("checkingApi")}</p>}>
        <DashboardClient />
      </Suspense>
      <p className="text-xs text-zinc-500 dark:text-zinc-500">{t("queryHint")}</p>
    </main>
  );
}
