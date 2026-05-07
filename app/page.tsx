import {
  channels,
  contentPlans,
  safetyChecks,
} from "@/lib/mock-data";
import {
  defaultCostPolicy,
  estimateTokenSpend,
  shouldEscalateTrend,
} from "@/lib/cost-controls";
import { getReleaseReadiness } from "@/lib/security-checks";
import { productStrategy, strategySummary } from "@/lib/product-strategy";
import { getPrioritizedTrendSignals } from "@/lib/youtube-trends";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const totalRevenue = channels.reduce((sum, channel) => sum + channel.monthlyRevenueUsd, 0);
const totalSubscribers = channels.reduce((sum, channel) => sum + channel.subscribers, 0);
const totalWatchHours = channels.reduce((sum, channel) => sum + channel.watchHours, 0);
const averageCtr =
  channels.reduce((sum, channel) => sum + channel.ctr, 0) / Math.max(channels.length, 1);
const tokenSpend = estimateTokenSpend(contentPlans);
const releaseReadiness = getReleaseReadiness();
const prioritizedTrendSignals = getPrioritizedTrendSignals();

export default function Home() {
  return (
    <main className="dashboard-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Trendsetter MVP</p>
          <h1>YouTube 频道增长与变现控制台</h1>
          <p className="hero-copy">
            English-first content strategy, YouTube-first trend discovery, review-gated auto scheduling,
            and monetization focused on ads plus affiliate offers.
          </p>
        </div>
        <div className="hero-card">
          <span>Release readiness</span>
          <strong>{releaseReadiness.canRelease ? "Ready with review" : "Blocked"}</strong>
          <p>
            {releaseReadiness.needsReviewCount} item needs human review;{" "}
            {releaseReadiness.blockedCount} blockers.
          </p>
        </div>
      </section>

      <section className="strategy-grid" aria-label="confirmed product strategy">
        {strategySummary.map((item) => (
          <article className="strategy-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="metric-grid" aria-label="channel portfolio metrics">
        <MetricCard
          label="Managed channels"
          value={channels.length.toString()}
          helper="Multi-channel portfolio"
        />
        <MetricCard
          label="Subscribers"
          value={totalSubscribers.toLocaleString()}
          helper="Total English audience"
        />
        <MetricCard
          label="Monthly revenue"
          value={formatCurrency(totalRevenue)}
          helper="Ads and affiliate focus"
        />
        <MetricCard
          label="Avg CTR"
          value={`${averageCtr.toFixed(1)}%`}
          helper={`${totalWatchHours.toLocaleString()} watch hours`}
        />
      </section>

      <section className="two-column">
        <Panel title="Channel portfolio" subtitle="Prioritize channels by English audience and revenue fit">
          <div className="stack">
            {channels.map((channel) => (
              <article className="channel-card" key={channel.id}>
                <div>
                  <div className="row-between">
                    <h3>{channel.name}</h3>
                    <span className={`pill ${channel.status}`}>{channel.status}</span>
                  </div>
                  <p>{channel.niche}</p>
                </div>
                <dl className="mini-grid">
                  <div>
                    <dt>RPM</dt>
                    <dd>{formatCurrency(channel.rpmUsd)}</dd>
                  </div>
                  <div>
                    <dt>CTR</dt>
                    <dd>{channel.ctr}%</dd>
                  </div>
                  <div>
                    <dt>Avg view</dt>
                    <dd>{channel.averageViewDuration}</dd>
                  </div>
                </dl>
                <p className="next-step">{channel.nextMilestone}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel
          title="YouTube-first trend radar"
          subtitle={`Primary source: ${productStrategy.primaryTrendSource}. Other sources stay as secondary validation.`}
        >
          <div className="stack">
            {prioritizedTrendSignals.map((signal) => (
              <article className="trend-card" key={signal.id}>
                <div className="row-between">
                  <span className="source">{signal.source}</span>
                  <span className="momentum">{signal.momentum}/100</span>
                </div>
                <h3>{signal.topic}</h3>
                <p>{signal.suggestedAngle}</p>
                <div className="tag-row">
                  <span>{signal.competition} competition</span>
                  <span>{signal.audienceIntent} intent</span>
                  <span>{shouldEscalateTrend(signal) ? "premium review" : "cheap triage"}</span>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </section>

      <Panel
        title="Content production pipeline"
        subtitle="Each video keeps a monetization path, review status, and auto-scheduling rule"
      >
        <div className="plan-grid">
          {contentPlans.map((plan) => {
            const channel = channels.find((item) => item.id === plan.channelId);

            return (
              <article className="plan-card" key={plan.id}>
                <div className="row-between">
                  <span className={`stage ${plan.stage}`}>{plan.stage}</span>
                  <strong>{plan.confidence}% confidence</strong>
                </div>
                <h3>{plan.title}</h3>
                <p className="muted">{channel?.name ?? "Unassigned channel"}</p>
                <dl>
                  <div>
                    <dt>Approval</dt>
                    <dd>
                      <span className={`approval ${plan.approvalStatus}`}>
                        {plan.approvalStatus.replaceAll("_", " ")}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>Estimated views</dt>
                    <dd>{plan.estimatedViews}</dd>
                  </div>
                  <div>
                    <dt>Publish window</dt>
                    <dd>{plan.publishWindow}</dd>
                  </div>
                  <div>
                    <dt>Monetization</dt>
                    <dd>{plan.monetizationPath}</dd>
                  </div>
                  <div>
                    <dt>Scheduling rule</dt>
                    <dd>
                      {plan.autoScheduleAfterApproval
                        ? "Auto-schedule after approval"
                        : "Manual scheduling"}
                    </dd>
                  </div>
                </dl>
                <ul>
                  {plan.requiredChecks.map((check) => (
                    <li key={check}>{check}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </Panel>

      <section className="two-column">
        <Panel title="Token cost controls" subtitle={defaultCostPolicy.goal}>
          <div className="cost-card">
            <div>
              <span>Monthly budget</span>
              <strong>{formatCurrency(defaultCostPolicy.monthlyTokenBudgetUsd)}</strong>
            </div>
            <div>
              <span>Estimated plan spend</span>
              <strong>{formatCurrency(tokenSpend.estimatedUsd)}</strong>
            </div>
          </div>
          <ul className="check-list">
            <li>Default to the {defaultCostPolicy.defaultModelTier} model tier for summaries and triage.</li>
            <li>{defaultCostPolicy.escalationRule}</li>
            <li>{defaultCostPolicy.cacheStrategy}</li>
          </ul>
        </Panel>

        <Panel title="Integrity and safety checks" subtitle={productStrategy.approvalRule}>
          <div className="stack">
            {safetyChecks.map((check) => (
              <article className="safety-row" key={check.area}>
                <span className={`status-dot ${check.status}`} aria-hidden="true" />
                <div>
                  <h3>{check.area}</h3>
                  <p>{check.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: Readonly<{
  label: string;
  value: string;
  helper: string;
}>) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{helper}</p>
    </article>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: Readonly<{
  title: string;
  subtitle: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {children}
    </section>
  );
}
