# Trendsetter MVP architecture

Trendsetter is designed as a YouTube channel growth and monetization operating system.
The first MVP is a Next.js dashboard with mocked data and explicit boundaries for future integrations.

## Product modules

1. **Channel portfolio**
   - Tracks one or many YouTube channels.
   - Compares subscribers, CTR, watch hours, RPM, and monthly revenue.
   - Helps decide where to allocate creative effort.

2. **Trend radar**
   - Normalizes signals from YouTube, TikTok, Reddit, Google Trends, and X.
   - Scores topic momentum, competition, and audience intent.
   - Escalates only the strongest opportunities to expensive model analysis.

3. **Content pipeline**
   - Turns validated trends into titles, briefs, scripts, thumbnails, and publish windows.
   - Keeps every asset attached to a monetization path such as ads, affiliate, sponsorship, or lead capture.
   - Requires checks for source quality, claims, disclosures, and thumbnail readability.

4. **Cost controls**
   - Uses cheap models for triage and summarization.
   - Uses premium models only when a trend passes momentum, competition, and channel-fit thresholds.
   - Caches raw social signals, summaries, and generated briefs by topic fingerprint.

5. **Safety and integrity**
   - Keeps API keys and OAuth refresh tokens out of source control.
   - Requires human approval before publishing or making monetization claims.
   - Runs lint, typecheck, build, dependency audit, and health checks before release.

## Suggested future service boundaries

```text
app/
  dashboard and API routes
lib/
  typed domain models, scoring policies, and mocked adapters
workers/
  future scheduled jobs for trend ingestion, brief generation, and analytics sync
```

When the MVP moves beyond mocked data, add durable storage before automation:

- **Postgres** for channels, trend snapshots, content plans, approvals, and audit logs.
- **Redis or queue service** for scheduled ingestion and generation jobs.
- **Secrets manager** for OAuth refresh tokens and model provider keys.

## Release checklist

Run these before merging or deploying:

```bash
npm run lint
npm run typecheck
npm run build
npm audit
```

The dashboard also exposes `/api/health` for a basic module and readiness check.
