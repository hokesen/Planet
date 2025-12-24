<?php

namespace App\Http\Requests\Mission;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMissionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'planet_id' => ['nullable', 'integer', 'exists:planets,id'],
            'planet_route' => ['sometimes', 'array', 'min:1'],
            'planet_route.*' => ['integer', 'exists:planets,id'],
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'string', 'in:todo,in_progress,completed,blocked,cancelled'],
            'priority' => ['sometimes', 'string', 'in:low,medium,high,critical'],
            'deadline' => ['nullable', 'date'],
            'is_recurring' => ['boolean'],
            'recurrence_pattern' => ['nullable', 'array'],
            'xp_value' => ['nullable', 'integer', 'min:0'],
            'time_commitment_minutes' => ['nullable', 'integer', 'min:1'],
            'commitment_type' => ['nullable', 'string', 'in:one_time,daily,weekly,monthly'],
            'counts_toward_capacity' => ['nullable', 'boolean'],
        ];
    }
}
