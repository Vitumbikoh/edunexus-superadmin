# Test script to verify Graduated class is created with schoolId
# Usage: .\test-graduated.ps1 -Token "your_token" [-SchoolId "school_id"]

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$false)]
    [string]$SchoolId = "4ba487ae-16c8-4403-a6f4-5a0241cbee04",
    
    [Parameter(Mandatory=$false)]
    [string]$ApiBase = "http://localhost:3000/api/v1"
)

Write-Host "🧪 Testing Graduated Class Creation with schoolId..." -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Using school ID: $SchoolId" -ForegroundColor Green
Write-Host "✓ Using API base: $ApiBase" -ForegroundColor Green
Write-Host ""

# Headers
$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
    "X-Tenant-ID" = $SchoolId
}

# Step 1: List classes for this school
Write-Host "Step 1: Checking for existing Graduated class..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$ApiBase/classes?schoolId=$SchoolId" -Headers $headers -Method Get
    
    $graduatedClass = $response | Where-Object { $_.name -ieq "Graduated" }
    
    if ($graduatedClass) {
        Write-Host "✓ Graduated class found" -ForegroundColor Green
        
        if ($graduatedClass.schoolId -eq $SchoolId) {
            Write-Host "✅ TEST PASSED: Graduated class has correct schoolId!" -ForegroundColor Green
            Write-Host "   schoolId: $($graduatedClass.schoolId)" -ForegroundColor Green
            Write-Host "   numericalName: $($graduatedClass.numericalName)" -ForegroundColor Green
            
            if ($graduatedClass.numericalName -eq 999) {
                Write-Host "✅ numericalName is correct (999)" -ForegroundColor Green
                exit 0
            } else {
                Write-Host "⚠️  numericalName is $($graduatedClass.numericalName), expected 999" -ForegroundColor Yellow
                exit 1
            }
        } else {
            Write-Host "❌ TEST FAILED: Graduated class has wrong schoolId!" -ForegroundColor Red
            Write-Host "   Expected: $SchoolId" -ForegroundColor Red
            Write-Host "   Actual: $($graduatedClass.schoolId)" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host "⚠️  Graduated class not found. Will create..." -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Failed to list classes: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Create Graduated class
Write-Host ""
Write-Host "Step 2: Creating Graduated class..." -ForegroundColor Yellow

$createBody = @{
    name = "Graduated"
    numericalName = 999
    description = "Graduated class"
    schoolId = $SchoolId
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$ApiBase/classes?schoolId=$SchoolId" -Headers $headers -Method Post -Body $createBody
    
    Write-Host "✓ Created successfully" -ForegroundColor Green
    Write-Host "   ID: $($createResponse.id)" -ForegroundColor Gray
    Write-Host "   Name: $($createResponse.name)" -ForegroundColor Gray
    Write-Host "   schoolId: $($createResponse.schoolId)" -ForegroundColor Gray
    
    $classId = $createResponse.id
    
} catch {
    Write-Host "❌ Failed to create Graduated class: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Verify the created class
Write-Host ""
Write-Host "Step 3: Verifying created class..." -ForegroundColor Yellow

try {
    $verifyResponse = Invoke-RestMethod -Uri "$ApiBase/classes/$classId" -Headers $headers -Method Get
    
    Write-Host "✓ Retrieved class details" -ForegroundColor Green
    Write-Host "   Name: $($verifyResponse.name)" -ForegroundColor Gray
    Write-Host "   numericalName: $($verifyResponse.numericalName)" -ForegroundColor Gray
    Write-Host "   schoolId: $($verifyResponse.schoolId)" -ForegroundColor Gray
    
    if ($verifyResponse.schoolId -eq $SchoolId -and $verifyResponse.numericalName -eq 999) {
        Write-Host ""
        Write-Host "✅ TEST PASSED: Graduated class created with correct schoolId and numericalName!" -ForegroundColor Green
        exit 0
    } else {
        Write-Host ""
        Write-Host "❌ TEST FAILED: Mismatch in created class" -ForegroundColor Red
        if ($verifyResponse.schoolId -ne $SchoolId) {
            Write-Host "   schoolId mismatch: Expected $SchoolId, got $($verifyResponse.schoolId)" -ForegroundColor Red
        }
        if ($verifyResponse.numericalName -ne 999) {
            Write-Host "   numericalName mismatch: Expected 999, got $($verifyResponse.numericalName)" -ForegroundColor Red
        }
        exit 1
    }
    
} catch {
    Write-Host "❌ Failed to verify created class: $_" -ForegroundColor Red
    exit 1
}
