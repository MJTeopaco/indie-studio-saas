# StudioSprint: Human-Centric Orchestration & Contingency Protocols

## 1. Health-Aware Assignment Logic (The GNN Constraints)
**Business Purpose:** Prevent critical-resource burnout and respect physical/health limitations (e.g., RSI, medical constraints, fatigue) without sacrificing overall sprint velocity.

*   **Data Inputs & Tracking:**
    *   **Direct System Metrics Tracked:**
        *   `working_status` (`users` & `studio_members`): Systemic operational state (`'active'`, `'on_leave'`, `'emergency'`).
        *   `max_hours_per_week` (`global_profiles`): Developer contract capacity ceiling (default: `40h/week`).
        *   `active_load_hours` (`TenantTeamController`): Cumulative sum of `estimated_hours` across non-completed tasks (`status IN ('todo', 'in_progress', 'review')`).
        *   `utilization_rate`: Calculated as $\text{round}\left(\frac{\text{active\_load\_hours}}{\text{max\_hours\_per\_week}} \times 100\right)\%$.
        *   `revision_rate`: Calculated as $\text{round}\left(\frac{\text{tasks}_{\text{review}}}{\text{tasks}_{\text{total}}} \times 100\right)\%$, tracking psychological fatigue and rework churn.
        *   `profile_health` (`TenantTeamController::deriveProfileHealth`):
            *   **At Risk (`danger`)**: `utilization_rate >= 95%` OR `revision_rate >= 70%`.
            *   **Watchlist (`warning`)**: `utilization_rate >= 80%` OR `revision_rate >= 45%`.
            *   **Healthy (`success`)**: `utilization_rate < 80%` AND `revision_rate < 45%`.
        *   `concurrent_tasks_count`: Active task concurrency monitored against operational thresholds (`OVERLOAD_THRESHOLD = 3`, `MAX_CONCURRENT_TASKS = 5` in `risk_detector.py`).
        *   `leave_start_date` / `leave_end_date` & `leave_request_status`: Calendar timeline constraints (`'none'`, `'pending'`, `'approved'`, `'rejected'`, `'pending_emergency'`).
    *   **System Boundary & Omission Notice (Anti-Fabrication):** The codebase **does not** store biometric telemetry, medical records, or explicit diagnostic labels (e.g., `"RSI"`, `"Carpal Tunnel"`, or medical leave notes) in its database schema to preserve labor data privacy. Physical fragility and health limitations are abstracted into mathematical capacity degradation: capacity ceilings (`max_hours_per_week`), operational capacity flags (`working_status`), dynamic utilization limits, and overload thresholds.

*   **Algorithmic Weighting (GNN):**
    *   **Node Feature Tensor Ingestion ($X_{\text{dev}} \in \mathbb{R}^{N_{\text{dev}} \times 132}$):**
        Candidate developers are vectorized across 132 dimensions in `gnn.py` / `gnn_recommendation_inference.py`:
        1.  `pos_matrix` ($23$ dims): One-hot encoding against `POSITIONS_SCHEMA`.
        2.  `macro_matrix` ($8$ dims): Multi-hot domain specializations.
        3.  `avail_matrix` ($1$ dim): Availability binary bit ($1.0 = \text{Available}, 0.0 = \text{Busy/Offline}$).
        4.  `exp_matrix` ($1$ dim): Normalized experience ($\text{years} / 20.0$).
        5.  `vel_matrix` ($1$ dim): Historical task velocity throughput ($1.0$ baseline).
        6.  `comp_matrix` ($1$ dim): Daily update compliance rate ($0.9$ baseline).
        7.  `work_matrix` ($1$ dim): Normalized concurrent workload ($\text{concurrent\_tasks} / 5.0$).
        8.  `skills_matrix` ($96$ dims): Canonical technical skill ratings normalized from $1..5$ to $[0.0, 1.0]$.
    *   **Inference & Weighting Mechanics:**
        *   The Graph Neural Network (`HeteroGNNRecommendationModel`) uses GraphSAGE message passing over bipartite developer-task graphs to predict Link Compatibility (`match_fit_score` $\in [0.00, 1.00]$).
        *   **Burnout & Fragility Penalization:** An engineer with high active concurrency pushes `work_matrix` toward $1.0$, which dampens structural compatibility scores.
        *   **Absence Flagging:** If an engineer is marked `working_status !== 'active'`, `avail_matrix` drops to $0.0$, significantly penalizing candidate ranking.
        *   **Hard Constraints vs. Soft Scoring:**
            *   The GNN does *not* natively hard-block UI tasks via an "RSI" string flag.
            *   Instead, **CPA Assignment Guardrails** (`cpa.py::validate_assignments`) enforce deterministic hard constraints: the system rejects assignments that double-book the same developer across overlapping critical path windows ($[ES_a, EF_a) \cap [ES_b, EF_b) \neq \emptyset$).
            *   `risk_detector.py` enforces a hard operational cap: any developer with $\ge 5$ active assignments triggers a `critical` overload block in manager risk scans.

*   **Capacity Recalibration:**
    *   **Manager Visibility in Sprint Planning (`Tenant/Team/Index.jsx` & `BestFitModal.jsx`):**
        *   **Health Status Pills:** Every engineer card renders their computed profile health (`Healthy`, `Watchlist`, `At Risk`) with distinct color-coded indicators.
        *   **Live Workload Gauge:** A progress bar visualizes $\text{active\_load\_hours} / \text{max\_hours\_per\_week}$ (e.g., `38.5h / 40.0h`).
        *   **Projected Availability Date:** The engine computes the earliest real-world date the developer can absorb new tasks:
            $$\text{Next Available} = \text{now}() + \left\lceil \frac{\text{active\_load\_hours}}{\text{max\_hours\_per\_week}} \times 7 \right\rceil \text{ days}$$
        *   **Pre-Assignment Synthesis:** When the manager queries candidate recommendations (`POST /tasks/{task}/ml/best-fit`), the LLM synthesizes an operational explanation combining GNN link scores, skill overlap percentages, and critical-path float constraints to explicitly alert the manager if assigning the task will breach the developer's weekly ceiling.

---

## 2. Absence & Emergency Protocol (The CPA Recalibration)
**Business Purpose:** Guarantee operational continuity and protect the launch date the millisecond a developer goes offline.

*   **The Trigger Event:**
    *   **Operational Emergency Declaration (`ProfileController::declareEmergency`):**
        *   The developer or lead initiates an emergency state with a mandatory operational reason of at least 15 characters (`reason >= 15 chars`) and an optional `estimated_return_date`.
        *   **Governance Hierarchy:**
            *   *Studio Owner:* Emergency status activates immediately across workspace channels.
            *   *Team Leader:* Submits declaration as `pending_emergency`, subject to Studio Owner approval.
            *   *Developer/Member:* Submits declaration as `pending_emergency`, subject to Leader or Owner review.
        *   **State Cascade:** Once active, the system executes an atomic transaction updating `studio_members.working_status = 'emergency'` and `users.working_status = 'emergency'`, logs an immutable entry in `leave_requests`, notifies the workspace operational lead, and preserves any existing scheduled leave requests.
    *   **Scheduled Leave Inception (`User::resolveStudioMembersLeaveStatus`):**
        *   When system date checks encounter `today >= leave_start_date` for an approved leave request, the member's status automatically transitions from `'active'` to `'on_leave'`.

*   **Task Stripping (Orphaning):**
    *   **System Reality Check (Deterministic Design):**
        The system does **NOT** automatically strip unfinished tasks and throw them blindly into the unassigned backlog the moment an emergency is flagged.
    *   **System Rationale & Mechanics:**
        *   Silently orphaning active software development tasks (which often possess uncommitted code, active branches, or open pull requests) causes severe merge collisions and context destruction.
        *   **Operational Behavior:** Tasks remain attributed to the developer in the database (`tasks.assigned_user_id` is preserved), but the developer's state flags them across all views as `isOverCapacity = true` (`member.working_status === 'emergency'`).
        *   **Triage Flagging:** The tasks are instantly grouped into the **At-Risk & Critical Bottleneck** bucket on the Project Overview dashboard (`TenantDashboardController`), triggering visual alerts for managerial triage.
        *   Managers can unassign the task with a single click via `POST /tasks/{task}/assign` with `employee_user_ids: []`, setting `assigned_user_id = null` and marking `assignments.status = 'cancelled'`.

*   **Critical Path Impact Assessment:**
    *   **Execution of the Critical Path Algorithm (`CPAEngine` in `cpa.py`):**
        *   When a stalled or delayed task is flagged, `RecomputeProjectSchedule::dispatchSync(project_id)` invokes `CPAEngine.compute(tasks, deadline_hours)` via the FastAPI service (`POST /api/schedule/compute`).
        *   **1. PERT Duration & Variance:**
            $$T_e = \frac{O + 4M + P}{6}, \quad \sigma^2 = \left(\frac{P - O}{6}\right)^2$$
        *   **2. Topological Sort:** Kahn's algorithm verifies Directed Acyclic Graph (DAG) integrity and identifies execution sequence.
        *   **3. Forward Pass:** Computes Early Start ($ES_i$) and Early Finish ($EF_i$):
            $$ES_i = \max(EF_{\text{predecessors}}), \quad EF_i = ES_i + T_{e, i}$$
        *   **4. Dual Backward Passes:**
            *   *Topological Graph Pass:* Anchored to $\text{ProjectFinish} = \max(EF)$. Computes intrinsic float $TF_{\text{graph}} = LS_{\text{graph}} - ES$. Tasks with $|TF_{\text{graph}}| < 10^{-5}$ are marked $is\_critical = true$.
            *   *Deadline Anchor Pass:* Anchored to project external target (`deadline_hours`, derived from business days between `start_date` and `target_end_date`).
                $$LF_i = \min(\min(LS_{\text{successors}}), \text{HardConstraint}_i, \text{DeadlineAnchor})$$
                $$LS_i = LF_i - T_{e, i}, \quad \text{TotalFloat}_i = LS_i - ES_i$$
        *   **5. Breach & Delay Detection:**
            *   If a bottlenecked critical task delays, $TotalFloat$ drops below zero ($TotalFloat_i < 0.0$).
            *   `CPAEngine` returns:
                $$\text{is\_delayed} = \text{true}, \quad \text{delay\_hours} = \max(\max(-TF), \text{computed\_finish} - \text{deadline})$$
            *   The UI immediately flashes a red **Schedule Breached** badge on Gantt timelines and Kanban cards, displaying the exact slipped hours (e.g., `-16.0h`).

*   **Automated Reassignment vs. Manual Triage:**
    *   **Governance Architecture:** StudioSprint enforces **AI-Assisted Manual Triage (Human-in-the-Loop)** rather than unsupervised silent reassignments.
    *   **Orchestration Workflow:**
        1.  *AI Bot & Synthesis:* Studio managers use the **AI Workspace** (`AiWorkspace.jsx`) or task inspector (`BestFitModal.jsx`).
        2.  *GNN Querying:* The backend executes `POST /tasks/{task}/ml/best-fit`, evaluating active studio members against the task's 96 canonical skill requirements, domain taxonomy, and minimum experience thresholds.
        3.  *Constraint Validation:* The candidate list is passed through `CPAEngine.validate_assignments` to verify that proposed engineers do not create predecessor order violations or double-booking conflicts on concurrent critical tasks.
        4.  *Manager Approval:* The Studio Lead reviews the ranked candidates and commits the reassignment, which transitions prior assignments to `cancelled` and writes new active rows in `assignments`.

---

## 3. Return-to-Work Integration
**Business Purpose:** Ensure frictionless re-entry into the active sprint without disrupting tasks that have already been reallocated.

*   **The Resolution Event:**
    *   **Resolution Cascade:**
        *   *Scheduled Leave Expiration:* `User::resolveStudioMembersLeaveStatus` automatically detects when `today > leave_end_date`. It resets `working_status = 'active'`, clears `leave_start_date` and `leave_end_date` to `null`, and sets `leave_request_status = 'none'`.
        *   *Emergency Clearance:* When the developer or lead toggles status back to `'active'` (`ProfileController::updateWorkingStatus`), any open emergency `LeaveRequest` record is closed, leadership is notified (`notifyEmergencyResolved`), and the member's operational status is set to `'active'`.
    *   **Workforce State Recalibration:**
        *   The engineer's profile health is instantly re-evaluated:
            $$\text{active\_load\_hours} = \sum_{\text{active tasks}} \text{estimated\_hours}$$
        *   If their prior tasks were already reallocated to other engineers during triage, their `active_load_hours` resets toward $0.0\text{h}$, causing their `utilization_rate` to drop to $0\%$ and their `profile_health` to return to **Healthy (`success`)**.

*   **Re-allocation Logic:**
    *   **Anti-Slop Protection (No Blind Backlog Dumps):**
        The system does **not** dump arbitrary backlog items onto returning developers or disrupt already reallocated in-flight tasks.
    *   **Dynamic GNN Replenishment:**
        1.  *Restored Availability Dimension:* In the GNN feature tensor ($X_{\text{dev}}$), the returning developer's availability bit (`avail_arr`) flips back to $1.0$, and their workload factor (`work_matrix`) drops to a minimal ratio.
        2.  *Sprint Unassigned Inspection:* The Studio Lead or AI Project Assistant queries unassigned tasks in the active sprint via `/api/internal/studios/{studio_id}/projects/{project_id}/sprints/{sprint_name}/unassigned-tasks`.
        3.  *Ramp-Up Candidate Scoring:* When GNN `best-fit` is executed for these unassigned items, the returning engineer achieves high compatibility scores due to high skill match, zero schedule conflict, and fresh capacity headroom.
        4.  *Controlled Re-Entry:* The manager allocates curated tasks directly through `BestFitModal`, allowing the engineer to ramp up velocity without risking immediate burnout or critical path disruption.
