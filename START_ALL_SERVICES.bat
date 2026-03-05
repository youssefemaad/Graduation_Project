@echo off
echo ========================================
echo   AI Workout System - Starting All Services
echo ========================================
echo.

echo [1/3] Starting AI Model and Python API (Port 8000)...
echo Loading Flan-T5-Small + LoRA Adapter (this may take 30 seconds)...
start "AI Model API" cmd /k "cd /d "%~dp0ml_models\Workout-Plan_Generating" && conda activate workout_ml && set KMP_DUPLICATE_LIB_OK=TRUE && echo Loading AI Model... && python workout_api.py"
timeout /t 8 /nobreak >nul

echo [2/3] Starting C# Backend API (Port 5000)...
start "Backend API" cmd /k "cd /d "%~dp0Graduation-Project" && dotnet run"
timeout /t 5 /nobreak >nul

echo [3/3] Starting Next.js Frontend (Port 3000)...
start "Frontend" cmd /k "cd /d "%~dp0codeflex-ai" && npm run dev"

echo.
echo ========================================
echo   All Services Starting!
echo ========================================
echo.
echo   AI Model:    Flan-T5-Small + LoRA (77M + 7M params)
echo   Python API:  http://localhost:8000  (AI Workout Generator)
echo   Backend:     http://localhost:5000  (C# API)
echo   Frontend:    http://localhost:3000  (Next.js App)
echo.
echo   Model Location: models/workout-generator-v3/
echo   Status: Loading model and starting inference server...
echo.
echo   Access the AI Workout Generator at:
echo   http://localhost:3000/ai-workout
echo.
echo   Coach Review Dashboard at:
echo   http://localhost:3000/coach-review
echo.
echo   NOTE: Wait for "AI Model loaded successfully" message
echo         in the AI Model API window before using the app.
echo.
echo Press any key to exit (services will keep running)...
pause >nul
