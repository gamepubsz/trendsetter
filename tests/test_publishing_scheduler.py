from datetime import datetime, timezone

from app.models import PublicationRequest
from app.services.publishing_scheduler import PublishingScheduler


def test_review_gate_before_auto_schedule() -> None:
    scheduler = PublishingScheduler()
    request = PublicationRequest(
        channel_id="c1",
        video_title="Growth test",
        planned_publish_at=datetime.now(timezone.utc),
        review_approved=False,
    )

    pending = scheduler.create_or_schedule(request)

    assert pending.review_status == "pending"
    assert pending.automation_status == "waiting_review"

    approved = scheduler.approve_and_schedule(pending.schedule_id)
    assert approved.review_status == "approved"
    assert approved.automation_status == "scheduled"
