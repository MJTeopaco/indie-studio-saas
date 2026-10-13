<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('tasks') && Schema::hasTable('assignments')) {
            $activeAssignments = DB::table('assignments')
                ->where('status', 'active')
                ->orderBy('assigned_at', 'asc')
                ->get(['task_id', 'employee_user_id']);

            foreach ($activeAssignments as $assignment) {
                DB::table('tasks')
                    ->where('id', $assignment->task_id)
                    ->whereNull('assigned_user_id')
                    ->update(['assigned_user_id' => $assignment->employee_user_id]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op
    }
};
