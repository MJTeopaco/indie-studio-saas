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
        Schema::table('reports', function (Blueprint $table) {
            $table->unsignedBigInteger('project_id')->nullable()->index()->after('type');
            $table->unsignedBigInteger('employee_user_id')->nullable()->index()->after('project_id');
            $table->unsignedBigInteger('created_by_user_id')->nullable()->index()->after('created_by');
            $table->string('orientation')->default('portrait')->after('target_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn(['project_id', 'employee_user_id', 'created_by_user_id', 'orientation']);
        });
    }
};
