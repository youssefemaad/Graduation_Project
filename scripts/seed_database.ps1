# Load Npgsql from backend bin folder
$npgsqlPath = "Graduation-Project\bin\Debug\net8.0\Npgsql.dll"
Add-Type -Path $npgsqlPath

# Read SQL file
$sqlFile = "Documentation\SeedData_Complete_Updated.sql"
$sqlContent = Get-Content -Path $sqlFile -Raw

# Connection string
$connString = "Host=localhost;Port=5432;Database=PulseGym_v1.0.1;Username=postgres;Password=123"

Write-Host "Connecting to database..." -ForegroundColor Cyan

try {
    $conn = New-Object Npgsql.NpgsqlConnection($connString)
    $conn.Open()
    
    Write-Host "Connected successfully! Executing seed script..." -ForegroundColor Green
    
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = $sqlContent
    $cmd.CommandTimeout = 120
    
    $result = $cmd.ExecuteNonQuery()
    
    Write-Host "Seed script executed successfully! Rows affected: $result" -ForegroundColor Green
    
    $conn.Close()
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
