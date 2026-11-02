# Implementation Plan: Task Details Side Panel Redesign

## Overview
This document delivers the architectural scan, inventory, behavioral findings, sizing proofs, and ordered implementation blueprint for redesigning the **Task Details side panel** (`TaskFlyoutInspector.jsx`) across the Indie Studio SaaS application.

---

## A1. Inventory

### 1. Panel Components & Internal Sections
The primary implementation file for the side panel is [`resources/js/Components/Tenant/Tasks/TaskFlyoutInspector.jsx`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Components/Tenant/Tasks/TaskFlyoutInspector.jsx). It consists of the following architectural sections:

1. **Overlay & Sheet Shell (`TaskFlyoutInspector.jsx:L200-L245`):**
   - Fullscreen viewport container (`fixed inset-0 z-50 overflow-hidden`).
   - Backdrop scrim (`fixed inset-0 bg-black/70 dark:bg-black/85 backdrop-blur-md`).
   - Right-anchored drawer sheet (`fixed inset-y-0 right-0 z-50 flex flex-col`).
2. **Topline Eyebrow Bar (`L247-L297`):**
   - Project name / task key monospace badge (`taskKey`, font size `10px`, uppercase).
   - Breadcrumb label (`Task Details`, `9px` uppercase muted).
   - Desktop keyboard reminder text (`ESC to close`, `9px` uppercase mono).
   - Dismiss button (`X` icon, `13px` x `13px`).
3. **Heading Block (`L299-L374`):**
   - Project name eyebrow (`10px` uppercase muted).
   - Task title heading (`17px` font-semibold, `line-height: 1.4`).
   - Badge metadata row: Task classification pill (`9px` font-semibold), Story points badge (`9px` mono primary), Priority badge (`9px` uppercase).
4. **Tab Navigation Bar (`L376-L434`):**
   - Details tab button (`11px` font-medium, `height: 36px`, border-bottom `2px solid var(--primary)`).
   - Activity tab button (`11px` font-medium, comment count pill `9px` mono).
5. **Scrollable Region Body (`L436-L848`):**
   - `flex-1 overflow-y-auto custom-scrollbar`.
   - **Section 1: Properties (`L441-L579`):** Labeled grid rows (`gridTemplateColumns: '1fr 1.35fr'`, `minHeight: '34px'`) for Assignee select (`10px`), Priority select (`10px`), and Story Points numeric input (`10px` mono, `width: 56px`).
   - **Section 2: Schedule & Urgency Card (`L581-L664`):** Surface card (`padding: 10px 12px`, rounded `8px`) with Calendar icon, constraint/due date (`14px` bold mono), CPA urgency badge, plain-language consequence statement (`10.5px`), and managerial action invitation ("Next Step:").
   - **Section 3: Acceptance Criteria (`L666-L707`):** Section header (`10px` uppercase) with list of criteria bullets (`10px` text, `w-1.5 h-1.5` primary dot).
   - **Section 4: Status Picker Grid (`L709-L773`):** 2-column grid (`gap: 6px`) containing 6 buttons (`height: 32px`, `fontSize: 9px`) for `todo`, `in_progress`, `review`, `overdue`, `stuck`, and `completed`.
   - **Activity Panel (`L775-L847`):** Scrollable comments thread with timestamp (`9px` mono), comment author (`10px` font-semibold), comment body, and comment composer textarea (`11px`) with submit button (`height: 28px`, `fontSize: 10px`).
6. **Sticky Action Footer (`L850-L906`):**
   - Footer container (`height: 54px`, `padding: 10px 20px`, `borderTop: 1px solid var(--border)`).
   - Secondary button: `Close` (`height: 34px`, `fontSize: 11px`, `padding: 0 14px`, `border: 1px solid var(--border)`).
   - Primary button: `Mark Complete` / `Awaiting Reviewer` / `Completed` (`height: 34px`, `fontSize: 11px`, `padding: 0 16px`, `bg-[var(--primary)] text-white`).

---

### 2. Every Place That Opens the Panel
The task details side panel (`TaskFlyoutInspector`) is invoked across 5 core views:

| Page / Component | Line Reference | Trigger Interaction | Context & State Variable |
| :--- | :--- | :--- | :--- |
| **Tasks Page — Board View** ([`BoardView.jsx`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Components/Tenant/Tasks/BoardView.jsx#L236)) | `BoardView.jsx:L236`, mounted in [`Tasks/Index.jsx:L449`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Pages/Tenant/Tasks/Index.jsx#L449) | Clicking any task card in Kanban columns | `selectedTask` (Index.jsx state) |
| **Tasks Page — List View** ([`ListView.jsx`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Components/Tenant/Tasks/ListView.jsx#L185)) | `ListView.jsx:L185`, mounted in [`Tasks/Index.jsx:L449`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Pages/Tenant/Tasks/Index.jsx#L449) | Clicking any task row in table | `selectedTask` (Index.jsx state) |
| **Tasks Page — Timeline View** ([`TimelineView.jsx`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Components/Tenant/Tasks/TimelineView.jsx#L379)) | `TimelineView.jsx:L379`, `L407`, mounted in [`Tasks/Index.jsx:L449`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Pages/Tenant/Tasks/Index.jsx#L449) | Clicking task row or Gantt bar | `selectedTask` (Index.jsx state) |
| **Tasks Page — Due Tasks View** ([`DueView.jsx`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Components/Tenant/Tasks/DueView.jsx#L98)) | `DueView.jsx:L98`, mounted in [`Tasks/Index.jsx:L449`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Pages/Tenant/Tasks/Index.jsx#L449) | Clicking any grouped due item row | `selectedTask` (Index.jsx state) |
| **Project Workspace — Dashboard Band 2** ([`Show.jsx`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Pages/Tenant/Projects/Show.jsx#L697)) | `Show.jsx:L697`, mounted at `Show.jsx:L1458` | Clicking task row in Priority Queue card | `selectedInspectorTask` |
| **Project Workspace — Tasks Table Tab** ([`Show.jsx`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Pages/Tenant/Projects/Show.jsx#L1162)) | `Show.jsx:L1162`, mounted at `Show.jsx:L1458` | Clicking table row in spreadsheet view | `selectedInspectorTask` |
| **Project Workspace — Epics Tab** ([`Show.jsx`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Pages/Tenant/Projects/Show.jsx#L1250-L1300)) | Backlog items under epics | Clicking task item | `selectedInspectorTask` |
| **Project Workspace — Critical Path Tab** ([`Show.jsx`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Pages/Tenant/Projects/Show.jsx#L1314)) | `Show.jsx:L1314`, mounted at `Show.jsx:L1458` | Clicking node / item on critical path | `selectedInspectorTask` |
| **Project Workspace — Board Tab** ([`Show.jsx`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Pages/Tenant/Projects/Show.jsx#L1408)) | `Show.jsx:L1408`, mounted at `Show.jsx:L1458` | Clicking Kanban task card in sprint board | `selectedInspectorTask` |
| **Member Dashboard — Today's Focus** ([`MemberDashboard.jsx`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Pages/Tenant/MemberDashboard.jsx#L892)) | `MemberDashboard.jsx:L892`, mounted at `L1184` | Clicking today's focus row | `selectedTask`, `isInspectorOpen` |
| **Member Dashboard — Assigned Tasks** ([`MemberDashboard.jsx`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Pages/Tenant/MemberDashboard.jsx#L1013)) | `MemberDashboard.jsx:L1013`, mounted at `L1184` | Clicking row in active tasks table | `selectedTask`, `isInspectorOpen` |
| **Studio Dashboard — Needs Attention** ([`Dashboard.jsx`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Pages/Tenant/Dashboard.jsx#L875)) | `Dashboard.jsx:L875`, mounted at `L1093` | Clicking critical task row | `selectedTask`, `isInspectorOpen` |
| **Studio Dashboard — Upcoming Tasks** ([`Dashboard.jsx`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Pages/Tenant/Dashboard.jsx#L976)) | `Dashboard.jsx:L976`, mounted at `L1093` | Clicking table row in upcoming tasks | `selectedTask`, `isInspectorOpen` |
| **Studio Overview — Needs Attention** ([`Overview.jsx`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Pages/Tenant/Dashboard/Overview.jsx#L421)) | `Overview.jsx:L421`, mounted at `L469` | Clicking task alert row | `selectedTask`, `isInspectorOpen` |
| **Studio Overview — Upcoming Tasks** ([`Overview.jsx`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Pages/Tenant/Dashboard/Overview.jsx#L453)) | `Overview.jsx:L453`, mounted at `L469` | Clicking upcoming task row | `selectedTask`, `isInspectorOpen` |

*(Note on related dialogs: [`MemberTaskDetailModal.jsx`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Components/Tenant/Tasks/MemberTaskDetailModal.jsx) is a centered modal dialog used in [`Inbox.jsx`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Pages/Tenant/Inbox.jsx#L3402) for inbox task alerts; it shares the same backend update endpoint and reviewer gating rules).*

---

### 3. Leader vs Member Variants & Permission Logic
The component receives `canManage` (boolean), `currentUserId` (int), and `task` props:
- **`canManage = true` (Leader / Manager / Studio Owner):**
  - Allowed to edit any task property (Assignee, Priority, Story Points, Due Date).
  - Can transition any task status directly to `completed` / `done`.
  - Authorized to see the managerial Next Step coaching prompt (`cpaInfo.actionPrompt`).
- **`canManage = false` (Team Member):**
  - **Reviewer Gating (`TaskFlyoutInspector.jsx:L106-L110`):**
    - `isReviewer`: User matches `task.reviewer_user_id`. Can mark task as `completed` / `done`.
    - `isDoer`: User matches `task.assigned_user_id` or `task.assignee.id`.
    - `hasReviewer`: Task has a designated reviewer.
    - `canMarkDone = Boolean(canManage || isReviewer || (!hasReviewer && isDoer))`.
  - **Enforcement in UI:**
    - If `!canMarkDone`, the `completed` option in the status grid is disabled (`opacity-40 cursor-not-allowed`) with a tooltip: `"Only ${reviewerDisplayName} or a manager can mark this task as done."`.
    - The sticky footer primary button is disabled and displays `"Awaiting Reviewer"` instead of `"Mark Complete"`.
    - The managerial Next Step coaching prompt is hidden or suppressed.

---

### 4. Current Measurements as Found in Code

| Element | Width / Height | Padding & Spacing | Typography / Font Sizes | Colors |
| :--- | :--- | :--- | :--- | :--- |
| **Drawer Sheet** | `width: min(100%, 400px)`, `height: 100dvh` | None (outer container) | N/A | `bg-[var(--elevated)]`, `borderLeft: 1px solid var(--border)`, shadow `-12px 0 32px -4px rgba(0,0,0,0.45)` |
| **Backdrop Scrim** | `inset-0` (fullscreen) | None | N/A | `bg-black/70 dark:bg-black/85 backdrop-blur-md` |
| **Topline Bar** | `height: 50px` | `padding: 0 54px 0 20px` | Task key `10px` mono bold; Breadcrumb `9px` muted uppercase; ESC `9px` mono | `bg-[var(--elevated)]`, `borderBottom: 1px solid var(--border)` |
| **Heading Block** | Shrink-0, variable height | `padding: 16px 20px 12px` | Project `10px` muted; Title `17px` font-semibold; Badges `9px` font-semibold | `bg-[var(--elevated)]`, `borderBottom: 1px solid var(--border)` |
| **Tabs Bar** | `height: 36px` | `padding: 0 20px`, `gap: 16px` | Tabs `11px` font-medium; Count pill `9px` mono | Tab active: `2px solid var(--primary)` border-bottom; inactive: transparent |
| **Properties Section** | Dynamic | `padding: 14px 20px`, `space-y-1.5` | Labels `10px` muted; Inputs/selects `10px`, points `10px` mono | Inputs `bg-[var(--card)]`, `border: 1px solid var(--border)` |
| **Schedule Card** | Dynamic | `padding: 14px 20px` (outer), `10px 12px` (inner) | Date `14px` bold mono; Badge `10px` bold; Consequence `10.5px`; Action `11px` | Inner card `bg-[var(--card)]`, `border: 1px solid var(--border)` |
| **Acceptance Criteria** | Dynamic | `padding: 14px 20px`, `gap: 7px` | Section title `10px` uppercase; Item text `10px` | Dots `w-1.5 h-1.5 bg-[var(--primary)]` |
| **Status Grid** | Dynamic | `padding: 14px 20px`, 2-col `gap: 6px` | Buttons `height: 32px`, `fontSize: 9px` | Selected: `color-mix(primary 12%, card)`, border `var(--primary)`. Unselected: `var(--card)`. |
| **Activity Feed** | Dynamic | `padding: 16px 20px`, `space-y-2.5` | Text `10px`, time `9px` mono, textarea `11px`, post button `10px` / `h-28px` | Composer `bg-[var(--card)]`, `border: 1px solid var(--border)` |
| **Footer** | `height: 54px` (approx) | `padding: 10px 20px`, `gap: 10px` | Buttons `height: 34px`, `fontSize: 11px` | Close: `bg-[var(--card)] border`; Primary: `bg-[var(--primary)] text-white` |

---

## A2. Behavior Findings

### 1. What "Overdue" and "Blocked / Stuck" Currently Do

#### A. Overdue
- **Value Sent & Validation:** When selected in `TaskFlyoutInspector`, it sends `status: 'overdue'` and `sprint_status: 'overdue'`. The backend controllers ([`TenantTaskController.php:L278`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/app/Http/Controllers/TenantTaskController.php#L278) and [`TenantProjectController.php:L836`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/app/Http/Controllers/TenantProjectController.php#L836)) validate `'status' => 'in:todo,in_progress,review,completed,stuck,overdue'`. The database accepts this value.
- **Board Behavior:** In [`BoardView.jsx:L277`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Components/Tenant/Tasks/BoardView.jsx#L277) and [`Show.jsx:L157-L170`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/Pages/Tenant/Projects/Show.jsx#L157-L170), the Kanban board automatically moves tasks into the Overdue column if `task.days_until_deadline < 0` or `task.due_date < today`, even if the database status is `todo` or `in_progress`.
- **Finding:** **"Overdue" is a temporal calculation, not a workflow phase.** Making it a clickable button in the workflow status picker creates data dissonance (a task that is In Progress but late has its workflow phase erased if switched to "overdue").
- **Specification Decision:** In Phase B, **"Overdue" will be rendered as an automatic status/urgency badge in the header**, and will be removed from the manual status picker so it does not compete with workflow transitions.

#### B. Blocked / Stuck
- **Value Sent & Validation:** Sends `status: 'stuck'` and `sprint_status: 'stuck'`. Both controllers validate `'in:...,stuck'`.
- **Board Behavior:** In `BoardView.jsx`, tasks with `status === 'stuck'` appear in the **Stuck** column (colored orange). In `Show.jsx`, tasks with `status === 'stuck'` appear in the **Blocked** column (colored critical red).
- **Finding:** "Stuck" represents an exceptional interruption rather than a progression step in the normal software lifecycle.
- **Specification Decision:** In Phase B, **"Stuck" sits separately from the linear workflow picker** as an alert/warning action button, with reserved layout for a subsequent blocker explanation input.

---

### 2. Label Mismatches Against Kanban Boards

| Status Key | `TaskFlyoutInspector.jsx` | `BoardView.jsx` (Tasks Page) | `Show.jsx` (Project Board) | Standardized Decided Label |
| :--- | :--- | :--- | :--- | :--- |
| `todo` | `To Do` | `To Do` | `To do` | **To Do** |
| `in_progress` | `In Progress` | `In Progress` | `In progress` | **In Progress** |
| `review` | **`Under Review`** ⚠️ | **`In Review`** | **`In review`** | **In Review** |
| `completed` | **`Done`** ⚠️ | **`Completed`** ⚠️ | **`Done`** | **Completed** |
| `stuck` | **`Blocked / Stuck`** ⚠️ | **`Stuck`** | **`Blocked`** | **Blocked / Stuck** (action) / **Stuck** (badge) |
| `overdue` | `Overdue` | `Overdue` | `Overdue` | **Overdue** (automatic badge) |

---

### 3. Application-Wide Status Color Mapping & Unified Recipe

#### Current Colors Across the Application:

| Status Key | Board Columns (`BoardView.jsx`) | Project Workspace (`Show.jsx`) | Inbox / Dialogs (`MemberTaskDetailModal`) | Current Panel (`TaskFlyoutInspector`) |
| :--- | :--- | :--- | :--- | :--- |
| **`todo`** | `bg-gray-200 text-gray-700 dark:bg-slate-800 dark:text-slate-300` (dot: `bg-gray-400`) | `var(--muted-foreground)`, badge `bg-[var(--secondary)] text-[var(--muted-foreground)] border-[var(--border)]` | `bg-gray-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300` | Generic cyan tint on select (`color-mix(primary 12%, card)`) |
| **`in_progress`** | `bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300` (dot: `bg-indigo-500`) | `var(--cyan)`, badge `bg-[var(--cyan)]/10 text-[var(--cyan)] border-[var(--cyan)]/25` | `bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300` | Generic cyan tint on select |
| **`review`** | `bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300` (dot: `bg-amber-500`) | `var(--warning)` (amber), badge `bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/25` | `bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300` | Generic cyan tint on select |
| **`completed`** | `bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300` (dot: `bg-emerald-500`) | `var(--success)` (emerald), badge `bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/25` | `bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300` | Generic cyan tint on select |
| **`stuck`** | `bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300` (dot: `bg-orange-500`) | `var(--critical)` (rose), badge `bg-[var(--critical)]/10 text-[var(--critical)] border-[var(--critical)]/25` | `bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300` | Generic cyan tint on select |
| **`overdue`** | `bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300` (dot: `bg-rose-600 animate-pulse`) | `#f43f5e`, badge `bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25` | `text-rose-600 font-semibold` | Generic cyan tint on select |

#### Unified Status Color Recipe (Decided Spec):
Every status token applies:
1. **Background:** 8%–12% tint of the semantic color.
2. **Border:** 25%–35% opacity 1px crisp border.
3. **Text:** WCAG AA (≥4.5:1) compliant text shade.
4. **Status Dot:** 6px solid circular indicator.

- **To Do (Slate):** `bg-slate-100 text-slate-700 border-slate-300/60 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700` (dot: `bg-slate-400`).
- **In Progress (Brand Blue):** `bg-blue-50 text-blue-700 border-blue-300/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60` (dot: `bg-blue-500`).
- **In Review (Amber):** `bg-amber-50 text-amber-800 border-amber-300/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60` (dot: `bg-amber-500`).
- **Completed (Emerald):** `bg-emerald-50 text-emerald-800 border-emerald-300/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60` (dot: `bg-emerald-500`).
- **Stuck (Rose):** `bg-rose-50 text-rose-800 border-rose-300/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60` (dot: `bg-rose-500`).

#### Collision Resolution: In Review (Amber) vs Urgency / Warnings
- **In Review:** Identified strictly by a small status dot + text: `• In Review`. Never uses an icon.
- **Urgency Warning (Tight buffer):** Identified by a leading `Flame` or `Clock` icon + text: `Flame 4h buffer remaining`.
- **Can't Slip (Critical Path):** Identified by a leading `ShieldAlert` or `AlertTriangle` icon + bold label `Can't slip` + distinct rose/crimson tint, completely separated from review amber.

---

## A3. Mechanics

### 1. Mounting & Width Control
- **Mounting Mechanism:** Conditional rendering directly within parent pages (`{selectedTask && <TaskFlyoutInspector isOpen={...} ... />}`).
- **Current Width Control:** Inline style `style={{ width: 'min(100%, 400px)' }}` and a hardcoded `<style>` block:
  ```css
  @media (max-width: 480px) {
    .task-drawer-sheet {
      width: 100vw !important;
      max-width: 100vw !important;
    }
  }
  ```
- **New Width Control (Phase B):** 
  - Standard Tailwind responsive utilities and standard CSS clamp:
    - Mobile (`< 768px`): `w-full max-w-full`.
    - Desktop (`>= 768px`): `w-[clamp(32rem,40vw,45rem)] max-w-full`.
  - Elimination of all arbitrary hardcoded `<style>` overrides.

### 2. Z-Index, Scrim, and Collisions
- **Existing Z-Index Audit:**
  - Sidebar (`Sidebar.jsx:L584`): `z-40` (`hidden md:flex`, `w-16` or `w-64`).
  - Top Breadcrumbs Header (`TenantLayout.jsx:L56`): `z-20`.
  - Floating Project AI Button (`ProjectAiAssistant.jsx:L429`): `z-40` (`fixed bottom-6 right-6`).
  - Floating Project AI Chat Window (`ProjectAiAssistant.jsx:L430`): `z-50`.
  - Current Task Flyout Inspector: `z-50` (collides with Project AI Chat window when both exist).
- **Z-Index Resolution:**
  - Elevate `TaskFlyoutInspector` to **`z-[60]`** (outer container & scrim) and **`z-[70]`** (drawer sheet).
  - This guarantees the panel sits cleanly above:
    1. The floating AI chat bubble (`z-40`) and its modal window (`z-50`).
    2. The desktop sidebar in both collapsed (`w-16`) and expanded (`w-64`) states (`z-40`).
    3. The workspace top header bar (`z-20`).
- **Scrim Specification:**
  - Remove `backdrop-blur-md`. Replace with standard solid overlay tint: `bg-slate-950/50 dark:bg-black/70` with zero blur (`backdrop-blur-none`), matching clean SaaS standards without GPU filter overhead.

### 3. Scroll Structure & Feasibility of Sticky Header/Footer
- **Structure Analysis:**
  - Drawer Sheet: `flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden`.
  - Header: `shrink-0 sticky top-0 bg-[var(--elevated)] z-10 border-b border-[var(--border)]`.
  - Body: `flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 space-y-6`.
  - Footer: `shrink-0 sticky bottom-0 bg-[var(--elevated)] z-10 border-t border-[var(--border)] px-6 py-4`.
- **Feasibility:** 100% feasible and natively stable. Because the parent container has `h-[100dvh] flex flex-col` and the middle container has `min-h-0 flex-1 overflow-y-auto`, the header and footer remain pinned without scroll jitter, jump cuts, or clipping.

### 4. Animation & Focus Handling
- **Animation:**
  - Scrim: `animate-in fade-in duration-200`.
  - Drawer Sheet: `animate-in slide-in-from-right duration-300 ease-out`.
- **Focus Handling (A11y):**
  - Save `document.activeElement` on drawer open.
  - Automatically place initial focus on the close button or task title.
  - Trap `Tab` and `Shift+Tab` within the drawer container while open.
  - Restore focus back to the triggering element upon drawer closure.

### 5. Catalog of Current Hard-Coded Inline Values to Eliminate

```javascript
// Hardcoded values in TaskFlyoutInspector.jsx to be eliminated:
width: 'min(100%, 400px)'       // -> clamp(32rem, 40vw, 45rem)
boxShadow: '-12px 0 32px -4px...'// -> shadow-2xl / elevation token
height: '50px'                  // -> h-12 or h-14 standard
height: '36px'                  // -> h-9 or h-10
height: '32px'                  // -> h-9
height: '34px'                  // -> h-9
height: '28px'                  // -> h-8
fontSize: '9px'                 // -> type-caption (12px)
fontSize: '10px'                // -> type-caption (12px)
fontSize: '10.5px'              // -> type-caption (12px)
fontSize: '11px'                // -> type-subheading / type-body
fontSize: '17px'                // -> type-section-title (18px)
padding: '0 54px 0 20px'        // -> px-6
padding: '16px 20px 12px'       // -> p-6
padding: '14px 20px'            // -> p-6
padding: '10px 20px'            // -> px-6 py-4
gridTemplateColumns: '1fr 1.35fr'// -> grid-cols-3 or flex items-center justify-between
```

---

## A4. Sizing Proof

### Sizing Formula (Decided Spec):
- **Desktop (`>= 768px`):** `width: clamp(32rem, 40vw, 45rem)`:
  - Minimum width: `32rem` = **512px**.
  - Preferred width: `40vw` = **0.40 × Viewport Width**.
  - Maximum width: `45rem` = **720px**.
- **Mobile (`< 768px`):** `100vw` = **Full viewport width**.
- **Inside Panel:** Prose elements (acceptance criteria, description) capped at `max-w-prose` (`65ch` ≈ `42rem` ≈ **672px**) with section padding `p-6` (24px left + 24px right = 48px total).

### Comprehensive Viewport Calculation Table:

| Viewport Width | Mode / Rule Applied | Computed Panel Width | Effective Panel % | Content Width (`Panel - 48px`) | Prose Capped Width | Remaining Page Width | Analysis & Verification |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **375px** | Mobile (`< 768px`) | **375px** | 100.0% | **327px** (p-6) or **343px** (p-4) | 327px / 343px | 0px | **Clean.** Full-width drawer sheet on mobile. No horizontal overflow. |
| **480px** | Mobile (`< 768px`) | **480px** | 100.0% | **432px** | 432px | 0px | **Clean.** Touch targets ≥ 44px. Full screen comfort. |
| **767px** | Mobile Upper Bound | **767px** | 100.0% | **719px** | 672px (`max-w-prose`) | 0px | **Clean.** Fluid width, centered prose prevents over-stretched lines. |
| **768px** | Desktop Lower Bound (`40vw = 307.2px < 512px`) | **512px** (Min clamp) | 66.7% | **464px** | 464px | 256px (33.3%) | **Clean.** Clamped to 512px min. Scrim covers remaining 256px background. |
| **1024px** | Desktop (`40vw = 409.6px < 512px`) | **512px** (Min clamp) | 50.0% | **464px** | 464px | 512px (50.0%) | **Clean.** Takes exactly half the screen. Ideal split for iPad Pro. |
| **1280px** | Desktop (`40vw = 512.0px`) | **512px** (Clamp point) | 40.0% | **464px** | 464px | 768px (60.0%) | **Clean.** Exactly hits the 40% proportional scaling threshold. |
| **1366px** | Desktop (`40vw = 546.4px`) | **546.4px** | 40.0% | **498.4px** | 498.4px | 819.6px (60.0%) | **Clean.** Smooth fluid expansion on 14" laptop screens. |
| **1440px** | Desktop (`40vw = 576.0px`) | **576.0px** | 40.0% | **528.0px** | 528.0px | 864.0px (60.0%) | **Clean.** Optimal reading measure and control alignment. |
| **1536px** | Desktop (`40vw = 614.4px`) | **614.4px** | 40.0% | **566.4px** | 566.4px | 921.6px (60.0%) | **Clean.** Spacious layout without excessive whitespace. |
| **1680px** | Desktop (`40vw = 672.0px`) | **672.0px** | 40.0% | **624.0px** | 624.0px | 1008.0px (60.0%) | **Clean.** Approaches max-w-prose limit. |
| **1920px** | Desktop (`40vw = 768px > 720px`) | **720px** (Max clamp) | 37.5% | **672.0px** | **672px** (`max-w-prose`) | 1200.0px (62.5%) | **Clean.** Max clamp triggers. Content width precisely matches `max-w-prose` (672px). Zero line stretching. |
| **2560px** | Desktop Ultrawide (`40vw = 1024px > 720px`) | **720px** (Max clamp) | 28.1% | **672.0px** | **672px** (`max-w-prose`) | 1840.0px (71.9%) | **Clean.** Clamped firmly at 720px. Prevents giant awkward panel on 2K/4K displays. |

### Edge Case Assessment:
- **768px–800px Breakpoint Transition:** At 768px, the panel jumps from 100vw (767px) to 512px (66.7vw). The remaining 33.3% of the viewport displays the background page dimmed by the scrim. This is intentional behavior for responsive side drawers. No layout breakage occurs.

---

## A5. Brainstorm Plan & Technical Strategy

### 1. Ordered Steps for Phase B Implementation
1. **Step 1: Create Centralized Status Configuration:**
   - Author a shared status dictionary [`resources/js/lib/taskStatusConfig.js`](file:///e:/PROGRAMMING/Thesis/Project/indie-studio-saas/resources/js/lib/taskStatusConfig.js) defining the unified status-to-color recipe (background, border, text, dot) and standard labels for `todo`, `in_progress`, `review`, `completed`, `stuck`, and `overdue`.
2. **Step 2: Restructure `TaskFlyoutInspector.jsx` Architecture:**
   - Refactor the shell into a standard React portal (`createPortal`) targeting `document.body`.
   - Update overlay scrim to solid `bg-slate-950/50` without blur.
   - Set container to `z-[60]` and drawer sheet to `z-[70]`.
   - Replace hardcoded inline width styles with `w-full md:w-[clamp(32rem,40vw,45rem)]`.
3. **Step 3: Implement Sticky Header with Re-Ordered Elements:**
   - Topline: Task ID + Project name in `.type-caption text-[var(--muted-foreground)]`. Tooltip on close button: `"ESC to close"`.
   - Title: `.type-section-title font-bold text-[var(--foreground)]` with `line-clamp-3`.
   - Subtitle Row (*beneath title*):
     - Status pill using the new recipe (dot + tint).
     - Due date badge with relative timing (`"Due in 3 days"` or `"Due Oct 2 · 19 days overdue"`).
     - Priority pill.
     - "Can't slip" badge when CPM float ≤ 0 or critical path on-track.
   - Tabs: `Details` and `Activity` directly under subtitle row within the sticky header.
4. **Step 4: Refactor Scrollable Body & Standard Tokens:**
   - Apply `min-h-0 flex-1 overflow-y-auto p-6 space-y-6`.
   - Replace all `font-size: 9px/10px` with `.type-caption`, `.type-subheading`, or `.type-body`.
   - Format property rows as labeled rows with standard control heights (`h-9`).
   - Rewrite Schedule section: Replace "Zero Leeway" with "Can't slip", provide plain consequence statement, and restrict shortened "Next step" prompt to `canManage`.
   - Acceptance Criteria: Render as a clean checklist capped at `max-w-prose`.
   - Status Picker: Linear board order (`To Do`, `In Progress`, `In Review`, `Completed`). Separate "Stuck" as an alert action. Show "Overdue" as a display badge only.
5. **Step 5: Polish Sticky Footer & Action Button:**
   - `shrink-0 p-6 border-t border-[var(--border)] bg-[var(--elevated)] flex items-center justify-end gap-3`.
   - Secondary button: Neutral outline `Close`.
   - Primary button: Solid brand-blue action button (`Mark Complete` / `Awaiting Reviewer`) with loading spinner.
6. **Step 6: Measure & Verify Across Viewports:**
   - Verify computed pixel widths against Sizing Table (A4) across mobile (375px), tablet (768px, 1024px), standard desktop (1280px, 1440px), and ultrawide (1920px, 2560px).

---

### 2. Analysis of Optional Ideas

| Idea | Pros | Cons | Effort | Recommendation |
| :--- | :--- | :--- | :---: | :--- |
| **(i) Drag-to-resize with width saved to localStorage** | Power users on ultrawide monitors can customize panel size to exact pixel preference. | Added event listeners (`mousemove`, `mouseup`), potential touch event jank, text selection glitches during dragging, contradicts the clamp-first responsive design philosophy. | Medium (~60 lines of state, listeners, clamping bounds) | **Not recommended.** The spec's `clamp(32rem, 40vw, 45rem)` formula already provides mathematically optimal scaling across 1024px–2560px displays without user tweaking. |
| **(ii) Expand toggle button in header** | Allows 1-click expansion to wide view (e.g. `60vw` or `960px`) for long acceptance criteria or multi-comment feeds. 100% accessible, zero drag jank. | Adds one additional icon button (`Maximize2` / `Minimize2`) to header topline. | Low (~15 lines of state and button toggle) | **Recommended as an optional enhancement.** Clean, non-intrusive, and accessible. |
| **(iii) Building on an existing dialog/sheet primitive for focus handling** | Native WCAG 2.1 AA focus trap, Escape key handling, and focus restoration to trigger element upon closing. Eliminates z-index and overflow clipping issues via `createPortal`. | None. Can be implemented cleanly in ~25 lines using React's native `createPortal` and `useRef` without adding any new npm dependencies. | Low (~25 lines) | **Strongly Recommended.** Provides bulletproof accessibility and prevents sidebar/header z-index bleed. |

---

### 3. Risks & Mitigations

| Risk | Impact | Mitigation Strategy |
| :--- | :---: | :--- |
| **Z-index collision with floating AI chat** | High | Set panel container to `z-[60]` and sheet to `z-[70]`. Both are higher than `ProjectAiAssistant`'s trigger (`z-40`) and chat modal (`z-50`). |
| **Horizontal overflow on narrow screens (< 768px)** | High | Enforce `w-full max-w-full inset-0` on mobile breakpoints with `box-border` and eliminate hardcoded widths. |
| **Long text / 10+ criteria causing unreadable lines on wide displays (720px)** | Medium | Wrap prose containers (acceptance criteria, description, comments) in `max-w-prose` (65ch) so reading measure never exceeds comfortable line lengths. |
| **Breaking status update API contract** | Critical | Keep exact parameter payloads (`status`, `sprint_status`, `story_points`, `priority`, `assignee`) and existing callbacks (`updateTask`, `onUpdateStatus`) unchanged. |

---

### 4. Test & Verification Plan
1. **Sizing Verification:**
   - In browser developer tools, set viewport to each target resolution (375, 768, 1024, 1280, 1366, 1440, 1536, 1680, 1920, 2560).
   - Inspect `.task-drawer-sheet` computed width and verify it matches the table in Section A4.
2. **Permission & Role Verification:**
   - Open as Studio Leader / Manager (`canManage = true`): Confirm all dropdowns editable, "Next step" coaching prompt visible, "Mark Complete" enabled.
   - Open as Member (`canManage = false`): Confirm reviewer gating works, "Done" disabled when user is not reviewer, button displays "Awaiting Reviewer".
3. **Theming & Color Contrast Verification:**
   - Test in both Light mode and Dark mode.
   - Verify status pill colors meet WCAG AA contrast (≥ 4.5:1 text, ≥ 3:1 borders).
4. **Build & Regression Suite:**
   - Execute `npm.cmd run build` to verify zero Vite compilation errors.
   - Execute `php artisan test --filter=ProjectTaskWorkspaceTest` to ensure zero backend regression.

---

### 5. Total Files Affected
- **Files Modified (Primary):**
  - `resources/js/Components/Tenant/Tasks/TaskFlyoutInspector.jsx` (Redesigned side panel component).
- **Files Created (Shared Utility):**
  - `resources/js/lib/taskStatusConfig.js` (Unified status color recipe & label constants).
- **Files Verified (Callers / Integration Points - No API signature changes):**
  - `resources/js/Pages/Tenant/Tasks/Index.jsx`
  - `resources/js/Pages/Tenant/Projects/Show.jsx`
  - `resources/js/Pages/Tenant/MemberDashboard.jsx`
  - `resources/js/Pages/Tenant/Dashboard.jsx`
  - `resources/js/Pages/Tenant/Dashboard/Overview.jsx`
  - `resources/js/Components/Tenant/Tasks/BoardView.jsx`
