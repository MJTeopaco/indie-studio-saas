<?php

namespace Database\Factories\Tenant;

use App\Models\Tenant\Task;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    protected $model = Task::class;

    /**
     * All valid positions matching the GNN POSITIONS_SCHEMA.
     *
     * @var list<string>
     */
    protected static array $positions = [
        'Technical Product Manager',
        'Business Analyst',
        'Solutions Architect',
        'Data Scientist',
        'Full Stack Developer',
        'Backend Developer',
        'Frontend Developer',
        'Mobile Developer',
        'Game Developer',
        'AI / ML Engineer',
        'Data Engineer',
        'DevOps Engineer',
        'DevSecOps',
        'MLOps Engineer',
        'QA Automation Engineer',
        'Research Scientist',
        'Research Analyst',
    ];

    /**
     * Common skill pools by position family.
     *
     * @var array<string, list<string>>
     */
    protected static array $skillPool = [
        'backend' => ['PHP', 'Laravel', 'Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker', 'REST API', 'GraphQL'],
        'frontend' => ['React', 'Vue.js', 'TypeScript', 'CSS', 'Tailwind CSS', 'Next.js', 'Figma'],
        'devops' => ['Docker', 'Kubernetes', 'CI/CD', 'GitHub Actions', 'Terraform', 'AWS', 'Linux'],
        'ml' => ['Python', 'PyTorch', 'scikit-learn', 'Pandas', 'NumPy', 'TensorFlow', 'LangChain'],
        'qa' => ['Selenium', 'Playwright', 'PHPUnit', 'Jest', 'Postman', 'Load Testing'],
    ];

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $classification = fake()->randomElement(['Feature', 'Bug Fix', 'Research', 'DevOps', 'Testing', 'Documentation']);
        $difficulty = fake()->randomElement(['Easy', 'Medium', 'Medium', 'Hard']);
        $priority = fake()->randomElement(['Low', 'Medium', 'Medium', 'High', 'Critical']);
        $position = fake()->randomElement(self::$positions);
        $skillFamily = fake()->randomElement(array_keys(self::$skillPool));
        $skillNames = fake()->randomElements(self::$skillPool[$skillFamily], fake()->numberBetween(2, 4));

        $requiredSkills = array_map(fn (string $name) => [
            'name' => $name,
            'level' => fake()->numberBetween(1, 5),
        ], $skillNames);

        // 8-domain multi-hot vector (indices map to macro-domain IDs 1–8)
        $macroDomains = array_map(
            fn () => fake()->numberBetween(0, 1),
            range(1, 8)
        );
        // Ensure at least one domain is active
        $macroDomains[fake()->numberBetween(0, 7)] = 1;

        return [
            'project_id' => null, // must be set by seeder / factory call
            'title' => fake()->sentence(fake()->numberBetween(4, 8), false),
            'description' => fake()->paragraph(2),
            'task_classification' => $classification,
            'required_position' => $position,
            'minimum_experience_years' => fake()->randomFloat(1, 0, 8),
            'task_difficulty' => $difficulty,
            'priority' => $priority,
            'estimated_hours' => fake()->randomElement([4, 8, 12, 16, 20, 24, 40]),
            'days_until_deadline' => fake()->numberBetween(3, 90),
            'target_macro_domains' => $macroDomains,
            'required_skills' => $requiredSkills,
            'assigned_user_id' => null,
            'status' => fake()->randomElement(['todo', 'todo', 'in_progress', 'review', 'completed']),
        ];
    }

    public function forProject(int $projectId): static
    {
        return $this->state(['project_id' => $projectId]);
    }

    public function completed(): static
    {
        return $this->state(['status' => 'completed']);
    }

    public function inProgress(): static
    {
        return $this->state(['status' => 'in_progress']);
    }

    public function highPriority(): static
    {
        return $this->state(['priority' => 'High']);
    }

    public function critical(): static
    {
        return $this->state(['priority' => 'Critical', 'task_difficulty' => 'Hard']);
    }
}
