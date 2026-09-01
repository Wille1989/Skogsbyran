<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StoreAreaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:120',
            ],

            'polygon' => [
                'required',
                'array',
                'min:3',
            ],

            'polygon.*' => [
                'required',
                'array',
            ],

            'polygon.*.lat' => [
                'required',
                'numeric',
                'between:-90,90',
            ],

            'polygon.*.lng' => [
                'required',
                'numeric',
                'between:-180,180',
            ],

            'marker' => [
                'required',
                'array',
            ],

            'marker.lat' => [
                'required',
                'numeric',
                'between:-90,90',
            ],

            'marker.lng' => [
                'required',
                'numeric',
                'between:-180,180',
            ],
        ];
    }
}