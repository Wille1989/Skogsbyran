<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('locations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('property_id')->unique()->constrained('properties')->cascadeOnDelete();
            $table->string('address')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('city')->nullable();
            $table->string('municipality')->nullable();
            $table->char('country_code', 2)->default('SE');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('google_place_id')->nullable();
            $table->timestamps();
        });

        Schema::create('location_areas', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('location_id')->constrained('locations')->cascadeOnDelete();
            $table->string('name');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['location_id', 'sort_order']);
        });

        Schema::create('area_points', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('area_id')->constrained('location_areas')->cascadeOnDelete();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->unsignedInteger('sort_order');
            $table->timestamps();

            $table->unique(['area_id', 'sort_order']);
        });

        Schema::create('location_pois', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('location_id')->constrained('locations')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('location_pois');
        Schema::dropIfExists('area_points');
        Schema::dropIfExists('location_areas');
        Schema::dropIfExists('locations');
    }
};
