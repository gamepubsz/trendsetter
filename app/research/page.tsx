import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { trendSignals } from "@/lib/mock-data";

export default function ResearchPage() {
  return (
    <AppShell
      title="Trend research"
      description="Aggregate fresh signals from multiple social surfaces before generating new content plans."
    >
      <SectionCard
        title="Cross-platform signals"
        description="This seed view is ready to be backed by scheduled ingestion jobs and source-specific collectors."
      >
        <div className="list">
          {trendSignals.map((trend) => (
            <article key={trend.id} className="list-item">
              <div className="chip-row" style={{ marginBottom: 10 }}>
                <span className="chip">{trend.platform}</span>
                <span className="chip">Velocity {trend.velocityScore}</span>
                <span className="chip">Engagement {trend.engagementScore}</span>
                <span className="chip">Monetization fit {trend.monetizationFit}</span>
              </div>
              <h4>{trend.topic}</h4>
              <p className="muted">{trend.summary}</p>
              <div className="chip-row">
                {trend.keywords.map((keyword) => (
                  <span key={keyword} className="chip">
                    {keyword}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
