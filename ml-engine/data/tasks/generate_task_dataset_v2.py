"""
Generates task_node_features_v2.csv — Task Node Feature Matrix (X_task) for GNN.
Run: python generate_task_dataset_v2.py
Output: task_node_features_v2.csv (10,000 rows, 106 columns)

Constraints enforced:
  - Anchor variable: task_classification dictates macro_domain, micro_domain, and
    which req_skill_* columns can be non-zero.
  - 22 task classifications mapped across 8 macro-domains.
  - Skill sparsity: exactly 1–4 skills are non-zero per row out of 96 skills (rest are 0).
  - Skill rating: 1–5 (weighted by task_difficulty).
  - Predecessor logic: ~40% None, ~60% have 1–3 strictly-lower predecessor IDs.
    Sprint 1 tasks (1-200) are always None. Recent dependency bias applied.
  - Time realism: estimated_hours uses overlapping ranges by difficulty.
  - 50 Sprints (200 tasks per sprint) — sprint_id column added.
  - random.seed(42) for full reproducibility.
"""

import csv
import math
import os
import random

random.seed(42)

# ─── SKILLS (96 total, exactly matching SkillsSeeder.php v2 order) ───────────
SKILLS = [
    # Languages (15)
    "PHP", "Python", "JavaScript", "TypeScript", "Go", "Rust",
    "C#", "C++", "Java", "Kotlin", "Swift", "Ruby", "Dart", "Lua", "R",
    # Web Frameworks (14)
    "Laravel", "React", "Vue.js", "Next.js", "Nuxt.js", "Angular", "Svelte",
    "Django", "FastAPI", "Flask", "Spring Boot", "Ruby on Rails", "Express.js", "NestJS",
    # Mobile (4)
    "Flutter", "React Native", "Android (Native)", "iOS (Native)",
    # Databases (11)
    "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "Elasticsearch",
    "Firebase", "Supabase", "Pinecone", "Milvus", "ChromaDB",
    # DevOps, Cloud & MLOps (12)
    "Docker", "Kubernetes", "Git", "AWS", "Google Cloud", "Azure",
    "Cloudflare", "Terraform", "Nginx", "Linux", "MLflow", "Ollama",
    # Game Engines (3)
    "Unity", "Unreal Engine", "Godot",
    # Design & Creative (4)
    "Figma", "Adobe XD", "Blender", "Photoshop",
    # Testing & QA (5)
    "PHPUnit", "Jest", "Cypress", "Selenium", "Pest",
    # Data & AI / ML (9)
    "TensorFlow", "PyTorch", "scikit-learn", "Pandas", "NumPy",
    "LangChain", "LlamaIndex", "Hugging Face", "Keras",
    # Professional & ADLC (8)
    "Strategic Leadership", "Business Development", "Financial Management",
    "Project Management", "Academic Research", "Partnership Management",
    "Digital Marketing", "Legal & Compliance",
    # APIs & Integration (11)
    "REST APIs", "GraphQL", "gRPC", "WebSockets",
    "OpenAI API", "Anthropic API", "ElevenLabs API", "Hugging Face APIs",
    "Stripe API", "Twilio API", "OAuth / Auth0",
]

SKILL_INDEX = {s: i for i, s in enumerate(SKILLS)}

# ─── MACRO DOMAINS (from updated MacroDomainsSeeder.php) ─────────────────────
MACRO_DOMAINS = {
    "Product Strategy & Management": [
        "Requirements Gathering & Business Analysis",
        "Agile / Scrum Sprint Planning",
        "Market Viability & User Research",
        "Technical Documentation & PRDs",
        "Product Roadmap Architecture",
    ],
    "Web & SaaS Platforms": [
        "Full-Stack Development",
        "Microservices & API Architecture",
        "Third-Party API Integrations (Stripe, Twilio)",
        "GraphQL API Design",
        "Multi-Tenant SaaS Architecture",
        "E-Commerce Systems",
        "Portal & Dashboard Development",
        "Database Architecture",
        "Real-Time Web (WebSockets)",
    ],
    "Data Science & Predictive Modeling": [
        "Machine Learning (Supervised & Unsupervised)",
        "Natural Language Processing & Computer Vision",
        "Data Pipeline Engineering",
        "LLM Fine-Tuning & Prompt Engineering",
        "RAG (Retrieval-Augmented Generation)",
        "Vector Databases (Pinecone/Milvus)",
        "Algorithm Evaluation & Benchmarking",
    ],
    "DevOps & IT Infrastructure": [
        "Cloud Deployment (AWS/GCP/Azure)",
        "CI/CD Pipeline Design",
        "Containerization (Docker/Kubernetes)",
        "DevSecOps & Continuous Security",
        "Infrastructure as Code (Terraform)",
        "MLOps & Model Deployment",
        "AI Agent Orchestration (LangChain)",
    ],
    "Hardware Prototyping & Embedded Systems": [
        "Microcontroller Programming (Arduino/ESP32)",
        "Sensor Integration & IoT",
        "Hardware-in-the-Loop (HIL) Testing",
        "Robotics & Actuator Control",
        "PCB Design & Prototyping",
        "Real-Time Operating Systems (RTOS)",
    ],
    "UI/UX & Digital Asset Design": [
        "UX Research & Wireframing",
        "User Interface Design (Figma)",
        "System Mechanics Planning",
        "Motion Design & Animation",
        "Conversational UI/UX Design",
    ],
    "Mobile Application Development": [
        "Native iOS (Swift/SwiftUI)",
        "Native Android (Kotlin)",
        "Flutter / React Native (Cross-Platform)",
        "Offline-First Mobile Architecture",
    ],
    "Game Development & Interactive Media": [
        "Unity / Unreal / Godot Development",
        "Game Physics & Netcode",
        "Procedural Content Generation",
        "Interactive 3D Environments",
    ],
}

# ─── CLASSIFICATION DEFINITION TABLE (22 categories) ─────────────────────────
CLASSIFICATION_CONFIG = {
    "Product Requirements & Analysis": {
        "macro": "Product Strategy & Management",
        "micros": [
            "Requirements Gathering & Business Analysis",
            "Technical Documentation & PRDs",
            "Product Roadmap Architecture",
        ],
        "skill_pool": [
            "Project Management", "Business Development", "Strategic Leadership",
            "REST APIs", "Financial Management", "Partnership Management", "Legal & Compliance",
        ],
        "primary": [["Project Management"], ["Business Development"], ["Strategic Leadership"]],
        "hours": {"Easy": (4, 16), "Medium": (12, 40), "Hard": (24, 80)},
        "dep_type": "product_req",
        "needs_dep": False,
        "dep_requires": [],
    },
    "Sprint & Roadmap Planning": {
        "macro": "Product Strategy & Management",
        "micros": [
            "Agile / Scrum Sprint Planning",
            "Product Roadmap Architecture",
            "Requirements Gathering & Business Analysis",
        ],
        "skill_pool": [
            "Project Management", "Strategic Leadership", "Business Development",
            "Financial Management", "Git",
        ],
        "primary": [["Project Management"], ["Strategic Leadership"]],
        "hours": {"Easy": (2, 10), "Medium": (6, 24), "Hard": (16, 60)},
        "dep_type": "sprint_planning",
        "needs_dep": True,
        "dep_requires": ["product_req", "market_research"],
    },
    "Market Viability Research": {
        "macro": "Product Strategy & Management",
        "micros": [
            "Market Viability & User Research",
            "Requirements Gathering & Business Analysis",
            "Product Roadmap Architecture",
        ],
        "skill_pool": [
            "Academic Research", "Business Development", "Digital Marketing",
            "Partnership Management", "Strategic Leadership", "Financial Management",
        ],
        "primary": [["Academic Research"], ["Business Development"], ["Digital Marketing"]],
        "hours": {"Easy": (8, 24), "Medium": (16, 60), "Hard": (40, 100)},
        "dep_type": "market_research",
        "needs_dep": False,
        "dep_requires": [],
    },
    "Data Pre-processing & Pipeline Engineering": {
        "macro": "Data Science & Predictive Modeling",
        "micros": [
            "Data Pipeline Engineering",
            "Machine Learning (Supervised & Unsupervised)",
            "Vector Databases (Pinecone/Milvus)",
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
            "Machine Learning (Supervised & Unsupervised)",
            "Natural Language Processing & Computer Vision",
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
            "Natural Language Processing & Computer Vision",
        ],
        "skill_pool": [
            "Python", "LangChain", "LlamaIndex", "Hugging Face",
            "Pinecone", "Milvus", "ChromaDB", "Ollama", "OpenAI API", "Anthropic API",
            "ElevenLabs API", "Hugging Face APIs",
        ],
        "primary": [["LangChain"], ["LlamaIndex"], ["Hugging Face"], ["ElevenLabs API"], ["Hugging Face APIs"]],
        "hours": {"Easy": (2, 12), "Medium": (8, 32), "Hard": (20, 72)},
        "dep_type": "llm_rag",
        "needs_dep": False,
        "dep_requires": [],
    },
    "Algorithm Evaluation & Benchmarking": {
        "macro": "Data Science & Predictive Modeling",
        "micros": [
            "Algorithm Evaluation & Benchmarking",
            "Machine Learning (Supervised & Unsupervised)",
            "Natural Language Processing & Computer Vision",
        ],
        "skill_pool": [
            "Python", "scikit-learn", "Pandas", "NumPy",
            "R", "TensorFlow", "PyTorch", "Keras", "MLflow", "Academic Research",
        ],
        "primary": [["Python"], ["R"], ["scikit-learn"]],
        "hours": {"Easy": (2, 14), "Medium": (8, 36), "Hard": (24, 80)},
        "dep_type": "evaluation",
        "needs_dep": True,
        "dep_requires": ["model_training", "llm_rag"],
    },
    "System Architecture Design": {
        "macro": "Web & SaaS Platforms",
        "micros": [
            "Microservices & API Architecture",
            "Multi-Tenant SaaS Architecture",
            "GraphQL API Design",
            "Database Architecture",
            "Real-Time Web (WebSockets)",
        ],
        "skill_pool": [
            "PHP", "Python", "Go", "TypeScript", "Java", "Ruby",
            "PostgreSQL", "Redis", "Docker", "Kubernetes", "AWS", "REST APIs", "GraphQL",
            "Spring Boot", "Django", "Ruby on Rails", "Firebase", "Supabase", "Express.js",
        ],
        "primary": [["Go"], ["Python"], ["PHP"], ["TypeScript"], ["Java", "Spring Boot"], ["Ruby", "Ruby on Rails"]],
        "hours": {"Easy": (4, 18), "Medium": (12, 48), "Hard": (32, 100)},
        "dep_type": "architecture",
        "needs_dep": False,
        "dep_requires": [],
    },
    "Feature Implementation": {
        "macro": "Web & SaaS Platforms",
        "micros": [
            "Full-Stack Development",
            "Microservices & API Architecture",
            "Portal & Dashboard Development",
            "E-Commerce Systems",
            "Real-Time Web (WebSockets)",
            "Multi-Tenant SaaS Architecture",
        ],
        "skill_pool": [
            "PHP", "Python", "JavaScript", "TypeScript", "Kotlin", "Swift", "Ruby", "Dart",
            "Laravel", "React", "Vue.js", "Next.js", "Nuxt.js", "Angular", "Svelte",
            "Django", "FastAPI", "Flask", "Spring Boot", "Ruby on Rails", "Express.js", "NestJS",
            "Flutter", "React Native", "Android (Native)", "iOS (Native)",
            "PostgreSQL", "MySQL", "Redis", "REST APIs", "Firebase", "Supabase",
        ],
        "primary": [
            ["PHP", "Laravel"], ["TypeScript", "React"], ["JavaScript", "Vue.js"], ["Python", "FastAPI"],
            ["Python", "Django"], ["Python", "Flask"], ["Ruby", "Ruby on Rails"], ["Java", "Spring Boot"],
            ["TypeScript", "Angular"], ["JavaScript", "Svelte"], ["Vue.js", "Nuxt.js"], ["TypeScript", "Express.js"],
            ["Flutter", "Dart"], ["React Native", "TypeScript"], ["Android (Native)", "Kotlin"], ["iOS (Native)", "Swift"],
        ],
        "hours": {"Easy": (2, 16), "Medium": (8, 40), "Hard": (24, 80)},
        "dep_type": "feature",
        "needs_dep": False,
        "dep_requires": [],
    },
    "Algorithm Optimization & Refactoring": {
        "macro": "Web & SaaS Platforms",
        "micros": [
            "Full-Stack Development",
            "Microservices & API Architecture",
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
            "Microservices & API Architecture",
            "Database Architecture",
            "E-Commerce Systems",
            "Portal & Dashboard Development",
        ],
        "skill_pool": [
            "PHP", "Python", "JavaScript", "TypeScript", "Kotlin", "Swift", "Ruby", "Dart",
            "Laravel", "React", "Vue.js", "Next.js", "Nuxt.js", "Angular", "Svelte",
            "Django", "FastAPI", "Flask", "Spring Boot", "Ruby on Rails", "Express.js", "NestJS",
            "Flutter", "React Native", "Android (Native)", "iOS (Native)",
            "MySQL", "PostgreSQL", "Redis", "Git", "Firebase", "Supabase",
        ],
        "primary": [
            ["PHP", "Laravel"], ["Python", "Django"], ["TypeScript", "React"], ["JavaScript", "Vue.js"],
            ["Flutter", "Dart"], ["React Native", "TypeScript"], ["Android (Native)", "Kotlin"], ["iOS (Native)", "Swift"],
        ],
        "hours": {"Easy": (1, 8), "Medium": (4, 20), "Hard": (8, 48)},
        "dep_type": "bugfix",
        "needs_dep": False,
        "dep_requires": [],
    },
    "Third-Party API Setup": {
        "macro": "Web & SaaS Platforms",
        "micros": [
            "Third-Party API Integrations (Stripe, Twilio)",
            "Microservices & API Architecture",
            "Full-Stack Development",
            "E-Commerce Systems",
        ],
        "skill_pool": [
            "REST APIs", "GraphQL", "gRPC", "WebSockets",
            "Stripe API", "Twilio API", "OAuth / Auth0", "OpenAI API",
            "ElevenLabs API", "Hugging Face APIs",
            "TypeScript", "Python", "JavaScript", "PHP", "Express.js", "NestJS", "FastAPI", "Firebase", "Supabase",
        ],
        "primary": [
            ["REST APIs", "Stripe API"], ["REST APIs", "Twilio API"], ["OAuth / Auth0"], ["GraphQL"],
            ["ElevenLabs API"], ["Hugging Face APIs"], ["Firebase"], ["Supabase"],
        ],
        "hours": {"Easy": (2, 12), "Medium": (6, 28), "Hard": (16, 64)},
        "dep_type": "api_setup",
        "needs_dep": False,
        "dep_requires": [],
    },
    "Client-Based Environment Provisioning": {
        "macro": "DevOps & IT Infrastructure",
        "micros": [
            "Cloud Deployment (AWS/GCP/Azure)",
            "Containerization (Docker/Kubernetes)",
            "Infrastructure as Code (Terraform)",
        ],
        "skill_pool": [
            "Docker", "Kubernetes", "AWS", "Google Cloud", "Azure",
            "Terraform", "Linux", "Git", "Cloudflare",
        ],
        "primary": [["AWS"], ["Google Cloud"], ["Azure"], ["Terraform"]],
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
            "Cloud Deployment (AWS/GCP/Azure)",
        ],
        "skill_pool": [
            "Docker", "Kubernetes", "Git", "AWS",
            "Google Cloud", "Nginx", "Linux", "Terraform", "Cloudflare",
        ],
        "primary": [["Docker", "Kubernetes"]],
        "hours": {"Easy": (2, 14), "Medium": (8, 36), "Hard": (20, 80)},
        "dep_type": "deployment",
        "needs_dep": True,
        "dep_requires": ["feature", "api_setup", "model_training"],
    },
    "DevSecOps & Security Auditing": {
        "macro": "DevOps & IT Infrastructure",
        "micros": [
            "DevSecOps & Continuous Security",
            "Infrastructure as Code (Terraform)",
            "Cloud Deployment (AWS/GCP/Azure)",
        ],
        "skill_pool": [
            "Python", "Go", "Rust", "Linux",
            "AWS", "Azure", "Kubernetes", "Docker", "Legal & Compliance", "Cloudflare",
        ],
        "primary": [["Python"], ["Go"], ["Rust"], ["Linux"]],
        "hours": {"Easy": (4, 16), "Medium": (12, 40), "Hard": (24, 80)},
        "dep_type": "security",
        "needs_dep": False,
        "dep_requires": [],
    },
    "Hardware-in-the-Loop Testing": {
        "macro": "Hardware Prototyping & Embedded Systems",
        "micros": [
            "Hardware-in-the-Loop (HIL) Testing",
            "Real-Time Operating Systems (RTOS)",
            "Robotics & Actuator Control",
            "Sensor Integration & IoT",
        ],
        "skill_pool": [
            "C++", "Python", "Rust", "Linux", "Docker", "PostgreSQL",
        ],
        "primary": [["C++"], ["Python"], ["Rust"]],
        "hours": {"Easy": (4, 16), "Medium": (12, 48), "Hard": (24, 96)},
        "dep_type": "hil_testing",
        "needs_dep": True,
        "dep_requires": ["hardware"],
    },
    "Hardware Sensor Integration": {
        "macro": "Hardware Prototyping & Embedded Systems",
        "micros": [
            "Microcontroller Programming (Arduino/ESP32)",
            "Sensor Integration & IoT",
            "Robotics & Actuator Control",
            "PCB Design & Prototyping",
            "Real-Time Operating Systems (RTOS)",
        ],
        "skill_pool": [
            "C++", "Python", "Rust",
            "C++", "Python", "Rust",
            "PostgreSQL", "MongoDB", "Redis",
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
            "Unity / Unreal / Godot Development",
            "Game Physics & Netcode",
            "Procedural Content Generation",
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
    "System Mechanics Planning": {
        "macro": "UI/UX & Digital Asset Design",
        "micros": [
            "System Mechanics Planning",
            "UX Research & Wireframing",
            "User Interface Design (Figma)",
            "Conversational UI/UX Design",
        ],
        "skill_pool": [
            "Figma", "Adobe XD", "Project Management", "Strategic Leadership", "Blender",
        ],
        "primary": [["Figma"], ["Project Management"], ["Strategic Leadership"]],
        "hours": {"Easy": (4, 14), "Medium": (8, 30), "Hard": (20, 70)},
        "dep_type": "system_mechanics",
        "needs_dep": False,
        "dep_requires": [],
    },
    "Unit & Integration Testing": {
        "macro": "Web & SaaS Platforms",
        "micros": [
            "Full-Stack Development",
            "Microservices & API Architecture",
            "Portal & Dashboard Development",
            "Database Architecture",
        ],
        "skill_pool": [
            "PHP", "Python", "JavaScript", "TypeScript", "Kotlin", "Swift", "Ruby", "Dart",
            "PHPUnit", "Jest", "Cypress", "Selenium", "Pest", "Git",
            "Flutter", "React Native", "Android (Native)", "iOS (Native)",
        ],
        "primary": [["PHPUnit", "PHP"], ["Jest", "TypeScript"], ["Cypress", "JavaScript"]],
        "hours": {"Easy": (1, 10), "Medium": (4, 24), "Hard": (12, 56)},
        "dep_type": "unit_test",
        "needs_dep": True,
        "dep_requires": ["feature", "bugfix", "refactor", "api_setup"],
    },
    "Peer Code Review": {
        "macro": "Web & SaaS Platforms",
        "micros": [
            "Full-Stack Development",
            "Microservices & API Architecture",
            "Database Architecture",
            "Portal & Dashboard Development",
            "GraphQL API Design",
        ],
        "skill_pool": [
            "PHP", "Python", "JavaScript", "TypeScript", "Go", "Rust", "Kotlin", "Swift", "Ruby", "Dart", "C#", "C++", "Java", "Git",
        ],
        "primary": [["PHP"], ["Python"], ["TypeScript"], ["Go"], ["Rust"], ["Java"], ["C#"], ["Kotlin"], ["Swift"]],
        "hours": {"Easy": (1, 6), "Medium": (2, 12), "Hard": (6, 24)},
        "dep_type": "review",
        "needs_dep": False,
        "dep_requires": [],
    },
}

CLASSIFICATIONS = list(CLASSIFICATION_CONFIG.keys())

# Distribution weights summing to 10,000 across 22 categories
CLASSIFICATION_WEIGHTS = [
    420,  # Product Requirements & Analysis
    420,  # Sprint & Roadmap Planning
    400,  # Market Viability Research
    480,  # Data Pre-processing & Pipeline Engineering
    480,  # Model Training & Fine-Tuning
    480,  # LLM Prompt Engineering & RAG Integration
    430,  # Algorithm Evaluation & Benchmarking
    460,  # System Architecture Design
    520,  # Feature Implementation
    450,  # Algorithm Optimization & Refactoring
    500,  # Bug Resolution & Hotfixing
    460,  # Third-Party API Setup
    450,  # Client-Based Environment Provisioning
    460,  # Container Orchestration & Deployment
    450,  # DevSecOps & Security Auditing
    420,  # Hardware-in-the-Loop Testing
    450,  # Hardware Sensor Integration
    450,  # Game Engine Logic & Asset Integration
    450,  # UI/UX Prototyping & Wireframing
    420,  # System Mechanics Planning
    500,  # Unit & Integration Testing
    450,  # Peer Code Review
]

DIFFICULTIES = ["Easy", "Medium", "Hard"]
DIFFICULTY_WEIGHTS = [20, 45, 35]

PRIORITIES = ["Low", "Medium", "High", "Critical"]
PRIORITY_WEIGHTS = [8, 32, 42, 18]


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
    mid = (lo + hi) // 2
    candidates = [
        random.randint(lo, hi),
        random.randint(lo, hi),
        random.randint(max(lo, mid - 6), min(hi, mid + 10)),
    ]
    return random.choice(candidates)


def build_skill_vector(classification: str, difficulty: str) -> list:
    """
    Returns a list of 96 ints (0–5), with exactly 1–4 non-zero values.
    The skills that are non-zero are drawn from the classification's skill_pool.
    At least one primary skill group member must be non-zero.
    """
    cfg = CLASSIFICATION_CONFIG[classification]
    pool = list(dict.fromkeys(cfg["skill_pool"]))
    primary_groups = cfg["primary"]

    vector = [0] * len(SKILLS)

    n_skills = random.randint(1, 4)

    chosen_primary_group = random.choice(primary_groups)
    primary_picks = chosen_primary_group[:min(len(chosen_primary_group), n_skills)]
    chosen_skills = list(primary_picks)

    remaining_pool = [s for s in pool if s not in chosen_skills]
    random.shuffle(remaining_pool)
    slots_left = n_skills - len(chosen_skills)
    if slots_left > 0 and remaining_pool:
        extra_picks = remaining_pool[:slots_left]
        chosen_skills.extend(extra_picks)

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
      - First 200 tasks (Sprint 1) always None.
      - ~40% of all tasks are None (tracked via none_count).
      - For tasks that need a specific predecessor type, search backwards
        for a matching task ID.
      - Predecessor IDs are always strictly < task_id.
    """
    cfg = CLASSIFICATION_CONFIG[classification]
    needs_dep = cfg["needs_dep"]
    dep_requires = cfg["dep_requires"]

    if task_id <= 200:
        return "None"

    remaining = 10000 - task_id + 1
    none_remaining = total_target_none - none_count
    force_none = none_remaining >= remaining
    force_pred = none_remaining <= 0

    if not force_pred and (force_none or random.random() < 0.40):
        return "None"

    available_ids = list(range(1, task_id))

    if needs_dep and dep_requires:
        typed_candidates = [
            i for i in available_ids
            if dep_type_by_id.get(i) in dep_requires
        ]
        if typed_candidates:
            anchor = random.choice(typed_candidates)
            n_extra = random.randint(0, 2)
            extra = random.sample(
                [i for i in available_ids if i != anchor],
                min(n_extra, len(available_ids) - 1),
            )
            predecessors = sorted(set([anchor] + extra))
            return ", ".join(str(p) for p in predecessors)

    n_pred = random.randint(1, min(3, len(available_ids)))
    recent_cutoff = max(1, task_id - 300)
    recent_ids = [i for i in available_ids if i >= recent_cutoff]
    if recent_ids and random.random() < 0.7:
        sample_pool = recent_ids
    else:
        sample_pool = available_ids

    chosen = sorted(random.sample(sample_pool, min(n_pred, len(sample_pool))))
    return ", ".join(str(p) for p in chosen)


# ─── HEADER ──────────────────────────────────────────────────────────────────
HEADER = (
    ["task_id", "sprint_id", "task_classification", "task_difficulty", "priority",
     "macro_domain", "micro_domain"]
    + [f"req_skill_{s}" for s in SKILLS]
    + ["estimated_hours", "days_until_deadline", "predecessor_tasks"]
)

assert len(HEADER) == 106, f"Header has {len(HEADER)} columns, expected 106"


# ─── MAIN GENERATION LOOP ────────────────────────────────────────────────────
def generate(n: int = 10000) -> list:
    rows = []
    dep_type_by_id = {}
    none_count = 0
    total_target_none = int(n * 0.40)  # ~40% = 4000

    sampled_classifications = random.choices(
        CLASSIFICATIONS, weights=CLASSIFICATION_WEIGHTS, k=n
    )

    for task_id in range(1, n + 1):
        sprint_id = math.ceil(task_id / 200)
        classification = sampled_classifications[task_id - 1]
        cfg = CLASSIFICATION_CONFIG[classification]

        difficulty = random.choices(DIFFICULTIES, weights=DIFFICULTY_WEIGHTS, k=1)[0]
        priority = random.choices(PRIORITIES, weights=PRIORITY_WEIGHTS, k=1)[0]

        macro_domain = cfg["macro"]
        micro_domain = random.choice(cfg["micros"])

        skill_vector = build_skill_vector(classification, difficulty)

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
            [task_id, sprint_id, classification, difficulty, priority, macro_domain, micro_domain]
            + skill_vector
            + [estimated_hours, days_until_deadline, predecessor_str]
        )

        assert len(row) == 106, (
            f"Row {task_id} has {len(row)} fields (expected 106)"
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
    skill_cols_start = 7
    skill_cols_end = 103  # indices 7..102 are the 96 req_skill_* columns

    errors = 0

    for row in rows:
        tid = row[0]

        if len(row) != 106:
            print(f"  ERROR task {tid}: {len(row)} fields (expected 106)")
            errors += 1
            continue

        sprint_id = row[1]
        expected_sprint = math.ceil(tid / 200)
        if sprint_id != expected_sprint:
            print(f"  ERROR task {tid}: sprint_id={sprint_id} expected={expected_sprint}")
            errors += 1

        skills = row[skill_cols_start:skill_cols_end]
        nonzero = [v for v in skills if v > 0]

        if not (1 <= len(nonzero) <= 4):
            print(f"  ERROR task {tid}: {len(nonzero)} non-zero skills (expected 1–4)")
            errors += 1

        for v in skills:
            if not (0 <= v <= 5):
                print(f"  ERROR task {tid}: skill value {v} out of range [0,5]")
                errors += 1

        hours = row[103]
        if not (1 <= hours <= 120):
            print(f"  ERROR task {tid}: hours={hours} out of range [1,120]")
            errors += 1

        deadline = row[104]
        if not (1 <= deadline <= 60):
            print(f"  ERROR task {tid}: deadline={deadline} out of range [1,60]")
            errors += 1

        pred_str = row[105]
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

    none_count = sum(1 for row in rows if row[105] == "None")
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
    out_path = os.path.join(os.path.dirname(__file__), "task_node_features_v2.csv")

    print("Generating 10,000 task rows v2 ...")
    rows = generate(10000)

    print("Running inline validation ...")
    validate(rows)

    print("Writing CSV ...")
    write_csv(rows, out_path)

    print("\nSpot-check (first 20 rows -- classification -> macro_domain | sprint_id):")
    for row in rows[:20]:
        tid, sp, cls, diff, pri, macro, micro = row[:7]
        expected_macro = CLASSIFICATION_CONFIG[cls]["macro"]
        status = "OK" if macro == expected_macro else "FAIL"
        print(f"  [{status}] task {tid:>5} (sp {sp:>2}): {cls[:42]:<42} | {macro}")
