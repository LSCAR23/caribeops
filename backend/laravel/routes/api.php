<?php

use App\Http\Requests\StoreBusinessRequest;
use App\Http\Resources\BusinessResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ReviewResource;
use App\Models\Business;
use App\Models\Category;
use App\Models\Review;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
    ]);
});

Route::get('/categories', function () {
    return CategoryResource::collection(Category::orderBy('name')->get());
});

Route::get('/dashboard/summary', function () {
    $averageRating = Review::avg('rating');

    return response()->json([
        'data' => [
            'total_businesses' => Business::count(),
            'total_reviews' => Review::count(),
            'average_rating' => $averageRating === null ? null : (float) $averageRating,
            'new_businesses' => Business::where('created_at', '>=', now()->subDays(7))->count(),
        ],
    ]);
});

Route::get('/businesses', function () {
    return BusinessResource::collection(Business::query()->with('category')->withAvg('reviews', 'rating')->orderBy('id')->paginate());
});

Route::get('/businesses/{business}', function (Business $business) {
    return new BusinessResource($business);
})->whereUuid('business');

Route::get('/businesses/{business}/reviews', function (Business $business) {
    return ReviewResource::collection($business->reviews()->orderByDesc('review_date')->get());
})->whereUuid('business');

Route::post('/businesses', function (StoreBusinessRequest $request) {
    $business = Business::create($request->validated());

    return (new BusinessResource($business))->response()->setStatusCode(201);
});

Route::put('/businesses/{business}', function (StoreBusinessRequest $request, Business $business) {
    $business->update($request->validated());

    return new BusinessResource($business->refresh());
})->whereUuid('business');

Route::delete('/businesses/{business}', function (Business $business) {
    $business->delete();

    return response()->noContent();
})->whereUuid('business');
