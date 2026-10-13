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
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->string('request_type')->default('leave')->after('requester_role');
            $table->timestamp('resolved_at')->nullable()->after('reviewed_at');
            $table->date('leave_end_date')->nullable()->change();

            $table->index(['user_id', 'request_type', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'request_type', 'status']);
            $table->dropColumn(['request_type', 'resolved_at']);
            $table->date('leave_end_date')->nullable(false)->change();
        });
    }
};
