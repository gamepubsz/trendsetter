# Trendsetter MVP Architecture

## Goal
Build a practical control center for one or more YouTube channels:
- trend research across social media
- content planning
- operations and monetization diagnostics
- token cost control and code/security checks

## Components

1. **Trend Engine**
   - Collects mock trend signals from YouTube, TikTok, X, Reddit, and Google Trends adapters.
   - Aggregates by topic and computes weighted interest + momentum + cross-platform coverage.
   - Caches the output with TTL to reduce repeated inference/data pulls.

2. **Content Copilot**
   - Converts trend insights into title options, script outline, and publishing suggestion.
   - Uses a token budget manager for request-level and daily guardrails.
   - Uses cached plans for repeated combinations of channel/topic/objective.

3. **Analytics Engine**
   - Scores channel health and monetization potential.
   - Emits prioritized next actions and risk flags.

4. **Security Guard**
   - Basic secret pattern scanning.
   - Checks project completeness via required-file audit.
   - Flags unpinned dependencies in requirements.

5. **Interfaces**
   - FastAPI backend (`app/main.py`) for API consumers.
   - Streamlit dashboard (`streamlit_app.py`) for operations view.

## Token Minimization Strategy
- Cache expensive outputs (trend analysis, content plans).
- Use model tiers (`small` default, `large` only when needed).
- Estimate tokens before generation and enforce caps.
- Keep prompts compact and structured.

## Production Next Steps
- Replace mock trend adapters with official APIs and legal-compliant scraping.
- Add OAuth2 + RBAC for multi-user support.
- Add queue workers for scheduled trend pulls and report generation.
- Add end-to-end tests and CI security scans (Bandit, pip-audit, Semgrep).
