<?php

use App\Http\Requests\LoginRequest;
use App\Http\Requests\StoreBusinessRequest;
use App\Http\Requests\StoreReviewRequest;
use App\Http\Resources\BusinessResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ReviewResource;
use App\Models\Business;
use App\Models\Category;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;

Route::post('/login', function (LoginRequest $request) {
    $credentials = $request->validated();

    if (! Auth::attempt($credentials)) {
        throw ValidationException::withMessages([
            'email' => 'These credentials do not match our records.',
        ]);
    }

    return response()->json([
        'token' => $request->user()->createToken('api')->plainTextToken,
    ]);
})->middleware('throttle:login');

Route::post('/logout', function (Request $request) {
    $request->user()->currentAccessToken()->delete();

    return response()->noContent();
})->middleware('auth:sanctum');

Route::get('/me', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
    ]);
})->middleware('throttle:reads');

Route::get('/categories', function () {
    return CategoryResource::collection(Category::orderBy('name')->get());
})->middleware('throttle:reads');

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
})->middleware('throttle:reads');

Route::get('/businesses', function (Request $request) {
    $businesses = Business::query()
        ->with('category')
        ->withAvg('reviews', 'rating')
        ->when($request->query('category'), fn ($query, $category) => $query->whereHas('category', fn ($q) => $q->where('slug', $category)))
        ->when($request->query('search'), fn ($query, $search) => $query->where('name', 'ilike', '%'.$search.'%'))
        ->orderBy('id')
        ->paginate();

    return BusinessResource::collection($businesses);
})->middleware('throttle:reads');

Route::get('/businesses/{business}', function (Business $business) {
    return new BusinessResource($business->load(['user', 'amenities', 'reviews' => fn ($query) => $query->orderByDesc('review_date')]));
})->whereUuid('business')->middleware('throttle:reads');

Route::get('/businesses/{business}/amenities', function (Business $business) {
    return $business->amenities()->get()->pluck('name');
})->whereUuid('business')->middleware('throttle:reads');

Route::get('/businesses/{business}/reviews', function (Business $business) {
    return ReviewResource::collection($business->reviews()->orderByDesc('review_date')->get());
})->whereUuid('business')->middleware('throttle:reads');

Route::post('/businesses/{business}/reviews', function (StoreReviewRequest $request, Business $business) {
    $review = $business->reviews()->create([
        ...$request->validated(),
        'review_date' => now()->toDateString(),
    ]);

    return (new ReviewResource($review))->response()->setStatusCode(201);
})->whereUuid('business')->middleware('auth:sanctum');

Route::post('/businesses', function (StoreBusinessRequest $request) {
    $business = $request->user()->businesses()->create($request->validated());

    return (new BusinessResource($business))->response()->setStatusCode(201);
})->middleware(['auth:sanctum', 'can:create,App\Models\Business']);

Route::put('/businesses/{business}', function (StoreBusinessRequest $request, Business $business) {
    $business->update($request->validated());

    return new BusinessResource($business->refresh());
})->whereUuid('business')->middleware(['auth:sanctum', 'can:update,business']);

Route::delete('/businesses/{business}', function (Business $business) {
    $business->delete();

    return response()->noContent();
})->whereUuid('business')->middleware(['auth:sanctum', 'can:delete,business']);
