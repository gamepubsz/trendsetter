import time
from dataclasses import dataclass
from typing import Generic, TypeVar


T = TypeVar("T")


@dataclass
class CacheRecord(Generic[T]):
    payload: T
    expires_at: float


class InMemoryTTLCache(Generic[T]):
    def __init__(self, ttl_seconds: int) -> None:
        self.ttl_seconds = ttl_seconds
        self._store: dict[str, CacheRecord[T]] = {}

    def get(self, key: str) -> T | None:
        record = self._store.get(key)
        if not record:
            return None
        if time.time() > record.expires_at:
            self._store.pop(key, None)
            return None
        return record.payload

    def set(self, key: str, value: T) -> None:
        self._store[key] = CacheRecord(payload=value, expires_at=time.time() + self.ttl_seconds)
