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
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('task_classification')->nullable();
            $table->string('required_position')->nullable();
            $table->float('minimum_experience_years')->default(0.0);
            $table->string('task_difficulty')->default('Medium'); // 'Easy', 'Medium', 'Hard'
            $table->string('priority')->default('Medium'); // 'Low', 'Medium', 'High', 'Critical'
            $table->float('estimated_hours')->default(0.0);
            $table->integer('days_until_deadline')->nullable();
            $table->json('target_macro_domains')->nullable();
            $table->json('required_skills')->nullable();
            $table->unsignedBigInteger('assigned_user_id')->nullable(); // references central users.id
            $table->string('status')->default('todo'); // 'todo', 'in_progress', 'review', 'completed'
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
