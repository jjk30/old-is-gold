"""Tests for the per-uid fixed-window rate limiter (ratelimit.check_rate_limit).

DynamoDB is stubbed with an in-memory fake table injected via monkeypatching, so
these tests need NO runtime dependency (no boto3) and nothing here is bundled into
the Lambda zip.

Run directly:   python test_ratelimit.py
Or with pytest: pytest test_ratelimit.py
"""

import time

import ratelimit

# Real time module reference, so tests that fake the clock can restore it.
_REAL_TIME = ratelimit.time


class FakeTable:
    """Minimal stand-in for a DynamoDB Table that emulates the one UpdateItem
    call the limiter makes: ADD count :one, SET expires_at if_not_exists."""

    def __init__(self):
        self.rows = {}      # rl_key -> {"count": int, "expires_at": int}
        self.calls = 0

    def update_item(self, Key, UpdateExpression, ExpressionAttributeNames,
                    ExpressionAttributeValues, ReturnValues):
        self.calls += 1
        row = self.rows.setdefault(Key["rl_key"], {})
        row["count"] = row.get("count", 0) + ExpressionAttributeValues[":one"]
        row.setdefault("expires_at", ExpressionAttributeValues[":exp"])
        return {"Attributes": {"count": row["count"]}}


class RaisingTable:
    """Fake table whose every call raises, to exercise the fail-open path."""

    def update_item(self, **kwargs):
        raise RuntimeError("dynamo down")


class FakeClock:
    def __init__(self, t):
        self.t = t

    def time(self):
        return self.t


def _use_table(table):
    ratelimit._table = table


def _use_clock(t):
    ratelimit.time = FakeClock(t)


def _reset():
    ratelimit._table = None
    ratelimit.time = _REAL_TIME


# --------------------------------------------------------------------------- #
# Tests
# --------------------------------------------------------------------------- #

def test_under_limit_allows():
    _use_table(FakeTable())
    try:
        for _ in range(ratelimit.GENERAL_LIMIT):
            allowed, retry_after = ratelimit.check_rate_limit("u1", ratelimit.TIER_GENERAL)
            assert allowed is True, "requests under the cap must be allowed"
            assert retry_after == 0
    finally:
        _reset()


def test_crossing_limit_blocks_with_sane_retry_after():
    _use_table(FakeTable())
    try:
        # Exhaust the window exactly up to the cap (all allowed).
        for _ in range(ratelimit.GENERAL_LIMIT):
            allowed, _ = ratelimit.check_rate_limit("u1", ratelimit.TIER_GENERAL)
            assert allowed is True
        # The next request (count = limit + 1) must be blocked.
        allowed, retry_after = ratelimit.check_rate_limit("u1", ratelimit.TIER_GENERAL)
        assert allowed is False, "request over the cap must be blocked"
        assert 1 <= retry_after <= ratelimit.WINDOW_SECONDS, f"retry_after {retry_after} out of range"
    finally:
        _reset()


def test_tiers_have_independent_thresholds():
    assert ratelimit.YOUTUBE_LIMIT < ratelimit.GENERAL_LIMIT, "test assumes youtube cap is tighter"
    _use_table(FakeTable())
    try:
        uid = "u1"
        # Spend exactly the youtube cap, then one more -> blocked on that tier.
        for _ in range(ratelimit.YOUTUBE_LIMIT):
            allowed, _ = ratelimit.check_rate_limit(uid, ratelimit.TIER_YOUTUBE)
            assert allowed is True
        allowed, _ = ratelimit.check_rate_limit(uid, ratelimit.TIER_YOUTUBE)
        assert allowed is False, "youtube tier should block past YOUTUBE_LIMIT"

        # Same uid on the general tier is tracked separately and still allowed
        # at a count that already blocked the youtube tier.
        for _ in range(ratelimit.YOUTUBE_LIMIT + 1):
            allowed, _ = ratelimit.check_rate_limit(uid, ratelimit.TIER_GENERAL)
            assert allowed is True, "general tier must be independent of youtube tier"
    finally:
        _reset()


def test_window_rollover_resets_count():
    _use_table(FakeTable())
    try:
        # Window 1: fill to the cap then confirm the next is blocked.
        _use_clock(1_000_000)  # arbitrary fixed time inside window 1
        for _ in range(ratelimit.GENERAL_LIMIT):
            ratelimit.check_rate_limit("u1", ratelimit.TIER_GENERAL)
        allowed, _ = ratelimit.check_rate_limit("u1", ratelimit.TIER_GENERAL)
        assert allowed is False, "should be blocked at end of window 1"

        # Advance into the next window — the key changes, so the count resets.
        _use_clock(1_000_000 + ratelimit.WINDOW_SECONDS)
        allowed, retry_after = ratelimit.check_rate_limit("u1", ratelimit.TIER_GENERAL)
        assert allowed is True, "new window must reset the count"
        assert retry_after == 0
    finally:
        _reset()


def test_fails_open_when_dynamo_raises():
    _use_table(RaisingTable())
    try:
        allowed, retry_after = ratelimit.check_rate_limit("u1", ratelimit.TIER_GENERAL)
        assert allowed is True, "limiter must fail OPEN when the backend errors"
        assert retry_after == 0
    finally:
        _reset()


if __name__ == "__main__":
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    failures = 0
    for t in tests:
        try:
            t()
            print(f"PASS  {t.__name__}")
        except AssertionError as e:
            failures += 1
            print(f"FAIL  {t.__name__}: {e}")
    print(f"\n{len(tests) - failures}/{len(tests)} passed")
    raise SystemExit(1 if failures else 0)
