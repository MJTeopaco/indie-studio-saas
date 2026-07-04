"""
Validates task_node_features.csv — Task Node Feature Matrix (X_task).
Run: python validate_task_dataset.py
"""

import csv

PATH = r"e:\PROGRAMMING\Thesis\Project\indie-studio-saas\ml-engine\data\task_node_features.csv"

EXPECTED_ROWS = 5000
EXPECTED_COLS = 85

VALID_CLASSIFICATIONS = [
    "Data Pre-processing & Pipeline Engineering",
    "Model Training & Fine-Tuning",
    "LLM Prompt Engineering & RAG Integration",
    "Algorithm Evaluation & Benchmarking",
    "System Architecture Design",
    "Feature Implementation",
    "Algorithm Optimization & Refactoring",
    "Bug Resolution & Hotfixing",
    "Client-Based Environment Provisioning",
    "Container Orchestration & Deployment",
    "CI/CD Pipeline Maintenance",
    "Security Auditing & Penetration Testing",
    "Hardware Sensor Integration & Calibration",
    "Game Engine Logic & Asset Integration",
    "UI/UX Prototyping & Wireframing",
    "Unit & Integration Testing",
    "Load & Stress Testing",
    "Peer Code Review",
]

VALID_DIFFICULTIES = {"Easy", "Medium", "Hard"}
VALID_PRIORITIES = {"Low", "Medium", "High", "Critical"}

CLASSIFICATION_MACRO = {
    "Data Pre-processing & Pipeline Engineering": "Data Science & Predictive Modeling",
    "Model Training & Fine-Tuning": "Data Science & Predictive Modeling",
    "LLM Prompt Engineering & RAG Integration": "Data Science & Predictive Modeling",
    "Algorithm Evaluation & Benchmarking": "Data Science & Predictive Modeling",
    "System Architecture Design": "Web & SaaS Platforms",
    "Feature Implementation": "Web & SaaS Platforms",
    "Algorithm Optimization & Refactoring": "Web & SaaS Platforms",
    "Bug Resolution & Hotfixing": "Web & SaaS Platforms",
    "Client-Based Environment Provisioning": "DevOps & IT Infrastructure",
    "Container Orchestration & Deployment": "DevOps & IT Infrastructure",
    "CI/CD Pipeline Maintenance": "DevOps & IT Infrastructure",
    "Security Auditing & Penetration Testing": "DevOps & IT Infrastructure",
    "Hardware Sensor Integration & Calibration": "Hardware Prototyping & Embedded Systems",
    "Game Engine Logic & Asset Integration": "Game Development & Interactive Media",
    "UI/UX Prototyping & Wireframing": "UI/UX & Digital Asset Design",
    "Unit & Integration Testing": "Web & SaaS Platforms",
    "Load & Stress Testing": "DevOps & IT Infrastructure",
    "Peer Code Review": "Web & SaaS Platforms",
}

print(f"Reading: {PATH}")
rows = []
fieldnames = []

try:
    with open(PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []
        for row in reader:
            rows.append(row)
except FileNotFoundError:
    print("ERROR: File not found. Run generate_task_dataset.py first.")
    raise SystemExit(1)

skill_cols = [c for c in fieldnames if c.startswith("req_skill_")]
print(f"Rows loaded : {len(rows)}")
print(f"Columns     : {len(fieldnames)}")
print(f"Skill cols  : {len(skill_cols)}")
print()

errors = 0

# ── 1. Row count ──────────────────────────────────────────────────────────────
if len(rows) != EXPECTED_ROWS:
    print(f"FAIL row count: got {len(rows)}, expected {EXPECTED_ROWS}")
    errors += 1
else:
    print(f"PASS row count: {len(rows)}")

# ── 2. Column count ───────────────────────────────────────────────────────────
if len(fieldnames) != EXPECTED_COLS:
    print(f"FAIL column count: got {len(fieldnames)}, expected {EXPECTED_COLS}")
    errors += 1
else:
    print(f"PASS column count: {len(fieldnames)}")

# ── 3. Skill sparsity: exactly 1–4 non-zero req_skill_* per row ───────────────
sparse_errors = []
for r in rows:
    tid = r["task_id"]
    nz = sum(1 for c in skill_cols if int(r[c]) > 0)
    if not (1 <= nz <= 4):
        sparse_errors.append(f"  task {tid}: {nz} non-zero skills (expected 1–4)")
print(f"{'PASS' if not sparse_errors else 'FAIL'} sparsity (1–4 non-zero skills): "
      f"{len(sparse_errors)} violation(s)")
for e in sparse_errors[:10]:
    print(e)
if len(sparse_errors) > 10:
    print(f"  ... and {len(sparse_errors) - 10} more")
errors += len(sparse_errors)

# ── 4. Skill range 0–5 ───────────────────────────────────────────────────────
range_errors = []
for r in rows:
    tid = r["task_id"]
    for c in skill_cols:
        v = int(r[c])
        if not (0 <= v <= 5):
            range_errors.append(f"  task {tid} {c}={v}")
print(f"{'PASS' if not range_errors else 'FAIL'} skill range [0–5]: "
      f"{len(range_errors)} violation(s)")
errors += len(range_errors)

# ── 5. estimated_hours range 1–120 ────────────────────────────────────────────
hour_errors = []
for r in rows:
    h = int(r["estimated_hours"])
    if not (1 <= h <= 120):
        hour_errors.append(f"  task {r['task_id']}: hours={h}")
print(f"{'PASS' if not hour_errors else 'FAIL'} estimated_hours [1–120]: "
      f"{len(hour_errors)} violation(s)")
errors += len(hour_errors)

# ── 6. days_until_deadline range 1–60 ────────────────────────────────────────
deadline_errors = []
for r in rows:
    d = int(r["days_until_deadline"])
    if not (1 <= d <= 60):
        deadline_errors.append(f"  task {r['task_id']}: days={d}")
print(f"{'PASS' if not deadline_errors else 'FAIL'} days_until_deadline [1–60]: "
      f"{len(deadline_errors)} violation(s)")
errors += len(deadline_errors)

# ── 7. Predecessor IDs strictly < task_id ────────────────────────────────────
pred_errors = []
for r in rows:
    tid = int(r["task_id"])
    pred_str = r["predecessor_tasks"]
    if pred_str != "None":
        try:
            pids = [int(p.strip()) for p in pred_str.split(",")]
            for pid in pids:
                if pid >= tid:
                    pred_errors.append(f"  task {tid}: predecessor {pid} >= task_id")
        except ValueError:
            pred_errors.append(f"  task {tid}: malformed predecessor '{pred_str}'")
print(f"{'PASS' if not pred_errors else 'FAIL'} predecessor IDs < task_id: "
      f"{len(pred_errors)} violation(s)")
for e in pred_errors[:10]:
    print(e)
errors += len(pred_errors)

# ── 8. ~40% None predecessors ────────────────────────────────────────────────
none_count = sum(1 for r in rows if r["predecessor_tasks"] == "None")
none_pct = none_count / len(rows) * 100
ok = 35.0 <= none_pct <= 45.0
print(f"{'PASS' if ok else 'WARN'} predecessor_tasks=None: "
      f"{none_count} ({none_pct:.1f}%) — target 35%–45%")

# ── 9. Classification → macro_domain consistency (all rows) ──────────────────
macro_errors = []
for r in rows:
    cls = r["task_classification"]
    macro = r["macro_domain"]
    expected = CLASSIFICATION_MACRO.get(cls)
    if expected and macro != expected:
        macro_errors.append(
            f"  task {r['task_id']}: cls='{cls}' -> macro='{macro}' (expected '{expected}')"
        )
print(f"{'PASS' if not macro_errors else 'FAIL'} classification->macro consistency: "
      f"{len(macro_errors)} violation(s)")
for e in macro_errors[:5]:
    print(e)
errors += len(macro_errors)

# -- 10. Valid categorical values ---------------------------------------------
cat_errors = []
for r in rows:
    if r["task_classification"] not in VALID_CLASSIFICATIONS:
        cat_errors.append(f"  task {r['task_id']}: unknown classification '{r['task_classification']}'")
    if r["task_difficulty"] not in VALID_DIFFICULTIES:
        cat_errors.append(f"  task {r['task_id']}: unknown difficulty '{r['task_difficulty']}'")
    if r["priority"] not in VALID_PRIORITIES:
        cat_errors.append(f"  task {r['task_id']}: unknown priority '{r['priority']}'")
print(f"{'PASS' if not cat_errors else 'FAIL'} categorical values valid: "
      f"{len(cat_errors)} violation(s)")
errors += len(cat_errors)

# -- 11. Distribution summary --------------------------------------------------
print()
print("Classification distribution:")
from collections import Counter
cls_counts = Counter(r["task_classification"] for r in rows)
for cls in VALID_CLASSIFICATIONS:
    print(f"  {cls:<55}: {cls_counts.get(cls, 0):>4}")

print()
diff_counts = Counter(r["task_difficulty"] for r in rows)
print("Difficulty distribution:")
for d in ["Easy", "Medium", "Hard"]:
    print(f"  {d:<8}: {diff_counts[d]:>4} ({diff_counts[d]/len(rows)*100:.1f}%)")

print()
pri_counts = Counter(r["priority"] for r in rows)
print("Priority distribution:")
for p in ["Low", "Medium", "High", "Critical"]:
    print(f"  {p:<8}: {pri_counts[p]:>4} ({pri_counts[p]/len(rows)*100:.1f}%)")

# -- Result --------------------------------------------------------------------
print("\n" + "-" * 55)
if errors == 0:
    print(f"ALL CHECKS PASSED  ({len(rows)} rows, {len(fieldnames)} columns)")
else:
    print(f"VALIDATION FAILED -- {errors} total error(s)")
print("-" * 55)
