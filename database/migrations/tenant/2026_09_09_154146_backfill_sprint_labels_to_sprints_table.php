<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Assumption: sprint labels have the format "Sprint {N}" where N is a 1-based integer.
     * team_id on team_velocity equals project_id on projects.
     * The project's start_date is used to reconstruct absolute dates. 
     * If a project has no start_date, created_at is used as the fallback.
     */
    public function up(): void
    {
        // 1. Reconstruct sprints from team_velocity
        $velocityRows = DB::table('team_velocity')->get();
        $projects = DB::table('projects')->get()->keyBy('id');

        foreach ($velocityRows as $row) {
            $project = $projects->get($row->team_id);
            if (!$project || empty($row->sprint_label)) {
                continue;
            }

            // Extract Sprint N
            $label = $row->sprint_label;
            $sprintNum = 1;
            if (preg_match('/Sprint\s+(\d+)/i', $label, $matches)) {
                $sprintNum = (int)$matches[1];
            }

            // Calculate start and end date based on EstimationService logic
            $sprintLength = $project->sprint_length_days ?? 14;
            $startDate = $project->start_date ?? $project->created_at;
            
            // Ensure startDate is a Carbon instance
            if (is_string($startDate)) {
                $startDate = Carbon::parse($startDate);
            } elseif (!$startDate instanceof Carbon) {
                // If it's somehow not parsable, default to row created_at
                $startDate = Carbon::parse($row->created_at);
            }

            $sprintStart = $startDate->copy()->addDays(($sprintNum - 1) * $sprintLength);
            $sprintEnd = $sprintStart->copy()->addDays($sprintLength);

            // Create or get the sprint
            $sprintId = DB::table('sprints')->where('project_id', $project->id)->where('name', $label)->value('id');
            if (!$sprintId) {
                $sprintId = DB::table('sprints')->insertGetId([
                    'project_id' => $project->id,
                    'name' => $label,
                    'start_date' => $sprintStart->toDateString(),
                    'end_date' => $sprintEnd->toDateString(),
                    'status' => 'completed', // Historic sprints are completed
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Repoint team_velocity row
            DB::table('team_velocity')->where('id', $row->id)->update([
                'sprint_id' => $sprintId
            ]);
        }

        // 2. Drop the old sprint_label column now that data is migrated
        Schema::table('team_velocity', function (Blueprint $table) {
            $table->dropColumn('sprint_label');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // WARNING: Data loss on rollback. The sprint_label string column is gone.
        // Re-adding it empty.
        Schema::table('team_velocity', function (Blueprint $table) {
            $table->string('sprint_label')->nullable()->after('sprint_id');
        });

        // Best effort restore
        $velocityRows = DB::table('team_velocity')->whereNotNull('sprint_id')->get();
        foreach ($velocityRows as $row) {
            $sprintName = DB::table('sprints')->where('id', $row->sprint_id)->value('name');
            if ($sprintName) {
                DB::table('team_velocity')->where('id', $row->id)->update([
                    'sprint_label' => $sprintName
                ]);
            }
        }
    }
};
