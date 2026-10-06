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
        Schema::table('users', function (Blueprint $table) {
            $table->date('leave_start_date')->nullable()->after('working_status');
            $table->date('leave_end_date')->nullable()->after('leave_start_date');
        });

        Schema::table('studio_members', function (Blueprint $table) {
            $table->date('leave_start_date')->nullable()->after('working_status');
            $table->date('leave_end_date')->nullable()->after('leave_start_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['leave_start_date', 'leave_end_date']);
        });

        Schema::table('studio_members', function (Blueprint $table) {
            $table->dropColumn(['leave_start_date', 'leave_end_date']);
        });
    }
};
