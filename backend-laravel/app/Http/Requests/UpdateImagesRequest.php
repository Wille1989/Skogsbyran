<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateImagesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'images' => [
                'required',
                'array',
                'min:1',
            ],

            'images.*.imageId' => [
                'required',
                'integer',
                'exists:property_images,id',
            ],

            'images.*.position' => [
                'sometimes',
                'integer',
                'min:0',
            ],

            'images.*.isPrimary' => [
                'sometimes',
                'boolean',
            ],

            'images.*.details' => [
                'sometimes',
                'array',
            ],

            'images.*.details.caption' => [
                'sometimes',
                'string',
            ],

            'images.*.details.altText' => [
                'sometimes',
                'string',
            ],

            'images.*.adjustments' => [
                'sometimes',
                'array',
            ],

            'images.*.adjustments.brightness' => [
                'sometimes',
                'numeric',
                'between:0,5',
            ],

            'images.*.adjustments.saturation' => [
                'sometimes',
                'numeric',
                'between:0,5',
            ],

            'images.*.adjustments.contrast' => [
                'sometimes',
                'numeric',
                'between:0,5',
            ],

            'images.*.adjustments.gamma' => [
                'sometimes',
                'numeric',
                'between:0,5',
            ],
        ];
    }
}