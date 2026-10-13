---
name: form-ux
description: High-craft Form and Data Entry UX skill. Enforces instant client-side validation, accessible focus rings, debounce checks, clear error messaging, disabled state micro-interactions, and double-submit prevention.
---

# Form UX & Data Entry Excellence

This skill provides guidelines and patterns for building robust, user-friendly, and accessible forms and interactive inputs across the application.

## Core Rules

1. **Clear Instant Feedback & Validation**:
   - Validate format on blur and submit; don't yell at the user before they finish typing, but block submit with clear feedback if required fields are missing or malformed.
   - For email fields: Validate format via standard regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) before sending network requests.
   - For textareas and character limits: Show a live counter badge. Escalate color visually as the user nears the limit (e.g., normal at 0-80%, warning amber at 80-95%, danger rose at 95-100%).

2. **Loading States & Double-Submit Guard**:
   - Always disable the submit button immediately upon form dispatch.
   - Swap the submit icon with a subtle spinning loader (`<Loader2 className="animate-spin" />`).
   - Change cursor to `cursor-not-allowed` and reduce opacity (`disabled:opacity-50`) to provide instant visual feedback that the action is processing.
   - Never clear the user's form inputs on an error; preserve typed data so the user doesn't have to retype everything.

3. **In-Modal & Inline Error Messaging**:
   - Render error messages in close proximity to the affected input or at the top of the modal/form using an accessible alert banner (`role="alert"`).
   - Use friendly, human-readable copy. Strip out raw database exceptions, stack traces, or internal framework errors (e.g., "SQLSTATE", "MAIL_HOST", "Symfony").

4. **Keyboard & Accessibility**:
   - Support `Enter` key submission on text inputs.
   - For multi-line textareas, support `Cmd/Ctrl + Enter` or explicit `Enter` with `Shift + Enter` for new lines.
   - Ensure every input has an associated `<label>` or explicit `aria-label`.
   - Use high-contrast focus rings (`focus:ring-2 focus:ring-brand/40 focus:border-brand`).
