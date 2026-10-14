param([string]$Target = "test")

switch ($Target) {
  "test" {
    Push-Location backend/laravel; php artisan test --compact; if ($LASTEXITCODE) { exit 1 }; Pop-Location
    Push-Location analytics/go; $env:DATABASE_URL=''; go test -count=1 ./...; if ($LASTEXITCODE) { exit 1 }; Pop-Location
    Push-Location frontend/next; npm test; if ($LASTEXITCODE) { exit 1 }; Pop-Location
  }
  "test-e2e" {
    if (-not $env:E2E_EMAIL -or -not $env:E2E_PASSWORD) { Write-Error "Exporta E2E_EMAIL y E2E_PASSWORD primero"; exit 1 }
    Push-Location frontend/next; npm run test:e2e; if ($LASTEXITCODE) { exit 1 }; Pop-Location
  }
  "smoke" {
    curl.exe -fsS http://localhost:8000/api/health; Write-Host ""
    curl.exe -fsS http://localhost:8080/health; Write-Host ""
    curl.exe -fsSI http://localhost:3000 | Select-Object -First 1
  }
  default { Write-Output "Uso: .\test.ps1 [test|test-e2e|smoke]" }
}
