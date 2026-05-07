# YouTube Channel Manager

An AI-powered full-stack tool to build, analyze, and monetize YouTube channels. Integrates YouTube Data API, Google Trends, Reddit, and OpenAI to automate research, content creation, and analytics — all in one dark-mode dashboard.

---

## Features

| Feature | Description |
|---|---|
| **Channel Management** | Add and sync multiple channels (own + competitors) |
| **Trend Analysis** | Real-time trends from YouTube, Google, Reddit |
| **AI Content Generator** | Titles, outlines, scripts, tags, SEO descriptions |
| **Content Pipeline** | Kanban-style idea tracker (idea → scripted → filmed → published) |
| **Channel Analytics** | Views, engagement, top videos, revenue estimates |
| **AI Strategy Advisor** | GPT-powered channel strategy recommendations |
| **Token Cost Control** | Prompt caching, daily budget limits, usage dashboard |
| **Security** | Input sanitization, masked keys, rate limiting, no hardcoded secrets |

---

## Architecture

```
youtube-channel-manager/
├── backend/                 # Python FastAPI + SQLite
│   ├── app/
│   │   ├── main.py          # App entry, CORS, rate limiting
│   │   ├── config.py        # Pydantic settings (reads .env)
│   │   ├── database.py      # SQLAlchemy + SQLite (WAL mode)
│   │   ├── models/          # Channel, Video, Trend, AICache, TokenUsage, ContentIdea
│   │   ├── routers/         # /channels  /trends  /content  /analytics  /settings
│   │   ├── services/        # youtube_service, trend_service, ai_service
│   │   └── utils/           # security (sanitize, mask, validate)
│   ├── requirements.txt
│   └── .env.example
└── frontend/                # React + Vite + TailwindCSS
    └── src/
        ├── pages/           # Dashboard, Trends, Content, Analytics, Settings
        ├── components/      # Layout, StatCard, AddChannelModal, Badge, ...
        └── lib/             # api.ts (axios client), format.ts
```

---

## Quick Start

### 1. Clone and configure

```bash
git clone <repo-url>
cd youtube-channel-manager

# Backend config
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys
```

### 2. Start the backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## API Keys Required

| Service | Where to get | Required |
|---|---|---|
| **YouTube Data API v3** | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) | Yes (for channel data) |
| **OpenAI API** | [OpenAI Platform](https://platform.openai.com/api-keys) | Yes (for AI features) |
| **Reddit API** | [Reddit App Prefs](https://www.reddit.com/prefs/apps) | Optional |

Set them in `backend/.env`:

```env
YOUTUBE_API_KEY=AIza...
OPENAI_API_KEY=sk-...
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
```

---

## Token Cost Optimization

This tool uses several strategies to minimize OpenAI API costs:

1. **DB-level caching** — Every AI prompt is hashed (SHA-256) and the response cached in SQLite for 1 hour (configurable via `AI_CACHE_TTL`). Identical prompts are never sent twice.
2. **Model tiering** — Simple tasks (titles, tags) use `gpt-4o-mini` (~15x cheaper). Complex tasks (full scripts, strategy analysis) use `gpt-4o`.
3. **Daily budget** — Set `OPENAI_DAILY_TOKEN_BUDGET=50000` to hard-stop AI calls once the limit is hit.
4. **Usage dashboard** — The Analytics page shows token spend by day, by task type, and estimates money saved via cache hits.

Typical cost for normal usage: **< $0.10/day**.

---

## Security

- All API keys are read from environment variables, never hardcoded
- Keys shown in the Settings UI are masked (`sk-...xyz123`)
- All user text inputs are HTML-escaped and length-limited before storage
- YouTube channel IDs are validated by regex before any API call
- Rate limiting: 60 req/min per IP (configurable via `RATE_LIMIT_PER_MINUTE`)
- CORS restricted to configured origins only
- `/docs` endpoint disabled in `APP_ENV=production`
- Production startup aborts if using the default `APP_SECRET_KEY`

---

## API Reference

Interactive docs at `http://localhost:8000/docs` (development only).

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/channels/` | GET, POST | List / add channels |
| `/api/v1/channels/{id}/sync` | POST | Refresh stats from YouTube |
| `/api/v1/channels/{id}/sync-videos` | POST | Fetch latest videos |
| `/api/v1/trends/refresh` | POST | Pull fresh trends (all sources) |
| `/api/v1/trends/` | GET | List cached trends |
| `/api/v1/content/generate/titles` | POST | AI: generate video titles |
| `/api/v1/content/generate/outline` | POST | AI: generate script outline |
| `/api/v1/content/generate/script` | POST | AI: generate full script |
| `/api/v1/content/generate/tags` | POST | AI: generate SEO tags |
| `/api/v1/content/generate/trend-ideas` | POST | AI: ideas from current trends |
| `/api/v1/content/ideas` | GET, POST | Content idea CRUD |
| `/api/v1/analytics/dashboard` | GET | Overview metrics |
| `/api/v1/analytics/channels/{id}/performance` | GET | Channel video stats |
| `/api/v1/analytics/channels/{id}/ai-strategy` | GET | AI strategy analysis |
| `/api/v1/analytics/tokens` | GET | Token usage & cost report |
| `/api/v1/settings/status` | GET | API key config status |
| `/api/v1/settings/validate/youtube` | POST | Test YouTube API key |
| `/api/v1/settings/validate/openai` | POST | Test OpenAI API key |

---

## Environment Variables

See `backend/.env.example` for the full list. Key variables:

| Variable | Default | Description |
|---|---|---|
| `APP_ENV` | `development` | `development` or `production` |
| `DATABASE_URL` | `sqlite:///./data/yt_manager.db` | SQLite DB path |
| `OPENAI_DAILY_TOKEN_BUDGET` | `100000` | Token limit per day (0 = unlimited) |
| `AI_CACHE_TTL` | `3600` | AI response cache lifetime (seconds) |
| `TREND_CACHE_TTL` | `1800` | Trend data cache lifetime (seconds) |
| `RATE_LIMIT_PER_MINUTE` | `60` | API rate limit per IP |
