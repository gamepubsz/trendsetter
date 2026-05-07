from __future__ import annotations

from uuid import uuid4

from app.models import PublicationRequest, ScheduledPublication


class PublishingScheduler:
    def __init__(self) -> None:
        self._jobs: dict[str, ScheduledPublication] = {}

    def create_or_schedule(self, request: PublicationRequest) -> ScheduledPublication:
        schedule = ScheduledPublication(
            schedule_id=str(uuid4()),
            channel_id=request.channel_id,
            video_title=request.video_title,
            planned_publish_at=request.planned_publish_at,
            review_status="approved" if request.review_approved else "pending",
            automation_status="scheduled" if request.review_approved else "waiting_review",
        )
        self._jobs[schedule.schedule_id] = schedule
        return schedule

    def approve_and_schedule(self, schedule_id: str) -> ScheduledPublication:
        existing = self._jobs[schedule_id]
        scheduled = existing.model_copy(update={"review_status": "approved", "automation_status": "scheduled"})
        self._jobs[schedule_id] = scheduled
        return scheduled

    def list_schedules(self, channel_id: str | None = None) -> list[ScheduledPublication]:
        values = list(self._jobs.values())
        if channel_id is None:
            return values
        return [item for item in values if item.channel_id == channel_id]
