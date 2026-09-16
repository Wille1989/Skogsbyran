<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Modules\Property\Enums\ListingStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDetailsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return list<\Closure(\Illuminate\Validation\Validator): void> */
    public function after(): array
    {
        return [fn (\Illuminate\Validation\Validator $validator) => PublicationValidation::validate($this, $validator, '')];
    }

    protected function prepareForValidation(): void
    {
        $this->merge($this->normalizeDetails($this->all()));
    }

    public function rules(): array
    {
        return [
            ...PublicationValidation::rules(''),
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

            'price_whole_units' => [
                'sometimes',
                'nullable',
                'integer',
                'min:0',
            ],

            'size' => [
                'sometimes',
                'string',
                'max:50',
            ],

            'size_hectares' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
            ],

            'listing_status' => [
                'sometimes',
                Rule::enum(ListingStatus::class),
            ],

            'is_visible' => [
                'sometimes',
                'boolean',
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $details
     * @return array<string, mixed>
     */
    private function normalizeDetails(array $details): array
    {
        if (array_key_exists('listingStatus', $details)) {
            $details['listing_status'] = $details['listingStatus'];
            unset($details['listingStatus']);
        }

        if (array_key_exists('isVisible', $details)) {
            $details['is_visible'] = $details['isVisible'];
            unset($details['isVisible']);
        }

        if (array_key_exists('price', $details) && !array_key_exists('price_whole_units', $details)) {
            $details['price_whole_units'] = $this->wholeCurrencyUnits($details['price']);
        }

        if (array_key_exists('size', $details) && !array_key_exists('size_hectares', $details)) {
            $details['size_hectares'] = $this->decimalString($details['size']);
        }

        foreach (['publishAt' => 'publish_at', 'scheduledListingStatus' => 'scheduled_listing_status', 'scheduledStatusAt' => 'scheduled_status_at'] as $client => $column) {
            if (array_key_exists($client, $details)) {
                $details[$column] = $details[$client];
                unset($details[$client]);
            }
        }

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
