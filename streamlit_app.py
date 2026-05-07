import streamlit as st

from app.config import get_settings
from app.models import AnalyticsSnapshot, ChannelProfile
from app.services.analytics_engine import AnalyticsEngine
from app.services.content_copilot import ContentCopilot
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

st.set_page_config(page_title="Trendsetter Dashboard", layout="wide")
st.title("Trendsetter: YouTube Channel Copilot")
st.caption("Create, research, operate, and optimize one or more channels with lower token cost.")

tab_trends, tab_content, tab_ops = st.tabs(["Trend Radar", "Content Copilot", "Analytics & Monetization"])

with tab_trends:
    st.subheader("Cross-platform trend radar")
    platforms = st.multiselect(
        "Data sources",
        options=["youtube", "tiktok", "x", "reddit", "google_trends"],
        default=["youtube", "tiktok", "google_trends"],
    )
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
        language=st.selectbox("Language", options=["zh-CN", "en-US", "bilingual"]),
        target_market=st.text_input("Target market", value="global"),
    )
    objective = st.text_input("Objective", value="Increase watch time and ad revenue")
    tier = st.selectbox("Model tier", options=["small", "large"], index=0)
    content_trends = trend_engine.analyze(["youtube", "tiktok", "x"], 3)
    selected_topic = st.selectbox("Topic", options=[item.topic for item in content_trends])
    selected_trend = next(item for item in content_trends if item.topic == selected_topic)
    if st.button("Generate content plan"):
        plan = content_copilot.generate_plan(channel=channel, trend=selected_trend, objective=objective, preferred_model_tier=tier)
        st.write("### Title options")
        for title in plan.title_options:
            st.write(f"- {title}")
        st.write("### Script outline")
        for idx, step in enumerate(plan.script_outline, start=1):
            st.write(f"{idx}. {step}")
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
    if st.button("Run diagnosis"):
        diagnosis = analytics_engine.diagnose(snapshot, trend_alignment_score)
        c1, c2 = st.columns(2)
        c1.metric("Channel health score", diagnosis.health_score)
        c2.metric("Monetization score", diagnosis.monetization_score)
        st.write("### Priority actions")
        for action in diagnosis.priority_actions:
            st.write(f"- {action}")
        if diagnosis.risks:
            st.write("### Risks")
            for risk in diagnosis.risks:
                st.write(f"- {risk}")
