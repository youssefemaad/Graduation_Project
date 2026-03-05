"""
Workout Plan Generator v3 - Local Training Script
Train the model on local machine with GPU support
"""

import json
import random
import pandas as pd
import numpy as np
from tqdm.auto import tqdm
from datetime import datetime
from pathlib import Path
from collections import defaultdict
from typing import List, Dict, Optional, Tuple
from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM,
    Seq2SeqTrainingArguments,
    Seq2SeqTrainer,
    DataCollatorForSeq2Seq,
    set_seed
)
from peft import LoraConfig, get_peft_model, TaskType
from datasets import Dataset
import gc  # For garbage collection
import torch
import os
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'  # Fix OpenMP conflict
# Better GPU memory management
os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'expandable_segments:True'
os.environ['USE_TF'] = 'NO'  # Disable TensorFlow in transformers
os.environ['USE_TORCH'] = 'YES'  # Force PyTorch only

# Import torch FIRST to preload DLLs before other libraries
print("✅ PyTorch loaded successfully")

# Enable memory efficient mode
torch.set_num_threads(4)  # Limit CPU threads to prevent overload

# Now import other libraries


# Configuration
SCRIPT_DIR = Path(__file__).parent
DATA_FILE = SCRIPT_DIR / "data" / "exercises_comprehensive_real.json"
OUTPUT_DIR = SCRIPT_DIR / "models" / "workout-generator-v3"
TRAINING_DATA_FILE = SCRIPT_DIR / "training_data_v3.jsonl"

MODEL_NAME = "google/flan-t5-small"  # Smaller model to reduce memory
MAX_INPUT_LENGTH = 256  # Reduced from 512
MAX_OUTPUT_LENGTH = 1024  # Reduced from 2048
SEED = 42
NUM_SAMPLES = 5000  # Reduced from 10000 to save memory

# Training parameters - Optimized for CPU with low memory
EPOCHS = 3  # Reduced from 6 for fa0ster completion
BATCH_SIZE = 1  # Minimal batch size for CPU
GRADIENT_ACCUMULATION = 2  # Minimal accumulation to save memory
LEARNING_RATE = 8e-5
MAX_GRAD_NORM = 1.0  # Gradient clipping for stability

print("="*70)
print("🏋️ Workout Plan Generator v3 - Local Training")
print("="*70)
print(f"Script directory: {SCRIPT_DIR}")
print(f"Data file: {DATA_FILE}")
print(f"Output directory: {OUTPUT_DIR}")
print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    total_memory = torch.cuda.get_device_properties(0).total_memory / 1e9
    print(f"Total GPU Memory: {total_memory:.1f} GB")
    # Set memory fraction to prevent OOM errors
    torch.cuda.set_per_process_memory_fraction(
        0.85)  # Use max 85% of GPU memory
    print(f"Reserved GPU Memory: {total_memory * 0.85:.1f} GB (85%)")
else:
    print("⚠️ WARNING: No GPU detected! Training will be very slow.")
print("="*70)

set_seed(SEED)

# ============================================================================
# Advanced Workout Generator v3
# ============================================================================


class AdvancedWorkoutGeneratorV3:
    """Professional workout plan generator with real workout data integration"""

    SPLIT_TEMPLATES = {
        3: [
            {
                "name": "Push/Pull/Legs",
                "days": [
                    {
                        "name": "Push (Chest, Shoulders, Triceps)",
                        "patterns": ["horizontal_push", "vertical_push", "shoulder_raise", "elbow_extension"],
                        "muscle_groups": ["chest", "shoulders", "triceps", "front delts", "side delts"]
                    },
                    {
                        "name": "Pull (Back, Biceps)",
                        "patterns": ["horizontal_pull", "vertical_pull", "elbow_flexion"],
                        "muscle_groups": ["back", "lats", "biceps", "rear delts", "middle back", "upper back"]
                    },
                    {
                        "name": "Legs (Quads, Hamstrings, Glutes, Calves)",
                        "patterns": ["squat", "hip_hinge", "knee_extension", "knee_flexion", "calf", "core_flexion"],
                        "muscle_groups": ["quadriceps", "hamstrings", "glutes", "calves", "abs"]
                    }
                ]
            },
            {
                "name": "Full Body",
                "days": [
                    {"name": "Full Body A", "patterns": ["squat", "horizontal_push", "vertical_pull", "core_flexion"],
                     "muscle_groups": ["quads", "chest", "back", "core"]},
                    {"name": "Full Body B", "patterns": ["hip_hinge", "vertical_push", "horizontal_pull", "elbow_flexion"],
                     "muscle_groups": ["posterior chain", "shoulders", "lats", "biceps"]},
                    {"name": "Full Body C", "patterns": ["lunge", "horizontal_push", "vertical_pull", "elbow_extension"],
                     "muscle_groups": ["legs", "chest", "back", "triceps"]}
                ]
            }
        ],
        4: [
            {
                "name": "Upper/Lower",
                "days": [
                    {"name": "Upper A (Push Focus)", "patterns": ["horizontal_push", "vertical_push", "horizontal_pull", "elbow_extension"],
                     "muscle_groups": ["chest", "shoulders", "back", "triceps"]},
                    {"name": "Lower A (Quad Focus)", "patterns": ["squat", "knee_extension", "calf", "core_flexion"],
                     "muscle_groups": ["quadriceps", "glutes", "calves", "abs"]},
                    {"name": "Upper B (Pull Focus)", "patterns": ["vertical_pull", "horizontal_pull", "shoulder_raise", "elbow_flexion"],
                     "muscle_groups": ["back", "lats", "shoulders", "biceps"]},
                    {"name": "Lower B (Posterior Chain)", "patterns": ["hip_hinge", "knee_flexion", "lunge", "calf"],
                     "muscle_groups": ["hamstrings", "glutes", "lower back", "calves"]}
                ]
            },
            {
                "name": "Push/Pull/Legs/Upper",
                "days": [
                    {"name": "Push", "patterns": ["horizontal_push", "vertical_push", "elbow_extension"],
                     "muscle_groups": ["chest", "shoulders", "triceps"]},
                    {"name": "Pull", "patterns": ["vertical_pull", "horizontal_pull", "elbow_flexion"],
                     "muscle_groups": ["back", "lats", "biceps"]},
                    {"name": "Legs", "patterns": ["squat", "hip_hinge", "calf", "core_flexion"],
                     "muscle_groups": ["quads", "hamstrings", "glutes", "calves"]},
                    {"name": "Upper Mix", "patterns": ["horizontal_push", "horizontal_pull", "shoulder_raise"],
                     "muscle_groups": ["chest", "back", "shoulders"]}
                ]
            }
        ],
        5: [
            {
                "name": "Bro Split",
                "days": [
                    {"name": "Chest Day", "patterns": ["horizontal_push", "vertical_push"],
                     "muscle_groups": ["chest", "pectoralis major sternal head", "pectoralis major clavicular head", "front delts"]},
                    {"name": "Back Day", "patterns": ["horizontal_pull", "vertical_pull", "hip_hinge"],
                     "muscle_groups": ["back", "lats", "latissimus dorsi", "trapezius middle fibers", "rear delts"]},
                    {"name": "Shoulder & Arms", "patterns": ["vertical_push", "shoulder_raise", "elbow_flexion", "elbow_extension"],
                     "muscle_groups": ["shoulders", "side delts", "rear delts", "biceps", "triceps"]},
                    {"name": "Legs", "patterns": ["squat", "hip_hinge", "knee_extension", "knee_flexion", "calf"],
                     "muscle_groups": ["quadriceps", "hamstrings", "gluteus maximus", "calves"]},
                    {"name": "Arms & Abs", "patterns": ["elbow_flexion", "elbow_extension", "core_flexion", "core_stability"],
                     "muscle_groups": ["biceps brachii", "brachialis", "triceps brachii", "abs"]}
                ]
            },
            {
                "name": "PPL + Upper/Lower",
                "days": [
                    {"name": "Push", "patterns": ["horizontal_push", "vertical_push", "elbow_extension"],
                     "muscle_groups": ["chest", "shoulders", "triceps"]},
                    {"name": "Pull", "patterns": ["vertical_pull", "horizontal_pull", "elbow_flexion"],
                     "muscle_groups": ["back", "biceps", "rear delts"]},
                    {"name": "Legs", "patterns": ["squat", "hip_hinge", "calf"],
                     "muscle_groups": ["quads", "hamstrings", "glutes", "calves"]},
                    {"name": "Upper Body", "patterns": ["horizontal_push", "horizontal_pull", "shoulder_raise"],
                     "muscle_groups": ["chest", "back", "shoulders"]},
                    {"name": "Lower Body", "patterns": ["squat", "hip_hinge", "knee_extension", "knee_flexion"],
                     "muscle_groups": ["quads", "hamstrings", "glutes"]}
                ]
            }
        ]
    }

    PROMPT_TEMPLATES = [
        "Generate a {days}-day workout plan for {level} lifter, goal is {goal}{context}.",
        "Create a {days}-day {goal} program for {level} trainee{context}.",
        "Design a {days} day per week workout routine for {level} {goal} training{context}.",
        "Build a {goal} focused {days}-day split for {level} gym-goer{context}.",
        "Make a {days}-day {level} workout plan targeting {goal}{context}.",
        "I need a {days}-day {goal} workout plan. I'm {level}{context}.",
        "Can you create a {goal} program? {days} days per week, {level} level{context}.",
        "Looking for a {days}-day {level} program for {goal}{context}.",
        "Give me a {days} day {goal} split, {level} lifter{context}.",
        "Plan a {days}-day {level} workout focused on {goal}{context}."
    ]

    FITNESS_LEVELS = ["Beginner", "Intermediate", "Advanced"]
    FITNESS_GOALS = ["Strength", "Muscle", "Hypertrophy",
                     "WeightLoss", "Endurance", "General"]

    def __init__(self, exercises: List[Dict]):
        self.exercises = exercises
        self._organize_exercises()

    def _organize_exercises(self):
        """Organize exercises by pattern, muscle, equipment, and type"""
        self.by_pattern = defaultdict(list)
        self.by_muscle = defaultdict(list)
        self.by_equipment = defaultdict(list)
        self.all_equipment = set()
        self.compound = []
        self.isolation = []

        for ex in self.exercises:
            pattern = ex.get('movement_pattern', 'other')
            self.by_pattern[pattern].append(ex)

            for muscle in ex.get('targetMuscles', []):
                if muscle:
                    self.by_muscle[muscle.lower()].append(ex)

            for eq in ex.get('equipments', ['body weight']):
                eq_lower = eq.lower()
                self.all_equipment.add(eq_lower)
                self.by_equipment[eq_lower].append(ex)

            if ex.get('exercise_type') == 'compound':
                self.compound.append(ex)
            else:
                self.isolation.append(ex)

        print(f"✅ Organized {len(self.exercises)} exercises:")
        print(f"   - Movement patterns: {len(self.by_pattern)}")
        print(f"   - Muscle groups: {len(self.by_muscle)}")
        print(f"   - Equipment types: {len(self.all_equipment)}")
        print(
            f"   - Compound: {len(self.compound)}, Isolation: {len(self.isolation)}")

    def _get_exercises_for_pattern(
        self, pattern: str, muscle_groups: List[str], equipment: List[str],
        goal: str, level: str, n: int = 2
    ) -> List[Dict]:
        """Get best exercises for a pattern, prioritizing muscle groups"""
        candidates = self.by_pattern.get(pattern, [])
        if not candidates:
            return []

        if equipment:
            equipment_lower = [e.lower() for e in equipment]
            candidates = [ex for ex in candidates
                          if any(eq.lower() in equipment_lower for eq in ex.get('equipments', ['body weight']))]

        if level == "Beginner":
            candidates = [ex for ex in candidates if ex.get(
                'difficulty_level', 3) <= 3]

        goal_key = goal if goal in [
            "Strength", "Muscle", "WeightLoss", "Endurance", "Power"] else "Muscle"

        def score(ex):
            goal_score = ex.get('goal_suitability', {}).get(goal_key, 5)
            muscle_score = sum(3 for target in ex.get('targetMuscles', [])
                               if any(mg.lower() in target.lower() or target.lower() in mg.lower() for mg in muscle_groups))
            order_priority = ex.get('order_priority', 5)
            return (goal_score * 2) + muscle_score - order_priority

        candidates = sorted(candidates, key=score, reverse=True)
        selected = []
        used_names = set()

        for ex in candidates:
            if ex['name'] not in used_names:
                selected.append(ex)
                used_names.add(ex['name'])
                if len(selected) >= n:
                    break

        if len(selected) < n and len(candidates) > n:
            remaining = [
                ex for ex in candidates if ex['name'] not in used_names]
            selected.extend(random.sample(
                remaining, min(n - len(selected), len(remaining))))

        return selected[:n]

    def _format_exercise(self, ex: Dict, goal: str) -> Dict:
        """Format exercise with goal-specific parameters"""
        goal_key = goal if goal in ex.get(
            'rep_ranges_by_goal', {}) else 'Muscle'
        rep_config = ex.get('rep_ranges_by_goal', {}).get(goal_key, {
            'min_reps': 8, 'max_reps': 12, 'rest_seconds': 90, 'sets': 3
        })

        return {
            "name": ex['name'].title(),
            "sets": str(rep_config.get('sets', 3)),
            "reps": f"{rep_config['min_reps']}-{rep_config['max_reps']}",
            "rest": f"{rep_config['rest_seconds']} sec",
            "target_muscles": ex.get('targetMuscles', [])[:3],
            "equipment": ex.get('equipments', ['body weight'])[0] if ex.get('equipments') else 'body weight',
            "movement_pattern": ex.get('movement_pattern', 'other'),
            "exercise_type": ex.get('exercise_type', 'isolation'),
            "notes": random.choice([
                "Focus on controlled movement", "Full range of motion", "Mind-muscle connection",
                "Maintain proper form", "Control the eccentric"
            ])
        }

    def _build_prompt(self, level: str, goal: str, days: int, equipment: List[str]) -> str:
        """Build natural language prompt"""
        template = random.choice(self.PROMPT_TEMPLATES)
        context = f", has access to {', '.join(equipment[:4])}" if equipment else ""
        return template.format(days=days, level=level.lower(), goal=goal.lower(), context=context)

    def generate_plan(self) -> Dict:
        """Generate a complete training example"""
        level = random.choice(self.FITNESS_LEVELS)
        goal = random.choice(self.FITNESS_GOALS)
        days = random.choice([3, 4, 5])

        equipment = random.sample(list(self.all_equipment),
                                  k=min(random.randint(4, 8), len(self.all_equipment)))

        prompt = self._build_prompt(level, goal, days, equipment)
        split = random.choice(self.SPLIT_TEMPLATES.get(
            days, self.SPLIT_TEMPLATES[3]))
        goal_key = "Muscle" if goal in ["Hypertrophy", "General"] else goal

        plan = {
            "plan_name": f"{days}-Day {goal} {split['name']}",
            "fitness_level": level,
            "goal": goal,
            "days_per_week": days,
            "program_duration_weeks": random.choice([4, 6, 8, 12]),
            "days": []
        }

        for i, day_template in enumerate(split['days'], 1):
            day = {
                "day_number": i,
                "day_name": f"Day {i}: {day_template['name']}",
                "focus_areas": day_template['muscle_groups'][:4],
                "estimated_duration_minutes": random.randint(45, 90),
                "exercises": []
            }

            all_exercises = []
            for pattern in day_template['patterns']:
                exs = self._get_exercises_for_pattern(
                    pattern, day_template['muscle_groups'], equipment, goal_key, level, n=2)
                for ex in exs:
                    all_exercises.append((ex.get('order_priority', 5), ex))

            all_exercises.sort(key=lambda x: x[0])
            num_exercises = random.randint(5, 8)

            for _, ex in all_exercises[:num_exercises]:
                day['exercises'].append(self._format_exercise(ex, goal_key))

            plan['days'].append(day)

        plan['progressive_overload'] = {
            "type": "Progressive",
            "progression": "Increase intensity or volume weekly",
            "deload": "Every 6-8 weeks"
        }
        plan['notes'] = f"Focus on form and progressive overload for {goal} goals."

        return {"input": prompt, "output": json.dumps(plan, ensure_ascii=False)}

    def generate_dataset(self, n: int = 5000) -> List[Dict]:
        """Generate training dataset"""
        dataset = []
        for _ in tqdm(range(n), desc="Generating training data"):
            dataset.append(self.generate_plan())
        return dataset


# ============================================================================
# Main Training Script
# ============================================================================

def main():
    print("\n" + "="*70)
    print("STEP 1: Loading Exercise Database")
    print("="*70)

    if not DATA_FILE.exists():
        print(f"❌ ERROR: Data file not found: {DATA_FILE}")
        print(
            "Please make sure exercises_comprehensive_real.json exists in the data folder.")
        return

    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        exercises = json.load(f)

    print(f"✅ Loaded {len(exercises)} exercises")

    # Analyze muscle coverage
    muscles_count = defaultdict(int)
    for ex in exercises:
        for muscle in ex.get('targetMuscles', []):
            if muscle:
                muscles_count[muscle] += 1

    print(f"   Muscle groups covered: {len(muscles_count)}")
    print(
        f"   Top 5 muscles: {', '.join([m for m, _ in sorted(muscles_count.items(), key=lambda x: -x[1])[:5]])}")

    # ========================================================================
    print("\n" + "="*70)
    print("STEP 2: Generating Training Data")
    print("="*70)

    generator = AdvancedWorkoutGeneratorV3(exercises)

    if TRAINING_DATA_FILE.exists():
        print(f"⚠️ Training data file already exists: {TRAINING_DATA_FILE}")
        response = input("Do you want to regenerate it? (y/n): ")
        if response.lower() != 'y':
            print("Loading existing training data...")
            training_data = []
            with open(TRAINING_DATA_FILE, 'r', encoding='utf-8') as f:
                for line in f:
                    training_data.append(json.loads(line))
            print(f"✅ Loaded {len(training_data)} training examples from file")
        else:
            training_data = generator.generate_dataset(NUM_SAMPLES)
            with open(TRAINING_DATA_FILE, 'w', encoding='utf-8') as f:
                for item in training_data:
                    f.write(json.dumps(item, ensure_ascii=False) + '\n')
            print(
                f"✅ Generated and saved {len(training_data)} training examples")
    else:
        training_data = generator.generate_dataset(NUM_SAMPLES)
        with open(TRAINING_DATA_FILE, 'w', encoding='utf-8') as f:
            for item in training_data:
                f.write(json.dumps(item, ensure_ascii=False) + '\n')
        print(f"✅ Generated and saved {len(training_data)} training examples")

    # Preview
    print("\n📋 Sample training example:")
    sample = training_data[0]
    print(f"   INPUT: {sample['input'][:100]}...")
    output = json.loads(sample['output'])
    print(f"   OUTPUT: {output['plan_name']}, {len(output['days'])} days")

    # ========================================================================
    print("\n" + "="*70)
    print("STEP 3: Loading Model and Tokenizer")
    print("="*70)

    print(f"Loading tokenizer from {MODEL_NAME}...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

    print(f"Loading model from {MODEL_NAME}...")
    model = AutoModelForSeq2SeqLM.from_pretrained(
        MODEL_NAME,
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        device_map="auto" if torch.cuda.is_available() else None
    )

    print(f"✅ Model loaded! Parameters: {model.num_parameters():,}")

    # ========================================================================
    print("\n" + "="*70)
    print("STEP 4: Setting up LoRA")
    print("="*70)

    lora_config = LoraConfig(
        r=64,
        lora_alpha=128,
        target_modules=["q", "v", "k", "o", "wi", "wo"],
        lora_dropout=0.05,
        bias="none",
        task_type=TaskType.SEQ_2_SEQ_LM,
        inference_mode=False
    )

    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # ========================================================================
    print("\n" + "="*70)
    print("STEP 5: Preparing Dataset")
    print("="*70)

    dataset = Dataset.from_list(training_data)
    split_dataset = dataset.train_test_split(test_size=0.1, seed=SEED)
    print(
        f"✅ Train: {len(split_dataset['train'])}, Test: {len(split_dataset['test'])}")

    def preprocess_function(examples):
        model_inputs = tokenizer(
            examples['input'],
            max_length=MAX_INPUT_LENGTH,
            padding='max_length',
            truncation=True,
            return_tensors=None
        )

        labels = tokenizer(
            examples['output'],
            max_length=MAX_OUTPUT_LENGTH,
            padding='max_length',
            truncation=True,
            return_tensors=None
        )

        model_inputs['labels'] = labels['input_ids']
        return model_inputs

    print("Tokenizing dataset...")
    tokenized_dataset = split_dataset.map(
        preprocess_function,
        batched=True,
        remove_columns=['input', 'output'],
        desc="Tokenizing"
    )
    print("✅ Dataset tokenized!")

    # ========================================================================
    print("\n" + "="*70)
    print("STEP 6: Training Configuration")
    print("="*70)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    training_args = Seq2SeqTrainingArguments(
        output_dir=str(OUTPUT_DIR),
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRADIENT_ACCUMULATION,
        learning_rate=LEARNING_RATE,
        weight_decay=0.01,
        warmup_ratio=0.1,
        max_grad_norm=MAX_GRAD_NORM,  # Gradient clipping for stability
        logging_dir=str(OUTPUT_DIR / 'logs'),
        logging_steps=25,
        eval_strategy="steps",
        eval_steps=250,
        save_strategy="steps",
        save_steps=250,
        save_total_limit=3,
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        greater_is_better=False,
        fp16=torch.cuda.is_available(),
        bf16=False,  # Ensure bf16 is disabled
        dataloader_num_workers=0,  # Avoid Windows multiprocessing issues
        dataloader_pin_memory=True,  # Speed up GPU data transfer
        gradient_checkpointing=False,  # Disabled for speed
        optim="adamw_torch",  # Native PyTorch optimizer
        report_to="tensorboard",
        predict_with_generate=True,
        generation_max_length=MAX_OUTPUT_LENGTH,
        generation_num_beams=4,
    )

    data_collator = DataCollatorForSeq2Seq(
        tokenizer=tokenizer,
        model=model,
        padding=True
    )

    trainer = Seq2SeqTrainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset['train'],  # type: ignore
        eval_dataset=tokenized_dataset['test'],  # type: ignore
        processing_class=tokenizer,
        data_collator=data_collator,
    )

    print(f"✅ Trainer configured")
    print(f"   Epochs: {EPOCHS}")
    print(f"   Batch size: {BATCH_SIZE}")
    print(f"   Gradient accumulation: {GRADIENT_ACCUMULATION}")
    print(f"   Effective batch size: {BATCH_SIZE * GRADIENT_ACCUMULATION}")
    print(f"   Learning rate: {LEARNING_RATE}")
    print(f"   FP16: {torch.cuda.is_available()}")

    # ========================================================================
    print("\n" + "="*70)
    print("STEP 7: Starting Training 🚀")
    print("="*70)
    print(f"Training will save checkpoints to: {OUTPUT_DIR}")
    print(
        f"You can monitor training with: tensorboard --logdir {OUTPUT_DIR / 'logs'}")
    print("="*70)

    input("\nPress ENTER to start training...")

    try:
        trainer.train()

        print("\n" + "="*70)
        print("✅ Training completed successfully!")
        print("="*70)

        # Evaluate
        print("\nEvaluating model...")
        eval_results = trainer.evaluate()
        print(f"\n📊 Final Evaluation Results:")
        for key, value in eval_results.items():
            print(f"   {key}: {value:.4f}")

        # Save model
        print("\nSaving final model...")
        trainer.save_model(str(OUTPUT_DIR))
        tokenizer.save_pretrained(str(OUTPUT_DIR))

        lora_dir = OUTPUT_DIR / "lora_adapter"
        model.save_pretrained(str(lora_dir))

        print(f"\n✅ Model saved to: {OUTPUT_DIR}")
        print(f"✅ LoRA adapter saved to: {lora_dir}")
        print("\n🎉 Training complete! Your model is ready to use.")

    except KeyboardInterrupt:
        print("\n\n⚠️ Training interrupted by user!")
        print(f"Latest checkpoint saved in: {OUTPUT_DIR}")
    except Exception as e:
        print(f"\n❌ Error during training: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
