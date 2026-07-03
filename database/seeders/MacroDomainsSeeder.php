<?php

namespace Database\Seeders;

use App\Models\MacroDomain;
use App\Models\MicroDomain;
use Illuminate\Database\Seeder;

class MacroDomainsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $domains = [
            'Web & SaaS Platforms' => [
                'Full-Stack Development',
                'REST API Architecture',
                'GraphQL API Design',
                'E-Commerce Systems',
                'Portal & Dashboard Development',
                'Database Architecture',
                'Headless CMS Integration',
                'Real-Time Web (WebSockets)',
            ],
            'Game Development & Interactive Media' => [
                'Unity Development',
                'Unreal Engine Development',
                'Godot Development',
                'Game Physics Programming',
                'Procedural Content Generation',
                'Multiplayer & Netcode',
                'Game UI/HUD Design',
                'Interactive 3D Environments',
            ],
            'Data Science & Predictive Modeling' => [
                'Machine Learning (Supervised)',
                'Machine Learning (Unsupervised)',
                'Natural Language Processing',
                'Time-Series Forecasting',
                'Data Analytics & Visualization',
                'Statistical Modeling',
                'Computer Vision',
                'Data Pipeline Engineering',
                'LLM Fine-Tuning & Prompt Engineering', 
                'RAG (Retrieval-Augmented Generation)', 
                'Vector Databases (Pinecone/Milvus)',
            ],
            'Hardware Prototyping & Embedded Systems' => [
                'Microcontroller Programming (Arduino/ESP32)',
                'Sensor Integration & IoT',
                'Robotics & Actuator Control',
                'Haptic Feedback Systems',
                'PCB Design & Prototyping',
                'Real-Time Operating Systems (RTOS)',
                'Low-Power Embedded Design',
            ],
            'UI/UX & Digital Asset Design' => [
                'UX Research & Wireframing',
                'User Interface Design (Figma)',
                'Vector Graphics (Illustrator)',
                'Raster Editing (Photoshop)',
                'Motion Design & Animation',
                'Brand Identity Design',
                'Accessibility Design (WCAG)',
                'Conversational UI/UX Design',
            ],
            'Mobile Application Development' => [
                'Native iOS (Swift/SwiftUI)',
                'Native Android (Kotlin)',
                'Flutter (Cross-Platform)',
                'React Native (Cross-Platform)',
                'Mobile UI/UX Patterns',
                'App Store Optimization',
                'Offline-First Mobile Architecture',
            ],
            'DevOps & IT Infrastructure' => [
                'Cloud Deployment (AWS)',
                'Cloud Deployment (GCP)',
                'Cloud Deployment (Azure)',
                'CI/CD Pipeline Design',
                'Containerization (Docker/Kubernetes)',
                'Cybersecurity & Hardening',
                'Infrastructure as Code (Terraform)',
                'Site Reliability Engineering',
                'MLOps & Model Deployment',
                'AI Agent Orchestration (LangChain)',
            ],
        ];

        foreach ($domains as $macroName => $microNames) {
            $macroDomain = MacroDomain::firstOrCreate(['name' => $macroName]);

            foreach ($microNames as $microName) {
                MicroDomain::firstOrCreate([
                    'macro_domain_id' => $macroDomain->id,
                    'name' => $microName,
                ]);
            }
        }

        $this->command->info('Macro-domains and micro-domains seeded successfully.');
    }
}
