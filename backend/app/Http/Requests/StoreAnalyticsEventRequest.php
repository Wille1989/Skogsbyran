<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Modules\Analytics\Enums\EventType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Rules\Exists;
use Illuminate\Validation\Validator;

final class StoreAnalyticsEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<string|Enum|Exists>> */
    public function rules(): array
    {
        return [
            'event_type' => ['required', Rule::enum(EventType::class)],
            'property_id' => ['required_unless:event_type,visitor', 'prohibited_if:event_type,visitor', 'nullable', 'integer', Rule::exists('properties', 'id')->where('is_visible', true)],
            // The image lookup is scoped to the submitted property.
            'image_id' => ['required_if:event_type,image_click', 'prohibited_unless:event_type,image_click', 'nullable', 'integer', Rule::exists('images', 'id')->where('property_id', $this->integer('property_id'))],
        ];
    }

    /** @return list<\Closure(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if (array_diff(array_keys($this->all()), ['event_type', 'property_id', 'image_id']) !== []) {
                $validator->errors()->add('event', 'Only event_type, property_id and image_id are allowed.');
            }
        }];
    }

    public function eventType(): EventType
    {
        return EventType::from($this->string('event_type')->toString());
    }
}
