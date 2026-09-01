<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StoreImagesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $images = $this->input('images', []);

        if (!is_array($images)) {
            return;
        }

        foreach ($images as $index => $image) {
            if (!is_array($image)) {
                continue;
            }

            $images[$index]['details'] = $this->decodeJsonArray(
                $image['details'] ?? null
            );

            $images[$index]['adjustments'] = $this->decodeJsonArray(
                $image['adjustments'] ?? null
            );
        }

        $this->merge([
            'images' => $images,
        ]);
    }

    public function rules(): array
    {
        return [
            'images' => [
                'required',
                'array',
                'min:1',
            ],

            'images.*.file' => [
                'required',
                'file',
                'image',
            ],

            'images.*.position' => [
                'required',
                'integer',
                'min:0',
            ],

            'images.*.isPrimary' => [
                'required',
                'boolean',
            ],

            'images.*.details' => [
                'required',
                'array',
            ],

            'images.*.details.caption' => [
                'present',
                'string',
            ],

            'images.*.details.altText' => [
                'present',
                'string',
            ],

            'images.*.adjustments' => [
                'required',
                'array',
            ],

            'images.*.adjustments.brightness' => [
                'required',
                'numeric',
                'between:0,5',
            ],

            'images.*.adjustments.saturation' => [
                'required',
                'numeric',
                'between:0,5',
            ],

            'images.*.adjustments.contrast' => [
                'required',
                'numeric',
                'between:0,5',
            ],

            'images.*.adjustments.gamma' => [
                'required',
                'numeric',
                'between:0,5',
            ],
        ];
    }

    private function decodeJsonArray(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }

        if (!is_string($value) || $value === '') {
            return [];
        }

        $decoded = json_decode($value, true);

        return is_array($decoded) ? $decoded : [];
    }
}