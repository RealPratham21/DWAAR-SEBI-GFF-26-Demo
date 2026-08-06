"""Decimal-safe string arithmetic for Capital & Ownership — mirrors `frontend/lib/capital-ownership/decimal.ts`.

The persisted payload stores every amount, share count, ratio and percentage as a plain decimal
STRING (`''` when not provided). Python's `Decimal` gives us exact fixed-point arithmetic natively,
so there is no BigInt-style reimplementation needed — only matching input parsing and output
formatting conventions with the frontend:

- An input of `None`, `''` or an unparseable string is "absent".
- Every operation returns `''` when the result cannot be computed. `''` therefore means
  "not available", exactly as it does in the payload.
- Never use `float` for payload values — only `Decimal`.
"""

from __future__ import annotations

import re
from decimal import ROUND_HALF_UP, Context, Decimal, InvalidOperation, localcontext

DecimalInput = str | int | float | Decimal | None

_DECIMAL_PATTERN = re.compile(r"^[+-]?\d+(\.\d+)?$")
_CLEAN_PATTERN = re.compile(r"[\s,_\u20b9]")
DEFAULT_DIVISION_SCALE = 12
MAX_SCALE = 30
DECIMAL_ZERO = "0"

_CTX = Context(prec=60, rounding=ROUND_HALF_UP)


def parse_decimal(raw: DecimalInput) -> Decimal | None:
    """Parse a raw value into a `Decimal`. Returns `None` when absent or unparseable."""
    if raw is None:
        return None
    if isinstance(raw, bool):
        return None
    if isinstance(raw, Decimal):
        return raw
    if isinstance(raw, (int, float)):
        raw = str(raw)
    cleaned = _CLEAN_PATTERN.sub("", str(raw))
    if cleaned == "" or not _DECIMAL_PATTERN.match(cleaned):
        return None
    try:
        return Decimal(cleaned)
    except InvalidOperation:
        return None


def _canonical(value: Decimal) -> str:
    if value == 0:
        return "0"
    text = format(value, "f")
    if "." in text:
        text = text.rstrip("0").rstrip(".")
        if text in ("", "-"):
            return "0"
    return text


def is_filled(value: DecimalInput) -> bool:
    """`True` when the value is a usable decimal (i.e. not empty and parseable)."""
    return parse_decimal(value) is not None


def is_blank(value: DecimalInput) -> bool:
    """`True` when the value is empty / whitespace-only."""
    if value is None:
        return True
    return str(value).strip() == ""


def is_invalid(value: DecimalInput) -> bool:
    """`True` when a non-empty value cannot be parsed as a decimal."""
    return not is_blank(value) and parse_decimal(value) is None


def to_decimal_string(raw: DecimalInput) -> str:
    """Normalise raw input into the canonical payload form (`''` when absent/invalid)."""
    parsed = parse_decimal(raw)
    return "" if parsed is None else _canonical(parsed)


def add(a: DecimalInput, b: DecimalInput) -> str:
    left = parse_decimal(a)
    right = parse_decimal(b)
    if left is None or right is None:
        return ""
    with localcontext(_CTX):
        return _canonical(left + right)


def sub(a: DecimalInput, b: DecimalInput) -> str:
    left = parse_decimal(a)
    right = parse_decimal(b)
    if left is None or right is None:
        return ""
    with localcontext(_CTX):
        return _canonical(left - right)


# Alias matching frontend naming (`subtract`).
subtract = sub


def mul(a: DecimalInput, b: DecimalInput) -> str:
    left = parse_decimal(a)
    right = parse_decimal(b)
    if left is None or right is None:
        return ""
    with localcontext(_CTX):
        return _canonical(left * right)


def div(a: DecimalInput, b: DecimalInput, decimal_places: int = DEFAULT_DIVISION_SCALE) -> str:
    left = parse_decimal(a)
    right = parse_decimal(b)
    if left is None or right is None or right == 0:
        return ""
    scale = max(0, min(MAX_SCALE, int(decimal_places)))
    quant = Decimal(1).scaleb(-scale)
    with localcontext(_CTX):
        result = (left / right).quantize(quant, rounding=ROUND_HALF_UP)
    return _canonical(result)


def pct(part: DecimalInput, total: DecimalInput, decimal_places: int = 6) -> str:
    """`part` as a percentage of `total`. Returns `''` when either side is absent or total is zero."""
    scaled = mul(part, "100")
    if scaled == "":
        return ""
    return div(scaled, total, decimal_places)


def percentage_of(percentage: DecimalInput, base: DecimalInput, decimal_places: int = 6) -> str:
    """Apply a percentage to a base value: `percentage_of('20', '1000') == '200'`."""
    product = mul(percentage, base)
    if product == "":
        return ""
    return div(product, "100", decimal_places)


def negate(value: DecimalInput) -> str:
    parsed = parse_decimal(value)
    if parsed is None:
        return ""
    return _canonical(-parsed)


def abs_decimal(value: DecimalInput) -> str:
    parsed = parse_decimal(value)
    if parsed is None:
        return ""
    return _canonical(abs(parsed))


def round_decimal(value: DecimalInput, decimal_places: int = 2) -> str:
    parsed = parse_decimal(value)
    if parsed is None:
        return ""
    scale = max(0, min(MAX_SCALE, int(decimal_places)))
    quant = Decimal(1).scaleb(-scale)
    with localcontext(_CTX):
        return _canonical(parsed.quantize(quant, rounding=ROUND_HALF_UP))


def compare(a: DecimalInput, b: DecimalInput) -> int | None:
    """`-1 | 0 | 1`, or `None` when either side is absent."""
    left = parse_decimal(a)
    right = parse_decimal(b)
    if left is None or right is None:
        return None
    if left < right:
        return -1
    if left > right:
        return 1
    return 0


def is_zero(value: DecimalInput) -> bool:
    parsed = parse_decimal(value)
    return parsed is not None and parsed == 0


def is_positive(value: DecimalInput) -> bool:
    parsed = parse_decimal(value)
    return parsed is not None and parsed > 0


def is_negative(value: DecimalInput) -> bool:
    parsed = parse_decimal(value)
    return parsed is not None and parsed < 0


def greater_than(a: DecimalInput, b: DecimalInput) -> bool:
    return compare(a, b) == 1


def less_than(a: DecimalInput, b: DecimalInput) -> bool:
    return compare(a, b) == -1


def equals(a: DecimalInput, b: DecimalInput) -> bool:
    return compare(a, b) == 0


def max_decimal(a: DecimalInput, b: DecimalInput) -> str:
    result = compare(a, b)
    if result is None:
        return ""
    return to_decimal_string(a) if result >= 0 else to_decimal_string(b)


def min_decimal(a: DecimalInput, b: DecimalInput) -> str:
    result = compare(a, b)
    if result is None:
        return ""
    return to_decimal_string(a) if result <= 0 else to_decimal_string(b)


def sum_decimals(values: list[DecimalInput]) -> str:
    """Sum every parseable value, ignoring blanks. `''` when nothing is present."""
    total: Decimal | None = None
    with localcontext(_CTX):
        for value in values:
            parsed = parse_decimal(value)
            if parsed is None:
                continue
            total = parsed if total is None else total + parsed
    return "" if total is None else _canonical(total)


def sum_decimals_strict(values: list[DecimalInput]) -> str:
    """Like `sum_decimals` but returns `''` if any entry is present-but-unparseable or missing."""
    total = Decimal("0")
    with localcontext(_CTX):
        for value in values:
            parsed = parse_decimal(value)
            if parsed is None:
                return ""
            total = total + parsed
    return _canonical(total)


def difference(a: DecimalInput, b: DecimalInput) -> str:
    """Absolute difference between two values; `''` when either is absent."""
    return abs_decimal(sub(a, b))


def differs_beyond(a: DecimalInput, b: DecimalInput, tolerance: DecimalInput = "0") -> bool:
    delta = difference(a, b)
    if delta == "":
        return False
    return greater_than(delta, tolerance)


def is_whole_number(value: DecimalInput) -> bool:
    parsed = parse_decimal(value)
    if parsed is None:
        return False
    return parsed == parsed.to_integral_value()


def first_filled(*values: DecimalInput) -> str:
    for value in values:
        if is_filled(value):
            return to_decimal_string(value)
    return ""
