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
            $table->string('avatar')->nullable()->after('email');
            $table->string('working_status', 20)->default('active')->after('role'); // 'active', 'on_leave', 'emergency'
        });

        Schema::table('studio_members', function (Blueprint $table) {
            $table->string('working_status', 20)->default('active')->after('role'); // 'active', 'on_leave', 'emergency'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('studio_members', function (Blueprint $table) {
            $table->dropColumn('working_status');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['avatar', 'working_status']);
        });
    }
};
