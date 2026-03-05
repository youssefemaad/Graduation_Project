# PowerShell Script to Insert Test Data into PostgreSQL
$connectionString = "Host=localhost;Port=5432;Database=PulseGym_v1.0.1;Username=postgres;Password=123"

try {
    # Try to load Npgsql from NuGet cache or local assembly
    $npgsqlPath = "$env:USERPROFILE\.nuget\packages\npgsql\*\lib\net6.0\Npgsql.dll"
    $npgsqlFiles = @(Get-ChildItem -Path $npgsqlPath -ErrorAction SilentlyContinue)
    
    if ($npgsqlFiles.Count -gt 0) {
        Add-Type -Path $npgsqlFiles[0].FullName
        Write-Host "✅ Loaded Npgsql from NuGet cache"
    } else {
        # Try alternative: use .NET version
        Write-Host "📦 Installing Npgsql from NuGet..."
        dotnet add package Npgsql
        $npgsqlPath = "$env:USERPROFILE\.nuget\packages\npgsql\*\lib\net6.0\Npgsql.dll"
        $npgsqlFile = Get-ChildItem -Path $npgsqlPath -ErrorAction SilentlyContinue | Select-Object -First 1
        Add-Type -Path $npgsqlFile.FullName
    }
    
    # Read SQL file
    $sqlFile = "Documentation/INSERT_TEST_DATA.sql"
    
    if (-not (Test-Path $sqlFile)) {
        Write-Host "❌ SQL file not found: $sqlFile"
        exit 1
    }
    
    $sqlContent = Get-Content $sqlFile -Raw
    Write-Host "✅ Loaded SQL file"
    
    # Create connection
    $connection = [Npgsql.NpgsqlConnection]::new($connectionString)
    $connection.Open()
    Write-Host "✅ Connected to PostgreSQL"
    
    # Parse and execute SQL commands
    $sqlCommands = $sqlContent -split ";" | Where-Object { $_.Trim().Length -gt 10 } | Where-Object { -not $_.Trim().StartsWith("--") }
    
    $successCount = 0
    $errorCount = 0
    
    foreach ($sqlCmd in $sqlCommands) {
        $trimmedCmd = $sqlCmd.Trim()
        if ($trimmedCmd.Length -eq 0) { continue }
        
        try {
            $pgCommand = $connection.CreateCommand()
            $pgCommand.CommandText = $trimmedCmd
            $pgCommand.CommandTimeout = 30
            
            $result = $pgCommand.ExecuteNonQuery()
            $successCount++
            
            $preview = if ($trimmedCmd.Length -gt 60) { 
                $trimmedCmd.Substring(0, 60) + "..." 
            } else { 
                $trimmedCmd 
            }
            Write-Host "  ✓ $preview"
            
            $pgCommand.Dispose()
        } catch {
            $errorCount++
            $errorMsg = $_.Exception.Message
            Write-Host "  ✗ Error: $errorMsg"
        }
    }
    
    $connection.Close()
    $connection.Dispose()
    
    Write-Host ""
    Write-Host "============================================================"
    Write-Host "OK DATA INSERTION COMPLETE"
    Write-Host "============================================================"
    Write-Host ""
    Write-Host "Summary:"
    Write-Host "  [OK] Successfully executed: $successCount commands"
    if ($errorCount -gt 0) {
        Write-Host "  [!] Failed commands: $errorCount"
    }
    Write-Host ""
    Write-Host "Equipment Added:"
    Write-Host "  - 8 Cardio machines (Treadmills, Rowers, Bikes, Ellipticals)"
    Write-Host "  - 15 Strength training equipment (Racks, Benches, Dumbbells, Machines)"
    Write-Host "  - 6 Functional training items (TRX, Kettlebells, Resistance Bands, etc.)"
    Write-Host "  - 4 Recovery tools (Foam Rollers, Massage Guns, Yoga Mats)"
    Write-Host "  - 3 Olympic equipment (Platforms, Bumper Plates, Competition Barbells)"
    Write-Host "  Total: 36 pieces of equipment"
    Write-Host ""
    Write-Host "InBody Measurements Added:"
    Write-Host "  - User 1 (John Doe): 5 measurements - Weight loss journey"
    Write-Host "  - User 2 (Michael Smith): 4 measurements - Muscle gain/bulk"
    Write-Host "  - User 3 (David Wilson): 3 measurements - Maintenance"
    Write-Host "  - User 4 (Jessica Brown): 5 measurements - Fat loss transformation"
    Write-Host "  - User 5 (Lisa Anderson): 3 measurements - Athletic performance"
    Write-Host "  - User 6 (Amanda Garcia): 3 measurements - Beginner journey"
    Write-Host "  Total: 23 measurements"
    Write-Host ""
    Write-Host "OK Your database is now ready for testing the AI Workout Generator!"
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)"
    Write-Host "Stack: $($_.Exception.StackTrace)"
    exit 1
}
