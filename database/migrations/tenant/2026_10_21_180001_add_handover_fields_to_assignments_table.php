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
        Schema::table('assignments', function (Blueprint $table) {
            $table->string('handover_reason')->nullable()->after('status');
            $table->timestamp('handed_over_at')->nullable()->after('handover_reason');
            $table->unsignedBigInteger('handed_over_to_user_id')->nullable()->after('handed_over_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            $table->dropColumn(['handover_reason', 'handed_over_at', 'handed_over_to_user_id']);
        });
    }
};
