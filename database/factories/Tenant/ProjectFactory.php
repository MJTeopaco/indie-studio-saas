<?php

namespace Database\Factories\Tenant;

use App\Models\Tenant\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    protected $model = Project::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $start = fake()->dateTimeBetween('-3 months', 'now');

        return [
            'name' => fake()->company().' '.fake()->randomElement(['Platform', 'App', 'Service', 'System', 'Portal']),
            'description' => fake()->paragraph(3),
            'status' => fake()->randomElement(['planning', 'active', 'active', 'active', 'completed']),
            'start_date' => $start,
            'target_end_date' => fake()->dateTimeBetween($start, '+6 months'),
        ];
    }

    public function active(): static
    {
        return $this->state(['status' => 'active']);
    }
}
