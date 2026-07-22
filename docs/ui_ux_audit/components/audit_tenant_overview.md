# UI/UX Audit Ticket — Tenant Dashboard Overview (`Overview.jsx`)

**Target Files:**
- `resources/js/Pages/Tenant/Dashboard/Overview.jsx` (49.1 KB)
- `resources/js/Pages/Tenant/Dashboard.jsx` (28.1 KB)

---

## 1. Current State & Findings

### Grade: 🟡 B- (Rich data & metrics, needs chart container polish and spacing density)

#### Findings:
1. **Metric KPI Cards (`Overview.jsx`)**: The high-level summary cards (Projects count, Active Sprints, CPA Status, Team Capacity) must feel like a premium executive console. They need `rounded-2xl border border-slate-800 bg-slate-900/80 p-6 relative overflow-hidden group` with subtle top-right glowing indicator icons (`w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform`).
2. **Recharts Tooltip & Grid Styling (`search.py` Chart Results 1 & 3)**: When using Recharts for sprint velocity or project progress over time (`LineChart` / `AreaChart`), the default grid lines (`#ccc` / `#333`) and white tooltips clash with our dark theme. We must use:
   - `CartesianGrid stroke="#334155" strokeDasharray="3 3" opacity={0.4}`
   - `Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '12px', color: '#F8FAFC' }}`
   - Line/Area curves with `stroke="#6366F1"` and `fillOpacity={0.15}`.
3. **Activity & Quick Action Feed**: Recent studio activities and alert lists need clean vertical timeline separators (`border-l border-slate-800 pl-4 space-y-4`) and clear status badges.
4. **Loading & Empty States**: If charts have zero data points (e.g., new studio), display a sleek empty state placeholder (`border-2 border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-400`) rather than a blank or broken chart canvas (`search.py` Chart Result 3 threshold notes).

---

## 2. Actionable Remediation Checklist (To Be Implemented)

- [ ] **Polish KPI Metric Cards (`Overview.jsx`):**
  - Standardize all 4 top KPI cards with `rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6 hover:border-slate-700 transition-all duration-200`.
  - Ensure metric numbers use `font-heading font-bold text-3xl text-white tracking-tight`.
- [ ] **Refine Recharts Theme & Tooltips:**
  - Update all chart wrappers to use dark glassmorphic `Tooltip` styling (`backgroundColor: '#1E293B', borderColor: '#475569', borderRadius: '12px'`).
  - Set chart axes (`XAxis`, `YAxis`) to use `stroke="#64748B" font-size="12px"`.
- [ ] **Upgrade Activity Feed & Quick Actions:**
  - Add sleek hover highlights to recent activity items (`hover:bg-slate-800/40 p-3 rounded-xl transition-colors`).
