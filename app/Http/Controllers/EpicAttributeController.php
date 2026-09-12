<?php

namespace App\Http\Controllers;

use App\Models\Tenant\EpicPhase;
use App\Models\Tenant\EpicPriority;
use App\Models\Tenant\Project;
use Illuminate\Http\Request;

class EpicAttributeController extends Controller
{
    /**
     * Store a newly created custom phase or priority.
     */
    public function store(Request $request, $project)
    {
        $projectModel = Project::findOrFail($project);
        
        // Ownership check: Ensure project belongs to current tenant
        if ($projectModel->tenant_id && $projectModel->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized. Project does not belong to the current tenant.');
        }
        
        // Note: Tenancy for Laravel usually scopes queries automatically, but explicit check adds defense in depth.

        $validated = $request->validate([
            'type' => 'required|in:phase,priority',
            'label' => 'required|string|max:80',
            'color' => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);

        $tenantId = tenant('id') ?? 'default';
        $type = $validated['type'];
        $modelClass = $type === 'phase' ? EpicPhase::class : EpicPriority::class;

        // Check for existing to prevent duplicates
        $existing = $modelClass::where('tenant_id', $tenantId)
            ->where('label', $validated['label'])
            ->first();

        if ($existing) {
            return response()->json($existing);
        }

        $maxSort = $modelClass::where('tenant_id', $tenantId)->max('sort_order') ?? 0;

        $newAttribute = $modelClass::create([
            'tenant_id' => $tenantId,
            'label' => $validated['label'],
            'color' => $validated['color'],
            'is_default' => false,
            'sort_order' => $maxSort + 1,
        ]);

        return response()->json($newAttribute);
    }
}
