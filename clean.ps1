# Clean Script
# Cleans all build outputs for C#, JavaScript, and Python projects
# Usage: .\clean.ps1

Write-Host "DevPossible.Ton - Clean All Build Outputs" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Function to remove directory if it exists
function Remove-DirectoryIfExists {
    param([string]$Path, [string]$Description)
    
    if (Test-Path $Path) {
        Write-Host "  Removing $Description..." -ForegroundColor Yellow
        Remove-Item -Path $Path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "    ✓ Removed: $Path" -ForegroundColor Green
    }
}

# Function to remove files matching pattern
function Remove-FilesIfExist {
    param([string]$Path, [string]$Pattern, [string]$Description)
    
    $files = Get-ChildItem -Path $Path -Filter $Pattern -Recurse -ErrorAction SilentlyContinue
    if ($files) {
        Write-Host "  Removing $Description..." -ForegroundColor Yellow
        foreach ($file in $files) {
            Remove-Item -Path $file.FullName -Force -ErrorAction SilentlyContinue
            Write-Host "    ✓ Removed: $($file.FullName)" -ForegroundColor Green
        }
    }
}

# Clean C# / .NET Projects
Write-Host "Cleaning C# / .NET Projects..." -ForegroundColor Cyan
Write-Host "------------------------------" -ForegroundColor Cyan

# Clean main library
Remove-DirectoryIfExists "src\CSharp\DevPossible.Ton\bin" "C# library bin"
Remove-DirectoryIfExists "src\CSharp\DevPossible.Ton\obj" "C# library obj"

# Clean test project
Remove-DirectoryIfExists "src\CSharp\DevPossible.Ton.Tests\bin" "C# tests bin"
Remove-DirectoryIfExists "src\CSharp\DevPossible.Ton.Tests\obj" "C# tests obj"
Remove-DirectoryIfExists "src\CSharp\DevPossible.Ton.Tests\TestResults" "C# test results"

# Clean samples
Remove-DirectoryIfExists "src\CSharp\DevPossible.Ton.Samples\bin" "C# samples bin"
Remove-DirectoryIfExists "src\CSharp\DevPossible.Ton.Samples\obj" "C# samples obj"

# Remove NuGet packages from root
Remove-FilesIfExist "." "*.nupkg" "NuGet packages"

Write-Host ""

# Clean JavaScript / TypeScript Projects
Write-Host "Cleaning JavaScript / TypeScript Projects..." -ForegroundColor Cyan
Write-Host "-------------------------------------------" -ForegroundColor Cyan

# Clean main library
Remove-DirectoryIfExists "src\JavaScript\devpossible-ton\node_modules" "JavaScript library node_modules"
Remove-DirectoryIfExists "src\JavaScript\devpossible-ton\dist" "JavaScript library dist"
Remove-FilesIfExist "src\JavaScript\devpossible-ton" "*.tgz" "npm packages"

# Clean samples
Remove-DirectoryIfExists "src\JavaScript\devpossible-ton-samples\node_modules" "JavaScript samples node_modules"

Write-Host ""

# Clean Python Projects
Write-Host "Cleaning Python Projects..." -ForegroundColor Cyan
Write-Host "---------------------------" -ForegroundColor Cyan

# Clean main library
Remove-DirectoryIfExists "src\Python\devpossible_ton\dist" "Python library dist"
Remove-DirectoryIfExists "src\Python\devpossible_ton\build" "Python library build"
Remove-DirectoryIfExists "src\Python\devpossible_ton\devpossible_ton.egg-info" "Python library egg-info"

# Clean __pycache__ directories
$pycacheDirs = Get-ChildItem -Path "src\Python" -Filter "__pycache__" -Recurse -Directory -ErrorAction SilentlyContinue
if ($pycacheDirs) {
    Write-Host "  Removing Python cache directories..." -ForegroundColor Yellow
    foreach ($dir in $pycacheDirs) {
        Remove-Item -Path $dir.FullName -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "    ✓ Removed: $($dir.FullName)" -ForegroundColor Green
    }
}

# Clean .pyc files
$pycFiles = Get-ChildItem -Path "src\Python" -Filter "*.pyc" -Recurse -File -ErrorAction SilentlyContinue
if ($pycFiles) {
    Write-Host "  Removing Python compiled files (.pyc)..." -ForegroundColor Yellow
    foreach ($file in $pycFiles) {
        Remove-Item -Path $file.FullName -Force -ErrorAction SilentlyContinue
        Write-Host "    ✓ Removed: $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host ""

# Clean documentation build outputs (optional)
Write-Host "Cleaning Documentation Build Outputs..." -ForegroundColor Cyan
Write-Host "---------------------------------------" -ForegroundColor Cyan

Remove-DirectoryIfExists "doc\doc-html\bin" "Documentation bin"
Remove-DirectoryIfExists "doc\doc-html\obj" "Documentation obj"
Remove-DirectoryIfExists "doc\node_modules" "Documentation node_modules"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Clean Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  - Run .\build.ps1 to rebuild all projects" -ForegroundColor White
Write-Host "  - Run .\test.ps1 to run all tests" -ForegroundColor White
Write-Host ""
