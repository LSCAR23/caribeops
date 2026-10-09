param(
    [string]$Action = "help"
)

function Show-Help {
    Write-Host "CaribeOps developer commands"
    Write-Host "  ./scripts/dev.ps1 up       Start all services in Docker Compose"
    Write-Host "  ./scripts/dev.ps1 down     Stop and remove containers"
    Write-Host "  ./scripts/dev.ps1 logs     Follow docker compose logs"
    Write-Host "  ./scripts/dev.ps1 status   Show running container status"
    Write-Host "  ./scripts/dev.ps1 test     Run basic smoke checks for all services"
}

switch ($Action.ToLowerInvariant()) {
    "help" { Show-Help }
    "up" { & docker compose up --build -d }
    "down" { & docker compose down -v }
    "logs" { & docker compose logs -f --tail=100 }
    "status" { & docker compose ps }
    "test" {
        Write-Host "Checking Laravel health..."
        & curl.exe -fsS http://localhost:8000/api/health | Out-Host

        Write-Host "Checking Go analytics health..."
        & curl.exe -fsS http://localhost:8080/health | Out-Host

        Write-Host "Checking Next.js server..."
        & curl.exe -fsSI http://localhost:3000 | Select-Object -First 1 | Out-Host
    }
    default {
        Write-Error "Unknown action '$Action'. Use 'help' to see available commands."
        exit 1
    }
}
