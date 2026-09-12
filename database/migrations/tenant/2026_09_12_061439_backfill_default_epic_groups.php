<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Tenant\Project;
use App\Models\Tenant\EpicGroup;
use App\Models\Tenant\Epic;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $projects = Project::all();

        foreach ($projects as $project) {
            $group = EpicGroup::firstOrCreate([
                'project_id' => $project->id,
                'name' => 'Epics Backlog',
            ], [
                'goal' => 'Uncommitted epics pending roadmap assignment',
                'is_default' => true,
                'display_order' => 999999, // Rendered last
            ]);

            // Assign all existing epics without a group to this default group
            Epic::where('project_id', $project->id)
                ->whereNull('epic_group_id')
                ->update(['epic_group_id' => $group->id]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No down migration as we don't want to accidentally delete epics or group assignment 
        // without knowing exactly if it's safe.
    }
};
