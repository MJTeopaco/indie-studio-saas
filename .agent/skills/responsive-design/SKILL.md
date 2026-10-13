---
name: responsive-design
description: Frontend responsive design and multi-screen layout excellence. Enforces adaptive breakpoints, touch target sizing (min 44x44px), fluid containers, overflow containment, print layouts, and cross-browser consistency.
---

# Responsive Design & Layout Precision

This skill provides standards for multi-screen, high-density, and responsive web applications.

## Core Rules

1. **Adaptive Breakpoints & Fluidity**:
   - Design mobile-first or tablet-first when architecting complex SaaS layouts.
   - Use standard Tailwind breakpoints (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`).
   - Use flexible flex and grid wraps (`flex-wrap`, `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) to avoid clipping on intermediate laptop resolutions (1366x768).

2. **Touch Targets & Click Affordance**:
   - Interactive elements (buttons, inputs, dropdown items, close icons) must meet the minimum 44x44px touch target guideline or have adequate padding for comfortable interaction.
   - Add clear hover and active states (`active:scale-95`, `transition-all duration-150`).

3. **Horizontal Scroll Prevention & Overflow**:
   - Guard against unexpected horizontal scrollbars (`overflow-x-hidden` on main layouts, `overflow-x-auto` specifically on wide data tables or Gantt charts).
   - Use `truncate` or `break-words` on user-generated text content (titles, sprint names, emails) to prevent layout rupture.

4. **Print Media Styles**:
   - For document, report, and invoice views, provide tailored `@media print` rules.
   - Hide unnecessary chrome (`print:hidden` for sidebars, navigation headers, action buttons, modals).
   - Set clean print container backgrounds (`print:bg-white print:text-black print:p-0`).
   - Ensure clean page breaks without clipping headers (`break-inside-avoid`, `page-break-inside: avoid`).
