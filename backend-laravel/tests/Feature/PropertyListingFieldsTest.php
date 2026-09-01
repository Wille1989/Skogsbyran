<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Property\Enums\ListingStatus;
use App\Modules\Property\Models\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class PropertyListingFieldsTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_stores_listing_fields_and_generates_unique_slugs(): void
    {
        $first = Property::query()->create([
            'title' => 'Skogsgard i Dalarna',
            'caption' => 'Forsta objektet',
            'price_whole_units' => 3_500_000,
            'size_hectares' => '135.2500',
            'listing_status' => ListingStatus::Bidding,
            'is_visible' => false,
        ]);

        $second = Property::query()->create([
            'title' => 'Skogsgard i Dalarna',
            'caption' => 'Andra objektet',
            'listing_status' => ListingStatus::Available,
            'is_visible' => true,
        ]);

        $this->assertSame('skogsgard-i-dalarna', $first->slug);
        $this->assertSame('skogsgard-i-dalarna-2', $second->slug);
        $this->assertSame(ListingStatus::Bidding, $first->listing_status);
        $this->assertFalse($first->is_visible);

        $this->assertDatabaseHas('properties', [
            'id' => $first->id,
            'price_whole_units' => 3_500_000,
            'size_hectares' => '135.25',
            'listing_status' => 'bidding',
            'is_visible' => false,
        ]);
    }

    public function test_public_property_collection_uses_visibility_independently_from_listing_status(): void
    {
        Property::query()->create([
            'title' => 'Visible sold property',
            'caption' => 'Should be public',
            'listing_status' => ListingStatus::Sold,
            'is_visible' => true,
        ]);

        Property::query()->create([
            'title' => 'Hidden available property',
            'caption' => 'Should not be public',
            'listing_status' => ListingStatus::Available,
            'is_visible' => false,
        ]);

        $this->getJson('/properties')
            ->assertOk()
            ->assertJsonCount(1, 'properties')
            ->assertJsonPath('properties.0.details.title', 'Visible sold property')
            ->assertJsonPath('properties.0.details.listingStatus', 'sold')
            ->assertJsonPath('properties.0.details.isVisible', true);
    }
}
