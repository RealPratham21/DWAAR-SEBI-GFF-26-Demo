"""Cohere multi-key configuration foundation — no outbound requests."""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field

from app.core.config import Settings


@dataclass
class CohereKeyState:
    key: str
    in_flight: int = 0
    cooldown_until: float = 0.0
    last_used_at: float = 0.0


@dataclass
class GenerationConcurrencyConfig:
    max_global_concurrency: int = 4
    max_retries: int = 3
    base_backoff_seconds: float = 1.0
    cooldown_seconds_on_429: float = 30.0


class CohereKeyPool:
    """Round-robin / least-busy key selection with cooldown tracking."""

    def __init__(self, keys: list[str], config: GenerationConcurrencyConfig | None = None) -> None:
        if not keys:
            msg = "At least one Cohere API key is required."
            raise ValueError(msg)
        self._keys = [CohereKeyState(key=item) for item in keys]
        self._lock = threading.Lock()
        self.config = config or GenerationConcurrencyConfig()
        self._global_in_flight = 0

    def acquire_key(self) -> str | None:
        with self._lock:
            if self._global_in_flight >= self.config.max_global_concurrency:
                return None
            now = time.monotonic()
            candidates = [
                state
                for state in self._keys
                if state.cooldown_until <= now and state.in_flight == 0
            ]
            if not candidates:
                candidates = [state for state in self._keys if state.cooldown_until <= now]
            if not candidates:
                return None
            chosen = min(candidates, key=lambda s: s.last_used_at)
            chosen.in_flight += 1
            chosen.last_used_at = now
            self._global_in_flight += 1
            return chosen.key

    def release_key(self, key: str, *, rate_limited: bool = False) -> None:
        with self._lock:
            for state in self._keys:
                if state.key == key:
                    state.in_flight = max(0, state.in_flight - 1)
                    if rate_limited:
                        state.cooldown_until = time.monotonic() + self.config.cooldown_seconds_on_429
                    break
            self._global_in_flight = max(0, self._global_in_flight - 1)


@dataclass
class CohereProvider:
    """Provider shell — generation not implemented in this increment."""

    key_pool: CohereKeyPool
    model: str
    timeout_seconds: int
    temperature: float
    configured: bool = True

    def is_ready(self) -> bool:
        return self.configured and bool(self.key_pool._keys)


def resolve_cohere_api_keys(settings: Settings) -> list[str]:
    keys: list[str] = []
    if settings.cohere_api_keys:
        keys.extend(item.strip() for item in settings.cohere_api_keys.split(",") if item.strip())
    if settings.cohere_api_key and settings.cohere_api_key not in keys:
        keys.insert(0, settings.cohere_api_key.strip())
    return keys


def build_cohere_provider(settings: Settings) -> CohereProvider:
    keys = resolve_cohere_api_keys(settings)
    return CohereProvider(
        key_pool=CohereKeyPool(keys or ["__unset__"]),
        model=settings.cohere_model,
        timeout_seconds=settings.cohere_timeout_seconds,
        temperature=settings.cohere_temperature,
        configured=bool(keys),
    )
