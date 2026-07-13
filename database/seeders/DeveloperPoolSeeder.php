<?php

namespace Database\Seeders;

use App\Models\GlobalProfile;
use App\Models\Position;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DeveloperPoolSeeder extends Seeder
{
    /**
     * Seed developer users and their global skill profiles.
     *
     * Creates/updates diverse developer profiles with position, experience years,
     * availability constraints, and multi-skill proficiency matrices (1-5 scale)
     * optimized for testing LLM profile reasoning and GNN Cosine Similarity matching.
     */
    public function run(): void
    {
        $defaultPassword = Hash::make('password123');

        $developers = [
            [
                'name' => 'Test Developer',
                'email' => 'developer@example.com',
                'position' => 'Full Stack Developer',
                'experience_years' => 5.0,
                'timezone' => 'UTC',
                'max_hours_per_week' => 40,
                'open_to_invitations' => true,
                'skills' => [
                    'PHP' => 5,
                    'Laravel' => 5,
                    'React' => 4,
                    'PostgreSQL' => 4,
                    'Docker' => 3,
                    'REST APIs' => 5,
                ],
            ],
            [
                'name' => 'Lucas Miller',
                'email' => 'backend@example.com',
                'position' => 'Backend Developer',
                'experience_years' => 6.5,
                'timezone' => 'America/New_York',
                'max_hours_per_week' => 40,
                'open_to_invitations' => true,
                'skills' => [
                    'PHP' => 5,
                    'Laravel' => 5,
                    'PostgreSQL' => 5,
                    'REST APIs' => 5,
                    'Redis' => 4,
                    'Docker' => 4,
                ],
            ],
            [
                'name' => 'Chloe Zhang',
                'email' => 'frontend@example.com',
                'position' => 'Frontend Developer',
                'experience_years' => 4.0,
                'timezone' => 'Asia/Singapore',
                'max_hours_per_week' => 35,
                'open_to_invitations' => true,
                'skills' => [
                    'React' => 5,
                    'TypeScript' => 4,
                    'Next.js' => 4,
                    'Vue.js' => 3,
                    'GraphQL' => 3,
                ],
            ],
            [
                'name' => 'Dr. Marcus Vance',
                'email' => 'ai.research@example.com',
                'position' => 'AI / ML Engineer',
                'experience_years' => 7.0,
                'timezone' => 'UTC',
                'max_hours_per_week' => 40,
                'open_to_invitations' => true,
                'skills' => [
                    'Python' => 5,
                    'PyTorch' => 5,
                    'TensorFlow' => 4,
                    'LangChain' => 4,
                    'LlamaIndex' => 4,
                    'Hugging Face' => 5,
                    'Pinecone' => 4,
                ],
            ],
            [
                'name' => 'Amara Okafor',
                'email' => 'devops@example.com',
                'position' => 'DevOps Engineer',
                'experience_years' => 5.5,
                'timezone' => 'Europe/London',
                'max_hours_per_week' => 40,
                'open_to_invitations' => true,
                'skills' => [
                    'Docker' => 5,
                    'Kubernetes' => 5,
                    'AWS' => 5,
                    'Terraform' => 4,
                    'Linux' => 5,
                    'Git' => 5,
                ],
            ],
            [
                'name' => 'Liam O\'Connor',
                'email' => 'qa.lead@example.com',
                'position' => 'QA Automation Engineer',
                'experience_years' => 4.5,
                'timezone' => 'UTC',
                'max_hours_per_week' => 30,
                'open_to_invitations' => true,
                'skills' => [
                    'PHPUnit' => 4,
                    'Jest' => 4,
                    'Cypress' => 4,
                    'REST APIs' => 4,
                ],
            ],
            [
                'name' => 'Elena Rostova',
                'email' => 'gamedev@example.com',
                'position' => 'Game Developer',
                'experience_years' => 5.0,
                'timezone' => 'Europe/Berlin',
                'max_hours_per_week' => 40,
                'open_to_invitations' => true,
                'skills' => [
                    'Unity' => 5,
                    'C#' => 5,
                    'Unreal Engine' => 4,
                    'C++' => 3,
                ],
            ],
            [
                'name' => 'Kenji Takahashi',
                'email' => 'mobile@example.com',
                'position' => 'Mobile Developer',
                'experience_years' => 3.5,
                'timezone' => 'Asia/Tokyo',
                'max_hours_per_week' => 40,
                'open_to_invitations' => true,
                'skills' => [
                    'React Native' => 5,
                    'Flutter' => 4,
                    'TypeScript' => 4,
                    'iOS (Native)' => 3,
                    'Android (Native)' => 3,
                ],
            ],
            [
                'name' => 'Sophiya Patel',
                'email' => 'datasci@example.com',
                'position' => 'Data Scientist',
                'experience_years' => 4.0,
                'timezone' => 'America/Los_Angeles',
                'max_hours_per_week' => 40,
                'open_to_invitations' => true,
                'skills' => [
                    'Python' => 5,
                    'Pandas' => 5,
                    'scikit-learn' => 5,
                    'NumPy' => 4,
                    'PostgreSQL' => 4,
                    'R' => 3,
                ],
            ],
            [
                'name' => 'David Wright',
                'email' => 'solutions.architect@example.com',
                'position' => 'Solutions Architect',
                'experience_years' => 9.0,
                'timezone' => 'America/New_York',
                'max_hours_per_week' => 40,
                'open_to_invitations' => true,
                'skills' => [
                    'AWS' => 5,
                    'Docker' => 4,
                    'PostgreSQL' => 5,
                    'REST APIs' => 5,
                ],
            ],
            [
                'name' => 'Maya Lin',
                'email' => 'fullstack2@example.com',
                'position' => 'Full Stack Developer',
                'experience_years' => 3.0,
                'timezone' => 'UTC',
                'max_hours_per_week' => 40,
                'open_to_invitations' => true,
                'skills' => [
                    'PHP' => 4,
                    'Laravel' => 4,
                    'Vue.js' => 4,
                    'Nuxt.js' => 3,
                    'PostgreSQL' => 3,
                ],
            ],
        ];

        // Ensure positions and skills lookup tables are loaded
        $positions = Position::pluck('id', 'name');
        $skills = Skill::pluck('id', 'name');

        foreach ($developers as $devData) {
            // 1. Create or update user
            $user = User::updateOrCreate(
                ['email' => $devData['email']],
                [
                    'name' => $devData['name'],
                    'password' => $defaultPassword,
                    'role' => User::ROLE_PROGRAMMER,
                    'email_verified_at' => now(),
                ]
            );

            $positionId = $positions->get($devData['position']);

            if (! $positionId) {
                $position = Position::firstOrCreate(['name' => $devData['position']]);
                $positionId = $position->id;
            }

            // 2. Create or update GlobalProfile
            $profile = GlobalProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'position_id' => $positionId,
                    'experience_years' => $devData['experience_years'],
                    'open_to_invitations' => $devData['open_to_invitations'],
                    'timezone' => $devData['timezone'],
                    'max_hours_per_week' => $devData['max_hours_per_week'],
                ]
            );

            // 3. Sync skills matrix with proficiency levels
            $syncSkills = [];
            foreach ($devData['skills'] as $skillName => $proficiencyLevel) {
                $skillId = $skills->get($skillName);
                if (! $skillId) {
                    $newSkill = Skill::firstOrCreate(['name' => $skillName], ['category' => 'General']);
                    $skillId = $newSkill->id;
                    $skills[$skillName] = $skillId;
                }
                $syncSkills[$skillId] = ['proficiency_level' => $proficiencyLevel];
            }

            $profile->skills()->sync($syncSkills);
        }

        $this->command->info('DeveloperPoolSeeder: Seeded ' . count($developers) . ' developer profiles with skills.');
    }
}
