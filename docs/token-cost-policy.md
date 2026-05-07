# Token cost policy

The product should reduce model spend by making expensive analysis conditional instead of automatic.

## Default workflow

1. **Ingest raw signals**
   - Pull topic candidates from YouTube first.
   - Store raw payload hashes and timestamps.
   - Do not send unchanged payloads back to model providers.

2. **Cheap triage**
   - Use a low-cost model or deterministic scoring for summaries.
   - Score each trend by YouTube momentum, competition, audience intent, ad fit, affiliate fit, and channel fit.

3. **Premium escalation**
   - Escalate only when:
     - momentum is above threshold,
     - competition is not high,
     - the topic matches at least one channel strategy,
     - and source evidence is available.

4. **Human approval**
   - Require review before scripts, claims, publishing, and monetization disclosures.
   - Auto-schedule only after the approval status is recorded.

## Caching rules

- Raw trend payloads: 6 hours.
- Normalized trend summaries: 24 hours.
- Content briefs: cache by topic fingerprint until inputs change.
- Analytics snapshots: keep historical records and diff only new metrics.
- YouTube API quota usage: record per job so repeated trend refreshes can be skipped.

## Safety rules

- Never include API keys, OAuth refresh tokens, private analytics exports, or user credentials in prompts.
- Strip personally identifiable information from competitor examples.
- Prefer structured inputs over copied web pages to reduce prompt size and leakage.
- Keep a prompt and response audit log with redaction for generated publishing decisions.
