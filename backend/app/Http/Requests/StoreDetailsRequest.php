<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validate property detail creation.
 */
class StorePropertyDetailsRequest extends FormRequest
{
    /**
     * Allow the request to proceed.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validation rules for property details.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:150'],
            'caption' => ['nullable', 'string', 'max:700'],
            'price' => ['nullable', 'numeric'],
            'size' => ['nullable', 'numeric'],
        ];
    }
}
