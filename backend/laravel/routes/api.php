<?php

use App\Models\Business;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
    ]);
});

Route::get('/businesses', function () {
    return response()->json(Business::query()->orderBy('id')->paginate());
});

Route::get('/businesses/{business}', function (Business $business) {
    return response()->json($business);
});
