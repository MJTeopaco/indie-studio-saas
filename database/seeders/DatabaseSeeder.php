<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     *
     * Order matters: lookup tables (positions, skills) must be seeded before
     * any records that reference them via foreign keys.
     */
    public function run(): void
    {
        // 1. Seed lookup dictionaries first
        $this->call([
            PositionsSeeder::class,
            SkillsSeeder::class,
            MacroDomainsSeeder::class,
        ]);

        // 2. Seed a test developer account (role: programmer)
        User::factory()->create([
            'name'  => 'Test Developer',
            'email' => 'developer@example.com',
            'role'  => User::ROLE_PROGRAMMER,
        ]);

        // 3. Seed a test admin account
        User::factory()->create([
            'name'  => 'Test Admin',
            'email' => 'admin@example.com',
            'role'  => User::ROLE_ADMIN,
        ]);
    }
}
