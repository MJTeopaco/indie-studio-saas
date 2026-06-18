<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This pivot table resolves the Many-to-Many relationship between
     * global_profiles and skills. It is the exact matrix that the
     * Python ML API will query to compute Cosine Similarity for team matching.
     *
     * Row example: { global_profile_id: 7, skill_id: 3, proficiency_level: 4 }
     * Read as: "Developer #7 knows PHP at an Expert-adjacent level (4/5)."
     *
     * The compound UNIQUE constraint on (global_profile_id, skill_id) prevents
     * a developer from having the same skill listed twice with different ratings,
     * which would corrupt the feature vector with duplicate dimensions.
     *
     * proficiency_level scale:
     *   1 = Beginner   2 = Elementary   3 = Intermediate
     *   4 = Advanced   5 = Expert
     */
    public function up(): void
    {
        Schema::create('global_profile_skill', function (Blueprint $table) {
            $table->id();

            $table->foreignId('global_profile_id')
                ->constrained('global_profiles')
                ->onDelete('cascade');

            $table->foreignId('skill_id')
                ->constrained('skills')
                ->onDelete('cascade');

            // Stored as tinyInteger (1 byte) — sufficient for a 1–5 range
            $table->tinyInteger('proficiency_level');

            // Prevents duplicate (profile, skill) pairs that would create
            // conflicting rows in the ML feature matrix
            $table->unique(['global_profile_id', 'skill_id'], 'uq_profile_skill');

            $table->timestamps();
        });

        // Native PostgreSQL CHECK constraint — enforces the 1–5 proficiency scale
        // at the storage layer, not just at the application layer
        DB::statement("
            ALTER TABLE global_profile_skill
            ADD CONSTRAINT chk_proficiency_level
            CHECK (proficiency_level BETWEEN 1 AND 5)
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE global_profile_skill DROP CONSTRAINT IF EXISTS chk_proficiency_level');
        Schema::dropIfExists('global_profile_skill');
    }
};
