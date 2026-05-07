import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { getRecommendedIdeas } from "@/lib/domain/dashboard";

export default function ContentPage() {
  const ideas = getRecommendedIdeas();

  return (
    <AppShell
      title="Content lab"
      description="Turn validated trends into high-conviction videos, shorts, and monetization experiments."
    >
      <SectionCard
        title="Recommended ideas"
        description="The generation endpoint is scaffolded at POST /api/ideas for future AI orchestration."
      >
        <div className="list">
          {ideas.map((idea) => (
            <article key={idea.id} className="list-item">
              <h4>{idea.title}</h4>
              <p className="muted">{idea.angle}</p>
              <div className="chip-row">
                <span className="chip">Channel {idea.channelId.replace("channel-", "")}</span>
                <span className="chip">Confidence {idea.confidence}</span>
                <span className="chip">{idea.format}</span>
              </div>
              <p>
                <span className="score">Expected impact:</span> {idea.estimatedImpact}
              </p>
              <p>
                <span className="score">Monetization:</span> {idea.monetizationNote}
              </p>
            </article>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
