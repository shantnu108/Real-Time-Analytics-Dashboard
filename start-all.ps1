$PROJECT_ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Checking Docker status..."

# Check Docker Desktop process
$dockerProcess = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue

if (-not $dockerProcess) {
    Write-Host ""
    Write-Host "❌ Docker Desktop is NOT running."
    Write-Host "Open Docker Desktop manually and wait until it says 'Docker is running'."
    Write-Host "Then run this script again."
    Write-Host ""
    exit
}

# Check Docker Engine
try {
    docker ps > $null 2>&1
}
catch {
    Write-Host ""
    Write-Host "❌ Docker Engine is NOT ready yet."
    Write-Host "Wait for Docker Desktop to fully start."
    Write-Host ""
    exit
}

Write-Host "✅ Docker is running and ready."

# Start containers
Write-Host "Starting services..."
Start-Process cmd -ArgumentList "/c cd /d `"$PROJECT_ROOT`" && docker-compose up --build"

Start-Sleep -Seconds 10

# Start load generator
$LOADGEN = Join-Path $PROJECT_ROOT "loadgen"

if (Test-Path $LOADGEN) {
    Write-Host "Starting load generator..."
    Start-Process cmd -ArgumentList "/c cd /d `"$LOADGEN`" && node load.js"
}

Start-Sleep -Seconds 5

# Open URLs
Start-Process "http://localhost:4000/health"
Start-Process "http://localhost:3000/"
