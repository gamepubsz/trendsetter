# Trendsetter

Local-first workspace to grow **English-first** YouTube channels with a **bilingual (EN/ZH) dashboard**, a **Python API** for OAuth and data, **Reddit trends** via the official API, and room for an **auto-edit** pipeline later.

## Layout

| Path | Role |
|------|------|
| `web/` | Next.js 16 dashboard (`next-intl` for `/en` and `/zh`) |
| `backend/` | FastAPI service: health, YouTube OAuth, channels, metadata patch, Reddit trends |
| `backend/data/` | SQLite file (created at runtime; **gitignored**) |

## Quick start (two terminals)

1. **Environment**

   ```bash
   cp .env.example .env
   # Required for YouTube: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (Web OAuth client).
   # Optional for trends: REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET / REDDIT_USER_AGENT.
   ```

   Optional: `web/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8000`.

2. **Google Cloud / YouTube API**

   - Create a project, enable **YouTube Data API v3**.
   - OAuth consent screen: **External**, add yourself as a **Test user** while in testing.
   - Add the scopes that match `YOUTUBE_SCOPES` in `.env` (defaults include **readonly**, **upload**, and **force-ssl** for snippet updates).
   - Credentials → **OAuth client ID** → type **Web application**.
   - Authorized redirect URI (must match `.env`):

     `http://localhost:8000/v1/auth/youtube/callback`

3. **Reddit (optional)**

   - Create a Reddit app (script/installed) to obtain **client id** and **secret**.
   - Set `REDDIT_USER_AGENT` to a descriptive string (include a Reddit username you control).
   - The API uses **application-only** OAuth (`client_credentials`) and reads **public** hot listings (default subreddit `videos`, configurable).

4. **Backend** (from repo root; uses `sqlite` under `backend/data/` by default)

   ```bash
   cd backend
   python3 -m pip install -r requirements.txt
   PYTHONPATH=. uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Frontend**

   ```bash
   cd web
   npm install
   npm run dev
   ```

   Open `http://localhost:3000` → redirects to `/en/dashboard`.

## OAuth locale

`/v1/auth/youtube/start` accepts `locale=en|zh` (the dashboard appends it automatically). After Google redirects back, you land on `/{locale}/dashboard?youtube=…` in the same language you started from.

## Security notes

- Never commit `.env` or `backend/data/`.
- Refresh tokens are stored in **local SQLite**; treat the DB file like a secret on your machine.
- API logs intentionally avoid printing tokens or authorization codes.
- Broader YouTube scopes require matching entries on the **OAuth consent screen**; Google may require **verification** if you leave testing mode.

## API

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Liveness |
| `GET` | `/v1/auth/youtube/start` | Begin Google OAuth (`locale` query optional) |
| `GET` | `/v1/auth/youtube/callback` | OAuth redirect target |
| `GET` | `/v1/youtube/status` | `{ connected, scopes[] }` |
| `GET` | `/v1/youtube/channels` | `{ channels: [{ id, title }] }` |
| `PATCH` | `/v1/youtube/videos/{video_id}` | JSON body: optional `title`, `description`, `tags` (requires `youtube.force-ssl` or full `youtube` scope) |
| `GET` | `/v1/trends/reddit` | Reddit hot listing (`subreddit`, `limit`); returns `{ configured, items[] }` when Reddit env is unset |

Example metadata update:

```bash
curl -X PATCH "http://localhost:8000/v1/youtube/videos/VIDEO_ID" \
  -H "Content-Type: application/json" \
  -d '{"title":"New title","description":"…","tags":["tag1","tag2"]}'
```

## Roadmap (same repo)

- More compliant trend sources (official APIs / RSS where allowed).
- Whisper + FFmpeg auto-cut + export to editor-friendly formats.

## Scripts

- `web`: `npm run dev`, `npm run build`, `npm run lint`
- `backend`: `PYTHONPATH=. uvicorn app.main:app --reload --port 8000`
