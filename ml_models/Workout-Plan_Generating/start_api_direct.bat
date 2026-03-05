@echo off
echo ========================================
echo Starting Workout ML API (Direct Mode)
echo ========================================
echo.
echo This version includes:
echo - Direct frontend calls (CORS enabled)
echo - PostgreSQL RAG for user context  
echo - Optimized for performance
echo.

cd /d "%~dp0"

:: Activate conda environment
echo Activating workout_ml environment...
call conda activate workout_ml

if errorlevel 1 (
    echo ERROR: Failed to activate conda environment
    echo Please run: conda create -n workout_ml python=3.11
    pause
    exit /b 1
)

:: Check if asyncpg is installed
python -c "import asyncpg" 2>nul
if errorlevel 1 (
    echo Installing asyncpg for PostgreSQL...
    pip install asyncpg==0.29.0
)

:: Set environment variable to avoid OpenMP error
set KMP_DUPLICATE_LIB_OK=TRUE

echo.
echo Starting FastAPI server (Direct Mode) on port 5301...
echo API will be available at: http://localhost:5301
echo Health check: http://localhost:5301/health
echo.

uvicorn workout_api_direct:app --host 0.0.0.0 --port 5301 --reload

pause
