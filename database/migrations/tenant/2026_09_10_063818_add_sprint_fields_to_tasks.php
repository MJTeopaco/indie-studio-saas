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
            $table->string('sprint_status')->nullable()->default('ready_to_start')->after('status');
            $table->string('sprint_priority')->nullable()->default('medium')->after('sprint_status');
            $table->integer('actual_story_points')->nullable()->after('story_points');
            $table->string('github_link')->nullable()->after('actual_story_points');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['sprint_status', 'sprint_priority', 'actual_story_points', 'github_link']);
        });
    }
};
