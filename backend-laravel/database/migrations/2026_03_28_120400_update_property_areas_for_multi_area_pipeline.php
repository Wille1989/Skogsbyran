<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('property_areas', function (Blueprint $table) {
            $table->dropUnique(['property_id']);
            $table->string('name')->default('Område 1')->after('property_id');
            $table->decimal('marker_lat', 10, 7)->nullable()->after('area_json');
            $table->decimal('marker_lng', 10, 7)->nullable()->after('marker_lat');
            $table->decimal('area_square_meters', 14, 2)->default(0)->after('marker_lng');
        });
    }

    public function down(): void
    {
        Schema::table('property_areas', function (Blueprint $table) {
            $table->dropColumn([
                'name',
                'marker_lat',
                'marker_lng',
                'area_square_meters',
            ]);
            $table->unique('property_id');
        });
    }
};

