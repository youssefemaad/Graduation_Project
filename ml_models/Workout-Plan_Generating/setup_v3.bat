@echo off
echo ========================================
echo Workout Generator v3 - Setup Script
echo ========================================
echo.

echo Step 1: Activating Conda Environment...
call conda activate D:\Youssef\Projects\Ai_Env\env
if errorlevel 1 (
    echo ERROR: Failed to activate conda environment
    pause
    exit /b 1
)
echo ✓ Conda environment activated
echo.

echo Step 2: Installing Requirements...
pip install -r requirements_v3.txt
if errorlevel 1 (
    echo ERROR: Failed to install requirements
    pause
    exit /b 1
)
echo ✓ Requirements installed
echo.

echo Step 3: Checking GPU Availability...
python -c "import torch; print('CUDA Available:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None')"
echo.

echo ========================================
echo ✓ Setup Complete!
echo ========================================
echo.
echo You can now run the training script:
echo   python train_workout_generator_v3.py
echo.
pause
