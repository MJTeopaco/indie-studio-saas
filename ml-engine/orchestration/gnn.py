import os
import torch
import numpy as np

from scripts.single_task_recommendation.gnn_recommendation_inference import (
    DeveloperDataLoader,
    load_gnn_model,
    run_gnn_recommendation_inference
)

# Cache model and data loader to avoid reloading on every request
_MODEL = None
_DATA_LOADER = None
_X_DEV = None
_METADATA_DF = None

def _get_gnn_assets():
    global _MODEL, _DATA_LOADER, _X_DEV, _METADATA_DF
    if _MODEL is None:
        csv_path = os.path.join(os.path.dirname(__file__), "..", "data", "developers", "developer_node_features_v2.csv")
        _DATA_LOADER = DeveloperDataLoader(csv_path)
        _X_DEV, _METADATA_DF, _ = _DATA_LOADER.load_and_preprocess()
        
        # Load model with the correct input dimension (23 pos + 8 macro + 1 avail + 1 exp + 1 vel + 1 comp + 1 work + 96 skills = 132)
        in_dim = _X_DEV.shape[1]
        model_path = os.path.join(os.path.dirname(__file__), "..", "models", "gnn_model.pt")
        # gnn_recommendation_inference already looks in standard paths, but passing None lets it fallback
        _MODEL = load_gnn_model(in_dim, model_path=model_path, device="cpu")
    return _MODEL, _DATA_LOADER, _X_DEV, _METADATA_DF

def gnn_rank_employees(task_dict: dict) -> list[dict]:
    """
    Ranks developers from the CSV dataset using the pre-trained GNN model for a given task.
    Returns a list of dicts with score, skill overlap, and operational capacity.
    """
    model, loader, X_dev, metadata_df = _get_gnn_assets()
    
    # Adapt task_dict from FastAPI TaskInput format to GNN script format
    adapted_task = task_dict.copy()
    
    # 1. Convert required_skills from List[dict] to Dict[str, float]
    req_skills = adapted_task.get("required_skills", [])
    if isinstance(req_skills, list):
        skills_map = {}
        for s in req_skills:
            if isinstance(s, dict) and "name" in s:
                skills_map[s["name"]] = float(s.get("level", 3.0))
            elif isinstance(s, str):
                skills_map[s] = 3.0
        adapted_task["required_skills"] = skills_map
        
    # 2. Fix target_macro_domains (if it's a list of strings, make it a list of 8 bits or ignore it)
    # The GNN expects 8 binary bits. We just let the encode_task_dict handle it or zero it out if format is wrong
    
    # Encode incoming task
    X_task = loader.encode_task_dict(adapted_task)
    
    # Run inference
    match_scores = run_gnn_recommendation_inference(model, X_dev, X_task, device="cpu")
    
    # Calculate explicit skill overlap for explanation (similar to the GNN internal logic)
    dev_skills = X_dev[:, -96:]
    task_skills = X_task[:, -96:]
    skill_req_total = torch.sum(task_skills, dim=-1, keepdim=True) + 1e-5
    skill_overlap_scores = (torch.sum(torch.minimum(dev_skills, task_skills), dim=-1) / skill_req_total.squeeze(-1)).numpy()
    
    # Also find which skill names actually overlapped
    task_skills_np = task_skills.numpy()[0]
    dev_skills_np = dev_skills.numpy()
    
    results_df = metadata_df.copy()
    results_df["Match Fit Score"] = match_scores
    results_df["Skill Overlap Score"] = skill_overlap_scores
    
    # Sort descending
    sorted_df = results_df.sort_values(by="Match Fit Score", ascending=False).reset_index(drop=True)
    
    top_candidates = []
    for idx in sorted_df.index[:10]:  # Top 10
        row = sorted_df.loc[idx]
        
        # Find explicit overlapping skill names
        dev_idx = metadata_df.index.get_loc(row.name)  # Get original index to index dev_skills_np
        overlap_mask = (task_skills_np > 0) & (dev_skills_np[dev_idx] > 0)
        overlapping_skill_names = [
            col.replace("skill_", "") 
            for i, col in enumerate(loader.skill_cols) 
            if overlap_mask[i]
        ]
        
        top_candidates.append({
            "user_id": int(row["employee_id"]),
            "display_name": str(row["display_name"]) if "display_name" in row else f"Dev {row['employee_id']}",
            "position": str(row["position"]),
            "experience_years": float(row["experience_years"]),
            "match_fit_score": float(row["Match Fit Score"]),
            "match_source": "gnn",
            "skill_overlap": overlapping_skill_names,
            "operational_capacity": str(row["availability_status"])
        })
        
    return top_candidates
