# Seed InBody measurements for the member user
$loginBody = '{"email":"member@intellifit.com","password":"224466"}'
$loginResult = Invoke-RestMethod -Uri "http://localhost:5025/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$token = $loginResult.token
Write-Output "Login successful, token obtained"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$measurements = @(
    '{"userId":1,"weight":88,"height":175,"bodyFatPercentage":24,"muscleMass":32,"boneMass":3.2,"bodyWater":52,"visceralFat":8,"bmi":28.7,"basalMetabolicRate":1750,"notes":"Initial scan","measurementDate":"2025-09-15T10:00:00Z"}',
    '{"userId":1,"weight":86,"height":175,"bodyFatPercentage":22.5,"muscleMass":33.5,"boneMass":3.3,"bodyWater":54,"visceralFat":7,"bmi":28.1,"basalMetabolicRate":1780,"notes":"Second scan - good progress","measurementDate":"2025-10-15T10:00:00Z"}',
    '{"userId":1,"weight":84,"height":175,"bodyFatPercentage":21,"muscleMass":34.8,"boneMass":3.3,"bodyWater":55,"visceralFat":7,"bmi":27.4,"basalMetabolicRate":1810,"notes":"Third scan - muscle gain","measurementDate":"2025-11-15T10:00:00Z"}',
    '{"userId":1,"weight":82,"height":175,"bodyFatPercentage":19.5,"muscleMass":36,"boneMass":3.4,"bodyWater":56.5,"visceralFat":6,"bmi":26.8,"basalMetabolicRate":1840,"notes":"Fourth scan - getting leaner","measurementDate":"2025-12-15T10:00:00Z"}',
    '{"userId":1,"weight":80,"height":175,"bodyFatPercentage":18,"muscleMass":37.2,"boneMass":3.5,"bodyWater":58,"visceralFat":5,"bmi":26.1,"basalMetabolicRate":1870,"notes":"Fifth scan - great results","measurementDate":"2026-01-15T10:00:00Z"}',
    '{"userId":1,"weight":79,"height":175,"bodyFatPercentage":17,"muscleMass":38,"boneMass":3.5,"bodyWater":59,"visceralFat":5,"bmi":25.8,"basalMetabolicRate":1890,"notes":"Latest scan - lean muscle building","measurementDate":"2026-02-10T10:00:00Z"}'
)

foreach ($body in $measurements) {
    try {
        $result = Invoke-RestMethod -Uri "http://localhost:5025/api/inbody" -Method POST -Headers $headers -Body $body -ContentType "application/json"
        Write-Output "Created measurement ID: $($result.measurementId)"
    } catch {
        Write-Output "Error: $($_.Exception.Message)"
        $errorResponse = $_.ErrorDetails.Message
        Write-Output "Details: $errorResponse"
    }
}

Write-Output "Done seeding InBody data!"
