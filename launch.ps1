#!/usr/bin/env pwsh
# DevPossible.Ton Documentation Server Launcher
# Copyright (c) 2024 DevPossible, LLC

param(
    [int]$Port = 8080,
    [switch]$NoBrowser,
    [string]$Browser = "default"
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

Write-Info "========================================="
Write-Info "  DevPossible.Ton Documentation Server"
Write-Info "  © 2024 DevPossible, LLC"
Write-Info "========================================="
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) { throw }
    Write-Success "✓ Node.js detected: $nodeVersion"
} catch {
    Write-Error "✗ Node.js is not installed or not in PATH"
    Write-Host "  Please install Node.js from https://nodejs.org/"
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version 2>$null
    if ($LASTEXITCODE -ne 0) { throw }
    Write-Success "✓ npm detected: $npmVersion"
} catch {
    Write-Error "✗ npm is not installed or not in PATH"
    exit 1
}

# Check if npx is available
try {
    $npxVersion = npx --version 2>$null
    if ($LASTEXITCODE -ne 0) { throw }
    Write-Success "✓ npx detected: $npxVersion"
} catch {
    Write-Error "✗ npx is not available"
    exit 1
}

# Get the script's directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$docPath = Join-Path $scriptPath "doc-html"

# Verify doc-html folder exists
if (!(Test-Path $docPath)) {
    Write-Error "✗ Documentation folder not found: $docPath"
    exit 1
}

# Check if index.html exists
$indexPath = Join-Path $docPath "index.html"
if (!(Test-Path $indexPath)) {
    Write-Error "✗ index.html not found in: $docPath"
    exit 1
}

Write-Success "✓ Documentation folder found: $docPath"
Write-Host ""

# Find an available port if the default is in use
function Test-Port {
    param($Port)
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("127.0.0.1", $Port)
        $tcpClient.Close()
        return $true
    } catch {
        return $false
    }
}

$originalPort = $Port
while (Test-Port $Port) {
    Write-Warning "Port $Port is already in use"
    $Port++
    if ($Port -gt ($originalPort + 10)) {
        Write-Error "✗ Could not find an available port"
        exit 1
    }
}

$url = "http://localhost:$Port"

Write-Info "Starting documentation server..."
Write-Host "  Directory: $docPath"
Write-Host "  URL: $url"
Write-Host ""

# Launch browser after a short delay (unless -NoBrowser is specified)
if (!$NoBrowser) {
    $browserJob = Start-Job -ScriptBlock {
        param($url, $browser)
        Start-Sleep -Seconds 2

        if ($browser -eq "default") {
            Start-Process $url
        } else {
            Start-Process $browser -ArgumentList $url
        }
    } -ArgumentList $url, $Browser

    Write-Info "Browser will open automatically in 2 seconds..."
}

Write-Host ""
Write-Success "Server is starting on $url"
Write-Warning "Press Ctrl+C to stop the server"
Write-Host ""
Write-Host "----------------------------------------"
Write-Host ""

# Start the server using npx http-server
# Using http-server as it's a popular, simple static file server
try {
    # Change to doc-html directory and start server
    Push-Location $docPath

    # Run http-server with options:
    # -p: port
    # -c-1: disable caching
    # -o: open browser (disabled as we handle it ourselves)
    # --cors: enable CORS
    # -s: suppress log messages (we'll remove this for visibility)
    npx --yes http-server . -p $Port -c-1 --cors
} catch {
    Write-Error "✗ Failed to start server: $_"
} finally {
    Pop-Location

    # Clean up browser job if it exists
    if (!$NoBrowser -and $browserJob) {
        Stop-Job $browserJob -ErrorAction SilentlyContinue
        Remove-Job $browserJob -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Info "Server stopped"