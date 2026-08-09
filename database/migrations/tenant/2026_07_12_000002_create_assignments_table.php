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
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();

            // References the central users table — no FK constraint here because
            // tenant DB cannot cross-reference the central DB schema.
            $table->unsignedBigInteger('employee_user_id');

            // The GNN/cold-start match fit score (0.0 – 1.0)
            $table->decimal('match_fit_score', 5, 4)->nullable();

            // Who triggered this assignment: 'gnn', 'cold_start_baseline', 'manual'
            $table->string('assigned_by')->default('manual');

            // When the GNN is the source, annotate whether it was a cold-start
            // provisional score or a fully-trained GNN prediction.
            $table->string('match_source')->default('manual'); // 'gnn', 'cold_start_baseline', 'manual'

            // Assignment lifecycle: proposed → active → completed / cancelled
            $table->string('status')->default('active');

            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assignments');
    }
};
