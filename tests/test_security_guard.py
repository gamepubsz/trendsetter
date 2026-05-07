from pathlib import Path

from app.services.security_guard import SecurityGuard


def test_security_guard_flags_unpinned_dependencies(tmp_path: Path) -> None:
    req = tmp_path / "requirements.txt"
    req.write_text("fastapi\npytest==9.0.3\n")
    guard = SecurityGuard(workspace_path=tmp_path)

    alerts = guard.dependency_alerts()

    assert "Unpinned dependency: fastapi" in alerts


def test_security_guard_masks_secret_values() -> None:
    guard = SecurityGuard(workspace_path=Path("."))
    findings = guard.scan_text("token=sk-12345678901234567890ABCDEFG")
    assert findings
    assert findings[0].endswith("***")
