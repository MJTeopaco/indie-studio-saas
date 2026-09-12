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
        Schema::table('epics', function (Blueprint $table) {
            $table->foreign('phase_id')->references('id')->on('epic_phases')->onDelete('restrict');
            $table->foreign('priority_id')->references('id')->on('epic_priorities')->onDelete('restrict');

            if (Schema::hasColumn('epics', 'status')) {
                $table->dropColumn('status');
            }
        });

        Schema::table('tasks', function (Blueprint $table) {
            // Index for faster withCount / withSum
            try {
                $table->index('epic_id');
            } catch (\Exception $e) {
                // Index might already exist
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['epic_id']);
        });

        Schema::table('epics', function (Blueprint $table) {
            $table->dropForeign(['phase_id']);
            $table->dropForeign(['priority_id']);

            if (!Schema::hasColumn('epics', 'status')) {
                $table->string('status')->default('open')->after('color');
            }
        });
    }
};
