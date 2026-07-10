<?php

namespace Tests\Feature;

use App\Models\Tenant\Project;
use App\Models\Tenant\ProjectMember;
use App\Models\Tenant\Task;
use App\Models\User;
use App\Policies\ProjectPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('migrate', ['--path' => 'database/migrations/tenant/2026_07_10_000001_create_projects_table.php']);
        $this->artisan('migrate', ['--path' => 'database/migrations/tenant/2026_07_10_000002_create_project_members_table.php']);
        $this->artisan('migrate', ['--path' => 'database/migrations/tenant/2026_07_10_000003_create_tasks_table.php']);
    }

    public function test_project_membership_and_policy_isolation(): void
    {
        $project = Project::create([
            'name' => 'NextGen AI Core',
            'status' => 'active',
        ]);
        $project->id = 1;

        $assignedUser = new User();
        $assignedUser->id = 100;
        $assignedUser->role = User::ROLE_PROGRAMMER;

        $unassignedUser = new User();
        $unassignedUser->id = 200;
        $unassignedUser->role = User::ROLE_PROGRAMMER;

        ProjectMember::create([
            'project_id' => $project->id,
            'user_id' => 100,
            'project_role' => 'member',
        ]);

        $this->assertTrue($project->hasMember(100));
        $this->assertFalse($project->hasMember(200));

        $policy = new ProjectPolicy();
        $this->assertTrue($policy->view($assignedUser, $project));
        $this->assertFalse($policy->view($unassignedUser, $project));
    }

    public function test_task_to_gnn_feature_dict_formatting(): void
    {
        $task = new Task([
            'project_id' => 1,
            'title' => 'ML Engine Integration',
            'description' => 'Integrate PyTorch GNN inference service',
            'task_classification' => 'AI / ML Engine Development',
            'required_position' => 'AI / ML Engineer',
            'minimum_experience_years' => 4.5,
            'task_difficulty' => 'Hard',
            'priority' => 'Critical',
            'estimated_hours' => 30.0,
            'days_until_deadline' => 10,
            'target_macro_domains' => [0, 0, 1, 0, 0, 0, 0, 0],
            'required_skills' => ['Python' => 5.0, 'PyTorch' => 4.0],
        ]);

        $gnnDict = $task->toGNNFeatureDict();

        $this->assertSame('ML Engine Integration', $gnnDict['task_title']);
        $this->assertSame('AI / ML Engineer', $gnnDict['required_position']);
        $this->assertSame(4.5, $gnnDict['minimum_experience_years']);
        $this->assertSame('Hard', $gnnDict['task_difficulty']);
        $this->assertSame(30.0, $gnnDict['estimated_hours']);
        $this->assertEquals(['Python' => 5.0, 'PyTorch' => 4.0], $gnnDict['required_skills']);
    }
}
