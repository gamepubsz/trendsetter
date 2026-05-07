from __future__ import annotations

import re
from pathlib import Path

from app.models import SecurityAuditReport


SECRET_PATTERNS = [
    re.compile(r"sk-[A-Za-z0-9]{20,}", re.IGNORECASE),
    re.compile(r"AIza[0-9A-Za-z\\-_]{30,}"),
    re.compile(r"ghp_[A-Za-z0-9]{20,}"),
]


class SecurityGuard:
    def __init__(self, workspace_path: Path) -> None:
        self.workspace_path = workspace_path

    def scan_text(self, text: str) -> list[str]:
        findings: list[str] = []
        for pattern in SECRET_PATTERNS:
            for match in pattern.findall(text):
                findings.append(match[:6] + "***")
        return findings

    def check_required_files(self, required_files: list[str]) -> list[str]:
        missing: list[str] = []
        for file_name in required_files:
            if not (self.workspace_path / file_name).exists():
                missing.append(file_name)
        return missing

    def dependency_alerts(self, requirements_file: str = "requirements.txt") -> list[str]:
        target = self.workspace_path / requirements_file
        if not target.exists():
            return ["requirements.txt not found"]
        lines = [line.strip() for line in target.read_text().splitlines() if line.strip()]
        alerts: list[str] = []
        for line in lines:
            if "==" not in line and not line.startswith("#"):
                alerts.append(f"Unpinned dependency: {line}")
        return alerts

    def run_audit(self) -> SecurityAuditReport:
        required_files = [
            "app/main.py",
            "app/services/trend_engine.py",
            "app/services/content_copilot.py",
            "app/services/analytics_engine.py",
            "app/services/publishing_scheduler.py",
            "streamlit_app.py",
            "requirements.txt",
        ]
        missing = self.check_required_files(required_files)
        requirements_content = ""
        req_path = self.workspace_path / "requirements.txt"
        if req_path.exists():
            requirements_content = req_path.read_text()

        return SecurityAuditReport(
            missing_required_files=missing,
            leaked_secrets=self.scan_text(requirements_content),
            dependency_alerts=self.dependency_alerts(),
            request_hardening_enabled=True,
        )
