<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * The skills table is a controlled dictionary. Rather than letting users
     * type free-form skill names (which produces "JS", "Javascript", "java script",
     * etc.), the platform provides a curated list. This ensures every row in
     * the global_profile_skill pivot maps to a consistent, ML-safe label.
     *
     * Seeded via: php artisan db:seed --class=SkillsSeeder
     */
    public function up(): void
    {
        Schema::create('skills', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();

            // Groups skills for UI rendering and potential ML feature grouping
            // e.g., Language, Framework, Database, DevOps, Game Engine, Design
            $table->string('category', 100);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('skills');
    }
};
