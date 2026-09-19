<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('login', function (Request $request): Limit {
            return Limit::perMinute(5)->by($request->ip() ?? 'unknown');
        });

        RateLimiter::for('contact', function (Request $request): array {
            return [
                Limit::perMinute(3)->by('contact-minute:'.($request->ip() ?? 'unknown')),
                Limit::perHour(10)->by('contact-hour:'.($request->ip() ?? 'unknown')),
                Limit::perHour(100)->by('contact-global'),
            ];
        });

        if (! app()->isLocal()) {
            return;
        }

        DB::listen(function (QueryExecuted $query): void {
            Log::debug('SQL', [
                'method' => request()->method(),
                'path' => request()->path(),
                'sql' => $query->sql,
                'bindings' => $query->bindings,
                'time_ms' => $query->time,
            ]);
        });
    }
}
