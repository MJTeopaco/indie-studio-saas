# StudioSprint — Final Thesis Defense Presentation & Reviewer Suite

Welcome to the **StudioSprint Final Thesis Defense Documentation Suite**. This directory contains the official reviewer materials, step-by-step demonstration scripts, technical deep-dives, mathematical formulas, and panel defense Q&A preparation designed for the thesis presenters.

---

## 📁 Directory Structure

| File | Document Title | Description | Target Use During Defense |
| :--- | :--- | :--- | :--- |
| **[`README.md`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/docs/final_defense/README.md)** | **Defense Suite Overview** | Setup instructions, dual-browser preparation, and flow map. | 15 minutes before defense |
| **[`01_FINAL_DEFENSE_DEMO_SCRIPT.md`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/docs/final_defense/01_FINAL_DEFENSE_DEMO_SCRIPT.md)** | **Step-by-Step Demonstration Script** | Complete click-by-click flow (Steps 1–24), exact spoken presenter scripts, UI breakdowns, and system under-the-hood reactions. | Live during presentation |
| **[`02_TECHNICAL_CONCEPTS_AND_FORMULAS.md`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/docs/final_defense/02_TECHNICAL_CONCEPTS_AND_FORMULAS.md)** | **Technical Guide & Equations** | Deep dive into GNN, CPA/CPM, PERT, Neuro-symbolic LLM orchestration, Multi-tenancy, Bandwidth/Health formulas, and PDF architecture. | Reviewer & defense basis |
| **[`STORY_POINTS_EXPLAINED.md`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/docs/final_defense/STORY_POINTS_EXPLAINED.md)** | **Story Points Plain-English Guide** | "Dumbed-down" guide for presenters: what Story Points are, pizza analogies, why not hours, AI suggestions, and CPA bridge. | Reviewer & presenter cheat sheet |
| **[`03_PANEL_DEFENSE_QA_CHEATSHEET.md`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/docs/final_defense/03_PANEL_DEFENSE_QA_CHEATSHEET.md)** | **Panel Q&A & Defense Cheatsheet** | Anticipated panelist/adviser questions with authoritative, codebase-grounded answers and citations. | Open during panel Q&A |

---

## 🖥️ Pre-Defense Setup & Environment Checklist

### 1. Server Terminals (Must all be green and running)
Before opening any browser, ensure the three fundamental server services are active:
1. **Laravel Backend:** `npm run php:serve` (Runs on `http://127.0.0.1:8000`)
2. **React/Inertia Frontend:** `npm run dev` (Runs Vite HMR on `http://127.0.0.1:5173`)
3. **Python ML Engine:** `npm run ml:serve` (Runs FastAPI microservice on `http://127.0.0.1:8001`)

### 2. Dual-Browser Window Setup (Crucial Requirement)
Prepare **two distinct Chrome browser windows** (or one normal profile and one Incognito/Guest profile) arranged side-by-side or mapped to convenient `Alt + Tab` switching:

```
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│       WINDOW 1: STUDIO MANAGER       │  │        WINDOW 2: STUDIO MEMBER       │
│                                      │  │                                      │
│  • URL: http://localhost:8000/central│  │  • URL: http://localhost:8000/       │
│  • Account: Studio Owner / Leader    │  │  • Account: Newly Registered Member  │
│  • Role: Coordinates studio, plans   │  │  • Role: Completes tasks, logs       │
│    sprints, triages emergencies.     │  │    absences, checks personal inbox.  │
└──────────────────────────────────────┘  └──────────────────────────────────────┘
```

> [!IMPORTANT]
> **Why 2 Browsers?**
> StudioSprint utilizes path-based multi-tenancy and role-based access control (RBAC). Using two separate sessions demonstrates **real-time bi-directional synchronization**, role-gated UI permission states, and how manager-side allocations propagate directly to developer personal workstreams.

---

## ⏱️ High-Level 24-Step Demonstration Roadmap

```mermaid
flowchart TD
    subgraph PHASE_1["1. Introduction & Setup"]
        S1["1. Introduce Names (Alphabetical)"] --> S2["2. Thesis Summary & Core Problem"]
    end

    subgraph PHASE_2["2. Developer Onboarding (Member Side)"]
        S3["3. Sign Up New Account"] --> S4["4. Developer Passport Wizard"]
        S4 --> S4_1["4.1 Role & Experience"]
        S4_1 --> S4_2["4.2 96-Skill Vector Matrix"]
        S4_2 --> S4_3["4.3 Capacity (40h) & Timezone"]
        S4_3 --> S4_4["4.4 Fork: Join IndieCraft Studio"]
    end

    subgraph PHASE_3["3. Dashboards & AI Planning (Manager Side)"]
        S5["5. Member Dashboard Breakdown"] --> S6["6. Manager /central Hub"]
        S6 --> S7["7. Studio Visualizations Breakdown"]
        S7 --> S8["8. AI Workspace: Plan Sprint Prompt"]
        S8 --> S9["9. Project Customization & Decomposition"]
        S9 --> S10["10. Generated Tasks & Best-Fit Assignment"]
        S10 --> S11["11. Project Dashboard Deep-Dive"]
    end

    subgraph PHASE_4["4. Task Lifecycle & Execution (Member Side)"]
        S11 --> S12["12. Member Inbox Notifications"]
        S12 --> S13["13. My Tasks & Complete Status Update"]
        S13 --> S14["14. Manager Dashboard Real-Time Reflection"]
    end

    subgraph PHASE_5["5. Employee Health & Utilization"]
        S14 --> S15["15. Sprint Planning Task Overload (100%)"]
        S15 --> S16["16. Utilization Rate & Health Tooltip"]
        S16 --> S17["17. AI Best Fit Capacity Penalty Demo"]
    end

    subgraph PHASE_6["6. Emergency Absence & Triage"]
        S17 --> S18["18. Member Profile: Availability & Status"]
        S18 --> S19["19. File Absence: Urgent Emergency"]
        S19 --> S20["20. Manager Inbox Emergency Acknowledgment"]
        S20 --> S21["21. Task Reassignment via AI Best Fit"]
        S21 --> S22["22. Architectural Purpose of Emergency Logic"]
    end

    subgraph PHASE_7["7. Executive Reporting & PDF Export"]
        S22 --> S23["23. Report Center & Download PDF"]
        S23 --> S24["24. Breakdown of Exported PDF Data & Insights"]
    end

    PHASE_1 --> PHASE_2 --> PHASE_3 --> PHASE_4 --> PHASE_5 --> PHASE_6 --> PHASE_7
```

---

## 🎯 Defense Core Principles to Emphasize

1. **Neuro-Symbolic Architecture (Separation of Concerns):**
   - The LLM **never** guesses schedules, dates, or match probabilities.
   - Deterministic algorithms (**PyTorch Geometric GNN** and **Critical Path Method**) compute exact math.
   - The LLM (**LangChain / Ollama**) parses unstructured text and synthesizes executive explanations.

2. **Human-Centric Labor Protection:**
   - The platform treats developer capacity as a finite, non-linear physical resource.
   - Overloading past contract thresholds ($>80\%$ Watchlist, $\ge 95\%$ At Risk) triggers algorithmic penalties.
   - Emergency declarations maintain data privacy—no invasive medical diagnostic records are kept, yet the critical path is immediately protected.

3. **No Silent Task Dropping (Anti-Slop Design):**
   - When developers declare an emergency, tasks remain assigned until a manager explicitly triages them. This prevents git merge collisions, dangling branch context, and unassigned backlog bloat.

4. **Multi-Tenant Data Isolation:**
   - Landlord database stores global passports, studio registry, and auth.
   - Tenant database isolates sprint backlog, task dependencies, channel messages, and reports.
