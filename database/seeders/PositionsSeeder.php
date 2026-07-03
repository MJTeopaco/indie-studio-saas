<?php

namespace Database\Seeders;

use App\Models\Position;
use Illuminate\Database\Seeder;

class PositionsSeeder extends Seeder
{
    /**
     * Seed the positions lookup table.
     *
     * This list is intentionally opinionated for the indie studio context.
     * Each name here becomes a valid option in the developer registration form
     * and a consistent One-Hot Encoded feature in the Random Forest model.
     *
     * Adding a new position in production: INSERT a row here and re-run the seeder.
     * No schema migration required.
     *
     * firstOrCreate() makes this seeder fully idempotent — safe to re-run.
     */
    public function run(): void
    {
        $positions = [
            'Backend Developer',
            'Frontend Developer',
            'Full Stack Developer',
            'Game Developer',
            'DevOps Engineer',
            'MLOps Engineer',
            'QA Engineer',
            'UI/UX Designer',
            'Mobile Developer',
            'Data / ML Engineer',
            'AI Engineer',
            'Data Analyst',
            'Cybersecurity Engineer',
            'Technical Product Manager',
            'Project Manager',
            'Solutions Architect',
            'Research Scientist',
        ];

        foreach ($positions as $name) {
            Position::firstOrCreate(['name' => $name]);
        }

        $this->command->info('Positions seeded: ' . count($positions) . ' records.');
    }
}
