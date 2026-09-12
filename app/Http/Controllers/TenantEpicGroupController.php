<?php

namespace App\Http\Controllers;

use App\Models\Tenant\Project;
use Illuminate\Http\Request;

class TenantEpicGroupController extends Controller
{
    public function store(Request $request, $project)
    {
        $projectModel = Project::findOrFail($project);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'goal' => 'nullable|string',
        ]);

        $maxDisplayOrder = $projectModel->epicGroups()->max('display_order') ?? 0;

        $epicGroup = $projectModel->epicGroups()->create([
            'name' => $validated['name'],
            'goal' => $validated['goal'],
            'display_order' => $maxDisplayOrder + 1,
            'is_default' => false,
        ]);

        return redirect()->back()->with('success', 'Epic group created successfully.');
    }
}
