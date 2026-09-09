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
        Schema::create('team_velocity', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('team_id'); // Mapping to project id for Phase 3 MVP
            $table->string('sprint_label'); // e.g. "2026-W37"
            
            $table->unsignedInteger('points_committed')->default(0);
            $table->unsignedInteger('points_completed')->default(0);
            
            $table->timestamp('computed_at')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('team_velocity');
    }
};
