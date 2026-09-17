<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->timestamp('completed_at')->nullable()->after('status');
            $table->unsignedBigInteger('completed_by_user_id')->nullable()->after('completed_at');
            $table->text('completion_notes')->nullable()->after('completed_by_user_id');
        });

        // Backfill existing completed tasks
        try {
            DB::table('tasks')
                ->where('status', 'completed')
                ->whereNull('completed_at')
                ->update([
                    'completed_at' => DB::raw('updated_at'),
                    'completed_by_user_id' => DB::raw('assigned_user_id'),
                ]);
        } catch (Throwable $e) {
            // Ignore if backfill cannot execute in fresh test environments
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['completed_at', 'completed_by_user_id', 'completion_notes']);
        });
    }
};
