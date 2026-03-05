@echo off
echo ========================================
echo Testing Environment Setup
echo ========================================
echo.

echo Activating Conda Environment...
call conda activate D:\Youssef\Projects\Ai_Env\env
echo.

echo Setting environment variable for OpenMP...
set KMP_DUPLICATE_LIB_OK=TRUE
echo.

echo Testing Python and PyTorch...
python -c "import sys; print('Python:', sys.version.split()[0])"
echo.

python -c "import torch; print('PyTorch:', torch.__version__); print('CUDA Available:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'No GPU'); print('GPU Memory:', round(torch.cuda.get_device_properties(0).total_memory/1e9, 1), 'GB' if torch.cuda.is_available() else '')"
echo.

echo Testing Transformers...
python -c "import transformers; print('Transformers:', transformers.__version__)"
echo.

echo Testing PEFT...
python -c "import peft; print('PEFT:', peft.__version__)"
echo.

echo Testing Dataset...
python -c "import os; path = r'd:\Youssef\Projects\_Graduation Project\Project Repo\Graduation-project\ml_models\Workout-Plan_Generating\data\exercises_comprehensive_real.json'; print('Dataset exists:', os.path.exists(path)); print('Dataset path:', path if os.path.exists(path) else 'NOT FOUND')"
echo.

echo ========================================
echo Environment Test Complete!
echo ========================================
pause
