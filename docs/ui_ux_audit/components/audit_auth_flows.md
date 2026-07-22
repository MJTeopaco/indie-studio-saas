# UI/UX Audit Ticket — Authentication Flows & Guest Layout

**Target Files:**
- `resources/js/Layouts/GuestLayout.jsx`
- `resources/js/Pages/Auth/Login.jsx`
- `resources/js/Pages/Auth/Register.jsx`
- `resources/js/Pages/Auth/ForgotPassword.jsx`
- `resources/js/Pages/Auth/ResetPassword.jsx`
- `resources/js/Pages/Auth/ConfirmPassword.jsx`
- `resources/js/Pages/Auth/VerifyEmail.jsx`

---

## 1. Current State & Findings

### Grade: 🟡 B- (Needs Polish)

#### Findings:
1. **Generic Gray Background (`GuestLayout.jsx`)**: Currently uses `min-h-screen flex flex-col sm:justify-center items-center pt-6 sm:pt-0 bg-gray-100 dark:bg-gray-900`. Lacks Vaultera Labs branding, subtle background gradients, or ambient tech glow (`search.py` Style Result 1: "No pure #000000 or plain gray backgrounds; use ambient lighting or gradient canvas").
2. **Card Container Elevation & Glassmorphism**: The login/register card (`w-full sm:max-w-md mt-6 px-6 py-4 bg-white dark:bg-gray-800 shadow-md overflow-hidden sm:rounded-lg`) feels flat and basic. It needs a sleek 16px radius (`rounded-2xl`), subtle border (`border border-slate-200 dark:border-slate-800/80`), and backdrop blur (`backdrop-blur-xl bg-white/90 dark:bg-slate-900/80 shadow-2xl shadow-indigo-500/10`).
3. **Form Input Focus States**: Inputs need crisp focus rings using our Indigo/Violet brand primary (`focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`).
4. **Primary CTA Button Hover**: Login and Register buttons need Vaultera Labs gradient styling (`bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 active:scale-[0.98]`).

---

## 2. Actionable Remediation Checklist (To Be Implemented)

- [ ] **Update `GuestLayout.jsx` Canvas & Card:**
  - Replace `bg-gray-100 dark:bg-gray-900` with `bg-slate-50 dark:bg-slate-950 relative overflow-hidden` + ambient background blur circles (`bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl`).
  - Upgrade card wrapper to `rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-indigo-500/5 p-8`.
- [ ] **Polish `Login.jsx` & `Register.jsx` CTAs & Links:**
  - Ensure headings use `font-heading font-bold text-2xl tracking-tight text-slate-900 dark:text-white`.
  - Upgrade Primary Buttons to use smooth transitions (`duration-200`) and subtle active scale (`active:scale-[0.98]`).
- [ ] **Standardize Password & Email Recovery Pages:**
  - Ensure `ForgotPassword.jsx`, `ResetPassword.jsx`, `ConfirmPassword.jsx`, and `VerifyEmail.jsx` inherit the sleek glassmorphic card and high-contrast typography hierarchy.
