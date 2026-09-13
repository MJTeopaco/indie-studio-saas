<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add reviewer_user_id to tasks so the team leader can assign a dedicated reviewer.
     * When set, transitioning a task to "done" requires the reviewer to approve it;
     * without a reviewer the member can mark it done directly.
     */
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // References central users table — intentionally no FK constraint (cross-DB)
            $table->unsignedBigInteger('reviewer_user_id')->nullable()->after('assigned_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('reviewer_user_id');
        });
    }
};
