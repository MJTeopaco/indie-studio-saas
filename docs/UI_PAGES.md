# StudioSprint — UI Pages & View Architecture Directory

This document provides a comprehensive, production-grade inventory and functional specification of every User Interface (UI) page in the **StudioSprint** system.

---

## 1. System Architecture Overview

StudioSprint is built on a **hybrid multi-tenant SaaS architecture**:
* **Central / Landlord Domain:** Houses global user identity, authentication, profile configurations, the Developer Passport onboarding pipeline, and the Central Studio Hub.
* **Tenant / Studio Workspaces:** Path-based routing (`/studio/{tenant}/*`) using `stancl/tenancy`, which activates dedicated tenant database connections for isolated project data, tasks, sprint management, channels, and team schedules.
* **Frontend Tech Stack:** Inertia.js with React 18, Tailwind CSS 3, Vite, Recharts, and Lucide React icons.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             CENTRAL LANDLORD HUB                                 │
│  • Public Landing (/)             • Central Dashboard (/dashboard)               │
│  • Authentication (/login, etc.)  • User Profile (/profile)                      │
│  • Onboarding Wizard (/onboarding)• Workspace Fork (/onboarding/fork)            │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │ Path-Based Tenancy Resolution
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                       TENANT / STUDIO WORKSPACE (/studio/{tenant})               │
│  • Manager AI Dashboard / Member "My Work" Dashboard                             │
│  • Studio Inbox & Channel Messenger (Real-time polling, attachments, pins)       │
│  • Executive Overview & Analytics                                                │
│  • Projects Portfolio & Dedicated Project Kanban/Sprint/CPA Workspace            │
│  • Tasks Hub (Board, List, Timeline, Due Dates)                                  │
│  • Master Schedule (Month, Week, Day Calendar)                                   │
│  • Team Capacity & Interactive Hourly Gantt Scheduler                            │
│  • Reports & Intelligence Hub (CSV export, Email/Chat sharing)                   │
│  • Knowledge Base & Archived Reports Documentation                               │
│  • Sprint Burndown & Velocity Dashboard                                          │
│  • Fibonacci Estimation Queues (Member Pending & Manager Review)                 │
│  • Automation Hub & Studio Settings Placeholders                                 │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Master Page Inventory

| # | Page Name | Inertia Page Component | Route Path | Route Name | Controller & Action | Access / Role | Primary Layout |
|---|---|---|---|---|---|---|---|
| **01** | Landing Page | [`Welcome.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Welcome.jsx) | `GET /` | — | Inline Closure (`web.php`) | Public (Guest/Auth) | Standalone |
| **02** | Login | [`Auth/Login.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Auth/Login.jsx) | `GET /login` | `login` | [`AuthenticatedSessionController@create`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/Auth/AuthenticatedSessionController.php) | Guest | `GuestLayout` |
| **03** | Register | [`Auth/Register.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Auth/Register.jsx) | `GET /register` | `register` | [`RegisteredUserController@create`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/Auth/RegisteredUserController.php) | Guest | `GuestLayout` |
| **04** | Forgot Password | [`Auth/ForgotPassword.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Auth/ForgotPassword.jsx) | `GET /forgot-password` | `password.request` | [`PasswordResetLinkController@create`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/Auth/PasswordResetLinkController.php) | Guest | `GuestLayout` |
| **05** | Reset Password | [`Auth/ResetPassword.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Auth/ResetPassword.jsx) | `GET /reset-password/{token}` | `password.reset` | [`NewPasswordController@create`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/Auth/NewPasswordController.php) | Guest | `GuestLayout` |
| **06** | Confirm Password | [`Auth/ConfirmPassword.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Auth/ConfirmPassword.jsx) | `GET /confirm-password` | `password.confirm` | [`ConfirmablePasswordController@show`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/Auth/ConfirmablePasswordController.php) | Authenticated | `GuestLayout` |
| **07** | Verify Email | [`Auth/VerifyEmail.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Auth/VerifyEmail.jsx) | `GET /verify-email` | `verification.notice` | [`EmailVerificationPromptController@__invoke`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/Auth/EmailVerificationPromptController.php) | Authenticated | `GuestLayout` |
| **08** | Developer Passport Wizard | [`Onboarding/Wizard.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Onboarding/Wizard.jsx) | `GET /onboarding` | `onboarding.show` | [`OnboardingController@show`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/OnboardingController.php) | Authenticated | `AuthenticatedLayout` |
| **09** | Workspace Fork Selection | [`Onboarding/Fork.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Onboarding/Fork.jsx) | `GET /onboarding/fork` | `onboarding.fork` | [`OnboardingController@fork`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/OnboardingController.php) | Authenticated | `AuthenticatedLayout` |
| **10** | Central User Hub Dashboard | [`Dashboard.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Dashboard.jsx) | `GET /dashboard` | `dashboard` | [`CentralDashboardController@index`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/CentralDashboardController.php) | Auth + Verified + Onboarded | `AuthenticatedLayout` |
| **11** | User Profile & Security Settings | [`Profile/Edit.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Profile/Edit.jsx) | `GET /profile` | `profile.edit` | [`ProfileController@edit`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/ProfileController.php) | Authenticated | `AuthenticatedLayout` |
| **12** | Studio Manager AI Dashboard | [`Tenant/Dashboard.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Dashboard.jsx) | `GET /studio/{tenant}/dashboard` | `tenant.dashboard` | [`TenantDashboardController@index`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/TenantDashboardController.php) | Manager / Owner / Leader | `TenantLayout` |
| **13** | Studio Member "My Work" Dashboard | [`Tenant/MemberDashboard.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/MemberDashboard.jsx) | `GET /studio/{tenant}/dashboard` or `/my-work` | `tenant.my-work` | [`TenantDashboardController@index`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/TenantDashboardController.php) | Member / Developer | `TenantLayout` |
| **14** | Studio Inbox & Channel Messenger | [`Tenant/Inbox.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Inbox.jsx) | `GET /studio/{tenant}/inbox` | `tenant.inbox` | [`TenantDashboardController@inbox`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/TenantDashboardController.php) | Tenant Member | `TenantLayout` |
| **15** | Studio Executive Overview | [`Tenant/Dashboard/Overview.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Dashboard/Overview.jsx) | `GET /studio/{tenant}/overview` | `tenant.overview` | [`TenantOverviewController@index`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/TenantOverviewController.php) | Tenant Member | `TenantLayout` |
| **16** | Studio Projects Portfolio | [`Tenant/Projects/Index.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Projects/Index.jsx) | `GET /studio/{tenant}/projects` | `tenant.projects.index` | [`TenantProjectController@index`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/TenantProjectController.php) | Tenant Member | `TenantLayout` |
| **17** | Single Project Workspace | [`Tenant/Projects/Show.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Projects/Show.jsx) | `GET /studio/{tenant}/projects/{project}` | `tenant.projects.show` | [`TenantProjectController@show`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/TenantProjectController.php) | Tenant Member | `ProjectLayout` |
| **18** | Studio Tasks Management | [`Tenant/Tasks/Index.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Tasks/Index.jsx) | `GET /studio/{tenant}/tasks` | `tenant.tasks` | [`TenantTaskController@index`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/TenantTaskController.php) | Tenant Member | `TenantLayout` |
| **19** | Studio Master Schedule | [`Tenant/Schedule/Index.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Schedule/Index.jsx) | `GET /studio/{tenant}/schedule` | `tenant.schedule` | [`TenantScheduleController@index`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/TenantScheduleController.php) | Tenant Member | `TenantLayout` |
| **20** | Team Directory & Capacity Gantt | [`Tenant/Team/Index.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Team/Index.jsx) | `GET /studio/{tenant}/team` | `tenant.team` | [`TenantTeamController@index`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/TenantTeamController.php) | Tenant Member | `TenantLayout` |
| **21** | Studio Documentation & Archives | [`Tenant/Docs.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Docs.jsx) | `GET /studio/{tenant}/docs` | `tenant.docs` | [`TenantDocsController@index`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/TenantDocsController.php) | Tenant Member | `TenantLayout` |
| **22** | Reports & Intelligence Hub | [`Tenant/Reports/Index.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Reports/Index.jsx) | `GET /studio/{tenant}/reports` | `tenant.reports` | [`TenantReportController@index`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/TenantReportController.php) | Tenant Member | `TenantLayout` |
| **23** | Sprint Burndown & Velocity | [`Tenant/Burndown.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Burndown.jsx) | `GET /studio/{tenant}/burndown` | `tenant.burndown` | [`BurndownController@index`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/BurndownController.php) | Tenant Member | `TenantLayout` |
| **24** | Task Estimation Submission Queue | [`Tenant/Estimates/PendingQueue.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Estimates/PendingQueue.jsx) | `GET /studio/{tenant}/estimates/pending` | `tenant.estimates.pending` | [`EstimationController@pendingQueue`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/EstimationController.php) | Tenant Member | `TenantLayout` |
| **25** | Task Estimation Review Queue | [`Tenant/Estimates/ReviewQueue.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Estimates/ReviewQueue.jsx) | `GET /studio/{tenant}/estimates/needs-review` | `tenant.estimates.review` | [`EstimationController@reviewQueue`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/EstimationController.php) | Manager / Owner | `TenantLayout` |
| **26a** | Agentic Automation Hub | [`Tenant/Placeholder.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Placeholder.jsx) | `GET /studio/{tenant}/automation` | `tenant.automation` | Inline Closure (`tenant.php`) | Tenant Member | `TenantLayout` |
| **26b** | Studio Settings | [`Tenant/Placeholder.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Placeholder.jsx) | `GET /studio/{tenant}/settings` | `tenant.settings` | Inline Closure (`tenant.php`) | Tenant Member | `TenantLayout` |

---

## 3. Detailed Page Specifications

### Tier 1: Public & Marketing

#### 1. Welcome & Product Landing Page
* **Component File:** [`resources/js/Pages/Welcome.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Welcome.jsx)
* **Route:** `GET /`
* **Controller:** Direct route closure in [`routes/web.php`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/routes/web.php)
* **Access Level:** Public / Guests & Authenticated Users
* **Layout:** Standalone full-bleed page with custom navigation header & footer.
* **Props Received:** `auth` (user login status), `canLogin`, `canRegister`.
* **Key Features & UI Elements:**
  * **Hero Section:** Value proposition headline, live dark/light mode toggle with smooth persistent transitions, call-to-action buttons ("Launch Workspace" or "Go to Hub").
  * **ScrollReveal Animations:** Smooth viewport-triggered staggered transitions for interactive feature cards.
  * **Feature Showcase Bento Grid:**
    * *Agentic Sprint Decomposition:* Showcases automated AI prompt-to-sprint task breakdown.
    * *Bipartite Graph Neural Network (GNN) Matching:* Visualizes skill-to-developer link prediction scoring.
    * *Critical Path Analysis (CPA):* Highlights zero-float bottleneck task identification and live Gantt tracking.
    * *Hybrid Multi-Tenancy Architecture:* Explains tenant isolation with centralized passports.
  * **Live System Metrics:** Interactive counters for match accuracy, sprint velocity gains, and team efficiency.

---

### Tier 2: Central Authentication

#### 2. User Login Page
* **Component File:** [`resources/js/Pages/Auth/Login.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Auth/Login.jsx)
* **Route:** `GET /login` (Name: `login`)
* **Controller:** [`App\Http\Controllers\Auth\AuthenticatedSessionController@create`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/Auth/AuthenticatedSessionController.php)
* **Access Level:** Guest only (`guest` middleware)
* **Layout:** [`resources/js/Layouts/GuestLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/GuestLayout.jsx)
* **Props Received:** `canResetPassword`, `status`.
* **Key Features & UI Elements:**
  * Clean form card with floating labels for Email and Password.
  * "Remember me" checkbox persistence.
  * "Forgot your password?" link to password reset request flow.
  * Submission redirects to `/dashboard` with auto-routing through `requires.onboarding`.

#### 3. User Registration Page
* **Component File:** [`resources/js/Pages/Auth/Register.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Auth/Register.jsx)
* **Route:** `GET /register` (Name: `register`)
* **Controller:** [`App\Http\Controllers\Auth\RegisteredUserController@create`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/Auth/RegisteredUserController.php)
* **Access Level:** Guest only (`guest` middleware)
* **Layout:** [`resources/js/Layouts/GuestLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/GuestLayout.jsx)
* **Key Features & UI Elements:**
  * Inputs for Full Name, Email, Password, and Password Confirmation.
  * Password strength hints and real-time validation error alerts.
  * "Already registered?" direct login redirect link.
  * Automatic post-registration redirect into Developer Passport onboarding.

#### 4. Forgot Password Page
* **Component File:** [`resources/js/Pages/Auth/ForgotPassword.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Auth/ForgotPassword.jsx)
* **Route:** `GET /forgot-password` (Name: `password.request`)
* **Controller:** [`App\Http\Controllers\Auth\PasswordResetLinkController@create`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/Auth/PasswordResetLinkController.php)
* **Layout:** [`GuestLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/GuestLayout.jsx)
* **Key Features:** Email input field to trigger password reset links with flash status confirmation.

#### 5. Reset Password Page
* **Component File:** [`resources/js/Pages/Auth/ResetPassword.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Auth/ResetPassword.jsx)
* **Route:** `GET /reset-password/{token}` (Name: `password.reset`)
* **Controller:** [`App\Http\Controllers\Auth\NewPasswordController@create`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/Auth/NewPasswordController.php)
* **Layout:** [`GuestLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/GuestLayout.jsx)
* **Key Features:** Token-gated form with Email, new Password, and Password confirmation fields.

#### 6. Confirm Password Page
* **Component File:** [`resources/js/Pages/Auth/ConfirmPassword.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Auth/ConfirmPassword.jsx)
* **Route:** `GET /confirm-password` (Name: `password.confirm`)
* **Controller:** [`App\Http\Controllers\Auth\ConfirmablePasswordController@show`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/Auth/ConfirmablePasswordController.php)
* **Layout:** [`GuestLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/GuestLayout.jsx)
* **Key Features:** Security gate requiring password confirmation before performing critical/destructive actions.

#### 7. Verify Email Prompt Page
* **Component File:** [`resources/js/Pages/Auth/VerifyEmail.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Auth/VerifyEmail.jsx)
* **Route:** `GET /verify-email` (Name: `verification.notice`)
* **Controller:** [`App\Http\Controllers\Auth\EmailVerificationPromptController`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/Auth/EmailVerificationPromptController.php)
* **Layout:** [`GuestLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/GuestLayout.jsx)
* **Key Features:** Notice informing the user that an email verification link has been dispatched, with a "Resend Verification Email" button and a logout button.

---

### Tier 3: Central Hub, Profile & Onboarding

#### 8. Developer Passport Onboarding Wizard
* **Component File:** [`resources/js/Pages/Onboarding/Wizard.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Onboarding/Wizard.jsx)
* **Route:** `GET /onboarding` (Name: `onboarding.show`)
* **Controller:** [`App\Http\Controllers\OnboardingController@show`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/OnboardingController.php)
* **Access Level:** Authenticated users
* **Layout:** [`resources/js/Layouts/AuthenticatedLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/AuthenticatedLayout.jsx)
* **Props Received:** `positions` (list of available developer roles), `skills` (master list of 96 technical skills).
* **Child Components:**
  * [`ProgressIndicator.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Onboarding/ProgressIndicator.jsx)
  * [`StepOneIdentity.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Onboarding/StepOneIdentity.jsx) — Role selection, years of experience, invitation toggle.
  * [`StepTwoSkills.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Onboarding/StepTwoSkills.jsx) — Multi-skill picker with 1–5 star proficiency matrix.
  * [`StepThreeLogistics.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Onboarding/StepThreeLogistics.jsx) — Weekly available hours (capacity) and local timezone.
  * [`WizardNavigation.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Onboarding/WizardNavigation.jsx)
* **Key Features:**
  * Multi-step wizard enforcing profile completeness before accessing workspace dashboards.
  * Populates the landlord database with developer embeddings utilized by the Python GNN model.

#### 9. Workspace Fork Selection Page
* **Component File:** [`resources/js/Pages/Onboarding/Fork.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Onboarding/Fork.jsx)
* **Route:** `GET /onboarding/fork` (Name: `onboarding.fork`)
* **Controller:** [`App\Http\Controllers\OnboardingController@fork`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/OnboardingController.php)
* **Access Level:** Authenticated users
* **Layout:** [`AuthenticatedLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/AuthenticatedLayout.jsx)
* **Key Features & UI Elements:**
  * Dual-choice branch decision:
    1. **Create a New Studio:** Input studio name to provision a tenant workspace and assign the current user as `owner`.
    2. **Join an Existing Studio:** Enter an 8-character studio invitation code to bind the user's passport to an established workspace as a `member`.

#### 10. Central User Hub Dashboard
* **Component File:** [`resources/js/Pages/Dashboard.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Dashboard.jsx)
* **Route:** `GET /dashboard` (Name: `dashboard`)
* **Controller:** [`App\Http\Controllers\CentralDashboardController@index`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/CentralDashboardController.php)
* **Access Level:** Authenticated, Verified, and completed Onboarding (`['auth', 'verified', 'requires.onboarding']`)
* **Layout:** [`AuthenticatedLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/AuthenticatedLayout.jsx)
* **Props Received:** `ownedStudios` (array), `joinedStudios` (array).
* **Modals & Components:**
  * [`CreateStudioModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Hub/CreateStudioModal.jsx) — Quick studio creation modal.
  * [`JoinStudioModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Hub/JoinStudioModal.jsx) — Modal with invite code validation.
  * [`StudioCard.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Hub/StudioCard.jsx) — Workspace cards showing member count, active status, role badge, and "Open Studio" direct launcher link.
* **Key Features:**
  * Central management cockpit displaying all multi-tenant studios associated with the account.
  * Categorized views: "Studio Workspaces You Manage" vs. "Workspaces You've Joined".
  * Empty state with guided action buttons when no workspaces exist.

#### 11. User Profile & Security Settings Page
* **Component File:** [`resources/js/Pages/Profile/Edit.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Profile/Edit.jsx)
* **Route:** `GET /profile` (Name: `profile.edit`)
* **Controller:** [`App\Http\Controllers\ProfileController@edit`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/ProfileController.php)
* **Access Level:** Authenticated users
* **Layout:** [`AuthenticatedLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/AuthenticatedLayout.jsx)
* **Child Forms:**
  * [`UpdateProfileInformationForm.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Profile/Partials/UpdateProfileInformationForm.jsx) — Edit name, email, and trigger email verification resend.
  * [`UpdatePasswordForm.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Profile/Partials/UpdatePasswordForm.jsx) — Current password verification and new password specification.
  * [`DeleteUserForm.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Profile/Partials/DeleteUserForm.jsx) — Permanent account deletion modal with password confirmation gate.

---

### Tier 4: Tenant / Studio Workspace (`/studio/{tenant}/*`)

#### 12. Studio Manager AI Orchestration Dashboard
* **Component File:** [`resources/js/Pages/Tenant/Dashboard.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Dashboard.jsx)
* **Route:** `GET /studio/{tenant}/dashboard` (Name: `tenant.dashboard`)
* **Controller:** [`App\Http\Controllers\TenantDashboardController@index`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/TenantDashboardController.php) (resolves manager role: `owner`, `leader`, `manager`)
* **Access Level:** Studio Managers & Administrators
* **Layout:** [`resources/js/Layouts/TenantLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/TenantLayout.jsx)
* **Props Received:** `studio`, `projects`, `activeTasks`, `skills`, `positions`, `teamMembers`.
* **Modals & Sub-components:**
  * [`HierarchicalDecompositionModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/ML/HierarchicalDecompositionModal.jsx) — AI-driven Epic, Sprint & Task hierarchy generator.
  * [`ManualTaskModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Projects/ManualTaskModal.jsx) — Manual task creation and attribute configuration.
  * [`CreateProjectModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Projects/CreateProjectModal.jsx) — Initialize new projects.
  * [`RightSidebar.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Projects/RightSidebar.jsx) — Live feed of active sprint tasks with priority badges and GNN match percentage.
  * [`ConfirmationModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/ConfirmationModal.jsx)
* **Key Features & UI Elements:**
  * **Agentic Chat Bar:** Expanded multi-line AI orchestration prompt supporting natural language commands (e.g., "Decompose the RPG combat system into 3 sprints with critical path scheduling").
  * **Quick Actions Grid:** Direct triggers for "Create Task", "Run GNN Match", "View Timeline", and "Manage Team".
  * **Live AI Stream / History:** Markdown-rendered conversational response log with actionable proposal widgets (`useChatSessions`).

#### 13. Studio Member "My Work" Dashboard
* **Component File:** [`resources/js/Pages/Tenant/MemberDashboard.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/MemberDashboard.jsx)
* **Route:** `GET /studio/{tenant}/dashboard` (Name: `tenant.dashboard`) or alias `GET /studio/{tenant}/my-work` (Name: `tenant.my-work`)
* **Controller:** [`TenantDashboardController@index`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/TenantDashboardController.php) (served automatically when user role is `member` / non-manager)
* **Layout:** [`TenantLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/TenantLayout.jsx)
* **Props Received:** `studio`, `myTasks`, `sprintTasks`, `inboxTasks`, `notifications`, `activeSprint`, `pendingEstimatesCount`.
* **Modals & Components:**
  * [`MemberTaskCard.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Tasks/MemberTaskCard.jsx) — Linear-style task card with status icons, story point tags, and CPA flags.
  * [`MemberTaskDetailModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Tasks/MemberTaskDetailModal.jsx) — Modal for viewing task descriptions, changing progress status, and reviewing assignees.
* **Key Features & UI Elements:**
  * **Dual View Modes:** Toggle between **Board View** and **Focus View**.
  * **Categorized Task Columns:** "In Progress", "Next Up / To Do", "In Review", "Done".
  * **Active Sprint Banner:** Countdown timer, sprint goal, and total completed story points.
  * **Pending Estimates Alert Bar:** Notification pill prompting the developer to vote on unestimated tasks.
  * **Sprint Backlog Inspector:** Bottom drawer exploring unassigned or future-sprint items.

#### 14. Studio Inbox & Channel Messenger
* **Component File:** [`resources/js/Pages/Tenant/Inbox.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Inbox.jsx)
* **Route:** `GET /studio/{tenant}/inbox` (Name: `tenant.inbox`)
* **Controller:** [`TenantDashboardController@inbox`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/TenantDashboardController.php)
* **Layout:** [`TenantLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/TenantLayout.jsx)
* **Key Features & UI Elements:**
  * **Dual-Pane Interface:**
    1. **Notifications Hub:** Filter alerts by "All", "Unread", "Sprint", "Task", "Mentions", "Estimate", and "Critical". Supports "Mark All as Read", single-click task inspection, and direct deep-linking.
    2. **Studio Channel Messenger (Slack/Discord-grade):**
       * Built-in channels: `#general`, `#sprint-room`, `#dev-help`, plus custom and project-bound channels.
       * Real-time polling updates for new incoming messages and unread badges.
       * Rich messaging features: Message pinning, thread replies, `@mentions`, and email forwarding.
       * Secure file attachments: Photo previews, document uploads, and secure download serving via `/studio/{tenant}/attachments/{path}`.
       * Channel Asset Gallery: Dedicated drawer displaying all images and documents shared within that channel.

#### 15. Studio Executive Overview & Analytics
* **Component File:** [`resources/js/Pages/Tenant/Dashboard/Overview.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Dashboard/Overview.jsx)
* **Route:** `GET /studio/{tenant}/overview` (Name: `tenant.overview`)
* **Controller:** [`App\Http\Controllers\TenantOverviewController@index`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/TenantOverviewController.php)
* **Layout:** [`TenantLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/TenantLayout.jsx)
* **Key Features & UI Elements:**
  * **High-Level KPI Cards:** Total Active Tasks, Active Projects, Velocity Pace, Overdue/Critical Warnings.
  * **Project Portfolio Progress Cards:** Visual progress bars displaying percentage completion across all projects.
  * **Critical Path & Bottleneck Alert Center:** Flags zero-float tasks threatening delivery milestones.
  * **Advanced Filters:** Real-time search, project selector, assignee filter, and priority ranking.
  * **CPA Task AI Synthesizer:** [`CpaTaskAiModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/CpaAiSynthesizer.jsx) integrating AI recommendations for bottleneck resolution.

#### 16. Studio Projects Portfolio Directory
* **Component File:** [`resources/js/Pages/Tenant/Projects/Index.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Projects/Index.jsx)
* **Route:** `GET /studio/{tenant}/projects` (Name: `tenant.projects.index`)
* **Controller:** [`App\Http\Controllers\TenantProjectController@index`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/TenantProjectController.php)
* **Layout:** [`TenantLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/TenantLayout.jsx)
* **Modals & Components:**
  * [`ProjectCard.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Projects/ProjectCard.jsx) — Displays project health status, epic counts, active sprint name, and member avatars.
  * [`CreateProjectModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Projects/CreateProjectModal.jsx) — Modal with title, slug, description, and status pickers.
* **Key Features:**
  * Summary banner indicating total active initiatives and active collaborator counts.
  * Grid card listing with quick links into each project's Kanban workspace.

#### 17. Single Project Workspace & Kanban Board
* **Component File:** [`resources/js/Pages/Tenant/Projects/Show.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Projects/Show.jsx)
* **Route:** `GET /studio/{tenant}/projects/{project}` (Name: `tenant.projects.show`)
* **Controller:** [`App\Http\Controllers\TenantProjectController@show`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/TenantProjectController.php)
* **Layout:** [`resources/js/Layouts/ProjectLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/ProjectLayout.jsx)
* **Sub-views & Tabs:**
  1. **Kanban Board (`'board'`):** Drag-and-drop / status columns: *To Do*, *In Progress*, *In Review*, *Done*, *Stuck*. Cards sorted automatically by priority and critical path urgency.
  2. **Epic Breakdown (`'epics'`):** [`EpicBreakdown.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Projects/EpicBreakdown.jsx) — Hierarchical epic groups, attributes, and progress percentages.
  3. **Sprint Planning (`'sprints'`):** [`SprintBreakdown.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Projects/SprintBreakdown.jsx) — Sprint creation, story point capacity tracking, status transitions, and bulk AI decomposition.
  4. **Critical Path Analysis (`'cpa'`):** Interactive CPA Gantt chart showing Early Start (ES), Late Start (LS), Total Float, and critical red-highlighted path.
  5. **AI Assistant (`'assistant'`):** [`ProjectAiAssistant.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Projects/ProjectAiAssistant.jsx) — Embedded project-specific AI chat bot with automated action execution.
* **Modals Integrated:**
  * [`BestFitModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/ML/BestFitModal.jsx) — GNN bipartite matching modal calculating developer fit scores.
  * [`ManualTaskModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Projects/ManualTaskModal.jsx)
  * [`UpdateTaskStatusModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Projects/UpdateTaskStatusModal.jsx)
  * [`ManageAssignmentModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Projects/ManageAssignmentModal.jsx)
  * [`CreateEpicModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Projects/CreateEpicModal.jsx)
  * [`CreateEpicGroupModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Projects/CreateEpicGroupModal.jsx)

#### 18. Studio Tasks Management Hub
* **Component File:** [`resources/js/Pages/Tenant/Tasks/Index.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Tasks/Index.jsx)
* **Route:** `GET /studio/{tenant}/tasks` (Name: `tenant.tasks`)
* **Controller:** [`App\Http\Controllers\TenantTaskController@index`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/TenantTaskController.php)
* **Layout:** [`TenantLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/TenantLayout.jsx)
* **Views Integrated:**
  1. **Board View:** [`BoardView.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Tasks/BoardView.jsx) — Studio-wide Kanban columns.
  2. **List View:** [`ListView.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Tasks/ListView.jsx) — Dense tabular listing with sortable columns.
  3. **Timeline View:** [`TimelineView.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Tasks/TimelineView.jsx) — Gantt timeline mapping tasks across dates.
  4. **Due Tasks View:** [`DueView.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Tasks/DueView.jsx) — Grouped by "Overdue", "Due Today", "Due This Week", and "Later".
* **Key Features:** Cross-project filter selector, instant title/assignee search, and manual task creation trigger.

#### 19. Studio Master Schedule & Calendar
* **Component File:** [`resources/js/Pages/Tenant/Schedule/Index.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Schedule/Index.jsx)
* **Route:** `GET /studio/{tenant}/schedule` (Name: `tenant.schedule`)
* **Controller:** [`App\Http\Controllers\TenantScheduleController@index`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/TenantScheduleController.php)
* **Layout:** [`TenantLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/TenantLayout.jsx)
* **Child Components:**
  * [`CalendarGrid.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Schedule/CalendarGrid.jsx) — Full month calendar view with event pills.
  * [`WeekGrid.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Schedule/WeekGrid.jsx) — 7-day multi-column time grid.
  * [`DayPanel.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Schedule/DayPanel.jsx) — Hourly agenda schedule panel for standups, reviews, and task deadlines.
  * [`EventPill.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Schedule/EventPill.jsx)
* **Key Features:** Month/Week/Day mode switching, date range navigation, and integration with project task due dates and team events.

#### 20. Studio Team Directory & Capacity Gantt
* **Component File:** [`resources/js/Pages/Tenant/Team/Index.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Team/Index.jsx)
* **Route:** `GET /studio/{tenant}/team` (Name: `tenant.team`)
* **Controller:** [`App\Http\Controllers\TenantTeamController@index`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/TenantTeamController.php)
* **Layout:** [`TenantLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/TenantLayout.jsx)
* **Sub-views & Tabs:**
  1. **Team Overview:** Card gallery of developers showing department (*Engineering*, *Product*, *Design*, *QA*), availability status (*Active*, *Remote*, *Part-time*), email, weekly capacity, and top skills.
  2. **Workload Timeline:** [`TeamTimeline.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/TeamTimeline.jsx) — Interactive hourly timeline (10 AM to 9 PM) mapping each member's assigned tasks.
* **Modals & Actions:**
  * [`TeamMemberProfileModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Team/TeamMemberProfileModal.jsx) — Comprehensive developer passport inspector (skills breakdown, current workload, contact details).
  * **Invite Code Trigger:** Copy one-click studio invitation link with 8-character invitation token.

#### 21. Studio Documentation & Knowledge Base
* **Component File:** [`resources/js/Pages/Tenant/Docs.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Docs.jsx)
* **Route:** `GET /studio/{tenant}/docs` (Name: `tenant.docs`)
* **Controller:** [`App\Http\Controllers\TenantDocsController@index`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/TenantDocsController.php)
* **Layout:** [`TenantLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/TenantLayout.jsx)
* **Sub-views & Tabs:**
  1. **User Guides & System Docs:** In-depth documentation covering *Multi-Tenancy*, *GNN AI Matching*, *Critical Path Analysis*, *Agentic Automation*, and *Estimation Queues*.
  2. **Archived Reports Gallery:** Repository of permanently saved analytical snapshots and sprint reports.
* **Key Features:**
  * Interactive view and deletion of frozen analytical reports.
  * Direct print / PDF export layout generator.
  * Real-time search across archived records by project name or author.

#### 22. Reports & Intelligence Analytics Hub
* **Component File:** [`resources/js/Pages/Tenant/Reports/Index.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Reports/Index.jsx)
* **Route:** `GET /studio/{tenant}/reports` (Name: `tenant.reports`)
* **Controller:** [`App\Http\Controllers\TenantReportController@index`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/TenantReportController.php)
* **Layout:** [`TenantLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/TenantLayout.jsx)
* **Key Features & UI Elements:**
  * **Interactive Recharts Visualizations:**
    * *Task Completion Breakdown Pie Chart:* Real-time distribution of completed, in-progress, overdue, and to-do tasks.
    * *Developer Velocity & Workload Bar Chart:* Story points planned vs. points completed across team members.
  * **Analytical Filters:** Filter metrics by Project, Sprint, Assignee, and Date Range.
  * **Export & Sharing Triggers:**
    * *Share via Email:* Dispatches formatted analytics summaries to team stakeholder emails.
    * *Share to Channel Chat:* Broadcasts interactive report cards directly into `#general` or `#sprint-room`.
    * *Export CSV:* Download raw task and sprint metric data via `/studio/{tenant}/reports/export-csv`.
    * *Archive Report:* Freezes the current live dataset into a permanent documentation record.

#### 23. Sprint Burndown & Velocity Dashboard
* **Component File:** [`resources/js/Pages/Tenant/Burndown.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Burndown.jsx)
* **Route:** `GET /studio/{tenant}/burndown` (Name: `tenant.burndown`)
* **Controller:** [`App\Http\Controllers\BurndownController@index`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/BurndownController.php)
* **Layout:** [`TenantLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/TenantLayout.jsx)
* **Props Received:** `burndownData`, `studioName`.
* **Key Features & UI Elements:**
  * Grid of project cards displaying remaining story points and percentage completion progress bars.
  * **Velocity History Feed:** Tabulates completed story points per sprint to track historical team delivery trends.

#### 24. Task Estimation Submission Queue
* **Component File:** [`resources/js/Pages/Tenant/Estimates/PendingQueue.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Estimates/PendingQueue.jsx)
* **Route:** `GET /studio/{tenant}/estimates/pending` (Name: `tenant.estimates.pending`)
* **Controller:** [`App\Http\Controllers\EstimationController@pendingQueue`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/EstimationController.php)
* **Layout:** [`TenantLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/TenantLayout.jsx)
* **Props Received:** `studio`, `tasks`.
* **Key Features:**
  * Personal estimation queue for developers to vote on assigned or sprint tasks.
  * Displays AI-suggested story points as a reference benchmark.
  * Single-click Fibonacci point buttons: `1`, `2`, `3`, `5`, `8`, `13`.
  * Optimistic UI update and asynchronous submission to `/studio/{tenant}/tasks/{task}/estimates`.

#### 25. Task Estimation Manager Review Queue
* **Component File:** [`resources/js/Pages/Tenant/Estimates/ReviewQueue.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Estimates/ReviewQueue.jsx)
* **Route:** `GET /studio/{tenant}/estimates/needs-review` (Name: `tenant.estimates.review`)
* **Controller:** [`App\Http\Controllers\EstimationController@reviewQueue`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/app/Http/Controllers/EstimationController.php)
* **Access Level:** Studio Managers & Owners
* **Layout:** [`TenantLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/TenantLayout.jsx)
* **Props Received:** `studio`, `tasks`.
* **Key Features:**
  * Surfaces tasks with diverged developer estimate submissions or expired voting windows.
  * Shows developer-by-developer vote breakdown alongside AI recommendation.
  * Final story point selector with review note input to resolve estimation consensus and unblock scheduling.

#### 26. Feature Placeholder Modules
* **Component File:** [`resources/js/Pages/Tenant/Placeholder.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Placeholder.jsx)
* **Routes:**
  * **26a. Agentic Automation Hub:** `GET /studio/{tenant}/automation` (Name: `tenant.automation`)
  * **26b. Studio Settings:** `GET /studio/{tenant}/settings` (Name: `tenant.settings`)
* **Controllers:** Direct route closures in [`routes/tenant.php`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/routes/tenant.php)
* **Layout:** [`TenantLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/TenantLayout.jsx)
* **Key Features:**
  * Dynamic module card displaying roadmap status ("Agent Core Offline", "Active Configuration").
  * Architecture Bento Cards outlining planned GNN capacity pipelines and CI/CD agent triggers.

---

## 4. Shared Layouts & Navigation Architecture

StudioSprint utilizes 4 specialized layouts:

### 1. `TenantLayout.jsx` & `Sidebar.jsx`
* **File:** [`resources/js/Layouts/TenantLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/TenantLayout.jsx) wrapping [`resources/js/Components/Sidebar.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Sidebar.jsx).
* **Role-Adaptive Sidebar:**
  * **Manager View (`canManage === true`):** Surfaces *Overview*, *Tasks*, *Schedule*, *Team*, and *AI Workspace*.
  * **Member View (`canManage === false`):** Surfaces *My Work*, *Inbox*, and *My Tasks*.
* **Features:** Expandable / Collapsible (256px to 64px), live notification counters with pulse animations, dark/light theme switch, global search shortcut (`⌘K`), and embedded active project tree.

### 2. `ProjectLayout.jsx`
* **File:** [`resources/js/Layouts/ProjectLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/ProjectLayout.jsx).
* **Usage:** Dedicated workspace wrapper for [`Tenant/Projects/Show.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Pages/Tenant/Projects/Show.jsx).
* **Features:** Top breadcrumb navigation (`Projects > [Project Name]`), tab navigation bar (*Board*, *Epics*, *Sprints*, *CPA Timeline*, *AI Assistant*), and header action triggers ("New Task", "Decompose Sprint").

### 3. `AuthenticatedLayout.jsx`
* **File:** [`resources/js/Layouts/AuthenticatedLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/AuthenticatedLayout.jsx).
* **Usage:** Central Hub pages (Central Dashboard, Developer Passport Wizard, Workspace Fork, Profile Edit).
* **Features:** Central navigation bar, brand logo, profile dropdown, and logout trigger.

### 4. `GuestLayout.jsx`
* **File:** [`resources/js/Layouts/GuestLayout.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Layouts/GuestLayout.jsx).
* **Usage:** Authentication views (Login, Register, Password Reset, Email Verification).
* **Features:** Centered card with glassmorphism styling, branding logo, and background accent glows.

---

## 5. UI Modals & Interactive Overlays Quick Reference

| Modal Component | Triggered From | Functionality |
|---|---|---|
| [`HierarchicalDecompositionModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/ML/HierarchicalDecompositionModal.jsx) | Manager Dashboard (`Tenant/Dashboard.jsx`) | AI hierarchical Epic, Sprint, and Task generator with batch review. |
| [`BestFitModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/ML/BestFitModal.jsx) | Project Show (`Tenant/Projects/Show.jsx`), Task Cards | Computes GNN Link Prediction compatibility scores between developers and tasks. |
| [`ManualTaskModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Projects/ManualTaskModal.jsx) | Manager Dashboard, Tasks, Projects, Schedule | Modal for manual task creation with estimates, deadlines, and dependencies. |
| [`MemberTaskDetailModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Tasks/MemberTaskDetailModal.jsx) | Member Dashboard, Inbox, Tasks | Full task inspector with status updates, assignees, and critical path badges. |
| [`CreateProjectModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Projects/CreateProjectModal.jsx) | Projects Index, Manager Dashboard | Form to create a new project workspace. |
| [`CreateStudioModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Hub/CreateStudioModal.jsx) | Central Hub Dashboard (`Dashboard.jsx`) | Form to provision a new tenant studio. |
| [`JoinStudioModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Hub/JoinStudioModal.jsx) | Central Hub Dashboard (`Dashboard.jsx`) | Form to enter 8-character invitation code to join existing studios. |
| [`TeamMemberProfileModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Team/TeamMemberProfileModal.jsx) | Team Directory (`Tenant/Team/Index.jsx`) | Member passport inspector displaying skills proficiency matrix and workload. |
| [`CpaTaskAiModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/CpaAiSynthesizer.jsx) | Overview, Project Show CPA view | AI synthesis explaining critical path bottlenecks and recommended mitigations. |
| [`ManageAssignmentModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Projects/ManageAssignmentModal.jsx) | Project Show (`Tenant/Projects/Show.jsx`) | Fast developer reassignment picker. |
| [`UpdateTaskStatusModal.jsx`](file:///d:/xampp_latest/htdocs/thesis1/indie-studio-saas/resources/js/Components/Tenant/Projects/UpdateTaskStatusModal.jsx) | Project Show (`Tenant/Projects/Show.jsx`) | Single-click status transition selector (*To Do*, *In Progress*, *Review*, *Done*, *Stuck*). |
