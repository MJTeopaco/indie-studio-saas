<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{

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

        // 2. Seed developer users and their global skill profiles (Test Developer included)
        $this->call([
            DeveloperPoolSeeder::class,
        ]);

        // 3. Seed a studio with 1 manager and populate it with members from the developer pool
        $this->call([
            StudioWithMembersSeeder::class,
        ]);

        // 4. Seed a test admin account (idempotent)
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Test Admin',
                'password' => \Illuminate\Support\Facades\Hash::make('password123'),
                'role' => User::ROLE_ADMIN,
                'email_verified_at' => now(),
            ]
        );
    }
}
