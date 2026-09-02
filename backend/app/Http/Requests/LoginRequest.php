<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validate the incoming login payload.
 */
class LoginRequest extends FormRequest
{
    /**
     * Allow guests to submit login requests.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Define the validation rules for login.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:1'],
        ];
    }
}
