---
name: accessibility-a11y
description: Web accessibility (WCAG 2.1 AA) standards, keyboard traps, focus visible management, ARIA attributes, semantic HTML hierarchy, and screen-reader friendliness.
---

# Accessibility (a11y) & Usability Standards Skill

Use this skill to ensure all frontend interfaces meet WCAG 2.1 Level AA compliance, are fully operable via keyboard, and convey appropriate states to assistive technologies.

## 1. Keyboard Navigability
- **Interactive Focus Rings**: Every button, link, and interactive control must have a prominent focus indicator:
  `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900`
- **Tab Order**: Tab order must follow logical visual reading order.
- **Escape Key Handling**: Open modals, dropdowns, and drawers must dismiss on `Escape` key press and return focus to the trigger element.
- **Touch & Click Targets**: Minimum touch target size of 44x44px on mobile devices, minimum 32x32px on desktop.

## 2. ARIA Semantics & Screen Readers
- **Accordions & Disclosures**: Must have `aria-expanded={isOpen}`, `aria-controls={panelId}`, and the trigger should be a `<button type="button">`.
- **Modals & Dialogs**: Must have `role="dialog"`, `aria-modal="true"`, and `aria-labelledby={titleId}`.
- **Icon-Only Buttons**: Must always have an `aria-label` or visually hidden label (e.g. `aria-label="Close sidebar"`).
- **Live Regions**: Dynamic updates (such as error alerts or character counts) should use `aria-live="polite"`.

## 3. Visual Contrast & Readability
- **Contrast Minimums**: Text contrast against background must be at least **4.5:1** for regular text and **3:1** for large text (18pt+ or 14pt bold).
- **Color Independence**: Never convey information (like task status or critical error) with color alone; always pair color with text or recognizable iconography.
