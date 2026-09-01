<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Modules\Property\Enums\ListingStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
        $details = $this->normalizeDetails($details);

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

            'details.price_whole_units' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'details.size' => [
                'required',
                'string',
            ],

            'details.size_hectares' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'details.listing_status' => [
                'required',
                Rule::enum(ListingStatus::class),
            ],

            'details.is_visible' => [
                'required',
                'boolean',
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

    /**
     * @param  array<string, mixed>  $details
     * @return array<string, mixed>
     */
    private function normalizeDetails(array $details): array
    {
        $details['listing_status'] = $details['listing_status']
            ?? $details['listingStatus']
            ?? ListingStatus::Available->value;

        $details['is_visible'] = $details['is_visible']
            ?? $details['isVisible']
            ?? true;

        $details['price_whole_units'] = $details['price_whole_units']
            ?? $this->wholeCurrencyUnits($details['price'] ?? null);

        $details['size_hectares'] = $details['size_hectares']
            ?? $this->decimalString($details['size'] ?? null);

        return $details;
    }

    private function wholeCurrencyUnits(mixed $value): ?int
    {
        if (!is_scalar($value)) {
            return null;
        }

        $normalized = preg_replace('/[^\d]/', '', (string) $value);

        if ($normalized === null || $normalized === '') {
            return null;
        }

        return (int) $normalized;
    }

    private function decimalString(mixed $value): ?string
    {
        if (!is_scalar($value)) {
            return null;
        }

        $normalized = str_replace(',', '.', trim((string) $value));
        $normalized = preg_replace('/\s+/', '', $normalized);

        if ($normalized === null || $normalized === '') {
            return null;
        }

        return is_numeric($normalized)
            ? $normalized
            : null;
    }
}
