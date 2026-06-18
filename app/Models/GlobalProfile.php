<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class GlobalProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'position_id',
        'experience_years',
        'open_to_invitations',
    ];

    protected function casts(): array
    {
        return [
            'experience_years'    => 'decimal:2',
            'open_to_invitations' => 'boolean',
        ];
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * Get the user (authentication record) that owns this passport.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the developer's primary position (from the positions lookup table).
     */
    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    /**
     * Get all skills on this developer's passport.
     *
     * withPivot('proficiency_level') exposes the rating column to Eloquent,
     * which is what the Python ML API will consume as the Cosine Similarity matrix.
     *
     * Example query that feeds the ML engine:
     *   GlobalProfile::with('skills')->get()
     *   -> each $profile->skills contains pivot->proficiency_level
     */
    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'global_profile_skill')
            ->withPivot('proficiency_level')
            ->withTimestamps();
    }
}
