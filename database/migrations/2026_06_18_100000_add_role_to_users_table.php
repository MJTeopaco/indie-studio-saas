<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * A developer or admin logs in through the same authentication flow.
     * The role column determines what they can access inside the platform.
     * Default is 'programmer' because that is the primary user persona.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default('programmer')->after('remember_token');
        });

        // PostgreSQL CHECK constraint — enforces only valid role values
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("
                ALTER TABLE users
                ADD CONSTRAINT chk_users_role
                CHECK (role IN ('programmer', 'admin'))
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the CHECK constraint first before removing the column
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role');
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
