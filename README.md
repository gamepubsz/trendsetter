# trendsetter

Trend-aware operating system for creating, researching, operating, and optimizing one or more YouTube channels with a focus on monetization readiness.

## What this MVP scaffold includes

- **Dashboard UI** built with Next.js App Router
- **Multi-channel portfolio view** for comparing audience, views, and revenue
- **Cross-platform trend research view** seeded with signals from YouTube, X, Reddit, and Google Trends
- **Content planning endpoint** at `POST /api/ideas`
- **YouTube OAuth + live analytics integration routes** for connecting a real channel
- **Token budget policies** to keep LLM usage low by default
- **Security helpers** for secret redaction, scope checking, and environment validation
- **Prisma schema** for users, workspaces, channels, trend snapshots, content ideas, analytics, jobs, and OAuth tokens
- **CI pipeline** for lint, typecheck, tests, build, Prisma schema validation, and high-severity dependency audit

## Product direction

This repository is structured around five product loops:

1. **Research**: collect and score fresh social trend signals
2. **Create**: turn signals into channel-specific video opportunities
3. **Operate**: manage one or more channels from one dashboard
4. **Analyze**: compare view, revenue, and channel health snapshots
5. **Optimize**: recommend next actions with token-aware AI policies

## Stack

- **Frontend / API**: Next.js 16, React 19, TypeScript
- **Validation**: zod
- **Data model**: Prisma schema targeting PostgreSQL
- **Tests**: Vitest
- **CI**: GitHub Actions

## Getting started

1. Copy the example environment file:

   ```bash
   cp .env.example .env.local
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`

## YouTube integration setup

To connect a real YouTube channel, configure a Google Cloud OAuth client:

1. Create a Google Cloud project and enable:
   - **YouTube Data API v3**
   - **YouTube Analytics API**
2. Create an OAuth 2.0 Web Application credential.
3. Add this redirect URI in Google Cloud:

   ```text
   http://localhost:3000/api/auth/youtube/callback
   ```

4. Fill these values in `.env.local`:

   ```bash
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   YOUTUBE_OAUTH_REDIRECT_URI="http://localhost:3000/api/auth/youtube/callback"
   ENCRYPTION_KEY="a-32-character-or-longer-random-secret"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

5. Open `/settings` and click **Connect YouTube**

### Current OAuth behavior

- requests `youtube.readonly` and `yt-analytics.readonly`
- stores the returned OAuth session in an **encrypted httpOnly cookie**
- fetches channel identity plus a rolling **28-day analytics summary**

This is a practical development scaffold. For production, move refresh tokens from cookies into your database and rotate encryption keys through your secret manager.

## Available scripts

- `npm run dev` - start the local app
- `npm run build` - production build
- `npm run lint` - run ESLint
- `npm run typecheck` - run TypeScript checks
- `npm run test` - run Vitest
- `npm run prisma:validate` - validate Prisma schema with a placeholder local URL
- `npm run verify` - run lint + typecheck + test + build

## Low-token architecture principles

To keep inference cost under control:

- prefer **structured trend collectors** over raw transcript dumps
- summarize platform-specific data **before** cross-platform synthesis
- use **small model tiers** for research and optimization loops
- reserve **premium runs** for high-confidence scripting only
- cache trend summaries and planning results per channel and focus area

See `lib/domain/token-budget.ts` for the current policy logic.

## Security and integrity checklist

- secret redaction helpers in `lib/security.ts`
- critical env validation in `lib/env.ts`
- least-privilege OAuth scope validation helpers
- CI gates for lint, tests, type safety, build, and dependency audit

## Key files

- `app/` - Next.js pages and API routes
- `components/` - reusable dashboard UI components
- `lib/domain/` - recommendation, planning, and token-budget logic
- `lib/youtube/` - OAuth, encrypted session, and YouTube API integration
- `prisma/schema.prisma` - initial data model
- `tests/` - focused unit tests for token and security logic

## Suggested next implementation steps

1. Persist encrypted refresh tokens and channel metadata in PostgreSQL
2. Replace seed data with scheduled collectors and a queue-backed worker
3. Add authentication and workspace permissions
4. Introduce competitor benchmarking and creator revenue forecasting
5. Add upload planning, thumbnail briefs, and publishing workflows
