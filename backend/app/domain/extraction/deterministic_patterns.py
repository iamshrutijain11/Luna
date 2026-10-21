"""Deterministic pattern extraction using regex and rule-based heuristics for dates, amounts, and identifiers."""

import re
from datetime import datetime, date
from typing import Any, Dict, List, Optional, Tuple


DATE_PATTERNS = [
    # ISO-style: 2024-05-18 or 2024/05/18
    (r"\b(\d{4})[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b", "%Y-%m-%d"),
    # DD-MM-YYYY or DD/MM/YYYY
    (r"\b(0[1-9]|[12]\d|3[01])[-/](0[1-9]|1[0-2])[-/](\d{4})\b", "%d-%m-%Y"),
    # Month DD, YYYY e.g., October 20, 2026 or Oct 20, 2026
    (
        r"\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(\d{4})\b",
        "named_month",
    ),
]

AMOUNT_PATTERNS = [
    r"(?:\$|USD|EUR|€|£|INR|Rs\.?)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)",
    r"\b([0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2})\s*(?:USD|EUR|GBP|INR)?\b",
]

INVOICE_NUM_PATTERNS = [
    r"(?:Invoice\s*(?:No|Number|#|ID)?[:\s]+)([A-Za-z0-9-_/]+)",
    r"(?:Bill\s*(?:No|Number|#|ID)?[:\s]+)([A-Za-z0-9-_/]+)",
    r"(?:Account\s*(?:No|Number|#|ID)?[:\s]+)([A-Za-z0-9-_/]+)",
    r"(?:Reference\s*(?:No|Number|#|ID)?[:\s]+)([A-Za-z0-9-_/]+)",
]

WARRANTY_DURATION_PATTERNS = [
    r"(\d+)\s*(?:year|yr)s?\s*(?:limited\s*)?(?:warranty|guarantee)?",
    r"(\d+)\s*(?:month|mo)s?\s*(?:limited\s*)?(?:warranty|guarantee)?",
]

USAGE_PATTERNS = [
    r"(\d+(?:\.\d+)?)\s*(kWh|therms|gallons|gal|units|m3|ccf)\b",
    r"(?:Total\s*Usage|Energy\s*Used|Consumption)[:\s]+(\d+(?:\.\d+)?)\s*([A-Za-z0-9]+)?",
]


def extract_context_excerpt(text: str, match_start: int, match_end: int, window: int = 40) -> str:
    """Extracts a bounded excerpt around match location for audit evidence."""
    start = max(0, match_start - window)
    end = min(len(text), match_end + window)
    excerpt = text[start:end].replace("\n", " ").strip()
    return f"...{excerpt}..." if start > 0 or end < len(text) else excerpt


def parse_date_string(date_str: str) -> Optional[date]:
    """Attempts to parse string to datetime.date."""
    date_str = date_str.strip().replace("/", "-")
    # Try ISO
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        pass

    # Try DD-MM-YYYY
    try:
        return datetime.strptime(date_str, "%d-%m-%Y").date()
    except Exception:
        pass

    # Try named month
    for fmt in ("%B %d, %Y", "%b %d, %Y", "%B %d %Y", "%b %d %Y"):
        try:
            return datetime.strptime(date_str, fmt).date()
        except Exception:
            continue

    return None


def find_dates_with_evidence(text: str) -> List[Dict[str, Any]]:
    """Finds all dates in text with location and provenance excerpt."""
    results = []
    seen = set()

    # ISO & standard
    for pattern, fmt in DATE_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            raw = match.group(0).strip()
            if raw in seen:
                continue
            seen.add(raw)
            parsed = parse_date_string(raw)
            if parsed:
                results.append({
                    "raw": raw,
                    "parsed": parsed.isoformat(),
                    "excerpt": extract_context_excerpt(text, match.start(), match.end()),
                    "start": match.start(),
                })
    return results


def find_amounts_with_evidence(text: str) -> List[Dict[str, Any]]:
    """Finds monetary amounts in text with provenance excerpt."""
    results = []
    seen = set()

    for pattern in AMOUNT_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            raw = match.group(1).replace(",", "").strip() if match.groups() else match.group(0).strip()
            try:
                val = float(raw)
            except ValueError:
                continue

            full_str = match.group(0).strip()
            if full_str in seen:
                continue
            seen.add(full_str)

            results.append({
                "raw": full_str,
                "value": val,
                "excerpt": extract_context_excerpt(text, match.start(), match.end()),
                "start": match.start(),
            })
    return results


def find_identifiers_with_evidence(text: str) -> List[Dict[str, Any]]:
    """Finds invoice, bill, account numbers with provenance excerpt."""
    results = []
    for pattern in INVOICE_NUM_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            ident = match.group(1).strip()
            if len(ident) >= 3:
                results.append({
                    "identifier": ident,
                    "excerpt": extract_context_excerpt(text, match.start(), match.end()),
                })
    return results


def find_warranty_duration(text: str) -> Optional[Tuple[int, str, str]]:
    """
    Finds warranty duration (e.g. 24 months, 1 year).
    Returns (duration_value, unit, excerpt) or None.
    """
    for match in re.finditer(WARRANTY_DURATION_PATTERNS[0], text, re.IGNORECASE):
        num = int(match.group(1))
        excerpt = extract_context_excerpt(text, match.start(), match.end())
        return num, "year", excerpt

    for match in re.finditer(WARRANTY_DURATION_PATTERNS[1], text, re.IGNORECASE):
        num = int(match.group(1))
        excerpt = extract_context_excerpt(text, match.start(), match.end())
        return num, "month", excerpt

    return None


def find_usage(text: str) -> Optional[Tuple[float, str, str]]:
    """Finds utility usage quantity and unit."""
    for pattern in USAGE_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            try:
                qty = float(match.group(1))
                unit = match.group(2) if len(match.groups()) > 1 and match.group(2) else "units"
                excerpt = extract_context_excerpt(text, match.start(), match.end())
                return qty, unit, excerpt
            except Exception:
                continue
    return None
