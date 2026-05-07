"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

export function AppHeader() {
  const t = useTranslations("nav");
  const tLocale = useTranslations("locale");
  const locale = useLocale();
  const pathname = usePathname();
  const other = locale === "en" ? "zh" : "en";
  const switched = pathname.replace(/^\/(en|zh)(?=\/|$)/, `/${other}`);

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href={`/${locale}/dashboard`}
          className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          {t("brand")}
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href={`/${locale}/dashboard`}
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {t("dashboard")}
          </Link>
          <Link
            href={switched}
            className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
            prefetch={false}
          >
            {tLocale("switch")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
