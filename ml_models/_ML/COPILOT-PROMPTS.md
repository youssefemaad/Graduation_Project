# GitHub Copilot Prompts for AI Implementation

Use these prompts to generate code with GitHub Copilot or Claude 3.5 Sonnet.

## Prompt 1: ML.NET Workout Recommendation Model


```markdown
Create a complete ML.NET workout recommendation system for a fitness platform.

**Context:**
- .NET 8 class library project
- Clean Architecture with separate ML project layer
- PostgreSQL database with exercises table
- User profiles include: age, weight, height, fitness level, goals

**Requirements:**

1. Create WorkoutUserProfile class:
   - Age (float)
   - Weight (float)
   - Height (float)
   - BMI (calculated property)
   - FitnessLevel (string: Beginner/Intermediate/Advanced)
   - FitnessGoal (string: Strength/Cardio/WeightLoss/Muscle/Endurance)
   - AvailableEquipment (string array)
   - DaysPerWeek (int)

2. Create WorkoutPrediction class:
   - PredictedExerciseIds (int array)
   - Scores (float array)
   - Confidence (float)

3. Create WorkoutModelTrainer class:
   - TrainModel(string trainingDataPath) method
   - Uses SdcaMaximumEntropy for multi-class classification
   - Features: Age, Weight, Height, BMI, FitnessLevel, FitnessGoal
   - Label: ExerciseId
   - Evaluates model with cross-validation
   - Saves model as workout_model.zip

4. Create MLPredictionService class:
   - LoadModel() method (thread-safe, singleton pattern)
   - PredictExercises(WorkoutUserProfile profile, int count = 20) method
   - Returns ranked list of exercise recommendations

Include:
- Full error handling
- Logging with ILogger
- XML documentation comments
- Example training data CSV format
- Unit test examples with xUnit
```

## Prompt 2: ASP.NET Core AI Workout Controller

```markdown
Create a complete ASP.NET Core Web API controller for AI-powered workout generation.

**Context:**
- Clean Architecture project
- ML.NET prediction service already exists
- PostgreSQL with EF Core
- JWT authentication

**Requirements:**

1. Create AIWorkoutController with endpoints:

   POST /api/ai/workout/generate
   - Accepts: AIWorkoutRequestDto
   ```csharp
   public class AIWorkoutRequestDto
   {
       public int UserId { get; set; }
       public int Age { get; set; }
       public decimal Weight { get; set; }
       public decimal Height { get; set; }
       public string FitnessLevel { get; set; }
       public string FitnessGoal { get; set; }
       public List<string> AvailableEquipment { get; set; }
       public int DaysPerWeek { get; set; }
       public int DurationWeeks { get; set; }
   }
   ```
   - Returns: Complete WorkoutPlanDto with exercises organized by day
   - Applies workout science: muscle group rotation, progressive overload
   - Saves plan to database

   GET /api/ai/workout/recommend/{userId}/exercises?muscleGroup={group}
   - Returns top 10 exercise recommendations for specific muscle group

   POST /api/ai/workout/similar
   - Accepts: ExerciseId or description
   - Uses vector search to find similar exercises
   - Returns: List of similar exercises with similarity scores

2. Create IMLWorkoutService interface and implementation:
   - GenerateWorkoutPlan(AIWorkoutRequestDto) method
   - RecommendExercises(int userId, string muscleGroup) method
   - FindSimilarExercises(int exerciseId) method

3. Include:
   - [Authorize] attributes
   - FluentValidation for request validation
   - Swagger documentation with examples
   - Error handling with ProblemDetails
   - Logging
   - Response caching
```

## Prompt 3: PostgreSQL Vector Search Service

```markdown
Create a complete vector search service for PostgreSQL with pgvector extension.

**Context:**

**Requirements:**

1. Create IVectorSearchService interface:
```csharp
public interface IVectorSearchService
{
    Task<float[]> GenerateEmbedding(string text);
    Task<List<Exercise>> FindSimilarExercises(float[] embedding, int limit = 10);
    Task<List<Exercise>> SearchByText(string query, int limit = 10);
    Task UpdateExerciseEmbedding(int exerciseId, float[] embedding);
    Task GenerateAllExerciseEmbeddings();
}
```

2. Implement VectorSearchService:
   - GenerateEmbedding: Call OpenAI API (text-embedding-3-small, 384 dimensions)
   - FindSimilarExercises: Use pgvector cosine similarity search
   - SearchByText: Generate embedding then search
   - UpdateExerciseEmbedding: Save embedding to database
   - GenerateAllExerciseEmbeddings: Batch process all exercises

3. Use raw SQL with Npgsql for vector operations:
```sql
SELECT "Id", "Name", "Description",
       1 - ("Embedding" <=> @embedding) as "Similarity"
FROM "Exercises"
WHERE "Embedding" IS NOT NULL
ORDER BY "Embedding" <=> @embedding
LIMIT @limit;
```

4. Create OpenAIEmbeddingService:
   - Handles OpenAI API calls
   - Implements retry logic with Polly
   - Handles rate limiting
   - Batch processing support

5. Create EmbeddingGeneratorHostedService (IHostedService):
   - Runs on application startup
   - Generates embeddings for exercises without them
   - Processes in batches (10 at a time)
   - Logs progress

6. Configuration in appsettings.json:
```json
{
  "OpenAI": {
    "ApiKey": "sk-...",
    "EmbeddingModel": "text-embedding-3-small",
    "EmbeddingDimensions": 384,
    "MaxRetries": 3,
    "BatchSize": 10
  }
}
```

Include:
```
## Prompt 3: PostgreSQL Vector Search Service

```markdown
Create a complete vector search service for PostgreSQL with pgvector extension.

**Context:**
- ASP.NET Core with EF Core
- PostgreSQL 16 with pgvector extension installed
- Local/OSS embeddings using `sentence-transformers` (preferred: `all-MiniLM-L6-v2`)
- Exercises table has Embedding column (vector(384))

**Requirements:**

1. Create IVectorSearchService interface:
```csharp
public interface IVectorSearchService
{
      Task<float[]> GenerateEmbedding(string text);
      /* Lines 130-133 omitted */
      Task GenerateAllExerciseEmbeddings();
}
```

2. Implement VectorSearchService:
    - GenerateEmbedding: Use a local `EmbeddingService` that calls a Python microservice (embedding_server) built on `sentence-transformers/all-MiniLM-L6-v2` (384 dims).
    - GenerateAllExerciseEmbeddings: Batch process all exercises and upsert into `Exercises.Embedding` using `pgvector`.

3. Use raw SQL with Npgsql for vector operations (example):
```sql
SELECT "Id", "Name", "Description",
          1 - ("Embedding" <=> @embedding) as "Similarity"
FROM "Exercises"
WHERE "Embedding" IS NOT NULL
ORDER BY "Embedding" <=> @embedding
LIMIT @limit;
```

4. Create EmbeddingService (Python microservice):
    - Handles embedding generation using `sentence-transformers`.
    - Exposes a small HTTP API for single/batch text -> vector and a CLI for full dataset upsert.

5. Create EmbeddingGeneratorHostedService (IHostedService) in .NET:
    - Optionally runs at startup to ensure embeddings exist for all exercises.
    - Logs progress and supports resume.

6. Configuration in appsettings.json:
```json
{
   "Embeddings": { "ServiceUrl": "http://embedder:5100", "Model": "all-MiniLM-L6-v2" }
}
```

Include:
- Error handling for service failures
- Caching of embeddings
- Logging
- Unit tests with mocked HTTP client
```

## Prompt 4: Python TensorFlow Nutrition Model

```markdown
Create a complete TensorFlow deep learning model for nutrition plan generation.

**Context:**
- Python 3.10+
- TensorFlow 2.15
- Diet recommendations dataset (CSV with 1000+ rows)
- Output: calories, protein, carbs, fats per day

**Requirements:**

1. Create NutritionModel class:
```python
class NutritionDeepLearningModel:
    def __init__(self, config):
        # Initialize model with configuration
        
    def build_model(self):
        # Build neural network:
        # Input layer (10 features)
        # Dense 128 units, ReLU, Dropout 0.3
        # Dense 256 units, ReLU, Dropout 0.3
        # Dense 128 units, ReLU, Dropout 0.2
        # Dense 64 units, ReLU
        # Output layer 4 units (calories, protein, carbs, fats)
        
    def custom_nutrition_loss(self, y_true, y_pred):
        # Custom loss enforcing nutritional constraints:
        # - Protein should be 15-30% of calories
        # - Carbs should be 40-60% of calories
        # - Fats should be 20-35% of calories
        # - Energy equation: calories = (protein*4) + (carbs*4) + (fats*9)
```

2. Create data preprocessing pipeline:
```python
class NutritionDataPreprocessor:
    def preprocess(self, df):
        # Handle missing values
        # Encode categorical: gender, activity_level, fitness_goal, diet_type
        # Scale numerical features: age, weight, height
        # Engineer features: BMI, TDEE, macro ratios
        # Split train/val/test (70/15/15)
        # Return tf.data.Dataset objects
```

3. Create training script (train_nutrition.py):
   - Load diet_recommendations.csv
   - Preprocess data
   - Build and compile model
   - Train with callbacks:
     - EarlyStopping (patience=10)
     - ModelCheckpoint (save best model)
     - ReduceLROnPlateau
     - TensorBoard logging
   - Evaluate on test set
   - Export as SavedModel for TensorFlow Serving
   - Save preprocessor with joblib

4. Create evaluation script:
   - Calculate MAE, MSE, RMSE for each macro
   - Check nutritional constraint violations
   - Generate prediction vs actual plots
   - Create confusion matrix for calorie ranges

5. Configuration (config.yaml):
```yaml
model:
  input_dim: 10
  hidden_layers: [128, 256, 128, 64]
  dropout_rates: [0.3, 0.3, 0.2, 0]
  output_dim: 4

training:
  batch_size: 32
  epochs: 100
  learning_rate: 0.001
  validation_split: 0.15
  
constraints:
  protein_cal_ratio: [0.15, 0.30]
  carbs_cal_ratio: [0.40, 0.60]
  fats_cal_ratio: [0.20, 0.35]
```

Include:
- Full type hints
- Docstrings
- Error handling
- Progress logging
- Model versioning
- Example usage in Jupyter notebook
```

## Prompt 5: React Frontend AI Integration

```markdown
Create React components for AI workout and nutrition plan generation.

**Context:**
- React 18 with TypeScript
- Redux Toolkit for state management
- Axios for API calls
- Tailwind CSS for styling

**Requirements:**

1. Create AIService (src/services/ai.service.ts):
```typescript
interface WorkoutRequest {
  userId: number;
  age: number;
  weight: number;
  height: number;
  fitnessLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  fitnessGoal: 'Strength' | 'Cardio' | 'WeightLoss' | 'Muscle';
  availableEquipment: string[];
  daysPerWeek: number;
  durationWeeks: number;
}

export class AIService {
  async generateWorkoutPlan(request: WorkoutRequest): Promise<WorkoutPlan>;
  async generateNutritionPlan(request: NutritionRequest): Promise<NutritionPlan>;
  async searchExercises(query: string): Promise<Exercise[]>;
}
```

2. Create WorkoutGenerator component:
   - Multi-step form (user profile -> preferences -> equipment)
   - Form validation with react-hook-form
   - Loading state with skeleton loaders
   - Display generated workout plan
   - Allow customization and regeneration
   - Save plan button

3. Create NutritionPlanner component:
   - User profile form
   - Dietary preferences and restrictions
   - Loading animation
   - Display 7-day meal plan with macros
   - Swap meal functionality
   - Shopping list generation

4. Redux slices:
   - aiSlice for workout/nutrition state
   - Async thunks for API calls
   - Loading and error states
   - Caching of generated plans

5. Styling:
   - Modern, clean design with Tailwind
   - Responsive layout
   - Loading animations
   - Success/error notifications

Include:
- Full TypeScript types
- Error boundary
- Loading states
- Form validation
- Accessibility (ARIA labels)
```

## Tips for Using These Prompts

1. **With GitHub Copilot:**
   - Create the file first
   - Add the prompt as a comment at the top
   - Press Enter and let Copilot generate
   - Review and adjust the generated code

2. **With Claude 3.5 Sonnet:**
   - Copy the entire prompt
   - Paste into Claude chat
   - Request modifications as needed
   - Copy generated code to your project

3. **Best Practices:**
   - Generate one component at a time
   - Test each component before moving forward
   - Adjust prompts based on your specific needs
   - Keep context about your existing code structure

4. **Iteration:**
   - Start with basic implementation
   - Add features incrementally
   - Refine with follow-up prompts
   - Test thoroughly at each step
