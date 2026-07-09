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
            // ── Core Software & Product Development ─────────────
            'Full Stack Developer',
            'Backend Developer',
            'Frontend Developer',
            'Mobile Developer',
            'Game Developer',
            'Product Engineer',
            'Product Design Engineer',

            // ── AI, ML & Data Engineering ───────────────────────
            'AI / ML Engineer',
            'Data Engineer',
            'Data Scientist',
            'Research Scientist',
            'Research Analyst',

            // ── Infrastructure, DevOps & Security ───────────────
            'DevOps Engineer',
            'DevSecOps',
            'MLOps Engineer',
            'QA Automation Engineer',

            // ── Hardware & Embedded Systems ─────────────────────
            'Hardware / Embedded Engineer',
            'Hardware-in-the-Loop (HIL) Engineer',

            // ── Product, Strategy & Architecture ────────────────
            'Technical Product Manager',
            'Project Manager',
            'Business Analyst',
            'Solutions Architect',
            'AI Solutions Architect',
        ];

        foreach ($positions as $name) {
            Position::firstOrCreate(['name' => $name]);
        }

        $this->command->info('Positions seeded: ' . count($positions) . ' records.');
    }
}
