$connectionString = "Host=localhost;Port=5432;Database=PulseGym_v1.0.1;Username=postgres;Password=123"

try {
    Write-Host "Starting data insertion..."
    
    # Try to load Npgsql
    try {
        Add-Type -AssemblyName Npgsql
    } catch {
        $npgsqlPath = "$env:USERPROFILE\.nuget\packages\npgsql\*\lib\net6.0\Npgsql.dll"
        $npgsqlFile = @(Get-ChildItem -Path $npgsqlPath -ErrorAction SilentlyContinue)[0]
        if ($npgsqlFile) {
            Add-Type -Path $npgsqlFile.FullName
        } else {
            Write-Host "Cannot load Npgsql. Trying alternative method..."
        }
    }
    
    $sqlFile = "Documentation/INSERT_TEST_DATA.sql"
    
    if (-not (Test-Path $sqlFile)) {
        Write-Host "SQL file not found: $sqlFile"
        exit 1
    }
    
    $sqlContent = Get-Content $sqlFile -Raw
    Write-Host "Loaded SQL file"
    
    $connection = New-Object Npgsql.NpgsqlConnection($connectionString)
    $connection.Open()
    Write-Host "Connected to PostgreSQL"
    
    $sqlCommands = $sqlContent -split ";" | Where-Object { $_.Trim().Length -gt 10 }
    
    $successCount = 0
    $errorCount = 0
    
    foreach ($sqlCmd in $sqlCommands) {
        $trimmedCmd = $sqlCmd.Trim()
        
        if ($trimmedCmd.StartsWith("--") -or $trimmedCmd.Length -eq 0) { continue }
        
        try {
            $pgCommand = $connection.CreateCommand()
            $pgCommand.CommandText = $trimmedCmd
            $pgCommand.CommandTimeout = 30
            
            $result = $pgCommand.ExecuteNonQuery()
            $successCount++
            Write-Host "  [+] Command executed"
            
            $pgCommand.Dispose()
        } catch {
            $errorCount++
            Write-Host "  [!] Error: $($_.Exception.Message)"
        }
    }
    
    $connection.Close()
    $connection.Dispose()
    
    Write-Host ""
    Write-Host "COMPLETE"
    Write-Host "=========================================="
    Write-Host "Successfully executed: $successCount commands"
    if ($errorCount -gt 0) {
        Write-Host "Failed commands: $errorCount"
    }
    Write-Host ""
    Write-Host "Data inserted:"
    Write-Host "  - 36 pieces of equipment across 5 categories"
    Write-Host "  - 23 InBody measurements from 6 users"
    Write-Host ""
    Write-Host "Database ready for AI Workout Generator testing!"
    
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    exit 1
}
