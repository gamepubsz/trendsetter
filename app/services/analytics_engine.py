from app.models import AnalyticsSnapshot, ChannelDiagnosis


class AnalyticsEngine:
    def diagnose(self, snapshot: AnalyticsSnapshot, trend_alignment_score: float) -> ChannelDiagnosis:
        health = self._health_score(snapshot=snapshot, trend_alignment_score=trend_alignment_score)
        monetization = self._monetization_score(snapshot=snapshot)

        actions: list[str] = []
        risks: list[str] = []

        if snapshot.ctr < 4.5:
            actions.append("Improve thumbnails and title contrast; run A/B test on top 3 uploads.")
        if snapshot.avg_view_duration_sec < 120:
            actions.append("Rewrite first 30 seconds with stronger pain-point hook.")
        if snapshot.upload_frequency_per_week < 1.5:
            actions.append("Stabilize cadence with a fixed weekly content calendar.")
        if snapshot.rpm < 2:
            actions.append("Add affiliate-integrated tutorial videos to lift RPM.")
        if trend_alignment_score < 60:
            actions.append("Increase trend overlap by covering topics with >=2 platform coverage.")

        if snapshot.revenue_usd < 100:
            risks.append("Revenue concentration risk: ad-only income is currently shallow.")
        if snapshot.subscribers_gained < 0:
            risks.append("Net subscriber loss indicates possible content-market mismatch.")
        if snapshot.watch_time_hours < 50:
            risks.append("Low watch-time velocity can delay recommendation expansion.")

        if not actions:
            actions.append("Maintain current strategy and expand to second channel variation.")

        return ChannelDiagnosis(
            channel_id=snapshot.channel_id,
            health_score=health,
            monetization_score=monetization,
            priority_actions=actions,
            risks=risks,
        )

    def _health_score(self, snapshot: AnalyticsSnapshot, trend_alignment_score: float) -> float:
        ctr_component = min(snapshot.ctr / 10, 1) * 25
        retention_component = min(snapshot.avg_view_duration_sec / 300, 1) * 30
        cadence_component = min(snapshot.upload_frequency_per_week / 4, 1) * 20
        trend_component = min(trend_alignment_score / 100, 1) * 25
        return round(ctr_component + retention_component + cadence_component + trend_component, 2)

    def _monetization_score(self, snapshot: AnalyticsSnapshot) -> float:
        rpm_component = min(snapshot.rpm / 8, 1) * 40
        revenue_component = min(snapshot.revenue_usd / 2000, 1) * 35
        watch_time_component = min(snapshot.watch_time_hours / 800, 1) * 25
        return round(rpm_component + revenue_component + watch_time_component, 2)
