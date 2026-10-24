# StudioSprint — Final Thesis Defense Demonstration Script & Reviewer

This document is the **official, step-by-step presenter script and technical reviewer** for the final thesis defense of **StudioSprint**. Presenters should follow this script chronologically during the live system defense.

---

## 📋 Demonstration Setup & Profile Separation

| Role | Browser Window | Starting URL | Purpose |
| :--- | :--- | :--- | :--- |
| **Studio Manager** | Window 1 (Left / Primary) | `http://localhost:8000/central` | Logged in as Studio Owner/Leader of **IndieCraft Studio**. Demonstrates central hub, AI workspace, sprint planning, project dashboards, emergency acknowledgment, and report generation. |
| **Studio Member** | Window 2 (Right / Incognito) | `http://localhost:8000/` | Starts at public Landing Page. Demonstrates account registration, developer passport onboarding, joining studio via invite code, personal dashboard, task completion, and filing emergency absence. |

---

## 🎬 Act I: Introduction & Thesis Summary

### Step 1: Introduce Presenter Names
* **Action:** Stand upright, face the panel, and introduce all researchers in alphabetical order.
* **Presenter Script:**
  > *"Good morning / afternoon members of the panel, our thesis adviser, and guests. We are the researchers behind StudioSprint: [Presenter A], [Presenter B], and [Presenter C]. Today, we are proud to present our system demonstration for our thesis study."*

---

### Step 2: Brief Summary & Introduction of Thesis
* **Action:** Deliver the 90-second executive summary of the research study.
* **Presenter Script:**
  > *"Modern indie game studios operate in highly constrained environments. Unlike AAA gaming corporations, indie teams face razor-thin delivery margins, severe multi-disciplinary bottlenecks (where code, 3D art, audio, and game physics intersect), and catastrophic burnout risks. When a key developer experiences fatigue or a sudden emergency, project milestones slip without warning.*
  >
  > *Existing project management platforms like Jira, Trello, or Monday.com are passive tracking tools—they record delays after they have already happened, but do not understand the underlying dependency network or developer cognitive capacity.*
  >
  > *To address this, we developed **StudioSprint**: an intelligent, human-centric SaaS workspace tailored specifically for indie development studios. StudioSprint integrates a **neuro-symbolic AI architecture**:*
  > 1. *A **Heterogeneous Bipartite Graph Neural Network (GNN)** that matches developers to tasks based on structural skill compatibilities;*
  > 2. *A **Critical Path Algorithm (CPA / CPM with PERT variance)** that mathematically schedules milestones and flags zero-slack bottlenecks; and*
  > 3. *A schema-constrained **Large Language Model (LLM)** orchestration layer that translates fuzzy user requirements into executable project sprints and plain-English managerial insights without hallucinations.*
  >
  > *We will now walk you through the end-to-end operational lifecycle of StudioSprint."*

---

## 🎬 Act II: Member Onboarding & Developer Passport

### Step 3: Member Sign Up
* **Browser Window:** Window 2 (Member Side)
* **Starting Page:** Landing Page (`/` rendered by `resources/js/Pages/Welcome.jsx`)
* **Navigation:** Click the **"Sign Up"** or **"Get Started"** button in the top navigation bar to go to `/register`.
* **Action:** Enter registration credentials:
  * **Full Name:** e.g., `Alex Vance`
  * **Email:** `alex.vance@example.com`
  * **Password & Confirmation:** `password123`
  * Click **"Create Account"**.
* **System Under-the-Hood Reaction:**
  * Laravel executes `RegisteredUserController::store()`.
  * The user record is inserted into the central landlord database (`users` table) with default role `programmer` and `working_status = 'active'`.
  * The `requires.onboarding` middleware (`app/Http/Middleware/EnsureOnboardingIsComplete.php`) intercepts the request and automatically redirects the user to `/onboarding`.
* **Presenter Talking Point:**
  > *"Notice that after registration, the developer cannot immediately access any workspace. StudioSprint enforces an onboarding security gate (`requires.onboarding`). Every developer must first establish a verifiable **Developer Passport** before they can participate in team sprints."*

---

### Step 4: Developer Passport Setup Wizard (`Onboarding/Wizard.jsx`)

The Onboarding Wizard consists of a 3-step structured profile creation followed by a workspace decision fork.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DEVELOPER PASSPORT WIZARD                       │
├───────────────────┬───────────────────────┬────────────────────────────┤
│ Step 1: Identity  │ Step 2: Skill Matrix  │ Step 3: Capacity/Timezone  │
│ Role: Frontend Dev│ 96 Technical Columns  │ 40h/week                   │
│ Experience: 5 yrs │ PHP, Laravel, TS (4★) │ Asia/Manila (UTC+8)        │
└───────────────────┴───────────────────────┴────────────────────────────┘
```

#### Step 4.1: Wizard Page 1 — Core Professional Identity
* **UI Component:** `Components/Onboarding/StepOneIdentity.jsx`
* **Form Inputs:**
  * **Primary Professional Role:** Select **"Frontend Developer"** (`position_id`).
  * **Industry Experience:** Enter **`5`** years (`experience_years`).
  * Toggle **"Open to studio invitations"** to `true`.
* **Action:** Click **"Continue to Skill Matrix"**.
* **Presenter Script:**
  > *"In Step 1, the developer establishes their professional identity. Behind the scenes, the position is linked to our canonical position ontology (`positions` table), which maps to one of 23 standardized developer profiles used by our recommendation models."*

#### Step 4.2: Wizard Page 2 — The Vector Skill Matrix
* **UI Component:** `Components/Onboarding/StepTwoSkills.jsx`
* **Form Inputs:**
  * Search and select **PHP**, rating it **4 out of 5 stars**.
  * Search and select **Laravel**, rating it **4 out of 5 stars**.
  * Search and select **TypeScript**, rating it **4 out of 5 stars**.
* **Action:** Click **"Continue to Logistics"**.
* **Technical Explanation:**
  * StudioSprint maintains a canonical 96-skill ontology across Languages, Frameworks, Mobile, Databases, DevOps, Game Engines, and AI.
  * Star ratings ($1..5$) are normalized by the backend into numerical weights $[0.2, 0.4, 0.6, 0.8, 1.0]$.
  * These ratings directly feed the 96-dimensional `skills_matrix` inside the GNN's 132-dimensional developer node feature tensor ($X_{\text{dev}}$).
* **Presenter Script:**
  > *"Step 2 configures the Developer Skill Matrix. Unlike plain resume bullet points, StudioSprint normalizes proficiencies on a 5-point scale across 96 indexed technical domains. This forms the mathematical feature vector that powers our Graph Neural Network matching algorithm."*

#### Step 4.3: Wizard Page 3 — Availability & Logistics
* **UI Component:** `Components/Onboarding/StepThreeLogistics.jsx`
* **Form Inputs:**
  * **Weekly Commitment Capacity:** Select **"40 hours / week"** (`max_hours_per_week = 40`).
  * **Primary Timezone:** Select **"Asia/Manila (GMT+8)"** (`timezone = 'Asia/Manila'`).
* **Action:** Click **"Complete Passport Setup"**.
* **System Under-the-Hood Reaction:**
  * The form posts to `route('onboarding.store')` (`OnboardingController::store`).
  * Records are created in the landlord database:
    * `global_profiles` row storing `max_hours_per_week = 40`, `timezone = 'Asia/Manila'`, `position_id`, and `experience_years = 5`.
    * `user_skills` rows linking the user to PHP, Laravel, and TypeScript with `proficiency_level = 4`.
  * User is redirected to `/onboarding/fork`.
* **Presenter Script:**
  > *"In Step 3, the developer defines their labor contract boundary. Setting a 40 hour per week capacity ceiling establishes the mathematical denominator for our **Utilization Rate** and **Burnout Risk** equations."*

#### Step 4.4: Workspace Decision Fork — Joining IndieCraft Studio
* **UI Component:** `resources/js/Pages/Onboarding/Fork.jsx`
* **Actions:**
  1. Switch mode toggle from "Create New Studio" to **"Join with Code"**.
  2. **Alt-Tab to Window 1 (Manager Side):**
     * On the `/central` page, locate the studio card for **"IndieCraft Studio"**.
     * Click the kebab menu (`...`) in the upper-right corner of the studio card.
     * Click **"Copy invite code"** (calls `/hub/studio/{id}/invite` and copies the 8-character token to clipboard).
  3. **Alt-Tab back to Window 2 (Member Side):**
     * Paste the copied invitation code into the **Invitation Code** input field.
     * Click **"Join Workspace"**.
* **System Under-the-Hood Reaction:**
  * Posts to `route('onboarding.join.store')` (`OnboardingController::joinStudio`).
  * Validates the code in `studio_invitations` table.
  * Attaches the user to `studio_members` with role `'member'` and `working_status = 'active'`.
  * Automatically redirects the user to the tenant workspace dashboard: `http://localhost:8000/studio/{tenant_id}/dashboard`.
* **Presenter Script:**
  > *"StudioSprint employs path-based multi-tenancy. When Alex joins IndieCraft Studio with the owner's invite code, the application automatically registers their membership and routes them into the tenant context `/studio/{tenant_id}/dashboard` without requiring domain-level DNS tricks."*

---

## 🎬 Act III: Member Dashboard Breakdown

### Step 5: Breakdown of Member Dashboard (`Tenant/MemberDashboard.jsx`)
* **Browser Window:** Window 2 (Member Side)
* **URL:** `/studio/{tenant}/dashboard` (Resolved by `TenantDashboardController::memberDashboard`)
* **UI Concept:** Monday.com-style Personal Workspace focused strictly on: *"What do I need to do next?"*

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MEMBER PERSONAL WORKSPACE                       │
├──────────────────────────┬─────────────────────────────────────────────┤
│ 1. Open Tasks Card       │ 2. Due Soon Alert Card                      │
│    Active backlog/todo   │    Tracks hard deadlines & overdue items    │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 3. Overall Progress      │ 4. Capacity / Hours This Week               │
│    Personal completed %  │    In-flight hours vs 40h weekly limit      │
├──────────────────────────┴─────────────────────────────────────────────┤
│ • Status Split Donut / Bar Chart: Visualizes personal task stages.     │
│ • "My Tasks" Priority Queue: Sorted by Critical Path -> Priority -> Due│
│ • "Needs My Review" Gated Section: Code review queue.                  │
│ • Recent Boards & Update Feed: Direct links to Sprints, Epics, Reports.│
└────────────────────────────────────────────────────────────────────────┘
```

* **Presenter Script & Component Breakdown:**
  > *"Upon joining, the member is greeted by their personalized dashboard. Notice how the data is strictly scoped to this specific member:
  >
  > 1. **Four Workload Metric Cards:**
  >    - **Open Tasks:** Displays active tasks broken down into To Do, In Progress, In Review, and Stuck.
  >    - **Due Soon:** Monitors items expiring within 48 hours or already overdue based on PERT dates.
  >    - **Overall Progress:** Measures the percentage of personal tasks marked completed.
  >    - **Hours This Week:** Compares current in-flight task hours against the member's 40-hour contract limit (`loadPercent`). If hours exceed 40, it triggers an `is_overloaded` visual alert.
  >
  > 2. **Task Priority Sorting:** Tasks are not displayed randomly. They are sorted deterministically:
  >    $$\text{Critical Path Tasks} \succ \text{Priority (CRITICAL } \to \text{ LOW)} \succ \text{Days Until Deadline}$$
  >
  > 3. **Needs My Review Section:** Enforces reviewer-gated quality control, ensuring pull requests and code tasks are peer-reviewed before sprint completion."*

---

## 🎬 Act IV: Manager Workspace & Visualizations

### Step 6: Returning to Manager Central Hub
* **Browser Window:** Window 1 (Manager Side)
* **URL:** `http://localhost:8000/central` (`CentralHub.jsx` rendered by `CentralDashboardController::index`)
* **Action:** Click the card for **"IndieCraft Studio"**.
* **System Under-the-Hood Reaction:**
  * Redirects to `/studio/{tenant}/dashboard`.
  * `TenantDashboardController::index` resolves user permissions via `resolveIsManager()`.
  * Because the user is `owner`/`leader`, the system renders `managerDashboard` (`Tenant/Dashboard.jsx`).

---

### Step 7: Breakdown of Manager Studio Visualizations (`Tenant/Dashboard.jsx`)
* **Browser Window:** Window 1 (Manager Side)
* **Presenter Script & Feature Walkthrough:**
  > *"While the member sees their individual tasks, the Studio Manager sees the executive health of the entire organization:
  >
  > 1. **Studio-Wide Progress & Active Sprint Widget:** Tracks overall studio delivery, remaining sprint days, and delivered story points against the sprint goal.
  > 2. **At-Risk & Bottleneck Monitor:** Highlights critical-path tasks with zero or negative total float ($TF \le 0$) or approaching deadline breaches.
  > 3. **Unassigned Tasks Alert:** Identifies backlog items needing developer allocation.
  > 4. **Team Capacity & Workload Table:** Displays every team member, their current `active_load_hours`, weekly capacity, computed `utilization_rate`, and real-time **Profile Health** pills (`Healthy`, `Watchlist`, `At Risk`).
  > 5. **Active Tasks Feed (Right Sidebar):** Displays in-flight tasks enriched with real-time **GNN Match Fit Scores** (e.g., `94% Fit`), showing how well each assignee matches their assigned task."*

---

## 🎬 Act V: AI Workspace & Sprint Planning

### Step 8: Open AI Workspace & Submit Feature Breakdown Prompt
* **Browser Window:** Window 1 (Manager Side)
* **Navigation:** Click **"AI Workspace"** in the left sidebar navigation (`/studio/{tenant}/ai-workspace`).
* **UI Component:** `resources/js/Pages/Tenant/AiWorkspace.jsx`
* **Action:** In the quick-action cards, click **"Plan Sprint"** (or paste the prompt template into the AI prompt bar):

```text
📝 Feature Breakdown Guide
Please fill in the details below. I will break this down into a complete set of tasks and sub-tasks for your team.

Create a task: the task is to create a fully functional landing page for Bayt al Quadra

Goal: create a fully functional landing page for Bayt al Quadra
Requirements: Laravel, PHP
Constraints: [Any technical limits — optional]
Done when: [Acceptance criteria — how we'll know it's finished]
```

* **Action:** Select project dropdown as **"New Project"** and click **Send** (`Enter`).
* **Presenter Script:**
  > *"We now open the AI Workspace. StudioSprint features an Agentic Command Center. Rather than manually creating dozens of Jira tickets, the manager provides high-level product intent using our structured Feature Breakdown Guide.
  >
  > When we submit this prompt, the backend executes our **Semantic Intent Router** (`/ai-router`). The system detects the `CREATE_TASK` / `NEW_PROJECT` intent and prepares our hierarchical decomposition pipeline."*

---

### Step 9: Customize Project Details & AI Sprint Decomposition
* **UI Component:** `CreateProjectModal.jsx` followed by `HierarchicalDecompositionModal.jsx`
* **Modal 1 (Create Project):**
  * Project Title: Pre-filled as `Bayt al Quadra Landing Page` (or editable).
  * Description: Preserved from prompt.
  * Click **"Create Project"**.
* **Modal 2 (Hierarchical Decomposition):**
  * The system automatically launches `HierarchicalDecompositionModal` with Server-Sent Events (SSE) streaming (`tenant.workspace.decompose-hierarchical-stream`).
  * **Live Stream Progress:** Watch the real-time stage progress:
    1. *Analyzing project description (10%)*
    2. *Extracting architectural Epics (30%)*
    3. *Decomposing atomic tasks (60%)*
    4. *Aligning 96 canonical skill matrices (85%)*
    5. *Synthesizing sprint structure (100%)*
* **Technical Explanation:**
  * Handled by `ml-engine/orchestration/intent_parser.py` via `decompose_project_hierarchical()`.
  * Constrained by strict Pydantic schemas (`ProjectDecompositionResult`, `EpicOutline`, `TaskParseResult`).
  * **Atomic Task Guardrail (`keep_tasks_atomic`):** Enforces a hard cap of maximum **40.0 hours** per task to prevent bloated, unmanageable work items.
* **Presenter Script:**
  > *"Notice the real-time SSE progress bar. The LLM is not just generating freeform text; it is strictly constrained by Pydantic schemas. It breaks the project into logical **Epics**, extracts atomic tasks capped at 40 hours, and maps requirements directly to canonical skills like PHP and Laravel."*

---

### Step 10: Generated Tasks Summary, Best-Fit Assignment, & Accept All
* **UI Component:** `HierarchicalDecompositionModal.jsx` (Phase transitions: `outline-solid` $\to$ `review` $\to$ `assign`)
* **Actions:**
  1. **Phase 1 (Outline Review):** Click **"Continue to task review"**.
  2. **Phase 2 (Task Review):** Inspect the generated tasks:
     * Task 1: e.g., *Database Schema & Migrations* (PHP, Laravel, 8h, Priority: HIGH)
     * Task 2: e.g., *Landing Page Blade / React Frontend* (TypeScript, HTML, 12h, Priority: MEDIUM)
     * Click **"Continue to member assignment"**.
  3. **Phase 3 (Member Assignment & Accept All):**
     * For each generated task, the modal queries `tenant.ml.preview-best-fit`.
     * The GNN evaluates candidate fit scores across all studio members.
     * Select or confirm the recommended assignee (e.g., our newly onboarded developer **Alex Vance** who has 4-star PHP/Laravel proficiency).
     * Click **"Confirm & Save (X tasks)"**.
* **System Under-the-Hood Reaction:**
  * Makes an atomic batch POST to `tenant.projects.hierarchy.bulk` (`TenantProjectController::storeBulkHierarchy`).
  * Creates `epics`, `sprints`, `tasks`, and initial `assignments` in the tenant database.
  * Triggers schedule recomputation via `RecomputeProjectSchedule`.
  * The modal callback redirects directly to the newly generated project dashboard: `route('tenant.projects.show', { project: id })`.
* **Presenter Script:**
  > *"During member assignment, StudioSprint calls the GNN engine to compute preview match scores for unsaved tasks. Alex Vance ranks as the top candidate because their passport contains 4-star PHP and Laravel proficiencies with zero schedule conflicts. With one click on 'Confirm & Save', all Epics, Sprints, and Tasks are atomically persisted to the tenant database."*

---

## 🎬 Act VI: Project Dashboard Deep-Dive

### Step 11: Breakdown of Project Dashboard (`Tenant/Projects/Show.jsx`)
* **Browser Window:** Window 1 (Manager Side)
* **URL:** `/studio/{tenant}/projects/{id}`

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PROJECT DASHBOARD SHELL                         │
│  Project: Bayt al Quadra   Key: BAY   Stack: Laravel, PHP   [On Track] │
├────────────────────────────────────────────────────────────────────────┤
│ TABS: [Dashboard] [Spreadsheet] [Sprint Planning] [Epics] [CPA] [Board]│
├────────────────────────────────────────────────────────────────────────┤
│ BAND 1: METRIC PULSE ROW (4 Equal Columns)                             │
│ 1. Project Completion: 0% (0/X tasks done)                             │
│ 2. Active Work: X tasks in progress (Segmented status bar)             │
│ 3. Critical Path: X critical tasks at risk / clear                     │
│ 4. Delivery Effort: 0 / X story points delivered                       │
├────────────────────────────────────────────────────────────────────────┤
│ BAND 2: CONTEXT ROW (1.5fr / 1fr)                                      │
│ • Priority Queue: Top 3 ranked critical tasks with due dates & avatar. │
│ • Project Details: Target release date, active sprint, key, and scope. │
├────────────────────────────────────────────────────────────────────────┤
│ BAND 3: INSIGHT CHARTS (410px Height Desktop Grid)                     │
│ • Sprint Delivery: Stacked Bar Chart of story points by stage & member.│
│ • Task Distribution: Donut Chart with centered completion percentage.  │
└────────────────────────────────────────────────────────────────────────┘
```

* **Presenter Script & Visual Walkthrough:**
  > *"We are now redirected to the Project Dashboard. Let us examine the core visualizations and metrics:
  >
  > 1. **Band 1: Metric Pulse Row:**
  >    - **Project Completion:** Quantifies progress as $\text{round}\left(\frac{\text{Completed Tasks}}{\text{Total Tasks}} \times 100\right)\%$.
  >    - **Active Work:** Visualizes in-flight work with a segmented color bar showing To Do (Slate), In Progress (Cyan), In Review (Amber), Done (Emerald), and Blocked (Rose).
  >    - **Critical Path Indicator:** Shows tasks with zero float. If a critical task is threatened, the badge flips from `Clear` (Emerald) to `At Risk` (Amber).
  >    - **Delivery Effort:** Tracks total Story Points burned versus total planned points.
  >
  > 2. **Band 2: Context Row:**
  >    - **Priority Queue:** Surfaces the top 3 highest-priority in-flight tasks, displaying their Critical Path badge, due date, story points, and assignee avatar.
  >    - **Project Details:** Executive summary card displaying target release date, project key, tech stack, and scope summary.
  >
  > 3. **Band 3: Insight Charts:**
  >    - **Sprint Delivery Chart:** A multi-colored stacked column chart showing story points across development stages, segmented by assignee.
  >    - **Task Distribution Donut Chart:** Renders proportional task states with a prominent centered completion percentage."*

---

## 🎬 Act VII: Member Task Execution & Manager Reflection

### Step 12: Member Inbox Notification Check
* **Browser Window:** Window 2 (Member Side)
* **Navigation:** Click **"Inbox"** in the left sidebar navigation (`/studio/{tenant}/inbox`).
* **UI Component:** `resources/js/Pages/Tenant/Inbox.jsx`
* **Observation:** Alex Vance sees high-priority notification cards:
  * *"You have been assigned to task #X: [Task Title]"* with project name, priority badge, and estimated hours.
* **Presenter Script:**
  > *"Switching to Alex Vance's member window, we see immediate real-time notifications in their Inbox. The system alerts them of their newly assigned tasks, complete with priority levels and delivery estimates."*

---

### Step 13: Updating Task Status to Complete
* **Browser Window:** Window 2 (Member Side)
* **Navigation:** Click **"Tasks"** or **"My Tasks"** in the sidebar (`/studio/{tenant}/tasks`).
* **UI Component:** `resources/js/Pages/Tenant/Tasks/Index.jsx`
* **Action:**
  1. Locate one of Alex's assigned tasks (e.g., *Database Schema & Migrations*).
  2. Click the task card to open the **Task Status Modal** (`UpdateTaskStatusModal.jsx`).
  3. Change the status from `To Do` / `In Progress` directly to **`Completed`**.
  4. Click **"Update Status"**.
* **Technical Explanation:**
  * Calls `PATCH /studio/{tenant}/tasks/{id}/status` (`TenantTaskController::updateStatus`).
  * Enforces **Reviewer-Gated Workflow Rules**:
    * If no reviewer is assigned, the assigned doer can move the task directly from `in_progress` to `completed`.
    * If a reviewer is assigned, the task must transition to `review` for peer approval.
    * Managers have administrative override authority.
  * Dispatches `TaskStatusUpdated` event and recalculates project schedule.
* **Presenter Script:**
  > *"Alex now opens their Tasks board and updates their assigned database task to 'Completed'. Notice our built-in reviewer gating: if a reviewer was specified, the task would be held in 'Review' status until peer approved. Since this task has no reviewer, it transitions directly to Completed."*

---

### Step 14: Showcase Live Updates on Manager Dashboard
* **Browser Window:** Window 1 (Manager Side)
* **Action:** Return to Window 1 and refresh or observe the Project Dashboard (`/studio/{tenant}/projects/{id}`) or Studio Dashboard (`/studio/{tenant}/dashboard`).
* **Observed Changes:**
  1. **Project Completion:** Percentage ticks up immediately (e.g., from $0\%$ to $25\%$).
  2. **Delivery Effort:** Delivered story points increment (e.g., $+8\text{ SP}$).
  3. **Task Distribution Donut:** The green 'Done' segment expands.
  4. **Active Work Bar:** Shifts from To Do to Completed.
* **Presenter Script:**
  > *"Returning to the Manager side, the executive dashboard instantly reflects the developer's progress. Completion percentages advance, burned story points increase, and the Donut Chart updates without manual spreadsheet reconciliation."*

---

## 🎬 Act VIII: Employee Health, Bandwidth, & Utilization

### Step 15: Sprint Planning & Overloading Member to 100% Utilization
* **Browser Window:** Window 1 (Manager Side)
* **Navigation:** On the Project page, click the **"Sprint planning"** tab (`SprintBreakdown.jsx`).
* **Action:**
  1. Locate multiple unassigned backlog tasks or click **"Add Task"**.
  2. Assign tasks to **Alex Vance** until their total active load equals or exceeds **40 hours** (e.g., assign tasks totaling $40\text{h}$ or $44\text{h}$).
  3. Save the assignments using the Assignment Modal (`ManageAssignmentModal.jsx`).
* **Presenter Script:**
  > *"Now we demonstrate how StudioSprint safeguards developer physical well-being. In typical project management software, a manager can blindly stack 80 hours of tasks onto a single developer without warning. In StudioSprint, we deliberately allocate 40 hours of tasks to Alex Vance to demonstrate our health constraints."*

---

### Step 16: Explanation of Utilization Rate & Bandwidth Tooltip
* **Browser Window:** Window 1 (Manager Side)
* **UI Component:** `resources/js/Components/Tenant/Projects/ManageAssignmentModal.jsx`
* **Action:** Hover the cursor over the **"Assignee Bandwidth & Health"** information tooltip (`<Info className="w-3.5 h-3.5" />`).
* **Observed Tooltip Content:**
  ```text
  Understanding Utilization Rate
  Measures active sprint workload against weekly contract limits to prevent developer fatigue and bottlenecking.

  • < 80%: Healthy (Available bandwidth)
  • 80% – 94%: Watchlist (Near full capacity)
  • ≥ 95%: At Risk (Overloaded / high burnout)
  ```
* **Mathematical & Operational Defense:**
  $$\text{Utilization Rate} = \text{round}\left(\frac{\text{active\_load\_hours}}{\text{max\_hours\_per\_week}} \times 100\right)\%$$
  $$\text{active\_load\_hours} = \sum_{\text{status} \in \{\text{todo, in\_progress, review}\}} \text{estimated\_hours}$$
* **Factors Affecting Health:**
  1. **Active Load Hours:** Cumulative sum of estimated hours on incomplete tasks.
  2. **Contract Capacity Ceiling:** Configured in developer passport (default: $40\text{h}$).
  3. **Task Concurrency:** Monitored against overload threshold ($\ge 3$ concurrent tasks) and hard cap ($\ge 5$ tasks).
  4. **Revision Churn Rate:** $\text{round}\left(\frac{\text{tasks}_{\text{review}}}{\text{tasks}_{\text{total}}} \times 100\right)\%$, tracking psychological fatigue from repetitive rework.
* **Presenter Script:**
  > *"When we hover over the **Assignee Bandwidth & Health** tooltip, the system explicitly defines our three clinical workload tiers:
  > - **Healthy (< 80%):** The engineer has available cognitive bandwidth.
  > - **Watchlist (80% – 94%):** The engineer is nearing full capacity; additional tasks will jeopardize delivery.
  > - **At Risk (≥ 95%):** The engineer is mathematically overloaded.
  >
  > Because we assigned 40 hours against Alex's 40-hour limit, their utilization is exactly **100%**, triggering the red **At Risk** badge."*

---

### Step 17: Demonstrate AI Best Fit Capacity Penalization
* **Browser Window:** Window 1 (Manager Side)
* **Action:**
  1. Click **"AI Best Fit"** (`BestFitModal.jsx`) on any new unassigned engineering task requiring PHP / Laravel.
  2. Observe the candidate recommendation ranking.
* **Observed System Behavior:**
  * Even though Alex Vance has 4-star PHP and Laravel skills, **Alex is no longer ranked #1**.
  * Alex's card displays:
    * Red **At Risk** health pill (`bg-rose-50 text-rose-600`).
    * **100% Utilization** badge.
    * A capacity penalty note: e.g., *"Raw GNN 94% · Capacity adjusted"*.
  * The LLM synthesized summary explicitly warns:
    > *"Alex Vance possesses high technical compatibility (94%), but is currently operating at 100% capacity (At Risk). Assigning this task will exceed weekly contract boundaries and create milestone bottlenecks."*
* **Presenter Script:**
  > *"This is the core of our research. The AI Best Fit algorithm does not naively look at skills alone. In `gnn.py`, the candidate feature tensor sets the workload dimension `work_matrix` to $1.0$ (maximum load). The operational governor applies a capacity dampening multiplier, and the LLM explicitly warns the manager that Alex is at burnout risk."*

---

## 🎬 Act IX: Member Declaration of Emergency & Manager Triage

### Step 18: Member Declares Absence from Profile
* **Browser Window:** Window 2 (Member Side)
* **Navigation:** Click on the top-right user avatar $\to$ **"Profile"** $\to$ Navigate to the **"Availability & Status"** tab (`AvailabilityForm.jsx` / `WorkingStatusForm.jsx`).
* **Action:** Click the button **"File Absence"** (opens `FileAbsenceModal.jsx`).

---

### Step 19: Filing an Urgent Emergency
* **UI Component:** `resources/js/Pages/Profile/Partials/FileAbsenceModal.jsx`
* **Actions:**
  1. Switch mode from "Scheduled Leave" to **"Urgent Emergency"** (`absenceType = 'emergency'`).
  2. **Emergency Category:** Select **"Medical / Health Emergency"** (`medical`).
  3. **Estimated Return Date:** Select 5 days from today.
  4. **Confidential Note / Reason:** Enter an operational notice of at least 15 characters:
     `"Acute severe medical emergency requiring immediate rest."`
  5. Click **"Confirm & Declare Emergency"**.
* **System Under-the-Hood Reaction:**
  * Submits to `POST /profile/emergency-status` (`ProfileController::declareEmergency`).
  * Validates `reason >= 15 chars` and user membership.
  * For members/leaders, status is logged as `pending_emergency` in `leave_requests`.
  * Generates an urgent notification (`emergency_declaration`) for studio leadership.
* **Presenter Script:**
  > *"Now imagine an unforeseen crisis occurs. Alex suddenly falls ill and cannot work. Alex navigates to Profile $\to$ Availability, selects **Urgent Emergency**, chooses **Medical Emergency**, and submits an operational notice. Notice our privacy protection: we do not collect invasive medical diagnostic telemetry; we only record operational capacity degradation."*

---

### Step 20: Manager Side Emergency Acknowledgment in Inbox
* **Browser Window:** Window 1 (Manager Side)
* **Navigation:** Click **"Inbox"** in the left sidebar (`/studio/{tenant}/inbox`).
* **UI Component:** `resources/js/Pages/Tenant/Inbox.jsx`
* **Observation:** The manager receives a prominent alert:
  * **Title:** `🚨 Emergency Declared: Alex Vance`
  * **Category:** `Medical / Health Emergency`
  * **Details:** Estimated return date, confidential note, and an itemized list of **Conflicting Active Tasks**.
* **Action:** Click the **"Acknowledge Emergency"** button (triggers `POST /studio/{tenant}/team/leave-requests/{id}/approve`).
* **System Reaction:**
  * Updates `leave_requests.status = 'approved'`.
  * Sets `studio_members.working_status = 'emergency'`.
  * Updates notification badge to `[Acknowledged • Reassign Tasks]`.
* **Presenter Script:**
  > *"Switching back to the Manager window, the emergency appears instantly in the Manager's Inbox. The manager clicks **Acknowledge**. This officially flags Alex's working status as 'emergency' and activates our schedule contingency protocol."*

---

### Step 21: Reassigning In-Flight Tasks via AI Best Fit
* **Browser Window:** Window 1 (Manager Side)
* **Action:**
  1. Inside the acknowledged emergency notification, locate the conflicting task.
  2. Click **"Reassign Task"** (or open the task in `Tenant/Projects/Show.jsx?reassign_task_id={id}`).
  3. Open **AI Best Fit** (`BestFitModal.jsx`).
* **Observed System Behavior:**
  * **Alex Vance is completely disabled and excluded** from the recommendation list with a visual badge: `Emergency Absence — Unavailable for assignment`.
  * The system highlights the next best available developer who has bandwidth (e.g., utilization $< 80\%$).
  * The manager selects the replacement developer and clicks **Save Assignment**.
* **Presenter Script:**
  > *"When the manager reassigns the stalled task, the GNN engine automatically excludes Alex Vance because their availability bit `avail_matrix` is zero. The system recommends the next best available teammate, guaranteeing sprint continuity."*

---

### Step 22: Architectural Purpose of Emergency Logic (Why Tasks are Not Silently Dropped)
* **Presenter Defense Speech (Directly Addressing Anticipated Panel Questions):**
  > *"Panelists often ask: **'Why didn't the system automatically dump all of Alex's tasks into the unassigned backlog the second they declared an emergency?'**
  >
  > Our thesis study made a deliberate, research-backed architectural decision against silent task stripping:
  > 1. **Code Merge & Branch Integrity:** In software engineering, in-flight tasks frequently have active git branches, half-written pull requests, or uncommitted database migrations. Silently unassigning them creates orphaned branches and severe merge collisions.
  > 2. **Human-in-the-Loop Governance:** Autonomous AI reallocations without manager oversight cause chaotic task churn. StudioSprint keeps the tasks visible under the developer's name, flags them as bottlenecked in the At-Risk bucket, and alerts the manager to make an informed, surgical reallocation.
  > 3. **Critical Path Recalculation:** The moment the delay is recognized, our Critical Path Engine computes total float. If the stalled task threatens the project deadline, the system immediately flags the slipped hours on the Gantt timeline."*

---

## 🎬 Act X: Executive Report Center & PDF Export

### Step 23: Report Center & Export PDF
* **Browser Window:** Window 1 (Manager Side)
* **Navigation:** Click **"Reports"** in the left sidebar navigation (`/studio/{tenant}/reports`).
* **UI Component:** `resources/js/Pages/Tenant/Reports/Index.jsx`
* **Action:**
  1. From the Available Report Types, select **"Project Summary Report"** (or **"Sprint Performance Report"**).
  2. Select the target project: `Bayt al Quadra Landing Page`.
  3. Click **"Download PDF"** (`/studio/{tenant}/reports/download-pdf`).
  4. Open the downloaded PDF in Chrome or your PDF viewer.

---

### Step 24: Comprehensive Breakdown of Exported PDF Data & Insights
* **Document Under Review:** The generated PDF produced by `app/Services/ReportPdfGenerator.php`.
* **Presenter Script & Section-by-Section Walkthrough:**

```
┌────────────────────────────────────────────────────────────────────────┐
│                      STUDIOSPRINT EXECUTIVE REPORT                     │
│  [Hexagon Logo]                                  DOCUMENT CONTROL      │
│                                                  REF: SS-RPT-839201    │
│  PROJECT SUMMARY REPORT                          Date: 10/25/2026      │
│  Executive status, KPI metrics, and task audit   Period: Historical    │
├────────────────────────────────────────────────────────────────────────┤
│ METADATA DETAILS RIBBON                                                │
│ • Scope: Bayt al Quadra   • Type: Project Summary                      │
│ • Generated By: Manager   • Status: ON TRACK (Emerald)                 │
├────────────────────────────────────────────────────────────────────────┤
│ EXECUTIVE PERFORMANCE SUMMARY (4 Scorecard Cards)                      │
│ ┌─────────────────┬─────────────────┬────────────────┬───────────────┐ │
│ │DELIVERY ADHERENC│VELOCITY DELIV'D │UNRESOLVED SCOPE│RESOURCE ALLOC │ │
│ │      25%        │      8 SP       │    3 Tasks     │   2 Members   │ │
│ │ 1 of 4 resolved │ of 32 SP planned│ 0 overdue items│ Active contrib│ │
│ └─────────────────┴─────────────────┴────────────────┴───────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│ TWO MIDDLE INTELLIGENCE CARDS                                          │
│ • SCOPE & STATUS ALLOCATION: Multi-color Donut Chart (Done, In-Prog, To│
│   Do) with centered completion rate.                                   │
│ • CUMULATIVE DELIVERY TRAJECTORY: Visual line chart comparing planned  │
│   velocity burnup against delivered story points.                      │
├────────────────────────────────────────────────────────────────────────┤
│ DETAILED TASK AUDIT LOG (Itemized Forensic Table)                      │
│ ID · Task Title · Assignee · Status Badge · Story Points · Due Date    │
└────────────────────────────────────────────────────────────────────────┘
```

* **Presenter Script:**
  > *"Finally, we examine the executive deliverable generated by our **Report Center**. Our PDF generator is implemented entirely in pure PHP (`ReportPdfGenerator.php`), ensuring zero external dependencies and pixel-perfect fidelity:
  >
  > 1. **Document Control Box:** Provides tamper-evident audit tracking with unique reference codes (`SS-RPT-XXXXXX`), timestamps, and reporting periods.
  > 2. **Four Executive Scorecards:**
  >    - **Delivery Adherence:** Percentage of completed sprint deliverables ($25\%$).
  >    - **Velocity Delivered:** Actual Story Points completed versus total planned points ($8 / 32\text{ SP}$).
  >    - **Unresolved Scope:** In-flight tasks flagged by overdue status.
  >    - **Resource Allocation:** Total active contributing human resources.
  > 3. **Intelligence Visualization Cards:**
  >    - **Scope & Status Allocation:** Renders vector-drawn multi-colored donut arcs illustrating task distribution.
  >    - **Delivery Trajectory:** Renders planned velocity versus actual burnup curves.
  > 4. **Detailed Task Audit Log Table:** An itemized, multi-page forensic audit table detailing every task ID, title, assignee, story points, and delivery adherence status.
  >
  > *This document bridges the gap between ground-level engineering execution and executive publisher reporting."*

---

## 🎬 Act XI: Defense Conclusion & Transition to Panel Q&A

* **Action:** Both presenters stand together, face the panel, and conclude.
* **Presenter Closing Statement:**
  > *"To summarize: StudioSprint provides indie game studios with an intelligent, human-centric workspace that harmonizes three foundational computer science technologies:
  > 1. **PyTorch Geometric Graph Neural Networks** for deep structural developer matching;
  > 2. **Critical Path CPM and PERT Algorithms** for deterministic bottleneck prevention; and
  > 3. **Schema-Constrained LLM Orchestration** for grounded, hallucination-free project decomposition and managerial decision-support.
  >
  > Most importantly, StudioSprint protects the human element of software development—preventing burnout, respecting physical capacity limits, and guaranteeing operational continuity even in the face of sudden medical emergencies.
  >
  > Thank you very much, and we are now ready for your questions."*
