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
        Schema::create('studio_members', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id'); // references central users.id
            $table->string('role')->default('member'); // 'owner', 'member', 'developer'
            $table->timestamps();

            $table->unique('user_id'); // one row per user per tenant DB
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('studio_members');
    }
};
