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
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->string('studio_id'); // references tenants.id
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('requester_role')->default('member'); // 'member', 'leader'
            $table->date('leave_start_date');
            $table->date('leave_end_date');
            $table->text('reason')->nullable(); // Handover / reason note
            $table->string('status')->default('pending'); // 'pending', 'approved', 'rejected', 'cancelled'
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->index(['studio_id', 'status']);
            $table->index(['user_id', 'status']);
        });

        Schema::table('studio_members', function (Blueprint $table) {
            $table->string('leave_request_status')->default('none')->after('leave_end_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_requests');

        Schema::table('studio_members', function (Blueprint $table) {
            $table->dropColumn('leave_request_status');
        });
    }
};
