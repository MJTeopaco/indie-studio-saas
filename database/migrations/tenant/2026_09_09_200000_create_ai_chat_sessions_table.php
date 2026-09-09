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
        Schema::create('ai_chat_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary(); // no default: generated in PHP
            $table->unsignedBigInteger('user_id'); // central auth user
            $table->string('title', 255)->default('New Chat');
            $table->json('messages')->default('[]'); // array of {role, content}
            $table->timestamps();

            // Index for fast per-user session listing sorted by recency
            $table->index(['user_id', 'updated_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_chat_sessions');
    }
};
