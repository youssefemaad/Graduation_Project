"""
Wrapper script to fix DLL loading issues and start training
"""
import os
import sys

# Add torch lib directory to PATH to fix DLL loading
torch_lib_path = r"D:\Youssef\Programs\miniconda3\Lib\site-packages\torch\lib"
if os.path.exists(torch_lib_path):
    os.add_dll_directory(torch_lib_path)
    os.environ['PATH'] = torch_lib_path + \
        os.pathsep + os.environ.get('PATH', '')

# Set environment variables
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'expandable_segments:True'

# Now import and run the training script
with open('train_workout_generator_v3.py', 'r', encoding='utf-8') as f:
    exec(f.read())
