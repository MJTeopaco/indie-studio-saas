<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Design decisions recorded here:
     *
     * 1. position_id (FK → positions) instead of a free-text position column.
     *    Rationale: A lookup table prevents "Frontend" vs "front-end" vs "Front End"
     *    inconsistencies that would break One-Hot Encoding in the Random Forest model.
     *    Adding a new position only requires a new row in the positions table.
     *
     * 2. primary_domain DROPPED.
     *    Rationale: Forcing indie developers to pick a single domain produces noisy,
     *    inaccurate labels. A developer with Python + React skills may select "Gaming"
     *    arbitrarily, causing the model to unfairly penalize them for "Web App" tasks.
     *    The skill matrix + experience_years carries all the signal needed.
     *
     * 3. open_to_invitations (BOOLEAN) instead of availability_status (VARCHAR/ENUM).
     *    Rationale: A single platform-wide "Busy/Available" status destroys local
     *    studio context. A developer may be swamped at Studio A but idle at Studio B.
     *    This global flag only answers: "Is this developer open to brand-new studio
     *    contracts?" — it does not interfere with their task load inside existing studios.
     *
     * 4. UNIQUE constraint on user_id enforces the One-to-One relationship at the
     *    database level, not just at the application layer.
     */
    public function up(): void
    {
        Schema::create('global_profiles', function (Blueprint $table) {
            $table->id();

            // One-to-One with users. UNIQUE ensures one passport per user.
            $table->foreignId('user_id')
                ->unique()
                ->constrained()
                ->onDelete('cascade');

            // FK to the positions lookup table
            $table->foreignId('position_id')
                ->constrained('positions')
                ->restrictOnDelete(); // prevent deleting a position while profiles use it

            // Years of professional experience. DECIMAL(4,2) supports values like 2.50.
            $table->decimal('experience_years', 4, 2);

            // Platform-wide invitation flag. True = "Show my profile to new studios."
            $table->boolean('open_to_invitations')->default(true);

            // The new CPM Constraint Columns
            $table->string('timezone', 50)->default('UTC');
            $table->smallInteger('max_hours_per_week')->default(40);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('global_profiles');
    }
};
