<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StorePropertyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $details = $this->decodeJsonArray($this->input('details'));
        $areas = $this->decodeJsonArray($this->input('areas'));

        $images = $this->input('images', []);

        if (is_array($images)) {
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
        }

        $this->merge([
            'details' => $details,
            'areas' => $areas,
            'images' => $images,
        ]);
    }

    public function rules(): array
    {
        return [
            'details' => [
                'required',
                'array',
            ],

            'details.title' => [
                'required',
                'string',
            ],

            'details.caption' => [
                'required',
                'string',
            ],

            'details.price' => [
                'required',
                'string',
            ],

            'details.size' => [
                'required',
                'string',
            ],

            'images' => [
                'present',
                'array',
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

            'areas' => [
                'present',
                'array',
            ],

            'areas.*.name' => [
                'required',
                'string',
            ],

            'areas.*.polygon' => [
                'required',
                'array',
                'min:3',
            ],

            'areas.*.polygon.*.lat' => [
                'required',
                'numeric',
                'between:-90,90',
            ],

            'areas.*.polygon.*.lng' => [
                'required',
                'numeric',
                'between:-180,180',
            ],

            'areas.*.marker' => [
                'required',
                'array',
            ],

            'areas.*.marker.lat' => [
                'required',
                'numeric',
                'between:-90,90',
            ],

            'areas.*.marker.lng' => [
                'required',
                'numeric',
                'between:-180,180',
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

        $decoded = json_decode(
            $value,
            true
        );

        return is_array($decoded)
            ? $decoded
            : [];
    }
}