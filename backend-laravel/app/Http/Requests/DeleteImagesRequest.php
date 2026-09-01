<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Modules\Property\Models\Property;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class DeleteImagesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $property = $this->route('property');

        return [
            'imageIds' => [
                'required',
                'array',
                'min:1',
            ],

            'imageIds.*' => [
                'required',
                'integer',
                'distinct',

                $property instanceof Property
                    ? Rule::exists('images', 'id')->where('property_id', $property->getKey())
                    : Rule::exists('images', 'id'),
            ],
        ];
    }
}
