<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->unsignedTinyInteger('story_points')->nullable();
            $table->boolean('story_points_locked')->default(false);
            $table->unsignedTinyInteger('story_points_ai_suggested')->nullable();
            $table->boolean('needs_estimate_review')->default(false);
            $table->text('estimate_review_note')->nullable();
            
            // Expected estimators (central user IDs), snapshotted at task creation
            $table->json('expected_estimators')->nullable();

            // Duration triple for Phase 4 PERT
            $table->float('duration_optimistic')->nullable();
            $table->float('duration_likely')->nullable();
            $table->float('duration_pessimistic')->nullable();
        });
        
        // Add DB-level constraint for Fibonacci values if supported
        // Note: SQLite (often used in testing) doesn't fully support ADD CONSTRAINT in table modification
        // But for standard MySQL/PostgreSQL we could add it. To be safe across drivers, we will enforce it at the application level.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn([
                'story_points',
                'story_points_locked',
                'story_points_ai_suggested',
                'needs_estimate_review',
                'estimate_review_note',
                'expected_estimators',
                'duration_optimistic',
                'duration_likely',
                'duration_pessimistic',
            ]);
        });
    }
};
