"""
Generates task_node_features.csv — Task Node Feature Matrix (X_task) for GNN.
Run: python generate_task_dataset.py
Output: task_node_features.csv (5000 rows, 87 columns)

Constraints enforced:
  - Anchor variable: task_classification dictates macro_domain, micro_domain, and
    which req_skill_* columns can be non-zero.
  - Skill sparsity: exactly 1–4 skills are non-zero per row (rest are 0).
  - Skill rating: 1–5 (weighted by task_difficulty).
  - Predecessor logic: ~40% None, ~60% have 1–3 strictly-lower predecessor IDs.
    Dependency-type rules applied for Testing, Deployment, Evaluation tasks.
  - Time realism: estimated_hours uses overlapping ranges by difficulty.
  - random.seed(42) for full reproducibility.
"""

import csv
import os
import random

random.seed(42)

# ─── SKILLS (75 total, exactly matching SkillsSeeder.php order) ───────────────
SKILLS = [
    # Languages (15)
    "PHP", "Python", "JavaScript", "TypeScript", "Go", "Rust",
    "C#", "C++", "Java", "Kotlin", "Swift", "Ruby", "Dart", "Lua", "R",
    # Frameworks (14)
    "Laravel", "React", "Vue.js", "Next.js", "Nuxt.js", "Angular", "Svelte",
    "Django", "FastAPI", "Flask", "Spring Boot", "Ruby on Rails", "Express.js", "NestJS",
    # Mobile (4)
    "Flutter", "React Native", "Android (Native)", "iOS (Native)",
    # Databases (11)
    "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "Elasticsearch",
    "Firebase", "Supabase", "Pinecone", "Milvus", "ChromaDB",
    # DevOps (11)
    "Docker", "Kubernetes", "GitHub Actions", "AWS", "Google Cloud", "Azure",
    "Terraform", "Nginx", "Linux", "MLflow", "Ollama",
    # Game Engines (3)
    "Unity", "Unreal Engine", "Godot",
    # Design (4)
    "Figma", "Adobe XD", "Blender", "Photoshop",
    # Testing (5)
    "PHPUnit", "Jest", "Cypress", "Selenium", "Pest",
    # Data & ML (9)
    "TensorFlow", "PyTorch", "scikit-learn", "Pandas", "NumPy",
    "LangChain", "LlamaIndex", "Hugging Face", "Keras",
]

SKILL_INDEX = {s: i for i, s in enumerate(SKILLS)}

# ─── MACRO DOMAINS (from MacroDomainsSeeder.php) ──────────────────────────────
MACRO_DOMAINS = {
    "Web & SaaS Platforms": [
        "Full-Stack Development",
        "REST API Architecture",
        "GraphQL API Design",
        "E-Commerce Systems",
        "Portal & Dashboard Development",
        "Database Architecture",
        "Headless CMS Integration",
        "Real-Time Web (WebSockets)",
    ],
    "Game Development & Interactive Media": [
        "Unity Development",
        "Unreal Engine Development",
        "Godot Development",
        "Game Physics Programming",
        "Procedural Content Generation",
        "Multiplayer & Netcode",
        "Game UI/HUD Design",
        "Interactive 3D Environments",
    ],
    "Data Science & Predictive Modeling": [
        "Machine Learning (Supervised)",
        "Machine Learning (Unsupervised)",
        "Natural Language Processing",
        "Time-Series Forecasting",
        "Data Analytics & Visualization",
        "Statistical Modeling",
        "Computer Vision",
        "Data Pipeline Engineering",
        "LLM Fine-Tuning & Prompt Engineering",
        "RAG (Retrieval-Augmented Generation)",
        "Vector Databases (Pinecone/Milvus)",
    ],
    "Hardware Prototyping & Embedded Systems": [
        "Microcontroller Programming (Arduino/ESP32)",
        "Sensor Integration & IoT",
        "Robotics & Actuator Control",
        "Haptic Feedback Systems",
        "PCB Design & Prototyping",
        "Real-Time Operating Systems (RTOS)",
        "Low-Power Embedded Design",
    ],
    "UI/UX & Digital Asset Design": [
        "UX Research & Wireframing",
        "User Interface Design (Figma)",
        "Vector Graphics (Illustrator)",
        "Raster Editing (Photoshop)",
        "Motion Design & Animation",
        "Brand Identity Design",
        "Accessibility Design (WCAG)",
        "Conversational UI/UX Design",
    ],
    "Mobile Application Development": [
        "Native iOS (Swift/SwiftUI)",
        "Native Android (Kotlin)",
        "Flutter (Cross-Platform)",
        "React Native (Cross-Platform)",
        "Mobile UI/UX Patterns",
        "App Store Optimization",
        "Offline-First Mobile Architecture",
    ],
    "DevOps & IT Infrastructure": [
        "Cloud Deployment (AWS)",
        "Cloud Deployment (GCP)",
        "Cloud Deployment (Azure)",
        "CI/CD Pipeline Design",
        "Containerization (Docker/Kubernetes)",
        "Cybersecurity & Hardening",
        "Infrastructure as Code (Terraform)",
        "Site Reliability Engineering",
        "MLOps & Model Deployment",
        "AI Agent Orchestration (LangChain)",
    ],
}

# ─── CLASSIFICATION DEFINITION TABLE ─────────────────────────────────────────
# Each entry:
#   macro:      macro domain name
#   micros:     list of valid micro-domains for this classification
#   skill_pool: list of skills that CAN be non-zero for this classification
#   primary:    "anchor" skills — always include at least one (the rest are fillers)
#               Each sub-list is a mutually-exclusive primary skill group
#               (the generator picks ONE primary from these randomly)
#   hours:      (min, max) per difficulty — Easy, Medium, Hard
#   dep_type:   what dependency type this task acts as (for predecessor logic)
#   needs_dep:  if True, at least one predecessor MUST be from dep_requires types
#   dep_requires: list of dep_type strings that must appear in predecessor set

CLASSIFICATION_CONFIG = {
    "Data Pre-processing & Pipeline Engineering": {
        "macro": "Data Science & Predictive Modeling",
        "micros": [
            "Data Pipeline Engineering",
            "Data Analytics & Visualization",
            "Machine Learning (Supervised)",
            "Machine Learning (Unsupervised)",
            "Time-Series Forecasting",
        ],
        "skill_pool": [
            "Python", "Pandas", "NumPy", "scikit-learn",
            "PostgreSQL", "MongoDB", "Redis", "MySQL",
            "Elasticsearch", "SQLite",
        ],
        "primary": [["Python"], ["Pandas", "NumPy"]],
        "hours": {"Easy": (2, 16), "Medium": (8, 40), "Hard": (24, 80)},
        "dep_type": "data_pipeline",
        "needs_dep": False,
        "dep_requires": [],
    },
    "Model Training & Fine-Tuning": {
        "macro": "Data Science & Predictive Modeling",
        "micros": [
            "Machine Learning (Supervised)",
            "Machine Learning (Unsupervised)",
            "Natural Language Processing",
            "Computer Vision",
            "LLM Fine-Tuning & Prompt Engineering",
        ],
        "skill_pool": [
            "Python", "TensorFlow", "PyTorch", "Keras",
            "Hugging Face", "scikit-learn", "MLflow", "NumPy", "Pandas",
        ],
        "primary": [["PyTorch"], ["TensorFlow"], ["Keras"]],
        "hours": {"Easy": (4, 20), "Medium": (16, 60), "Hard": (40, 120)},
        "dep_type": "model_training",
        "needs_dep": False,
        "dep_requires": [],
    },
    "LLM Prompt Engineering & RAG Integration": {
        "macro": "Data Science & Predictive Modeling",
        "micros": [
            "LLM Fine-Tuning & Prompt Engineering",
            "RAG (Retrieval-Augmented Generation)",
            "Vector Databases (Pinecone/Milvus)",
            "Natural Language Processing",
            "AI Agent Orchestration (LangChain)",
        ],
        "skill_pool": [
            "Python", "LangChain", "LlamaIndex", "Hugging Face",
            "Pinecone", "Milvus", "ChromaDB", "Ollama", "FastAPI",
        ],
        "primary": [["LangChain"], ["LlamaIndex"], ["Hugging Face"]],
        "hours": {"Easy": (2, 12), "Medium": (8, 32), "Hard": (20, 72)},
        "dep_type": "llm_rag",
        "needs_dep": False,
        "dep_requires": [],
    },
    "Algorithm Evaluation & Benchmarking": {
        "macro": "Data Science & Predictive Modeling",
        "micros": [
            "Machine Learning (Supervised)",
            "Machine Learning (Unsupervised)",
            "Statistical Modeling",
            "Natural Language Processing",
            "Computer Vision",
            "Data Analytics & Visualization",
        ],
        "skill_pool": [
            "Python", "scikit-learn", "Pandas", "NumPy",
            "R", "TensorFlow", "PyTorch", "Keras", "MLflow",
        ],
        "primary": [["Python"], ["R"]],
        "hours": {"Easy": (2, 14), "Medium": (8, 36), "Hard": (24, 80)},
        "dep_type": "evaluation",
        "needs_dep": True,
        "dep_requires": ["model_training", "llm_rag"],
    },
    "System Architecture Design": {
        "macro": "Web & SaaS Platforms",
        "micros": [
            "REST API Architecture",
            "GraphQL API Design",
            "Database Architecture",
            "Full-Stack Development",
            "Real-Time Web (WebSockets)",
        ],
        "skill_pool": [
            "PHP", "Python", "Go", "TypeScript", "Java",
            "PostgreSQL", "Redis", "Docker", "Kubernetes", "AWS",
        ],
        "primary": [["Go"], ["Python"], ["PHP"]],
        "hours": {"Easy": (4, 18), "Medium": (12, 48), "Hard": (32, 100)},
        "dep_type": "architecture",
        "needs_dep": False,
        "dep_requires": [],
    },
    "Feature Implementation": {
        "macro": "Web & SaaS Platforms",
        "micros": [
            "Full-Stack Development",
            "REST API Architecture",
            "Portal & Dashboard Development",
            "E-Commerce Systems",
            "Headless CMS Integration",
            "Real-Time Web (WebSockets)",
        ],
        "skill_pool": [
            "PHP", "Python", "JavaScript", "TypeScript",
            "Laravel", "React", "Vue.js", "Next.js", "NestJS",
            "PostgreSQL", "MySQL", "Redis",
        ],
        "primary": [["PHP", "Laravel"], ["TypeScript", "React"], ["JavaScript", "Vue.js"]],
        "hours": {"Easy": (2, 16), "Medium": (8, 40), "Hard": (24, 80)},
        "dep_type": "feature",
        "needs_dep": False,
        "dep_requires": [],
    },
    "Algorithm Optimization & Refactoring": {
        "macro": "Web & SaaS Platforms",
        "micros": [
            "Full-Stack Development",
            "REST API Architecture",
            "Database Architecture",
            "GraphQL API Design",
        ],
        "skill_pool": [
            "Python", "Go", "Rust", "C++", "Java",
            "PostgreSQL", "Redis", "TypeScript",
        ],
        "primary": [["Python"], ["Go"], ["Rust"], ["C++"]],
        "hours": {"Easy": (2, 14), "Medium": (8, 36), "Hard": (20, 80)},
        "dep_type": "refactor",
        "needs_dep": False,
        "dep_requires": [],
    },
    "Bug Resolution & Hotfixing": {
        "macro": "Web & SaaS Platforms",
        "micros": [
            "Full-Stack Development",
            "REST API Architecture",
            "Database Architecture",
            "E-Commerce Systems",
            "Portal & Dashboard Development",
        ],
        "skill_pool": [
            "PHP", "Python", "JavaScript", "TypeScript",
            "Laravel", "React", "MySQL", "PostgreSQL", "Redis",
        ],
        "primary": [["PHP", "Laravel"], ["Python"], ["TypeScript", "React"]],
        "hours": {"Easy": (1, 8), "Medium": (4, 20), "Hard": (8, 48)},
        "dep_type": "bugfix",
        "needs_dep": False,
        "dep_requires": [],
    },
    "Client-Based Environment Provisioning": {
        "macro": "DevOps & IT Infrastructure",
        "micros": [
            "Cloud Deployment (AWS)",
            "Cloud Deployment (GCP)",
            "Cloud Deployment (Azure)",
            "Containerization (Docker/Kubernetes)",
            "Infrastructure as Code (Terraform)",
        ],
        "skill_pool": [
            "Docker", "Kubernetes", "AWS", "Google Cloud", "Azure",
            "Terraform", "Linux", "GitHub Actions",
        ],
        "primary": [["AWS"], ["Google Cloud"], ["Azure"]],
        "hours": {"Easy": (2, 12), "Medium": (6, 30), "Hard": (16, 64)},
        "dep_type": "provisioning",
        "needs_dep": False,
        "dep_requires": [],
    },
    "Container Orchestration & Deployment": {
        "macro": "DevOps & IT Infrastructure",
        "micros": [
            "Containerization (Docker/Kubernetes)",
            "CI/CD Pipeline Design",
            "MLOps & Model Deployment",
            "Cloud Deployment (AWS)",
            "Cloud Deployment (GCP)",
        ],
        "skill_pool": [
            "Docker", "Kubernetes", "GitHub Actions", "AWS",
            "Google Cloud", "Nginx", "Linux", "Terraform",
        ],
        "primary": [["Docker", "Kubernetes"]],
        "hours": {"Easy": (2, 14), "Medium": (8, 36), "Hard": (20, 80)},
        "dep_type": "deployment",
        "needs_dep": True,
        "dep_requires": ["feature", "ci_cd", "model_training"],
    },
    "CI/CD Pipeline Maintenance": {
        "macro": "DevOps & IT Infrastructure",
        "micros": [
            "CI/CD Pipeline Design",
            "Containerization (Docker/Kubernetes)",
            "Cloud Deployment (AWS)",
            "Site Reliability Engineering",
            "Infrastructure as Code (Terraform)",
        ],
        "skill_pool": [
            "GitHub Actions", "Docker", "Kubernetes", "AWS",
            "Linux", "Terraform", "Python", "Go",
        ],
        "primary": [["GitHub Actions"]],
        "hours": {"Easy": (2, 12), "Medium": (6, 28), "Hard": (16, 60)},
        "dep_type": "ci_cd",
        "needs_dep": False,
        "dep_requires": [],
    },
    "Security Auditing & Penetration Testing": {
        "macro": "DevOps & IT Infrastructure",
        "micros": [
            "Cybersecurity & Hardening",
            "Infrastructure as Code (Terraform)",
            "Site Reliability Engineering",
            "Cloud Deployment (AWS)",
            "Cloud Deployment (Azure)",
        ],
        "skill_pool": [
            "Python", "Go", "Rust", "Linux",
            "AWS", "Azure", "Kubernetes", "Docker",
        ],
        "primary": [["Python"], ["Go"], ["Rust"]],
        "hours": {"Easy": (4, 16), "Medium": (12, 40), "Hard": (24, 80)},
        "dep_type": "security",
        "needs_dep": False,
        "dep_requires": [],
    },
    "Hardware Sensor Integration & Calibration": {
        "macro": "Hardware Prototyping & Embedded Systems",
        "micros": [
            "Microcontroller Programming (Arduino/ESP32)",
            "Sensor Integration & IoT",
            "Robotics & Actuator Control",
            "Haptic Feedback Systems",
            "Real-Time Operating Systems (RTOS)",
            "Low-Power Embedded Design",
        ],
        # Primary language randomly chosen from C++, Python, Rust per row
        # (see build_row logic below — hardware_primary is sampled there)
        "skill_pool": [
            "C++", "Python", "Rust",           # primary embedded languages
            "C++", "Python", "Rust",            # duplicated for sampling weight
            "PostgreSQL", "MongoDB", "Redis",   # optional data sinks
        ],
        "primary": [["C++"], ["Python"], ["Rust"]],
        "hours": {"Easy": (2, 14), "Medium": (8, 40), "Hard": (24, 100)},
        "dep_type": "hardware",
        "needs_dep": False,
        "dep_requires": [],
    },
    "Game Engine Logic & Asset Integration": {
        "macro": "Game Development & Interactive Media",
        "micros": [
            "Unity Development",
            "Unreal Engine Development",
            "Godot Development",
            "Game Physics Programming",
            "Procedural Content Generation",
            "Multiplayer & Netcode",
            "Game UI/HUD Design",
            "Interactive 3D Environments",
        ],
        "skill_pool": [
            "C#", "C++", "Lua",
            "Unity", "Unreal Engine", "Godot", "Blender",
        ],
        "primary": [["C#", "Unity"], ["C++", "Unreal Engine"], ["Lua", "Godot"]],
        "hours": {"Easy": (3, 16), "Medium": (10, 40), "Hard": (24, 100)},
        "dep_type": "game",
        "needs_dep": False,
        "dep_requires": [],
    },
    "UI/UX Prototyping & Wireframing": {
        "macro": "UI/UX & Digital Asset Design",
        "micros": [
            "UX Research & Wireframing",
            "User Interface Design (Figma)",
            "Motion Design & Animation",
            "Brand Identity Design",
            "Accessibility Design (WCAG)",
            "Conversational UI/UX Design",
        ],
        "skill_pool": [
            "Figma", "Adobe XD", "Photoshop", "Blender",
            "JavaScript", "TypeScript",
        ],
        "primary": [["Figma"], ["Adobe XD"]],
        "hours": {"Easy": (2, 10), "Medium": (6, 24), "Hard": (16, 60)},
        "dep_type": "ux",
        "needs_dep": False,
        "dep_requires": [],
    },
    "Unit & Integration Testing": {
        "macro": "Web & SaaS Platforms",
        "micros": [
            "Full-Stack Development",
            "REST API Architecture",
            "Portal & Dashboard Development",
            "Database Architecture",
        ],
        "skill_pool": [
            "PHP", "Python", "JavaScript", "TypeScript",
            "PHPUnit", "Jest", "Cypress", "Selenium", "Pest",
        ],
        "primary": [["PHPUnit", "PHP"], ["Jest", "TypeScript"], ["Cypress", "JavaScript"]],
        "hours": {"Easy": (1, 10), "Medium": (4, 24), "Hard": (12, 56)},
        "dep_type": "unit_test",
        "needs_dep": True,
        "dep_requires": ["feature", "bugfix", "refactor"],
    },
    "Load & Stress Testing": {
        "macro": "DevOps & IT Infrastructure",
        "micros": [
            "Site Reliability Engineering",
            "Cloud Deployment (AWS)",
            "Containerization (Docker/Kubernetes)",
            "CI/CD Pipeline Design",
        ],
        "skill_pool": [
            "Python", "Go", "Linux",
            "Docker", "AWS", "Kubernetes", "GitHub Actions",
        ],
        "primary": [["Python"], ["Go"]],
        "hours": {"Easy": (2, 12), "Medium": (6, 28), "Hard": (16, 64)},
        "dep_type": "load_test",
        "needs_dep": True,
        "dep_requires": ["feature", "deployment", "ci_cd"],
    },
    "Peer Code Review": {
        "macro": "Web & SaaS Platforms",
        "micros": [
            "Full-Stack Development",
            "REST API Architecture",
            "Database Architecture",
            "Portal & Dashboard Development",
            "GraphQL API Design",
        ],
        "skill_pool": [
            "PHP", "Python", "JavaScript", "TypeScript", "Go",
        ],
        "primary": [["PHP"], ["Python"], ["TypeScript"], ["Go"]],
        "hours": {"Easy": (1, 6), "Medium": (2, 12), "Hard": (6, 24)},
        "dep_type": "review",
        "needs_dep": False,
        "dep_requires": [],
    },
}

CLASSIFICATIONS = list(CLASSIFICATION_CONFIG.keys())

# Approximate distribution weights for classifications (roughly balanced with slight variation)
CLASSIFICATION_WEIGHTS = [
    280,  # Data Pre-processing & Pipeline Engineering
    280,  # Model Training & Fine-Tuning
    270,  # LLM Prompt Engineering & RAG Integration
    260,  # Algorithm Evaluation & Benchmarking
    270,  # System Architecture Design
    290,  # Feature Implementation
    270,  # Algorithm Optimization & Refactoring
    290,  # Bug Resolution & Hotfixing
    270,  # Client-Based Environment Provisioning
    270,  # Container Orchestration & Deployment
    270,  # CI/CD Pipeline Maintenance
    260,  # Security Auditing & Penetration Testing
    270,  # Hardware Sensor Integration & Calibration
    280,  # Game Engine Logic & Asset Integration
    275,  # UI/UX Prototyping & Wireframing
    290,  # Unit & Integration Testing
    265,  # Load & Stress Testing
    270,  # Peer Code Review
]

DIFFICULTIES = ["Easy", "Medium", "Hard"]
DIFFICULTY_WEIGHTS = [25, 45, 30]

PRIORITIES = ["Low", "Medium", "High", "Critical"]
PRIORITY_WEIGHTS = [10, 35, 40, 15]


def pick_skill_rating(difficulty: str, is_primary: bool) -> int:
    """
    Return a 1–5 skill requirement rating.
    Primary skills lean toward 3–5, secondary toward 1–4.
    Difficulty shifts the distribution up for Hard tasks.
    """
    if difficulty == "Easy":
        pool = [1, 2, 2, 3, 3] if not is_primary else [2, 3, 3, 4]
    elif difficulty == "Medium":
        pool = [2, 2, 3, 3, 4] if not is_primary else [3, 3, 4, 4, 5]
    else:  # Hard
        pool = [2, 3, 4, 4] if not is_primary else [3, 4, 4, 5, 5]
    return random.choice(pool)


def pick_hours(difficulty: str, lo: int, hi: int) -> int:
    """Sample hours from the overlapping range with a slight bell-curve effect."""
    # Weighted toward the middle of the range
    mid = (lo + hi) // 2
    candidates = [
        random.randint(lo, hi),
        random.randint(lo, hi),
        random.randint(max(lo, mid - 6), min(hi, mid + 10)),
    ]
    return random.choice(candidates)


def build_skill_vector(classification: str, difficulty: str) -> list:
    """
    Returns a list of 75 ints (0–5), with exactly 1–4 non-zero values.
    The skills that are non-zero are drawn from the classification's skill_pool.
    At least one primary skill group member must be non-zero.
    """
    cfg = CLASSIFICATION_CONFIG[classification]
    pool = list(dict.fromkeys(cfg["skill_pool"]))  # deduplicate preserving order
    primary_groups = cfg["primary"]

    vector = [0] * 76

    # Choose number of required skills: 1–4
    n_skills = random.randint(1, 4)

    # Always pick one primary skill group first
    chosen_primary_group = random.choice(primary_groups)
    # From the chosen primary group, pick 1 or all if n_skills allows
    primary_picks = chosen_primary_group[:min(len(chosen_primary_group), n_skills)]
    chosen_skills = list(primary_picks)

    # Fill remaining slots with random non-primary skills from the pool
    remaining_pool = [s for s in pool if s not in chosen_skills]
    random.shuffle(remaining_pool)
    slots_left = n_skills - len(chosen_skills)
    if slots_left > 0 and remaining_pool:
        extra_picks = remaining_pool[:slots_left]
        chosen_skills.extend(extra_picks)

    # Assign ratings
    for skill in chosen_skills:
        if skill not in SKILL_INDEX:
            continue
        is_primary = skill in chosen_primary_group
        rating = pick_skill_rating(difficulty, is_primary)
        vector[SKILL_INDEX[skill]] = rating

    return vector


def build_predecessor_str(
    task_id: int,
    classification: str,
    dep_type_by_id: dict,
    none_count: int,
    total_target_none: int,
) -> str:
    """
    Returns predecessor_tasks string: "None" or "id1, id2, ...".

    Rules:
      - First 50 tasks always None.
      - ~40% of all tasks are None (tracked via none_count).
      - For tasks that need a specific predecessor type, search backwards
        for a matching task ID.
      - Predecessor IDs are always strictly < task_id.
    """
    cfg = CLASSIFICATION_CONFIG[classification]
    needs_dep = cfg["needs_dep"]
    dep_requires = cfg["dep_requires"]

    if task_id <= 50:
        return "None"

    # Decide whether this task is None
    remaining = 5000 - task_id + 1
    none_remaining = total_target_none - none_count
    # Force None if we still need to fill quota and few tasks remain
    force_none = none_remaining >= remaining
    # Force predecessor if quota is already filled
    force_pred = none_remaining <= 0

    if not force_pred and (force_none or random.random() < 0.40):
        return "None"

    # Build predecessor list
    available_ids = list(range(1, task_id))

    # If the classification requires a specific dep_type predecessor
    if needs_dep and dep_requires:
        # Find candidates with matching dep_type
        typed_candidates = [
            i for i in available_ids
            if dep_type_by_id.get(i) in dep_requires
        ]
        if typed_candidates:
            # Always include one matching predecessor
            anchor = random.choice(typed_candidates)
            n_extra = random.randint(0, 2)
            extra = random.sample(
                [i for i in available_ids if i != anchor],
                min(n_extra, len(available_ids) - 1),
            )
            predecessors = sorted(set([anchor] + extra))
            return ", ".join(str(p) for p in predecessors)

    # General predecessor: 1–3 random lower IDs
    n_pred = random.randint(1, min(3, len(available_ids)))
    # Bias toward recent tasks (last 20% of available IDs) for realism
    recent_cutoff = max(1, task_id - max(50, task_id // 5))
    recent_ids = [i for i in available_ids if i >= recent_cutoff]
    if recent_ids and random.random() < 0.7:
        sample_pool = recent_ids
    else:
        sample_pool = available_ids

    chosen = sorted(random.sample(sample_pool, min(n_pred, len(sample_pool))))
    return ", ".join(str(p) for p in chosen)


# ─── HEADER ──────────────────────────────────────────────────────────────────
HEADER = (
    ["task_id", "task_classification", "task_difficulty", "priority",
     "macro_domain", "micro_domain"]
    + [f"req_skill_{s}" for s in SKILLS]
    + ["estimated_hours", "days_until_deadline", "predecessor_tasks"]
)

assert len(HEADER) == 85, f"Header has {len(HEADER)} columns, expected 85"


# ─── MAIN GENERATION LOOP ────────────────────────────────────────────────────
def generate(n: int = 5000) -> list:
    rows = []
    dep_type_by_id = {}          # task_id -> dep_type string
    none_count = 0               # tracks how many "None" predecessors assigned
    total_target_none = int(n * 0.40)  # ~40% = 2000

    # Pre-sample classifications to control distribution
    sampled_classifications = random.choices(
        CLASSIFICATIONS, weights=CLASSIFICATION_WEIGHTS, k=n
    )

    for task_id in range(1, n + 1):
        classification = sampled_classifications[task_id - 1]
        cfg = CLASSIFICATION_CONFIG[classification]

        difficulty = random.choices(DIFFICULTIES, weights=DIFFICULTY_WEIGHTS, k=1)[0]
        priority = random.choices(PRIORITIES, weights=PRIORITY_WEIGHTS, k=1)[0]

        macro_domain = cfg["macro"]
        micro_domain = random.choice(cfg["micros"])

        skill_vector = build_skill_vector(classification, difficulty)

        # Hours: pick from difficulty-appropriate overlapping range
        lo, hi = cfg["hours"][difficulty]
        estimated_hours = pick_hours(difficulty, lo, hi)

        days_until_deadline = random.randint(1, 60)

        predecessor_str = build_predecessor_str(
            task_id, classification, dep_type_by_id, none_count, total_target_none
        )
        if predecessor_str == "None":
            none_count += 1

        dep_type_by_id[task_id] = cfg["dep_type"]

        row = (
            [task_id, classification, difficulty, priority, macro_domain, micro_domain]
            + skill_vector
            + [estimated_hours, days_until_deadline, predecessor_str]
        )

        assert len(row) == 85, (
            f"Row {task_id} has {len(row)} fields (expected 85)"
        )
        rows.append(row)

    return rows


# ─── WRITE ───────────────────────────────────────────────────────────────────
def write_csv(rows: list, out_path: str):
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
        writer.writerow(HEADER)
        for row in rows:
            writer.writerow(row)
    print(f"Written {len(rows)} rows to {out_path}")


# ─── INLINE VALIDATION ───────────────────────────────────────────────────────
def validate(rows: list):
    skill_cols_start = 6
    skill_cols_end = 82  # indices 6..81 are the 76 req_skill_* columns

    errors = 0

    for row in rows:
        tid = row[0]

        # Field count
        if len(row) != 85:
            print(f"  ERROR task {tid}: {len(row)} fields (expected 85)")
            errors += 1
            continue

        skills = row[skill_cols_start:skill_cols_end]
        nonzero = [v for v in skills if v > 0]

        # Sparsity: 1–4 non-zero skills
        if not (1 <= len(nonzero) <= 4):
            print(f"  ERROR task {tid}: {len(nonzero)} non-zero skills (expected 1–4)")
            errors += 1

        # Skill range 0–5
        for v in skills:
            if not (0 <= v <= 5):
                print(f"  ERROR task {tid}: skill value {v} out of range [0,5]")
                errors += 1

        # Hours range
        hours = row[82]
        if not (1 <= hours <= 120):
            print(f"  ERROR task {tid}: hours={hours} out of range [1,120]")
            errors += 1

        # Deadline range
        deadline = row[83]
        if not (1 <= deadline <= 60):
            print(f"  ERROR task {tid}: deadline={deadline} out of range [1,60]")
            errors += 1

        # Predecessor IDs all < task_id
        pred_str = row[84]
        if pred_str != "None":
            try:
                pred_ids = [int(p.strip()) for p in pred_str.split(",")]
                for pid in pred_ids:
                    if pid >= tid:
                        print(f"  ERROR task {tid}: predecessor {pid} >= task_id")
                        errors += 1
            except ValueError:
                print(f"  ERROR task {tid}: malformed predecessor_tasks='{pred_str}'")
                errors += 1

    none_count = sum(1 for row in rows if row[84] == "None")
    none_pct = none_count / len(rows) * 100
    print("\n  Summary:")
    print(f"    Total rows : {len(rows)}")
    print(f"    None preds : {none_count} ({none_pct:.1f}%) -- target ~40%")
    print(f"    Total errs : {errors}")

    if errors == 0:
        print("  VALIDATION PASSED")
    else:
        print(f"  VALIDATION FAILED -- {errors} error(s)")


# ─── ENTRY POINT ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    out_path = os.path.join(os.path.dirname(__file__), "task_node_features.csv")

    print("Generating 5,000 task rows ...")
    rows = generate(5000)

    print("Running inline validation ...")
    validate(rows)

    print("Writing CSV ...")
    write_csv(rows, out_path)

    # Spot-check classification→macro consistency for first 20 rows
    print("\nSpot-check (first 20 rows -- classification -> macro_domain):")
    for row in rows[:20]:
        tid, cls, diff, pri, macro, micro = row[:6]
        expected_macro = CLASSIFICATION_CONFIG[cls]["macro"]
        status = "OK" if macro == expected_macro else "FAIL"
        print(f"  [{status}] task {tid:>4}: {cls[:42]:<42} | {macro}")
