# Story Points (SP) in Indie Studio SaaS

This document details how Story Points (SP) are integrated, utilized, and calculated within the Indie Studio SaaS platform, emphasizing their critical role in project estimation, schedule derivation, and team velocity tracking.

## Overview

In this system, a **Story Point** is a relative measure of effort, complexity, and risk associated with completing a specific `Task`. Rather than purely tracking time, Story Points allow teams to estimate work abstractly. However, the system intelligently bridges the gap between abstract story points and concrete time constraints by deriving project schedules (via PERT estimations) and team velocities based on historical story point completion.

---

## Task Properties Related to Story Points

The `Task` model (`app/Models/Tenant/Task.php`) tracks several properties related to story points:

*   **`story_points`**: The final, agreed-upon estimate for the task.
*   **`story_points_locked`**: A boolean flag indicating whether the estimation phase for this task is complete. If `false`, the task is considered a "Pending Estimate" and appears in estimation queues.
*   **`story_points_ai_suggested`**: An AI-generated suggestion for story points based on initial task parameters (like estimated hours).
*   **`actual_story_points`**: The actual effort expended, recorded *only* when a task is marked as `done` or `completed`. This allows tracking estimation accuracy (planned vs. completed).

---

## The Estimation Process

### 1. AI-Assisted Initial Suggestion
When tasks are bulk-imported via AI workflows (like Sprint Decomposition or Hierarchical Decomposition in `TenantProjectController`), the system automatically suggests initial story points based on the AI's `estimated_hours`:

*   $\le 4$ hours $\rightarrow$ 1 SP
*   $\le 8$ hours $\rightarrow$ 2 SP
*   $\le 16$ hours $\rightarrow$ 3 SP
*   $\le 32$ hours $\rightarrow$ 5 SP
*   $\le 64$ hours $\rightarrow$ 8 SP
*   $> 64$ hours $\rightarrow$ 13 SP

This value is stored in `story_points_ai_suggested` as a baseline reference for the team.

### 2. Team Estimation & Locking
Tasks begin with `story_points_locked = false`. They appear in the Dashboard and Estimation review queues. Managers and assigned estimators review the tasks, optionally considering the AI suggestion, and lock in the final `story_points`. Only managers are permitted to modify estimated story points directly.

### 3. Completion and Actuals
When a task is transitioned to a `done` status, the assignee or manager can input the `actual_story_points`. The system enforces that `actual_story_points` cannot be set until the task's sprint status is `done`. If not provided, it defaults to the originally estimated `story_points`.

---

## Importance and System Impact

Story Points are not just labels; they drive core scheduling and reporting mechanics in the platform.

### 1. Team Velocity Calculation
The `EstimationService` computes `TeamVelocity` for active projects.
It tracks the sum of `story_points` for completed, locked tasks within a `Sprint` window. 

```php
// From EstimationService.php
$completedPoints = Task::where('project_id', $project->id)
    ->where('status', 'completed')
    ->where('story_points_locked', true)
    ->whereBetween('updated_at', [$sprintStart, $sprintEnd])
    ->sum('story_points');
```

This historical velocity data allows the system to understand how quickly a specific team works, automatically adjusting future schedules based on past performance rather than arbitrary guesses.

### 2. Automated PERT Schedule Derivation
The system uses story points to automatically generate PERT (Program Evaluation and Review Technique) estimates: **Optimistic**, **Likely**, and **Pessimistic** durations.

Instead of asking developers for exact hours, the system calculates `hoursPerPoint` dynamically:
*   It averages the historical `TeamVelocity` (points completed per sprint).
*   If no velocity exists, it defaults to a standard 10 points per 2-week sprint (80 working hours), establishing a baseline of **1 SP = 8 hours**.

It then derives the durations for scheduling algorithms (like Critical Path Analysis):
*   **Likely Duration**: `story_points * hoursPerPoint`
*   **Optimistic Duration**: $80\%$ of Likely Duration
*   **Pessimistic Duration**: $150\%$ of Likely Duration

### 3. Sprint Planning and Reporting
Story Points form the foundation of sprint breakdowns and project reports. The `TenantReportController` generates metrics comparing `planned_story_points` against `completed_story_points` (using actuals where available).

This provides clear visibility into:
*   Sprint commitment accuracy.
*   Scope creep and estimation errors (if `actual_story_points` frequently exceeds planned `story_points`).
*   Overall project health and burndown rates.

## The Hybrid Approach: Combining AI, Agile, and Traditional Scheduling

To understand the core innovation of how this system handles project planning, it is helpful to look at it from two perspectives: a simple, high-level view (Layman's Terms) and a deep dive into the code (Technical Details).

### Layman's Terms (The "Easy to Understand" Explanation)
Imagine you are building a house. 
*   **The AI Anchor:** Instead of forcing your builders to guess how long everything will take from scratch, you have an AI assistant that looks at the blueprints and says, "Based on past houses, laying these bricks usually feels like a size 5 task." This gives the team a quick starting point so they don't waste hours arguing over a blank slate. They just review the AI's guess, agree on it, and lock it in.
*   **The Hybrid Schedule:** Builders love working flexibly (Agile), but the bank funding the house wants a strict, mathematical deadline (Traditional Scheduling). Our system bridges this gap. It takes the abstract "size 5 task" and looks at how fast the team usually works (their "Velocity"). If the team usually finishes 10 sizes worth of work a week, the system mathematically converts that "size 5 task" into an exact number of hours. It then calculates a best-case, worst-case, and most-likely scenario (PERT) to give the bank the concrete schedule they need without taking away the builders' flexibility.

### Technical Details (How the Code Works)
From a technical implementation standpoint, the hybrid approach operates in a sequential pipeline bridging AI inference, Agile metrics, and deterministic scheduling logic:

1.  **AI Anchoring (`story_points_ai_suggested`):** During task ingestion (e.g., in `TenantProjectController`), the AI evaluates the natural language task and estimates raw hours. The backend uses a mapping algorithm to convert these hours into Fibonacci-style Story Points (e.g., $\le$ 32 hours $\rightarrow$ 5 SP). This value populates the `story_points_ai_suggested` database column, providing a computationally derived baseline.
2.  **Human Validation (`story_points_locked`):** The team reviews the AI suggestion in the UI. Once consensus is reached, the manager saves the final `story_points` integer and flips the `story_points_locked` boolean to `true`. This guarantees human oversight over the AI baseline.
3.  **Velocity Calculation:** As sprints conclude, the `EstimationService` queries the database for all tasks where `status = 'completed'` and `story_points_locked = true` within the sprint window. It sums the `story_points` to calculate the team's historical `TeamVelocity` (points completed per sprint).
4.  **PERT Duration Derivation:** To satisfy traditional Critical Path Analysis (CPA) algorithms, Agile points must become hours. The `EstimationService` divides standard working hours (e.g., 80 hours/sprint) by the average `TeamVelocity` to determine `hoursPerPoint`. 
5.  **Deterministic Scheduling:** Finally, the system sets the task's `duration_likely` (Points $\times$ hoursPerPoint). It then mathematically applies variance factors to generate `duration_optimistic` (Likely $\times$ 0.8) and `duration_pessimistic` (Likely $\times$ 1.5). These hard time values are fed into the system's PERT scheduling algorithms, satisfying executive governance requirements.

## Summary
In Indie Studio SaaS, Story Points act as the critical bridge between agile effort estimation and concrete project scheduling. By tracking velocity and automating PERT calculations based on points, the system reduces the cognitive load of estimation while increasing the accuracy of project timelines and critical path analyses.
