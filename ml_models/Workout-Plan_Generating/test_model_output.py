"""
Quick test script to see what the ML model is actually generating
"""
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from peft import PeftModel
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(SCRIPT_DIR, "models", "workout-generator-v3")
BASE_MODEL = "google/flan-t5-small"

print("Loading model...")
tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
base_model = AutoModelForSeq2SeqLM.from_pretrained(BASE_MODEL)
model = PeftModel.from_pretrained(base_model, MODEL_DIR)
model.eval()
print("Model loaded!")

prompt = """Generate a 3-day workout plan for a beginner level person with the goal of muscle. Available equipment: Dumbbells. Output valid JSON with plan_name, days array (each with day_name, focus_areas, exercises with name, sets, reps, rest)."""

inputs = tokenizer(prompt, return_tensors="pt", max_length=256, truncation=True, padding=True)

with torch.no_grad():
    outputs = model.generate(
        **inputs,
        max_length=1024,
        num_beams=4,
        early_stopping=True,
        do_sample=False
    )

result = tokenizer.decode(outputs[0], skip_special_tokens=True)

print("\n" + "="*80)
print("RAW MODEL OUTPUT:")
print("="*80)
print(result)
print("="*80)
print(f"\nLength: {len(result)} characters")

# Save to file for inspection
with open("model_output.txt", "w", encoding="utf-8") as f:
    f.write(result)
print("Saved to model_output.txt")
