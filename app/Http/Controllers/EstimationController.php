<?php

namespace App\Http\Controllers;

use App\Models\Tenant\Task;
use App\Models\Tenant\TaskEstimateSubmission;
use App\Models\User;
use App\Services\EstimationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EstimationController extends Controller
{
    private function authorizeManager()
    {
        $user = auth()->user();
        if ($user && $user->role === User::ROLE_ADMIN) {
            return;
        }

        $member = \DB::connection(config('tenancy.database.central_connection', 'central'))->table('studio_members')
            ->where('studio_id', tenant('id'))
            ->where('user_id', $user->id)
            ->first();

        $role = $member ? $member->role : 'member';

        if (!in_array($role, ['owner', 'leader', 'manager'])) {
            abort(403, 'Unauthorized action. Only studio managers can perform this task.');
        }
    }

    /**
     * Developer view: Queue of tasks needing their estimate.
     */
    public function pendingQueue(Request $request)
    {
        $user = auth()->user();
        
        // Find tasks that are not locked and where the user is an expected estimator.
        $tasks = Task::where('story_points_locked', false)
            ->where('needs_estimate_review', false)
            ->with('project')
            ->get()
            ->filter(function ($task) use ($user) {
                // If expected_estimators is null, fallback to checking assigned_user_id
                if (empty($task->expected_estimators)) {
                    return $task->assigned_user_id === $user->id;
                }
                return in_array($user->id, $task->expected_estimators);
            })
            ->map(function ($task) use ($user) {
                // Check if already submitted
                $hasSubmitted = TaskEstimateSubmission::where('task_id', $task->id)
                    ->where('developer_id', $user->id)
                    ->exists();
                    
                if ($hasSubmitted) return null;
                
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'project' => $task->project ? ['id' => $task->project->id, 'name' => $task->project->name] : null,
                    'story_points_ai_suggested' => $task->story_points_ai_suggested,
                ];
            })
            ->filter()
            ->values();

        return Inertia::render('Tenant/Estimates/PendingQueue', [
            'tasks' => $tasks,
        ]);
    }

    /**
     * Submit an estimate and trigger divergence check.
     */
    public function submitEstimate(Request $request, Task $task)
    {
        $user = auth()->user();
        
        $validated = $request->validate([
            'submitted_points' => 'required|integer|in:1,2,3,5,8,13',
        ]);

        if ($task->story_points_locked) {
            return response()->json(['status' => 'error', 'message' => 'Task is already locked.'], 400);
        }

        // Upsert submission
        TaskEstimateSubmission::updateOrCreate(
            ['task_id' => $task->id, 'developer_id' => $user->id],
            ['submitted_points' => $validated['submitted_points'], 'submitted_at' => now()]
        );

        $this->runDivergenceCheck($task);

        return response()->json(['status' => 'success']);
    }

    private function runDivergenceCheck(Task $task)
    {
        $expectedCount = empty($task->expected_estimators) ? 
            ($task->assigned_user_id ? 1 : 0) : 
            count($task->expected_estimators);

        if ($expectedCount === 0) return;

        $submissions = TaskEstimateSubmission::where('task_id', $task->id)->pluck('submitted_points')->toArray();
        
        // Wait until all expected estimators have submitted before auto-locking or diverging
        if (count($submissions) < $expectedCount) {
            return; 
        }

        $this->evaluateSubmissions($task, $submissions);
    }

    /**
     * Helper to evaluate submissions for divergence. 
     * Shared with the LockExpiredEstimates command.
     */
    public function evaluateSubmissions(Task $task, array $submissions)
    {
        if (empty($submissions)) {
            $task->update(['needs_estimate_review' => true]);
            return;
        }

        $fib = [1 => 0, 2 => 1, 3 => 2, 5 => 3, 8 => 4, 13 => 5];
        
        $indices = array_map(fn($p) => $fib[$p] ?? 0, $submissions);
        $maxIndex = max($indices);
        $minIndex = min($indices);

        if ($maxIndex - $minIndex > 1) {
            $task->update(['needs_estimate_review' => true]);
        } else {
            // Auto-lock with median or average
            sort($submissions);
            $median = $submissions[floor(count($submissions) / 2)];
            $task->update([
                'story_points' => $median,
                'story_points_locked' => true,
                'needs_estimate_review' => false,
            ]);
            
            app(EstimationService::class)->deriveDurationForTask($task);
        }
    }

    /**
     * Manager view: Queue of tasks needing review due to divergence or timeout.
     */
    public function reviewQueue(Request $request)
    {
        $this->authorizeManager();

        $tasks = Task::where('needs_estimate_review', true)
            ->where('story_points_locked', false)
            ->with(['project', 'estimateSubmissions'])
            ->get()
            ->map(function ($task) {
                // Get display names for submissions
                $submissions = $task->estimateSubmissions->map(function ($sub) {
                    $user = User::find($sub->developer_id);
                    return [
                        'developer_id' => $sub->developer_id,
                        'developer_name' => $user ? $user->name : 'Unknown',
                        'submitted_points' => $sub->submitted_points,
                    ];
                });

                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'project' => $task->project ? ['id' => $task->project->id, 'name' => $task->project->name] : null,
                    'story_points_ai_suggested' => $task->story_points_ai_suggested,
                    'submissions' => $submissions,
                ];
            });

        return Inertia::render('Tenant/Estimates/ReviewQueue', [
            'tasks' => $tasks,
        ]);
    }

    /**
     * Manager resolves a diverged estimate.
     */
    public function resolveEstimate(Request $request, Task $task)
    {
        $this->authorizeManager();

        $validated = $request->validate([
            'story_points' => 'required|integer|in:1,2,3,5,8,13',
            'estimate_review_note' => 'nullable|string|max:1000',
        ]);

        $task->update([
            'story_points' => $validated['story_points'],
            'story_points_locked' => true,
            'needs_estimate_review' => false,
            'estimate_review_note' => $validated['estimate_review_note'],
        ]);

        app(EstimationService::class)->deriveDurationForTask($task);

        return response()->json(['status' => 'success']);
    }
}
