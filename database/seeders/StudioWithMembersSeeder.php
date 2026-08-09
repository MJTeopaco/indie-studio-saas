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
            $dummy = new Studio(['id' => 'indiecraft-studios']);
            $dbName = $dummy->database()->getName();

            if ($dummy->database()->manager()->databaseExists($dbName)) {
                $studio = Studio::withoutEvents(function () use ($manager) {
                    return Studio::create([
                        'id' => 'indiecraft-studios',
                        'name' => 'IndieCraft Studios',
                        'owner_id' => $manager->id,
                    ]);
                });
                \Illuminate\Support\Facades\Artisan::call('tenants:migrate-fresh', [
                    '--tenants' => [$studio->getTenantKey()],
                ]);
            } else {
                $studio = Studio::create([
                    'id' => 'indiecraft-studios',
                    'name' => 'IndieCraft Studios',
                    'owner_id' => $manager->id,
                ]);
            }
        } else {
            $studio->update(['owner_id' => $manager->id]);
        }

        // 3. Attach Manager as owner in studio_members
        $manager->joinedStudios()->syncWithoutDetaching([
            $studio->id => ['role' => 'owner']
        ]);

        // 4. Populate Studio with members from the developer pool
        // Get all developer users who have a GlobalProfile (excluding the manager)
        $developers = User::whereHas('globalProfile')
            ->where('id', '!=', $manager->id)
            ->where('email', '!=', 'developer@example.com')
            ->get();

        foreach ($developers as $developer) {
            $developer->joinedStudios()->syncWithoutDetaching([
                $studio->id => ['role' => 'member']
            ]);
        }

        // 5. Seed user_domains in the tenant database
        tenancy()->initialize($studio);

        $positionDomainMap = [
            'Frontend Developer' => ['Portal & Dashboard Development', 'Real-Time Web (WebSockets)', 'E-Commerce Systems'],
            'Backend Developer' => ['Microservices & API Architecture', 'Database Architecture', 'GraphQL API Design', 'Third-Party API Integrations (Stripe, Twilio)'],
            'Full Stack Developer' => ['Full-Stack Development', 'Portal & Dashboard Development', 'E-Commerce Systems', 'Multi-Tenant SaaS Architecture', 'Database Architecture'],
            'Product Design Engineer' => ['Requirements Gathering & Business Analysis', 'Portal & Dashboard Development'],
            'Technical Product Manager' => ['Product Roadmap Architecture', 'Agile / Scrum Sprint Planning', 'Requirements Gathering & Business Analysis', 'Technical Documentation & PRDs'],
            'QA Automation Engineer' => ['Full-Stack Development', 'CI/CD Pipeline Design'],
            'Solutions Architect' => ['Multi-Tenant SaaS Architecture', 'Microservices & API Architecture', 'Cloud Deployment (AWS/GCP/Azure)', 'Database Architecture'],
            'DevOps Engineer' => ['Cloud Deployment (AWS/GCP/Azure)', 'Containerization (Docker/Kubernetes)', 'CI/CD Pipeline Design', 'Infrastructure as Code (Terraform)'],
            'AI / ML Engineer' => ['LLM Fine-Tuning & Prompt Engineering', 'RAG (Retrieval-Augmented Generation)', 'Vector Databases (Pinecone/Milvus)', 'AI Agent Orchestration (LangChain)'],
            'Mobile Developer' => ['Full-Stack Development', 'Real-Time Web (WebSockets)'],
            'Game Developer' => ['Real-Time Web (WebSockets)'],
            'Data Scientist' => ['Machine Learning (Supervised & Unsupervised)', 'Data Pipeline Engineering', 'Natural Language Processing & Computer Vision'],
        ];

        $microDomainsLookup = \App\Models\MicroDomain::pluck('id', 'name');

        foreach ($developers as $developer) {
            $positionName = $developer->globalProfile?->position?->name ?? 'Full Stack Developer';
            $domainNames = $positionDomainMap[$positionName] ?? ['Full-Stack Development'];

            foreach ($domainNames as $domainName) {
                $microDomainId = $microDomainsLookup->get($domainName);
                if ($microDomainId) {
                    \App\Models\Tenant\UserDomain::firstOrCreate([
                        'user_id' => $developer->id,
                        'micro_domain_id' => $microDomainId,
                    ]);
                }
            }
        }

        tenancy()->end();

        $this->command->info('StudioWithMembersSeeder: Seeded studio "' . $studio->name . '" (ID: ' . $studio->id . ') with 1 manager, ' . $developers->count() . ' members, and tenant domain mappings.');
    }
}
