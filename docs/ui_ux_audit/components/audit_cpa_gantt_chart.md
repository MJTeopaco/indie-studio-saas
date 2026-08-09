# UI/UX Audit Ticket — CPA Gantt Timeline (`TimelineView.jsx` & Badges)

**Target Files:**
- `resources/js/Components/Tenant/Tasks/TimelineView.jsx` (13.7 KB)
- `resources/js/Components/Tenant/CpaStatusBadge.jsx` (3.3 KB)
- `resources/js/Components/Tenant/PriorityBadge.jsx` (0.95 KB)

---

## 1. Current State & Findings

### Grade: 🟡 B (Innovative CPA features, needs crisp timeline grid lines and status distinction)

#### Findings:
1. **Timeline Grid Header & Rows (`TimelineView.jsx`)**: The Critical Path Analysis (CPA) Gantt timeline must be scannable with clear date columns (`search.py` Chart Result 3 Trend & Chart Result 5 Category rules). Currently needs `border-b border-slate-800 bg-slate-900/90 sticky top-0 z-20` for date headers and `border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors` per task row.
2. **CPA Gantt Task Bars**: Bars representing tasks along the timeline need rounded capsule styling (`h-8 rounded-lg shadow-sm flex items-center px-3 gap-2 text-xs font-semibold cursor-pointer transition-transform hover:scale-[1.01]`):
   - Critical Path (`CpaStatusBadge`: Critical / On Critical Path): `bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/20 border border-rose-400/40`
   - Normal Task (On Track): `bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/10`
   - Completed: `bg-emerald-500/20 border border-emerald-500/40 text-emerald-300`
3. **`CpaStatusBadge.jsx` & `PriorityBadge.jsx` Standardization**: Badges must follow our exact Vaultera Labs status tokens:
   - Success (`emerald-500`), Warning (`amber-500`), Danger/Critical (`rose-500`), Info (`indigo-500`).
4. **Milestone Dependency Connectors**: Ensure dependency lines or milestone markers (`border-l-2 border-dashed border-rose-500/60`) have clear tooltip descriptions when hovered.

---

## 2. Actionable Remediation Checklist (To Be Implemented)

- [ ] **Polish `TimelineView.jsx` Grid & Task Bars:**
  - Standardize timeline row headers and date grids with `border-slate-800/80` and sticky column headers.
  - Upgrade Gantt task bars with gradient fills (`from-indigo-500 to-indigo-600` / `from-rose-500 to-rose-600`) and smooth hover scaling.
- [ ] **Refine `CpaStatusBadge.jsx` & `PriorityBadge.jsx`:**
  - Standardize badge pill containers (`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider`).
  - Add glowing status dot (`w-1.5 h-1.5 rounded-full bg-current animate-pulse` for critical/active states).
