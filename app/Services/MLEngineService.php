<?php

namespace App\Services;

use App\Models\Tenant\Project;
use App\Models\Tenant\Task;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MLEngineService
{
    protected string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = config('services.mlengine.url', 'http://127.0.0.1:8001');
    }

    /**
     * Decompose a project description into a list of structured tasks.
     */
    public function decomposeProject(string $description): array
    {
        try {
            $response = Http::timeout(600)->post("{$this->baseUrl}/api/llm/decompose-project", [
                'description' => $description,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('ML Engine /decompose-project failed', ['status' => $response->status(), 'body' => $response->body()]);
        } catch (\Exception $e) {
            Log::error('ML Engine Connection Error: '.$e->getMessage());
        }

        return ['status' => 'error', 'tasks' => []];
    }

    /**
     * Get the best fit developers for a given task using the GNN.
     */
    public function getBestFit(array $taskData): array
    {
        try {
            // TaskData needs to match TaskInput model in FastAPI
            $response = Http::timeout(120)->post("{$this->baseUrl}/api/best-fit", $taskData);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('ML Engine /best-fit failed', ['status' => $response->status(), 'body' => $response->body()]);
        } catch (\Exception $e) {
            Log::error('ML Engine Connection Error: '.$e->getMessage());
        }

        return ['status' => 'error', 'results' => []];
    }

    /**
     * Compute the CPA schedule for a list of tasks.
     */
    public function computeSchedule(array $tasks, ?float $deadlineHours = null): array
    {
        try {
            $response = Http::timeout(60)->post("{$this->baseUrl}/api/schedule/compute", [
                'tasks' => $tasks,
                'deadline_hours' => $deadlineHours,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('ML Engine /schedule/compute failed', ['status' => $response->status(), 'body' => $response->body()]);
        } catch (\Exception $e) {
            Log::error('ML Engine Connection Error: '.$e->getMessage());
        }

        return ['status' => 'error', 'tasks' => [], 'critical_path_task_ids' => []];
    }

    /**
     * Compute and persist the CPA schedule for every task in a project.
     *
     * @return array<string, mixed>
     */
    public function recomputeProjectSchedule(Project $project): array
    {
        $tasks = $project->tasks()->get();

        if ($tasks->isEmpty()) {
            return ['status' => 'success', 'tasks' => [], 'critical_path_task_ids' => []];
        }

        $dependencies = DB::table('task_dependencies')
            ->whereIn('task_id', $tasks->pluck('id'))
            ->get()
            ->groupBy('task_id');

        $payload = $tasks->map(function (Task $task) use ($dependencies): array {
            return [
                'id' => $task->id,
                'estimated_hours' => (float) $task->estimated_hours,
                'depends_on' => $dependencies->get($task->id, collect())->pluck('depends_on_task_id')->all(),
            ];
        })->all();

        // Calculate project deadline in working hours based on start_date and target_end_date
        $deadlineHours = null;
        if ($project->start_date && $project->target_end_date) {
            try {
                $start = new \DateTime($project->start_date);
                $end = new \DateTime($project->target_end_date);
                $workdays = 0;
                // Count business days (Monday-Friday) between start and end date
                $temp = clone $start;
                while ($temp <= $end) {
                    if ((int)$temp->format('N') < 6) {
                        $workdays++;
                    }
                    $temp->modify('+1 day');
                }
                $deadlineHours = (float) ($workdays * 8.0);
            } catch (\Exception $e) {
                Log::error('CPA Deadline calculation failed: ' . $e->getMessage());
            }
        }

        $result = $this->computeSchedule($payload, $deadlineHours);

        if (($result['status'] ?? null) !== 'success') {
            return $result;
        }

        foreach ($result['tasks'] ?? [] as $computedTask) {
            Task::whereKey($computedTask['id'])->update([
                'es' => $computedTask['es'],
                'ef' => $computedTask['ef'],
                'ls' => $computedTask['ls'],
                'lf' => $computedTask['lf'],
                'total_float' => $computedTask['total_float'],
                'is_critical' => $computedTask['is_critical'],
                'schedule_computed_at' => now(),
            ]);
        }

        return $result;
    }

    /**
     * Synthesize an explanation for an assignment using GNN results and CPA schedule.
     */
    public function synthesizeAssignment(array $gnnResults, ?array $cpaSchedule = null): array
    {
        try {
            $response = Http::timeout(600)->post("{$this->baseUrl}/api/llm/synthesize-assignment", [
                'gnn_results' => $gnnResults,
                'cpa_schedule' => $cpaSchedule,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('ML Engine /synthesize-assignment failed', ['status' => $response->status(), 'body' => $response->body()]);
        } catch (\Exception $e) {
            Log::error('ML Engine Connection Error: '.$e->getMessage());
        }

        return ['status' => 'error', 'explanation' => ''];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function scanProjectRisks(array $payload): array
    {
        return $this->postToLlm('/api/llm/risk-scan', $payload, ['explanation' => 'Risk analysis is unavailable right now.']);
    }

    /**
     * @param  array<string, mixed>  $stats
     * @return array<string, mixed>
     */
    public function summarizeProject(array $stats): array
    {
        return $this->postToLlm('/api/llm/project-summary', ['stats' => $stats], ['summary' => 'Project summary is unavailable right now.']);
    }

    /**
     * @param  array<string, mixed>  $projectContext
     * @param  array<int, array<string, string>>  $history
     * @return array<string, mixed>
     */
    public function chatAboutProject(string $message, array $projectContext, array $history = []): array
    {
        return $this->postToLlm('/api/llm/chat', [
            'message' => $message,
            'project_context' => $projectContext,
            'conversation_history' => $history,
        ], ['reply' => 'The project assistant is unavailable right now.']);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<string, mixed>  $fallback
     * @return array<string, mixed>
     */
    private function postToLlm(string $path, array $payload, array $fallback): array
    {
        try {
            $response = Http::timeout(120)->post("{$this->baseUrl}{$path}", $payload);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error("ML Engine {$path} failed", ['status' => $response->status(), 'body' => $response->body()]);
        } catch (\Exception $e) {
            Log::error("ML Engine {$path} connection error: ".$e->getMessage());
        }

        return ['status' => 'error', ...$fallback];
    }
}
