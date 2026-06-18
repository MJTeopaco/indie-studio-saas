<?php

namespace Database\Seeders;

use App\Models\Skill;
use Illuminate\Database\Seeder;

class SkillsSeeder extends Seeder
{
    /**
     * Seed the skills master dictionary.
     *
     * Skills are organized by category. The category column is used:
     *   1. In the UI: to render skills grouped by type (e.g., "Languages", "Frameworks")
     *   2. In the ML engine: as a potential feature grouping for future model iterations
     *
     * This list is curated for the indie studio context. Do NOT add niche or
     * highly specific tools here — keep the dictionary to well-known, widely
     * recognized skills to ensure the feature matrix remains meaningful.
     *
     * firstOrCreate() makes this seeder fully idempotent — safe to re-run.
     */
    public function run(): void
    {
        $skills = [
            // ── Languages ────────────────────────────────────────────────────
            ['name' => 'PHP',        'category' => 'Language'],
            ['name' => 'Python',     'category' => 'Language'],
            ['name' => 'JavaScript', 'category' => 'Language'],
            ['name' => 'TypeScript', 'category' => 'Language'],
            ['name' => 'Go',         'category' => 'Language'],
            ['name' => 'Rust',       'category' => 'Language'],
            ['name' => 'C#',         'category' => 'Language'],
            ['name' => 'C++',        'category' => 'Language'],
            ['name' => 'Java',       'category' => 'Language'],
            ['name' => 'Kotlin',     'category' => 'Language'],
            ['name' => 'Swift',      'category' => 'Language'],
            ['name' => 'Ruby',       'category' => 'Language'],
            ['name' => 'Dart',       'category' => 'Language'],
            ['name' => 'Lua',        'category' => 'Language'],

            // ── Web Frameworks ────────────────────────────────────────────────
            ['name' => 'Laravel',     'category' => 'Framework'],
            ['name' => 'React',       'category' => 'Framework'],
            ['name' => 'Vue.js',      'category' => 'Framework'],
            ['name' => 'Next.js',     'category' => 'Framework'],
            ['name' => 'Nuxt.js',     'category' => 'Framework'],
            ['name' => 'Angular',     'category' => 'Framework'],
            ['name' => 'Svelte',      'category' => 'Framework'],
            ['name' => 'Django',      'category' => 'Framework'],
            ['name' => 'FastAPI',     'category' => 'Framework'],
            ['name' => 'Flask',       'category' => 'Framework'],
            ['name' => 'Spring Boot', 'category' => 'Framework'],
            ['name' => 'Ruby on Rails', 'category' => 'Framework'],
            ['name' => 'Express.js',  'category' => 'Framework'],
            ['name' => 'NestJS',      'category' => 'Framework'],

            // ── Mobile ────────────────────────────────────────────────────────
            ['name' => 'Flutter',       'category' => 'Mobile'],
            ['name' => 'React Native',  'category' => 'Mobile'],
            ['name' => 'Android (Native)', 'category' => 'Mobile'],
            ['name' => 'iOS (Native)',   'category' => 'Mobile'],

            // ── Databases ─────────────────────────────────────────────────────
            ['name' => 'PostgreSQL',  'category' => 'Database'],
            ['name' => 'MySQL',       'category' => 'Database'],
            ['name' => 'SQLite',      'category' => 'Database'],
            ['name' => 'MongoDB',     'category' => 'Database'],
            ['name' => 'Redis',       'category' => 'Database'],
            ['name' => 'Elasticsearch', 'category' => 'Database'],
            ['name' => 'Firebase',    'category' => 'Database'],
            ['name' => 'Supabase',    'category' => 'Database'],

            // ── DevOps & Cloud ────────────────────────────────────────────────
            ['name' => 'Docker',          'category' => 'DevOps'],
            ['name' => 'Kubernetes',      'category' => 'DevOps'],
            ['name' => 'GitHub Actions',  'category' => 'DevOps'],
            ['name' => 'AWS',             'category' => 'DevOps'],
            ['name' => 'Google Cloud',    'category' => 'DevOps'],
            ['name' => 'Azure',           'category' => 'DevOps'],
            ['name' => 'Terraform',       'category' => 'DevOps'],
            ['name' => 'Nginx',           'category' => 'DevOps'],
            ['name' => 'Linux',           'category' => 'DevOps'],

            // ── Game Engines ──────────────────────────────────────────────────
            ['name' => 'Unity',         'category' => 'Game Engine'],
            ['name' => 'Unreal Engine', 'category' => 'Game Engine'],
            ['name' => 'Godot',         'category' => 'Game Engine'],

            // ── Design & Creative ─────────────────────────────────────────────
            ['name' => 'Figma',       'category' => 'Design'],
            ['name' => 'Adobe XD',    'category' => 'Design'],
            ['name' => 'Blender',     'category' => 'Design'],
            ['name' => 'Photoshop',   'category' => 'Design'],

            // ── Testing & QA ──────────────────────────────────────────────────
            ['name' => 'PHPUnit',   'category' => 'Testing'],
            ['name' => 'Jest',      'category' => 'Testing'],
            ['name' => 'Cypress',   'category' => 'Testing'],
            ['name' => 'Selenium',  'category' => 'Testing'],
            ['name' => 'Pest',      'category' => 'Testing'],

            // ── Data & ML ─────────────────────────────────────────────────────
            ['name' => 'TensorFlow', 'category' => 'Data & ML'],
            ['name' => 'PyTorch',    'category' => 'Data & ML'],
            ['name' => 'scikit-learn', 'category' => 'Data & ML'],
            ['name' => 'Pandas',     'category' => 'Data & ML'],
            ['name' => 'NumPy',      'category' => 'Data & ML'],
        ];

        foreach ($skills as $skill) {
            Skill::firstOrCreate(
                ['name' => $skill['name']],
                ['category' => $skill['category']]
            );
        }

        $this->command->info('Skills seeded: ' . count($skills) . ' records across all categories.');
    }
}
