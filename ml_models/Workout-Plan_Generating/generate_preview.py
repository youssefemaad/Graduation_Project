"""Generate sample training data for review before full training"""
from train_workout_generator_v5 import WorkoutGeneratorV5
import json
import sys
import random
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))


# Load exercises
data_file = Path(__file__).parent / "data" / "exercises_final.json"
with open(data_file, "r", encoding="utf-8") as f:
    exercises = json.load(f)

gen = WorkoutGeneratorV5(exercises)

# Generate 50 diverse examples for review
random.seed(42)
samples = []

# 40 regular + 10 injury
for i in range(40):
    samples.append(gen.generate_example())
for i in range(10):
    samples.append(gen.generate_injury_example())

# Save as readable JSONL
out_file = Path(__file__).parent / "training_data_preview.jsonl"
with open(out_file, "w", encoding="utf-8") as f:
    for s in samples:
        f.write(json.dumps(s, ensure_ascii=False) + "\n")

# Also save a human-readable version
readable_file = Path(__file__).parent / "training_data_preview_readable.txt"
with open(readable_file, "w", encoding="utf-8") as f:
    for i, s in enumerate(samples):
        f.write(f"{'='*70}\n")
        f.write(f"SAMPLE {i+1}/50\n")
        f.write(f"{'='*70}\n\n")
        f.write(f"--- USER MESSAGE ---\n{s['user']}\n\n")
        f.write(f"--- ASSISTANT RESPONSE ---\n{s['assistant']}\n\n\n")

print(f"Generated {len(samples)} samples")
print(f"JSONL: {out_file}")
print(f"Readable: {readable_file}")
print(f"\nOpen training_data_preview_readable.txt to review the data!")
