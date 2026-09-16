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
            $table->unsignedBigInteger('reply_to_id')->nullable()->after('mentions');
            $table->json('reply_to')->nullable()->after('reply_to_id');
            $table->boolean('is_pinned')->default(false)->index()->after('reply_to');
            $table->timestamp('pinned_at')->nullable()->after('is_pinned');
            $table->unsignedBigInteger('pinned_by_user_id')->nullable()->after('pinned_at');
            $table->json('forwarded_from')->nullable()->after('pinned_by_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('channel_messages', function (Blueprint $table) {
            $table->dropColumn([
                'reply_to_id',
                'reply_to',
                'is_pinned',
                'pinned_at',
                'pinned_by_user_id',
                'forwarded_from',
            ]);
        });
    }
};
