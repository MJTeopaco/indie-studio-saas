<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Stores messages for both workspace channels (ch-general, ch-sprint, ch-dev,
     * or any custom channel) and direct-message threads (dm-{user_id}).
     * The channel_id is a string key so it works for both: "ch-general" or "dm-5".
     */
    public function up(): void
    {
        Schema::create('channel_messages', function (Blueprint $table) {
            $table->id();
            // String key: "ch-general", "ch-sprint", "ch-dev", "ch-custom-{ts}", "dm-{userId}"
            $table->string('channel_id', 100)->index();
            // Central-auth user who sent the message
            $table->unsignedBigInteger('user_id');
            $table->string('sender_name', 255);
            $table->string('sender_role', 100)->nullable();
            $table->text('body')->nullable();
            $table->timestamps();

            $table->index(['channel_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('channel_messages');
    }
};
