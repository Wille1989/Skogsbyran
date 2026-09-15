<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateLocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'postal_code' => $this->input('postal_code', $this->input('postalCode')),
            'country_code' => $this->input('country_code', $this->input('countryCode', 'SE')),
            'google_place_id' => $this->input('google_place_id', $this->input('googlePlaceId')),
        ]);
    }

    public function rules(): array
    {
        return [
            'address' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:32'],
            'city' => ['nullable', 'string', 'max:120'],
            'municipality' => ['nullable', 'string', 'max:120'],
            'country_code' => ['required', 'string', 'size:2'],
            'latitude' => ['required_with:longitude', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['required_with:latitude', 'nullable', 'numeric', 'between:-180,180'],
            'google_place_id' => ['nullable', 'string', 'max:255'],
            'pois' => ['present', 'array'],
            'pois.*.name' => ['required', 'string', 'max:120'],
            'pois.*.description' => ['nullable', 'string', 'max:1000'],
            'pois.*.latitude' => ['required', 'numeric', 'between:-90,90'],
            'pois.*.longitude' => ['required', 'numeric', 'between:-180,180'],
        ];
    }
}
