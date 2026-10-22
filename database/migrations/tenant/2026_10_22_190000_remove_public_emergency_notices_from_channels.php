<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Purges any public system notices regarding emergency declarations from general chat channels
     * to protect employee privacy and adhere to confidential HR standards.
     */
    public function up(): void
    {
        if (Schema::hasTable('channel_messages')) {
            DB::table('channel_messages')
                ->where('channel_id', 'ch-general')
                ->where('sender_name', 'System Notice')
                ->where(function ($query) {
                    $query->where('body', 'like', 'Operational Update:%resolved their emergency%')
                        ->orWhere('body', 'like', '%emergency declaration%');
                })
                ->delete();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // One-time privacy cleanup migration; irreversible by design.
    }
};
