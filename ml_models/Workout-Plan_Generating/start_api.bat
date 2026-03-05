@echo off
echo ========================================
echo Starting Workout Plan Generator API
echo ========================================
echo.

cd /d "d:\Youssef\Projects\_Graduation Project\Project Repo\Graduation-project\ml_models\Workout-Plan_Generating"

echo Activating conda environment...
call conda activate workout_ml

echo.
echo Starting FastAPI server on http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

set KMP_DUPLICATE_LIB_OK=TRUE
uvicorn workout_api:app --host 0.0.0.0 --port 8000 --reload

pause
