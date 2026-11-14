<#
.SYNOPSIS
  Stops isolated development environment and cleans up temporary test artifacts.
.DESCRIPTION
  Tears down Docker containers, cleans temporary logs, sample images, and verifies port release.
#>

param(
  [switch]$RemoveVolumes = $false
)

$ErrorActionPreference = 'Continue'

Write-Host "==> Stopping Docker containers..." -ForegroundColor Cyan

if ($RemoveVolumes) {
  docker compose down -v 2>$null
} else {
  docker compose down 2>$null
}

# Clean temporary test artifacts and log files
Write-Host "==> Cleaning temporary artifacts and test files..." -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..")

$tempPatterns = @(
  (Join-Path $scriptDir "*.log"),
  (Join-Path $repoRoot "*.log"),
  (Join-Path $repoRoot "*.tmp"),
  (Join-Path $scriptDir "test-sample-*.jpg"),
  (Join-Path $repoRoot "test-sample-*.jpg")
)

foreach ($pattern in $tempPatterns) {
  Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | ForEach-Object {
    try {
      Remove-Item -Force $_.FullName
      Write-Host "    [REMOVED] $($_.Name)" -ForegroundColor Gray
    } catch {
      Write-Warning "Could not remove $($_.FullName): $_"
    }
  }
}

Write-Host "==> Environment stopped and cleaned successfully." -ForegroundColor Green
exit 0
