<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * The positions table is a controlled dictionary, structurally identical
     * to the skills table. This prevents the One-Hot Encoding problem where
     * "Frontend", "Front-end", and "Front End" are treated as three different
     * and unrelated features by the Random Forest model.
     *
     * Adding a new position to the platform only requires inserting a row
     * here — no schema migration required.
     */
    public function up(): void
    {
        Schema::create('positions', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('positions');
    }
};
