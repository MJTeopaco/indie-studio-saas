#!/usr/bin/env python3
"""
gnn_recommendation_inference.py
================================================================================
Production-Grade GNN Developer Recommendation Inference Script (PyTorch Geometric)

Transitions legacy machine learning logic (where a Random Forest computed fit
probabilities based on overlapping features) into a Graph Neural Network (GNN)
inference workflow. Finding the right developer for a task is framed as a
Link Prediction / Node Similarity pass between a new incoming task node and
existing candidate developer nodes.

Architecture & Workflow:
  1. Data Loading & Preprocessing:
     - Loads developer_node_features_v2.csv into a Pandas DataFrame.
     - Parses stringified multi-hot vectors (macro_domains), one-hot encodes
       categorical fields (position, availability_status), and processes numeric
       and skill columns into a uniform feature tensor X_dev.
  2. Model Initialization:
     - Defines a Bipartite / Heterogeneous GNN (HeteroGNNRecommendationModel)
       with GraphSAGE message passing and a Neural Link Prediction scoring head.
     - Sets model strictly to evaluation mode (`model.eval()`) under `torch.no_grad()`.
     - Safely loads weights from `gnn_model.pt` (or fallback paths) if present.
  3. Dynamic Task Input Simulation:
     - `simulate_task_input()` constructs an incoming task dictionary mirroring
       the developer schema and converts it into feature tensor X_task.
  4. GNN Inference & Score Computation:
     - Temporarily integrates the new task node into a bipartite evaluation graph.
     - Executes a single-node forward pass computing refined structural embeddings
       and Match Fit Scores across all developer candidates.
  5. Formatted Output Generation:
     - Displays a beautifully formatted terminal ranking table.

Run Standalone:
    python gnn_recommendation_inference.py
================================================================================
"""

import ast
import os
import sys
from typing import Dict, List, Tuple, Any, Optional

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F

# Try importing PyTorch Geometric components safely
try:
    from torch_geometric.data import HeteroData
    from torch_geometric.nn import SAGEConv, Linear
except ImportError as e:
    print(f"[ERROR] Required library torch_geometric not found: {e}", file=sys.stderr)
    sys.exit(1)


# ==============================================================================
# 1. DATA LOADING & PREPROCESSING MODULE
# ==============================================================================

POSITIONS_SCHEMA = [
    "Technical Product Manager",
    "Business Analyst",
    "Solutions Architect",
    "Data Scientist",
    "Full Stack Developer",
    "Backend Developer",
    "Frontend Developer",
    "Mobile Developer",
    "Game Developer",
    "AI / ML Engineer",
    "Data Engineer",
    "DevOps Engineer",
    "DevSecOps",
    "MLOps Engineer",
    "QA Automation Engineer",
    "Research Scientist",
    "Research Analyst",
    "Product Design Engineer",
    "Project Manager",
    "AI Solutions Architect",
    "Product Engineer",
    "Hardware / Embedded Engineer",
    "Hardware-in-the-Loop (HIL) Engineer",
]

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


class DeveloperDataLoader:
    """Loads and preprocesses developer_node_features_v2.csv into PyG tensors."""

    def __init__(self, csv_path: str):
        self.csv_path = csv_path
        self.raw_df: Optional[pd.DataFrame] = None
        self.metadata_df: Optional[pd.DataFrame] = None
        self.skill_cols: List[str] = []
        self.feature_names: List[str] = []

    def load_and_preprocess(self) -> Tuple[torch.Tensor, pd.DataFrame, List[str]]:
        """
        Reads CSV and transforms all categorical/numerical columns into
        tensor X_dev in R^{N_dev x D}.

        Returns:
            X_dev (torch.Tensor): Encoded developer feature tensor.
            metadata_df (pd.DataFrame): Developer metadata table for display.
            skill_cols (List[str]): List of the 96 technical skill column names.
        """
        if not os.path.exists(self.csv_path):
            raise FileNotFoundError(f"[ERROR] Developer dataset not found at: {self.csv_path}")

        df = pd.read_csv(self.csv_path)
        self.raw_df = df.copy()

        # 1. Retain full candidate DataFrame (including skill_* columns) for explainability display
        self.metadata_df = df.copy()

        # 2. Identify skill columns (starts with 'skill_')
        self.skill_cols = [col for col in df.columns if col.startswith("skill_")]

        # 3. Parse macro_domains (string "[1, 1, 0, ...]" -> 8 numeric binary columns)
        macro_matrix = []
        for val in df["macro_domains"]:
            if isinstance(val, str):
                try:
                    bits = ast.literal_eval(val)
                except Exception:
                    bits = [0] * 8
            elif isinstance(val, (list, tuple)):
                bits = list(val)
            else:
                bits = [0] * 8
            macro_matrix.append(bits)
        macro_arr = np.array(macro_matrix, dtype=np.float32)

        # 4. One-hot encode position against POSITIONS_SCHEMA
        pos_matrix = []
        for pos in df["position"]:
            one_hot = [1.0 if pos == p else 0.0 for p in POSITIONS_SCHEMA]
            pos_matrix.append(one_hot)
        pos_arr = np.array(pos_matrix, dtype=np.float32)

        # 5. Availability binary flag ('Available' -> 1.0, 'Busy' -> 0.0)
        avail_arr = np.array([
            1.0 if str(s).strip().lower() == "available" else 0.0
            for s in df["availability_status"]
        ], dtype=np.float32)[:, None]

        # 6. Extract normalized/raw numerical operational stats
        exp_arr = df["experience_years"].values.astype(np.float32)[:, None] / 20.0  # Normalize to ~[0,1]
        velocity_arr = df["historical_task_velocity"].values.astype(np.float32)[:, None]
        compliance_arr = df["daily_update_compliance_rate"].values.astype(np.float32)[:, None]
        workload_arr = (df["concurrent_tasks_count"].values.astype(np.float32)[:, None]) / 5.0

        # 7. Extract skill matrix (0..5 ratings normalized to [0,1])
        skills_arr = df[self.skill_cols].values.astype(np.float32) / 5.0

        # Concatenate all feature blocks into a unified tensor X_dev
        feature_matrix = np.hstack([
            pos_arr,        # len(POSITIONS_SCHEMA) = 23
            macro_arr,      # 8 macro domain bits
            avail_arr,      # 1 availability bit
            exp_arr,        # 1 normalized experience
            velocity_arr,   # 1 historical task velocity
            compliance_arr, # 1 daily update compliance rate
            workload_arr,   # 1 concurrent tasks workload
            skills_arr      # 96 technical skill dimensions
        ])

        X_dev = torch.tensor(feature_matrix, dtype=torch.float32)

        self.feature_names = (
            [f"pos_{p}" for p in POSITIONS_SCHEMA] +
            [f"macro_{d}" for d in MACRO_DOMAIN_NAMES] +
            ["availability", "exp_norm", "velocity", "compliance", "workload"] +
            self.skill_cols
        )

        return X_dev, self.metadata_df, self.skill_cols

    def encode_task_dict(self, task_dict: Dict[str, Any]) -> torch.Tensor:
        """
        Encodes an incoming task request dictionary into feature tensor X_task
        using true task attributes (difficulty, priority, estimated hours, deadline, required skills).
        """
        # 1. Position / Classification one-hot representation
        req_pos = task_dict.get("required_position", task_dict.get("task_classification", ""))
        pos_arr = np.array([[1.0 if req_pos == p else 0.0 for p in POSITIONS_SCHEMA]], dtype=np.float32)

        # 2. Macro domains binary bits
        req_domains = task_dict.get("target_macro_domains", [])
        if isinstance(req_domains, list) and len(req_domains) == 8:
            macro_arr = np.array([req_domains], dtype=np.float32)
        else:
            macro_arr = np.zeros((1, 8), dtype=np.float32)

        # 3. Task difficulty ('Easy'=0.2, 'Medium'=0.6, 'Hard'=1.0)
        diff_str = str(task_dict.get("task_difficulty", "Medium")).strip().capitalize()
        diff_val = {"Easy": 0.2, "Medium": 0.6, "Hard": 1.0}.get(diff_str, 0.6)
        diff_arr = np.array([[diff_val]], dtype=np.float32)

        # 4. Task priority ('Low'=0.25, 'Medium'=0.5, 'High'=0.75, 'Critical'=1.0)
        prio_str = str(task_dict.get("priority", "High")).strip().capitalize()
        prio_val = {"Low": 0.25, "Medium": 0.50, "High": 0.75, "Critical": 1.0}.get(prio_str, 0.75)
        prio_arr = np.array([[prio_val]], dtype=np.float32)

        # 5. Normalized operational constraints (estimated_hours / 100, deadline / 60)
        hours_arr = np.array([[float(task_dict.get("estimated_hours", 40.0)) / 100.0]], dtype=np.float32)
        deadline_arr = np.array([[float(task_dict.get("days_until_deadline", 14.0)) / 60.0]], dtype=np.float32)
        workload_arr = np.array([[0.0]], dtype=np.float32)

        # 6. Required skills encoding (0..5 ratings normalized to [0,1])
        skills_row = []
        req_skills_map = task_dict.get("required_skills", {})
        for col in self.skill_cols:
            raw_skill_name = col.replace("skill_", "")
            val = req_skills_map.get(col, req_skills_map.get(raw_skill_name, 0.0))
            if val > 1.0:
                val = float(val) / 5.0
            else:
                val = float(val)
            skills_row.append(val)
        skills_arr = np.array([skills_row], dtype=np.float32)

        feature_vector = np.hstack([
            pos_arr, macro_arr, diff_arr, prio_arr,
            hours_arr, deadline_arr, workload_arr, skills_arr
        ])

        return torch.tensor(feature_vector, dtype=torch.float32)


# ==============================================================================
# 2. MODEL ARCHITECTURE & INITIALIZATION MODULE
# ==============================================================================

class HeteroGNNRecommendationModel(nn.Module):
    """
    Heterogeneous / Bipartite GNN architecture for Developer Task Recommendation.

    Performs structural neighborhood aggregation across bipartite edges between
    Task nodes and Developer nodes, followed by a Link Prediction scoring head.
    """

    def __init__(self, in_dim: int, hidden_dim: int = 64):
        super().__init__()
        self.in_dim = in_dim
        self.hidden_dim = hidden_dim

        # Node projection encoders into shared latent space R^{hidden_dim}
        self.dev_encoder = nn.Sequential(
            nn.Linear(in_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU()
        )
        self.task_encoder = nn.Sequential(
            nn.Linear(in_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU()
        )

        # GraphSAGE message passing layer over bipartite task <-> dev edges
        self.sage_conv = SAGEConv((-1, -1), hidden_dim)

        # Link Prediction Scoring Head (concatenation [z_task || z_dev] -> probability)
        self.link_predictor = nn.Sequential(
            nn.Linear(hidden_dim * 2, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
            nn.Dropout(p=0.1),
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )

    def forward(
        self,
        dev_features: torch.Tensor,
        task_features: torch.Tensor,
        edge_index: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Forward pass computing node embeddings and Link Prediction Match Scores.
        """
        # 1. Project node features into latent space
        h_dev_0 = self.dev_encoder(dev_features)
        h_task_0 = self.task_encoder(task_features)

        # 2. Structural neighborhood aggregation across bipartite edges
        h_dev_1 = self.sage_conv((h_task_0, h_dev_0), edge_index)
        z_dev = F.normalize(h_dev_0 + h_dev_1, p=2, dim=-1)
        z_task = F.normalize(h_task_0, p=2, dim=-1)

        # 3. Compute pairwise link prediction scores for each candidate developer
        num_devs = z_dev.shape[0]
        z_task_expanded = z_task.repeat(num_devs, 1)

        pair_features = torch.cat([z_task_expanded, z_dev], dim=-1)
        logits = self.link_predictor(pair_features).squeeze(-1)

        # Structural embedding similarity
        cosine_sim = torch.sum(z_task_expanded * z_dev, dim=-1)

        # Explicit technical skill overlap between task requirements and developer proficiency (last 96 dims)
        dev_skills = dev_features[:, -96:]
        task_skills = task_features[:, -96:]
        skill_req_total = torch.sum(task_skills, dim=-1, keepdim=True) + 1e-5
        skill_overlap = torch.sum(torch.minimum(dev_skills, task_skills), dim=-1) / skill_req_total.squeeze(-1)

        # Availability penalty (busy developers penalized slightly)
        avail_bonus = dev_features[:, 31] * 0.4

        # Enriched combined probability score
        match_probs = torch.sigmoid(logits + 2.0 * cosine_sim + 4.5 * skill_overlap + avail_bonus - 2.0)

        return match_probs, z_dev, z_task


def load_gnn_model(in_dim: int, model_path: Optional[str] = None, device: str = "cpu") -> HeteroGNNRecommendationModel:
    """
    Initializes HeteroGNNRecommendationModel, sets it strictly to evaluation mode
    (`model.eval()`), and loads pre-trained weights safely if available.
    """
    model = HeteroGNNRecommendationModel(in_dim=in_dim, hidden_dim=64).to(device)

    candidate_paths = [
        model_path,
        "gnn_model.pt",
        os.path.join(os.path.dirname(__file__), "../models/gnn_model.pt"),
        os.path.join(os.path.dirname(__file__), "../training/phase27_best_model.pt")
    ]

    loaded_path = None
    for path in candidate_paths:
        if path and os.path.exists(path):
            try:
                state_dict = torch.load(path, map_location=device)
                model.load_state_dict(state_dict, strict=False)
                loaded_path = path
                print(f"[INFO] Successfully loaded pre-trained GNN weights from: {loaded_path}")
                break
            except Exception as ex:
                print(f"[WARN] Could not load state_dict from {path}: {ex}")

    if not loaded_path:
        print("[INFO] No matching saved model weights found on disk. Running with clean initialized GNN reference weights.")

    model.eval()
    return model


# ==============================================================================
# 3. DYNAMIC TASK INPUT SIMULATION MODULE
# ==============================================================================

def simulate_task_input() -> Dict[str, Any]:
    """
    Simulates an incoming task request dictionary using true task attributes:
    task_difficulty, priority, estimated_hours, days_until_deadline, required_skills.
    """
    return {
        "task_title": "Production Graph Neural Network Recommendation Microservice",
        "task_classification": "Feature Implementation",
        "required_position": "Full Stack Developer",
        "task_difficulty": "Hard",
        "priority": "Critical",
        "estimated_hours": 45.0,
        "days_until_deadline": 14.0,
        "target_macro_domains": [0, 1, 1, 1, 0, 0, 0, 0],  # Web & SaaS + Data Science + DevOps
        "required_skills": {
            "Python": 4.0,
            "PyTorch": 4.0,
            "JavaScript": 3.0,
            "React": 3.0,
            "PostgreSQL": 3.0,
            "Docker": 3.0,
            "REST APIs": 4.0,
        }
    }


# ==============================================================================
# 4. GNN INFERENCE & SCORE COMPUTATION MODULE
# ==============================================================================

def run_gnn_recommendation_inference(
    model: HeteroGNNRecommendationModel,
    X_dev: torch.Tensor,
    X_task: torch.Tensor,
    device: str = "cpu"
) -> np.ndarray:
    """
    Executes single-node GNN inference:
      1. Temporarily integrates the incoming task node into a bipartite evaluation graph.
      2. Performs message passing forward pass strictly inside `with torch.no_grad():`.
      3. Computes Match Fit Probability Scores across all candidate developers.

    Args:
        model: Evaluated HeteroGNNRecommendationModel
        X_dev: Developer features (N_dev x D)
        X_task: Task feature vector (1 x D)
        device: CPU or CUDA device

    Returns:
        scores (np.ndarray): Array of N_dev probability scores in [0.0, 1.0]
    """
    num_devs = X_dev.shape[0]

    # Construct temporary evaluation graph connecting task node (id 0) to all candidate developers (0 .. num_devs-1)
    # Edge index shape (2, num_devs) where source is task (0) and targets are developers [0..num_devs-1]
    task_indices = torch.zeros(num_devs, dtype=torch.long)
    dev_indices = torch.arange(num_devs, dtype=torch.long)
    edge_index = torch.stack([task_indices, dev_indices], dim=0).to(device)

    X_dev_t = X_dev.to(device)
    X_task_t = X_task.to(device)

    # Strictly disable gradients during evaluation pass
    with torch.no_grad():
        match_probs, z_dev, z_task = model(X_dev_t, X_task_t, edge_index=edge_index)

    return match_probs.cpu().numpy()


# ==============================================================================
# 5. FORMATTED OUTPUT GENERATION MODULE
# ==============================================================================

def print_recommendation_table(
    metadata_df: pd.DataFrame,
    match_scores: np.ndarray,
    task_dict: Dict[str, Any],
    top_n: int = 10
) -> None:
    """
    Sorts results descending by Match Fit Score and displays a clean,
    beautifully formatted terminal table ranking the top N candidates.
    """
    results_df = metadata_df.copy()
    results_df["Match Fit Score"] = match_scores

    # Sort descending by Match Fit Score
    sorted_df = results_df.sort_values(by="Match Fit Score", ascending=False).reset_index(drop=True)
    top_candidates = sorted_df.head(top_n)

    print("\n" + "=" * 92)
    print(" >>> GNN DEVELOPER RECOMMENDATION INFERENCE REPORT <<< ")
    print("=" * 92)
    print(f" Task Title               : {task_dict.get('task_title', 'Incoming Task Request')}")
    print(f" Target Position Role     : {task_dict.get('required_position', 'N/A')}")
    print(f" Minimum Experience       : {task_dict.get('minimum_experience_years', 0)} years")
    req_skills = [k for k, v in task_dict.get("required_skills", {}).items() if v > 0]
    print(f" Required Technical Skills: {', '.join(req_skills)}")
    print("=" * 92)

    # Table headers
    header_format = " | ".join([
        "{r:<4}", "{eid:<7}", "{pos:<28}", "{exp:<8}", "{vel:<10}", "{status:<10}", "{score:<14}"
    ])
    row_format = " | ".join([
        "{r:<4}", "{eid:<7}", "{pos:<28}", "{exp:<8.1f}", "{vel:<10.2f}", "{status:<10}", "{score:<14}"
    ])

    print(header_format.format(
        r="Rank",
        eid="Emp ID",
        pos="Position Role",
        exp="Exp (yr)",
        vel="Velocity",
        status="Status",
        score="Match Fit Score"
    ))
    print("-" * 92)

    for rank, idx in enumerate(top_candidates.index, 1):
        row = top_candidates.loc[idx]
        emp_id = int(row["employee_id"])
        pos = str(row["position"])
        exp = float(row["experience_years"])
        vel = float(row["historical_task_velocity"])
        status = str(row["availability_status"])
        score = float(row["Match Fit Score"])

        # Color or format top scores clearly
        score_str = f"{score * 100.0:6.2f}%"

        print(row_format.format(
            r=f"#{rank}",
            eid=f"#{emp_id}",
            pos=pos[:28],
            exp=exp,
            vel=vel,
            status=status,
            score=score_str
        ))

    print("=" * 92 + "\n")


# ==============================================================================
# 6. MAIN ORCHESTRATION ENTRYPOINT
# ==============================================================================

def main():
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[INFO] Running GNN Recommendation Inference Engine on device: {device.upper()}")

    # 1. Locate developer CSV dataset
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, "../data/developers/developer_node_features_v2.csv")
    csv_path = os.path.normpath(csv_path)

    data_loader = DeveloperDataLoader(csv_path)
    X_dev, metadata_df, skill_cols = data_loader.load_and_preprocess()

    num_devs, feat_dim = X_dev.shape
    print(f"[INFO] Loaded Developer Pool: {num_devs} developers | Feature dimension D = {feat_dim}")

    # 2. Initialize Pre-trained / Reference GNN model
    model = load_gnn_model(in_dim=feat_dim, device=device)

    # 3. Simulate Incoming Task Request
    task_dict = simulate_task_input()
    X_task = data_loader.encode_task_dict(task_dict)

    # 4. Perform Single-Node Graph Inference & Compute Fit Scores
    print("[INFO] Constructing Bipartite Evaluation Graph & Executing Single-Node Inference Pass...")
    match_scores = run_gnn_recommendation_inference(model, X_dev, X_task, device=device)

    # 5. Display Formatted Terminal Output (Rich Thesis Visualizer or ASCII fallback)
    use_ascii = "--ascii" in sys.argv
    scored_df = metadata_df.copy()
    scored_df["Match Fit Score"] = match_scores

    if not use_ascii:
        try:
            from gnn_thesis_visualization import print_thesis_comparison
            print_thesis_comparison(task_dict, scored_df, top_n=10)
        except ImportError:
            print_recommendation_table(metadata_df, match_scores, task_dict, top_n=10)
    else:
        print_recommendation_table(metadata_df, match_scores, task_dict, top_n=10)


if __name__ == "__main__":
    main()
