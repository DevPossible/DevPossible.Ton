# PowerShell script to run individual samples
param(
    [Parameter(Mandatory=$false)]
    [int]$SampleNumber = 1
)

$samples = @{
    1 = "Basic Parsing"
    2 = "File Operations"
    3 = "Object Conversion"
    4 = "Schema Validation"
    5 = "Array Operations"
    6 = "Advanced Serialization"
    7 = "Complex Document"
    8 = "Error Handling"
    9 = "Performance Test"
}

Write-Host "Running sample $SampleNumber : $($samples[$SampleNumber])" -ForegroundColor Green
Write-Host ""

# Create a temporary file with the input
$tempFile = [System.IO.Path]::GetTempFileName()
@"
$SampleNumber
0
"@ | Out-File -FilePath $tempFile -Encoding ASCII

# Run the sample
try {
    Get-Content $tempFile | dotnet run --no-build
}
finally {
    # Clean up temp file
    Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
}