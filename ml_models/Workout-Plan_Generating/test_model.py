"""
Test the trained workout plan generator model
"""
import torch
import json
import sys
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from peft import PeftModel

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Paths
MODEL_DIR = "models/workout-generator-v3"
BASE_MODEL = "google/flan-t5-small"

print("Loading model...")
tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
base_model = AutoModelForSeq2SeqLM.from_pretrained(BASE_MODEL)
model = PeftModel.from_pretrained(base_model, MODEL_DIR)
model.eval()

print("✅ Model loaded!\n")

# Test prompts
test_prompts = [
    "Generate a 3-day workout plan for beginner lifter, goal is strength, has access to dumbbell, barbell.",
    "Create a 5-day hypertrophy program for advanced trainee, has access to cable, leverage machine.",
]

print("=" * 70)
print("Testing Model")
print("=" * 70)

for i, prompt in enumerate(test_prompts, 1):
    print(f"\n🔵 Test {i}:")
    print(f"   Prompt: {prompt}")
    
    # Tokenize
    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        max_length=256,
        truncation=True,
        padding=True
    )
    
    # Generate
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_length=1024,
            num_beams=4,
            early_stopping=True,
            temperature=0.7,
            do_sample=False
        )
    
    # Decode
    result = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # Save first output to file for inspection
    if i == 1:
        with open("test_output_sample.json", "w", encoding="utf-8") as f:
            f.write(result)
        print(f"   💾 Saved output to test_output_sample.json")
    
    # Show full output
    print(f"   📄 Raw output length: {len(result)} chars")
    
    # Parse JSON
    try:
        workout_plan = json.loads(result)
        print(f"   ✅ Generated Plan: {workout_plan['plan_name']}")
        print(f"   Days: {len(workout_plan['days'])}")
        for day in workout_plan['days']:
            print(f"      - {day['name']}: {len(day['exercises'])} exercises")
    except json.JSONDecodeError as e:
        print(f"   ⚠️ Invalid JSON output: {e}")
        print(f"   First 500 chars: {result[:500]}")
        
        # Try to fix missing brackets
        if not result.startswith('{'):
            result = '{' + result
        if not result.endswith('}'):
            result = result + ']}'
            
        try:
            workout_plan = json.loads(result)
            print(f"   ✅ Fixed! Generated Plan: {workout_plan['plan_name']}")
            print(f"   Days: {len(workout_plan['days'])}")
        except:
            print(f"   ❌ Could not parse JSON even after fixes")

print("\n" + "=" * 70)
print("✅ Testing complete!")
print("=" * 70)
