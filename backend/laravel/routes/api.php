<?php

use App\Http\Requests\StoreBusinessRequest;
use App\Http\Resources\BusinessResource;
use App\Models\Business;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
    ]);
});

Route::get('/businesses', function () {
    return BusinessResource::collection(Business::query()->orderBy('id')->paginate());
});

Route::get('/businesses/{business}', function (Business $business) {
    return new BusinessResource($business);
})->whereNumber('business');

Route::post('/businesses', function (StoreBusinessRequest $request) {
    $business = Business::create($request->validated());

    return (new BusinessResource($business))->response()->setStatusCode(201);
});

Route::put('/businesses/{business}', function (StoreBusinessRequest $request, Business $business) {
    $business->update($request->validated());

    return new BusinessResource($business->refresh());
})->whereNumber('business');

Route::delete('/businesses/{business}', function (Business $business) {
    $business->delete();

    return response()->noContent();
})->whereNumber('business');
