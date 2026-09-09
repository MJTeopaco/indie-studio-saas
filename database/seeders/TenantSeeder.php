<?php

namespace Database\Seeders;

use App\Models\Tenant\Project;
use App\Services\MLEngineService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * TenantSeeder
 * ============================================================================
 * Seeds one demo project with 15 tasks into the current tenant database.
 * Run via: php artisan tenants:run "db:seed" --option="class=TenantSeeder"
 *
 * DAG topology (designed for hand-verifiable CPA):
 *
 *   T1(8h) ──► T4(4h)  ──► T7(12h) ──► T10(8h) ──► T13(4h)
 *           ╲► T5(16h) ──► T8(8h)  ──► T11(6h) ──╱
 *   T2(12h) ──► T6(8h) ──► T9(4h)  ──► T12(20h) ──► T14(8h) ──► T15(4h)
 *   T3(6h) ──────────────────────────────────────────────────────► T15(4h)
 *
 * Critical paths:
 *   T2→T6→T9→T12→T14→T15 = 12+8+4+20+8+4 = 56h  ← LONGEST (critical)
 *   T1→T5→T8→T11→T13     = 8+16+8+6+4   = 42h
 *   T1→T4→T7→T10→T13     = 8+4+12+8+4   = 36h
 *
 * 8 synthetic employee IDs (100–107) are used for assignments.
 * These are cross-tenant user IDs and do NOT reference the tenant users table
 * (assignments.employee_user_id has no FK constraint by design).
 * ============================================================================
 */
class TenantSeeder extends Seeder
{
    /**
     * Synthetic cross-tenant employee user IDs for seeding.
     * Range chosen far above 0 to avoid collisions with real central users.
     */
    private const EMPLOYEE_IDS = [101, 102, 103, 104, 105, 106, 107, 108];

    /**
     * Pre-defined task templates to produce a deterministic, hand-verifiable DAG.
     *
     * @var array<int, array<string, mixed>>
     */
    private const TASK_TEMPLATES = [
        // T1 — no predecessors
        1 => ['title' => 'Project Kickoff & Architecture Design',     'hours' => 8,  'position' => 'Solutions Architect',    'difficulty' => 'Hard',   'priority' => 'Critical', 'classification' => 'Research', 'epic' => 1, 'sprint' => 1],
        // T2 — no predecessors
        2 => ['title' => 'Database Schema Design & Migrations',       'hours' => 12, 'position' => 'Backend Developer',      'difficulty' => 'Medium', 'priority' => 'High',     'classification' => 'Feature',  'epic' => 1, 'sprint' => 1],
        // T3 — no predecessors
        3 => ['title' => 'CI/CD Pipeline Setup',                      'hours' => 6,  'position' => 'DevOps Engineer',        'difficulty' => 'Medium', 'priority' => 'Medium',   'classification' => 'DevOps',   'epic' => 3, 'sprint' => 1],
        // T4 — depends on T1
        4 => ['title' => 'Core API Endpoint Scaffolding',             'hours' => 4,  'position' => 'Backend Developer',      'difficulty' => 'Easy',   'priority' => 'High',     'classification' => 'Feature',  'epic' => 1, 'sprint' => 2],
        // T5 — depends on T1
        5 => ['title' => 'Authentication & Authorization Module',     'hours' => 16, 'position' => 'Backend Developer',      'difficulty' => 'Hard',   'priority' => 'Critical', 'classification' => 'Feature',  'epic' => 2, 'sprint' => 2],
        // T6 — depends on T2
        6 => ['title' => 'ORM Models & Repository Layer',             'hours' => 8,  'position' => 'Backend Developer',      'difficulty' => 'Medium', 'priority' => 'High',     'classification' => 'Feature',  'epic' => 1, 'sprint' => 2],
        // T7 — depends on T4
        7 => ['title' => 'Frontend Component Library Setup',          'hours' => 12, 'position' => 'Frontend Developer',     'difficulty' => 'Medium', 'priority' => 'Medium',   'classification' => 'Feature',  'epic' => 2, 'sprint' => 2],
        // T8 — depends on T5
        8 => ['title' => 'User Dashboard UI Implementation',          'hours' => 8,  'position' => 'Frontend Developer',     'difficulty' => 'Medium', 'priority' => 'High',     'classification' => 'Feature',  'epic' => 2, 'sprint' => 2],
        // T9 — depends on T6
        9 => ['title' => 'Business Logic & Service Layer',            'hours' => 4,  'position' => 'Backend Developer',      'difficulty' => 'Easy',   'priority' => 'High',     'classification' => 'Feature',  'epic' => 1, 'sprint' => 3],
        // T10 — depends on T7
        10 => ['title' => 'UI Accessibility & Responsive Design Pass', 'hours' => 8,  'position' => 'Frontend Developer',     'difficulty' => 'Medium', 'priority' => 'Medium',   'classification' => 'Feature',  'epic' => 2, 'sprint' => 3],
        // T11 — depends on T8
        11 => ['title' => 'API Integration & Data Binding (Frontend)', 'hours' => 6,  'position' => 'Full Stack Developer',   'difficulty' => 'Medium', 'priority' => 'High',     'classification' => 'Feature',  'epic' => 2, 'sprint' => 3],
        // T12 — depends on T9
        12 => ['title' => 'Payment Gateway Integration',               'hours' => 20, 'position' => 'Backend Developer',      'difficulty' => 'Hard',   'priority' => 'Critical', 'classification' => 'Feature',  'epic' => 1, 'sprint' => 3],
        // T13 — depends on T10, T11
        13 => ['title' => 'End-to-End & Regression Test Suite',       'hours' => 4,  'position' => 'QA Automation Engineer', 'difficulty' => 'Medium', 'priority' => 'High',     'classification' => 'Testing',  'epic' => 3, 'sprint' => 3],
        // T14 — depends on T12
        14 => ['title' => 'Security Audit & Penetration Test',         'hours' => 8,  'position' => 'DevSecOps',              'difficulty' => 'Hard',   'priority' => 'Critical', 'classification' => 'Research', 'epic' => 3, 'sprint' => 3],
        // T15 — depends on T13, T14, T3
        15 => ['title' => 'Production Deployment & Documentation',     'hours' => 4,  'position' => 'DevOps Engineer',        'difficulty' => 'Easy',   'priority' => 'High',     'classification' => 'DevOps',   'epic' => 3, 'sprint' => 3],
    ];

    /**
     * Dependency edges: task_number => [list of task_numbers it depends on].
     *
     * @var array<int, list<int>>
     */
    private const DEPENDENCIES = [
        4 => [1],
        5 => [1],
        6 => [2],
        7 => [4],
        8 => [5],
        9 => [6],
        10 => [7],
        11 => [8],
        12 => [9],
        13 => [10, 11],
        14 => [12],
        15 => [13, 14, 3],
    ];

    public function run(): void
    {
        // -------------------------------------------------------------------
        // 1. Create a demo project
        // -------------------------------------------------------------------
        $project = DB::table('projects')->insertGetId([
            'name' => 'StudioSprint Demo Project',
            'description' => 'A synthetic demo project seeded for GNN training and CPA testing. Contains 15 tasks with a realistic dependency DAG.',
            'status' => 'active',
            'start_date' => now()->subDays(14)->toDateString(),
            'target_end_date' => now()->addDays(46)->toDateString(),
            'sprint_length_days' => 14,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // -------------------------------------------------------------------
        // 1a. Create Epics
        // -------------------------------------------------------------------
        $tenantId = tenant('id') ?? 'default';
        $phases = DB::table('epic_phases')->where('tenant_id', $tenantId)->get()->keyBy('label');
        $priorities = DB::table('epic_priorities')->where('tenant_id', $tenantId)->get()->keyBy('label');

        $epic1 = DB::table('epics')->insertGetId([
            'project_id' => $project,
            'name' => 'Backend & Infrastructure Foundation',
            'description' => 'Core backend logic, DB schema, and infrastructure.',
            'phase_id' => $phases->get('Dev WIP')->id ?? null,
            'priority_id' => $priorities->get('Critical')->id ?? null,
            'color' => '#3b82f6',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $epic2 = DB::table('epics')->insertGetId([
            'project_id' => $project,
            'name' => 'Frontend & UI Implementation',
            'description' => 'User interfaces, accessibility, and client integrations.',
            'phase_id' => $phases->get('Design WIP')->id ?? null,
            'priority_id' => $priorities->get('Must Have')->id ?? null,
            'color' => '#a855f7',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $epic3 = DB::table('epics')->insertGetId([
            'project_id' => $project,
            'name' => 'Quality & Security Assurance',
            'description' => 'Testing, security audits, and production deployments.',
            'phase_id' => $phases->get('Backlog')->id ?? null,
            'priority_id' => $priorities->get('Must Have')->id ?? null,
            'color' => '#22c55e',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $epics = [1 => $epic1, 2 => $epic2, 3 => $epic3];

        // -------------------------------------------------------------------
        // 1b. Create Sprints
        // -------------------------------------------------------------------
        $sprint1 = DB::table('sprints')->insertGetId([
            'project_id' => $project,
            'name' => 'Sprint 1',
            'goal' => 'Set up foundation and CI/CD pipeline.',
            'start_date' => now()->subDays(14)->toDateString(),
            'end_date' => now()->toDateString(),
            'status' => 'completed',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $sprint2 = DB::table('sprints')->insertGetId([
            'project_id' => $project,
            'name' => 'Sprint 2',
            'goal' => 'Implement core auth and initial UI components.',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(14)->toDateString(),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $sprint3 = DB::table('sprints')->insertGetId([
            'project_id' => $project,
            'name' => 'Sprint 3',
            'goal' => 'Finalize UI, integrate payments, and perform QA.',
            'start_date' => now()->addDays(14)->toDateString(),
            'end_date' => now()->addDays(28)->toDateString(),
            'status' => 'planned',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $sprints = [1 => $sprint1, 2 => $sprint2, 3 => $sprint3];

        // -------------------------------------------------------------------
        // 2. Insert all tasks and track their real DB IDs
        // -------------------------------------------------------------------
        /** @var array<int, int> $taskNumberToId  template number → DB id */
        $taskNumberToId = [];

        $sprint1Points = 0;
        foreach (self::TASK_TEMPLATES as $taskNumber => $template) {
            $macroDomains = $this->buildMacroDomainVector($template['position']);
            $requiredSkills = $this->buildSkillsForPosition($template['position']);

            $isSprint1 = $template['sprint'] === 1;
            $status = $isSprint1 ? 'completed' : $this->statusForPriority($template['priority']);
            
            // Generate fibonacci closest to hours
            $points = $this->closestFibonacci($template['hours']);

            $id = DB::table('tasks')->insertGetId([
                'project_id' => $project,
                'epic_id' => $epics[$template['epic']],
                'sprint_id' => $sprints[$template['sprint']],
                'title' => $template['title'],
                'description' => 'Seeded task #'.$taskNumber.' — '.$template['title'].'. This task is part of the CPA validation dataset.',
                'task_classification' => $template['classification'],
                'required_position' => $template['position'],
                'minimum_experience_years' => $this->experienceForDifficulty($template['difficulty']),
                'task_difficulty' => $template['difficulty'],
                'priority' => $template['priority'],
                'estimated_hours' => $template['hours'],
                'story_points' => $points,
                'story_points_locked' => $isSprint1,
                'days_until_deadline' => (int) round($template['hours'] * 1.5),
                'target_macro_domains' => json_encode($macroDomains),
                'required_skills' => json_encode($requiredSkills),
                'assigned_user_id' => null,
                'status' => $status,
                'created_at' => now()->subDays(14),
                'updated_at' => $isSprint1 ? now()->subDays(2) : now(), // Inside sprint 1
            ]);

            if ($isSprint1) {
                $sprint1Points += $points;
            }

            $taskNumberToId[$taskNumber] = $id;
        }

        // -------------------------------------------------------------------
        // 3. Insert dependency edges using real DB IDs
        // -------------------------------------------------------------------
        $dependencyRows = [];
        foreach (self::DEPENDENCIES as $child => $parents) {
            foreach ($parents as $parent) {
                $dependencyRows[] = [
                    'task_id' => $taskNumberToId[$child],
                    'depends_on_task_id' => $taskNumberToId[$parent],
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        DB::table('task_dependencies')->insert($dependencyRows);

        // -------------------------------------------------------------------
        // 4. Insert assignments — one per task, with synthetic match_fit_scores.
        //    Mix of manual, gnn, and cold_start_baseline sources.
        //    Employee IDs use actual members from the central database if available.
        // -------------------------------------------------------------------
        $actualMembers = DB::connection(config('tenancy.database.central_connection', 'central'))
            ->table('studio_members')
            ->where('studio_id', tenant('id'))
            ->where('role', 'member')
            ->pluck('user_id')
            ->toArray();

        $employeePool = ! empty($actualMembers) ? $actualMembers : self::EMPLOYEE_IDS;

        // Also attach them as project members so the project shows active members
        $projectMembers = [];
        foreach ($employeePool as $empId) {
            $projectMembers[] = [
                'project_id' => $project,
                'user_id' => $empId,
                'project_role' => 'developer',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        if (! empty($projectMembers)) {
            DB::table('project_members')->insert($projectMembers);
        }

        $assignmentRows = [];
        $sources = ['manual', 'gnn', 'cold_start_baseline'];

        foreach ($taskNumberToId as $taskNumber => $taskId) {
            // Round-robin employee assignment
            $employeeId = $employeePool[($taskNumber - 1) % count($employeePool)];
            $source = $sources[$taskNumber % 3];
            $matchScore = $this->matchScoreForSource($source);

            $assignmentRows[] = [
                'task_id' => $taskId,
                'employee_user_id' => $employeeId,
                'match_fit_score' => $matchScore,
                'assigned_by' => $source,
                'match_source' => $source,
                'status' => 'active',
                'assigned_at' => now()->subMinutes(rand(0, 1440)),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('assignments')->insert($assignmentRows);

        // -------------------------------------------------------------------
        // 5. Seed Team Velocity for Sprint 1 (Burndown Chart)
        // -------------------------------------------------------------------
        DB::table('team_velocity')->insert([
            'team_id' => $project,
            'sprint_id' => $sprint1,
            'points_committed' => $sprint1Points,
            'points_completed' => $sprint1Points,
            'computed_at' => now()->subDays(2), // Same as task updated_at
            'created_at' => now()->subDays(2),
            'updated_at' => now()->subDays(2),
        ]);

        $this->command->info('TenantSeeder: seeded 1 project, '.count($taskNumberToId).' tasks, '.count($dependencyRows).' dependencies, '.count($assignmentRows).' assignments.');

        try {
            $projectModel = Project::find($project);
            if ($projectModel) {
                app(MLEngineService::class)->recomputeProjectSchedule($projectModel);
                $this->command->info('TenantSeeder: CPA schedule recomputed successfully.');
            }
        } catch (\Exception $e) {
            $this->command->warn('TenantSeeder: CPA calculation failed during seeding: '.$e->getMessage());
        }
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private function closestFibonacci(int $number): int
    {
        $fib = [1, 2, 3, 5, 8, 13, 21, 34];
        $closest = 1;
        $minDiff = abs($number - 1);
        foreach ($fib as $f) {
            $diff = abs($number - $f);
            if ($diff < $minDiff) {
                $minDiff = $diff;
                $closest = $f;
            }
        }
        return $closest;
    }

    /**
     * Build an 8-element multi-hot domain vector based on position family.
     *
     * Domain index mapping (0-based, mirrors GNN training):
     *   0 = Web & API Development   1 = Mobile Development
     *   2 = Data Science & AI       3 = Cloud & DevOps
     *   4 = Cybersecurity           5 = Game Development
     *   6 = Research & Analysis     7 = QA & Testing
     *
     * @return list<int>
     */
    private function buildMacroDomainVector(string $position): array
    {
        $vector = [0, 0, 0, 0, 0, 0, 0, 0];

        $map = [
            'Backend Developer' => [0],
            'Frontend Developer' => [0],
            'Full Stack Developer' => [0, 1],
            'Mobile Developer' => [1],
            'Data Scientist' => [2],
            'AI / ML Engineer' => [2],
            'Data Engineer' => [2],
            'MLOps Engineer' => [2, 3],
            'DevOps Engineer' => [3],
            'DevSecOps' => [3, 4],
            'Solutions Architect' => [0, 3],
            'Technical Product Manager' => [0, 6],
            'Business Analyst' => [6],
            'Game Developer' => [5],
            'QA Automation Engineer' => [7],
            'Research Scientist' => [6, 2],
            'Research Analyst' => [6],
        ];

        foreach ($map[$position] ?? [0] as $index) {
            $vector[$index] = 1;
        }

        return $vector;
    }

    /**
     * Build a realistic required_skills array for a given position.
     *
     * @return list<array{name: string, level: int}>
     */
    private function buildSkillsForPosition(string $position): array
    {
        $skillMap = [
            'Backend Developer' => [['PHP', 4], ['Laravel', 4], ['PostgreSQL', 3], ['REST API', 4]],
            'Frontend Developer' => [['React', 4], ['TypeScript', 3], ['CSS', 3], ['Tailwind CSS', 3]],
            'Full Stack Developer' => [['PHP', 3], ['React', 3], ['PostgreSQL', 3]],
            'Mobile Developer' => [['React Native', 4], ['TypeScript', 3]],
            'Data Scientist' => [['Python', 4], ['scikit-learn', 3], ['Pandas', 4]],
            'AI / ML Engineer' => [['Python', 4], ['PyTorch', 4], ['LangChain', 3]],
            'Data Engineer' => [['Python', 4], ['PostgreSQL', 3], ['dbt', 3]],
            'MLOps Engineer' => [['Python', 3], ['Docker', 4], ['Kubernetes', 3]],
            'DevOps Engineer' => [['Docker', 4], ['Kubernetes', 4], ['GitHub Actions', 4]],
            'DevSecOps' => [['Docker', 3], ['Kubernetes', 3], ['SAST', 4]],
            'Solutions Architect' => [['AWS', 4], ['System Design', 5], ['Docker', 3]],
            'Technical Product Manager' => [['Agile', 4], ['Jira', 3]],
            'Business Analyst' => [['Agile', 3], ['SQL', 3]],
            'Game Developer' => [['Unity', 4], ['C#', 4]],
            'QA Automation Engineer' => [['Playwright', 4], ['PHPUnit', 3], ['Postman', 3]],
            'Research Scientist' => [['Python', 4], ['NumPy', 3], ['LaTeX', 3]],
            'Research Analyst' => [['SQL', 3], ['Python', 3]],
        ];

        $skills = $skillMap[$position] ?? [['PHP', 3]];

        return array_map(fn (array $s) => ['name' => $s[0], 'level' => $s[1]], $skills);
    }

    private function experienceForDifficulty(string $difficulty): float
    {
        return match ($difficulty) {
            'Easy' => 0.5,
            'Medium' => 2.0,
            'Hard' => 4.0,
            default => 1.0,
        };
    }

    private function statusForPriority(string $priority): string
    {
        return match ($priority) {
            'Critical' => 'in_progress',
            'High' => 'in_progress',
            default => 'todo',
        };
    }

    /**
     * Generate a realistic match_fit_score based on assignment source.
     * GNN scores cluster around 0.7–0.95; cold-start around 0.5–0.75; manual = null (human chose).
     */
    private function matchScoreForSource(string $source): ?float
    {
        return match ($source) {
            'gnn' => round(0.70 + (mt_rand(0, 2500) / 10000), 4),
            'cold_start_baseline' => round(0.50 + (mt_rand(0, 2500) / 10000), 4),
            'manual' => null,
            default => null,
        };
    }
}
