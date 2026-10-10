<?php

use App\Http\Requests\StoreBusinessRequest;
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
})->whereNumber('business');

Route::post('/businesses', function (StoreBusinessRequest $request) {
    $business = Business::create($request->validated());

    return response()->json($business, 201);
});
