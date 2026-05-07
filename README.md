# Trendsetter

Trendsetter is a YouTube channel growth and monetization dashboard MVP.

It helps creators manage one or more channels across:

- trend research from multiple social platforms,
- topic and content planning,
- channel operations,
- monetization analysis,
- token cost control,
- and release safety checks.

## MVP features

- Portfolio dashboard for multiple YouTube channels.
- English-first content strategy for titles, scripts, descriptions, and audience research.
- YouTube-first trend radar with momentum, competition, and audience intent.
- Content production pipeline with publish windows, review status, and auto-scheduling after approval.
- Token budget panel that favors cheap-model triage and cached summaries.
- Monetization focus on ads first and affiliate offers second.
- Safety checklist for YouTube policy, secrets, cost guardrails, and code integrity.
- `/api/health` endpoint for a basic application readiness check.
- `/api/youtube/trends` endpoint for the first mocked YouTube trend integration boundary.

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` to view the dashboard.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
npm audit
```

## Configuration

Copy `.env.example` to `.env.local` before connecting real providers.

Real publishing automation should stay behind human approval until OAuth, audit logging,
YouTube policy checks, and monetization disclosures are fully implemented.

Current product defaults:

- Primary content language: English.
- First trend source to integrate: YouTube.
- Publishing mode: generate drafts, require human approval, then auto-schedule.
- Monetization priority: ads, then affiliate.

## Architecture notes

- `app/` contains the dashboard and API route.
- `lib/` contains typed domain models, mocked data, cost controls, and release checks.
- `docs/architecture.md` describes the future production boundaries.
- `docs/token-cost-policy.md` describes the model-spend and prompt-safety strategy.

## Open product decisions

Before integrating real APIs, confirm:

1. Which English niches should be launched first.
2. Which YouTube API data should drive the first trend score.
3. Which affiliate categories are allowed or blocked.
4. What approval roles and audit-log retention are required before real auto-scheduling.
