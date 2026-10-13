# StudioSprint: System User Roles & Respondent Matrix for Data Gathering

This document strictly details the exact user roles, professional positions, system access levels, and studio membership tiers **asked and captured by the application** during user registration, onboarding (`Wizard.jsx`), and studio management.

---

## 📋 Table of Contents
1. [Overview of Application-Captured User Roles](#1-overview-of-application-captured-user-roles)
2. [Category 1: Onboarding Professional Positions (Developer Passport)](#2-category-1-onboarding-professional-positions-developer-passport)
3. [Category 2: Application System Roles (Platform Authentication)](#3-category-2-application-system-roles-platform-authentication)
4. [Category 3: Studio Membership Roles (Workspace Level)](#4-category-3-studio-membership-roles-workspace-level)
5. [Category 4: Functional Department Classifications](#5-category-4-functional-department-classifications)
6. [Data Gathering Respondent Mapping & Sample Matrix](#6-data-gathering-respondent-mapping--sample-matrix)

---

## 1. Overview of Application-Captured User Roles

When users interact with **StudioSprint**, the platform explicitly asks for and records their roles across three operational tiers:

```
┌─────────────────────────────────────────────────────────────────┐
│              1. Application System Role (users.role)             │
│                 ['programmer' (Default), 'admin']               │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────┴────────────────────────────────┐
│           2. Studio Membership Role (studio_members.role)       │
│                 ['owner', 'member']                             │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────┴────────────────────────────────┐
│      3. Primary Professional Position (wizard.position_id)      │
│                 [23 Predefined Industry Positions]              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Category 1: Onboarding Professional Positions (Developer Passport)

During Step 1 of the Developer Passport Setup (`Wizard.jsx`), users are explicitly asked to select their **Primary Role** from the system’s controlled `positions` dictionary. These roles are grouped into five domain clusters:

### 🛠️ A. Core Software & Product Development
1. **Full Stack Developer**: End-to-end web & SaaS system builder.
2. **Backend Developer**: Server-side logic, API, and database architect.
3. **Frontend Developer**: React, InertiaJS, and client UI engineer.
4. **Mobile Developer**: iOS, Android, and cross-platform (Flutter/React Native) engineer.
5. **Game Developer**: Gameplay programmer, physics, and netcode specialist (Unity/Unreal/Godot).
6. **Product Engineer**: Product-focused developer bridging feature specs and code execution.
7. **Product Design Engineer**: Specialist connecting design systems with code implementation.

### 🧠 B. AI, ML & Data Engineering
8. **AI / ML Engineer**: Machine learning model builder (GNN, PyTorch, Scikit-Learn).
9. **Data Engineer**: Data pipeline, ETL, and database infrastructure specialist.
10. **Data Scientist**: Predictive modeling and statistical analyst.
11. **Research Scientist**: Advanced algorithm researcher.
12. **Research Analyst**: Technical reviewer evaluating benchmarking metrics and viability.

### ⚡ C. Infrastructure, DevOps & Security
13. **DevOps Engineer**: Cloud deployment (AWS/GCP), Docker, and CI/CD engineer.
14. **DevSecOps**: Continuous security and infrastructure hardening engineer.
15. **MLOps Engineer**: ML model deployment and pipeline monitoring specialist.
16. **QA Automation Engineer**: Automated testing, integration, and quality assurance lead.

### 🔌 D. Hardware & Embedded Systems
17. **Hardware / Embedded Engineer**: Microcontroller, IoT, and firmware developer.
18. **Hardware-in-the-Loop (HIL) Engineer**: Simulation and automated testing engineer for physical hardware.

### 🎯 E. Product, Strategy & Architecture
19. **Technical Product Manager**: Product roadmap and sprint specification owner.
20. **Project Manager**: Critical path, task breakdown, and schedule manager.
21. **Business Analyst**: Requirements gathering and domain specification analyst.
22. **Solutions Architect**: High-level software and cloud architecture designer.
23. **AI Solutions Architect**: Specialized architect for AI/LLM orchestration layers.

---

## 3. Category 2: Application System Roles (Platform Authentication)

Defined in the central database (`users.role` with `chk_users_role` constraint):

| System Role | Code Identifier | Description in Platform | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Programmer / Developer** | `programmer` | Default persona assigned upon user registration. | Fills Developer Passport, joins studio workspaces, views assigned tasks, and uses AI assistant features. |
| **System Administrator** | `admin` | Platform-level administrative persona. | Manages global developer pools, system seeders, user accounts, and platform health. |

---

## 4. Category 3: Studio Membership Roles (Workspace Level)

Defined in studio tenant membership (`studio_members.role`):

| Studio Role | Code Identifier | Description in Platform | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Studio Owner** | `owner` | User who creates and owns a studio workspace tenant. | Invites members, initializes projects, launches AI Sprint Decompositions, and manages team settings. |
| **Studio Member** | `member` | Collaborator invited into a studio workspace via 8-character invite code. | Views project Kanban boards, updates assigned task statuses, and tracks timeline capacity. |

---

## 5. Category 4: Functional Department Classifications

The application automatically maps user positions into four core departments on the Team Capacity Workspace (`Team/Index.jsx`):

```
                       ┌───────────────────────────────────┐
                       │   Application Department Mapping  │
                       └─────────────────┬─────────────────┘
                                         │
     ┌──────────────────┬────────────────┴────────────────┬──────────────────┐
     ▼                  ▼                                 ▼                  ▼
┌───────────────┐  ┌───────────────┐                ┌───────────────┐  ┌───────────────┐
│  Engineering  │  │    Product    │                │    Design     │  │      QA       │
└───────────────┘  └───────────────┘                └───────────────┘  └───────────────┘
  • Developers       • PMs & Tech PMs                 • UI/UX Designers  • QA Automation
  • DevOps / ML      • Business Analysts              • Product Designers• Quality Testers
  • Architects       • Strategy Leads                 • Artists & Graphic
```

1. **Engineering Department**: Full Stack, Backend, Frontend, Mobile, Game, AI/ML, DevOps, MLOps, Embedded, and Solutions Architects.
2. **Product Department**: Project Managers, Technical PMs, Business Analysts, and AI Solutions Architects.
3. **Design Department**: Product Design Engineers, UI/UX Designers, and Graphics Leads.
4. **QA Department**: QA Automation Engineers and Quality Testers.

---

## 6. Data Gathering Respondent Mapping & Sample Matrix

For your thesis data gathering, respondents should be sampled directly according to these application-asked roles:

| Respondent Category | Application Role / Position | Target Features for Testing | Recommended Sample Size ($N$) |
| :--- | :--- | :--- | :--- |
| **Studio Owners / Managers** | `studio_members.role = 'owner'` | Studio Creation, Member Invitation, Project Initialization | 10 – 15 |
| **Project Managers & PM Leads** | Position: `Project Manager`, `Technical Product Manager` | AI Sprint Decomposition, CPA Gantt Timeline, Schedule Breach Alerts | 15 – 20 |
| **Engineering Leads & Architects** | Position: `Solutions Architect`, `Backend Developer`, `AI / ML Engineer` | GNN Match Fit Scoring, Skill Matrix (96 skills), Capacity Warning Alerts | 15 – 20 |
| **Core Software Developers** | Position: `Full Stack`, `Frontend`, `Mobile`, `Game Developer` | Developer Passport (`Wizard.jsx`), Kanban Task Board, Workload Cards | 25 – 35 |
| **Specialized & QA Engineers** | Position: `DevOps`, `QA Automation`, `Embedded / HIL Engineer` | Skill Matrix Granularity, Resource Booking Protection, Workload Balancer | 10 – 15 |
| **Business & Product Analysts** | Position: `Business Analyst`, `Research Analyst` | Macro/Micro Domain Mapping, Requirements Extraction | 5 – 10 |
| **System Administrators** | `users.role = 'admin'` | Global User Hub, Multi-Tenant Database Isolation | 3 – 5 |
| **Total Sample** | **All Application Roles** | **Complete System Evaluation** | **68 – 97 respondents** |

---

*Document generated based strictly on application-defined user roles and positions in StudioSprint.*
