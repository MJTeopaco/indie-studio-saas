<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For all tasks where story_points IS NULL and estimated_hours IS NOT NULL: 
        // run the same hours->points lookup table already defined in Phase 1, 
        // write it to both story_points and story_points_ai_suggested, and set story_points_locked = true.
        
        $tasks = DB::table('tasks')
            ->whereNull('story_points')
            ->whereNotNull('estimated_hours')
            ->get();
            
        foreach ($tasks as $task) {
            $hours = (float) $task->estimated_hours;
            $points = 1;
            
            if ($hours <= 4) {
                $points = 1;
            } elseif ($hours <= 8) {
                $points = 2;
            } elseif ($hours <= 16) {
                $points = 3;
            } elseif ($hours <= 32) {
                $points = 5;
            } elseif ($hours <= 64) {
                $points = 8;
            } else {
                $points = 13;
            }
            
            DB::table('tasks')->where('id', $task->id)->update([
                'story_points' => $points,
                'story_points_ai_suggested' => $points,
                'story_points_locked' => true,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No down needed; fields will be dropped by the other migration if rolled back.
    }
};
