#Requires -Version 7.0
<#
.SYNOPSIS
    Runs all tests for DevPossible.Ton libraries
.DESCRIPTION
    This script executes tests for C#/.NET, JavaScript/TypeScript, and Python implementations
    of the DevPossible.Ton library with detailed reporting and coverage options.
.PARAMETER Language
    Specific language to test (CSharp, JavaScript, Python, or All). Default is All.
.PARAMETER Configuration
    Build configuration for C# tests (Debug or Release). Default is Debug.
.PARAMETER Coverage
    If specified, generates code coverage reports.
.PARAMETER Verbose
    If specified, shows detailed test output.
.PARAMETER Filter
    Test filter pattern for selective test execution.
.PARAMETER FailFast
    If specified, stops on first test failure.
.EXAMPLE
    .\test.ps1
    Runs all tests for all languages
.EXAMPLE
    .\test.ps1 -Language CSharp -Coverage
    Runs C# tests with code coverage
.EXAMPLE
    .\test.ps1 -Filter "Parser" -Verbose
    Runs tests matching "Parser" with detailed output
#>

param(
    [ValidateSet("CSharp", "JavaScript", "Python", "All")]
    [string]$Language = "All",

    [ValidateSet("Debug", "Release")]
    [string]$Configuration = "Debug",

    [switch]$Coverage,

    [switch]$Verbose,

    [string]$Filter = "",

    [switch]$FailFast
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "Continue"

# Define colors for output
$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"
$ErrorColor = "Red"

function Write-TestHeader {
    param([string]$Message)
    Write-Host "`n===================================================" -ForegroundColor $InfoColor
    Write-Host " $Message" -ForegroundColor $InfoColor
    Write-Host "===================================================" -ForegroundColor $InfoColor
}

function Write-TestInfo {
    param([string]$Message)
    Write-Host "► $Message" -ForegroundColor $InfoColor
}

function Write-TestSuccess {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $SuccessColor
}

function Write-TestError {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $ErrorColor
}

function Write-TestWarning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $WarningColor
}

function Write-TestResult {
    param(
        [string]$Name,
        [int]$Passed,
        [int]$Failed,
        [int]$Skipped,
        [int]$Total,
        [double]$Duration
    )

    Write-Host "`n  Test Results for $Name:" -ForegroundColor White
    Write-Host "  ─────────────────────────────────────" -ForegroundColor DarkGray

    if ($Failed -eq 0) {
        Write-Host "  ✓ Passed:  $Passed/$Total" -ForegroundColor $SuccessColor
    } else {
        Write-Host "  ✓ Passed:  $Passed/$Total" -ForegroundColor $SuccessColor
        Write-Host "  ✗ Failed:  $Failed/$Total" -ForegroundColor $ErrorColor
    }

    if ($Skipped -gt 0) {
        Write-Host "  ○ Skipped: $Skipped" -ForegroundColor $WarningColor
    }

    Write-Host "  ⏱ Duration: $($Duration)s" -ForegroundColor Gray
}

# Start test process
Write-TestHeader "DevPossible.Ton Test Runner"
Write-TestInfo "Language: $Language"
Write-TestInfo "Configuration: $Configuration"
if ($Coverage) {
    Write-TestInfo "Coverage: Enabled"
}
if ($Verbose) {
    Write-TestInfo "Verbose: Enabled"
}
if ($Filter) {
    Write-TestInfo "Filter: $Filter"
}
if ($FailFast) {
    Write-TestInfo "Fail Fast: Enabled"
}

# Track test results
$testResults = @{
    CSharp = @{ Passed = 0; Failed = 0; Skipped = 0; Total = 0; Duration = 0 }
    JavaScript = @{ Passed = 0; Failed = 0; Skipped = 0; Total = 0; Duration = 0 }
    Python = @{ Passed = 0; Failed = 0; Skipped = 0; Total = 0; Duration = 0 }
}

$overallSuccess = $true

# Run C# Tests
if ($Language -eq "All" -or $Language -eq "CSharp") {
    Write-TestHeader "Running C#/.NET Tests"

    try {
        Push-Location "src\CSharp"

        # Check if test project exists
        if (-not (Test-Path "DevPossible.Ton.Tests\DevPossible.Ton.Tests.csproj")) {
            throw "C# test project not found"
        }

        # Build test arguments
        $testArgs = @("test", "DevPossible.Ton.Tests\DevPossible.Ton.Tests.csproj")
        $testArgs += "-c", $Configuration
        $testArgs += "--logger", "console;verbosity=normal"

        if ($Verbose) {
            $testArgs += "--verbosity", "detailed"
        } else {
            $testArgs += "--verbosity", "minimal"
        }

        if ($Filter) {
            $testArgs += "--filter", $Filter
        }

        if ($Coverage) {
            $testArgs += "--collect:""XPlat Code Coverage"""
            $testArgs += "--settings", "coverlet.runsettings"
        }

        if ($FailFast) {
            $testArgs += "--"
            $testArgs += "RunConfiguration.StopOnError=true"
        }

        Write-TestInfo "Executing: dotnet $($testArgs -join ' ')"
        $startTime = Get-Date

        # Run tests and capture output
        $testOutput = & dotnet $testArgs 2>&1
        $exitCode = $LASTEXITCODE
        $duration = ((Get-Date) - $startTime).TotalSeconds

        # Parse test results from output
        $testOutput | ForEach-Object {
            if ($Verbose) {
                Write-Host $_
            }

            if ($_ -match "Passed:\s+(\d+)") {
                $testResults.CSharp.Passed = [int]$Matches[1]
            }
            if ($_ -match "Failed:\s+(\d+)") {
                $testResults.CSharp.Failed = [int]$Matches[1]
            }
            if ($_ -match "Skipped:\s+(\d+)") {
                $testResults.CSharp.Skipped = [int]$Matches[1]
            }
            if ($_ -match "Total:\s+(\d+)") {
                $testResults.CSharp.Total = [int]$Matches[1]
            }
        }

        $testResults.CSharp.Duration = [math]::Round($duration, 2)

        if ($exitCode -ne 0) {
            $overallSuccess = $false
            Write-TestError "C# tests failed with exit code $exitCode"
        } else {
            Write-TestSuccess "C# tests completed successfully"
        }

        # Generate coverage report if requested
        if ($Coverage) {
            $coverageFile = Get-ChildItem -Path "DevPossible.Ton.Tests\TestResults" -Filter "coverage.cobertura.xml" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($coverageFile) {
                Write-TestInfo "Coverage report generated: $($coverageFile.FullName)"

                # Try to generate HTML report if ReportGenerator is available
                $reportGeneratorTool = & dotnet tool list -g | Where-Object { $_ -match "reportgenerator" }
                if ($reportGeneratorTool) {
                    Write-TestInfo "Generating HTML coverage report..."
                    & reportgenerator "-reports:$($coverageFile.FullName)" "-targetdir:TestResults\CoverageReport" "-reporttypes:Html" 2>&1 | Out-Null
                    Write-TestSuccess "HTML coverage report generated in TestResults\CoverageReport"
                }
            }
        }

        Write-TestResult -Name "C#/.NET" `
            -Passed $testResults.CSharp.Passed `
            -Failed $testResults.CSharp.Failed `
            -Skipped $testResults.CSharp.Skipped `
            -Total $testResults.CSharp.Total `
            -Duration $testResults.CSharp.Duration

        Pop-Location

        if ($FailFast -and $testResults.CSharp.Failed -gt 0) {
            Write-TestError "Stopping due to test failures (FailFast enabled)"
            exit 1
        }
    }
    catch {
        Pop-Location
        Write-TestError "C# test execution failed: $_"
        $overallSuccess = $false

        if ($FailFast) {
            exit 1
        }
    }
}

# Run JavaScript Tests
if ($Language -eq "All" -or $Language -eq "JavaScript") {
    Write-TestHeader "Running JavaScript/TypeScript Tests"

    try {
        Push-Location "src\JavaScript\devpossible-ton"

        # Check if npm is available
        $npmVersion = & npm --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "npm is not installed or not in PATH"
        }

        # Check if package.json exists
        if (-not (Test-Path "package.json")) {
            throw "JavaScript package.json not found"
        }

        # Install dependencies if needed
        if (-not (Test-Path "node_modules")) {
            Write-TestInfo "Installing dependencies..."
            $result = & npm ci 2>&1
            if ($LASTEXITCODE -ne 0) {
                $result = & npm install 2>&1
                if ($LASTEXITCODE -ne 0) {
                    throw "Failed to install dependencies"
                }
            }
        }

        # Build test command
        $testCommand = "test"
        if ($Coverage) {
            $testCommand = "test:coverage"
        }

        $env:JEST_VERBOSE = if ($Verbose) { "true" } else { "false" }
        if ($Filter) {
            $env:JEST_TEST_NAME_PATTERN = $Filter
        }
        if ($FailFast) {
            $env:JEST_BAIL = "1"
        }

        Write-TestInfo "Executing: npm run $testCommand"
        $startTime = Get-Date

        # Run tests and capture output
        $testOutput = & npm run $testCommand -- --json 2>&1
        $exitCode = $LASTEXITCODE
        $duration = ((Get-Date) - $startTime).TotalSeconds

        # Try to parse JSON output
        try {
            $jsonOutput = $testOutput | Where-Object { $_ -match "^\{" } | ConvertFrom-Json
            if ($jsonOutput) {
                $testResults.JavaScript.Passed = $jsonOutput.numPassedTests
                $testResults.JavaScript.Failed = $jsonOutput.numFailedTests
                $testResults.JavaScript.Skipped = $jsonOutput.numPendingTests
                $testResults.JavaScript.Total = $jsonOutput.numTotalTests
            }
        }
        catch {
            # Fallback to regex parsing
            $testOutput | ForEach-Object {
                if ($Verbose) {
                    Write-Host $_
                }

                if ($_ -match "(\d+) passed") {
                    $testResults.JavaScript.Passed = [int]$Matches[1]
                }
                if ($_ -match "(\d+) failed") {
                    $testResults.JavaScript.Failed = [int]$Matches[1]
                }
                if ($_ -match "(\d+) skipped") {
                    $testResults.JavaScript.Skipped = [int]$Matches[1]
                }
                if ($_ -match "(\d+) total") {
                    $testResults.JavaScript.Total = [int]$Matches[1]
                }
            }
        }

        $testResults.JavaScript.Duration = [math]::Round($duration, 2)

        if ($exitCode -ne 0) {
            $overallSuccess = $false
            Write-TestError "JavaScript tests failed with exit code $exitCode"
        } else {
            Write-TestSuccess "JavaScript tests completed successfully"
        }

        # Check for coverage report
        if ($Coverage -and (Test-Path "coverage")) {
            Write-TestInfo "Coverage report generated in coverage/"
            if (Test-Path "coverage\lcov-report\index.html") {
                Write-TestSuccess "HTML coverage report: coverage\lcov-report\index.html"
            }
        }

        Write-TestResult -Name "JavaScript" `
            -Passed $testResults.JavaScript.Passed `
            -Failed $testResults.JavaScript.Failed `
            -Skipped $testResults.JavaScript.Skipped `
            -Total $testResults.JavaScript.Total `
            -Duration $testResults.JavaScript.Duration

        Pop-Location

        if ($FailFast -and $testResults.JavaScript.Failed -gt 0) {
            Write-TestError "Stopping due to test failures (FailFast enabled)"
            exit 1
        }
    }
    catch {
        Pop-Location
        Write-TestError "JavaScript test execution failed: $_"
        $overallSuccess = $false

        if ($FailFast) {
            exit 1
        }
    }
}

# Run Python Tests
if ($Language -eq "All" -or $Language -eq "Python") {
    Write-TestHeader "Running Python Tests"

    try {
        Push-Location "src\Python\devpossible_ton"

        # Check if Python is available
        $pythonVersion = & python --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Python is not installed or not in PATH"
        }

        # Check if tests directory exists
        if (-not (Test-Path "tests")) {
            throw "Python tests directory not found"
        }

        # Install pytest if needed
        $pytestVersion = & python -m pytest --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-TestInfo "Installing pytest..."
            & python -m pip install pytest pytest-cov 2>&1 | Out-Null
        }

        # Build pytest arguments
        $pytestArgs = @("-m", "pytest", "tests")

        if ($Verbose) {
            $pytestArgs += "-vv"
        } else {
            $pytestArgs += "-v"
        }

        if ($Filter) {
            $pytestArgs += "-k", $Filter
        }

        if ($Coverage) {
            $pytestArgs += "--cov=devpossible_ton"
            $pytestArgs += "--cov-report=html"
            $pytestArgs += "--cov-report=term"
        }

        if ($FailFast) {
            $pytestArgs += "-x"
        }

        $pytestArgs += "--tb=short"
        $pytestArgs += "--color=yes"

        Write-TestInfo "Executing: python $($pytestArgs -join ' ')"
        $startTime = Get-Date

        # Run tests and capture output
        $testOutput = & python $pytestArgs 2>&1
        $exitCode = $LASTEXITCODE
        $duration = ((Get-Date) - $startTime).TotalSeconds

        # Parse test results from output
        $testOutput | ForEach-Object {
            if ($Verbose) {
                Write-Host $_
            }

            if ($_ -match "(\d+) passed") {
                $testResults.Python.Passed = [int]$Matches[1]
            }
            if ($_ -match "(\d+) failed") {
                $testResults.Python.Failed = [int]$Matches[1]
            }
            if ($_ -match "(\d+) skipped") {
                $testResults.Python.Skipped = [int]$Matches[1]
            }
            if ($_ -match "(\d+) error") {
                $testResults.Python.Failed += [int]$Matches[1]
            }
        }

        $testResults.Python.Total = $testResults.Python.Passed + $testResults.Python.Failed + $testResults.Python.Skipped
        $testResults.Python.Duration = [math]::Round($duration, 2)

        if ($exitCode -ne 0) {
            $overallSuccess = $false
            Write-TestError "Python tests failed with exit code $exitCode"
        } else {
            Write-TestSuccess "Python tests completed successfully"
        }

        # Check for coverage report
        if ($Coverage -and (Test-Path "htmlcov")) {
            Write-TestInfo "Coverage report generated in htmlcov/"
            if (Test-Path "htmlcov\index.html") {
                Write-TestSuccess "HTML coverage report: htmlcov\index.html"
            }
        }

        Write-TestResult -Name "Python" `
            -Passed $testResults.Python.Passed `
            -Failed $testResults.Python.Failed `
            -Skipped $testResults.Python.Skipped `
            -Total $testResults.Python.Total `
            -Duration $testResults.Python.Duration

        Pop-Location

        if ($FailFast -and $testResults.Python.Failed -gt 0) {
            Write-TestError "Stopping due to test failures (FailFast enabled)"
            exit 1
        }
    }
    catch {
        Pop-Location
        Write-TestError "Python test execution failed: $_"
        $overallSuccess = $false

        if ($FailFast) {
            exit 1
        }
    }
}

# Summary
Write-TestHeader "Test Summary"

$totalPassed = 0
$totalFailed = 0
$totalSkipped = 0
$totalTests = 0
$totalDuration = 0

foreach ($lang in $testResults.Keys) {
    if ($Language -eq "All" -or $Language -eq $lang) {
        $totalPassed += $testResults[$lang].Passed
        $totalFailed += $testResults[$lang].Failed
        $totalSkipped += $testResults[$lang].Skipped
        $totalTests += $testResults[$lang].Total
        $totalDuration += $testResults[$lang].Duration
    }
}

Write-Host "`n  Overall Results:" -ForegroundColor White
Write-Host "  ─────────────────────────────────────" -ForegroundColor DarkGray

if ($totalFailed -eq 0 -and $totalTests -gt 0) {
    Write-Host "  ✓ ALL TESTS PASSED!" -ForegroundColor $SuccessColor
    Write-Host "  Total: $totalPassed/$totalTests tests" -ForegroundColor $SuccessColor
} elseif ($totalTests -eq 0) {
    Write-TestWarning "  No tests were executed"
} else {
    Write-Host "  ✓ Passed:  $totalPassed/$totalTests" -ForegroundColor $SuccessColor
    Write-Host "  ✗ Failed:  $totalFailed/$totalTests" -ForegroundColor $ErrorColor
}

if ($totalSkipped -gt 0) {
    Write-Host "  ○ Skipped: $totalSkipped" -ForegroundColor $WarningColor
}

Write-Host "  ⏱ Total Duration: $($totalDuration)s" -ForegroundColor Gray

if ($Coverage) {
    Write-Host "`n  Coverage Reports:" -ForegroundColor White
    Write-Host "  ─────────────────────────────────────" -ForegroundColor DarkGray
    if ($Language -eq "All" -or $Language -eq "CSharp") {
        Write-Host "  C#: src\CSharp\TestResults\CoverageReport" -ForegroundColor Gray
    }
    if ($Language -eq "All" -or $Language -eq "JavaScript") {
        Write-Host "  JS: src\JavaScript\devpossible-ton\coverage" -ForegroundColor Gray
    }
    if ($Language -eq "All" -or $Language -eq "Python") {
        Write-Host "  PY: src\Python\devpossible_ton\htmlcov" -ForegroundColor Gray
    }
}

# Exit with appropriate code
if ($overallSuccess) {
    exit 0
} else {
    exit 1
}