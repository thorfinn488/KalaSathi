<#
.SYNOPSIS
  Starts isolated development environment (PostgreSQL 17 and Redis 7) for KalaSaathi.
.DESCRIPTION
  Safely provisions local services using Docker without hardcoded credentials.
  Uses environment variables or generates ephemeral session secrets.
#>

param(
  [int]$PgPort = 5432,
  [int]$RedisPort = 6379,
  [switch]$WithApi = $false
)

$ErrorActionPreference = 'Stop'

Write-Host "==> Checking prerequisites..." -ForegroundColor Cyan

# 1. Check Docker availability
try {
  $null = docker info 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Docker daemon is not running or not accessible."
  }
} catch {
  Write-Error "Prerequisite failed: Docker must be installed and running. $($_.Exception.Message)"
  exit 1
}

# 2. Configure credentials securely (never hardcoded)
if ([string]::IsNullOrWhiteSpace($env:DB_PASSWORD)) {
  $env:DB_PASSWORD = "dev_password_" + [Guid]::NewGuid().ToString('N').Substring(0, 12)
  Write-Host "    [INFO] Generated ephemeral DB_PASSWORD for local container." -ForegroundColor Gray
}

if ([string]::IsNullOrWhiteSpace($env:JWT_SECRET) -or $env:JWT_SECRET.Length -lt 32) {
  $env:JWT_SECRET = [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
  Write-Host "    [INFO] Generated ephemeral JWT_SECRET (64 characters)." -ForegroundColor Gray
}

$env:DB_USERNAME = if ([string]::IsNullOrWhiteSpace($env:DB_USERNAME)) { "kalasathi" } else { $env:DB_USERNAME }
$env:POSTGRES_DB = if ([string]::IsNullOrWhiteSpace($env:POSTGRES_DB)) { "kalasathi" } else { $env:POSTGRES_DB }

Write-Host "==> Starting containers..." -ForegroundColor Cyan

if ($WithApi) {
  docker compose up -d --build
} else {
  docker compose up -d postgres redis
}

if ($LASTEXITCODE -ne 0) {
  Write-Error "Failed to start containers with docker compose."
  exit $LASTEXITCODE
}

Write-Host "==> Waiting for service health checks..." -ForegroundColor Cyan
$timeoutSec = 45
$elapsed = 0

while ($elapsed -lt $timeoutSec) {
  $pgHealthy = (docker inspect --format='{{json .State.Health.Status}}' (docker compose ps -q postgres 2>$null) 2>$null) -replace '"',''
  $redisHealthy = (docker inspect --format='{{json .State.Health.Status}}' (docker compose ps -q redis 2>$null) 2>$null) -replace '"',''

  if ($pgHealthy -eq 'healthy' -and $redisHealthy -eq 'healthy') {
    Write-Host "==> All services are healthy and ready!" -ForegroundColor Green
    Write-Host "    PostgreSQL: localhost:$PgPort (User: $($env:DB_USERNAME), DB: $($env:POSTGRES_DB))"
    Write-Host "    Redis:      localhost:$RedisPort"
    exit 0
  }

  Start-Sleep -Seconds 2
  $elapsed += 2
  Write-Host "    Waiting for services to become healthy ($elapsed/$timeoutSec s)..." -ForegroundColor Gray
}

Write-Warning "Timed out waiting for health checks. Inspect logs with 'docker compose logs'."
exit 1
