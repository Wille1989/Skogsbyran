<?php

declare(strict_types=1);

use App\Modules\Property\Enums\ListingStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table): void {
            $table->string('slug')->nullable()->after('caption');
            $table->unsignedBigInteger('price_whole_units')->nullable()->after('price');
            $table->decimal('size_hectares', 10, 4)->nullable()->after('size');
            $table->string('listing_status', 32)->default(ListingStatus::Available->value)->after('size_hectares');
            $table->boolean('is_visible')->default(true)->after('listing_status');

            $table->unique('slug');
            $table->index('listing_status');
            $table->index('is_visible');
        });

        DB::table('properties')
            ->orderBy('id')
            ->select(['id', 'title', 'price', 'size'])
            ->each(function (object $property): void {
                DB::table('properties')
                    ->where('id', $property->id)
                    ->update([
                        'slug' => $this->uniqueSlug(
                            (string) $property->title,
                            (int) $property->id
                        ),
                        'price_whole_units' => $this->wholeCurrencyUnits($property->price),
                        'size_hectares' => $property->size,
                    ]);
            });
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table): void {
            $table->dropIndex(['is_visible']);
            $table->dropIndex(['listing_status']);
            $table->dropUnique(['slug']);
            $table->dropColumn([
                'slug',
                'price_whole_units',
                'size_hectares',
                'listing_status',
                'is_visible',
            ]);
        });
    }

    private function uniqueSlug(string $title, int $id): string
    {
        $base = Str::slug($title);

        if ($base === '') {
            $base = 'property';
        }

        return "{$base}-{$id}";
    }

    private function wholeCurrencyUnits(mixed $price): ?int
    {
        if ($price === null || $price === '') {
            return null;
        }

        return (int) round((float) $price);
    }
};
