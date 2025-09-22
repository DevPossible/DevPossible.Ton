#Requires -Version 7.0
<#
.SYNOPSIS
    Publishes DevPossible.Ton packages to public repositories
.DESCRIPTION
    This script publishes the C#/.NET (NuGet), JavaScript/TypeScript (npm), and Python (PyPI)
    packages to their respective public package repositories.
.PARAMETER Language
    Specific language package to publish (CSharp, JavaScript, Python, or All). Default is All.
.PARAMETER NuGetApiKey
    API key for NuGet.org. Can also be set via NUGET_API_KEY environment variable.
.PARAMETER NpmToken
    Authentication token for npm registry. Can also be set via NPM_TOKEN environment variable.
.PARAMETER PyPiToken
    API token for PyPI. Can also be set via PYPI_TOKEN environment variable.
.PARAMETER Source
    Package source for NuGet (default is https://api.nuget.org/v3/index.json).
.PARAMETER Registry
    npm registry URL (default is https://registry.npmjs.org/).
.PARAMETER PyPiRepository
    PyPI repository URL (default is https://upload.pypi.org/legacy/).
.PARAMETER TestRepository
    If specified, publishes to test repositories (test.pypi.org, etc.).
.PARAMETER DryRun
    If specified, performs all steps except actual publishing.
.PARAMETER SkipTests
    If specified, skips running tests before publishing.
.PARAMETER SkipBuild
    If specified, skips building packages (assumes they already exist).
.PARAMETER Force
    If specified, bypasses confirmation prompts.
.EXAMPLE
    .\publish.ps1 -NuGetApiKey "key" -NpmToken "token" -PyPiToken "token"
    Publishes all packages to production repositories
.EXAMPLE
    .\publish.ps1 -Language CSharp -TestRepository -DryRun
    Performs a dry run of publishing C# package to test repository
.EXAMPLE
    .\publish.ps1 -Force -SkipTests
    Publishes all packages without confirmation and without running tests
#>

param(
    [ValidateSet("CSharp", "JavaScript", "Python", "All")]
    [string]$Language = "All",

    [string]$NuGetApiKey = $env:NUGET_API_KEY,

    [string]$NpmToken = $env:NPM_TOKEN,

    [string]$PyPiToken = $env:PYPI_TOKEN,

    [string]$Source = "https://api.nuget.org/v3/index.json",

    [string]$Registry = "https://registry.npmjs.org/",

    [string]$PyPiRepository = "https://upload.pypi.org/legacy/",

    [switch]$TestRepository,

    [switch]$DryRun,

    [switch]$SkipTests,

    [switch]$SkipBuild,

    [switch]$Force
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "Continue"

# Define colors for output
$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"
$ErrorColor = "Red"

function Write-PublishHeader {
    param([string]$Message)
    Write-Host "`n===================================================" -ForegroundColor $InfoColor
    Write-Host " $Message" -ForegroundColor $InfoColor
    Write-Host "===================================================" -ForegroundColor $InfoColor
}

function Write-PublishInfo {
    param([string]$Message)
    Write-Host "► $Message" -ForegroundColor $InfoColor
}

function Write-PublishSuccess {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $SuccessColor
}

function Write-PublishError {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $ErrorColor
}

function Write-PublishWarning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $WarningColor
}

function Get-PackageVersion {
    param([string]$PackageType)

    switch ($PackageType) {
        "CSharp" {
            $csprojPath = "src\CSharp\DevPossible.Ton\DevPossible.Ton.csproj"
            if (Test-Path $csprojPath) {
                $csproj = Get-Content $csprojPath -Raw
                if ($csproj -match "<Version>([^<]+)</Version>") {
                    return $Matches[1]
                }
            }
        }
        "JavaScript" {
            $packageJsonPath = "src\JavaScript\devpossible-ton\package.json"
            if (Test-Path $packageJsonPath) {
                $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
                return $packageJson.version
            }
        }
        "Python" {
            $setupPyPath = "src\Python\devpossible_ton\setup.py"
            if (Test-Path $setupPyPath) {
                $setupPy = Get-Content $setupPyPath -Raw
                if ($setupPy -match 'version\s*=\s*["\']([^"\']+)["\']') {
                    return $Matches[1]
                }
            }
            $pyprojectPath = "src\Python\devpossible_ton\pyproject.toml"
            if (Test-Path $pyprojectPath) {
                $pyproject = Get-Content $pyprojectPath -Raw
                if ($pyproject -match 'version\s*=\s*["\']([^"\']+)["\']') {
                    return $Matches[1]
                }
            }
        }
    }
    return "Unknown"
}

# Configure test repositories if specified
if ($TestRepository) {
    $Source = "https://int.nugettest.org/v3/index.json"
    $Registry = "https://registry.npmjs.org/"  # npm doesn't have a test registry
    $PyPiRepository = "https://test.pypi.org/legacy/"
    Write-PublishWarning "Using TEST repositories for publishing"
}

# Start publish process
Write-PublishHeader "DevPossible.Ton Package Publisher"
Write-PublishInfo "Target: $(if ($TestRepository) { 'TEST Repositories' } else { 'PRODUCTION Repositories' })"
Write-PublishInfo "Language: $Language"
if ($DryRun) {
    Write-PublishWarning "DRY RUN MODE - No packages will be published"
}

# Validate API keys/tokens
$canPublishCSharp = $true
$canPublishJavaScript = $true
$canPublishPython = $true

if (($Language -eq "All" -or $Language -eq "CSharp") -and -not $NuGetApiKey) {
    Write-PublishWarning "NuGet API key not provided. Set via -NuGetApiKey or NUGET_API_KEY environment variable"
    $canPublishCSharp = $false
}

if (($Language -eq "All" -or $Language -eq "JavaScript") -and -not $NpmToken) {
    Write-PublishWarning "npm token not provided. Set via -NpmToken or NPM_TOKEN environment variable"
    $canPublishJavaScript = $false
}

if (($Language -eq "All" -or $Language -eq "Python") -and -not $PyPiToken) {
    Write-PublishWarning "PyPI token not provided. Set via -PyPiToken or PYPI_TOKEN environment variable"
    $canPublishPython = $false
}

# Display package versions
Write-PublishHeader "Package Versions"
if ($Language -eq "All" -or $Language -eq "CSharp") {
    $csharpVersion = Get-PackageVersion -PackageType "CSharp"
    Write-PublishInfo "C#/.NET: $csharpVersion"
}
if ($Language -eq "All" -or $Language -eq "JavaScript") {
    $jsVersion = Get-PackageVersion -PackageType "JavaScript"
    Write-PublishInfo "JavaScript: $jsVersion"
}
if ($Language -eq "All" -or $Language -eq "Python") {
    $pyVersion = Get-PackageVersion -PackageType "Python"
    Write-PublishInfo "Python: $pyVersion"
}

# Confirmation prompt
if (-not $Force -and -not $DryRun) {
    Write-Host "`n" -NoNewline
    Write-PublishWarning "You are about to publish packages to $(if ($TestRepository) { 'TEST' } else { 'PRODUCTION' }) repositories."
    Write-Host "Are you sure you want to continue? (Y/N): " -ForegroundColor Yellow -NoNewline
    $confirmation = Read-Host

    if ($confirmation -ne "Y" -and $confirmation -ne "y") {
        Write-PublishInfo "Publishing cancelled by user"
        exit 0
    }
}

# Run tests if not skipped
if (-not $SkipTests) {
    Write-PublishHeader "Running Tests"
    Write-PublishInfo "Executing test suite..."

    $testScript = Join-Path $PSScriptRoot "test.ps1"
    if (Test-Path $testScript) {
        $testArgs = @("-Language", $Language)
        & $testScript @testArgs

        if ($LASTEXITCODE -ne 0) {
            Write-PublishError "Tests failed. Publishing aborted."
            exit 1
        }
        Write-PublishSuccess "All tests passed"
    } else {
        Write-PublishWarning "test.ps1 not found. Skipping tests."
    }
}

# Build packages if not skipped
if (-not $SkipBuild) {
    Write-PublishHeader "Building Packages"
    Write-PublishInfo "Building release packages..."

    $buildScript = Join-Path $PSScriptRoot "build.ps1"
    if (Test-Path $buildScript) {
        $buildArgs = @("-Configuration", "Release", "-SkipTests")
        & $buildScript @buildArgs

        if ($LASTEXITCODE -ne 0) {
            Write-PublishError "Build failed. Publishing aborted."
            exit 1
        }
        Write-PublishSuccess "Packages built successfully"
    } else {
        Write-PublishWarning "build.ps1 not found. Assuming packages are already built."
    }
}

# Track publish results
$publishResults = @{
    CSharp = $false
    JavaScript = $false
    Python = $false
}

# Publish C#/.NET Package
if (($Language -eq "All" -or $Language -eq "CSharp") -and $canPublishCSharp) {
    Write-PublishHeader "Publishing C#/.NET Package"

    try {
        Push-Location "src\CSharp\DevPossible.Ton"

        # Find the package file
        $packageFile = Get-ChildItem -Path "bin\Release" -Filter "*.nupkg" -ErrorAction SilentlyContinue |
                       Where-Object { $_.Name -notmatch "\.symbols\." } |
                       Select-Object -First 1

        if (-not $packageFile) {
            throw "NuGet package not found in bin\Release"
        }

        Write-PublishInfo "Package: $($packageFile.Name)"
        Write-PublishInfo "Size: $([math]::Round($packageFile.Length / 1MB, 2)) MB"
        Write-PublishInfo "Target: $Source"

        if (-not $DryRun) {
            # Push to NuGet
            Write-PublishInfo "Pushing package to NuGet..."
            $pushArgs = @(
                "nuget", "push",
                $packageFile.FullName,
                "--api-key", $NuGetApiKey,
                "--source", $Source,
                "--skip-duplicate"
            )

            $result = & dotnet $pushArgs 2>&1
            if ($LASTEXITCODE -ne 0) {
                # Check if it's a duplicate error
                if ($result -match "already exists" -or $result -match "409") {
                    Write-PublishWarning "Package version already exists on NuGet (skipped)"
                    $publishResults.CSharp = $true
                } else {
                    throw "NuGet push failed: $result"
                }
            } else {
                Write-PublishSuccess "C# package published successfully to NuGet"
                $publishResults.CSharp = $true
            }

            # Also push symbols package if it exists
            $symbolsPackage = Get-ChildItem -Path "bin\Release" -Filter "*.symbols.nupkg" -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($symbolsPackage) {
                Write-PublishInfo "Pushing symbols package..."
                $pushArgs[2] = $symbolsPackage.FullName
                & dotnet $pushArgs 2>&1 | Out-Null
                Write-PublishSuccess "Symbols package published"
            }
        } else {
            Write-PublishInfo "[DRY RUN] Would push: $($packageFile.Name) to $Source"
            $publishResults.CSharp = $true
        }

        Pop-Location
    }
    catch {
        Pop-Location
        Write-PublishError "C# publish failed: $_"
    }
}

# Publish JavaScript/TypeScript Package
if (($Language -eq "All" -or $Language -eq "JavaScript") -and $canPublishJavaScript) {
    Write-PublishHeader "Publishing JavaScript/TypeScript Package"

    try {
        Push-Location "src\JavaScript\devpossible-ton"

        # Check if npm is available
        $npmVersion = & npm --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "npm is not installed or not in PATH"
        }

        # Get package info
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        Write-PublishInfo "Package: $($packageJson.name)"
        Write-PublishInfo "Version: $($packageJson.version)"
        Write-PublishInfo "Registry: $Registry"

        if (-not $DryRun) {
            # Set npm authentication
            Write-PublishInfo "Setting npm authentication..."
            $npmrcContent = "//registry.npmjs.org/:_authToken=$NpmToken"
            if ($TestRepository) {
                $npmrcContent = "//registry.npmjs.org/:_authToken=$NpmToken"
            }
            Set-Content -Path ".npmrc" -Value $npmrcContent

            # Publish to npm
            Write-PublishInfo "Publishing to npm..."
            $publishArgs = @("publish", "--access", "public")

            if ($Registry -ne "https://registry.npmjs.org/") {
                $publishArgs += "--registry", $Registry
            }

            $result = & npm $publishArgs 2>&1
            if ($LASTEXITCODE -ne 0) {
                # Check if it's a duplicate error
                if ($result -match "cannot publish over the previously published version" -or $result -match "403") {
                    Write-PublishWarning "Package version already exists on npm (skipped)"
                    $publishResults.JavaScript = $true
                } else {
                    throw "npm publish failed: $result"
                }
            } else {
                Write-PublishSuccess "JavaScript package published successfully to npm"
                $publishResults.JavaScript = $true
            }

            # Clean up .npmrc
            if (Test-Path ".npmrc") {
                Remove-Item ".npmrc" -Force
            }
        } else {
            Write-PublishInfo "[DRY RUN] Would publish: $($packageJson.name)@$($packageJson.version) to $Registry"
            $publishResults.JavaScript = $true
        }

        Pop-Location
    }
    catch {
        Pop-Location
        # Clean up .npmrc on error
        if (Test-Path "src\JavaScript\devpossible-ton\.npmrc") {
            Remove-Item "src\JavaScript\devpossible-ton\.npmrc" -Force
        }
        Write-PublishError "JavaScript publish failed: $_"
    }
}

# Publish Python Package
if (($Language -eq "All" -or $Language -eq "Python") -and $canPublishPython) {
    Write-PublishHeader "Publishing Python Package"

    try {
        Push-Location "src\Python\devpossible_ton"

        # Check if Python is available
        $pythonVersion = & python --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Python is not installed or not in PATH"
        }

        # Install twine if needed
        Write-PublishInfo "Checking for twine..."
        $twineVersion = & python -m twine --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-PublishInfo "Installing twine..."
            & python -m pip install --upgrade twine 2>&1 | Out-Null
        }

        # Find dist files
        $wheelFile = Get-ChildItem -Path "dist" -Filter "*.whl" -ErrorAction SilentlyContinue | Select-Object -First 1
        $tarFile = Get-ChildItem -Path "dist" -Filter "*.tar.gz" -ErrorAction SilentlyContinue | Select-Object -First 1

        if (-not $wheelFile -and -not $tarFile) {
            throw "Python distribution files not found in dist/"
        }

        if ($wheelFile) {
            Write-PublishInfo "Wheel: $($wheelFile.Name)"
        }
        if ($tarFile) {
            Write-PublishInfo "Source: $($tarFile.Name)"
        }
        Write-PublishInfo "Repository: $PyPiRepository"

        if (-not $DryRun) {
            # Upload to PyPI
            Write-PublishInfo "Uploading to PyPI..."
            $uploadArgs = @(
                "-m", "twine", "upload",
                "--repository-url", $PyPiRepository,
                "--username", "__token__",
                "--password", $PyPiToken,
                "--skip-existing",
                "dist/*"
            )

            if ($Verbose) {
                $uploadArgs += "--verbose"
            }

            $result = & python $uploadArgs 2>&1
            if ($LASTEXITCODE -ne 0) {
                # Check if it's a duplicate error
                if ($result -match "already exists" -or $result -match "400") {
                    Write-PublishWarning "Package version already exists on PyPI (skipped)"
                    $publishResults.Python = $true
                } else {
                    throw "PyPI upload failed: $result"
                }
            } else {
                Write-PublishSuccess "Python package published successfully to PyPI"
                $publishResults.Python = $true
            }
        } else {
            Write-PublishInfo "[DRY RUN] Would upload to $PyPiRepository:"
            if ($wheelFile) {
                Write-PublishInfo "  - $($wheelFile.Name)"
            }
            if ($tarFile) {
                Write-PublishInfo "  - $($tarFile.Name)"
            }
            $publishResults.Python = $true
        }

        Pop-Location
    }
    catch {
        Pop-Location
        Write-PublishError "Python publish failed: $_"
    }
}

# Summary
Write-PublishHeader "Publish Summary"

$successCount = ($publishResults.Values | Where-Object { $_ -eq $true }).Count
$attemptedCount = 0

if (($Language -eq "All" -or $Language -eq "CSharp") -and $canPublishCSharp) { $attemptedCount++ }
if (($Language -eq "All" -or $Language -eq "JavaScript") -and $canPublishJavaScript) { $attemptedCount++ }
if (($Language -eq "All" -or $Language -eq "Python") -and $canPublishPython) { $attemptedCount++ }

if ($DryRun) {
    Write-PublishInfo "DRY RUN completed. No packages were actually published."
    Write-PublishInfo "Packages ready for publishing: $successCount/$attemptedCount"
} else {
    if ($successCount -eq $attemptedCount -and $attemptedCount -gt 0) {
        Write-PublishSuccess "All packages published successfully! ($successCount/$attemptedCount)"

        Write-Host "`nPackage URLs:" -ForegroundColor $InfoColor
        if ($publishResults.CSharp) {
            $nugetUrl = if ($TestRepository) { "https://int.nugettest.org" } else { "https://www.nuget.org" }
            Write-Host "  C#: $nugetUrl/packages/DevPossible.Ton" -ForegroundColor Gray
        }
        if ($publishResults.JavaScript) {
            Write-Host "  JS: https://www.npmjs.com/package/devpossible-ton" -ForegroundColor Gray
        }
        if ($publishResults.Python) {
            $pypiUrl = if ($TestRepository) { "https://test.pypi.org" } else { "https://pypi.org" }
            Write-Host "  PY: $pypiUrl/project/devpossible-ton" -ForegroundColor Gray
        }

        exit 0
    } elseif ($successCount -gt 0) {
        Write-PublishWarning "Partial publish success ($successCount/$attemptedCount):"

        if ($Language -eq "All" -or $Language -eq "CSharp") {
            if ($publishResults.CSharp) {
                Write-PublishSuccess "  C#/.NET : Published"
            } elseif ($canPublishCSharp) {
                Write-PublishError "  C#/.NET : Failed"
            } else {
                Write-PublishWarning "  C#/.NET : Skipped (no API key)"
            }
        }

        if ($Language -eq "All" -or $Language -eq "JavaScript") {
            if ($publishResults.JavaScript) {
                Write-PublishSuccess "  JavaScript : Published"
            } elseif ($canPublishJavaScript) {
                Write-PublishError "  JavaScript : Failed"
            } else {
                Write-PublishWarning "  JavaScript : Skipped (no token)"
            }
        }

        if ($Language -eq "All" -or $Language -eq "Python") {
            if ($publishResults.Python) {
                Write-PublishSuccess "  Python : Published"
            } elseif ($canPublishPython) {
                Write-PublishError "  Python : Failed"
            } else {
                Write-PublishWarning "  Python : Skipped (no token)"
            }
        }

        exit 1
    } elseif ($attemptedCount -eq 0) {
        Write-PublishWarning "No packages were published (missing credentials)"
        exit 1
    } else {
        Write-PublishError "All publish attempts failed!"
        exit 1
    }
}