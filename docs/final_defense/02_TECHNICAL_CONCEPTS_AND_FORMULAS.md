# StudioSprint — Technical Concepts, Mathematical Formulas & Architectural Reviewer

This document serves as the **in-depth theoretical and mathematical foundation** for the StudioSprint platform. Presenters should study this guide to defend the algorithmic and architectural decisions of the thesis during the panel defense.

---

## 📑 Table of Contents
1. [Core Architectural Paradigm: Neuro-Symbolic Computing](#1-core-architectural-paradigm-neuro-symbolic-computing)
2. [Graph Neural Network (GNN) Developer Matching Engine](#2-graph-neural-network-gnn-developer-matching-engine)
3. [Deterministic Critical Path Algorithm (CPA / CPM & PERT)](#3-deterministic-critical-path-algorithm-cpa--cpm--pert)
4. [Human-Centric Labor & Capacity Metrics](#4-human-centric-labor--capacity-metrics)
5. [Multi-Tenancy & Database Architecture](#5-multi-tenancy--database-architecture)
6. [Executive PDF Generator Architecture](#6-executive-pdf-generator-architecture)

---

## 1. Core Architectural Paradigm: Neuro-Symbolic Computing

### 1.1 The Thesis Problem: Probabilistic Hallucination vs. Deterministic Precision
A central vulnerability in purely LLM-driven project management systems is **probabilistic arithmetic and schedule hallucination**. Large Language Models operate on token prediction probabilities. When asked to schedule tasks or calculate critical paths, LLMs frequently:
- Hallucinate arbitrary delivery dates;
- Ignore cyclic task dependency violations;
- Violate contractual weekly hourly boundaries;
- Invent random percentage match ratings with no mathematical basis.

### 1.2 The StudioSprint Solution: Strict Separation of Concerns
StudioSprint strictly divides responsibilities between two decoupled computational paradigms:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   STUDIOSPRINT ARCHITECTURAL STACK                     │
├────────────────────────────────────────────────────────────────────────┤
│ 1. PROBABILISTIC NATURAL LANGUAGE LAYER (LLM / LangChain / Ollama)     │
│    • Inbound: Unstructured text → Pydantic JSON schemas.               │
│    • Outbound: Quantitative graph results → Plain-English explanations.│
│    • Temperature: Fixed at 0.2 to prevent creative hallucination.      │
├────────────────────────────────────────────────────────────────────────┤
│ 2. DETERMINISTIC GRAPH & NUMERICAL CORE (PyTorch GNN / CPA Engine)     │
│    • GNN Link Prediction Head: Computes exact Match Fit (0.00 – 1.00). │
│    • CPA Engine: Computes PERT Te, Forward/Backward passes, Float.     │
│    • Labor Governor: Computes active workload hours and utilization %. │
└────────────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Foundational Architectural Law:**
> The LLM **NEVER** computes task durations, dependencies, schedules, or fit scores. All numeric and graph calculations are executed deterministically by Python algorithms (`gnn.py` and `cpa.py`) and passed into the LLM as immutable grounding context.

---

## 2. Graph Neural Network (GNN) Developer Matching Engine

Located in `ml-engine/orchestration/gnn.py` and `ml-engine/models/gnn_recommendation_inference.py`.

### 2.1 Graph Topology: Bipartite Heterogeneous Graph
The recommendation engine models the studio workspace as a heterogeneous bipartite graph $\mathcal{G} = (\mathcal{V}_{\text{dev}}, \mathcal{V}_{\text{task}}, \mathcal{E})$, where:
- $\mathcal{V}_{\text{dev}}$ is the set of developer nodes.
- $\mathcal{V}_{\text{task}}$ is the set of task nodes.
- $\mathcal{E}$ represents historical or potential assignment edges connecting developers to tasks.

### 2.2 Developer Node Feature Tensor ($X_{\text{dev}} \in \mathbb{R}^{N_{\text{dev}} \times 132}$)
Every candidate developer is transformed into a dense **132-dimensional numerical vector**:

$$X_{\text{dev}} = \Big[ \mathbf{p} \,\|\, \mathbf{m} \,\|\, a \,\|\, e \,\|\, v \,\|\, c \,\|\, w \,\|\, \mathbf{s} \Big]$$

| Component | Dimensions | Mathematical Encoding | Description |
| :--- | :---: | :--- | :--- |
| **Position Matrix ($\mathbf{p}$)** | 23 | One-Hot Encoding: $\mathbf{p} \in \{0, 1\}^{23}$ | Maps to one of 23 canonical positions in `POSITIONS_SCHEMA`. |
| **Macro-Domain Matrix ($\mathbf{m}$)** | 8 | Multi-Hot Encoding: $\mathbf{m} \in \{0, 1\}^8$ | High-level specializations (e.g., Backend, Frontend, DevOps, Game Dev). |
| **Availability Flag ($a$)** | 1 | Binary Bit: $a \in \{0.0, 1.0\}$ | $1.0 = \text{Active/Available}$, $0.0 = \text{On Leave / Emergency}$. |
| **Normalized Experience ($e$)** | 1 | Continuous Scalar: $e = \min\left(1.0, \frac{\text{years}}{20.0}\right)$ | Experience capped and normalized against a 20-year baseline. |
| **Historical Velocity ($v$)** | 1 | Continuous Scalar: $v \in [0.5, 2.0]$ | Baseline throughput ratio (default: $1.0$). |
| **Compliance Rate ($c$)** | 1 | Continuous Scalar: $c \in [0.0, 1.0]$ | Historical daily status update compliance (default: $0.9$). |
| **Concurrent Workload ($w$)** | 1 | Continuous Scalar: $w = \min\left(1.0, \frac{\text{concurrent\_tasks}}{5.0}\right)$ | Normalized against maximum concurrent threshold ($5$ tasks). |
| **Vector Skill Matrix ($\mathbf{s}$)** | 96 | Normalized Dense Vector: $\mathbf{s}_i \in [0.0, 1.0]$ | Ratings ($1..5$) across 96 canonical technical skills divided by $5.0$. |
| **TOTAL** | **132** | | |

### 2.3 Message Passing: GraphSAGE Convolutions
The model utilizes GraphSAGE (`SAGEConv`) with mean aggregation across developer and task bipartite neighborhoods:

$$h_v^{(k)} = \sigma \left( W^{(k)} \cdot \text{CONCAT}\Big(h_v^{(k-1)}, \text{AGGREGATE}\big(\{h_u^{(k-1)}, \forall u \in \mathcal{N}(v)\}\big)\Big) \right)$$

### 2.4 Neural Link Prediction Head
To predict compatibility probability between developer node $u$ and task node $v$, the node embeddings are concatenated and passed through a multi-layer perceptron (MLP) with Sigmoid activation:

$$\hat{y}_{uv} = \sigma\Big(W_2 \cdot \text{ReLU}(W_1 \cdot [z_u \,\|\, z_v] + b_1) + b_2\Big)$$

$$\text{Match Fit Score} = \hat{y}_{uv} \in [0.00, 1.00]$$

### 2.5 Capacity Penalty Multiplier
When candidate developer $u$ has high active workload or is nearing their weekly contract ceiling, an operational governor dampens the raw GNN score:

$$\text{Adjusted Fit} = \hat{y}_{uv} \times \text{CapacityMultiplier}(u)$$

$$\text{CapacityMultiplier}(u) = \begin{cases} 
1.0 & \text{if } \text{utilization} < 80\% \\
0.85 & \text{if } 80\% \le \text{utilization} < 95\% \quad (\text{Watchlist}) \\
0.50 & \text{if } \text{utilization} \ge 95\% \quad (\text{At Risk / Overloaded}) \\
0.00 & \text{if } \text{working\_status} \in \{\text{'emergency'}, \text{'on\_leave'}\}
\end{cases}$$

---

## 3. Deterministic Critical Path Algorithm (CPA / CPM & PERT)

Located in `ml-engine/orchestration/cpa.py`.

### 3.1 PERT Expected Duration & Variance
Instead of single-point deterministic estimates, StudioSprint supports 3-point Program Evaluation and Review Technique (PERT) estimations:
- $O$ = Optimistic duration (hours)
- $M$ = Most likely duration (hours)
- $P$ = Pessimistic duration (hours)

$$\text{Expected Duration } (T_e) = \frac{O + 4M + P}{6}$$

$$\text{Variance } (\sigma^2) = \left(\frac{P - O}{6}\right)^2$$

### 3.2 Topological Sort & Kahn's Algorithm
Before computing schedules, the dependency graph must be validated as a **Directed Acyclic Graph (DAG)**. Kahn's algorithm computes in-degrees ($d_{\text{in}}$) for all task nodes:

$$S \leftarrow \{v \in \mathcal{V} \mid d_{\text{in}}(v) = 0\}$$

While $S$ is non-empty, node $u$ is removed from $S$, appended to topological order $L$, and edges $(u, v)$ are removed. If $L$ contains fewer nodes than $|\mathcal{V}|$, a dependency cycle is detected and rejected with an explicit error.

### 3.3 Forward Pass: Early Start ($ES$) & Early Finish ($EF$)
Anchored at project start time ($t = 0$):

$$ES_i = \begin{cases} 
0 & \text{if } \text{Predecessors}(i) = \emptyset \\
\max_{p \in \text{Pred}(i)} (EF_p) & \text{otherwise}
\end{cases}$$

$$EF_i = ES_i + T_{e, i}$$

$$\text{Project Finish Time } (T_{\text{project}}) = \max_{i \in \mathcal{V}} (EF_i)$$

### 3.4 Backward Pass: Late Finish ($LF$) & Late Start ($LS$)
StudioSprint executes a **Dual Backward Pass**:
1. **Topological Graph Pass:** Anchored to $T_{\text{project}} = \max(EF)$, identifying intrinsic structural bottlenecks.
2. **External Deadline Anchor Pass:** Anchored to business target deadline ($H_{\text{deadline}}$ derived from working days between `start_date` and `target_end_date`).

$$LF_i = \min\left( \min_{s \in \text{Succ}(i)} (LS_s), \, \text{HardConstraintDate}_i, \, H_{\text{deadline}} \right)$$

$$LS_i = LF_i - T_{e, i}$$

### 3.5 Total Float & Free Float
$$\text{Total Float } (TF_i) = LS_i - ES_i = LF_i - EF_i$$

$$\text{Free Float } (FF_i) = \min_{s \in \text{Succ}(i)} (ES_s) - EF_i$$

### 3.6 Critical Path Identification & Delay Breach Detection
- **Critical Path Nodes:** Tasks with zero float within floating-point tolerance ($|TF_i| < 10^{-5}$) are marked as `is_critical = true`.
- **Schedule Breach:** If project deadline cannot be met, $TF_i$ drops below zero ($TF_i < 0.0$):
  $$\text{is\_delayed} = \text{true}$$
  $$\text{delay\_hours} = \max\Big(\max_i(-TF_i), \, T_{\text{project}} - H_{\text{deadline}}\Big)$$
  The UI displays a red **Schedule Breached** badge with exact slipped hours (e.g., `-16.0h`).

---

## 4. Human-Centric Labor & Capacity Metrics

Located in `app/Http/Controllers/TenantTeamController.php` and `app/Http/Controllers/TenantDashboardController.php`.

### 4.1 Utilization Rate Formula
$$\text{Utilization Rate} = \text{round}\left( \frac{\text{active\_load\_hours}}{\text{max\_hours\_per\_week}} \times 100 \right)\%$$

$$\text{active\_load\_hours} = \sum_{t \in \mathcal{T}_{\text{active}}} \text{estimated\_hours}(t)$$

Where $\mathcal{T}_{\text{active}} = \{t \mid \text{status}(t) \in \{\text{'todo'}, \text{'in\_progress'}, \text{'review'}\} \land \text{assigned\_user\_id} = u\}$.

### 4.2 Revision / Psychological Churn Rate
$$\text{Revision Rate} = \text{round}\left( \frac{\text{tasks}_{\text{review}}}{\text{tasks}_{\text{total}}} \times 100 \right)\%$$

Tracks the proportion of a developer's tasks currently bouncing back into the review queue, quantifying rework fatigue.

### 4.3 Profile Health Classification Logic
```
                          ┌──────────────────────────┐
                          │   Calculate Workload     │
                          │   Utilization & Revision │
                          └─────────────┬────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
     utilization >= 95%                             utilization >= 80%
     OR revision >= 70%                             OR revision >= 45%
                 │                                             │
                 ▼                                             ▼
     ┌───────────────────────┐                     ┌───────────────────────┐
     │  AT RISK (danger/red) │                     │ WATCHLIST (warn/amber)│
     └───────────────────────┘                     └───────────────────────┘
                 │                                             │
                 └──────────────────────┬──────────────────────┘
                                        │ Neither condition met
                                        ▼
                           ┌─────────────────────────┐
                           │ HEALTHY (success/green) │
                           └─────────────────────────┘
```

- **At Risk (`danger` / Rose):** $\text{utilization} \ge 95\% \lor \text{revision} \ge 70\%$
- **Watchlist (`warning` / Amber):** $\text{utilization} \ge 80\% \lor \text{revision} \ge 45\%$
- **Healthy (`success` / Emerald):** $\text{utilization} < 80\% \land \text{revision} < 45\%$

### 4.4 Projected Availability Date
Computes the earliest calendar date a developer can absorb new incoming sprint tasks:

$$\text{Next Available Date} = \text{CurrentDate} + \left\lceil \frac{\text{active\_load\_hours}}{\text{max\_hours\_per\_week}} \times 7 \right\rceil \text{ days}$$

---

## 5. Multi-Tenancy & Database Architecture

Powered by `stancl/tenancy` using path-based multi-tenant database routing.

### 5.1 Landlord Database (Central SaaS Layer)
The landlord database manages global identities, billing, studio ownership, and cross-studio profiles:
- `users`: Core authentication identity, global role (`admin`, `programmer`), working status (`active`, `emergency`, `on_leave`).
- `global_profiles`: Developer passport logistics (`position_id`, `experience_years`, `max_hours_per_week`, `timezone`).
- `positions`: 23 standardized developer positions.
- `skills`: 96 indexed canonical technical skill columns.
- `user_skills`: Pivot table storing developer 1–5 star ratings.
- `tenants` / `studios`: Studio registry, owner ID, company name, storage bucket pointers.
- `studio_members`: Pivot table defining tenant membership, tenant role (`owner`, `leader`, `manager`, `member`), and operational status.
- `leave_requests`: Immutable historical records of scheduled leaves and declared emergencies.

### 5.2 Tenant Database (Isolated Studio Workspace Layer)
Each studio workspace possesses an isolated PostgreSQL schema/database, completely separating project assets:
- `projects`: Game development initiatives (`key`, `start_date`, `target_end_date`, `status`).
- `epics` & `epic_groups`: High-level feature groupings.
- `sprints`: Time-boxed development cycles (`start_date`, `end_date`, `status`).
- `tasks`: Atomic work items (`title`, `priority`, `estimated_hours`, `story_points`, `es`, `ef`, `ls`, `lf`, `total_float`, `is_critical`).
- `assignments`: Historical and active developer-to-task bindings with recorded GNN `match_fit_score`.
- `channel_messages`: Real-time studio team communications.
- `reports`: Saved and archived executive reporting runs.

### 5.3 Tenancy Resolution via Middleware
When a client requests `/studio/{tenant}/*`, the `InitializeTenancyByPath` middleware intercepts the request:
1. Extracts `{tenant}` parameter from URI.
2. Queries the central `tenants` table to locate database credentials.
3. Switches the default database connection `DB::connection('tenant')` dynamically.
4. Strips the `{tenant}` slug from the route parameters so controllers remain cleanly decoupled from tenancy plumbing.

---

## 6. Executive PDF Generator Architecture

Located in `app/Services/ReportPdfGenerator.php`.

### 6.1 Design Philosophy: Zero-Dependency Pure PHP Vector Engine
Most Laravel applications rely on bloated external PDF binaries such as `wkhtmltopdf`, `Puppeteer`, or heavy headless Chrome instances that introduce significant operational overhead and timeout risks on cloud environments.

StudioSprint implements a custom, **pure PHP PDF generator** that constructs standard PDF 1.4 PostScript byte streams directly.

### 6.2 Coordinate System & Vector Rendering
- **Page Dimensions:** 
  - Portrait: $595 \times 842 \text{ pt}$ (Standard A4)
  - Landscape: $842 \times 595 \text{ pt}$
- **Coordinate Origin:** Bottom-left corner $(0, 0)$ per PDF specification.
- **Brand Hexagon Icon:** Computed using 6 trigonometrically derived flat-top vertices with cubic Bézier shackle arcs:
  $$x_i = x_c + r \cos\left(\frac{2\pi i}{6}\right), \quad y_i = y_c + r \sin\left(\frac{2\pi i}{6}\right)$$
- **Scorecards:** Rendered with light borders (`0.88 0.90 0.93 RG`), subtle background fills (`0.98 0.98 0.99 rg`), and right-aligned document control references.
- **Donut Chart Arcs:** Rendered using continuous cubic Bézier curve approximation ($c = r \times 0.5523$) to draw proportional arcs for completed, in-progress, review, and todo task segments.
- **Dynamic Multi-Page Pagination:** Automatically measures text line heights (`wrapText()`) and measures remaining vertical canvas space. When task rows approach the footer threshold ($Y < 35\text{ pt}$), the generator closes Page 1 and initializes continuation pages with matching running headers.
