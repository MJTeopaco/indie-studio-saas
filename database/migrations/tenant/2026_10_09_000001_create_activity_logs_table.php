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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('subject_type');           // e.g. 'App\Models\Tenant\Task'
            $table->unsignedBigInteger('subject_id'); // e.g. task.id
            $table->string('field');                  // e.g. 'story_points'
            $table->text('old_value')->nullable();    // '3'
            $table->text('new_value')->nullable();    // '5'
            $table->unsignedBigInteger('user_id')->nullable();    // central user who made the change
            $table->string('user_name');              // denormalized for fast reads
            $table->timestamps();

            $table->index(['subject_type', 'subject_id']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
