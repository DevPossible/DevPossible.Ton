# Update Version Script
# Updates version.json and all package files to maintain version consistency
# Usage: .\update-version.ps1 -Version "1.0.0-beta" [-Commit]

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [switch]$Commit
)

Write-Host "Updating library version to: $Version" -ForegroundColor Green

# Update version.json
$versionJson = Get-Content "version.json" | ConvertFrom-Json
$versionJson.library_version = $Version
$versionJson | ConvertTo-Json | Set-Content -Path "version.json"
Write-Host "✓ Updated version.json (library_version)" -ForegroundColor Green

# Convert to Python version format (1.0.0-alpha -> 1.0.0a0)
$pythonVersion = $Version -replace '-alpha', 'a0' -replace '-beta', 'b0' -replace '-rc', 'rc'

# Update C# project file
$csprojPath = "src/CSharp/DevPossible.Ton/DevPossible.Ton.csproj"
$csprojContent = Get-Content $csprojPath -Raw
$csprojContent = $csprojContent -replace '<Version>.*?</Version>', "<Version>$Version</Version>"
$csprojContent = $csprojContent -replace '<PackageVersion>.*?</PackageVersion>', "<PackageVersion>$Version</PackageVersion>"
$csprojContent | Set-Content $csprojPath
Write-Host "✓ Updated $csprojPath" -ForegroundColor Green

# Update JavaScript package.json
$packageJsonPath = "src/JavaScript/devpossible-ton/package.json"
$packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
$packageJson.version = $Version
$packageJson | ConvertTo-Json -Depth 100 | Set-Content $packageJsonPath
Write-Host "✓ Updated $packageJsonPath" -ForegroundColor Green

# Update Python setup.py
$setupPyPath = "src/Python/devpossible_ton/setup.py"
$setupPyContent = Get-Content $setupPyPath -Raw
$setupPyContent = $setupPyContent -replace 'version="[^"]*"', "version=`"$pythonVersion`""
$setupPyContent | Set-Content $setupPyPath
Write-Host "✓ Updated $setupPyPath" -ForegroundColor Green

Write-Host "`nVersion update complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Review the changes" -ForegroundColor Yellow
Write-Host "2. Commit and push to trigger the publish workflow:" -ForegroundColor Yellow
Write-Host "   git add version.json src/" -ForegroundColor Cyan
Write-Host "   git commit -m 'Release version $Version'" -ForegroundColor Cyan
Write-Host "   git push origin main" -ForegroundColor Cyan

if ($Commit) {
    Write-Host "`nCommitting changes..." -ForegroundColor Green
    git add version.json src/
    git commit -m "Release version $Version"
    Write-Host "✓ Changes committed" -ForegroundColor Green
    Write-Host "`nRun 'git push origin main' to trigger the publish workflow" -ForegroundColor Yellow
}
