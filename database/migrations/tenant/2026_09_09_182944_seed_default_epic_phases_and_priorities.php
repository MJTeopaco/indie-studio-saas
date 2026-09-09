<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tenantId = tenant('id') ?? 'default';

        // 1. Add nullable columns first so we can backfill
        Schema::table('epics', function (Blueprint $table) {
            if (!Schema::hasColumn('epics', 'phase_id')) {
                $table->unsignedBigInteger('phase_id')->nullable()->after('color');
            }
            if (!Schema::hasColumn('epics', 'priority_id')) {
                $table->unsignedBigInteger('priority_id')->nullable()->after('phase_id');
            }
        });

        // 2. Insert defaults
        $phases = [
            ['label' => 'Backlog', 'color' => '#6b7280', 'is_default' => true, 'sort_order' => 1],
            ['label' => 'Product Discovery', 'color' => '#f59e0b', 'is_default' => true, 'sort_order' => 2],
            ['label' => 'Ready to Design', 'color' => '#8b5cf6', 'is_default' => true, 'sort_order' => 3],
            ['label' => 'Design WIP', 'color' => '#ec4899', 'is_default' => true, 'sort_order' => 4],
            ['label' => 'Dev Discovery', 'color' => '#3b82f6', 'is_default' => true, 'sort_order' => 5],
            ['label' => 'Dev Discovery Done', 'color' => '#06b6d4', 'is_default' => true, 'sort_order' => 6],
            ['label' => 'Dev WIP', 'color' => '#10b981', 'is_default' => true, 'sort_order' => 7],
            ['label' => 'Dev Deploy', 'color' => '#84cc16', 'is_default' => true, 'sort_order' => 8],
            ['label' => 'Beta', 'color' => '#f97316', 'is_default' => true, 'sort_order' => 9],
            ['label' => 'Full Release', 'color' => '#22c55e', 'is_default' => true, 'sort_order' => 10],
        ];

        $now = now();
        $phaseIds = [];
        foreach ($phases as $p) {
            $id = DB::table('epic_phases')->insertGetId([
                'tenant_id' => $tenantId,
                'label' => $p['label'],
                'color' => $p['color'],
                'is_default' => $p['is_default'],
                'sort_order' => $p['sort_order'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $phaseIds[$p['label']] = $id;
        }

        $priorities = [
            ['label' => 'Critical', 'color' => '#ef4444', 'is_default' => true, 'sort_order' => 1],
            ['label' => 'Must Have', 'color' => '#3b82f6', 'is_default' => true, 'sort_order' => 2],
            ['label' => 'Nice to Have', 'color' => '#a855f7', 'is_default' => true, 'sort_order' => 3],
            ['label' => 'Best Effort', 'color' => '#6b7280', 'is_default' => true, 'sort_order' => 4],
        ];

        $priorityIds = [];
        foreach ($priorities as $p) {
            $id = DB::table('epic_priorities')->insertGetId([
                'tenant_id' => $tenantId,
                'label' => $p['label'],
                'color' => $p['color'],
                'is_default' => $p['is_default'],
                'sort_order' => $p['sort_order'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $priorityIds[$p['label']] = $id;
        }

        // 3. Backfill epics
        if (Schema::hasColumn('epics', 'status')) {
            $epics = DB::table('epics')->get();
            foreach ($epics as $epic) {
                $phaseId = null;
                if ($epic->status === 'backlog') {
                    $phaseId = $phaseIds['Backlog'];
                } elseif ($epic->status === 'open') {
                    $phaseId = $phaseIds['Product Discovery'];
                }

                DB::table('epics')->where('id', $epic->id)->update([
                    'phase_id' => $phaseId,
                    'priority_id' => $priorityIds['Must Have'], // Sensible default
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tenantId = tenant('id') ?? 'default';

        DB::table('epics')->update([
            'phase_id' => null,
            'priority_id' => null,
        ]);

        DB::table('epic_phases')->where('tenant_id', $tenantId)->delete();
        DB::table('epic_priorities')->where('tenant_id', $tenantId)->delete();

        Schema::table('epics', function (Blueprint $table) {
            if (Schema::hasColumn('epics', 'phase_id')) {
                $table->dropColumn('phase_id');
            }
            if (Schema::hasColumn('epics', 'priority_id')) {
                $table->dropColumn('priority_id');
            }
        });
    }
};
