$ErrorActionPreference = 'Stop'

function Write-Info($msg) {
  Write-Host "[INFO] $msg" -ForegroundColor Cyan
}

function Write-Ok($msg) {
  Write-Host "[OK]   $msg" -ForegroundColor Green
}

function Write-Warn($msg) {
  Write-Host "[WARN] $msg" -ForegroundColor Yellow
}

# Move to repo root (folder of this script -> parent)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Split-Path -Parent $scriptDir)

Write-Info "Project root: $(Get-Location)"

try {
  Write-Info "Stopping previous docker-compose (if any)"
  docker compose -f ./docker-compose.yml down --remove-orphans | Out-Null
  Write-Ok "Docker compose down completed"
} catch {
  Write-Warn "docker compose down failed or not needed: $($_.Exception.Message)"
}

Write-Info "Installing backend dependencies (npm ci)"
Push-Location ./backend
try {
  cmd /c npm ci | Out-Null
  Write-Ok "Backend dependencies installed"
} finally {
  Pop-Location
}

Write-Info "Installing frontend dependencies (npm ci)"
Push-Location ./frontend
try {
  cmd /c npm ci | Out-Null
  Write-Ok "Frontend dependencies installed"
} finally {
  Pop-Location
}

Write-Info "Starting docker-compose (dev)"
docker compose -f ./docker-compose.yml up -d --build | Out-Null
Write-Ok "Docker services are starting"

function Get-ComposeContainerIds($composeFile) {
  docker compose -f $composeFile ps -q
}

function Get-ContainerState($containerId) {
  $json = docker inspect --format '{{json .State}}' $containerId 2>$null
  if (-not $json) { return $null }
  try { return ($json | ConvertFrom-Json) } catch { return $null }
}

function Wait-For-ContainersReady($containerIds, $timeoutSec) {
  $deadline = (Get-Date).AddSeconds($timeoutSec)
  while ((Get-Date) -lt $deadline) {
    $allReady = $true
    foreach ($id in $containerIds) {
      $state = Get-ContainerState $id
      if (-not $state) { $allReady = $false; break }
      if ($state.Health) {
        if ($state.Health.Status -ne 'healthy') { $allReady = $false; break }
      } else {
        if ($state.Status -ne 'running') { $allReady = $false; break }
      }
    }
    if ($allReady) { return }
    Start-Sleep -Seconds 2
  }

  $states = @()
  foreach ($id in $containerIds) {
    $st = Get-ContainerState $id
    if ($st) {
      $h = if ($st.Health) { $st.Health.Status } else { '' }
      $s = $st.Status
      $states += "${id}: health=${h}; status=${s}"
    } else {
      $states += "${id}: state=<unavailable>"
    }
  }
  throw "Timeout waiting for containers ready: $($states -join ', ')"
}

Write-Info "Waiting for containers to become ready (health=healthy or status=running)"
$containerIds = @(Get-ComposeContainerIds ./docker-compose.yml)
if (-not $containerIds -or $containerIds.Count -eq 0) { throw "No containers found from docker compose" }
Wait-For-ContainersReady $containerIds 120
Write-Ok "All containers are ready"

Write-Info "Listing containers"
docker compose ps

Write-Ok "Dev environment is up."