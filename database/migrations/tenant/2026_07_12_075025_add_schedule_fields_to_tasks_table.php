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
        Schema::table('tasks', function (Blueprint $table) {
            $table->float('es')->nullable()->after('assigned_user_id')->comment('Early Start');
            $table->float('ef')->nullable()->after('es')->comment('Early Finish');
            $table->float('ls')->nullable()->after('ef')->comment('Late Start');
            $table->float('lf')->nullable()->after('ls')->comment('Late Finish');
            $table->float('total_float')->nullable()->after('lf')->comment('Total Float');
            $table->boolean('is_critical')->default(false)->after('total_float');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['es', 'ef', 'ls', 'lf', 'total_float', 'is_critical']);
        });
    }
};
