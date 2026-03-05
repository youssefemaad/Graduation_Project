"""Quick test of v5 training data generation"""
from transformers import AutoTokenizer
from train_workout_generator_v5 import WorkoutGeneratorV5
import json
import sys
from pathlib import Path
sys.path.insert(0, '.')


# Load exercises
data_file = Path(__file__).parent / "data" / "exercises_final.json"
with open(data_file, "r", encoding="utf-8") as f:
    exercises = json.load(f)

gen = WorkoutGeneratorV5(exercises)
print(f"Exercise DB size: {len(gen.exercises)}")
print(f"Muscles: {len(gen.by_muscle)} groups")

# Generate 3 regular examples
for i in range(3):
    ex = gen.generate_example()
    print(f"\n{'='*60}")
    print(f"EXAMPLE {i+1}")
    print(f"{'='*60}")
    print(f"USER ({len(ex['user'])} chars):")
    print(ex['user'][:300])
    print(f"\nASSISTANT ({len(ex['assistant'])} chars):")
    print(ex['assistant'][:600])
    print("...")

# Generate 1 injury example
print(f"\n{'='*60}")
print("INJURY EXAMPLE")
print(f"{'='*60}")
ex = gen.generate_injury_example()
print(f"USER ({len(ex['user'])} chars):")
print(ex['user'][:300])
print(f"\nASSISTANT ({len(ex['assistant'])} chars):")
print(ex['assistant'][:600])

# Token count estimation
tok = AutoTokenizer.from_pretrained(
    "Qwen/Qwen2.5-3B-Instruct", trust_remote_code=True)

examples = [gen.generate_example() for _ in range(20)]
lengths = []
for e in examples:
    msgs = [
        {"role": "system", "content": "You are an expert fitness AI that generates personalized workout plans."},
        {"role": "user", "content": e["user"]},
        {"role": "assistant", "content": e["assistant"]},
    ]
    text = tok.apply_chat_template(msgs, tokenize=False)
    tokens = tok.encode(text)
    lengths.append(len(tokens))

print(f"\n{'='*60}")
print(f"TOKEN STATS (20 samples)")
print(f"{'='*60}")
print(f"Min: {min(lengths)}")
print(f"Max: {max(lengths)}")
print(f"Mean: {sum(lengths)/len(lengths):.0f}")
print(
    f"MAX_SEQ_LENGTH=2048, fits: {sum(1 for l in lengths if l <= 2048)}/{len(lengths)}")
print(f"Would need 2560: {sum(1 for l in lengths if l > 2048)}/{len(lengths)}")
