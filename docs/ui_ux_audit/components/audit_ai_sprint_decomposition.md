# UI/UX Audit Ticket — AI Sprint Decomposition & ML Modals (`ML/`)

**Target Files:**
- `resources/js/Components/Tenant/Projects/ML/DecomposeModal.jsx` (29.2 KB)
- `resources/js/Components/Tenant/Projects/ML/BestFitModal.jsx` (23.3 KB)
- `resources/js/Components/Tenant/Projects/ML/AiDecomposeModal.jsx` (if exists / alias)
- `resources/js/Pages/Tenant/Projects/Sprints/Index.jsx`
- `resources/js/Pages/Tenant/Projects/Sprints/Show.jsx`

---

## 1. Current State & Findings

### Grade: 🟡 B (High-tech features, requires step-by-step skeleton loaders and AI violet accents)

#### Findings:
1. **AI Processing & Progress states (`DecomposeModal.jsx`)**: When the user triggers ML/AI sprint decomposition (`search.py` UX Result 4 Loading States), the system must show a step-by-step AI progress indicator (`animate-pulse` skeleton blocks, glowing progress ring, and status text: *“Analyzing dependencies... Generating critical path... Estimating velocity...”*). Never freeze the modal dialog.
2. **AI Theme Accents (`search.py` Design System & Style Result 1)**: ML features must distinctively use our **Violet/Indigo AI Palette** (`from-violet-600 to-indigo-600`) to visually communicate intelligent automation vs standard manual inputs.
3. **`BestFitModal.jsx` Allocation Preview**: The modal showing AI-suggested developer assignments and capacity matches needs clean comparison cards (`rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 flex items-center justify-between`) with confidence score pills (`px-2.5 py-1 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30`).
4. **Sprint Cards (`Sprints/Index.jsx` & `Show.jsx`)**: Sprint cards need clear velocity sparklines or progress bars (`h-2 rounded-full bg-slate-800` + `bg-gradient-to-r from-violet-500 to-indigo-500` fill) and dates formatted cleanly.

---

## 2. Actionable Remediation Checklist (To Be Implemented)

- [ ] **Enhance `DecomposeModal.jsx` & AI Generation Flow:**
  - Add glowing violet header container (`bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border-b border-violet-500/30 p-6`).
  - Implement step-by-step AI progress skeleton (`animate-pulse space-y-3 p-6`) when generating tasks.
- [ ] **Polish `BestFitModal.jsx` Comparison Cards:**
  - Standardize assignee match cards with clear confidence badges (`bg-violet-500/20 text-violet-300`) and capacity indicators.
- [ ] **Elevate Sprint Index & Detail Views (`Sprints/Index.jsx`):**
  - Ensure sprint cards use `rounded-2xl border border-slate-800 bg-slate-900/80 p-6 hover:border-violet-500/40 transition-all duration-300`.
