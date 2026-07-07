"""
Validates edge_index_dataset.csv ? Adjacency Matrix / Edge Index for GNN.
Vaultera Labs ? Thesis-grade data quality checks.

Run: python validate_edge_index.py

Checks performed:
  1. Schema: correct column count and header names
  2. employee_id range [1, 100]
  3. task_id range [1, 10000]
  4. sprint_id derivation: sprint_id == ceil(task_id / 200)
  5. is_fit in {0, 1}
  6. completion_delay_days ? [?5, 30]
  7. No duplicate (employee_id, task_id) pairs
  8. Label balance report (target ~65% is_fit=1)
  9. Sprint coverage (all 50 sprints must be present)
 10. Per-sprint edge count distribution
 11. Domain alignment rate (informational)
 12. Delay mean by is_fit group (sanity: fit=1 should be lower)
 13. Edge count per difficulty tier (informational, via sprint proxy)
"""

import csv
import math
import os
from collections import Counter, defaultdict

# --- PATHS -------------------------------------------------------------------
_HERE   = os.path.dirname(__file__)
EDGE_CSV = os.path.join(_HERE, "edge_index_dataset.csv")
DEV_CSV  = os.path.join(_HERE, "developers", "developer_node_features_v2.csv")
TASK_CSV = os.path.join(_HERE, "tasks", "task_node_features_v2.csv")

EXPECTED_HEADER = [
    "assignment_id",
    "employee_id",
    "task_id",
    "sprint_id",
    "is_fit",
    "completion_delay_days",
]

# --- LOAD TASK METADATA (for domain alignment + difficulty checks) -------------
def load_task_meta(path: str) -> dict:
    meta = {}
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            tid = int(row["task_id"])
            meta[tid] = {
                "difficulty":    row["task_difficulty"],
                "macro_domain":  row["macro_domain"],
                "sprint_id":     int(row["sprint_id"]),
            }
    return meta

# --- LOAD DEVELOPER DOMAIN BITS -----------------------------------------------
def load_dev_meta(path: str) -> dict:
    import json
    meta = {}
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            eid = int(row["employee_id"])
            macro_bits = json.loads(row["macro_domains"].strip())
            meta[eid] = {"macro_bits": macro_bits}
    return meta

MACRO_DOMAIN_NAMES = [
    "Product Strategy & Management",
    "Web & SaaS Platforms",
    "Data Science & Predictive Modeling",
    "DevOps & IT Infrastructure",
    "Hardware Prototyping & Embedded Systems",
    "UI/UX & Digital Asset Design",
    "Mobile Application Development",
    "Game Development & Interactive Media",
]
MACRO_DOMAIN_INDEX = {name: i for i, name in enumerate(MACRO_DOMAIN_NAMES)}

# --- MAIN VALIDATION ---------------------------------------------------------
def validate():
    errors = 0

    print("Loading auxiliary metadata ...")
    task_meta = load_task_meta(TASK_CSV)
    dev_meta  = load_dev_meta(DEV_CSV)
    print(f"  Tasks loaded: {len(task_meta)}")
    print(f"  Developers loaded: {len(dev_meta)}")

    print("\nLoading edge_index_dataset.csv ...")
    if not os.path.exists(EDGE_CSV):
        print("  ERROR: edge_index_dataset.csv not found. Run generate_edge_index.py first.")
        return

    rows = []
    with open(EDGE_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        # -- Check 1: Header --------------------------------------------------
        actual_header = list(reader.fieldnames)
        if actual_header != EXPECTED_HEADER:
            print(f"  ERROR: Header mismatch.")
            print(f"    Expected : {EXPECTED_HEADER}")
            print(f"    Actual   : {actual_header}")
            errors += 1
        else:
            print(f"  OK Header matches expected schema ({len(actual_header)} columns)")

        for row in reader:
            rows.append(row)

    total = len(rows)
    print(f"  Total rows: {total:,}")

    # Tracking structures
    pair_set       = set()
    sprint_counter = Counter()
    is_fit_counter = Counter()
    delays_by_fit  = defaultdict(list)
    diff_counter   = Counter()
    domain_aligned = 0
    domain_total   = 0

    emp_errors   = []
    task_errors  = []
    sprint_errors = []
    fit_errors   = []
    delay_errors = []
    dup_errors   = []

    for row in rows:
        asgn_id = int(row["assignment_id"])
        emp_id  = int(row["employee_id"])
        task_id = int(row["task_id"])
        sprint  = int(row["sprint_id"])
        is_fit  = int(row["is_fit"])
        delay   = int(row["completion_delay_days"])

        # -- Check 2: employee_id range ---------------------------------------
        if not (1 <= emp_id <= 100):
            emp_errors.append(f"    row {asgn_id}: employee_id={emp_id}")

        # -- Check 3: task_id range -------------------------------------------
        if not (1 <= task_id <= 10000):
            task_errors.append(f"    row {asgn_id}: task_id={task_id}")

        # -- Check 4: sprint_id derivation ------------------------------------
        expected_sprint = math.ceil(task_id / 200)
        if sprint != expected_sprint:
            sprint_errors.append(
                f"    row {asgn_id}: task_id={task_id} ? "
                f"sprint_id={sprint} (expected {expected_sprint})"
            )

        # -- Check 5: is_fit --------------------------------------------------
        if is_fit not in (0, 1):
            fit_errors.append(f"    row {asgn_id}: is_fit={is_fit}")

        # -- Check 6: delay range ---------------------------------------------
        if not (-5 <= delay <= 30):
            delay_errors.append(f"    row {asgn_id}: delay={delay}")

        # -- Check 7: duplicate pairs -----------------------------------------
        pair = (emp_id, task_id)
        if pair in pair_set:
            dup_errors.append(f"    row {asgn_id}: duplicate ({emp_id}, {task_id})")
        pair_set.add(pair)

        # Accumulate stats
        sprint_counter[sprint] += 1
        is_fit_counter[is_fit] += 1
        delays_by_fit[is_fit].append(delay)

        # Domain alignment (informational)
        if task_id in task_meta and emp_id in dev_meta:
            tdomain = task_meta[task_id]["macro_domain"]
            tidx    = MACRO_DOMAIN_INDEX.get(tdomain, -1)
            if tidx >= 0:
                domain_total += 1
                mbits = dev_meta[emp_id]["macro_bits"]
                if tidx < len(mbits) and mbits[tidx] == 1:
                    domain_aligned += 1

        # Difficulty (informational)
        if task_id in task_meta:
            diff_counter[task_meta[task_id]["difficulty"]] += 1

    # --- PRINT ERROR BLOCKS ---------------------------------------------------
    def report_errors(label, lst, limit=5):
        nonlocal errors
        if lst:
            print(f"  FAIL {label}: {len(lst)} error(s)")
            for e in lst[:limit]:
                print(e)
            if len(lst) > limit:
                print(f"    ... ({len(lst) - limit} more)")
            errors += len(lst)
        else:
            print(f"  OK {label}: OK")

    print("\n--- Validation Results ------------------------------------------")

    report_errors("employee_id range [1,100]", emp_errors)
    report_errors("task_id range [1,10000]",   task_errors)
    report_errors("sprint_id derivation",       sprint_errors)
    report_errors("is_fit in {0, 1}",           fit_errors)
    report_errors("delay ? [?5, 30]",          delay_errors)
    report_errors("No duplicate (emp, task) pairs", dup_errors)

    # -- Check 8: Label balance ------------------------------------------------
    pos = is_fit_counter[1]
    neg = is_fit_counter[0]
    pos_pct = pos / total * 100 if total else 0
    neg_pct = neg / total * 100 if total else 0
    print(f"\n  Label Balance (target 65:35):")
    print(f"    is_fit=1 (positive) : {pos:>6,}  ({pos_pct:.1f}%)")
    print(f"    is_fit=0 (negative) : {neg:>6,}  ({neg_pct:.1f}%)")
    if abs(pos_pct - 65.0) > 7.0:
        print(f"  WARN WARNING: is_fit=1 ratio {pos_pct:.1f}% deviates >7% from target 65%")
    else:
        print(f"  OK Label ratio within acceptable range of 65:35")

    # -- Check 9: Sprint coverage ----------------------------------------------
    covered = sorted(sprint_counter.keys())
    missing = [s for s in range(1, 51) if s not in sprint_counter]
    print(f"\n  Sprint Coverage:")
    print(f"    Covered: {len(covered)} / 50 sprints")
    if missing:
        print(f"  FAIL Missing sprints: {missing}")
        errors += len(missing)
    else:
        print(f"  OK All 50 sprints present")

    # -- Check 10: Per-sprint edge distribution ---------------------------------
    counts = [sprint_counter[s] for s in range(1, 51)]
    min_c  = min(counts) if counts else 0
    max_c  = max(counts) if counts else 0
    avg_c  = sum(counts) / len(counts) if counts else 0
    print(f"\n  Per-Sprint Edge Count:")
    print(f"    Min: {min_c}  Max: {max_c}  Avg: {avg_c:.1f}")

    # -- Check 11: Domain alignment --------------------------------------------
    if domain_total > 0:
        align_pct = domain_aligned / domain_total * 100
        print(f"\n  Domain Alignment Rate: {align_pct:.1f}%  "
              f"({domain_aligned:,} / {domain_total:,} edges)")
        if align_pct < 40:
            print("  WARN WARNING: Alignment rate below 40% ? check sampling logic")
        else:
            print(f"  OK Alignment rate healthy (expected 60?75%)")

    # -- Check 12: Delay sanity ------------------------------------------------
    mean_delay_pos = (sum(delays_by_fit[1]) / len(delays_by_fit[1])
                      if delays_by_fit[1] else 0)
    mean_delay_neg = (sum(delays_by_fit[0]) / len(delays_by_fit[0])
                      if delays_by_fit[0] else 0)
    print(f"\n  Completion Delay Sanity:")
    print(f"    Mean delay when is_fit=1 : {mean_delay_pos:+.2f} days")
    print(f"    Mean delay when is_fit=0 : {mean_delay_neg:+.2f} days")
    if mean_delay_pos >= mean_delay_neg:
        print("  WARN WARNING: Fit=1 mean delay not lower than Fit=0 ? check delay logic")
        errors += 1
    else:
        print("  OK Delay ordering correct (fit tasks complete faster)")

    # -- Check 13: Difficulty breakdown ----------------------------------------
    print(f"\n  Edges by Task Difficulty:")
    for diff in ["Easy", "Medium", "Hard"]:
        cnt = diff_counter[diff]
        pct = cnt / total * 100 if total else 0
        print(f"    {diff:>6}: {cnt:>6,}  ({pct:.1f}%)")

    # --- FINAL VERDICT --------------------------------------------------------
    print("\n-----------------------------------------------------------------")
    if errors == 0:
        print(f"  [PASS] VALIDATION PASSED ? {total:,} edges, 0 errors")
    else:
        print(f"  [FAIL] VALIDATION FAILED ? {errors} error(s) found")
    print("-----------------------------------------------------------------")


if __name__ == "__main__":
    validate()
