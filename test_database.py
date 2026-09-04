#!/usr/bin/env python3
"""
test_database.py — Database Integration Tests for Wasl Medical Transport Platform
====================================================================================
Loads mission data from the Excel workbook, populates a SQLite database, and
runs a suite of validation / KPI tests against it.

Usage (from the repo root):
    python test_database.py

Exit code 0 means all tests passed; non-zero means at least one test failed.
"""

import os
import sqlite3
import sys
import tempfile
import traceback
from datetime import datetime

# ---------------------------------------------------------------------------
# Optional dependency: openpyxl (pip install openpyxl)
# ---------------------------------------------------------------------------
try:
    import openpyxl
    _OPENPYXL_AVAILABLE = True
except ImportError:
    _OPENPYXL_AVAILABLE = False

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_REPO_DIR = os.path.dirname(os.path.abspath(__file__))
_XLSX_PATH = os.path.join(_REPO_DIR, "Medical-Transport-Analytics.xlsx")
_SHEET_NAME = "Daily Operations Data"

# ---------------------------------------------------------------------------
# Expected columns in the worksheet (index → canonical name mapping)
# ---------------------------------------------------------------------------
EXPECTED_COLUMNS = {
    "Referral #",
    "Referral Date",
    "Center Name",
    "Referral Type",
    "Dispatch Time (min)",
    "Response Time (min)",
    "Travel Time (min)",
    "Total Response (min)",
    "Mission Duration (min)",
    "Performance Rating",
    "Shift Period",
    "Day of Week",
    "Month",
}

# KPI thresholds (minutes) – aligned with the platform's business rules
RESPONSE_TIME_TARGET = 15   # minutes
RESPONSE_TIME_CRITICAL = 20  # minutes
LATE_RATE_MAX_PCT = 20       # maximum acceptable late-mission rate

# ---------------------------------------------------------------------------
# Minimal test runner
# ---------------------------------------------------------------------------

class TestRunner:
    def __init__(self):
        self._tests = []
        self.passed = 0
        self.failed = 0

    def register(self, name, fn):
        self._tests.append((name, fn))

    def run_all(self):
        width = 60
        print("\n" + "═" * width)
        print("  Wasl — Medical Transport Database Tests")
        print("═" * width)
        for name, fn in self._tests:
            try:
                fn()
                self.passed += 1
                print(f"  ✅  {name}")
            except AssertionError as exc:
                self.failed += 1
                print(f"  ❌  {name}")
                print(f"       → {exc}")
            except Exception:
                self.failed += 1
                print(f"  💥  {name} (unexpected error)")
                for line in traceback.format_exc().splitlines():
                    print(f"       {line}")
        print("═" * width)
        status = "PASSED" if self.failed == 0 else "FAILED"
        print(
            f"  Result: {self.passed} passed, {self.failed} failed  [{status}]"
        )
        print("═" * width + "\n")

    @property
    def exit_code(self):
        return 0 if self.failed == 0 else 1


runner = TestRunner()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _to_float(value, default=0.0):
    """Safely convert a cell value to float."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _load_workbook_rows():
    """Return (headers, data_rows) from the Excel sheet."""
    if not _OPENPYXL_AVAILABLE:
        raise RuntimeError(
            "openpyxl is required — install it with: pip install openpyxl"
        )
    if not os.path.exists(_XLSX_PATH):
        raise FileNotFoundError(
            f"Excel workbook not found: {_XLSX_PATH}"
        )
    wb = openpyxl.load_workbook(_XLSX_PATH, read_only=True, data_only=True)
    if _SHEET_NAME not in wb.sheetnames:
        raise KeyError(
            f"Sheet '{_SHEET_NAME}' not found. "
            f"Available sheets: {wb.sheetnames}"
        )
    ws = wb[_SHEET_NAME]
    rows_iter = ws.iter_rows(values_only=True)
    headers = next(rows_iter)
    data = list(rows_iter)
    wb.close()
    return headers, data


def _build_in_memory_db(headers, data_rows):
    """Create a SQLite in-memory database and populate it with mission rows."""
    con = sqlite3.connect(":memory:")
    cur = con.cursor()
    # Sanitise column names for SQL (replace spaces/special chars with _)
    safe_cols = [str(h).replace(" ", "_").replace("(", "").replace(")", "").replace("/", "_") for h in headers]
    col_defs = ", ".join(f'"{c}" TEXT' for c in safe_cols)
    cur.execute(f"CREATE TABLE missions ({col_defs})")
    placeholders = ", ".join("?" for _ in safe_cols)
    for row in data_rows:
        # Convert all values to str to keep it simple (queries cast back)
        safe_row = tuple(
            str(v) if v is not None else None for v in row
        )
        cur.execute(f"INSERT INTO missions VALUES ({placeholders})", safe_row)
    con.commit()
    return con, safe_cols


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

# ── 1. openpyxl availability ────────────────────────────────────────────────

def test_openpyxl_available():
    assert _OPENPYXL_AVAILABLE, (
        "openpyxl is not installed. Run: pip install openpyxl"
    )

runner.register("openpyxl library is available", test_openpyxl_available)


# ── 2. Excel file exists ─────────────────────────────────────────────────────

def test_xlsx_exists():
    assert os.path.exists(_XLSX_PATH), (
        f"Workbook not found at '{_XLSX_PATH}'"
    )

runner.register("Excel workbook file exists", test_xlsx_exists)


# ── 3. Target sheet is present ───────────────────────────────────────────────

def test_sheet_present():
    if not _OPENPYXL_AVAILABLE or not os.path.exists(_XLSX_PATH):
        return  # guarded by earlier tests
    wb = openpyxl.load_workbook(_XLSX_PATH, read_only=True)
    assert _SHEET_NAME in wb.sheetnames, (
        f"Sheet '{_SHEET_NAME}' missing. Found: {wb.sheetnames}"
    )
    wb.close()

runner.register(f"Sheet '{_SHEET_NAME}' is present", test_sheet_present)


# ── 4. Required columns exist ────────────────────────────────────────────────

def test_required_columns():
    if not _OPENPYXL_AVAILABLE or not os.path.exists(_XLSX_PATH):
        return
    headers, _ = _load_workbook_rows()
    header_set = set(headers)
    missing = EXPECTED_COLUMNS - header_set
    assert not missing, (
        f"Missing required columns: {sorted(missing)}"
    )

runner.register("All required columns are present", test_required_columns)


# ── 5. Row count is non-trivial ───────────────────────────────────────────────

def test_row_count():
    if not _OPENPYXL_AVAILABLE or not os.path.exists(_XLSX_PATH):
        return
    _, data = _load_workbook_rows()
    # Filter out blank rows (all None)
    non_blank = [r for r in data if any(v is not None for v in r)]
    assert len(non_blank) >= 100, (
        f"Expected at least 100 data rows, found {len(non_blank)}"
    )

runner.register("Dataset contains at least 100 mission records", test_row_count)


# ── 6. SQLite database can be created ────────────────────────────────────────

def test_db_creation():
    if not _OPENPYXL_AVAILABLE or not os.path.exists(_XLSX_PATH):
        return
    headers, data = _load_workbook_rows()
    non_blank = [r for r in data if any(v is not None for v in r)]
    con, _ = _build_in_memory_db(headers, non_blank)
    cur = con.cursor()
    cur.execute("SELECT COUNT(*) FROM missions")
    count = cur.fetchone()[0]
    con.close()
    assert count == len(non_blank), (
        f"DB row count ({count}) does not match loaded rows ({len(non_blank)})"
    )

runner.register("SQLite in-memory database is created successfully", test_db_creation)


# ── 7. Referral IDs are unique ───────────────────────────────────────────────

def test_referral_ids_unique():
    if not _OPENPYXL_AVAILABLE or not os.path.exists(_XLSX_PATH):
        return
    headers, data = _load_workbook_rows()
    non_blank = [r for r in data if any(v is not None for v in r)]
    con, _ = _build_in_memory_db(headers, non_blank)
    cur = con.cursor()
    cur.execute('SELECT COUNT("Referral_#") FROM missions WHERE "Referral_#" IS NOT NULL')
    non_null_count = cur.fetchone()[0]
    cur.execute('SELECT COUNT(DISTINCT "Referral_#") FROM missions WHERE "Referral_#" IS NOT NULL')
    distinct = cur.fetchone()[0]
    con.close()
    assert distinct == non_null_count, (
        f"Duplicate Referral # detected: {non_null_count} non-NULL rows but only {distinct} unique IDs"
    )

runner.register("Referral IDs are unique", test_referral_ids_unique)


# ── 8. Response time values are positive ─────────────────────────────────────

def test_response_times_positive():
    if not _OPENPYXL_AVAILABLE or not os.path.exists(_XLSX_PATH):
        return
    headers, data = _load_workbook_rows()
    non_blank = [r for r in data if any(v is not None for v in r)]
    con, _ = _build_in_memory_db(headers, non_blank)
    cur = con.cursor()
    # Count rows with a non-NULL response time that is ≤ 0
    cur.execute(
        'SELECT COUNT(*) FROM missions '
        'WHERE "Response_Time_min" IS NOT NULL '
        'AND CAST("Response_Time_min" AS REAL) <= 0'
    )
    bad = cur.fetchone()[0]
    con.close()
    assert bad == 0, (
        f"{bad} mission(s) have a non-positive Response Time"
    )

runner.register("All response time values are positive", test_response_times_positive)


# ── 9. Average response time is within a plausible range ─────────────────────

def test_avg_response_time_range():
    if not _OPENPYXL_AVAILABLE or not os.path.exists(_XLSX_PATH):
        return
    headers, data = _load_workbook_rows()
    non_blank = [r for r in data if any(v is not None for v in r)]
    con, _ = _build_in_memory_db(headers, non_blank)
    cur = con.cursor()
    cur.execute(
        'SELECT AVG(CAST("Response_Time_min" AS REAL)) FROM missions '
        'WHERE "Response_Time_min" IS NOT NULL'
    )
    avg = cur.fetchone()[0] or 0.0
    con.close()
    assert 1 <= avg <= 120, (
        f"Average response time ({avg:.1f} min) is outside plausible range [1, 120]"
    )

runner.register("Average response time is within plausible range", test_avg_response_time_range)


# ── 10. Late-mission rate is below the maximum threshold ─────────────────────

def test_late_rate_acceptable():
    if not _OPENPYXL_AVAILABLE or not os.path.exists(_XLSX_PATH):
        return
    headers, data = _load_workbook_rows()
    non_blank = [r for r in data if any(v is not None for v in r)]
    con, _ = _build_in_memory_db(headers, non_blank)
    cur = con.cursor()
    cur.execute(
        'SELECT COUNT(*) FROM missions '
        'WHERE CAST("Response_Time_min" AS REAL) > ?',
        (RESPONSE_TIME_CRITICAL,),
    )
    late_count = cur.fetchone()[0]
    cur.execute('SELECT COUNT(*) FROM missions')
    total = cur.fetchone()[0]
    con.close()
    if total == 0:
        return
    late_rate_pct = late_count / total * 100
    assert late_rate_pct <= LATE_RATE_MAX_PCT, (
        f"Late-mission rate ({late_rate_pct:.1f}%) exceeds max threshold "
        f"({LATE_RATE_MAX_PCT}%)"
    )

runner.register(
    f"Late-mission rate is ≤ {LATE_RATE_MAX_PCT}% (response > {RESPONSE_TIME_CRITICAL} min)",
    test_late_rate_acceptable,
)


# ── 11. All known shift labels are present ───────────────────────────────────

def test_shift_labels():
    if not _OPENPYXL_AVAILABLE or not os.path.exists(_XLSX_PATH):
        return
    headers, data = _load_workbook_rows()
    non_blank = [r for r in data if any(v is not None for v in r)]
    con, _ = _build_in_memory_db(headers, non_blank)
    cur = con.cursor()
    cur.execute('SELECT DISTINCT "Shift_Period" FROM missions WHERE "Shift_Period" IS NOT NULL')
    found_shifts = {row[0] for row in cur.fetchall()}
    con.close()
    assert len(found_shifts) >= 2, (
        f"Expected at least 2 shift labels, found: {found_shifts}"
    )

runner.register("Multiple shift periods are present in the data", test_shift_labels)


# ── 12. SQLite DB can be persisted to disk and re-opened ─────────────────────

def test_db_persist_and_reload():
    if not _OPENPYXL_AVAILABLE or not os.path.exists(_XLSX_PATH):
        return
    headers, data = _load_workbook_rows()
    non_blank = [r for r in data if any(v is not None for v in r)]
    mem_con, _ = _build_in_memory_db(headers, non_blank)
    with tempfile.NamedTemporaryFile(suffix=".sqlite", delete=False) as f:
        tmp_path = f.name
    try:
        # Copy in-memory DB to disk
        disk_con = sqlite3.connect(tmp_path)
        mem_con.backup(disk_con)
        disk_con.close()
        mem_con.close()
        # Re-open from disk and verify count
        disk_con2 = sqlite3.connect(tmp_path)
        cur = disk_con2.cursor()
        cur.execute("SELECT COUNT(*) FROM missions")
        count = cur.fetchone()[0]
        disk_con2.close()
        assert count == len(non_blank), (
            f"Row count after reload ({count}) differs from original ({len(non_blank)})"
        )
    finally:
        os.unlink(tmp_path)

runner.register("Database can be persisted to disk and re-opened", test_db_persist_and_reload)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    runner.run_all()
    sys.exit(runner.exit_code)
