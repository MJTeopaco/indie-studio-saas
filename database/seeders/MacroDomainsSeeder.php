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
                    // ── NEW: Product & Strategy (Crucial for BAs and PMs) ──────
                    'Product Strategy & Management' => [
                        'Requirements Gathering & Business Analysis',
                        'Agile / Scrum Sprint Planning',
                        'Market Viability & User Research',
                        'Technical Documentation & PRDs',
                        'Product Roadmap Architecture',
                    ],

                    // ── Web & SaaS (Updated with APIs & Multi-tenant) ──────────
                    'Web & SaaS Platforms' => [
                        'Full-Stack Development',
                        'Microservices & API Architecture', // Updated
                        'Third-Party API Integrations (Stripe, Twilio)', // Added
                        'GraphQL API Design',
                        'Multi-Tenant SaaS Architecture', // Added
                        'E-Commerce Systems',
                        'Portal & Dashboard Development',
                        'Database Architecture',
                        'Real-Time Web (WebSockets)',
                    ],

                    // ── Data Science & Deep Tech (Vaultera Core) ───────────────
                    'Data Science & Predictive Modeling' => [
                        'Machine Learning (Supervised & Unsupervised)',
                        'Natural Language Processing & Computer Vision',
                        'Data Pipeline Engineering',
                        'LLM Fine-Tuning & Prompt Engineering', 
                        'RAG (Retrieval-Augmented Generation)', 
                        'Vector Databases (Pinecone/Milvus)',
                        'Algorithm Evaluation & Benchmarking', // Added for Research Analysts
                    ],

                    // ── Infrastructure & Security (Updated for DevSecOps) ──────
                    'DevOps & IT Infrastructure' => [
                        'Cloud Deployment (AWS/GCP/Azure)',
                        'CI/CD Pipeline Design',
                        'Containerization (Docker/Kubernetes)',
                        'DevSecOps & Continuous Security', // Aligned with client role
                        'Infrastructure as Code (Terraform)',
                        'MLOps & Model Deployment',
                        'AI Agent Orchestration (LangChain)',
                    ],

                    // ── Hardware & IoT (Updated for HIL) ───────────────────────
                    'Hardware Prototyping & Embedded Systems' => [
                        'Microcontroller Programming (Arduino/ESP32)',
                        'Sensor Integration & IoT',
                        'Hardware-in-the-Loop (HIL) Testing', // Aligned with client role
                        'Robotics & Actuator Control',
                        'PCB Design & Prototyping',
                        'Real-Time Operating Systems (RTOS)',
                    ],

                    // ── Design & Interactive ───────────────────────────────────
                    'UI/UX & Digital Asset Design' => [
                        'UX Research & Wireframing',
                        'User Interface Design (Figma)',
                        'System Mechanics Planning', // Aligned with Product Design Engineer
                        'Motion Design & Animation',
                        'Conversational UI/UX Design',
                    ],
                    
                    // ── Standard Mobile & Game Dev ─────────────────────────────
                    'Mobile Application Development' => [
                        'Native iOS (Swift/SwiftUI)',
                        'Native Android (Kotlin)',
                        'Flutter / React Native (Cross-Platform)',
                        'Offline-First Mobile Architecture',
                    ],
                    'Game Development & Interactive Media' => [
                        'Unity / Unreal / Godot Development',
                        'Game Physics & Netcode',
                        'Procedural Content Generation',
                        'Interactive 3D Environments',
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
