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
        Schema::table('channel_messages', function (Blueprint $table) {
            $table->boolean('is_unsent')->default(false)->after('deleted_for_user_ids');
            $table->timestamp('unsent_at')->nullable()->after('is_unsent');
            $table->unsignedBigInteger('unsent_by_user_id')->nullable()->after('unsent_at');
            $table->string('unsent_by_name')->nullable()->after('unsent_by_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('channel_messages', function (Blueprint $table) {
            $table->dropColumn(['is_unsent', 'unsent_at', 'unsent_by_user_id', 'unsent_by_name']);
        });
    }
};
