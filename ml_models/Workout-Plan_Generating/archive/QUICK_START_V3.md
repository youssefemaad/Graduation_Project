# 🚀 Quick Start Guide - Workout Plan Generator v3

## 📦 What You Have Now

### **New Files Created:**

1. ✅ `exercises_comprehensive_real.json` - Complete exercise database (8,132 exercises)
2. ✅ `Workout_Plan_Generator_Training_v3.ipynb` - Training notebook
3. ✅ `V3_IMPROVEMENTS_SUMMARY.md` - Detailed improvements documentation
4. ✅ `MUSCLE_GROUPS_MAPPING.md` - Complete muscle and exercise mapping
5. ✅ `create_real_workout_dataset.py` - Dataset creation script
6. ✅ `extract_pdf_workout.py` - PDF extraction utility

---

## 🎯 How to Train v3 Model

### **Option 1: Google Colab (Recommended)**

#### Step 1: Upload Files to Colab

```python
# Upload to Colab
from google.colab import files
uploaded = files.upload()
# Upload: exercises_comprehensive_real.json
```

#### Step 2: Open Training Notebook

- Upload `Workout_Plan_Generator_Training_v3.ipynb` to Colab
- Or copy cells from the notebook

#### Step 3: Run All Cells

- Execute cells sequentially
- Training will take ~3-4 hours on free Colab GPU
- Monitor loss to ensure proper training

#### Step 4: Download Trained Model

```python
!zip -r workout-generator-v3.zip ./workout-generator-v3
files.download('workout-generator-v3.zip')
```

---

### **Option 2: Local Training (If you have GPU)**

#### Requirements:

- NVIDIA GPU with 16GB+ VRAM
- Python 3.8+
- CUDA 11.7+

#### Install Dependencies:

```bash
cd "ml_models/Workout-Plan_Generating"
pip install torch transformers peft datasets accelerate bitsandbytes tensorboard
```

#### Run Training:

```bash
# Convert notebook to Python script
jupyter nbconvert --to python Workout_Plan_Generator_Training_v3.ipynb

# Run training
python Workout_Plan_Generator_Training_v3.py
```

---

## 📊 Dataset Analysis

### View Dataset Stats:

```python
import json

with open('exercises_comprehensive_real.json', 'r', encoding='utf-8') as f:
    exercises = json.load(f)

print(f"Total exercises: {len(exercises)}")

# Muscle coverage
from collections import defaultdict
muscles = defaultdict(int)
for ex in exercises:
    for muscle in ex.get('targetMuscles', []):
        if muscle:
            muscles[muscle] += 1

print(f"Muscle groups: {len(muscles)}")
for muscle, count in sorted(muscles.items(), key=lambda x: -x[1])[:10]:
    print(f"  {muscle}: {count}")
```

---

## 🧪 Test the Dataset

### Generate Sample Workout:

```python
import json
import random

with open('exercises_comprehensive_real.json', 'r', encoding='utf-8') as f:
    exercises = json.load(f)

# Get push exercises
push_exercises = [ex for ex in exercises
                  if ex.get('movement_pattern') in ['horizontal_push', 'vertical_push']]

print(f"Found {len(push_exercises)} push exercises")
for ex in random.sample(push_exercises, 5):
    print(f"  - {ex['name']}: {ex.get('targetMuscles', [])}")
```

---

## 🎓 Training Parameters (v3)

### **Model Configuration:**

```python
MODEL_NAME = "google/flan-t5-base"
MAX_INPUT_LENGTH = 512
MAX_OUTPUT_LENGTH = 2048
```

### **LoRA Configuration:**

```python
lora_config = LoraConfig(
    r=64,                    # Higher rank for better capacity
    lora_alpha=128,
    target_modules=["q", "v", "k", "o", "wi", "wo"],
    lora_dropout=0.05,
    task_type=TaskType.SEQ_2_SEQ_LM,
)
```

### **Training Arguments:**

```python
training_args = Seq2SeqTrainingArguments(
    num_train_epochs=6,
    per_device_train_batch_size=1,
    gradient_accumulation_steps=16,
    learning_rate=8e-5,
    warmup_ratio=0.1,
    fp16=True,
)
```

### **Expected Results:**

- Training Loss: Should decrease to < 0.5
- Validation Loss: Should be < 0.6
- Training Time: ~3-4 hours on Colab T4 GPU
- Model Size: ~1.2GB (with LoRA adapter)

---

## 📁 Deployment After Training

### **1. Extract Trained Model:**

```bash
cd ml_models/Workout-Plan_Generating/models/
unzip workout-generator-v3.zip
```

### **2. Update App Configuration:**

```python
# In your app.py or config file
MODEL_PATH = "ml_models/Workout-Plan_Generating/models/workout-generator-v3"
```

### **3. Load Model:**

```python
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from peft import PeftModel

# Load base model
base_model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-base")

# Load LoRA adapter
model = PeftModel.from_pretrained(
    base_model,
    f"{MODEL_PATH}/lora_adapter"
)

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
```

### **4. Generate Workout:**

```python
def generate_workout_plan(prompt: str) -> dict:
    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        max_length=512,
        truncation=True
    )

    outputs = model.generate(
        **inputs,
        max_length=2048,
        num_beams=4,
        do_sample=False,
        early_stopping=True
    )

    result = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return json.loads(result)

# Test
plan = generate_workout_plan(
    "Generate a 5-day workout plan for intermediate lifter, "
    "goal is muscle, has access to barbell, dumbbell, cable."
)

print(json.dumps(plan, indent=2))
```

---

## ✅ Validation Checklist

### Before Training:

- [ ] `exercises_comprehensive_real.json` is valid JSON
- [ ] All exercises have required fields
- [ ] Movement patterns are correctly assigned
- [ ] Muscle targeting is accurate

### During Training:

- [ ] Training loss is decreasing
- [ ] Validation loss is stable
- [ ] No out-of-memory errors
- [ ] Generated samples look reasonable

### After Training:

- [ ] Model generates valid JSON
- [ ] Exercises match requested equipment
- [ ] Muscle groups are covered
- [ ] Rep ranges are goal-appropriate
- [ ] Progressive overload is included

---

## 🔍 Troubleshooting

### **Issue: "Out of Memory" during training**

**Solution:**

```python
# Reduce batch size
per_device_train_batch_size=1
gradient_accumulation_steps=8  # Instead of 16

# Or use 8-bit quantization
model = AutoModelForSeq2SeqLM.from_pretrained(
    MODEL_NAME,
    load_in_8bit=True,
    device_map="auto"
)
```

### **Issue: "Invalid JSON in output"**

**Solution:**

- Increase training epochs to 8-10
- Check training data for JSON formatting
- Increase max_output_length if outputs are truncated

### **Issue: "Poor exercise selection"**

**Solution:**

- Verify exercises_comprehensive_real.json has correct muscle mappings
- Increase LoRA rank to 96 for more capacity
- Add more training samples (15,000+)

---

## 📈 Performance Benchmarks

### **v2 vs v3 Comparison:**

| Metric            | v2      | v3              |
| ----------------- | ------- | --------------- |
| Exercise Database | 8,103   | 8,132           |
| Muscle Groups     | ~30     | 43              |
| Training Samples  | 8,000   | 10,000          |
| LoRA Rank         | 32      | 64              |
| Training Time     | 2.5 hrs | 3.5 hrs         |
| Validation Loss   | 0.65    | 0.55 (expected) |
| JSON Validity     | 85%     | 95% (expected)  |
| Muscle Coverage   | 70%     | 95% (expected)  |

---

## 🎯 Next Steps

### **After Successful Training:**

1. ✅ Test model with diverse prompts
2. ✅ Validate output quality
3. ✅ Deploy to production
4. ✅ Monitor user feedback
5. ✅ Collect edge cases for v4

### **For v4 Improvements:**

- [ ] Add exercise video links
- [ ] Include exercise form cues
- [ ] Add warm-up and cool-down
- [ ] Include mobility work
- [ ] Add periodization (mesocycles)
- [ ] Support for home workouts
- [ ] Injury-specific modifications

---

## 📞 Support

### **Dataset Issues:**

- Check `MUSCLE_GROUPS_MAPPING.md` for muscle coverage
- Run `create_real_workout_dataset.py` to regenerate

### **Training Issues:**

- Review `V3_IMPROVEMENTS_SUMMARY.md` for expected behavior
- Check Colab runtime (GPU should be enabled)

### **Deployment Issues:**

- Ensure model path is correct
- Verify all dependencies are installed
- Test with simple prompts first

---

**Version:** 3.0  
**Status:** ✅ Ready for Training  
**Last Updated:** February 5, 2026  
**Estimated Training Time:** 3-4 hours (Colab T4)
