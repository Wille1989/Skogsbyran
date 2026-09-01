<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AreaController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\DetailsController;
use App\Http\Controllers\Api\ImageController;
use App\Http\Controllers\Api\PropertyController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Auth
|--------------------------------------------------------------------------
*/
Route::post('/auth/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Property
|--------------------------------------------------------------------------
*/
Route::get('/properties', [PropertyController::class, 'index']);
Route::get('/property/{property}', [PropertyController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Details
|--------------------------------------------------------------------------
*/
Route::middleware('admin.jwt')->group(function (): void {
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
Route::get('/property/{property}/areas', [AreaController::class, 'index']);
Route::get('/property/{property}/area/{area}', [AreaController::class, 'show']);
