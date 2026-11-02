# StudioSprint: Comprehensive Project Timeline & Development Milestones

**Document Type:** Thesis Technical Milestone Reference & Development Chronology  
**Project:** StudioSprint (AI-Orchestrated SaaS Management Platform for Indie Game Studios)  
**Target Audience:** Thesis Proponents, Thesis Writers, Academic Advisers, and Panel Defense Committee  
**Primary Basis:** Git Version Control History on Branch `staging` (286 Commits, 58 Pull Requests)  
**Timeline Range:** June 17, 2026 – October 19, 2026 (Active Implementation) → November 2026 (Defense Suite & Final Packaging)  
**Engineering Team / Proponents:**  
*   **Jerick Teopaco (`MJTeopaco` / `Jerick Teopaco`):** Lead AI/ML Engineer, Backend Architect & Systems Integrator  
*   **Mark Joshua Bueta (`jbueta` / `Mark Joshua Bueta`):** Lead UI/UX Architect, Frontend Engineer & Design Systems Specialist  
*   **Carl Ronquillo (`Carl` / `Carl Ronquillo`):** Full-Stack Engineer, Real-Time Messaging & Notifications, Reporting Subsystems  

---

## Executive Summary & Chronological Overview

The development of **StudioSprint** spanned five intensive calendar months (June 2026 to October 2026), followed by the preparation of the academic thesis defense suite in late October and November 2026. The project followed an **iterative Agile-Scrum software engineering methodology** adapted for neuro-symbolic artificial intelligence research and multi-tenant software development.

Across the development lifecycle, the engineering team executed **286 formal commits** and merged **58 pull requests** into the primary integration branch (`staging`). Development progressed through **eight distinct architectural phases**, advancing from initial database multi-tenancy scaffolding to deep learning model optimization, neuro-symbolic LLM agent integration, real-time WebSocket communication, and human-centric labor governance.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              STUDIOSPRINT DEVELOPMENT PHASES                           │
├─────────┬─────────────────────────────────────────────────────────┬────────────────────┤
│ Phase 1 │ Project Inception, Multi-Tenancy & Developer Onboarding │ Jun 17 – Jun 20    │
│ Phase 2 │ Deep Learning GNN Matching & Dataset Engineering        │ Jul 03 – Jul 10    │
│ Phase 3 │ Core SaaS Features, Project Hierarchy & UI Refactor     │ Jul 10 – Jul 15    │
│ Phase 4 │ Neuro-Symbolic LLM Orchestration & Critical Path Engine │ Jul 12 – Jul 22    │
│ Phase 5 │ Agile Estimation, Story Points & Sprint Closure Engine  │ Sep 09 – Sep 16    │
│ Phase 6 │ Hierarchical AI Workspace & Cloud Deployment Engine     │ Sep 16 – Sep 22    │
│ Phase 7 │ Labor Governance, Real-Time WebSockets & Linear UI      │ Sep 29 – Oct 14    │
│ Phase 8 │ Production Hardening, Overdue Tracking & Final Defense  │ Oct 14 – Oct 19+   │
└─────────┴─────────────────────────────────────────────────────────┴────────────────────┘
```

---

## 1. Visual Master Development Roadmap

```mermaid
gantt
    title StudioSprint Engineering Timeline (June 2026 – November 2026)
    dateFormat  YYYY-MM-DD
    section Phase 1: Inception & Tenancy
    Repository & Database Setup          :done, p1_1, 2026-06-17, 2026-06-18
    Path-Based Tenancy & Hub             :done, p1_2, 2026-06-18, 2026-06-20
    Developer Passport Onboarding Wizard :done, p1_3, 2026-06-19, 2026-06-20
    section Phase 2: Deep Learning & GNN
    Skill Ontology & Dataset Generation  :done, p2_1, 2026-07-03, 2026-07-07
    PyTorch Geometric HeteroGNN Engine   :done, p2_2, 2026-07-07, 2026-07-09
    Model Training (ROC-AUC: 0.7344)     :done, p2_3, 2026-07-08, 2026-07-10
    section Phase 3: Core SaaS Features
    Tenant Project & Task Scaffolding    :done, p3_1, 2026-07-10, 2026-07-12
    Overview Dashboard, Team & Gantt UI  :done, p3_2, 2026-07-11, 2026-07-15
    Multi-Assignment & PDF Export        :done, p3_3, 2026-07-14, 2026-07-15
    section Phase 4: LLM & CPA Engine
    Cloud LLM API Transition (Groq)      :done, p4_1, 2026-07-12, 2026-07-14
    Deterministic CPA Engine (Kahn DAG)  :done, p4_2, 2026-07-14, 2026-07-15
    Neuro-Symbolic Synthesis & Reviewers :done, p4_3, 2026-07-15, 2026-07-22
    section Phase 5: Agile & Story Points
    Agile Estimation & Story Points Layer:done, p5_1, 2026-09-09, 2026-09-11
    Epic -> Sprint -> Task Hierarchy     :done, p5_2, 2026-09-09, 2026-09-12
    Sprint Planning & Closure Subsystem  :done, p5_3, 2026-09-10, 2026-09-16
    section Phase 6: AI Workspace & Deploy
    Hierarchical AI Sprint Decomposer    :done, p6_1, 2026-09-16, 2026-09-17
    Hybrid Semantic Router & Agent Tools :done, p6_2, 2026-09-17, 2026-09-18
    Dual PHP Concurrency & Docker/Cloud  :done, p6_3, 2026-09-17, 2026-09-22
    section Phase 7: Labor & WebSockets
    Onboarding Refactor & Availability   :done, p7_1, 2026-09-29, 2026-10-04
    Two-Tier Leave Governance & Triage   :done, p7_2, 2026-10-09, 2026-10-12
    Laravel Reverb WebSockets & Linear UI:done, p7_3, 2026-10-11, 2026-10-14
    section Phase 8: Hardening & Defense
    Docker Apache MPM & Port Fixes       :done, p8_1, 2026-10-14, 2026-10-16
    Kanban Stuck/Overdue Columns & SMTP  :done, p8_2, 2026-10-16, 2026-10-19
    Final Defense Reviewer Suite (Demo)  :active, p8_3, 2026-10-20, 2026-11-02
```

---

## 2. Phase-by-Phase Detailed Chronology

### Phase 1: Project Genesis, Architectural Inception & Multi-Tenancy Scaffolding
**Timeframe:** June 17, 2026 – June 20, 2026  
**Primary Commits:** `26f2992` to `7cb15ff` (Merged PR #1)  
**Lead Engineer:** Jerick Teopaco  

#### 1. Context & Objectives:
The thesis research commenced with the conceptualization of an indie game studio management platform. The initial architectural priority was establishing an isolated multi-tenant data foundation capable of scaling across multiple independent studio workspaces without data leakage.

#### 2. Key Engineering Milestones:
*   **Repository Inception & Environment Scaffolding (June 17–18):** Initialized Git repository, configured Laravel backend environment, and provisioned the central PostgreSQL database (`indie_studio_db`). Updated application branding to `studiosprint.com`.
*   **Central Database Migrations & Seeders (June 18):** Defined initial schema for global user accounts, roles, and landlord configuration tables.
*   **Branded Landing & Authentication Portal (June 19):** Implemented modern landing page and branded authentication views with role-gated registration pipelines.
*   **Developer Passport Onboarding Wizard (June 19):** Built `Onboarding/Wizard.jsx` enabling developers to specify their primary role, years of industry experience, weekly hour capacity, and self-rate skill proficiencies. Created `Onboarding/Fork.jsx` for studio creation or code-based joining.
*   **Path-Based Multi-Tenancy Engine (June 20):** Integrated `stancl/tenancy` using path-based multi-tenant routing (`/studios/{tenant}`). Configured middleware to dynamically switch PostgreSQL database connections based on the URL path slug while stripping the parameter from downstream controllers.
*   **Global User Hub Dashboard (June 20):** Engineered the landlord dashboard (`Dashboard.jsx`), providing authenticated users with an overview of all owned and joined studios.

---

### Phase 2: Deep Learning Research, GNN Architecture & Synthetic Dataset Engineering
**Timeframe:** July 3, 2026 – July 10, 2026  
**Primary Commits:** `9ec8f65` to `291a065` (Merged PR #2, PR #3)  
**Lead Engineer:** Jerick Teopaco  

#### 1. Context & Objectives:
Traditional project management tools lack algorithmic intelligence for task assignment, relying on manual intuition. Phase 2 focused on creating a deep-learning recommendation engine that treats team allocation as a **Bipartite Heterogeneous Link Prediction Problem**.

#### 2. Key Engineering Milestones:
*   **Domain Taxonomy & Skill Catalog Expansion (July 3):** Standardized a comprehensive game development skill ontology encompassing 8 macro-domains, 23 professional positions, and 96 canonical technical skills (covering Unity, Unreal Engine, 3D Modeling, Shaders, Network Physics, Sound Design, etc.).
*   **Synthetic Dataset Generation (July 3–4):** Developed Python generator scripts in `ml-engine/data/` to produce synthetic developer profiles with varying competencies and realistic task requirement distributions.
*   **Node Feature Tensor Construction (July 7):** Designed the 132-dimensional developer node feature vector ($X_{\text{dev}}$), encapsulating position one-hot encodings, macro-domain masks, availability status, normalized experience, velocity ratings, compliance rate, concurrent workload, and a 96-skill vector.
*   **Bipartite Graph Neural Network (GNN) Engine (July 7–8):** Built the `HeteroGNNRecommendationModel` in PyTorch Geometric (PyG), utilizing two-layer GraphSAGE (`SAGEConv`) message passing with mean aggregation and an MLP link prediction head.
*   **Model Training & Empirical Validation (July 8–9):**
    *   Initial model reached an ROC-AUC score of **0.6747** on bipartite link prediction.
    *   Tuned hyperparameters, loss functions, and edge weights to achieve a final test ROC-AUC score of **0.7344**.
    *   Authored simulation scripts (`gnn_recommendation_inference.py`) to demonstrate predictive assignment recommendations.

---

### Phase 3: Core SaaS Features, Tenant Project Hierarchy & Frontend Refactoring
**Timeframe:** July 10, 2026 – July 15, 2026  
**Primary Commits:** `62cdf26` to `2146e23` (Merged PRs #4, #5, #6, #7, #8, #9, #10, #12, #19, #20)  
**Lead Engineers:** Jerick Teopaco, Mark Joshua Bueta, Carl Ronquillo  

#### 1. Context & Objectives:
With the machine learning core validated, Phase 3 focused on building out the operational SaaS platform inside the isolated tenant workspaces, connecting frontend React interfaces to the underlying tenant database.

#### 2. Key Engineering Milestones:
*   **Tenant Project Architecture (July 10):** Engineered tenant database models for Projects, Project Members, and Tasks. Created the project directory grid (`Tenant/Projects/Index.jsx`) and workspace view (`Show.jsx`).
*   **Modular Component Refactor & RBAC Layout (July 10):** Restructured frontend components under `resources/js/Pages/Tenant/Projects/`. Introduced `ProjectLayout.jsx` with strict Role-Based Access Control (restricting administrative controls to Owners and Leaders).
*   **AI-Centric Sidebar & Kanban Navigation (July 10):** Created the Left Sidebar and the AI-Centric RightSidebar displaying live GNN developer-task compatibility indicators (e.g., `96% Fit`) and Critical Path status indicators.
*   **Theme Persistence & Team Directory (July 11):** Implemented client-side theme persistence and built the studio team directory (`Tenant/Team/Index.jsx`).
*   **Overview Dashboard & Task Multi-View (July 12):** Built the studio overview dashboard displaying sprint velocity, active tasks, team distribution, and a multi-view task management interface (List, Board, and Gantt).
*   **Multi-Assignment Support & PDF Export (July 14–15):** Added multi-developer task assignment capabilities. Built the executive report preview modal and initial vector PDF download pipeline.

---

### Phase 4: LLM Integration, Neuro-Symbolic Agentic Orchestration & Critical Path Engine
**Timeframe:** July 12, 2026 – July 22, 2026  
**Primary Commits:** `e3fa525` to `0acd53e` (Merged PRs #11, #13, #14, #15, #16, #17, #21, #22, #23)  
**Lead Engineers:** Jerick Teopaco, Carl Ronquillo, Mark Joshua Bueta  

#### 1. Context & Objectives:
To prevent LLM hallucination in project planning, Phase 4 implemented the thesis's core paradigm: **Neuro-Symbolic Computing**. Deterministic graph and critical path algorithms were decoupled from probabilistic natural language generation.

#### 2. Key Engineering Milestones:
*   **Cloud LLM API Transition (July 12–14):** Evaluated local LLM inference (Ollama) and transitioned to the cloud-hosted **Groq Cloud API** via LangChain's `ChatGroq`. This eliminated local GPU hardware constraints and reduced inference latency from 15 seconds to under 800 milliseconds.
*   **Pydantic-Constrained Semantic Parsing (July 14):** Developed `intent_parser.py` with strict Pydantic schemas (`TaskParseResult`). Enforced canonical skill normalization against the 96-skill taxonomy.
*   **Grounded Response Synthesizer & Deficit Warnings (July 14):** Created `response_synthesizer.py`. Built whole-sprint explanation generators and integrated the **Resource Deficit Warning** fallback when all candidate developers score below $50\%$.
*   **Deterministic Critical Path Analysis (CPA) Engine (July 15):** Implemented `ml-engine/orchestration/cpa.py`:
    *   Topological sorting using **Kahn's Algorithm** to detect and reject cyclic dependency deadlocks.
    *   Three-point **PERT** duration estimation ($T_e = \frac{O + 4M + P}{6}$).
    *   Forward and Backward passes computing Early Start/Finish ($ES/EF$), Late Start/Finish ($LS/LF$), Total Float ($TF$), and Free Float ($FF$).
    *   Zero-float critical path identification and negative float schedule breach flagging.
*   **Academic Thesis Defense Documentation Suite (July 16–22):** Formulated comprehensive academic reviewer documents:
    *   `docs/SEMANTIC_PARSER_THESIS_REVIEWER.md`
    *   `docs/LLM_ORCHESTRATION_THESIS_REVIEWER.md`
    *   `docs/DATABASE_SCHEMA_THESIS_REVIEWER.md`
    *   UI/UX Pro Max accessibility and design audits.

---

### Phase 5: Agile Project Hierarchy, Story Points & Sprint Closure Subsystem
**Timeframe:** September 9, 2026 – September 16, 2026  
**Primary Commits:** `888e5bd` to `b8af01c` (Merged PRs #25, #26, #27, #28, #29, #30, #31, #32, #33, #34, #35, #36)  
**Lead Engineers:** Jerick Teopaco, Carl Ronquillo  

#### 1. Context & Objectives:
In Phase 5, the project management data model was elevated from a flat task list to a standard **Agile Project Hierarchy** (Epics → Sprints → Tasks) incorporating **Story Points** and sprint lifecycle closure mechanics.

#### 2. Key Engineering Milestones:
*   **Agile-Native Estimation Layer (Phases 0–6) (September 9):** Built velocity tracking, duration models, burndown charts, and mathematical bridges converting abstract Story Points into CPA working hours.
*   **Three-Tier Project Hierarchy (September 9–10):** Refactored database schema and controllers to support Epics, Epic Horizons/Phases, Sprints, and atomic Tasks. Re-architected `TenantSeeder` to automatically generate realistic project hierarchies.
*   **Sprint Planning Board & Epic Breakdown UI (September 10–12):** Designed interactive sprint planning interfaces with inline editing, battery-style task progress bars, and portal-based dropdowns to prevent table overflow clipping.
*   **Sprint Closure Subsystem (September 11):** Implemented Phase 1 of the sprint closure workflow, handling incomplete task rollovers and historical velocity snapshotting.
*   **Linear-Grade "My Tasks" Spreadsheet Grid (September 12):** Replaced the legacy spreadsheet with a high-performance, virtualized task grid supporting multi-assignment modal actions and real-time status toggling.
*   **Member-Side Interface & Messaging (September 14):** Created dedicated developer member views and internal messaging infrastructure.

---

### Phase 6: Hierarchical AI Workspace, Semantic Routing & Cloud Deployment
**Timeframe:** September 16, 2026 – September 22, 2026  
**Primary Commits:** `f3b5369` to `bd5016f` (Merged PRs #37, #38, #39, #40, #41, #42)  
**Lead Engineer:** Jerick Teopaco  

#### 1. Context & Objectives:
Phase 6 delivered the AI Workspace command center, enabling managers to transform high-level natural language game briefs into decomposed Epics, Sprints, and Tasks while hardening the production infrastructure for cloud deployment.

#### 2. Key Engineering Milestones:
*   **Hierarchical AI Sprint Decomposer (September 16–17):** Implemented recursive decomposition where an LLM prompt decomposes into structured Epics, Sprints, and Tasks. Built `HierarchicalDecompositionModal.jsx` allowing inline editing before atomic transactional database persistence (`storeBulkHierarchy`).
*   **Hybrid Semantic Router & Agentic Tool Calling (September 17):** Designed a two-track routing architecture (Track A: Prompt Injection; Track B: Native LangChain Agent Tool Calling with multi-step `while` loops).
*   **Windows Local Concurrency Architecture (September 17):** Resolved a critical single-threaded I/O deadlock on Windows development setups (where Laravel calls Python, and Python synchronously queries Laravel back for context) by implementing a dual-server architecture on ports `8000` (Frontend) and `8002` (Internal API Gateway).
*   **Cloud Containerization & Deployment Orchestration (September 17–18):**
    *   Authored multi-stage Dockerfiles for both PHP and Python services.
    *   Deployed Laravel web service to **Render Cloud** (PHP 8.4 runtime).
    *   Deployed ML microservice to **Railway Cloud** (Python 3.11 with dynamic `$PORT` environment variable binding and CPU PyTorch wheels).
*   **SSE Streaming Proxy (September 22):** Resolved Server-Sent Events (SSE) streaming bugs by proxying AI token streams securely through Laravel to the frontend.

---

### Phase 7: Human-Centric Labor Governance, Real-Time WebSockets & Linear UI Refactoring
**Timeframe:** September 29, 2026 – October 14, 2026  
**Primary Commits:** `59ebae5` to `d07ae80` (Merged PRs #43, #44, #45, #46, #47, #48, #49, #50, #51, #53, #54)  
**Lead Engineers:** Mark Joshua Bueta, Jerick Teopaco, Carl Ronquillo  

#### 1. Context & Objectives:
Recognizing that software projects succeed or fail based on human capacity, Phase 7 introduced **Human-Centric Labor Governance**, real-time event broadcasting, and a modern Linear-grade user interface overhaul.

#### 2. Key Engineering Milestones:
*   **Onboarding & Profile Modernization (September 29):** Refactored onboarding into a single-panel containerized wizard with DriftWall UI. Added profile working status indicators and avatars.
*   **Linear-Grade Design Overhaul (October 4–9):** Migrated to Tailwind CSS v4 and Shadcn design tokens. Modernized headers, sidebars, and navigation shells.
*   **Two-Tier Leave Request & Emergency Absence Triage (October 9–12):** Built the Developer Availability Hub (`Tenant/Profile/Index.jsx`). Implemented formal workflows for:
    *   *Scheduled Leave:* Multi-day advance leave subject to manager approval.
    *   *Urgent Emergency:* Immediate working status override (`emergency`) that triggers real-time manager alerts and applies a capacity multiplier of $0.00$ to prevent task assignments.
*   **Real-Time WebSockets Integration (October 11–13):** Migrated notification and inbox systems from HTTP polling to real-time WebSockets powered by **Laravel Reverb** and **Laravel Echo**.
*   **Interactive Gantt Scheduler & Presentation Compaction (October 13–14):** Redesigned the project Gantt chart to match StudioSprint brand themes with dynamic calendar synchronization. Compacted the task-details drawer with dark blurred backdrops and zero-scroll layouts.

---

### Phase 8: Production Hardening, Overdue Tracking & Final Defense Preparation
**Timeframe:** October 14, 2026 – October 19, 2026 (Active Commits) → November 2026 (Defense Suite)  
**Primary Commits:** `5f8f0bb` to `bb69660` (Merged PRs #55, #56, #57, #58)  
**Lead Engineers:** Jerick Teopaco, Carl Ronquillo, Mark Joshua Bueta  

#### 1. Context & Objectives:
The final engineering phase resolved production server configuration issues, added task lifecycle tracking columns, and generated the comprehensive thesis defense documentation suite.

#### 2. Key Engineering Milestones:
*   **Apache MPM Prefork Conflict Resolution (October 14):** Diagnosed and resolved Apache error `AH00534` (multiple MPM modules loaded simultaneously) in production Docker containers by explicitly enforcing `mpm_prefork`.
*   **Task Pipeline Enhancements (October 16–19):** Added explicit "Stuck" and "Overdue" columns to the Kanban board, configured email SMTP delivery for overdue task alerts, and stabilized reports archives.
*   **Final Defense Suite Authoring (Late October – November):**
    *   `docs/final_defense/01_FINAL_DEFENSE_DEMO_SCRIPT.md`: 24-step click-by-click live defense script with exact presenter narration.
    *   `docs/final_defense/02_TECHNICAL_CONCEPTS_AND_FORMULAS.md`: Mathematical derivations for GNN link prediction, PERT $T_e$, Kahn's topological sort, and vector PDF geometry.
    *   `docs/final_defense/03_PANEL_DEFENSE_QA_CHEATSHEET.md`: Anticipated panel questions and authoritative answers.
    *   `docs/final_defense/STORY_POINTS_EXPLAINED.md`: Plain-English conceptual guide bridging Story Points to CPA hours.

---

## 3. Milestone & Git Commit Mapping Table

The following table correlates the primary development milestones with their corresponding Git commit hashes, authors, and dates on the `staging` branch:

| Milestone / Deliverable | Commit Hash | Date (ISO 8601) | Primary Author | Pull Request |
| :--- | :--- | :--- | :--- | :--- |
| **Initial Repository Setup & Database Provisioning** | `26f2992` | 2026-06-17 | Jerick Teopaco | — |
| **Path-Based Multi-Tenancy & Landing Auth** | `995b940` | 2026-06-20 | Jerick Teopaco | PR #1 |
| **Central User Hub & Developer Passport Wizard** | `365de3b` | 2026-06-20 | Jerick Teopaco | PR #1 |
| **96-Skill & 23-Position Ontology Definition** | `a4c4aaf` | 2026-07-07 | Jerick Teopaco | — |
| **GNN Edge Index & Synthetic Generator Scripts** | `16fa5aa` | 2026-07-08 | Jerick Teopaco | PR #2 |
| **GNN Model Milestone: ROC-AUC 0.6747** | `b257ca9` | 2026-07-08 | Jerick Teopaco | PR #2 |
| **GNN Model Milestone: ROC-AUC 0.7344** | `c12e39d` | 2026-07-08 | Jerick Teopaco | PR #2 |
| **Tenant Projects Architecture & Workspace Layout** | `62cdf26` | 2026-07-10 | Jerick Teopaco | PR #3 |
| **AI-Centric RightSidebar with GNN & CPA Indicators** | `741c6cf` | 2026-07-10 | Jerick Teopaco | PR #4 |
| **Dashboard Overview Metrics & Team Directory** | `4f8a6d1` | 2026-07-11 | Mark Joshua Bueta | PR #5 |
| **Transition from Local Ollama to Cloud Groq API** | `c9fefe0` | 2026-07-14 | Carl Ronquillo | PR #15 |
| **Grounded AI Explanations & Resource Deficit Flag** | `b81d4a4` | 2026-07-14 | Jerick Teopaco | PR #13 |
| **Deterministic Critical Path Analysis (CPA) Engine** | `bab09fa` | 2026-07-15 | Jerick Teopaco | PR #17 |
| **Multi-Assignment of Members per Task** | `02af2b0` | 2026-07-15 | Carl Ronquillo | PR #19 |
| **Thesis Defense Reviewer: Semantic Parser** | `edb8eef` | 2026-07-16 | Jerick Teopaco | PR #21 |
| **Thesis Defense Reviewer: LLM Orchestration** | `c80a753` | 2026-07-17 | Jerick Teopaco | PR #21 |
| **Agile-Native Estimation Layer (Phases 0–6)** | `b80e34b` | 2026-09-09 | Jerick Teopaco | PR #26 |
| **Project Hierarchy Implementation (Epic/Sprint/Task)** | `79e06be` | 2026-09-09 | Jerick Teopaco | PR #29 |
| **Sprint Planning Board with Inline Editing** | `dc70fc1` | 2026-09-10 | Jerick Teopaco | PR #30 |
| **Sprint Closure Subsystem (Phase 1)** | `1926a51` | 2026-09-11 | Jerick Teopaco | PR #30 |
| **Linear-Grade "My Tasks" Spreadsheet Grid** | `615b8f8` | 2026-09-12 | Jerick Teopaco | PR #32 |
| **Member-Side Dashboard & Messaging Subsystem** | `220c8f1` | 2026-09-14 | Carl Ronquillo | PR #34 |
| **Hierarchical AI Sprint Decomposer (Epic/Sprint/Task)** | `f3b5369` | 2026-09-16 | Jerick Teopaco | PR #37 |
| **Neuro-Symbolic Hybrid Semantic Router & Agent Tools**| `5e2a6e2` | 2026-09-16 | Jerick Teopaco | PR #37 |
| **Windows Dual PHP Concurrency Architecture (8000/8002)**| `faf742b` | 2026-09-17 | Jerick Teopaco | PR #41 |
| **Docker & Render/Railway Cloud Deployment Config** | `b648ebd` | 2026-09-17 | Jerick Teopaco | PR #42 |
| **Developer Onboarding Refactor & DriftWall UI** | `59ebae5` | 2026-09-29 | Mark Joshua Bueta | PR #43 |
| **Availability Hub & Two-Tier Leave Governance** | `b6580ee` | 2026-10-09 | Mark Joshua Bueta | PR #45 |
| **HTTP Polling Migration to Laravel Reverb WebSockets** | `c1dd05d` | 2026-10-11 | Carl Ronquillo | PR #46 |
| **Tailwind v4 & Shadcn Linear-Grade UI Modernization** | `974e1fb` | 2026-10-12 | Mark Joshua Bueta | PR #47 |
| **Real-Time Member Inbox & Status Notifications** | `041a1fd` | 2026-10-13 | Carl Ronquillo | PR #48 |
| **Gantt Chart StudioSprint Branding Redesign** | `a74b5a7` | 2026-10-13 | Mark Joshua Bueta | PR #53 |
| **Docker Apache MPM Prefork & Port Binding Fixes** | `10d20e0` | 2026-10-14 | Jerick Teopaco | PR #57 |
| **Kanban Overdue Column & SMTP Email Delivery** | `aa283af` | 2026-10-19 | Carl Ronquillo | PR #58 |

---

## 4. Thesis Writing Guide: Structuring the "Project Timeline" Chapter

For the thesis writer compiling Chapter 3 (*Research Methodology*) or Chapter 4 (*System Implementation & Results*), this section provides a structured template for articulating the development timeline:

### 4.1 Recommended Chapter Outline:
1.  **Overview of Development Methodology:**
    *   State that StudioSprint was engineered following an **iterative Agile-Scrum methodology**.
    *   Explain how 2-week sprint cadences allowed the team to integrate empirical machine learning benchmarks with rapid frontend UI refactoring.
2.  **Work Breakdown Structure (WBS) & Engineering Phases:**
    *   Use the 8 phases documented above as the major subsections.
    *   Highlight key research milestones (such as GNN ROC-AUC optimization and Kahn's DAG algorithm implementation) alongside software engineering milestones (multi-tenancy and WebSockets).
3.  **Technical Challenges Encountered & Engineering Mitigations:**
    *   *Challenge 1 (Windows Single-Threaded I/O Deadlock):* During synchronous agentic tool calling, the local PHP web server locked up when calling Python and receiving callbacks.  
        *Mitigation:* Designed a dual-server development architecture running concurrently on ports `8000` and `8002`.
    *   *Challenge 2 (Local LLM Inference Latency):* Local ChatOllama instances caused 15–20 second response delays, breaking interactive UI workflows.  
        *Mitigation:* Migrated to the high-speed Groq Cloud API, reducing latency to $< 800\text{ ms}$ while enforcing strict Pydantic JSON schema constraints.
    *   *Challenge 3 (Apache Multi-Processing Module Conflict):* Docker containers threw `AH00534` errors under PHP 8.4 on Linux cloud hosts.  
        *Mitigation:* Explicitly configured Apache configuration files to enforce `mpm_prefork`.
4.  **Team Contributions & Collaborative Workflow:**
    *   Document the Git workflow: Feature branches (`feat/*`, `refactor/*`, `chore/*`) continuously integrated into `staging` via peer-reviewed Pull Requests prior to production releases.

---

## 5. Conclusion

The StudioSprint project timeline reflects a disciplined, data-driven software engineering effort spanning 286 Git commits and 58 merged pull requests. By systematically resolving architectural bottlenecks across multi-tenancy, deep learning graph recommendation, deterministic scheduling, and real-time WebSocket communication, the thesis proponents constructed a robust, publication-ready SaaS platform that stands on firm theoretical and empirical foundations.
