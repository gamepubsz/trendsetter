# Trendsetter

Local-first workspace to grow **English-first** YouTube channels with a **bilingual (EN/ZH) dashboard**, a **Python API** for OAuth and data, and room for **trend ingestion** (official APIs + public metadata only) and an **auto-edit** pipeline later.

## Layout

| Path | Role |
|------|------|
| `web/` | Next.js 16 dashboard (`next-intl` for `/en` and `/zh`) |
| `backend/` | FastAPI service: health, YouTube OAuth (read-only), channel list |
| `backend/data/` | SQLite file (created at runtime; **gitignored**) |

## Quick start (two terminals)

1. **Environment**

   ```bash
   cp .env.example .env
   # Fill GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (Web OAuth client).
   ```

   Optional: `web/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:8000`.

2. **Google Cloud / YouTube API**

   - Create a project, enable **YouTube Data API v3**.
   - OAuth consent screen: **External**, add yourself as a **Test user** while in testing.
   - Credentials → **OAuth client ID** → type **Web application**.
   - Authorized redirect URI (must match `.env`):

     `http://localhost:8000/v1/auth/youtube/callback`

3. **Backend** (from repo root; uses `sqlite` under `backend/data/` by default)

   ```bash
   cd backend
   python3 -m pip install -r requirements.txt
   PYTHONPATH=. uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

4. **Frontend**

   ```bash
   cd web
   npm install
   npm run dev
   ```

   Open `http://localhost:3000` → redirects to `/en/dashboard`.

## Security notes

- Never commit `.env` or `backend/data/`.
- OAuth uses **read-only** scope `youtube.readonly` in this MVP.
- Refresh tokens are stored in **local SQLite**; treat the DB file like a secret on your machine.
- API logs intentionally avoid printing tokens or authorization codes.

## API (MVP)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Liveness |
| `GET` | `/v1/auth/youtube/start` | Begin Google OAuth |
| `GET` | `/v1/auth/youtube/callback` | OAuth redirect target |
| `GET` | `/v1/youtube/status` | `{ connected: boolean }` |
| `GET` | `/v1/youtube/channels` | `{ channels: [{ id, title }] }` |

## Roadmap (same repo)

- Trend modules using **only** official APIs or explicitly allowed public metadata; cache aggressively to save LLM tokens.
- Whisper + FFmpeg auto-cut + export to editor-friendly formats.

## Scripts

- `web`: `npm run dev`, `npm run build`, `npm run lint`
- `backend`: `PYTHONPATH=. uvicorn app.main:app --reload --port 8000`
