@echo off
echo ========================================
echo Workout Generator v3 - Training
echo ========================================
echo.

echo Activating Conda Environment...
call conda activate D:\Youssef\Projects\Ai_Env\env
if errorlevel 1 (
    echo ERROR: Failed to activate conda environment
    echo Please run setup_v3.bat first
    pause
    exit /b 1
)

REM Fix OpenMP conflict warning
set KMP_DUPLICATE_LIB_OK=TRUE

echo ✓ Environment activated
echo.

echo Starting Training...
python train_workout_generator_v3.py

echo.
echo ========================================
echo Training session ended
echo ========================================
pause
