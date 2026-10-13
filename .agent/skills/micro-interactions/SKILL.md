---
name: micro-interactions
description: Polished frontend micro-interactions, subtle motion design, tactile affordances, interactive feedback loops, and smooth state transitions for web applications.
---

# Micro-Interactions & Tactile Motion Design Skill

Use this skill when building or refining UI components to ensure delightful, tactile, and non-distracting user interactions across buttons, accordions, modals, navigation menus, and form inputs.

## 1. Core Principles of Micro-Interactions
1. **Purposeful Feedback**: Every interaction must give immediate visual or tactile acknowledgement. A click must feel like a press; a toggle must show its state; a submission must show progress.
2. **Subtlety Over Spectacle**: Never use jarring or bouncing animations that delay the user. Keep durations between **150ms and 250ms** with natural ease-out cubic beziers.
3. **Reduced Motion Respect**: Always respect `motion-reduce:transition-none` and `motion-reduce:animate-none` for users who prefer reduced motion.

## 2. Standard Motion & Interaction Tokens
- **Hover Lift**: `transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md`
- **Active Press**: `active:scale-[0.98] active:translate-y-0 transition-transform duration-100`
- **Chevron / Caret Rotation**: `transition-transform duration-200 ease-in-out` with `rotate-0` to `rotate-90` (or `rotate-180`)
- **Accordion Smooth Collapse**:
  - Use `overflow-hidden transition-all duration-300 ease-in-out`
  - Max-height transition or conditional rendering with entry fade (`animate-in fade-in-0 duration-200`)
- **Pill / Button Glow**: Subtle border highlight `hover:border-brand/40 hover:bg-brand/5 dark:hover:bg-brand/10`
- **Skeleton Shimmer**: `animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md`

## 3. Anti-Patterns to Strictly Avoid
- **Sluggish transitions (> 400ms)** that make the app feel slow.
- **Bouncy spring overshoots** on professional B2B SaaS dashboards.
- **Infinite decorative loops** that distract from task completion.
- **Lack of active/focus states**: Buttons that don't indicate they are being pressed.
