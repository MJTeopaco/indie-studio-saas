# UI/UX Audit Ticket — Hub Studio Selection & Onboarding (`Hub/`, `Onboarding/`)

**Target Files:**
- `resources/js/Pages/Dashboard.jsx` (Root Hub studio selector)
- `resources/js/Components/Hub/StudioCard.jsx`
- `resources/js/Components/Hub/CreateStudioModal.jsx`
- `resources/js/Components/Hub/JoinStudioModal.jsx`
- `resources/js/Pages/Onboarding/` (if any step forms exist)

---

## 1. Current State & Findings

### Grade: 🟡 B (Solid studio selection grid, needs card hover depth and sleek modal transitions)

#### Findings:
1. **Studio Grid Cards (`StudioCard.jsx`)**: Studio selection cards are the gateway for multi-tenant users. They need `rounded-2xl border border-slate-800 bg-slate-900/80 p-6 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 group cursor-pointer`.
2. **Empty State & Studio Creation CTA (`Dashboard.jsx`)**: When a user has zero studios or is browsing their studio hub, the "Create New Studio" card must stand out with dashed glowing borders (`border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/30 hover:bg-indigo-500/5 transition-all duration-300 flex flex-col items-center justify-center p-8 rounded-2xl group`).
3. **Modal Dialog Polish (`CreateStudioModal.jsx` & `JoinStudioModal.jsx`)**: Modals must use `backdrop-blur-xl bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6` with smooth spring/fade animations (`transition-all duration-200 ease-out`).
4. **Input Field & Validation (`search.py` UX Result 8 Focus Management)**: Studio name and invite code inputs need `rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all`.

---

## 2. Actionable Remediation Checklist (To Be Implemented)

- [ ] **Elevate `StudioCard.jsx` & Hub Grid:**
  - Add smooth hover translate (`hover:-translate-y-1`) and indigo card glow (`hover:shadow-xl hover:shadow-indigo-500/10`).
  - Ensure Studio Avatar/Icon uses `rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold p-3`.
- [ ] **Polish Studio Creation & Join Modals:**
  - Standardize `CreateStudioModal.jsx` and `JoinStudioModal.jsx` to use `rounded-2xl border border-slate-800/80 bg-slate-900/95 backdrop-blur-xl p-6`.
  - Add clear loading spinner (`animate-spin`) during form submission (`search.py` UX Result 4).
- [ ] **Enhance `Dashboard.jsx` Root Hub Header:**
  - Add greeting headline (`font-heading font-bold text-3xl text-white`) with clear subtitle explaining studio selection/creation.
