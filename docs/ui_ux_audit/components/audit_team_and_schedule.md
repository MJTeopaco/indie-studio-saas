# UI/UX Audit Ticket — Team Roster & Schedule Calendar (`Team/`, `Schedule/`)

**Target Files:**
- `resources/js/Pages/Tenant/Team/Index.jsx`
- `resources/js/Pages/Tenant/Schedule/Index.jsx`
- `resources/js/Components/Tenant/Schedule/` (Multi-view grids, event cards)

---

## 1. Current State & Findings

### Grade: 🟡 B- (Good multi-view calendar & member list, needs event pill hierarchy and member card hover)

#### Findings:
1. **Member Cards & Grid (`Team/Index.jsx`)**: Team member cards showing roles (Owner, Lead, Developer, QA) and current capacity need `rounded-2xl border border-slate-800 bg-slate-900/80 p-6 hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-200 group`.
2. **Role Badges (`search.py` Color & Style Rules)**: Roles must have distinct, scannable badge colors:
   - Studio Owner / Admin: `bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold`
   - Lead / Manager: `bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold`
   - Developer / Engineer: `bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded-full text-xs font-semibold`
3. **Calendar Grid & Event Pills (`Schedule/Index.jsx`)**: Multi-view calendar (Day/Week/Month) must have clean grid borders (`border-slate-800/80`). Event pills inside calendar slots must be compact (`px-2 py-1 rounded-lg text-xs font-medium truncate cursor-pointer transition-transform hover:scale-[1.02] shadow-sm`) categorized by project color or CPA status.
4. **Current Day / Time Indicator (`search.py` Chart Result 2 Live Ticker/Pulse)**: The calendar grid should highlight today's column (`bg-indigo-500/5 dark:bg-indigo-500/10`) and display a glowing red/indigo horizontal time line (`border-t-2 border-rose-500 relative before:w-2 before:h-2 before:rounded-full before:bg-rose-500 before:-mt-1 before:-ml-1`) indicating current time.

---

## 2. Actionable Remediation Checklist (To Be Implemented)

- [ ] **Polish `Team/Index.jsx` Roster & Member Cards:**
  - Standardize member card grids with `rounded-2xl border border-slate-800 bg-slate-900/80 p-6 hover:border-indigo-500/40 transition-all duration-200`.
  - Add standardized role badges (`bg-amber-500/10 text-amber-400` / `bg-indigo-500/10 text-indigo-400`).
- [ ] **Refine `Schedule/Index.jsx` Calendar Grid:**
  - Upgrade date cells and headers with crisp borders (`border-slate-800/80`) and active today highlight (`bg-indigo-500/5`).
  - Standardize event pills with rounded corners (`rounded-lg`) and project color inheritance.
