<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGlobalProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorized by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'position_id'        => 'required|exists:positions,id',
            'experience_years'   => 'required|decimal:0,2|min:0|max:40',
            'open_to_invitations'=> 'required|boolean',
            'skills'             => 'required|array|min:1',
            'skills.*.id'        => 'required|exists:skills,id',
            'skills.*.proficiency_level' => 'required|integer|between:1,5',
            'max_hours_per_week' => 'required|integer|in:10,20,30,40,50,60',
            'timezone'           => 'required|string|timezone',
        ];
    }
}
