# AI/ML Implementation Guide for IntelliFit Platform


## Overview
This guide provides step-by-step instructions to implement AI/ML capabilities in your graduation project.

## Project Structure Updates

```
Graduation-Project/
├── Graduation-Project.ML/          ⭐ NEW - ML.NET Models
├── ml_models/                      ⭐ NEW - Python TensorFlow
├── Datasets/                       ⭐ NEW - Training data
├── Documentation/
│   └── ML/                        ⭐ NEW - ML documentation
├── Core/
│   ├── Interfaces/
│   │   └── Services/
│   │       ├── IMLWorkoutService.cs       ⭐ NEW
│   │       ├── IMLNutritionService.cs     ⭐ NEW
│   │       └── IVectorSearchService.cs    ⭐ NEW
│   └── DTOs/
│       ├── AIWorkoutRequestDto.cs         ⭐ NEW
│       └── AINutritionRequestDto.cs       ⭐ NEW
├── Infrastructure/
│   └── Services/
│       ├── MLWorkoutService.cs            ⭐ NEW
│       ├── MLNutritionService.cs          ⭐ NEW
│       └── VectorSearchService.cs         ⭐ NEW
├── Graduation-Project/
│   └── Controllers/
│       ├── AIWorkoutController.cs         ⭐ NEW
│       └── AINutritionController.cs       ⭐ NEW
└── docker-compose.yml                     ⭐ NEW
```

## Phase 1: Setup ML.NET Project (Week 1)

### Step 1: Create ML.NET Project

```bash
cd Graduation-Project
dotnet new classlib -n Graduation-Project.ML
dotnet sln add Graduation-Project.ML/Graduation-Project.ML.csproj
```

### Step 2: Install NuGet Packages

```bash
cd Graduation-Project.ML
dotnet add package Microsoft.ML --version 3.0.1
dotnet add package Microsoft.ML.Recommender --version 0.21.1
dotnet add package Microsoft.ML.TensorFlow --version 3.0.1
dotnet add package Npgsql --version 8.0.1
```

### Step 3: Create Project Structure

Create these folders in `Graduation-Project.ML/`:
- Models/
- Data/
- Training/
- Services/
- Configuration/

## Phase 2: Database Schema Updates (Week 1-2)

### Step 1: Install pgvector Extension

Run in PostgreSQL:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Step 2: Add Vector Columns

See `Documentation/ML/01_DatabaseMigration.sql` for complete migration.

### Step 3: Create EF Core Migration

```bash
cd Infrastructure
dotnet ef migrations add AddMLSupport --startup-project ../Graduation-Project
dotnet ef database update --startup-project ../Graduation-Project
```

## Phase 3: Download Datasets (Week 2)

### Required Datasets

1. **Free Exercise DB** (800+ exercises)
   - Source: https://github.com/yuhonas/free-exercise-db
   - Download JSON file to `Datasets/raw/free_exercise_db.json`

2. **Fitness Exercises Dataset** (1,500+ exercises)
   - Source: https://www.kaggle.com/datasets/exercisedb/fitness-exercises-dataset
   - Download to `Datasets/raw/fitness_exercises.csv`

3. **Diet Recommendations Dataset**
   - Source: https://www.kaggle.com/datasets/ziya07/diet-recommendations-dataset
   - Download to `Datasets/raw/diet_recommendations.csv`

### Import Data Script

Run the data import:

```bash
dotnet run --project Graduation-Project -- import-datasets
```

## Phase 4: Python ML Setup (Week 2-3)

### Step 1: Create Python Virtual Environment

```bash
cd ml_models
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Train TensorFlow Models (priorities)

Recommendation and priorities (start here):

1. Embeddings first (required for RAG and similarity search)
  - Build a small `embedding_server.py` that uses `sentence-transformers/all-MiniLM-L6-v2` (384 dims).
  - Generate embeddings for `Exercises` and upsert into `Exercises.Embedding` (pgvector).
  - Validate similarity queries using provided SQL function `fn_FindSimilarExercises`.

2. Nutrition model (TensorFlow)
  - Train `train_nutrition.py` per `ml_models/config.yaml` and export SavedModel to `ml_models/serving/nutrition_model/1/`.
  - Run TensorFlow Serving and exercise the REST predict API.

3. Workout recommender (ML.NET or LightGBM)
  - Use user workout history to train a ranking/recommender model and export as ML.NET model or ONNX if preferred.

4. LLM / Chat (text-only prototype)
  - Prototype conversational flows using a small open-source instruction-tuned model (or hosted HF inference) *after* embeddings and the recommender are working.
  - For on-premise inference consider `mistral-7b` or `llama-2` only when GPU resources are available; otherwise use a small CPU-friendly model for development.

```bash
# Train nutrition model
python training/train_nutrition.py

# Train workout LSTM model
python training/train_workout.py
```

### Step 3: Setup TensorFlow Serving

```bash
# Using Docker
docker-compose up tensorflow-serving
```

## Phase 5: Implement ML.NET Services (Week 3-4)

### Step 1: Create Model Classes

Implement in `Graduation-Project.ML/Models/`:
- WorkoutRecommendationModel.cs
- NutritionRecommendationModel.cs

### Step 2: Create Training Services

Implement in `Graduation-Project.ML/Training/`:
- WorkoutModelTrainer.cs
- NutritionModelTrainer.cs

### Step 3: Train Models

```bash
dotnet run --project Graduation-Project.ML -- train-workout
dotnet run --project Graduation-Project.ML -- train-nutrition
```

## Phase 6: API Integration (Week 4-5)

### Step 1: Create Interfaces in Core

Add to `Core/Interfaces/Services/`:
- IMLWorkoutService.cs
- IMLNutritionService.cs
- IMLPredictionService.cs
- IVectorSearchService.cs

### Step 2: Implement Services in Infrastructure

Add to `Infrastructure/Services/`:
- MLWorkoutService.cs
- MLNutritionService.cs
- MLPredictionService.cs
- VectorSearchService.cs

### Step 3: Create API Controllers

Add to `Graduation-Project/Controllers/`:
- AIWorkoutController.cs
- AINutritionController.cs

### Step 4: Configure Dependency Injection

Update `Program.cs`:

```csharp
// ML Services
builder.Services.AddSingleton<MLContext>();
builder.Services.AddSingleton<IMLPredictionService, MLPredictionService>();
builder.Services.AddScoped<IMLWorkoutService, MLWorkoutService>();
builder.Services.AddScoped<IMLNutritionService, MLNutritionService>();
builder.Services.AddScoped<IVectorSearchService, VectorSearchService>();
builder.Services.AddHttpClient<ITensorFlowService, TensorFlowService>();
```

## Phase 7: Frontend Integration (Week 5-6)

### Step 1: Create AI Service in React

Add to `intellifit-frontend/src/services/ai.service.ts`

### Step 2: Create UI Components

Add to `intellifit-frontend/src/components/AI/`:
- WorkoutGenerator.tsx
- NutritionPlanner.tsx

### Step 3: Integrate with Redux Store

Update Redux slices for AI state management.

## Phase 8: Testing & Deployment (Week 6-7)

### Step 1: Unit Tests

```bash
dotnet test Graduation-Project.Tests
```

### Step 2: Integration Tests

Test API endpoints with Postman/Swagger.

### Step 3: Docker Deployment

```bash
docker-compose up --build
```

## Configuration Files

### appsettings.json Updates

```json
{
  "ML": {
    "ModelsPath": "./MLModels",
    "WorkoutModelPath": "./MLModels/workout_model.zip",
    "NutritionModelPath": "./MLModels/nutrition_model.zip"
  },
  "TensorFlowServing": {
    "Url": "http://localhost:8501",
    "NutritionModelName": "nutrition_model",
    "Timeout": 30
  },
  "OpenAI": {
    "ApiKey": "your-api-key",
    "EmbeddingModel": "text-embedding-3-small",
    "EmbeddingDimensions": 384
  }
}
```

## GitHub Copilot Prompts

Use the prompts in `Documentation/ML/COPILOT-PROMPTS.md` to generate code with AI assistance.

## Best Practices

1. **Model Versioning**: Keep track of model versions in database
2. **Error Handling**: Implement robust error handling for ML predictions
3. **Caching**: Cache predictions to reduce computation
4. **Monitoring**: Log prediction requests and performance metrics
5. **A/B Testing**: Test different model versions with users

## Troubleshooting

### ML.NET Model Not Loading
- Check model file path in appsettings.json
- Ensure model file exists and is not corrupted
- Verify model was trained with same ML.NET version

### TensorFlow Serving Connection Failed
- Check if Docker container is running: `docker ps`
- Verify port 8501 is not blocked
- Test endpoint: `curl http://localhost:8501/v1/models/nutrition_model`

### Vector Search Slow Performance
- Create indexes on vector columns
- Use IVFFlat index for large datasets
- Consider reducing embedding dimensions

## Next Steps

1. ✅ Review this implementation guide
2. ✅ Follow Phase 1 to create ML.NET project
3. ✅ Complete database migrations
4. ✅ Download datasets
5. ✅ Start implementing ML services

## Resources

- ML.NET Documentation: https://docs.microsoft.com/en-us/dotnet/machine-learning/
- TensorFlow Documentation: https://www.tensorflow.org/guide
- pgvector Documentation: https://github.com/pgvector/pgvector
- GitHub Copilot: Use prompts in Documentation/ML/

## Support

For issues or questions:
1. Check Documentation/ML/ folder
2. Review example code in each module
3. Use GitHub Copilot with provided prompts
4. Test with sample data in Datasets/

Good luck with your graduation project! 🚀
