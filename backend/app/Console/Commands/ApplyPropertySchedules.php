<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\PropertyPublicationService;
use Illuminate\Console\Command;

final class ApplyPropertySchedules extends Command
{
    protected $signature = 'properties:apply-schedules';

    protected $description = 'Apply due property publication and listing status schedules';

    public function handle(PropertyPublicationService $service): int
    {
        $this->info('Applied schedules for '.$service->applyDue().' properties.');

        return self::SUCCESS;
    }
}
