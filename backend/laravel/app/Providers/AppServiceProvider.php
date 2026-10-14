<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
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
        // Brute-force brake for credential guessing (D6-18): keyed by
        // email+IP so shared IPs and distinct users never punish
        // each other. Suite ceiling is 2 same-email logins per test.
        RateLimiter::for('login', function (Request $request): Limit {
            return Limit::perMinute(10)->by($request->input('email').'|'.$request->ip());
        });

        // Flood brake for cheap public reads (D6-18): per-IP bucket,
        // generous enough that the suite (≤5 same-route GETs per test,
        // fresh app per test) never trips its own guard.
        RateLimiter::for('reads', function (Request $request): Limit {
            return Limit::perMinute(60)->by($request->ip());
        });
    }
}
