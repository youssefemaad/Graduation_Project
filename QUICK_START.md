# 🚀 Quick Start Guide - AI Workout Generator

## Start All Services (Quick)

### Option 1: Automated Startup (Recommended)

```batch
# Windows - Run from project root
START_ALL_SERVICES.bat
```

### Option 2: Manual Startup

```bash
# Terminal 1: Python API
cd "d:\Youssef\Projects\_Graduation Project\Project Repo\Graduation-project"
start_api.bat

# Terminal 2: C# Backend
cd Graduation-Project
dotnet run

# Terminal 3: Frontend
cd codeflex-ai
npm run dev
```

## Access the Application

1. **Frontend**: http://localhost:3000
2. **C# API**: http://localhost:5000
3. **Python API**: http://localhost:8000

## Member Workflow - Generate Workout

1. Navigate to **AI Workout Generator**:
   - Click "Generate AI Workout" button on dashboard
   - Or go to: http://localhost:3000/ai-workout

2. Fill the form:
   - **Days per week**: 3-7
   - **Fitness level**: Beginner, Intermediate, Advanced
   - **Goal**: Strength, Hypertrophy, Weight Loss, etc.
   - **Equipment**: Select available equipment

3. Click **"Generate Workout Plan"** and wait (~5-10 seconds)

4. Review the AI-generated plan with all exercises

5. Click **"Save to Calendar"** to add to your schedule

6. View in **Schedule**: http://localhost:3000/schedule

## Coach Workflow - Review Plans

1. Navigate to **Coach Review Dashboard**:
   - Go to: http://localhost:3000/coach-review

2. View pending workout plans from members

3. Click a plan to open review modal

4. Review and edit:
   - Modify sets, reps, rest times
   - Add coaching notes to exercises

5. Take action:
   - **Approve**: Green button → Plan approved
   - **Reject**: Red button → Provide feedback for AI

## AI Feedback Loop - Improve Plans

1. When rejecting a plan, provide detailed feedback:
   - Use quick templates or write custom feedback
   - Example: "Too much volume for beginner. Reduce sets and add more rest."

2. Click **"Regenerate with AI Feedback"**

3. AI learns from feedback and generates improved plan

4. New plan submitted for coach review again

5. Repeat until plan meets standards

## Troubleshooting

### Python API Won't Start

```bash
# Check conda environment
conda activate workout_ml

# Reinstall dependencies
pip install -r api_requirements.txt

# Check model location
# Should be: models/workout-generator-v3/
```

### C# API Errors

```bash
# Restore packages
cd Graduation-Project
dotnet restore

# Rebuild
dotnet build

# Check appsettings.json has correct Python API URL
"WorkoutGeneratorAPI": {
  "BaseUrl": "http://localhost:8000"
}
```

### Frontend Won't Connect

```bash
# Check environment variables
# File: codeflex-ai/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000

# Reinstall dependencies
cd codeflex-ai
npm install

# Clear cache
npm run build
```

### Model Not Found

```bash
# Model should be at:
models/workout-generator-v3/
  ├── adapter_config.json
  ├── adapter_model.safetensors
  ├── README.md
  ├── special_tokens_map.json
  ├── spiece.model
  ├── tokenizer.json
  └── tokenizer_config.json

# If missing, retrain the model:
python train_workout_generator_v3.py
```

## Testing the System

### 1. Test Python API

```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Create a 3-day beginner strength program with barbell and dumbbell","max_length":2000}'
```

Expected: JSON workout plan

### 2. Test C# API

```bash
curl -X GET http://localhost:5000/api/WorkoutGenerator/health
```

Expected: `"Healthy"`

### 3. Test Frontend

1. Open http://localhost:3000/ai-workout
2. Fill form and generate plan
3. Verify plan displays correctly
4. Save to calendar
5. Check http://localhost:3000/schedule

## Quick Reference

### Port Numbers

- Frontend (Next.js): **3000**
- C# Backend: **5000**
- Python API: **8000**

### Key URLs

- AI Generator: `/ai-workout`
- Coach Review: `/coach-review`
- Schedule/Calendar: `/schedule`
- C# API Health: `/api/WorkoutGenerator/health`
- Python API Docs: `http://localhost:8000/docs`

### File Locations

- Frontend Components: `codeflex-ai/src/components/`
- Frontend Pages: `codeflex-ai/src/app/`
- Frontend Services: `codeflex-ai/src/services/`
- C# Controllers: `Infrastructure/Presentation/Controllers/`
- C# Services: `Core/Service/Services/`
- C# DTOs: `Shared/DTOs/`
- Python API: `workout_api.py`
- Trained Model: `models/workout-generator-v3/`

## Support

For detailed information, see:

- **Full Integration Guide**: `FRONTEND_INTEGRATION_COMPLETE.md`
- **Setup Documentation**: `SETUP_COMPLETE.md`
- **Training Guide**: `ml_models/Workout-Plan_Generating/README.md`

---

✅ **System Ready!** Start generating AI-powered workout plans with coach review and feedback learning.
