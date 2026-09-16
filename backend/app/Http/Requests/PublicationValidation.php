<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Modules\Property\Enums\ListingStatus;
use App\Modules\Property\Models\Property;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Validator;

final class PublicationValidation
{
    /** @return array<string, list<string|Enum>> */
    public static function rules(string $prefix = ''): array
    {
        return [
            $prefix.'publish_at' => ['sometimes', 'nullable', 'date_format:Y-m-d\TH:i:s.v\Z'],
            $prefix.'scheduled_listing_status' => ['sometimes', 'nullable', Rule::enum(ListingStatus::class)],
            $prefix.'scheduled_status_at' => ['sometimes', 'nullable', 'date_format:Y-m-d\TH:i:s.v\Z'],
        ];
    }

    /** Validate the paired schedule fields after ordinary field validation. */
    public static function validate(FormRequest $request, Validator $validator, string $prefix = ''): void
    {
        if ($validator->errors()->isNotEmpty()) {
            return;
        }

        $property = $request->route('property');
        $visible = $request->exists($prefix.'is_visible')
            ? $request->boolean($prefix.'is_visible')
            : ($property instanceof Property ? $property->is_visible : true);
        if ($visible && $request->filled($prefix.'publish_at')) {
            $validator->errors()->add($prefix.'publish_at', 'En publicerad fastighet kan inte schemaläggas för publicering.');
        }

        $statusKey = $prefix.'scheduled_listing_status';
        $timeKey = $prefix.'scheduled_status_at';
        if ($request->exists($statusKey) || $request->exists($timeKey)) {
            if (! $request->exists($statusKey) || ! $request->exists($timeKey)
                || $request->filled($statusKey) !== $request->filled($timeKey)) {
                $validator->errors()->add($timeKey, 'Skicka både framtida status och tid, eller null för båda för att avbryta.');
            }
        }

        foreach (['publish_at', 'scheduled_status_at'] as $field) {
            if (! $request->filled($prefix.$field)) {
                continue;
            }
            $date = CarbonImmutable::parse($request->string($prefix.$field)->toString());
            $existing = $property instanceof Property ? $property->getAttribute($field) : null;
            // An unchanged schedule may already be due while the scheduler catches up.
            if ($date->isPast() && ! ($existing instanceof CarbonImmutable && $date->equalTo($existing))) {
                $validator->errors()->add($prefix.$field, 'Välj en tidpunkt i framtiden.');
            }
        }
    }
}
