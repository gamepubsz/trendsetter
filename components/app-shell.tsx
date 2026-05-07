import Link from "next/link";
import type { ReactNode } from "react";

const navigation = [
  { href: "/", label: "Dashboard" },
  { href: "/channels", label: "Channels" },
  { href: "/research", label: "Research" },
  { href: "/content", label: "Content Lab" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">trendsetter</p>
          <h1>YouTube Channel OS</h1>
          <p className="muted">
            Track trends, generate content opportunities, and monitor monetization paths.
          </p>
        </div>

        <nav className="nav-list" aria-label="Primary">
          {navigation.map((item) => (
            <Link key={item.href} className="nav-link" href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="main-panel">
        <header className="page-header">
          <div>
            <p className="eyebrow">MVP scaffold</p>
            <h2>{title}</h2>
            <p className="muted">{description}</p>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
