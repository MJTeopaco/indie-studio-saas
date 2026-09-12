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
        Schema::create('epic_phases', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('label', 80);
            $table->string('color', 7);
            $table->boolean('is_default')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['tenant_id', 'label']);
            $table->index('tenant_id');
        });

        Schema::create('epic_priorities', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('label', 80);
            $table->string('color', 7);
            $table->boolean('is_default')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['tenant_id', 'label']);
            $table->index('tenant_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('epic_priorities');
        Schema::dropIfExists('epic_phases');
    }
};
