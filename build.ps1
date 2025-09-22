#Requires -Version 7.0
<#
.SYNOPSIS
    Builds all DevPossible.Ton libraries and creates packages
.DESCRIPTION
    This script builds the C#/.NET, JavaScript/TypeScript, and Python implementations
    of the DevPossible.Ton library and creates distributable packages.
.PARAMETER Configuration
    Build configuration (Debug or Release). Default is Release.
.PARAMETER Version
    Version number for the packages. If not specified, uses version from project files.
.PARAMETER Clean
    If specified, performs a clean build by removing all build artifacts first.
.PARAMETER SkipTests
    If specified, skips building test projects.
.EXAMPLE
    .\build.ps1
    Builds all libraries in Release configuration
.EXAMPLE
    .\build.ps1 -Configuration Debug -Clean
    Performs a clean Debug build
.EXAMPLE
    .\build.ps1 -Version 1.2.0
    Builds with specific version number
#>

param(
    [ValidateSet("Debug", "Release")]
    [string]$Configuration = "Release",

    [string]$Version = "",

    [switch]$Clean,

    [switch]$SkipTests
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "Continue"

# Define colors for output
$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"
$ErrorColor = "Red"

function Write-BuildHeader {
    param([string]$Message)
    Write-Host "`n===================================================" -ForegroundColor $InfoColor
    Write-Host " $Message" -ForegroundColor $InfoColor
    Write-Host "===================================================" -ForegroundColor $InfoColor
}

function Write-BuildInfo {
    param([string]$Message)
    Write-Host "► $Message" -ForegroundColor $InfoColor
}

function Write-BuildSuccess {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $SuccessColor
}

function Write-BuildError {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $ErrorColor
}

function Write-BuildWarning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $WarningColor
}

# Start build process
Write-BuildHeader "DevPossible.Ton Build Script"
Write-BuildInfo "Configuration: $Configuration"
if ($Version) {
    Write-BuildInfo "Version: $Version"
}
if ($Clean) {
    Write-BuildInfo "Clean Build: Yes"
}
if ($SkipTests) {
    Write-BuildInfo "Skip Tests: Yes"
}

# Track build results
$buildResults = @{
    CSharp = $false
    JavaScript = $false
    Python = $false
}

# Clean build artifacts if requested
if ($Clean) {
    Write-BuildHeader "Cleaning Build Artifacts"

    # Clean C# artifacts
    Write-BuildInfo "Cleaning C# build artifacts..."
    if (Test-Path "src\CSharp\DevPossible.Ton\bin") {
        Remove-Item -Path "src\CSharp\DevPossible.Ton\bin" -Recurse -Force
    }
    if (Test-Path "src\CSharp\DevPossible.Ton\obj") {
        Remove-Item -Path "src\CSharp\DevPossible.Ton\obj" -Recurse -Force
    }
    if (-not $SkipTests) {
        if (Test-Path "src\CSharp\DevPossible.Ton.Tests\bin") {
            Remove-Item -Path "src\CSharp\DevPossible.Ton.Tests\bin" -Recurse -Force
        }
        if (Test-Path "src\CSharp\DevPossible.Ton.Tests\obj") {
            Remove-Item -Path "src\CSharp\DevPossible.Ton.Tests\obj" -Recurse -Force
        }
    }

    # Clean JavaScript artifacts
    Write-BuildInfo "Cleaning JavaScript build artifacts..."
    if (Test-Path "src\JavaScript\devpossible-ton\dist") {
        Remove-Item -Path "src\JavaScript\devpossible-ton\dist" -Recurse -Force
    }
    if (Test-Path "src\JavaScript\devpossible-ton\node_modules") {
        Remove-Item -Path "src\JavaScript\devpossible-ton\node_modules" -Recurse -Force
    }

    # Clean Python artifacts
    Write-BuildInfo "Cleaning Python build artifacts..."
    if (Test-Path "src\Python\devpossible_ton\dist") {
        Remove-Item -Path "src\Python\devpossible_ton\dist" -Recurse -Force
    }
    if (Test-Path "src\Python\devpossible_ton\build") {
        Remove-Item -Path "src\Python\devpossible_ton\build" -Recurse -Force
    }
    if (Test-Path "src\Python\devpossible_ton\*.egg-info") {
        Remove-Item -Path "src\Python\devpossible_ton\*.egg-info" -Recurse -Force
    }

    Write-BuildSuccess "Clean completed"
}

# Build C#/.NET Library
Write-BuildHeader "Building C#/.NET Library"
try {
    Push-Location "src\CSharp"

    # Build main library
    Write-BuildInfo "Building DevPossible.Ton library..."
    $buildArgs = @("build", "DevPossible.Ton\DevPossible.Ton.csproj", "-c", $Configuration)
    if ($Version) {
        $buildArgs += "-p:PackageVersion=$Version"
        $buildArgs += "-p:Version=$Version"
    }

    $result = & dotnet $buildArgs 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "C# library build failed: $result"
    }
    Write-BuildSuccess "DevPossible.Ton library built successfully"

    # Build tests if not skipped
    if (-not $SkipTests) {
        Write-BuildInfo "Building DevPossible.Ton.Tests..."
        $result = & dotnet build "DevPossible.Ton.Tests\DevPossible.Ton.Tests.csproj" -c $Configuration 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "C# tests build failed: $result"
        }
        Write-BuildSuccess "DevPossible.Ton.Tests built successfully"
    }

    # Build samples
    Write-BuildInfo "Building DevPossible.Ton.Samples..."
    $result = & dotnet build "DevPossible.Ton.Samples\DevPossible.Ton.Samples.csproj" -c $Configuration 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-BuildWarning "Samples build failed (non-critical): $result"
    } else {
        Write-BuildSuccess "DevPossible.Ton.Samples built successfully"
    }

    # Create NuGet package
    Write-BuildInfo "Creating NuGet package..."
    $packArgs = @("pack", "DevPossible.Ton\DevPossible.Ton.csproj", "-c", $Configuration, "--no-build")
    if ($Version) {
        $packArgs += "-p:PackageVersion=$Version"
    }

    $result = & dotnet $packArgs 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "NuGet package creation failed: $result"
    }

    $packagePath = Get-ChildItem -Path "DevPossible.Ton\bin\$Configuration" -Filter "*.nupkg" | Select-Object -First 1
    if ($packagePath) {
        Write-BuildSuccess "NuGet package created: $($packagePath.Name)"
    }

    $buildResults.CSharp = $true
    Pop-Location
}
catch {
    Pop-Location
    Write-BuildError "C# build failed: $_"
}

# Build JavaScript/TypeScript Library
Write-BuildHeader "Building JavaScript/TypeScript Library"
try {
    Push-Location "src\JavaScript\devpossible-ton"

    # Check if npm is available
    $npmVersion = npm --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "npm is not installed or not in PATH"
    }
    Write-BuildInfo "npm version: $npmVersion"

    # Install dependencies
    Write-BuildInfo "Installing dependencies..."
    $result = npm ci 2>&1
    if ($LASTEXITCODE -ne 0) {
        # Fallback to npm install if ci fails
        Write-BuildWarning "npm ci failed, trying npm install..."
        $result = npm install 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed: $result"
        }
    }
    Write-BuildSuccess "Dependencies installed"

    # Update version if specified
    if ($Version) {
        Write-BuildInfo "Setting package version to $Version..."
        $result = npm version $Version --no-git-tag-version 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-BuildWarning "Failed to set version: $result"
        }
    }

    # Build TypeScript
    Write-BuildInfo "Building TypeScript..."
    $result = npm run build 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "TypeScript build failed: $result"
    }
    Write-BuildSuccess "TypeScript built successfully"

    # Run tests if not skipped
    if (-not $SkipTests) {
        Write-BuildInfo "Running JavaScript tests..."
        $result = npm test 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-BuildWarning "JavaScript tests failed (non-critical): $result"
        } else {
            Write-BuildSuccess "JavaScript tests passed"
        }
    }

    # Create npm package
    Write-BuildInfo "Creating npm package..."
    $result = npm pack 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "npm pack failed: $result"
    }

    $packageFile = Get-ChildItem -Path "." -Filter "*.tgz" | Select-Object -First 1
    if ($packageFile) {
        Write-BuildSuccess "npm package created: $($packageFile.Name)"
    }

    $buildResults.JavaScript = $true
    Pop-Location
}
catch {
    Pop-Location
    Write-BuildError "JavaScript build failed: $_"
}

# Build Python Library
Write-BuildHeader "Building Python Library"
try {
    Push-Location "src\Python\devpossible_ton"

    # Check if Python is available
    $pythonVersion = & python --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Python is not installed or not in PATH"
    }
    Write-BuildInfo "Python version: $pythonVersion"

    # Check if pip is available
    $pipVersion = & python -m pip --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "pip is not installed"
    }
    Write-BuildInfo "pip version: $($pipVersion -split ' ')[1]"

    # Install build dependencies
    Write-BuildInfo "Installing build dependencies..."
    $result = & python -m pip install --upgrade pip setuptools wheel build 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install build dependencies: $result"
    }
    Write-BuildSuccess "Build dependencies installed"

    # Install package dependencies
    if (Test-Path "requirements.txt") {
        Write-BuildInfo "Installing package dependencies..."
        $result = & python -m pip install -r requirements.txt 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-BuildWarning "Failed to install dependencies: $result"
        }
    }

    # Update version if specified
    if ($Version) {
        Write-BuildInfo "Setting package version to $Version..."
        if (Test-Path "setup.py") {
            $setupContent = Get-Content "setup.py" -Raw
            $setupContent = $setupContent -replace "version\s*=\s*[`"`'][^`"`']+[`"`']", "version=`"$Version`""
            Set-Content "setup.py" -Value $setupContent
        }
        if (Test-Path "pyproject.toml") {
            $tomlContent = Get-Content "pyproject.toml" -Raw
            $tomlContent = $tomlContent -replace "version\s*=\s*[`"`'][^`"`']+[`"`']", "version = `"$Version`""
            Set-Content "pyproject.toml" -Value $tomlContent
        }
    }

    # Run tests if not skipped
    if (-not $SkipTests) {
        Write-BuildInfo "Running Python tests..."
        $result = & python -m pytest tests 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-BuildWarning "Python tests failed (non-critical): $result"
        } else {
            Write-BuildSuccess "Python tests passed"
        }
    }

    # Build Python package
    Write-BuildInfo "Building Python package..."
    $result = & python -m build 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Python build failed: $result"
    }

    $wheelFile = Get-ChildItem -Path "dist" -Filter "*.whl" -ErrorAction SilentlyContinue | Select-Object -First 1
    $tarFile = Get-ChildItem -Path "dist" -Filter "*.tar.gz" -ErrorAction SilentlyContinue | Select-Object -First 1

    if ($wheelFile) {
        Write-BuildSuccess "Python wheel created: $($wheelFile.Name)"
    }
    if ($tarFile) {
        Write-BuildSuccess "Python source distribution created: $($tarFile.Name)"
    }

    $buildResults.Python = $true
    Pop-Location
}
catch {
    Pop-Location
    Write-BuildError "Python build failed: $_"
}

# Summary
Write-BuildHeader "Build Summary"
$successCount = ($buildResults.Values | Where-Object { $_ -eq $true }).Count
$totalCount = $buildResults.Count

if ($successCount -eq $totalCount) {
    Write-BuildSuccess "All builds completed successfully! ($successCount/$totalCount)"
    exit 0
} elseif ($successCount -gt 0) {
    Write-BuildWarning "Partial build success ($successCount/$totalCount):"
    foreach ($key in $buildResults.Keys) {
        if ($buildResults[$key]) {
            Write-BuildSuccess "  $key : Success"
        } else {
            Write-BuildError "  $key : Failed"
        }
    }
    exit 1
} else {
    Write-BuildError "All builds failed!"
    exit 1
}