<?php

declare(strict_types=1);

use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\AreaController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DetailsController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\ImageController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\PropertyController;
use App\Http\Middleware\EnsurePropertyVisible;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Auth
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::middleware('auth:web')->group(function (): void {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
});

/*
|--------------------------------------------------------------------------
| Property
|--------------------------------------------------------------------------
*/
Route::get('/properties', [PropertyController::class, 'index']);
Route::get('/property/{property}', [PropertyController::class, 'show'])->middleware(EnsurePropertyVisible::class);

/*
|--------------------------------------------------------------------------
| Details
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:web', 'admin'])->group(function (): void {
    Route::get('/admin/properties', [PropertyController::class, 'adminIndex']);
    Route::get('/activity', [ActivityController::class, 'index']);

    Route::post('/property', [PropertyController::class, 'store']);
    Route::delete('/property/{property}', [PropertyController::class, 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | Details
    |--------------------------------------------------------------------------
    */
    Route::patch('/property/{property}/details', [DetailsController::class, 'update']);

    /*
    |--------------------------------------------------------------------------
    | Location
    |--------------------------------------------------------------------------
    */
    Route::put('/property/{property}/location', [LocationController::class, 'update']);

    /*
    |--------------------------------------------------------------------------
    | Images
    |--------------------------------------------------------------------------
    */
    Route::post('/property/{property}/images', [ImageController::class, 'store']);
    Route::patch('/property/{property}/images', [ImageController::class, 'update']);
    Route::delete('/property/{property}/images', [ImageController::class, 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | Documents
    |--------------------------------------------------------------------------
    */
    Route::post('/property/{property}/documents', [DocumentController::class, 'store']);
    Route::put('/property/{property}/documents/{document}', [DocumentController::class, 'update']);
    Route::delete('/property/{property}/documents/{document}', [DocumentController::class, 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | Areas
    |--------------------------------------------------------------------------
    */
    Route::post('/property/{property}/area', [AreaController::class, 'store']);
    Route::put('/property/{property}/area/{area}/update', [AreaController::class, 'update']);
    Route::delete('/property/{property}/area/{area}/delete', [AreaController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| Areas
|--------------------------------------------------------------------------
*/
Route::get('/property/{property}/areas', [AreaController::class, 'index'])->middleware(EnsurePropertyVisible::class);
Route::get('/property/{property}/area/{area}', [AreaController::class, 'show'])->middleware(EnsurePropertyVisible::class);

// Anonymous event ingestion must not start a session or persist visitor identifiers.
Route::post('/analytics/events', [\App\Http\Controllers\Api\AnalyticsController::class, 'store'])
    ->withoutMiddleware(\Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class);
Route::get('/analytics/statistics', [\App\Http\Controllers\Api\AnalyticsController::class, 'statistics'])
    ->middleware(['auth:web', 'admin']);
