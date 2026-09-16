<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table): void {
            $table->timestamp('publish_at')->nullable()->index();
            $table->string('scheduled_listing_status', 20)->nullable();
            $table->timestamp('scheduled_status_at')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table): void {
            $table->dropColumn(['publish_at', 'scheduled_listing_status', 'scheduled_status_at']);
        });
    }
};
