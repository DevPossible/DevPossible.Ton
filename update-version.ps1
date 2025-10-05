# Update Version Script
# Updates version.json and all package files to maintain version consistency
# Usage: 
#   .\update-version.ps1                    # Auto-increment patch version
#   .\update-version.ps1 -Version "1.0.0"   # Set specific version
#   .\update-version.ps1 [-Commit]          # Auto-increment and commit

param(
    [Parameter(Mandatory=$false)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [switch]$Commit
)

# If no version specified, read current version and auto-increment patch
if (-not $Version) {
    Write-Host "No version specified. Reading current version and auto-incrementing..." -ForegroundColor Yellow
    
    $versionJson = Get-Content "version.json" | ConvertFrom-Json
    $currentVersion = $versionJson.library_version
    
    Write-Host "Current version: $currentVersion" -ForegroundColor Cyan
    
    # Parse version (handle formats like "1.2.3" or "1.2.3-alpha")
    if ($currentVersion -match '^(\d+)\.(\d+)\.(\d+)(.*)$') {
        $major = [int]$matches[1]
        $minor = [int]$matches[2]
        $patch = [int]$matches[3]
        $suffix = $matches[4]
        
        # Increment patch version
        $patch++
        
        # Rebuild version string
        $Version = "$major.$minor.$patch$suffix"
        
        Write-Host "New version: $Version" -ForegroundColor Green
    } else {
        Write-Error "Could not parse current version: $currentVersion"
        exit 1
    }
}

Write-Host "`nUpdating library version to: $Version" -ForegroundColor Green

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
$setupPyContent = $setupPyContent -replace 'version=\"[^\"]*\"', "version=`"$pythonVersion`""
$setupPyContent | Set-Content $setupPyPath
Write-Host "✓ Updated $setupPyPath" -ForegroundColor Green

# Update C# README.md
$csharpReadmePath = "src/CSharp/DevPossible.Ton/README.md"
$csharpReadmeContent = Get-Content $csharpReadmePath -Raw
$csharpReadmeContent = $csharpReadmeContent -replace 'Version=\"[^\"]*\"', "Version=`"$Version`""
$csharpReadmeContent | Set-Content $csharpReadmePath
Write-Host "✓ Updated $csharpReadmePath (PackageReference version)" -ForegroundColor Green

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
