# UI/UX Audit Ticket — Layouts & Sidebar Navigation

**Target Files:**
- `resources/js/Components/Sidebar.jsx` (29.7 KB)
- `resources/js/Layouts/AuthenticatedLayout.jsx` (8.7 KB)
- `resources/js/Layouts/TenantLayout.jsx`
- `resources/js/Layouts/ProjectLayout.jsx`

---

## 1. Current State & Findings

### Grade: 🟡 B- (Good navigation logic, needs visual polish and spacing consistency)

#### Findings:
1. **Sidebar Hierarchy & Active States (`Sidebar.jsx`)**: The sidebar is central to navigating tenants, projects, schedule, and team. Currently, active link items need clearer visual differentiation (`bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500 font-medium` vs inactive `text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all duration-200`).
2. **Top Header & User Dropdown (`AuthenticatedLayout.jsx`)**: The top navigation header should maintain a consistent `h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 sm:px-8 flex items-center justify-between` layout.
3. **Studio/Tenant Switcher Dropdown**: The tenant/studio switcher inside the sidebar (`Sidebar.jsx`) needs a distinct glassmorphic card container with clear studio avatar/initials badge (`w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center`).
4. **Mobile Drawer & Overlay Scrim (`search.py` Light/Dark Mode Rule 7)**: When the sidebar opens on mobile screens, the backdrop scrim must be `bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300` so background content doesn't visually compete.

---

## 2. Actionable Remediation Checklist (To Be Implemented)

- [ ] **Refine `Sidebar.jsx` Visual Hierarchy:**
  - Standardize navigation link items with `min-h-[40px] px-3.5 py-2 rounded-xl flex items-center gap-3 text-sm transition-all duration-200`.
  - Add clear active state (`bg-indigo-500/10 text-indigo-400 font-semibold shadow-sm`) vs hover state (`hover:bg-slate-800/50 hover:text-slate-200`).
  - Polish Studio Switcher and User Profile footer badge at the bottom of the sidebar.
- [ ] **Upgrade Top Navigation Headers (`AuthenticatedLayout.jsx` / `TenantLayout.jsx`):**
  - Ensure consistent `sticky top-0 z-40 h-16 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md` across all layout wrappers.
- [ ] **Ensure Responsive Mobile Scrim:**
  - Verify mobile sidebar toggle uses `fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm` when open.
