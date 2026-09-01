<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDetailsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => [
                'sometimes',
                'string',
                'max:150',
            ],

            'caption' => [
                'sometimes',
                'string',
            ],

            'price' => [
                'sometimes',
                'string',
                'max:50',
            ],

            'size' => [
                'sometimes',
                'string',
                'max:50',
            ],
        ];
    }
}
