# StudioSprint: Comprehensive Technology Stack Documentation

**Document Type:** Technical Architecture & System Specification  
**Project:** StudioSprint (AI-Orchestrated SaaS Management Platform for Indie Game Studios)  
**Target Audience:** Thesis Evaluation Committee, Technical Panelists, Software Engineers, and Thesis Proponents  
**Repository Branch Reference:** `staging`  
**Last Updated:** November 2026  

---

## Executive Summary

**StudioSprint** is an enterprise-grade Software-as-a-Service (SaaS) management platform engineered specifically for independent game development studios. Traditional project management suites (such as Jira, Trello, or Asana) rely on generic task lists, ungrounded manual estimations, and disconnected communication channels. In contrast, StudioSprint integrates **predictive deep learning algorithms**, **deterministic combinatorial graph mathematics**, and **neuro-symbolic large language model (LLM) orchestration** to resolve three systemic vulnerabilities in indie game production:

1. **Suboptimal Developer Allocation:** Overcoming subjective team assignments through a **Graph Neural Network (GNN)** that maps developer multi-dimensional skill vectors to task requirements.
2. **Schedule Slippage & Dependency Blindness:** Eliminating delivery date guessing through a deterministic **Critical Path Analysis (CPA / CPM & PERT)** engine executing topological DAG scheduling.
3. **Probabilistic AI Hallucination:** Enforcing a **Neuro-Symbolic Architecture** that strictly prevents LLMs from calculating numbers or dates, restricting them to natural language translation and structured schema synthesis.

The system is constructed upon a multi-tier, decoupled architecture comprising a **Laravel 11 PHP 8.4+** multi-tenant backend, an **Inertia.js v2 & React 18** modern frontend, a **PostgreSQL 16+** dual-database tenancy layer, and an asynchronous **Python 3.11+ FastAPI** Machine Learning Microservice.

---

## 1. High-Level Architectural Topology

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT TIER (BROWSER)                                │
│   React 18.2 • Inertia.js v2 • Tailwind CSS v4 • Radix UI • Recharts • Lucide Icons     │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTP / JSON / SSE / WebSockets
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND APPLICATION & GATEWAY TIER                             │
│                              Laravel 11.x (PHP 8.4+)                                   │
│  ┌───────────────────────────────┐               ┌──────────────────────────────────┐  │
│  │   Global User Hub (Landlord)  │               │   Tenant Workspace Controllers   │  │
│  │   • Global Authentication     │               │   • Epics / Sprints / Tasks      │  │
│  │   • Developer Passport Wizard │               │   • Availability / Absences      │  │
│  │   • Studio Creation & Invites │               │   • Real-Time Inbox & Channels   │  │
│  └───────────────┬───────────────┘               └─────────────────┬────────────────┘  │
│                  │                                                 │                   │
│                  │   Path-Based Tenancy Middleware (stancl/tenancy)│                   │
│                  ▼                                                 ▼                   │
│  ┌───────────────────────────────┐               ┌──────────────────────────────────┐  │
│  │   Central PostgreSQL DB       │               │   Isolated Tenant PostgreSQL DB  │  │
│  │   (users, passports, studios) │               │   (projects, tasks, assignments) │  │
│  └───────────────────────────────┘               └──────────────────────────────────┘  │
│                  │                                                 ▲                   │
│                  │ Laravel Queue & Event Broadcaster               │                   │
│                  ▼                                                 │                   │
│  ┌───────────────────────────────┐                                 │                   │
│  │   Laravel Reverb Server       │                                 │                   │
│  │   (Real-time WebSockets)      │                                 │                   │
│  └───────────────────────────────┘                                 │                   │
└───────────────────────────────────────────┬────────────────────────┴───────────────────┘
                                            │ Internal REST API / JSON Schemas
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          MACHINE LEARNING & ANALYTICS TIER                             │
│                         Python 3.11+ Microservice (FastAPI)                            │
│  ┌───────────────────────────────┐               ┌──────────────────────────────────┐  │
│  │ 1. Deep Graph Neural Network  │               │ 2. Deterministic Graph Engine    │  │
│  │    • PyTorch Geometric (PyG)  │               │    • NetworkX, NumPy, SciPy      │  │
│  │    • GraphSAGE (SAGEConv)     │               │    • Topological DAG Sort (Kahn) │  │
│  │    • 132-dim Node Tensors     │               │    • PERT (Te, Variance) & Float │  │
│  │    • Link Prediction Head     │               │    • Negative Float Breach Alert │  │
│  └───────────────────────────────┘               └──────────────────────────────────┘  │
│  ┌───────────────────────────────┐               ┌──────────────────────────────────┐  │
│  │ 3. Neuro-Symbolic LLM Core    │               │ 4. Combinatorial Optimization    │  │
│  │    • LangChain & LangGraph    │               │    • DEAP Genetic Algorithms     │  │
│  │    • Groq Cloud API (Llama-3) │               │    • Multi-Objective Fitness     │  │
│  │    • Pydantic Schema Guards   │               │    • ARIMA Utilization Forecaster│  │
│  │    • Hybrid Semantic Router   │               │    • Eager Model Warmup Cache    │  │
│  └───────────────────────────────┘               └──────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Layer-by-Layer Technology Breakdown

### 2.1 Backend Application Layer

| Technology | Version / Spec | Primary Architectural Responsibility | Justification in Thesis Project |
| :--- | :--- | :--- | :--- |
| **PHP** | `^8.4` | Server-Side Runtime | Delivers modern type systems, JIT compilation performance, read-only classes, and native JSON parsing efficiency. |
| **Laravel Framework** | `11.x` (`^13.8` ecosystem) | Core MVC Application Framework | Provides robust dependency injection, Eloquent ORM, database migrations, scheduled jobs, built-in CSRF/session security, and artisan tooling. |
| **Inertia.js (Laravel Adapter)** | `^2.0` | Monolithic Single-Page Bridge | Eliminates the complexity of building separate REST endpoints for internal views. Bridges server-side Laravel routing directly with React components. |
| **Stancl Tenancy (`stancl/tenancy`)** | `^3.10` | Multi-Tenant Database Separation | Enforces physical isolation across studios. Injects tenant identifiers into URL paths (`/studios/{tenant}/`), intercepts requests via middleware, and switches active DB connections. |
| **Laravel Sanctum** | `^4.0` | Session & API Authentication | Manages secure stateful cookie sessions for SPA client navigation and issues lightweight API tokens for internal microservice communication. |
| **Laravel Reverb** | `1.x` (`laravel/reverb`) | Real-Time WebSocket Server | High-performance, first-party WebSocket server built into Laravel. Displaces heavy third-party SaaS dependencies (like Pusher Cloud) for instant notification and task delivery. |
| **Tighten Ziggy (`tightenco/ziggy`)** | `^2.0` | Named Route Bridge | Exposes named Laravel PHP routes directly inside JavaScript React files via the global `route()` helper, ensuring compile-time URL safety. |
| **ReportPdfGenerator** | Custom Engine | Native Vector PDF Generation | Zero-dependency pure PHP vector engine constructing raw PDF 1.4 PostScript byte streams. Bypasses bulky headless Chrome/Puppeteer/wkhtmltopdf dependencies to prevent timeouts. |
| **Pint (`laravel/pint`)** | `^1.27` | Code Style & Linting | Enforces strict PSR-12 code standards across all PHP controllers, models, and service classes. |

#### Backend Architecture Highlights:
* **Path-Based Multi-Tenancy:** Each game studio operates within its own dedicated PostgreSQL database schema. The `InitializeTenancyByPath` middleware dynamically extracts `{tenant}` from the route, swaps database connections on the fly, and scrubs the parameter from downstream controller signatures.
* **Dual-Server Local Architecture:** To prevent single-threaded I/O deadlocks on Windows environments during synchronous LLM tool calling (where Laravel calls Python, and Python calls Laravel back for database context), the local setup runs concurrently on ports `8000` (User Interface) and `8002` (ML Engine API Gateway).

---

### 2.2 Frontend Presentation & Interaction Layer

| Technology | Version / Spec | Primary Architectural Responsibility | Justification in Thesis Project |
| :--- | :--- | :--- | :--- |
| **React** | `^18.2.0` | Reactive Component Library | Provides declarative virtual DOM rendering, concurrent mode, custom hooks, and component lifecycle management. |
| **Inertia.js (React Client)** | `^2.0.0` | Client-Side SPA Orchestration | Provides seamless page transitions, form handling (`useForm`), partial reloads, and scroll preservation without manual fetch boilerplate. |
| **Vite** | `^6.0.0` | Next-Generation Frontend Tooling | Provides near-instantaneous Hot Module Replacement (HMR) and optimized Rollup production asset compilation. |
| **Tailwind CSS** | `^4.3.3` | Utility-First Styling Framework | Delivers consistent design tokens, dark mode theming, responsive utilities, and ultra-compact production CSS bundles. |
| **Radix UI Primitives** | Various (`^1.1` - `^1.4`) | Unstyled Accessible Primitives | Provides accessible UI foundations (`Avatar`, `Progress`, `Separator`, `Slot`, `Tabs`, `Tooltip`) complying with WCAG 2.1 AA standards. |
| **TanStack Table** | `^8.21.3` | Headless Data Grids | Powers the "My Tasks" and "Active Sprint" Linear-grade spreadsheet views with client-side sorting, pagination, and virtualized cell rendering. |
| **Recharts** | `^3.9.2` | Declarative SVG Charting | Visualizes sprint velocity, burndown curves, developer workload distributions, and interactive Gantt schedule timelines. |
| **Lucide React** | `^1.24.0` | Iconography System | Delivers 1,000+ crisp, feather-light SVG icons unified across all navigation bars, badges, status indicators, and modal headers. |
| **React Markdown & Remark GFM** | `^10.1.0` / `^4.0.1` | Markdown Parsing & Table Render | Converts markdown responses from the AI Workspace and agentic chat into formatted HTML elements, code blocks, and data tables. |
| **Laravel Echo & Pusher-js** | `^2.6.1` / `^8.6.0` | WebSocket Client Abstraction | Subscribes to private studio channels (`private-studio.{tenant}`) to receive push events for task state transitions, leave approvals, and system alerts. |

#### Frontend Design System Philosophy:
* **Linear-Grade Micro-Interactions:** Adopts dark-mode-first aesthetic principles with semantic HSL variables, glassmorphic blurred backdrops, and compact drawer presentations that eliminate page-level scroll shifting.
* **Optimistic UI Updates:** State changes (such as moving Kanban cards or updating task statuses) update the React virtual DOM instantly while synchronizing with the backend in the background.

---

### 2.3 Machine Learning & Predictive Analytics Layer (`ml-engine/`)

The Machine Learning Engine is an independent Python service residing in `ml-engine/` running alongside Laravel. It coordinates predictive modeling and graph algorithms.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      STUDIOSPRINT ML ENGINE STACK                      │
├────────────────────────────────────────────────────────────────────────┤
│ Microservice Runtime: FastAPI 0.137 • Uvicorn 0.49 • Pydantic 2.13      │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Graph Deep Learning: PyTorch Geometric (PyG) • GraphSAGE (SAGEConv) │
│ 2. Deterministic Scheduling: NetworkX 3.6 • NumPy 2.4 • SciPy 1.17     │
│ 3. Combinatorial Search: DEAP 1.4 (Genetic Algorithms)                 │
│ 4. Time Series Analysis: ARIMA (Statsmodels / Scikit-Learn 1.9)        │
│ 5. Agentic Orchestration: LangChain 1.3 • LangGraph 1.2 • Groq Cloud   │
└────────────────────────────────────────────────────────────────────────┘
```

#### Core Components & Algorithmic Foundations:

1. **Graph Neural Network (GNN) Developer Matching Engine:**
   * **Framework:** PyTorch Geometric (PyG) with CPU-optimized wheel binaries.
   * **Model Architecture:** Bipartite Heterogeneous Graph Neural Network (`HeteroGNNRecommendationModel`).
   * **Convolutions:** Two-layer GraphSAGE (`SAGEConv`) message passing with mean aggregation across bipartite developer-task neighborhoods.
   * **Node Representations:**
     * **Developer Vector ($X_{\text{dev}} \in \mathbb{R}^{132}$):** 23 one-hot positions, 8 multi-hot macro-domains, 1 availability bit, normalized experience (0–20 years), velocity scalar, compliance rate, concurrent workload, and a 96-dimensional canonical skill proficiency vector (1–5 scale).
     * **Task Vector ($X_{\text{task}}$):** One-hot task category, difficulty level, estimated hours, priority, and 96-dimensional required skill mask.
   * **Scoring Head:** Multi-Layer Perceptron (MLP) Neural Link Prediction Head with Sigmoid activation outputting an exact **Match Fit Probability ($0.00 \to 1.00$)**.
   * **Performance Milestone:** Validated with a test ROC-AUC score of **0.7344** over synthetic developer-task bipartite graphs.

2. **Deterministic Critical Path Analysis (CPA / CPM & PERT):**
   * **Framework:** NetworkX and NumPy.
   * **Topological Sort:** Kahn's Algorithm validates the task dependency network as a strict **Directed Acyclic Graph (DAG)** and aborts with explicit error payloads if cyclic deadlocks exist.
   * **PERT Three-Point Duration:** Supports probabilistic estimations via:
     $$\text{Expected Duration } (T_e) = \frac{O + 4M + P}{6}, \quad \sigma^2 = \left(\frac{P - O}{6}\right)^2$$
   * **Dual Backward Pass:**
     * *Pass 1 (Intrinsic):* Anchored to $\max(EF)$ to reveal structural bottlenecks.
     * *Pass 2 (Deadline):* Anchored to business delivery milestones ($H_{\text{deadline}}$).
   * **Slack & Float Calculation:** Calculates Total Float ($TF = LS - ES$) and Free Float ($FF$). Tasks with $|TF| < 10^{-5}$ are marked as `is_critical = true`.
   * **Negative Float Schedule Breach Detection:** If project duration exceeds the milestone constraint, the system calculates exact negative float hours (e.g., `-16.0h float`) and triggers a red **Schedule Breached** alert.

3. **Multi-Objective Genetic Algorithm Scheduler:**
   * **Framework:** DEAP (Distributed Evolutionary Algorithms in Python).
   * **Functionality:** Dispatches evolutionary search across developer assignment permutations, optimizing for three fitness criteria: (1) minimizing total schedule duration, (2) minimizing workload variance across staff, and (3) maximizing aggregate GNN skill compatibility.

4. **Time Series Capacity Forecasting:**
   * **Framework:** AutoRegressive Integrated Moving Average (ARIMA) via Statsmodels & Scikit-Learn.
   * **Functionality:** Models long-term developer utilization trajectories to forecast sprint capacity and identify hiring requirements ahead of milestone crunches.

---

### 2.4 Neuro-Symbolic LLM Orchestration Layer

The LLM layer bridges human natural language with quantitative algorithm outputs while enforcing strict guardrails against hallucination.

```
┌────────────────────────────────────────────────────────────────────────┐
│                NEURO-SYMBOLIC ORCHESTRATION PIPELINE                   │
├────────────────────────────────────────────────────────────────────────┤
│ Inbound Prompt ──► Hybrid Semantic Router (Regex + Centroid Fallback)  │
│                                   │                                    │
│                 ┌─────────────────┴─────────────────┐                  │
│                 ▼                                   ▼                  │
│        Command / Decompose                     General Q&A             │
│                 │                                   │                  │
│                 ▼                                   ▼                  │
│   Pydantic JSON Schema Validation        Retrieval-Augmented Agent     │
│   (TaskParseResult / Hierarchy)          (LangChain Tool Calling Loop) │
│                 │                                   │                  │
│                 ▼                                   ▼                  │
│   Deterministic Core Execution            Grounded Context Response    │
│   (GNN Matching & CPA Calculation)       (Live DB Tasks & Capacities)  │
│                 │                                   │                  │
│                 └─────────────────┬─────────────────┘                  │
│                                   ▼                                    │
│       Outbound Response Synthesizer (Groq Cloud API @ Temp 0.2)        │
└────────────────────────────────────────────────────────────────────────┘
```

| Technology | Version / Spec | Primary Architectural Responsibility | Justification in Thesis Project |
| :--- | :--- | :--- | :--- |
| **LangChain** | `^1.3.13` (`langchain-core ^1.4.9`) | Prompt Templates & Agent Tooling | Provides unified abstractions for prompt construction, output parsing, tool registration, and multi-turn message history. |
| **LangGraph** | `^1.2.9` | Cyclic Agent State Machines | Manages stateful agentic loops for multi-step reasoning without runaway recursive loops. |
| **Groq Cloud API** | `^0.37.1` (`langchain-groq ^1.1.3`) | High-Speed LLM Inference | Executes ultra-low latency inference using LPUs (Language Processing Units), running `llama-3.3-70b-versatile` and `llama-3-8b-instant`. Replaced heavy local Ollama instances to eliminate hardware bottlenecks. |
| **Pydantic** | `^2.13.4` (`pydantic-core ^2.46.4`) | Strict Schema Validation | Validates all inbound LLM JSON payloads before they can touch backend database transactions. |
| **Tenacity** | `^9.1.4` | Fault-Tolerant Exponential Backoff | Intercepts HTTP 429 rate limit exceptions from LLM APIs, backing off dynamically (`min=2.0s, max=30.0s, attempts=4`) to ensure zero dropped requests. |

#### Neuro-Symbolic Guardrails & Principles:
* **The Inviolable Law of Separation:** The LLM is strictly prohibited from calculating durations, start dates, critical paths, or fit percentages. All numerical results are computed by `gnn.py` and `cpa.py`, then passed to the LLM as immutable grounding facts.
* **Deterministic Temperature (0.2):** All LLM synthesis calls are pinned to temperature `0.2` to eliminate creative drift and enforce factual adherence.
* **Resource Deficit Fallback:** If all candidate developers score below $50\%$ on a task, the synthesizer automatically injects an explicit warning advising managers of a skill gap rather than presenting an unqualified match.

---

### 2.5 Database & Data Persistence Layer

StudioSprint adopts a **hybrid multi-tenant database topology** running on **PostgreSQL 16+**.

```
                           ┌──────────────────────────────┐
                           │    LANDLORD DATABASE         │
                           │    (Central Platform)        │
                           └──────────────┬───────────────┘
                                          │
            ┌─────────────────────────────┴─────────────────────────────┐
            ▼                                                           ▼
┌──────────────────────────────┐                             ┌──────────────────────────────┐
│  TENANT DATABASE: STUDIO 1   │                             │  TENANT DATABASE: STUDIO 2   │
│  (Isolated Schema / Database)│                             │  (Isolated Schema / Database)│
└──────────────────────────────┘                             └──────────────────────────────┘
```

#### 1. Landlord (Central) Database Schema:
* `users`: Global authentication credentials, platform roles (`admin`, `programmer`), working statuses (`active`, `emergency`, `on_leave`).
* `global_profiles`: Developer passport logistics (timezone, weekly hourly capacity, years of industry experience).
* `positions`: 23 standardized indie game development job roles.
* `skills`: 96 indexed canonical skills categorized into 8 macro-domains.
* `user_skills`: Developer proficiency matrix storing 1–5 ratings.
* `tenants`: Registry of studio workspaces, tenant UUIDs, database credentials, and storage paths.
* `studio_members`: Pivot table linking global users to specific studios with tenant-scoped roles (`owner`, `leader`, `manager`, `member`).
* `leave_requests`: Formal audit ledger of scheduled absences and emergency declarations.

#### 2. Tenant (Isolated Studio) Database Schema:
* `projects`: Studio game titles with target delivery dates, keys, and statuses.
* `epics` & `epic_groups`: High-level feature groupings and strategic production horizons.
* `sprints`: Time-boxed iterations with start dates, end dates, and closure metadata.
* `tasks`: Atomic work units carrying priority, estimated hours, story points, topological dependency arrays, and CPA calculation columns (`es`, `ef`, `ls`, `lf`, `total_float`, `is_critical`).
* `task_assignments`: Multi-developer task bindings recording historical GNN `match_fit_score` ratings.
* `channel_messages`: Studio team discussion threads and real-time announcements.
* `reports`: Historical snapshots of generated executive PDF reports and metrics.

---

### 2.6 DevOps, Containerization & Infrastructure Layer

| Technology | Deployment Context | Purpose & Configuration |
| :--- | :--- | :--- |
| **Docker** | Container Engine | Multi-stage Dockerfiles for both PHP and Python services, standardizing environment variables, extension bindings, and platform dependencies. |
| **Apache HTTP Server** | Backend Web Server | Runs in Docker container with explicit `mpm_prefork` enforcement to resolve MPM multi-processing conflicts under PHP 8.4. |
| **Render Cloud** | Backend Web Service | Cloud platform hosting the Laravel web application, running scheduled migrations, seeders, and serving static assets over HTTPS. |
| **Railway Cloud** | ML Microservice Host | Cloud platform hosting the FastAPI Python microservice with dynamic `$PORT` environment variable binding and CPU wheel optimization. |
| **Concurrently** | Local Development Orchestrator | Runs `php artisan serve`, `php artisan queue:listen`, `npm run dev` (Vite), and `uvicorn main:app` simultaneously across terminal streams. |
| **Git / GitHub** | Version Control & CI/CD | 286 commits across 58 PRs on `staging` branch managing collaborative development among the 3 thesis proponents. |

---

## 3. Technology Stack Comparison Matrix

The following table provides a categorized summary of all technologies utilized in StudioSprint, suitable for direct incorporation into the thesis documentation:

| Category | Component / Tool | Version | License | Architectural Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **Runtime & Core** | PHP | 8.4+ | PHP License | Primary backend execution runtime |
| | Python | 3.11+ | PSF License | Machine learning and algorithmic computation runtime |
| | Node.js | 20+ LTS | MIT | Frontend compilation and client package execution |
| **Backend Framework** | Laravel Framework | 11.x | MIT | Core web application architecture & ORM |
| | Stancl Tenancy | 3.10 | MIT | Multi-tenant schema and path routing isolation |
| | Laravel Breeze & Sanctum | 2.4 / 4.0 | MIT | Authentication and token governance |
| | Laravel Reverb | 1.x | MIT | Real-time WebSocket transmission server |
| **Frontend Framework** | React | 18.2 | MIT | Declarative virtual DOM component hierarchy |
| | Inertia.js | 2.0 | MIT | Server-driven Single Page Application bridge |
| | Vite | 6.0 | MIT | Fast frontend asset compilation and HMR |
| **Styling & UI** | Tailwind CSS | 4.3 | MIT | Utility-first responsive design tokens |
| | Radix UI Primitives | 1.1–1.4 | MIT | Accessible unstyled interactive UI elements |
| | TanStack Table | 8.21 | MIT | Virtualized Linear-grade data spreadsheets |
| | Recharts | 3.9 | MIT | Data visualization, burndown & Gantt charts |
| | Lucide React | 1.24 | ISC | Vector iconography system |
| **ML & Deep Learning** | PyTorch Geometric (PyG) | 2.5+ | MIT | Bipartite Graph Neural Network message passing |
| | PyTorch | 2.3+ CPU | Modified BSD | Deep learning tensor math and MLP link prediction |
| | NetworkX | 3.6 | BSD | Directed Acyclic Graph CPM / CPA calculations |
| | DEAP | 1.4 | LGPL | Multi-objective genetic algorithm scheduling |
| | Scikit-Learn | 1.9 | BSD | Random Forest classifiers and evaluation metrics |
| | Statsmodels | 0.14+ | BSD | Time-series ARIMA developer utilization models |
| **NLP & LLM** | Groq Cloud API | 0.37 | Proprietary | High-speed LPU inference (Llama-3.3-70b) |
| | LangChain & LangGraph | 1.3 / 1.2 | MIT | Prompt engineering, tool calling, agent state graphs |
| | Pydantic | 2.13 | MIT | Strict JSON schema parsing and type enforcement |
| | Tenacity | 9.1 | Apache 2.0 | Exponential backoff for HTTP 429 rate limit handling |
| **Database & Storage** | PostgreSQL | 16+ | PostgreSQL | Relational Landlord and Tenant data persistence |
| | Custom Vector PDF Engine | 1.0 (Custom) | Proprietary | Zero-dependency pure PHP PostScript PDF generation |
| **DevOps & Tooling** | Docker & Compose | 26+ | Apache 2.0 | Containerized application and ML service execution |
| | Render & Railway | Cloud | Commercial | Cloud staging and production hosting platforms |
