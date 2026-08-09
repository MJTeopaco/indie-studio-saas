"""
Generates edge_index_dataset.csv — Adjacency Matrix / Edge Index for GNN.
Vaultera Labs — Dynamic Spatial-Temporal Graph Construction.

Run:  python generate_edge_index.py
Output: edge_index_dataset.csv

Schema (6 columns):
  assignment_id        — surrogate PK (auto-increment)
  employee_id          — FK → X_dev node (1–100)
  task_id              — FK → X_task node (1–10000)
  sprint_id            — temporal marker, ceil(task_id / 200), range 1–50
  is_fit               — label tensor / ground truth (0 or 1)
  completion_delay_days — edge attribute tensor (−5 to +30)

Design principles:
  - Scaled Dynamic Model: edge count per task is anchored to task_difficulty.
      Easy   (≤20 hrs)  → exactly 1 edge
      Medium (≤60 hrs)  → 1 or 2 edges
      Hard   (≤120 hrs) → 2, 3, or 4 edges
  - Causal skill-match scoring: is_fit is driven by a normalized overlap
    between the developer's skill_* vector and the task's req_skill_* vector,
    plus a difficulty penalty and a temporal growth bonus for junior developers.
  - 65:35 label balance (is_fit=1 : is_fit=0), enforced via rebalancing nudge.
  - No duplicate (employee_id, task_id) pairs across the entire dataset.
  - Macro-domain biased sampling: developers are preferentially matched to
    tasks in their domain (70% weight), with 30% cross-functional sampling.
  - random.seed(42) for full reproducibility.
"""

import csv
import json
import math
import os
import random

random.seed(42)

# ─── PATHS ───────────────────────────────────────────────────────────────────
_HERE = os.path.dirname(__file__)
DEV_CSV  = os.path.join(_HERE, "developers", "developer_node_features_v2.csv")
TASK_CSV = os.path.join(_HERE, "tasks", "task_node_features_v2.csv")
OUT_CSV  = os.path.join(_HERE, "edge_index_dataset.csv")

# ─── SKILL COUNT (must match both v2 CSVs) ────────────────────────────────────
N_SKILLS = 96  # skill_* columns in developer CSV, req_skill_* in task CSV

# ─── MACRO DOMAIN ORDER ───────────────────────────────────────────────────────
# Matches the bit-vector encoding in developer_node_features_v2.csv:
# [Product Strategy & Mgmt, Web & SaaS, Data Science, DevOps & IT,
#  Hardware & Embedded, UI/UX & Design, Mobile, Game Dev]
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


# ─── LOAD DEVELOPERS ─────────────────────────────────────────────────────────
def load_developers(path: str) -> dict:
    """
    Returns dict keyed by employee_id (int) with:
      skills        → list of 96 int skill ratings (indices 5..100)
      experience    → int (years)
      macro_bits    → list of 8 ints (domain membership flags)
      domain_set    → set of domain indices where macro_bits[i] == 1
    """
    devs = {}
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)

        # Locate skill columns (skill_* prefix), preserving CSV order
        skill_cols = [c for c in fieldnames if c.startswith("skill_")]
        assert len(skill_cols) == N_SKILLS, (
            f"Expected {N_SKILLS} skill cols, found {len(skill_cols)}"
        )

        for row in reader:
            eid = int(row["employee_id"])
            skills = [int(row[c]) for c in skill_cols]
            experience = int(row["experience_years"])

            # Parse macro_domains JSON array, e.g. "[0, 1, 0, 1, 0, 0, 0, 0]"
            raw = row["macro_domains"].strip()
            macro_bits = json.loads(raw)
            domain_set = {i for i, b in enumerate(macro_bits) if b == 1}

            devs[eid] = {
                "skills": skills,
                "experience": experience,
                "macro_bits": macro_bits,
                "domain_set": domain_set,
            }
    print(f"  Loaded {len(devs)} developers from {os.path.basename(path)}")
    return devs


# ─── LOAD TASKS ───────────────────────────────────────────────────────────────
def load_tasks(path: str) -> dict:
    """
    Returns dict keyed by task_id (int) with:
      req_skills    → list of 96 int required-skill ratings (req_skill_* columns)
      difficulty    → str ("Easy", "Medium", "Hard")
      estimated_hours → int
      sprint_id     → int (1–50)
      macro_domain  → str
    """
    tasks = {}
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)

        req_skill_cols = [c for c in fieldnames if c.startswith("req_skill_")]
        assert len(req_skill_cols) == N_SKILLS, (
            f"Expected {N_SKILLS} req_skill cols, found {len(req_skill_cols)}"
        )

        for row in reader:
            tid = int(row["task_id"])
            req_skills = [int(row[c]) for c in req_skill_cols]
            tasks[tid] = {
                "req_skills": req_skills,
                "difficulty": row["task_difficulty"],
                "estimated_hours": int(row["estimated_hours"]),
                "sprint_id": int(row["sprint_id"]),
                "macro_domain": row["macro_domain"],
            }
    print(f"  Loaded {len(tasks)} tasks from {os.path.basename(path)}")
    return tasks


# ─── DYNAMIC DENSITY: edges per task ─────────────────────────────────────────
def sample_n_edges(difficulty: str) -> int:
    """
    Returns the number of developer-task edges to generate for this task,
    anchored strictly to task_difficulty:
      Easy   → exactly 1
      Medium → 1 or 2 (50 / 50)
      Hard   → 2, 3, or 4 (weights: 40 / 35 / 25)
    """
    if difficulty == "Easy":
        return 1
    elif difficulty == "Medium":
        return random.choices([1, 2], weights=[50, 50], k=1)[0]
    else:  # Hard
        return random.choices([2, 3, 4], weights=[40, 35, 25], k=1)[0]


# ─── BIASED DEVELOPER SAMPLING ────────────────────────────────────────────────
def build_candidate_pool(task_macro: str, devs: dict) -> tuple:
    """
    Returns (in_domain_ids, out_domain_ids) lists of developer IDs,
    split by whether the developer's macro_domain bits include the task domain.
    """
    task_domain_idx = MACRO_DOMAIN_INDEX.get(task_macro, -1)
    in_domain, out_domain = [], []
    for eid, d in devs.items():
        if task_domain_idx >= 0 and task_domain_idx in d["domain_set"]:
            in_domain.append(eid)
        else:
            out_domain.append(eid)
    return in_domain, out_domain


def sample_developers(n: int, in_domain: list, out_domain: list,
                      exclude: set) -> list:
    """
    Samples n unique developer IDs not in `exclude`.
    70% weight toward in_domain, 30% toward out_domain.
    Falls back gracefully if a pool is exhausted.
    """
    available_in  = [e for e in in_domain  if e not in exclude]
    available_out = [e for e in out_domain if e not in exclude]
    available_all = available_in + available_out

    if len(available_all) < n:
        # Edge case: not enough developers (shouldn't happen with 100 devs)
        return random.sample(available_all, len(available_all))

    chosen = []
    seen_local = set()

    while len(chosen) < n:
        # Build weighted pool from remaining candidates
        pool = []
        weights = []
        for eid in available_in:
            if eid not in seen_local:
                pool.append(eid)
                weights.append(7)  # 70% weight bucket
        for eid in available_out:
            if eid not in seen_local:
                pool.append(eid)
                weights.append(3)  # 30% weight bucket

        if not pool:
            break

        pick = random.choices(pool, weights=weights, k=1)[0]
        chosen.append(pick)
        seen_local.add(pick)

    return chosen


# ─── CAUSAL SKILL-MATCH SCORING ───────────────────────────────────────────────
def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def compute_is_fit(
    dev_skills: list,
    req_skills: list,
    difficulty: str,
    experience: int,
    sprint_id: int,
) -> int:
    """
    Returns is_fit ∈ {0, 1} via causal probabilistic scoring.

    Steps:
      1. Normalized dot-product match score (0–1)
         match = Σ min(dev_skill, req_skill) / Σ req_skill
      2. Difficulty threshold (the hurdle the match must clear)
      3. Temporal growth bonus — junior developers improve across sprints
      4. Adjusted score → sigmoid probability → Bernoulli sample
    """
    req_total = sum(req_skills)
    if req_total == 0:
        # Task has no skill requirements — trivially a fit
        return 1

    overlap = sum(min(d, r) for d, r in zip(dev_skills, req_skills))
    match_score = overlap / req_total  # range [0, 1]

    # Difficulty thresholds: calibrated so natural rate sits at ~67-70%,
    # allowing the rebalancing nudge to clamp it down to exactly 65%.
    # Lower values = more permissive (more is_fit=1 outcomes).
    thresholds = {"Easy": 0.00, "Medium": 0.06, "Hard": 0.14}
    threshold = thresholds[difficulty]

    # Temporal growth bonus:
    # A sprint-50 junior (exp=1) gets +0.15 boost; a senior (exp>=8) gets ~0.
    # Formula: (sprint_id / 50) * max(0, (8 - experience) / 23)
    growth = (sprint_id / 50) * max(0.0, (8 - experience) / 23.0)

    # Baseline positive bias: ensures natural assignment probability trends
    # toward is_fit=1 (realistic for domain-aligned assignments).
    baseline_bias = 0.06

    adjusted = match_score + growth + baseline_bias - threshold

    # Steepness=5 with wider uncertainty band.
    prob_fit = _sigmoid(5 * adjusted)

    return 1 if random.random() < prob_fit else 0


# --- COMPLETION DELAY --------------------------------------------------------
def completion_delay(is_fit: int, difficulty: str) -> int:
    """
    Returns completion_delay_days:
      is_fit=1 -> mostly on-time or early (negative = ahead of schedule)
      is_fit=0 -> significant delays scaled by task complexity
    """
    if is_fit == 1:
        ranges = {"Easy": (-3, 3), "Medium": (-2, 5), "Hard": (-1, 7)}
    else:
        ranges = {"Easy": (3, 12), "Medium": (6, 20), "Hard": (10, 30)}
    lo, hi = ranges[difficulty]
    return random.randint(lo, hi)


# --- LABEL BALANCE REBALANCING NUDGE -----------------------------------------
TARGET_POS_RATIO = 0.65  # 65% is_fit=1
NUDGE_WARMUP     = 200   # edges before nudge activates
NUDGE_TOLERANCE  = 0.02  # tight band: keeps ratio within 63-67%


def should_nudge_toward(pos_count: int, total: int) -> "int | None":
    """
    Returns 1 if we should force a positive (to correct under-representation),
    Returns 0 if we should force a negative, or None if within tolerance.
    """
    if total == 0:
        return None
    current_ratio = pos_count / total
    if current_ratio < (TARGET_POS_RATIO - NUDGE_TOLERANCE):
        return 1   # too few positives — nudge toward 1
    if current_ratio > (TARGET_POS_RATIO + NUDGE_TOLERANCE):
        return 0   # too many positives — nudge toward 0
    return None


# ─── MAIN GENERATION ─────────────────────────────────────────────────────────
def generate(devs: dict, tasks: dict) -> list:
    """
    Generates all (developer, task) edge rows using the Scaled Dynamic Model.

    Returns list of dicts with keys:
      assignment_id, employee_id, task_id, sprint_id, is_fit, completion_delay_days
    """
    edges = []
    seen_pairs: set = set()    # global dedup: (employee_id, task_id)
    pos_count = 0              # running count of is_fit=1
    assignment_id = 1

    all_task_ids = sorted(tasks.keys())
    total_tasks = len(all_task_ids)

    print(f"  Generating edges for {total_tasks} tasks ...")

    for i, task_id in enumerate(all_task_ids):
        t = tasks[task_id]
        difficulty  = t["difficulty"]
        sprint_id   = t["sprint_id"]
        req_skills  = t["req_skills"]
        macro_domain = t["macro_domain"]

        n_edges = sample_n_edges(difficulty)

        # Build candidate pools for this task's domain
        in_domain, out_domain = build_candidate_pool(macro_domain, devs)

        # Track which devs are already assigned to this task
        assigned_this_task: set = set()

        sampled_devs = sample_developers(
            n_edges, in_domain, out_domain,
            exclude=assigned_this_task,  # only task-level exclusion here;
                                          # global dedup handled below
        )

        for eid in sampled_devs:
            pair = (eid, task_id)
            if pair in seen_pairs:
                continue  # skip — global duplicate
            seen_pairs.add(pair)
            assigned_this_task.add(eid)

            d = devs[eid]

            # ── Label rebalancing nudge (checked every edge after warmup) ──
            total_so_far = len(edges)
            nudge = None
            if total_so_far >= NUDGE_WARMUP:
                nudge = should_nudge_toward(pos_count, total_so_far)

            if nudge is not None:
                is_fit = nudge
            else:
                is_fit = compute_is_fit(
                    d["skills"], req_skills,
                    difficulty, d["experience"], sprint_id,
                )

            delay = completion_delay(is_fit, difficulty)
            pos_count += is_fit

            edges.append({
                "assignment_id":          assignment_id,
                "employee_id":            eid,
                "task_id":                task_id,
                "sprint_id":              sprint_id,
                "is_fit":                 is_fit,
                "completion_delay_days":  delay,
            })
            assignment_id += 1

        # Progress report every 1000 tasks
        if (i + 1) % 1000 == 0:
            ratio = pos_count / len(edges) if edges else 0
            print(f"    [{i+1:>5}/{total_tasks}] edges so far: {len(edges):>6} | "
                  f"is_fit=1 ratio: {ratio:.2%}")

    return edges


# ─── WRITE CSV ────────────────────────────────────────────────────────────────
HEADER = [
    "assignment_id",
    "employee_id",
    "task_id",
    "sprint_id",
    "is_fit",
    "completion_delay_days",
]


def write_csv(edges: list, out_path: str):
    # Sort by sprint_id then task_id for clean temporal ordering
    edges_sorted = sorted(edges, key=lambda r: (r["sprint_id"], r["task_id"]))

    # Re-number assignment_id after sort
    for i, row in enumerate(edges_sorted, 1):
        row["assignment_id"] = i

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=HEADER)
        writer.writeheader()
        writer.writerows(edges_sorted)

    print(f"  Written {len(edges_sorted)} rows to {os.path.basename(out_path)}")
    return edges_sorted


# --- INLINE SUMMARY ----------------------------------------------------------
def print_summary(edges: list):
    total = len(edges)
    pos = sum(1 for e in edges if e["is_fit"] == 1)
    neg = total - pos

    delays_pos = [e["completion_delay_days"] for e in edges if e["is_fit"] == 1]
    delays_neg = [e["completion_delay_days"] for e in edges if e["is_fit"] == 0]
    mean_pos = sum(delays_pos) / len(delays_pos) if delays_pos else 0
    mean_neg = sum(delays_neg) / len(delays_neg) if delays_neg else 0

    sprints = sorted({e["sprint_id"] for e in edges})

    print("\n--- Edge Index Summary ----------------------------------------------")
    print(f"  Total edges         : {total:,}")
    print(f"  Unique (dev, task)  : {len({(e['employee_id'], e['task_id']) for e in edges}):,}")
    print(f"  is_fit = 1 (pos)    : {pos:,}  ({pos/total:.1%})")
    print(f"  is_fit = 0 (neg)    : {neg:,}  ({neg/total:.1%})")
    print(f"  Mean delay (fit=1)  : {mean_pos:.2f} days")
    print(f"  Mean delay (fit=0)  : {mean_neg:.2f} days")
    print(f"  Sprints covered     : {len(sprints)} / 50  "
          f"(min={min(sprints)}, max={max(sprints)})")
    print("--------------------------------------------------------------------")


# ─── ENTRY POINT ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Loading node feature matrices ...")
    devs  = load_developers(DEV_CSV)
    tasks = load_tasks(TASK_CSV)

    print("\nRunning Scaled Dynamic Model edge generation ...")
    edges = generate(devs, tasks)

    print("\nWriting edge_index_dataset.csv ...")
    edges_sorted = write_csv(edges, OUT_CSV)

    print_summary(edges_sorted)

    # Spot-check: first 10 rows
    print("\nSpot-check (first 10 edges):")
    print(f"  {'asgn_id':>8}  {'emp_id':>6}  {'task_id':>7}  "
          f"{'sprint':>6}  {'is_fit':>6}  {'delay':>5}")
    for e in edges_sorted[:10]:
        print(f"  {e['assignment_id']:>8}  {e['employee_id']:>6}  "
              f"{e['task_id']:>7}  {e['sprint_id']:>6}  "
              f"{e['is_fit']:>6}  {e['completion_delay_days']:>5}")
