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
        Schema::create('baseline_studio_profiles', function (Blueprint $table) {
            $table->id();

            // The studio this baseline was derived from (null = system-seeded baseline)
            $table->unsignedBigInteger('source_studio_id')->nullable();

            // Human-readable label for this baseline profile (e.g. "indie-game-studio-small")
            $table->string('label')->nullable();

            // Workforce composition vector: ratios of role types in the studio
            // Stored as JSON float array — e.g. [0.4, 0.2, 0.1, ...] per position category
            $table->json('workforce_composition_vector');

            // Tech stack weight vector: frequency weights per skill category
            // Stored as JSON float array — one entry per skill category
            $table->json('tech_stack_vector');

            // Domain one-hot vector: which macro-domains this studio primarily works in
            // Stored as JSON int array — one entry per macro domain
            $table->json('domain_one_hot_vector');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('baseline_studio_profiles');
    }
};
