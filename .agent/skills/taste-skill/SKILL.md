---
name: design-taste-frontend
description: Anti-slop frontend skill for landing pages, portfolios, and redesigns. The agent reads the brief, infers the right design direction, and ships interfaces that do not look templated. Real design systems when applicable, audit-first on redesigns, strict pre-flight check.
---

# tasteskill: Anti-Slop Frontend Skill

> Landing pages, portfolios, and redesigns. Not dashboards, not data tables, not multi-step product UI.
> Every rule below is **contextual**. None of it fires automatically. First read the brief, then pull only what fits.

---

## 0. BRIEF INFERENCE (Read the Room Before Anything Else)

Before touching code or tweaking dials, **infer what the user actually wants**. Most LLM design output is bad because the model jumps to a default aesthetic instead of reading the room.

### 0.A Read these signals first
1. **Page kind** - landing (SaaS / consumer / agency / event), portfolio (dev / designer / creative studio), redesign (preserve vs overhaul), editorial / blog.
2. **Vibe words** the user used - "minimalist", "calm", "Linear-style", "Awwwards", "brutalist", "premium consumer", "Apple-y", "playful", "serious B2B", "editorial", "agency-y", "glassy", "dark tech".
3. **Reference signals** - URLs they linked, screenshots they pasted, products they named, brands they're competing with.
4. **Audience** - B2B procurement panel vs. design-conscious consumer vs. recruiter scanning a portfolio. The audience picks the aesthetic, not your taste.
5. **Brand assets that already exist** - logo, color, type, photography. For redesigns, these are starting material, not optional input (see Section 11).
6. **Quiet constraints** - accessibility-first audiences, public-sector, regulated industries, trust-first commerce, kids' products. These constraints OVERRIDE aesthetic preference.

### 0.B Output a one-line "Design Read" before generating
Before any code, state in one line: **"Reading this as: <page kind> for <audience>, with a <vibe> language, leaning toward <design system or aesthetic family>."**

### 0.C If the brief is ambiguous, ask one question, do not guess
Ask exactly **one** clarifying question - never a multi-question dump - and only when the design read genuinely diverges.

### 0.D Anti-Default Discipline
Do not default to: AI-purple gradients, centered hero over dark mesh, three equal feature cards, generic glassmorphism on everything, infinite-loop micro-animations everywhere, Inter + slate-900. These are the LLM defaults. Reach past them deliberately based on the design read.

---

## 1. THE THREE DIALS (Core Configuration)

* **`DESIGN_VARIANCE: 8`** - 1 = Perfect Symmetry, 10 = Artsy Chaos
* **`MOTION_INTENSITY: 6`** - 1 = Static, 10 = Cinematic / Physics
* **`VISUAL_DENSITY: 4`** - 1 = Art Gallery / Airy, 10 = Cockpit / Packed Data

---

## 2. BRIEF -> DESIGN SYSTEM MAP
- Modern SaaS / AI productivity: Linear-style minimal language, high contrast, crisp 1px borders, subtle depth, neutral slate palette with deliberate accent color.
- Respect WCAG AA contrast (4.5:1 minimum).
- Dark and Light mode parity.

---

## 3. DEFAULT ARCHITECTURE & CONVENTIONS
- Framework: React / Inertia.js.
- Styling: Tailwind CSS utilities with deliberate tokens.
- Interactive states: Hover, active, focus, disabled.
- Tactile feedback: `-translate-y-[1px]` or `scale-[0.98]` on click.
- Icons: Standardized SVG icon sets (`lucide-react` or similar), consistent stroke width. No emoji icons.

---

## 4. DESIGN ENGINEERING DIRECTIVES
- Typography: Clear hierarchy.
- Color Calibration: Neutral bases (Slate / Zinc) with high-contrast singular accent.
- Materiality: Subtle border-slate-200/80 (light) and border-slate-800/80 (dark).
- Form UX: Label above input, clean error states, high affordance clickable controls.
- No horizontal scrollbars on desktop forms. Vertical grouping or collapsible accordions.
