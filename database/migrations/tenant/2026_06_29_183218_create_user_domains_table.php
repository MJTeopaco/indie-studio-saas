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
        Schema::create('user_domains', function (Blueprint $table) {
            // Cannot use ->constrained() since users and micro_domains are on central DB
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('micro_domain_id');
            
            // Composite primary key, no auto-increment ID
            $table->primary(['user_id', 'micro_domain_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_domains');
    }
};
