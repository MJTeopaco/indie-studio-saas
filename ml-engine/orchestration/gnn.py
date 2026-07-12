import os
import torch
import numpy as np

from scripts.single_task_recommendation.gnn_recommendation_inference import (
    DeveloperDataLoader,
    load_gnn_model,
    run_gnn_recommendation_inference,
    POSITIONS_SCHEMA,
    MACRO_DOMAIN_NAMES
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

def preprocess_employee_profiles(profiles: list[dict], loader) -> tuple[torch.Tensor, list[dict]]:
    """
    Converts a list of employee profile dicts into a PyG/GNN feature tensor X_dev
    and metadata list format.
    """
    pos_matrix = []
    macro_matrix = []
    avail_matrix = []
    exp_matrix = []
    vel_matrix = []
    comp_matrix = []
    work_matrix = []
    skills_matrix = []
    
    metadata = []
    
    for p in profiles:
        # 1. Position encoding (one-hot, 23 elements)
        pos = p.get("position") or "Developer"
        one_hot_pos = [1.0 if pos == schema_pos else 0.0 for schema_pos in POSITIONS_SCHEMA]
        pos_matrix.append(one_hot_pos)
        
        # 2. Macro domains encoding (8 elements)
        macro_bits = [0.0] * 8
        profile_macros = p.get("macro_domains") or []
        for domain in profile_macros:
            if domain in MACRO_DOMAIN_NAMES:
                idx = MACRO_DOMAIN_NAMES.index(domain)
                macro_bits[idx] = 1.0
        macro_matrix.append(macro_bits)
        
        # 3. Availability flag (1 bit)
        avail_matrix.append([1.0])
        
        # 4. Experience years (1 normalized element)
        exp = float(p.get("experience_years") or 0.0)
        exp_matrix.append([exp / 20.0])
        
        # 5. Velocity, Compliance, Workload (defaults)
        vel_matrix.append([1.0])
        comp_matrix.append([0.9])
        work_matrix.append([0.2])
        
        # 6. Skills encoding (96 elements)
        skills_row = [0.0] * 96
        profile_skills = p.get("skills") or []
        skills_map = {}
        for s in profile_skills:
            if isinstance(s, dict) and "name" in s:
                skills_map[s["name"]] = float(s.get("level") or 3.0)
        
        for i, col in enumerate(loader.skill_cols):
            raw_skill_name = col.replace("skill_", "")
            val = skills_map.get(col, skills_map.get(raw_skill_name, 0.0))
            if val > 1.0:
                val = val / 5.0
            skills_row[i] = val
        skills_matrix.append(skills_row)
        
        metadata.append({
            "employee_id": p.get("user_id"),
            "display_name": p.get("display_name") or f"Dev {p.get('user_id')}",
            "position": pos,
            "experience_years": exp,
            "availability_status": "Available"
        })
        
    feature_matrix = np.hstack([
        np.array(pos_matrix, dtype=np.float32),
        np.array(macro_matrix, dtype=np.float32),
        np.array(avail_matrix, dtype=np.float32),
        np.array(exp_matrix, dtype=np.float32),
        np.array(vel_matrix, dtype=np.float32),
        np.array(comp_matrix, dtype=np.float32),
        np.array(work_matrix, dtype=np.float32),
        np.array(skills_matrix, dtype=np.float32),
    ])
    
    X_dev = torch.tensor(feature_matrix, dtype=torch.float32)
    return X_dev, metadata

def gnn_rank_employees(task_dict: dict, employee_profiles: list[dict] = None) -> list[dict]:
    """
    Ranks developers using the pre-trained GNN model for a given task.
    Can dynamically accept actual studio employee profiles or fall back to dataset.
    """
    model, loader, X_dev_base, metadata_df = _get_gnn_assets()
    
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
        
    # Encode incoming task
    X_task = loader.encode_task_dict(adapted_task)
    
    # Determine X_dev and metadata to use
    if employee_profiles:
        X_dev, metadata = preprocess_employee_profiles(employee_profiles, loader)
    else:
        X_dev = X_dev_base
        metadata = []
        for idx in range(len(metadata_df)):
            row = metadata_df.iloc[idx]
            metadata.append({
                "employee_id": int(row["employee_id"]),
                "display_name": str(row["display_name"]) if "display_name" in row else f"Dev {row['employee_id']}",
                "position": str(row["position"]),
                "experience_years": float(row["experience_years"]),
                "availability_status": str(row["availability_status"])
            })

    # Run inference
    match_scores = run_gnn_recommendation_inference(model, X_dev, X_task, device="cpu")
    
    # Calculate explicit skill overlap
    dev_skills = X_dev[:, -96:]
    task_skills = X_task[:, -96:]
    skill_req_total = torch.sum(task_skills, dim=-1, keepdim=True) + 1e-5
    skill_overlap_scores = (torch.sum(torch.minimum(dev_skills, task_skills), dim=-1) / skill_req_total.squeeze(-1)).numpy()
    
    # Also find which skill names actually overlapped
    task_skills_np = task_skills.numpy()[0]
    dev_skills_np = dev_skills.numpy()
    
    results = []
    for idx, score in enumerate(match_scores):
        meta = metadata[idx]
        overlap_score = skill_overlap_scores[idx]
        
        # Find explicit overlapping skill names
        overlap_mask = (task_skills_np > 0) & (dev_skills_np[idx] > 0)
        overlapping_skill_names = [
            col.replace("skill_", "") 
            for i, col in enumerate(loader.skill_cols) 
            if overlap_mask[i]
        ]
        
        results.append({
            "user_id": int(meta["employee_id"]),
            "display_name": meta["display_name"],
            "position": meta["position"],
            "experience_years": meta["experience_years"],
            "match_fit_score": float(score),
            "match_source": "gnn",
            "skill_overlap": overlapping_skill_names,
            "operational_capacity": meta["availability_status"]
        })
        
    # Sort descending by match fit score
    results.sort(key=lambda x: x["match_fit_score"], reverse=True)
    return results[:10]
