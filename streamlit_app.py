import streamlit as st

from app.config import get_settings
from datetime import datetime, timedelta

from app.models import AnalyticsSnapshot, ChannelProfile, PublicationRequest
from app.services.analytics_engine import AnalyticsEngine
from app.services.content_copilot import ContentCopilot
from app.services.publishing_scheduler import PublishingScheduler
from app.services.token_budget import TokenBudgetManager
from app.services.trend_engine import TrendEngine

settings = get_settings()
trend_engine = TrendEngine(cache_ttl_seconds=settings.cache_ttl_seconds)
token_manager = TokenBudgetManager(
    daily_budget=settings.daily_token_budget,
    per_request_cap=settings.per_request_token_cap,
)
content_copilot = ContentCopilot(token_manager=token_manager, cache_ttl_seconds=settings.cache_ttl_seconds)
analytics_engine = AnalyticsEngine()
publishing_scheduler = PublishingScheduler()

st.set_page_config(page_title="Trendsetter Dashboard", layout="wide")
st.title("Trendsetter: YouTube Channel Copilot")
st.caption("Create, research, operate, and optimize one or more channels with lower token cost.")

tab_trends, tab_content, tab_ops, tab_publish = st.tabs(
    ["Trend Radar", "Content Copilot", "Analytics & Monetization", "Publishing"]
)

with tab_trends:
    st.subheader("YouTube-first trend radar")
    platforms = st.multiselect("Data sources", options=["youtube"], default=["youtube"])
    limit = st.slider("Signals per platform", min_value=1, max_value=5, value=3)
    if st.button("Analyze trends"):
        insights = trend_engine.analyze(platforms=platforms, limit_per_platform=limit)
        st.success(f"Found {len(insights)} candidate topics")
        for row in insights[:8]:
            st.markdown(
                f"- **{row.topic}** | score: `{row.aggregate_score}` | momentum: `{row.momentum_score}` | coverage: `{row.platform_coverage}`"
            )

with tab_content:
    st.subheader("AI content planner with token budget controls")
    channel = ChannelProfile(
        channel_id="demo-001",
        name=st.text_input("Channel name", value="My Growth Lab"),
        niche=st.text_input("Niche", value="AI productivity"),
        language=st.selectbox("Language", options=["en-US", "zh-CN", "bilingual"], index=0),
        target_market=st.text_input("Target market", value="global"),
    )
    objective = st.text_input("Objective", value="Increase watch time and ad revenue")
    monetization_priorities = st.multiselect(
        "Monetization priorities",
        options=["ads", "affiliate", "sponsorship", "digital_products"],
        default=["ads", "affiliate"],
    )
    tier = st.selectbox("Model tier", options=["small", "large"], index=0)
    content_trends = trend_engine.analyze(["youtube"], 3)
    selected_topic = st.selectbox("Topic", options=[item.topic for item in content_trends])
    selected_trend = next(item for item in content_trends if item.topic == selected_topic)
    if st.button("Generate content plan"):
        plan = content_copilot.generate_plan(
            channel=channel,
            trend=selected_trend,
            objective=objective,
            preferred_model_tier=tier,
            monetization_priorities=monetization_priorities,
        )
        st.write("### Title options")
        for title in plan.title_options:
            st.write(f"- {title}")
        st.write("### Script outline")
        for idx, step in enumerate(plan.script_outline, start=1):
            st.write(f"{idx}. {step}")
        st.write("### Monetization hooks")
        for hook in plan.monetization_hooks:
            st.write(f"- {hook}")
        st.info(f"Estimated token usage: {plan.token_usage_estimate} | Remaining today: {token_manager.remaining_today}")

with tab_ops:
    st.subheader("Channel diagnostics and monetization actions")
    snapshot = AnalyticsSnapshot(
        channel_id="demo-001",
        views=st.number_input("Views", min_value=0, value=22000),
        watch_time_hours=st.number_input("Watch time hours", min_value=0.0, value=180.0),
        ctr=st.number_input("CTR (%)", min_value=0.0, max_value=100.0, value=4.1),
        avg_view_duration_sec=st.number_input("Average view duration (sec)", min_value=0.0, value=95.0),
        subscribers_gained=st.number_input("Subscribers gained", value=120),
        revenue_usd=st.number_input("Revenue (USD)", min_value=0.0, value=86.0),
        rpm=st.number_input("RPM", min_value=0.0, value=1.8),
        upload_frequency_per_week=st.number_input("Uploads per week", min_value=0.0, value=1.0),
    )
    trend_alignment_score = st.slider("Trend alignment score", min_value=0, max_value=100, value=55)
    ops_monetization_priorities = st.multiselect(
        "Monetization strategy",
        options=["ads", "affiliate", "sponsorship", "digital_products"],
        default=["ads", "affiliate"],
        key="ops_monetization",
    )
    if st.button("Run diagnosis"):
        diagnosis = analytics_engine.diagnose(
            snapshot,
            trend_alignment_score,
            monetization_priorities=ops_monetization_priorities,
        )
        c1, c2 = st.columns(2)
        c1.metric("Channel health score", diagnosis.health_score)
        c2.metric("Monetization score", diagnosis.monetization_score)
        st.write(f"Monetization priorities: {', '.join(diagnosis.monetization_priorities)}")
        st.write("### Priority actions")
        for action in diagnosis.priority_actions:
            st.write(f"- {action}")
        if diagnosis.risks:
            st.write("### Risks")
            for risk in diagnosis.risks:
                st.write(f"- {risk}")

with tab_publish:
    st.subheader("Review-gated auto scheduling")
    video_title = st.text_input("Video title", value="My next growth-focused upload")
    planned_date = st.date_input("Planned publish date", value=datetime.utcnow().date() + timedelta(days=1))
    planned_time = st.time_input("Planned publish time (UTC)", value=datetime.utcnow().time())
    review_approved = st.checkbox("Review approved", value=False)

    if st.button("Create publishing job"):
        planned_datetime = datetime.combine(planned_date, planned_time)
        request = PublicationRequest(
            channel_id="demo-001",
            video_title=video_title,
            planned_publish_at=planned_datetime,
            review_approved=review_approved,
        )
        job = publishing_scheduler.create_or_schedule(request)
        if job.automation_status == "scheduled":
            st.success("Approved and auto-scheduled.")
        else:
            st.warning("Waiting review approval before auto-scheduling.")
        st.write(job.model_dump())

    st.write("### Current jobs")
    for job in publishing_scheduler.list_schedules("demo-001"):
        st.write(
            f"- {job.video_title} | {job.planned_publish_at.isoformat()} | review={job.review_status} | status={job.automation_status}"
        )
