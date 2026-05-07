from dataclasses import dataclass


@dataclass
class TokenUsage:
    estimated_input_tokens: int
    estimated_output_tokens: int

    @property
    def total(self) -> int:
        return self.estimated_input_tokens + self.estimated_output_tokens


class TokenBudgetManager:
    def __init__(self, daily_budget: int, per_request_cap: int) -> None:
        self.daily_budget = daily_budget
        self.per_request_cap = per_request_cap
        self._used_today = 0

    @staticmethod
    def estimate_tokens(text: str) -> int:
        # Practical heuristic for mixed Chinese/English workloads.
        return max(len(text) // 3, 1)

    def reserve(self, prompt_text: str, target_output_tokens: int) -> TokenUsage:
        input_tokens = self.estimate_tokens(prompt_text)
        estimate = TokenUsage(
            estimated_input_tokens=input_tokens,
            estimated_output_tokens=target_output_tokens,
        )
        if estimate.total > self.per_request_cap:
            raise ValueError(
                f"Request exceeds cap ({estimate.total}>{self.per_request_cap}). Use narrower context."
            )
        if self._used_today + estimate.total > self.daily_budget:
            raise ValueError("Daily token budget exceeded. Wait for reset or reduce generation scope.")
        self._used_today += estimate.total
        return estimate

    @property
    def used_today(self) -> int:
        return self._used_today

    @property
    def remaining_today(self) -> int:
        return self.daily_budget - self._used_today
