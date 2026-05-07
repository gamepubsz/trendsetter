# Trendsetter

Trendsetter is an MVP toolkit for building and monetizing one or more YouTube channels with an AI-assisted workflow:

- cross-platform trend research
- AI content planning
- channel operations diagnostics
- monetization improvement suggestions
- token budget controls
- basic code completeness and security audit checks

## Quick start

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
```

## Run API server

```bash
uvicorn app.main:app --reload --port 8000
```

Useful endpoints:

- `GET /health`
- `POST /trends/analyze`
- `POST /content/plan`
- `POST /analytics/diagnose`
- `GET /security/audit`
- `GET /dashboard/summary`

## Run dashboard

```bash
streamlit run streamlit_app.py
```

## Run tests

```bash
pytest -q
```

## Architecture

See `docs/architecture.md`.
