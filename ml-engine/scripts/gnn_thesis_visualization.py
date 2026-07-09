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


def get_task_required_skills_set(task_dict: Dict[str, Any]) -> Set[str]:
    """
    Extracts a clean set of required skill names (without 'skill_' prefix)
    from task_dict where value > 0 or flagged as active.
    """
    req_skills = task_dict.get("required_skills", {})
    skill_set = set()

    if isinstance(req_skills, dict):
        for k, v in req_skills.items():
            if float(v) > 0:
                clean_name = k[6:] if k.startswith("skill_") else k
                skill_set.add(clean_name)
    elif isinstance(req_skills, (list, set, tuple)):
        for item in req_skills:
            clean_name = str(item)[6:] if str(item).startswith("skill_") else str(item)
            skill_set.add(clean_name)

    return skill_set


def extract_and_format_skills_with_overlap(
    row: pd.Series,
    task_required_skills: Set[str],
    max_display_skills: int = 12
) -> Text:
    """
    Scans a developer's `skill_*` columns and constructs an explainable Rich Text
    object.
    
    Explainability Rules:
      - Overlapping Skills (in Task Requirements): Highlighted in BOLD BRIGHT GREEN
        with a checkmark prefix (`✓ Python`), explaining direct functional overlap.
      - Additional Active Skills: Displayed in subtle DIM CYAN, showing broader
        technical competency without cluttering attention.
    """
    overlapping_skills: List[str] = []
    additional_skills: List[str] = []

    for col in row.index:
        if str(col).startswith("skill_"):
            val = row[col]
            # Check if skill is active (1 for binary one-hot, or > 0 for ratings)
            try:
                num_val = float(val)
            except (ValueError, TypeError):
                num_val = 0.0

            if num_val > 0.0:
                skill_name = str(col)[6:]  # Remove 'skill_' prefix
                if skill_name in task_required_skills:
                    overlapping_skills.append(skill_name)
                else:
                    additional_skills.append(skill_name)

    # Sort alphabetically for polished presentation
    overlapping_skills.sort()
    additional_skills.sort()

    formatted_text = Text()

    # First render overlapping skills in bright bold green
    for idx, skill in enumerate(overlapping_skills):
        formatted_text.append(f"✓ {skill}", style="bold bright_green")
        if idx < len(overlapping_skills) - 1 or additional_skills:
            formatted_text.append(", ", style="dim white")

    # Then render additional active skills up to budget
    remaining_slots = max(0, max_display_skills - len(overlapping_skills))
    displayed_extras = additional_skills[:remaining_slots]

    for idx, skill in enumerate(displayed_extras):
        formatted_text.append(skill, style="dim cyan")
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
    req_position = task_dict.get("required_position", task_dict.get("task_classification", "Full Stack Developer"))
    min_exp = task_dict.get("minimum_experience_years", task_dict.get("min_experience", 0))
    difficulty = task_dict.get("task_difficulty", "Medium")
    priority = task_dict.get("priority", "High")
    macro_domains_str = format_macro_domains(task_dict.get("target_macro_domains", []))

    # Extract required skills into styled tags
    req_skills_set = get_task_required_skills_set(task_dict)
    skills_text = Text()
    if req_skills_set:
        sorted_req = sorted(list(req_skills_set))
        for idx, skill in enumerate(sorted_req):
            skills_text.append(skill, style="bold bright_green")
            if idx < len(sorted_req) - 1:
                skills_text.append(" • ", style="dim white")
    else:
        skills_text.append("Any technical skills applicable", style="dim italic")

    # Build internal table layout inside the panel
    grid = Table.grid(expand=True, padding=(0, 2))
    grid.add_column("Attribute", style="bold cyan", justify="right", width=22)
    grid.add_column("Value", style="white", justify="left")

    grid.add_row("Task Title :", f"[bold white]{task_title}[/bold white]")
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
    task_required_skills = get_task_required_skills_set(task_dict)

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
    table.add_column("Active Skills (Explainable Overlap)", justify="left", width=46)
    table.add_column("Operational Capacity", justify="center", width=24)

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

        # 3. Active Skills with explainable Green Overlap
        skills_col_text = extract_and_format_skills_with_overlap(row, task_required_skills)

        # 4. Operational Capacity (Status, Concurrent Workload, Velocity)
        status_raw = str(row.get("availability_status", "Available")).strip()
        status_styled = (
            f"[bold bright_green]● {status_raw}[/bold bright_green]"
            if status_raw.lower() == "available"
            else f"[bold bright_yellow]● {status_raw}[/bold bright_yellow]"
        )

        workload = row.get("concurrent_tasks_count", 0)
        velocity = row.get("historical_task_velocity", 1.0)
        try:
            vel_str = f"{float(velocity):.2f}x"
        except (ValueError, TypeError):
            vel_str = f"{velocity}"

        ops_col_text = (
            f"{status_styled}\n"
            f"[white]Active Tasks: [bold]{workload}[/bold][/white]\n"
            f"[white]Velocity: [bold cyan]{vel_str}[/bold cyan][/white]"
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
        "task_title": "Production Graph Neural Network Recommendation Microservice",
        "task_classification": "Feature Implementation",
        "required_position": "Full Stack Developer",
        "minimum_experience_years": 3.0,
        "task_difficulty": "Hard",
        "priority": "Critical",
        "target_macro_domains": [0, 1, 1, 1, 0, 0, 0, 0],
        "required_skills": {
            "skill_Python": 1,
            "skill_PyTorch": 1,
            "skill_JavaScript": 1,
            "skill_React": 1,
            "skill_PostgreSQL": 1,
            "skill_Docker": 1,
            "skill_REST APIs": 1,
        }
    }

    mock_candidates = pd.DataFrame([
        {
            "employee_id": 54,
            "position": "Full Stack Developer",
            "experience_years": 7.0,
            "availability_status": "Available",
            "concurrent_tasks_count": 1,
            "historical_task_velocity": 0.98,
            "Match Fit Score": 0.928512,
            "skill_Python": 1, "skill_PyTorch": 1, "skill_JavaScript": 1, "skill_React": 1,
            "skill_PostgreSQL": 1, "skill_Docker": 1, "skill_REST APIs": 1, "skill_AWS": 1, "skill_GraphQL": 1
        },
        {
            "employee_id": 33,
            "position": "Full Stack Developer",
            "experience_years": 9.0,
            "availability_status": "Available",
            "concurrent_tasks_count": 2,
            "historical_task_velocity": 0.89,
            "Match Fit Score": 0.920045,
            "skill_Python": 1, "skill_PyTorch": 1, "skill_JavaScript": 1, "skill_React": 1,
            "skill_PostgreSQL": 1, "skill_Docker": 1, "skill_REST APIs": 0, "skill_Kubernetes": 1
        },
        {
            "employee_id": 90,
            "position": "Data Engineer",
            "experience_years": 6.0,
            "availability_status": "Available",
            "concurrent_tasks_count": 1,
            "historical_task_velocity": 0.94,
            "Match Fit Score": 0.910931,
            "skill_Python": 1, "skill_PyTorch": 1, "skill_PostgreSQL": 1, "skill_Docker": 1,
            "skill_REST APIs": 1, "skill_Airflow": 1, "skill_Spark": 1
        },
        {
            "employee_id": 22,
            "position": "Full Stack Developer",
            "experience_years": 3.0,
            "availability_status": "Available",
            "concurrent_tasks_count": 0,
            "historical_task_velocity": 1.08,
            "Match Fit Score": 0.908611,
            "skill_Python": 1, "skill_JavaScript": 1, "skill_React": 1, "skill_PostgreSQL": 1,
            "skill_REST APIs": 1, "skill_TypeScript": 1
        },
        {
            "employee_id": 5,
            "position": "Full Stack Developer",
            "experience_years": 6.0,
            "availability_status": "Busy",
            "concurrent_tasks_count": 4,
            "historical_task_velocity": 0.95,
            "Match Fit Score": 0.892404,
            "skill_Python": 1, "skill_PyTorch": 1, "skill_JavaScript": 1, "skill_React": 1,
            "skill_PostgreSQL": 1, "skill_Docker": 1
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
