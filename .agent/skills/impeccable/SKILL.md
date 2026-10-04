---
name: impeccable
description: Anti-slop frontend engineering & design craft skill. Removes AI-slop tropes, enforces high craft floor, typography hierarchy, polished micro-interactions, responsive precision, depth, and production-grade UI design.
---

# Impeccable: Anti-Slop Frontend Craft & Polish

Use when the user wants to polish, refine, critique, audit, or elevate frontend UI/UX design to production-grade quality, removing generic AI design tropes ("AI slop") and replacing them with intentional, bespoke, high-craft aesthetics.

## 1. Anti-Slop Directive (What to Refuse)
- **NO generic purple/violet gradients**: Replace with intentional monochrome, slate, brand tints, or authentic theme tokens.
- **NO identical 3-column card grids without hierarchy**: Provide clear grouping, distinct primary/secondary visual weight, and deliberate composition.
- **NO floating elements without ground**: Cards, dialogs, and sections must have coherent structural anchors, borders, and tactile elevation.
- **NO meaningless decorative noise**: Zero-offset colored halos, random mesh gradients, and decorative emojis used as icons are prohibited.
- **NO lazy typography scales**: Hierarchy must show clear, deliberate weight and scale steps (e.g., Bold display heading vs. Medium section header vs. Regular body).
- **NO unstyled browser primitives**: Ensure scrollbars, focus rings, text selection, and native dialog backdrops harmonize with the design tokens.

## 2. Craft Floor & Polish Standards
- **Typography & Measure**:
  - Headings: Geometric, punchy, scannable (`font-heading`, clear weight hierarchy).
  - Body: High legibility, balanced line-height (`1.5` to `1.6`), reading measure 60–75ch.
  - Sentence case for buttons, labels, and pills. No aggressive all-caps tracking unless specifically designated for mini badges.
- **Color & Depth**:
  - High-contrast text: WCAG AAA (≥7:1) for primary text, WCAG AA (≥4.5:1) for muted text.
  - Borders: Crisp, translucent borders (`border-surface-border` or `border-slate-800/80` dark, `border-slate-200/80` light).
  - Shadows: Multi-layer soft elevation with directional light (`shadow-xs`, `shadow-sm`, `shadow-md`), avoiding flat harsh drop-shadows.
- **Tactile Affordances & Micro-Interactions**:
  - Interactive elements must declare `cursor-pointer`.
  - State changes: Smooth `transition-all duration-200 ease-out` with hover elevation (`hover:border-brand/40 hover:shadow-md`) and active feedback (`active:scale-[0.98]` or `active:translate-y-0`).
  - Hit targets: Minimum 44px on touch devices, minimum 32px on desktop.
- **Visual Polish & Materiality**:
  - Studio avatar tiles: Distinct brand tint, rounded-xl geometry, subtle hover accent.
  - Badges & Pills: Accessible contrast, legible padding (`px-2.5 py-0.5`), subtle ring or border definition.
  - Hairline dividers: Consistent, delicate borders (`border-t border-surface-border`).
