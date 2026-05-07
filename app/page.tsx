import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { getDashboardData } from "@/lib/domain/dashboard";

export default function DashboardPage() {
  const dashboard = getDashboardData();

  return (
    <AppShell title="Unified dashboard" description={dashboard.headline}>
      <section className="hero-banner">
        <div className="card">
          <p className="eyebrow">Monetization cockpit</p>
          <h3>Research, create, operate, and optimize from a single workspace.</h3>
          <p className="muted">
            This MVP scaffold combines trend discovery, content planning, channel performance,
            and low-token execution policies so you can scale one or more channels safely.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/research">
              Review trend signals
            </Link>
            <Link className="button secondary" href="/content">
              Generate content ideas
            </Link>
          </div>
        </div>
      </section>

      <section className="grid cols-4">
        {dashboard.overview.map((metric) => (
          <StatCard key={metric.label} metric={metric} />
        ))}
      </section>

      <div className="grid cols-2" style={{ marginTop: 24 }}>
        <SectionCard
          title="Channel portfolio"
          description="Manage several channels and compare monetization readiness."
        >
          <div className="list">
            {dashboard.channels.map((channel) => (
              <article key={channel.id} className="list-item">
                <h4>{channel.name}</h4>
                <p className="muted">
                  {channel.niche} · {channel.audience}
                </p>
                <div className="chip-row">
                  <span className="chip">
                    {channel.subscribers.toLocaleString("en-US")} subscribers
                  </span>
                  <span className="chip">
                    ${channel.revenueEstimateUsd.toLocaleString("en-US")} est. revenue
                  </span>
                  <span className="chip">{channel.uploadCadence}</span>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Top recommended content"
          description="Ideas ranked by trend velocity, fit, and monetization potential."
        >
          <div className="list">
            {dashboard.ideas.slice(0, 4).map((idea) => (
              <article key={idea.id} className="list-item">
                <h4>{idea.title}</h4>
                <p className="muted">{idea.angle}</p>
                <div className="chip-row">
                  <span className="chip">Confidence {idea.confidence}</span>
                  <span className="chip">{idea.format}</span>
                  <span className="chip">{idea.estimatedImpact}</span>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
