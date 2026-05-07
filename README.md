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
- Cross-platform trend radar with momentum, competition, and audience intent.
- Content production pipeline with publish windows and monetization paths.
- Token budget panel that favors cheap-model triage and cached summaries.
- Safety checklist for YouTube policy, secrets, cost guardrails, and code integrity.
- `/api/health` endpoint for a basic application readiness check.

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

## Architecture notes

- `app/` contains the dashboard and API route.
- `lib/` contains typed domain models, mocked data, cost controls, and release checks.
- `docs/architecture.md` describes the future production boundaries.
- `docs/token-cost-policy.md` describes the model-spend and prompt-safety strategy.

## Open product decisions

Before integrating real APIs, confirm:

1. Which niches and languages the channels should target.
2. Which trend sources should be prioritized first.
3. Whether publishing should remain manual approval or become scheduled automation.
4. Which monetization paths matter most: ads, affiliate, sponsorship, products, or memberships.
