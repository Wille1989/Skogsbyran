<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_events', function (Blueprint $table): void {
            $table->id();
            $table->enum('event_type', ['property_created', 'property_updated', 'images_uploaded', 'property_published', 'property_unpublished']);
            // Keep the activity when its property is permanently deleted.
            $table->foreignId('property_id')->nullable()->constrained('properties')->nullOnDelete();
            $table->timestamp('occurred_at');
            $table->timestamps();
            $table->index(['occurred_at', 'id']);
            $table->index(['property_id', 'event_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_events');
    }
};
