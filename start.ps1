# One-command local launcher for FoodRescue AI (FastAPI + Next.js)
Write-Host "Starting FoodRescue AI..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# Load .env variables into process environment
$envFile = Join-Path $root ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and !$line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
        }
    }
}

# 1. Start FastAPI service on port 8000
$apiDir = Join-Path $root "services\api"
$apiJob = Start-Process -FilePath "python" -ArgumentList @("-m", "uvicorn", "app.main:app", "--app-dir", "`"$apiDir`"", "--port", "8000") -PassThru -NoNewWindow

# 2. Start Next.js web app on port 3000
Write-Host "FastAPI running on http://localhost:8000 (PID $($apiJob.Id))" -ForegroundColor Green
Write-Host "Starting Next.js web app on http://localhost:3000 ..." -ForegroundColor Green

try {
    npm --prefix "$root\apps\web" run start
}
finally {
    if ($apiJob -and !$apiJob.HasExited) {
        Stop-Process -Id $apiJob.Id -Force
    }
}
