<?php

namespace App\Http\Requests\Mission;

use Illuminate\Foundation\Http\FormRequest;

class StoreMissionRequest extends FormRequest
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
            'planet_id' => ['required', 'integer', 'exists:planets,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'string', 'in:pending,in_progress,completed,blocked'],
            'priority' => ['required', 'string', 'in:low,medium,high,critical'],
            'deadline' => ['nullable', 'date'],
            'is_recurring' => ['boolean'],
            'recurrence_pattern' => ['nullable', 'array'],
            'xp_value' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
