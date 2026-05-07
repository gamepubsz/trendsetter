import {
  channels,
  contentPlans,
  safetyChecks,
  trendSignals,
} from "@/lib/mock-data";
import {
  defaultCostPolicy,
  estimateTokenSpend,
  shouldEscalateTrend,
} from "@/lib/cost-controls";
import { getReleaseReadiness } from "@/lib/security-checks";

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

export default function Home() {
  return (
    <main className="dashboard-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Trendsetter MVP</p>
          <h1>YouTube 频道增长与变现控制台</h1>
          <p className="hero-copy">
            用一个 dashboard 管理多个频道：从跨平台趋势调查、选题创作、运营排期到广告和联盟收入分析，
            同时内置 token 成本控制与发布前安全检查。
          </p>
        </div>
        <div className="hero-card">
          <span>Release readiness</span>
          <strong>{releaseReadiness.canRelease ? "Ready with review" : "Blocked"}</strong>
          <p>
            {releaseReadiness.needsReviewCount} 项需要人工复核，
            {releaseReadiness.blockedCount} 项阻塞。
          </p>
        </div>
      </section>

      <section className="metric-grid" aria-label="channel portfolio metrics">
        <MetricCard label="Managed channels" value={channels.length.toString()} helper="支持多频道组合" />
        <MetricCard label="Subscribers" value={totalSubscribers.toLocaleString()} helper="跨频道累计订阅" />
        <MetricCard label="Monthly revenue" value={formatCurrency(totalRevenue)} helper="广告与实验性变现" />
        <MetricCard label="Avg CTR" value={`${averageCtr.toFixed(1)}%`} helper={`${totalWatchHours.toLocaleString()} watch hours`} />
      </section>

      <section className="two-column">
        <Panel title="频道组合" subtitle="快速判断哪个频道应该获得更多创作资源">
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

        <Panel title="跨平台趋势雷达" subtitle="先筛选信号，再决定是否消耗高级模型 token">
          <div className="stack">
            {trendSignals.map((signal) => (
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

      <Panel title="内容生产管线" subtitle="每个视频都带有变现路径、发布时间窗和发布前检查">
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
        <Panel title="Token 成本控制" subtitle={defaultCostPolicy.goal}>
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
            <li>默认使用 {defaultCostPolicy.defaultModelTier} 模型做趋势摘要和初筛。</li>
            <li>{defaultCostPolicy.escalationRule}</li>
            <li>{defaultCostPolicy.cacheStrategy}</li>
          </ul>
        </Panel>

        <Panel title="完整性与安全检查" subtitle="降低账号、密钥、合规和代码质量风险">
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
