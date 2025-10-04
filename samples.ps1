#!/usr/bin/env pwsh
<#
.SYNOPSIS
    DevPossible.Ton Sample Programs Launcher
.DESCRIPTION
    Interactive launcher for DevPossible.Ton sample programs across all languages
.NOTES
    Copyright (c) 2024 DevPossible, LLC
#>

function Show-Menu {
    Clear-Host
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "  DevPossible.Ton Sample Programs Launcher  " -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Select a language to run sample programs:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  1. C# Samples (.NET 8.0)" -ForegroundColor Green
    Write-Host "  2. JavaScript Samples (Node.js)" -ForegroundColor Green
    Write-Host "  3. Python Samples (Python 3.x)" -ForegroundColor Green
    Write-Host ""
    Write-Host "  0. Exit" -ForegroundColor Red
    Write-Host ""
}

function Run-CSharpSamples {
    Write-Host ""
    Write-Host "Launching C# Samples..." -ForegroundColor Cyan
    Write-Host ""
    
    $originalLocation = Get-Location
    try {
        Set-Location "src/CSharp/DevPossible.Ton.Samples"
        
        # Check if dotnet is available
        if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
            Write-Host "Error: .NET SDK not found. Please install .NET 8.0 or later." -ForegroundColor Red
            Write-Host "Download from: https://dotnet.microsoft.com/download" -ForegroundColor Yellow
            return
        }
        
        dotnet run
    }
    finally {
        Set-Location $originalLocation
    }
}

function Run-JavaScriptSamples {
    Write-Host ""
    Write-Host "Launching JavaScript Samples..." -ForegroundColor Cyan
    Write-Host ""
    
    $originalLocation = Get-Location
    try {
        Set-Location "src/JavaScript/devpossible-ton-samples"
        
        # Check if node is available
        if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
            Write-Host "Error: Node.js not found. Please install Node.js." -ForegroundColor Red
            Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
            return
        }
        
        node index.js
    }
    finally {
        Set-Location $originalLocation
    }
}

function Run-PythonSamples {
    Write-Host ""
    Write-Host "Launching Python Samples..." -ForegroundColor Cyan
    Write-Host ""
    
    $originalLocation = Get-Location
    try {
        Set-Location "src/Python/devpossible_ton_samples"
        
        # Check if python is available
        if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
            Write-Host "Error: Python not found. Please install Python 3.x." -ForegroundColor Red
            Write-Host "Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
            return
        }
        
        python index.py
    }
    finally {
        Set-Location $originalLocation
    }
}

# Main script loop
$continue = $true

while ($continue) {
    Show-Menu
    
    $choice = Read-Host "Enter your choice"
    
    switch ($choice) {
        "1" {
            Run-CSharpSamples
            if ($continue) {
                Write-Host ""
                Write-Host "Press any key to return to the main menu..." -ForegroundColor Gray
                $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            }
        }
        "2" {
            Run-JavaScriptSamples
            if ($continue) {
                Write-Host ""
                Write-Host "Press any key to return to the main menu..." -ForegroundColor Gray
                $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            }
        }
        "3" {
            Run-PythonSamples
            if ($continue) {
                Write-Host ""
                Write-Host "Press any key to return to the main menu..." -ForegroundColor Gray
                $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            }
        }
        "0" {
            Clear-Host
            Write-Host ""
            Write-Host "Thank you for using DevPossible.Ton!" -ForegroundColor Cyan
            Write-Host "Visit https://tonspec.com for more information." -ForegroundColor Yellow
            Write-Host ""
            $continue = $false
        }
        default {
            Write-Host ""
            Write-Host "Invalid choice. Please try again." -ForegroundColor Red
            Start-Sleep -Seconds 2
        }
    }
}
