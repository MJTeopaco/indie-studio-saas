# UI/UX Audit Ticket — Tasks Kanban Board (`BoardView.jsx`)

**Target Files:**
- `resources/js/Components/Tenant/Tasks/BoardView.jsx` (12.0 KB)
- `resources/js/Components/Tenant/Tasks/KanbanCard.jsx` (3.4 KB)
- `resources/js/Pages/Tenant/Tasks/Index.jsx` (16.2 KB)

---

## 1. Current State & Findings

### Grade: 🟡 B- (Good DnD functionality, needs column contrast and card hover/drag polish)

#### Findings:
1. **Kanban Column Containers (`BoardView.jsx`)**: Columns (To Do, In Progress, Review, Done) need distinct glassmorphic column wrappers (`w-80 flex-shrink-0 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col max-h-[calc(100vh-220px)]`) with clear header badge counts (`px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300`).
2. **Kanban Card Drag & Hover States (`KanbanCard.jsx`)**: When a card is hovered or dragged (`search.py` UX Result 6 Transform Performance & Rule 3 Stable Interaction States), it must not shift the layout bounds. We should use:
   - Normal: `rounded-xl border border-slate-800 bg-slate-800/90 p-4 shadow-sm hover:border-slate-700 hover:shadow-md transition-all duration-200 cursor-grab`
   - Dragging active state: `scale-[1.02] shadow-2xl border-indigo-500/80 bg-slate-800 cursor-grabbing opacity-90`
3. **Task Priority & CPA Badges (`PriorityBadge.jsx` / `CpaStatusBadge.jsx`)**: Badges inside the Kanban card must be compact (`px-2 py-0.5 text-[11px] rounded-md font-medium tracking-wide`) so they don't overwhelm the card title.
4. **Assignee Avatars & Due Dates**: Avatar rings (`w-6 h-6 rounded-full border-2 border-slate-800 -ml-1.5 first:ml-0`) and due date indicators must have clear contrast, showing red (`text-rose-400 font-semibold`) when overdue.

---

## 2. Actionable Remediation Checklist (To Be Implemented)

- [ ] **Polish `BoardView.jsx` Columns & Scroll Area:**
  - Standardize column cards with `w-80 flex-shrink-0 bg-slate-900/70 border border-slate-800/90 rounded-2xl p-4 flex flex-col gap-3`.
  - Add horizontal scrollbar styling (`overflow-x-auto pb-4 gap-6 flex items-start`).
- [ ] **Elevate `KanbanCard.jsx` Aesthetics:**
  - Upgrade card box to `rounded-xl border border-slate-800 bg-slate-800/80 p-4 hover:border-slate-600/80 hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-200`.
  - Ensure task title is `text-sm font-semibold text-slate-100 line-clamp-2 mb-2.5`.
- [ ] **Standardize `Tasks/Index.jsx` View Toolbar:**
  - Ensure view switcher (Board vs List vs Timeline vs Due) uses sleek segmented control (`bg-slate-900 border border-slate-800 p-1 rounded-xl flex gap-1`).
