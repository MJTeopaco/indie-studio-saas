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
            $table->unsignedBigInteger('epic_id')->nullable()->after('project_id');
            $table->unsignedBigInteger('sprint_id')->nullable()->after('epic_id');

            $table->foreign('epic_id')->references('id')->on('epics')->nullOnDelete();
            $table->foreign('sprint_id')->references('id')->on('sprints')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['epic_id']);
            $table->dropForeign(['sprint_id']);
            $table->dropColumn(['epic_id', 'sprint_id']);
        });
    }
};
