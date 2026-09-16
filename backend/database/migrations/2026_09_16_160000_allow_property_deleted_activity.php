<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const ORIGINAL_TYPES = ['property_created', 'property_updated', 'images_uploaded', 'property_published', 'property_unpublished'];

    public function up(): void
    {
        $this->changeTypes([...self::ORIGINAL_TYPES, 'property_deleted']);
    }

    public function down(): void
    {
        if (DB::table('activity_events')->where('event_type', 'property_deleted')->exists()) {
            throw new RuntimeException('Cannot remove property_deleted while deletion activities exist.');
        }
        $this->changeTypes(self::ORIGINAL_TYPES);
    }

    /** @param list<string> $types */
    private function changeTypes(array $types): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE activity_events DROP CONSTRAINT activity_events_event_type_check');
            $allowed = implode(', ', array_map(static fn (string $type): string => "'".$type."'", $types));
            DB::statement('ALTER TABLE activity_events ADD CONSTRAINT activity_events_event_type_check CHECK (event_type IN ('.$allowed.'))');
            return;
        }
        Schema::table('activity_events', function (Blueprint $table) use ($types): void {
            $table->enum('event_type', $types)->change();
        });
    }
};
