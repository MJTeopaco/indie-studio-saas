# UI/UX Audit Ticket — Project Dashboard (`Show.jsx`) & AI Assistant

**Target Files:**
- `resources/js/Pages/Tenant/Projects/Show.jsx` (53.8 KB)
- `resources/js/Pages/Tenant/Projects/Index.jsx` (7.5 KB)
- `resources/js/Components/Tenant/Projects/ProjectCard.jsx` (5.5 KB)
- `resources/js/Components/Tenant/Projects/ProjectAiAssistant.jsx` (30.7 KB)
- `resources/js/Components/Tenant/Projects/RightSidebar.jsx` (9.1 KB)

---

## 1. Current State & Findings

### Grade: 🟡 B- (Packed with functionality, requires visual structure and AI panel polish)

#### Findings:
1. **Project Header & Navigation Tabs (`Show.jsx`)**: The main project workspace (`Show.jsx`) switches between Overview, Tasks (Kanban/List/Timeline), Sprints, and Settings. The tab bar needs `flex gap-2 border-b border-slate-800 pb-3 mb-6 overflow-x-auto` with pill-style active tabs (`bg-indigo-500 text-white shadow-md shadow-indigo-500/20 font-medium px-4 py-2 rounded-xl transition-all` vs inactive `text-slate-400 hover:text-slate-200 hover:bg-slate-800/60`).
2. **AI Assistant Panel (`ProjectAiAssistant.jsx`)**: The embedded AI assistant is a core differentiator for Vaultera Labs. It needs:
   - A distinct glowing header (`bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border-b border-violet-500/30 p-4 flex items-center justify-between`).
   - Message bubbles with proper contrast: User messages (`bg-indigo-600 text-white rounded-2xl rounded-br-sm p-3.5 max-w-[85%] ml-auto shadow-md`) and AI responses (`bg-slate-800 border border-slate-700 text-slate-100 rounded-2xl rounded-bl-sm p-4 max-w-[85%] mr-auto shadow-md`).
   - Sleek prompt input footer (`sticky bottom-0 bg-slate-900/95 border-t border-slate-800 p-3 flex gap-2`).
3. **Right Context Sidebar (`RightSidebar.jsx`)**: When viewing project details or task sidebars, the right panel must slide in smoothly (`transition-transform duration-300 ease-out`) with `w-80 sm:w-96 border-l border-slate-800 bg-slate-900/95 backdrop-blur-xl h-full overflow-y-auto p-6`.
4. **Project Grid (`ProjectCard.jsx` & `Index.jsx`)**: Project cards need progress bar polish (`h-2 rounded-full bg-slate-800 overflow-hidden` with `bg-gradient-to-r from-indigo-500 to-emerald-500` fill) and status pills (`px-2.5 py-1 rounded-full text-xs font-semibold`).

---

## 2. Actionable Remediation Checklist (To Be Implemented)

- [ ] **Elevate `Show.jsx` Header & Tab Switcher:**
  - Standardize workspace header layout with crisp project title, milestone counter, and pill-based navigation tabs (`min-h-[40px] rounded-xl`).
- [ ] **Polish `ProjectAiAssistant.jsx` Interface:**
  - Upgrade AI panel container with `border border-violet-500/30 rounded-2xl bg-slate-900/95 shadow-2xl overflow-hidden flex flex-col`.
  - Add glowing violet AI avatar icon (`bg-violet-500/20 text-violet-400 p-2 rounded-lg border border-violet-500/30`).
  - Polish message bubbles and add thinking/typing indicator (`animate-pulse`).
- [ ] **Refine `ProjectCard.jsx` Grid Cards:**
  - Ensure sleek progress bars (`h-2 rounded-full bg-slate-800` + `bg-indigo-500`) and hover scale (`hover:-translate-y-1 transition-all duration-300`).
