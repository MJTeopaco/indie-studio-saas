# UI/UX Audit Ticket — Task List & Due Views (`ListView.jsx`, `DueView.jsx`)

**Target Files:**
- `resources/js/Components/Tenant/Tasks/ListView.jsx` (14.8 KB)
- `resources/js/Components/Tenant/Tasks/DueView.jsx` (9.5 KB)
- `resources/js/Components/Tenant/Tasks/ManualTaskModal.jsx` (42.6 KB)

---

## 1. Current State & Findings

### Grade: 🟡 B- (Functional tabular layout, needs row hover polish and modal density)

#### Findings:
1. **Data Table Layout (`ListView.jsx` & `DueView.jsx`)**: The tabular task list (`search.py` Chart Result 5 Category & JavaFX Enterprise Density rule) needs `border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/80 shadow-xl` with clear column headers (`bg-slate-900 px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800`).
2. **Row Hover & Checkbox Interaction**: Each task row (`border-b border-slate-800/60 last:border-0 hover:bg-slate-800/40 transition-colors duration-150`) should highlight clearly when hovered. Task completion checkboxes need `w-5 h-5 rounded-md border-slate-700 text-indigo-600 focus:ring-indigo-500/30 transition-all cursor-pointer`.
3. **Due Date Grouping (`DueView.jsx`)**: Group headers (Overdue, Due Today, Due This Week, Later) need distinct colored badges:
   - Overdue: `text-rose-400 font-semibold flex items-center gap-2 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20`
   - Due Today: `text-amber-400 font-semibold flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20`
4. **`ManualTaskModal.jsx` Density & Sectioning**: At 42.6 KB, the task creation/editing modal is extensive. It needs organized section tabs or clear visual grouping (`bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-4`) for General info, CPA settings, Assignees, and Subtasks (`search.py` UX Result 8 & inline validation).

---

## 2. Actionable Remediation Checklist (To Be Implemented)

- [ ] **Polish `ListView.jsx` & `DueView.jsx` Tables:**
  - Standardize table container to `rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden`.
  - Add row hover transitions (`hover:bg-slate-800/40`) and right-aligned action buttons (`opacity-0 group-hover:opacity-100 transition-opacity`).
- [ ] **Refine Due Group Banners (`DueView.jsx`):**
  - Ensure clear visual distinction and high contrast for Overdue / Due Today section headers.
- [ ] **Upgrade `ManualTaskModal.jsx` Form Hierarchy:**
  - Polish modal container with `rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl p-6`.
  - Add clear form section containers with `border border-slate-800/80 rounded-xl p-4 bg-slate-950/40`.
