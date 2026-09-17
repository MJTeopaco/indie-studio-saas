<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Tracks the last message ID and timestamp read by each user in each channel or DM.
     */
    public function up(): void
    {
        Schema::create('channel_reads', function (Blueprint $table) {
            $table->id();
            $table->string('channel_id', 100)->index();
            $table->unsignedBigInteger('user_id')->index();
            $table->unsignedBigInteger('last_read_message_id')->nullable();
            $table->timestamp('last_read_at')->nullable();
            $table->timestamps();

            $table->unique(['channel_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('channel_reads');
    }
};
