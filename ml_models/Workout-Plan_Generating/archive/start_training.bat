@echo off
echo ========================================
echo Starting Workout Plan Generator v3 Training
echo ========================================
echo.

REM Activate conda environment
call conda activate workout_ml

REM Navigate to script directory
cd /d "%~dp0"

REM Set environment variables for GPU optimization
set KMP_DUPLICATE_LIB_OK=TRUE
set PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True

echo Environment activated: workout_ml
echo GPU Memory Management: Optimized
echo.

REM Check GPU status
echo Checking GPU status...
python -c "import torch; print('PyTorch:', torch.__version__); print('CUDA Available:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'No GPU - Training will be SLOW')"
echo.

echo ========================================
echo Starting Training...
echo ========================================
echo.

REM Start training
python train_workout_generator_v3.py

echo.
echo ========================================
echo Training Complete!
echo ========================================
pause
