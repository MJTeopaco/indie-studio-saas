# StudioSprint: System Architecture & Feature Reference Guide

This document provides a comprehensive technical overview of the features, database architecture, multi-tenancy model, and machine learning integrations implemented in **StudioSprint**.

---

## 1. System Overview & Architecture

StudioSprint is a robust SaaS platform designed for indie game studios. It utilizes a hybrid multi-tenant structure to isolate studio workspaces while maintaining a centralized user and passport management system.

```
                    ┌────────────────────────┐
                    │   Global User Hub      │
                    │   (Landlord Database)  │
                    └───────────┬────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
┌────────────────────────┐                     ┌────────────────────────┐
│    Studio Workspace    │                     │    Studio Workspace    │
│   (Tenant A Database)  │                     │   (Tenant B Database)  │
└────────────────────────┘                     └────────────────────────┘
```

### Technology Stack
*   **Backend:** Laravel 11 (PHP 8.3+)
*   **Frontend:** React 18 with InertiaJS & Tailwind CSS 3
*   **Database:** PostgreSQL (with `stancl/tenancy` for multi-tenancy)
*   **Machine Learning Engine:** Python (FastAPI, PyTorch Geometric, Scikit-Learn, Pandas, DEAP)

---

## 2. Central Hub & Onboarding Features

The Central Hub acts as the landing pad and entry point for all users before they enter a specific studio's workspace context.

### 🔑 Authentication & Global User Profiles
*   Users register and authenticate globally against the central ("landlord") database.
*   The login portal resolves the user's identity and permissions across all studios they own or collaborate with.

### 🛡️ Onboarding Pipeline & Developer Passport
*   **`requires.onboarding` Gating Middleware:** Ensures users complete profile setups before accessing dashboards.
*   **Developer Passport Setup (`Wizard.jsx`):** Allows developers to record:
    *   Primary professional position (e.g., Backend Developer, AI/ML Engineer, UI/UX Designer).
    *   Years of industry experience.
    *   Weekly availability capacity (in hours) and local timezone.
    *   **Skill Matrix:** Scoring proficiency levels (1–5) across 96 technical skill columns (e.g., Next.js, FastAPI, PyTorch, Unity, Docker, etc.).
*   **Workspace Fork Selection (`Fork.jsx`):** Onboarded users choose their initial path:
    *   Create a new studio workspace.
    *   Join an existing studio workspace via a unique 8-character invitation code.

### 🌐 Central User Hub Dashboard
*   Lists all studio workspaces owned or managed by the user.
*   Lists all studio workspaces the user has joined as a team collaborator.
*   Features quick-action modal triggers for **Create New Studio** and **Join Studio via Invitation Code**.

---

## 3. Tenant Workspace Features

Once a studio is resolved (via path-based routing `/studio/{tenant}`), the application switches connection parameters to load that specific studio's isolated database.

### 📊 Workspace Dashboard
*   **AI-Assisted Sprint Orchestration Canvas:** Provides a command area and widgets for managing active development sprints.
*   **Agentic Sprint Chat Bar:** Taller, dual-row AI prompt interface permitting developers to interact with the scheduling agents (supports prompts, attachments, and mock voice input).
*   **Quick Actions Grid:** Dynamic triggers to:
    *   *Create Task:* Define sprint requirements.
    *   *Run GNN Match:* Match developers to tasks based on skills.
    *   *View Timeline:* Access the interactive Gantt chart.
    *   *Manage Team:* View developer allocations.
*   **Active Tasks Feed (Right Sidebar):** Lists active sprint tasks enriched with:
    *   Estimated Hours & Priorities (CRITICAL, HIGH, MEDIUM, LOW).
    *   Critical path indicators.
    *   GNN-calculated developer-to-task compatibility scores (e.g., `96% Fit`).

### 📁 Project Management Listing
*   **Total Projects & Active Collaborators Summary:** Metric badges at the top of the projects listing.
*   **Grid Listing:** Card grid showing active and planning initiatives.
*   **Interactive Modal:** Form to initialize a new project workspace.

### 📋 Project Kanban Workspace
*   **Kanban Board Columns:** Grouped by status: Backlog, To Do, In Progress, In Review, and Done.
*   **Task Search & Filter:** Dynamically filters task cards based on search queries (matching title, assignee, or category).
*   **AI Workload Balancer ("AI Balance Board"):** Activates workload optimization across column pipelines to balance developer capacity.

### 👥 Team Capacity Workspace
*   **Member Capacity Cards:** Displays user position, department (Engineering, Product, Design, QA), status (Active, Remote, Part-Time), email, phone, and joining date.
*   **Interactive Gantt Scheduler:** Interactive Gantt-style timeline board matching task allocations against hourly columns (10 AM to 9 PM).
*   **Role-Based Access Control (RBAC):** Restricts management actions (like inviting members, launching projects, and editing tasks) to owners, managers, and system administrators.

---

## 4. Machine Learning Engine Integrations

The Python backend (located in `ml-engine/`) runs as a service alongside the Laravel application to power all predictive features.

### 🧠 Graph Neural Network (GNN) Developer Matching
*   **Model:** Bipartite Heterogeneous Graph Neural Network (`HeteroGNNRecommendationModel`) built with PyTorch Geometric (PyG).
*   **Convolutions:** Utilizes GraphSAGE (`SAGEConv`) message passing to compute refined structural embeddings of developer nodes and task nodes.
*   **Match Fit Scorer:** Employs a Neural Link Prediction scoring head to compute the probability of a developer completing an incoming task, outputting compatibility ratings (e.g., `96% Fit`).
*   **Legacy RF Replacement:** Replaces old categorical overlap comparisons with deep structural similarity in the task-skill graph.

### 🧬 Genetic Algorithm & Random Forest Scheduler (`/api/optimize`)
*   **Optimization Framework:** DEAP (Distributed Evolutionary Algorithms in Python).
*   **Classification Engine:** Random Forest model to predict task delivery success probabilities.
*   **Functionality:** Generates optimal, load-balanced task allocations across developers to minimize schedule bottlenecks.

### 📈 Employability Forecasting (ARIMA)
*   **Model:** AutoRegressive Integrated Moving Average (ARIMA).
*   **Functionality:** Tracks and forecasts developer utilization rates and hiring requirements based on historical project scheduling workloads.

---

## 5. React Views & Implementation Status Map (Sorted by System Flow)

This section maps all implemented views, disconnected pages, missing routes, and mock machine learning features sequentially based on the **end-to-end user and data flow** of the system.

---

### 🌐 Phase 1: Global Authentication & Onboarding
*   **1. User Access & Login:**
    *   *Implemented View:* Centralized authentication views (Sign In, Register).
*   **2. Developer Passport Creation:**
    *   *Implemented View:* [Onboarding/Wizard.jsx](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Onboarding/Wizard.jsx) (`onboarding.show` -> `/onboarding`). Sets up developer profile features and skill metrics.
*   **3. Workspace Decision (Fork):**
    *   *Implemented View:* [Onboarding/Fork.jsx](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Onboarding/Fork.jsx) (`onboarding.fork` -> `/onboarding/fork`). Choose to create a new studio or join an existing one.
*   **🚨 To Implement in this Phase (ML Integration):**
    *   **Employability Rate Forecasting (ARIMA):** The forecasting logic exists in Python (`ml-engine/training/Employability_Rate_ARIMA.ipynb`), but there is no corresponding React view or API endpoint to query and render developer utilization forecast charts.

---

### 🌐 Phase 2: Central User Hub (Global Dashboard)
*   **1. Workspace Launchpad:**
    *   *Implemented View:* [Dashboard.jsx](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Dashboard.jsx) (`dashboard` -> `/dashboard`). Allows selecting, creating, or joining studios.
*   **2. Profile Details Configuration:**
    *   *Implemented View:* [Profile/Edit.jsx](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Profile/Edit.jsx) (`profile.edit` -> `/profile`).

---

### 🏢 Phase 3: Tenant Studio Dashboard (Workspace Entry)
*   **1. Workspace Overview:**
    *   *Implemented View:* [Tenant/Dashboard.jsx](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Dashboard.jsx) (`tenant.dashboard` -> `/studio/{tenant}/dashboard`). Displays the AI Canvas and quick actions.
*   **🚨 To Implement in this Phase (Page Views & ML):**
    *   **Studio Settings Page (Missing View):** The "Studio Settings" link in the sidebar (pointing to `/studio/{tenant}/settings`) has no registered route in `routes/tenant.php` and no view page in React.
    *   **GNN Match Score Sidebar Feed (Mocked ML):** The task feed in the dashboard right sidebar shows mock developer-to-task compatibility scores (e.g. `96% Fit`). The backend needs to connect this feed to the Python GNN matching script (`gnn_recommendation_inference.py`).

---

### 🏢 Phase 4: Project Listing & Selection
*   **🚨 To Re-connect in this Phase (Disconnected View):**
    *   **Project Hub Listing ([Tenant/Projects/Index.jsx](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Projects/Index.jsx)):** 
        *   *Status:* Disconnected.
        *   *Details:* The projects route `/projects` (`tenant.projects.index`) is currently hardcoded in `TenantProjectController.php` to render `Tenant/Projects/Show.jsx` (the Kanban board view) directly. It needs to be re-routed to this index file so that users can view all projects in a directory grid before opening a specific board.

---

### 🏢 Phase 5: Project Workspace & Kanban Board
*   **1. Kanban Task Management:**
    *   *Implemented View:* [Tenant/Projects/Show.jsx](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Projects/Show.jsx) (`tenant.projects.show` -> `/studio/{tenant}/projects/{project}`). Handles task state columns (Backlog, Todo, In Progress, Review, Done).
*   **🚨 To Implement in this Phase (Mocked ML Integrations):**
    *   **GNN Task Cards Fit Scores (Mocked ML):** Kanban cards display hardcoded match rates. These must be wired to execute the PyTorch Geometric GNN matching engine dynamically.
    *   **AI Workload Balancer (Mocked ML):** The "AI Balance Board" optimization button triggers a mockup `alert()` box. It must be connected to the FastAPI `/api/optimize` endpoint to run Genetic Algorithm scheduling.

---

### 🏢 Phase 6: Team Allocation & Milestones
*   **1. Team Directory & Timeline:**
    *   *Implemented View:* [Tenant/Team/Index.jsx](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Team/Index.jsx) (`tenant.team` -> `/studio/{tenant}/team`). Lists members and includes the interactive Gantt chart.
*   **🚨 To Implement in this Phase (Page Views):**
    *   **Task Network Visualization (Missing View):** The "Task Network" link in the sidebar (pointing to `/studio/{tenant}/tasks`) has no registered route in `routes/tenant.php` and no view page in React. A visualization view needs to be built to graph task critical paths and dependencies.

---

---

## 6. Role Evaluation & Required Feature Matrix

This section analyzes the purpose of each user role (both at the Global SaaS Platform level and within the Tenant Studio Workspaces) and identifies the specific features they require in the system.

### 🌐 A. Global Platform-Level Roles

#### 1. Platform Administrator (`admin`)
*   **Purpose:** Coordinates the SaaS multi-tenant infrastructure, manages user authentication/onboarding, monitors server configurations, and oversees global machine learning models.
*   **Required Features:**
    *   *Tenant Workspace Monitor:* List and manage all active studio database connections and storage buckets.
    *   *MLOps Dashboard:* Track performance metrics (loss, accuracy, latency) of GNN, GA, and ARIMA models.
    *   *User Administration:* Ability to update user platform roles and manage Global Passports.
    *   *System Telemetry:* Monitor API tokens and resource utilization rates.

#### 2. Registered Platform Developer (`programmer`)
*   **Purpose:** Represents an individual designer, programmer, manager, or writer seeking to collaborate on game initiatives across different studios.
*   **Required Features:**
    *   *Developer Passport Portal:* Setup and maintain skill proficiencies (among the 96 cataloged skills), timezone, and capacity.
    *   *Central Workspace Hub:* Create new studios or join workspaces using invitation codes.
    *   *Universal Account Settings:* Manage central profile configurations.

---

### 🏢 B. Tenant Workspace-Level Roles (Per Studio)

#### 1. Studio Owner (`owner`)
*   **Purpose:** The creator and coordinator of the studio workspace. Manages billing, subscription levels, high-level directory access, and overall team roles.
*   **Required Features:**
    *   *Invitation Generator:* Create and invalidate invite codes to invite developers to the studio.
    *   *Billing & Upgrades Dashboard:* Manage subscription models and compute credit limits.
    *   *Studio Settings Workspace:* Edit workspace name, description, and tenant configurations.
    *   *Access Control Panels:* Revoke access or change user roles inside the studio.

#### 2. Project Manager / Team Leader (`manager` / `leader`)
*   **Purpose:** Manages active project pipelines, structures sprints, creates tasks, and assigns development tasks using AI tools.
*   **Required Features:**
    *   *GNN Developer Matcher Interface:* Actively query the Heterogeneous GNN model to find the best developers for a specific task.
    *   *AI Workload Balancer:* Trigger Genetic Algorithm schedules to optimize timeline critical paths.
    *   *Interactive Gantt timeline:* Build and modify milestones and task hours dynamically.
    *   *Team capacity boards:* View team member availability and department distributions.
    *   *Project Creator:* Add new game initiatives and projects to the workspace.

#### 3. Project Lead (`lead`)
*   **Purpose:** The developer assigned to lead a specific project. Manages project details, milestones, and task pipelines.
*   **Required Features:**
    *   *Project Settings:* Update project status (active, planning, completed) and descriptions.
    *   *Kanban Board controls:* Modify task statuses and assign tasks to project members.

#### 4. Developer / Member (`member`)
*   **Purpose:** The individual developer, artist, or tester completing tasks.
*   **Required Features:**
    *   *Personalized Kanban Workspace:* Move tasks across columns (Backlog, To Do, In Progress, In Review, Done).
    *   *Task Network:* A graphical visualization showing task dependencies and critical path nodes assigned to them.
    *   *Agentic Chat Helper:* Ask natural language questions about sprint deadlines, task constraints, or capacity availability.


