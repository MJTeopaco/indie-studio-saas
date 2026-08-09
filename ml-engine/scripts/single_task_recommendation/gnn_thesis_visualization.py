#!/usr/bin/env python3
"""
gnn_thesis_visualization.py
================================================================================
Thesis-Grade GNN Developer Recommendation Terminal Visualizer (Rich Library)

Purpose:
  In a thesis defense or research report, raw Pandas DataFrames with 80+ columns
  (one-hot encoded skills, macro domains, and operational metrics) are cluttered
  and difficult to interpret.

  This module formats the Graph Neural Network (GNN) inference outputs into a
  screenshot-ready, publication-quality terminal dashboard using the `rich`
  library (`rich.table`, `rich.panel`, `rich.console`).

Key Features for Explainability (XAI):
  1. Task Requirement Summary Panel:
     Displays active target requirements (Role, Min Experience, Target Macro
     Domains, and active required skills).
  2. Top Recommended Developers Table:
     - Rank & Score: Shows both precision rank (#1..#N) and GNN Match Fit Score
       formatted to 4 decimal places (e.g., 0.9285 | 92.85%).
     - Employee Details: ID, Position Role, and Experience Years.
     - Active Skills (Explainability Overlap): Automatically scans 50+ `skill_*`
       columns and prints ONLY active skills. Skills that perfectly overlap with
       the Task Requirements are highlighted in BOLD GREEN (✓ Skill), while
       additional skills are shown in dim cyan.
     - Operational Capacity: Shows availability_status, concurrent_tasks_count,
       and historical_task_velocity to visually justify why the GNN balances
       skills with workload and velocity.

Usage / Integration:
  - Import into PyTorch/Pandas inference script:
        from gnn_thesis_visualization import print_thesis_comparison
        print_thesis_comparison(task_dict, scored_developers_df, top_n=5)
  - Standalone Test & Demo:
        python gnn_thesis_visualization.py
================================================================================
"""

import ast
from typing import Dict, Any, List, Set, Optional, Union
import pandas as pd
import numpy as np

# Rich terminal formatting imports
try:
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel
    from rich.text import Text
    from rich.align import Align
    from rich import box
except ImportError as e:
    raise ImportError(
        "[ERROR] The 'rich' Python library is required for thesis visualizations. "
        "Install it via: pip install rich"
    ) from e


# Macro domain reference mapping matching the ML pipeline schema
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


def format_macro_domains(macro_domains_val: Any) -> str:
    """
    Decodes a binary macro domain vector (list, tuple, or stringified list)
    into human-readable domain names.

    Example:
        [0, 1, 1, 0, 0, 0, 0, 0] -> "Web & SaaS Platforms, Data Science & Predictive Modeling"
    """
    if isinstance(macro_domains_val, str):
        try:
            bits = ast.literal_eval(macro_domains_val)
        except Exception:
            return str(macro_domains_val)
    elif isinstance(macro_domains_val, (list, tuple, np.ndarray)):
        bits = list(macro_domains_val)
    else:
        return "N/A"

    active_domains = [
        MACRO_DOMAIN_NAMES[idx]
        for idx, bit in enumerate(bits)
        if idx < len(MACRO_DOMAIN_NAMES) and float(bit) > 0
    ]
    return ", ".join(active_domains) if active_domains else "General Software Development"


def format_skill_level(level_val: Any) -> str:
    """
    Formats a numeric skill level cleanly (e.g. 5.0 -> '5', 4.5 -> '4.5').
    """
    try:
        val = float(level_val)
        if val == int(val):
            return str(int(val))
        return f"{val:.1f}"
    except (ValueError, TypeError):
        return str(level_val)


def get_task_required_skills_map(task_dict: Dict[str, Any]) -> Dict[str, float]:
    """
    Extracts a clean dictionary mapping skill name -> required numeric level (> 0)
    from task_dict.
    """
    req_skills = task_dict.get("required_skills", {})
    skill_map: Dict[str, float] = {}

    if isinstance(req_skills, dict):
        for k, v in req_skills.items():
            try:
                num_v = float(v)
            except (ValueError, TypeError):
                num_v = 1.0
            if num_v > 0:
                clean_name = k[6:] if str(k).startswith("skill_") else str(k)
                skill_map[clean_name] = num_v
    elif isinstance(req_skills, (list, set, tuple)):
        for item in req_skills:
            clean_name = str(item)[6:] if str(item).startswith("skill_") else str(item)
            skill_map[clean_name] = 1.0

    return skill_map


def extract_and_format_skills_with_overlap(
    row: pd.Series,
    task_required_skills_map: Dict[str, float],
    max_display_skills: int = 14
) -> Text:
    """
    Scans a developer's `skill_*` columns and constructs an explainable Rich Text
    object showing ONLY active skills (level > 0) alongside their level indicator.
    
    Explainability Rules:
      - Overlapping Skills (in Task Requirements): Highlighted in BOLD BRIGHT GREEN
        with a checkmark and the developer's level (`✓ Python (L5)`).
      - Additional Active Skills (level > 0): Displayed in subtle DIM CYAN with
        their developer level (`TensorFlow (L4)`).
    """
    overlapping_skills: List[tuple] = []  # (skill_name, dev_level)
    additional_skills: List[tuple] = []   # (skill_name, dev_level)

    for col in row.index:
        if str(col).startswith("skill_"):
            val = row[col]
            try:
                num_val = float(val)
            except (ValueError, TypeError):
                num_val = 0.0

            if num_val > 0.0:
                skill_name = str(col)[6:]
                if skill_name in task_required_skills_map:
                    overlapping_skills.append((skill_name, num_val))
                else:
                    additional_skills.append((skill_name, num_val))

    # Sort overlapping skills alphabetically
    overlapping_skills.sort(key=lambda x: x[0])
    # Sort additional developer skills descending by their skill level so highest expertise shows first
    additional_skills.sort(key=lambda x: (-x[1], x[0]))

    formatted_text = Text()

    # 1. Render overlapping required skills in bright bold green
    for idx, (skill, dev_lvl) in enumerate(overlapping_skills):
        lvl_str = format_skill_level(dev_lvl)
        formatted_text.append(f"✓ {skill} (L{lvl_str})", style="bold bright_green")
        if idx < len(overlapping_skills) - 1 or additional_skills:
            formatted_text.append(", ", style="dim white")

    # 2. Render additional active skills up to budget
    remaining_slots = max(0, max_display_skills - len(overlapping_skills))
    displayed_extras = additional_skills[:remaining_slots]

    for idx, (skill, dev_lvl) in enumerate(displayed_extras):
        lvl_str = format_skill_level(dev_lvl)
        formatted_text.append(f"{skill} (L{lvl_str})", style="dim cyan")
        if idx < len(displayed_extras) - 1:
            formatted_text.append(", ", style="dim white")

    if len(additional_skills) > remaining_slots:
        formatted_text.append(f" (+{len(additional_skills) - remaining_slots} more)", style="dim italic")

    if len(formatted_text) == 0:
        formatted_text.append("No active skills recorded", style="dim italic red")

    return formatted_text


def build_task_summary_panel(task_dict: Dict[str, Any]) -> Panel:
    """
    Creates a screenshot-ready summary panel displaying the Target Task requirements.
    """
    task_title = task_dict.get("task_title", "Unspecified Task Request")
    task_desc = task_dict.get("task_description", "")
    req_position = task_dict.get("required_position", task_dict.get("task_classification", "Full Stack Developer"))
    min_exp = task_dict.get("minimum_experience_years", task_dict.get("min_experience", 0))
    difficulty = task_dict.get("task_difficulty", "Medium")
    priority = task_dict.get("priority", "High")
    macro_domains_str = format_macro_domains(task_dict.get("target_macro_domains", []))

    # Extract required skills into styled tags with required level indicators
    req_skills_map = get_task_required_skills_map(task_dict)
    skills_text = Text()
    if req_skills_map:
        sorted_req = sorted(req_skills_map.items(), key=lambda x: x[0])
        for idx, (skill, lvl) in enumerate(sorted_req):
            lvl_str = format_skill_level(lvl)
            skills_text.append(f"{skill} (L{lvl_str})", style="bold bright_green")
            if idx < len(sorted_req) - 1:
                skills_text.append(" • ", style="dim white")
    else:
        skills_text.append("Any technical skills applicable", style="dim italic")

    # Build internal table layout inside the panel
    grid = Table.grid(expand=True, padding=(0, 2))
    grid.add_column("Attribute", style="bold cyan", justify="right", width=22)
    grid.add_column("Value", style="white", justify="left")

    grid.add_row("Task Title :", f"[bold white]{task_title}[/bold white]")
    if task_desc:
        grid.add_row("Objective :", f"[dim white]{task_desc}[/dim white]")
    grid.add_row("Target Role :", f"[bold yellow]{req_position}[/bold yellow]")
    grid.add_row("Min Experience :", f"[bold]{min_exp} years[/bold]  [dim]({difficulty} Difficulty | {priority} Priority)[/dim]")
    grid.add_row("Macro Domain(s) :", f"[magenta]{macro_domains_str}[/magenta]")
    grid.add_row("Required Skills :", skills_text)

    panel = Panel(
        grid,
        title="[bold cyan]⚡ TASK REQUIREMENT SUMMARY (GNN TARGET INPUT)[/bold cyan]",
        subtitle="[dim]Graph Node Match Target[/dim]",
        border_style="cyan",
        box=box.ROUNDED,
        padding=(1, 2)
    )
    return panel


def build_top_developers_table(
    top_df: pd.DataFrame,
    task_dict: Dict[str, Any]
) -> Table:
    """
    Creates a stylized Rich Table comparing the Top recommended developers,
    justifying GNN decisions with Match Fit Scores, exact skill overlap,
    and operational capacity.
    """
    task_required_skills_map = get_task_required_skills_map(task_dict)

    table = Table(
        title="[bold bright_white]🏆 TOP RECOMMENDED DEVELOPERS (GNN MATCH FIT COMPARISON)[/bold bright_white]",
        caption="[dim]Legend: [bold bright_green]✓ Exact Required Skill Match[/bold bright_green] | [dim cyan]Additional Candidate Skill[/dim cyan] | Match Score formatted to 4 decimal places[/dim]",
        box=box.ROUNDED,
        border_style="blue",
        header_style="bold bright_white on dark_blue",
        padding=(0, 1),
        expand=False
    )

    table.add_column("Rank & Score", justify="center", width=16, no_wrap=True)
    table.add_column("Employee Details", justify="left", width=24)
    table.add_column("Active Skills (Explainable Overlap)", justify="left", width=50)
    table.add_column("Operational Capacity", justify="center", width=20)

    for rank_idx, (_, row) in enumerate(top_df.iterrows(), start=1):
        # 1. Rank & GNN Match Fit Score (Formatted to exactly 4 decimal places)
        raw_score = row.get("Match Fit Score", row.get("match_score", 0.0))
        try:
            score_num = float(raw_score)
        except (ValueError, TypeError):
            score_num = 0.0

        rank_badge = (
            "[bold bright_yellow]🥇 #1[/bold bright_yellow]" if rank_idx == 1 else
            "[bold bright_white]🥈 #2[/bold bright_white]" if rank_idx == 2 else
            "[bold yellow]🥉 #3[/bold yellow]" if rank_idx == 3 else
            f"[bold cyan]#{rank_idx}[/bold cyan]"
        )

        score_4dec = f"{score_num:.4f}"
        score_pct = f"{score_num * 100.0:.2f}%"
        rank_col_text = f"{rank_badge}\n[bold bright_green]{score_4dec}[/bold bright_green]\n[dim]({score_pct})[/dim]"

        # 2. Employee Details
        emp_id = row.get("employee_id", "N/A")
        pos = row.get("position", "Developer")
        exp = row.get("experience_years", 0.0)
        try:
            exp_val = f"{float(exp):.1f} yrs"
        except (ValueError, TypeError):
            exp_val = f"{exp} yrs"

        emp_col_text = (
            f"[bold bright_white]ID: #{emp_id}[/bold bright_white]\n"
            f"[bold yellow]{pos}[/bold yellow]\n"
            f"[dim]Experience: {exp_val}[/dim]"
        )

        # 3. Active Skills with explainable Green Overlap & Levels
        skills_col_text = extract_and_format_skills_with_overlap(row, task_required_skills_map)

        # 4. Operational Capacity (Status, Concurrent Workload - Velocity removed per request)
        status_raw = str(row.get("availability_status", "Available")).strip()
        status_styled = (
            f"[bold bright_green]● {status_raw}[/bold bright_green]"
            if status_raw.lower() == "available"
            else f"[bold bright_yellow]● {status_raw}[/bold bright_yellow]"
        )

        workload = row.get("concurrent_tasks_count", 0)

        ops_col_text = (
            f"{status_styled}\n"
            f"[white]Active Tasks: [bold]{workload}[/bold][/white]"
        )

        table.add_row(rank_col_text, emp_col_text, skills_col_text, ops_col_text)
        if rank_idx < len(top_df):
            table.add_section()

    return table


def print_thesis_comparison(
    task_dict: Dict[str, Any],
    top_developers_df: pd.DataFrame,
    top_n: int = 5,
    console: Optional[Console] = None
) -> None:
    """
    Main reusable thesis display function.

    Args:
        task_dict: Incoming task specification dictionary.
        top_developers_df: Pandas DataFrame containing developer rows + 'Match Fit Score'.
        top_n: Number of top candidates to display (typically 3 to 5 for clean thesis figures).
        console: Optional Rich Console instance.
    """
    if console is None:
        console = Console(width=118)

    # Ensure we sort top developers descending by Match Fit Score
    score_col = "Match Fit Score" if "Match Fit Score" in top_developers_df.columns else "match_score"
    if score_col in top_developers_df.columns:
        sorted_df = top_developers_df.sort_values(by=score_col, ascending=False).head(top_n)
    else:
        sorted_df = top_developers_df.head(top_n)

    console.print("\n")
    console.print(build_task_summary_panel(task_dict))
    console.print("")
    console.print(build_top_developers_table(sorted_df, task_dict))
    console.print("\n")


# ==============================================================================
# STANDALONE MOCK DATA & SCREENSHOT TEST EXECUTION
# ==============================================================================
def _create_mock_thesis_data() -> tuple:
    """
    Generates realistic mock task and candidate DataFrame matching the thesis
    schema so you can test and screenshot the Rich visualizer immediately.
    """
    mock_task = {
        "task_title": "Autonomous NPC AI Agent & LLM Orchestration Inference Microservice",
        "task_description": "Architect and deploy a low-latency generative AI behavior microservice for autonomous game NPCs using PyTorch, Hugging Face Transformers, LangChain, and ChromaDB vector memory.",
        "task_classification": "AI / ML Engine Development",
        "required_position": "AI / ML Engineer",
        "minimum_experience_years": 5.0,
        "task_difficulty": "Hard",
        "priority": "Critical",
        "target_macro_domains": [0, 0, 1, 0, 0, 0, 0, 1],
        "required_skills": {
            "skill_Python": 5.0,
            "skill_PyTorch": 5.0,
            "skill_Hugging Face": 4.0,
            "skill_LangChain": 4.0,
            "skill_ChromaDB": 4.0,
            "skill_FastAPI": 4.0,
            "skill_Docker": 3.0,
            "skill_REST APIs": 4.0,
        }
    }

    mock_candidates = pd.DataFrame([
        {
            "employee_id": 86,
            "position": "AI / ML Engineer",
            "experience_years": 11.0,
            "availability_status": "Available",
            "concurrent_tasks_count": 0,
            "Match Fit Score": 0.941208,
            "skill_Python": 5.0, "skill_PyTorch": 5.0, "skill_Hugging Face": 5.0, "skill_LangChain": 4.0,
            "skill_ChromaDB": 4.0, "skill_FastAPI": 5.0, "skill_Docker": 4.0, "skill_REST APIs": 4.0,
            "skill_TensorFlow": 4.0, "skill_OpenAI API": 5.0, "skill_Git": 4.0
        },
        {
            "employee_id": 44,
            "position": "MLOps Engineer",
            "experience_years": 8.0,
            "availability_status": "Available",
            "concurrent_tasks_count": 1,
            "Match Fit Score": 0.918451,
            "skill_Python": 5.0, "skill_PyTorch": 4.0, "skill_Hugging Face": 4.0, "skill_LangChain": 3.0,
            "skill_ChromaDB": 4.0, "skill_FastAPI": 4.0, "skill_Docker": 5.0, "skill_REST APIs": 4.0,
            "skill_Kubernetes": 4.0, "skill_AWS": 4.0
        },
        {
            "employee_id": 90,
            "position": "Data Engineer",
            "experience_years": 6.0,
            "availability_status": "Available",
            "concurrent_tasks_count": 1,
            "Match Fit Score": 0.887612,
            "skill_Python": 5.0, "skill_PyTorch": 4.0, "skill_ChromaDB": 3.0, "skill_FastAPI": 4.0,
            "skill_Docker": 4.0, "skill_REST APIs": 4.0, "skill_PostgreSQL": 5.0, "skill_Spark": 4.0
        },
        {
            "employee_id": 100,
            "position": "Solutions Architect",
            "experience_years": 14.0,
            "availability_status": "Busy",
            "concurrent_tasks_count": 3,
            "Match Fit Score": 0.865410,
            "skill_Python": 5.0, "skill_PyTorch": 3.0, "skill_FastAPI": 5.0, "skill_Docker": 5.0,
            "skill_REST APIs": 5.0, "skill_AWS": 5.0, "skill_Azure": 4.0
        },
        {
            "employee_id": 54,
            "position": "Full Stack Developer",
            "experience_years": 7.0,
            "availability_status": "Available",
            "concurrent_tasks_count": 0,
            "Match Fit Score": 0.831204,
            "skill_Python": 4.0, "skill_FastAPI": 4.0, "skill_Docker": 3.0, "skill_REST APIs": 4.0,
            "skill_JavaScript": 5.0, "skill_React": 4.0
        }
    ])

    return mock_task, mock_candidates


if __name__ == "__main__":
    import sys
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    print("[INFO] Executing Standalone Thesis GNN Visualization Demo...")
    task_input, candidates_df = _create_mock_thesis_data()
    print_thesis_comparison(task_input, candidates_df, top_n=5)
