<?php

namespace Database\Seeders;

use App\Models\Studio;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class StudioWithMembersSeeder extends Seeder
{
    /**
     * Seed a studio with 1 manager and populate it with developer members.
     */
    public function run(): void
    {
        // 1. Create or update the Studio Manager account
        $manager = User::updateOrCreate(
            ['email' => 'manager@example.com'],
            [
                'name' => 'Elena Vance (Studio Manager)',
                'password' => Hash::make('password123'),
                'role' => User::ROLE_PROGRAMMER,
                'email_verified_at' => now(),
            ]
        );

        // 2. Create or find the Studio
        $studio = Studio::find('indiecraft-studios') ?? Studio::where('name', 'IndieCraft Studios')->first();
        if (! $studio) {
            $studio = Studio::create([
                'id' => 'indiecraft-studios',
                'name' => 'IndieCraft Studios',
                'owner_id' => $manager->id,
            ]);
        } else {
            $studio->update(['owner_id' => $manager->id]);
        }

        // Ensure the PostgreSQL tenant database exists and is migrated
        $dbName = $studio->database()->getName();
        if (! $studio->database()->manager()->databaseExists($dbName)) {
            $studio->database()->manager()->createDatabase($studio);
            \Illuminate\Support\Facades\Artisan::call('tenants:migrate', [
                '--tenants' => [$studio->getTenantKey()],
            ]);
        }

        // 3. Attach Manager as owner in studio_members
        $manager->joinedStudios()->syncWithoutDetaching([
            $studio->id => ['role' => 'owner']
        ]);

        // 4. Populate Studio with members from the developer pool
        // Get all developer users who have a GlobalProfile (excluding the manager)
        $developers = User::whereHas('globalProfile')
            ->where('id', '!=', $manager->id)
            ->get();

        foreach ($developers as $developer) {
            $developer->joinedStudios()->syncWithoutDetaching([
                $studio->id => ['role' => 'member']
            ]);
        }

        $this->command->info('StudioWithMembersSeeder: Seeded studio "' . $studio->name . '" (ID: ' . $studio->id . ') with 1 manager and ' . $developers->count() . ' members.');
    }
}
