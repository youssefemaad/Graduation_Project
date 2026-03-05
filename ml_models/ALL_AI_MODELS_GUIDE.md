# IntelliFit AI/ML System - Complete Engineering Guide

> **Author**: Senior AI Engineering Team  
> **Version**: 2.0  
> **Last Updated**: January 2026  
> **Status**: Production Specification

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Model 1: Workout Generator](#2-model-1-workout-generator)
3. [Model 2: Nutrition Planner](#3-model-2-nutrition-planner)
4. [Model 3: Vision Analyzer](#4-model-3-vision-analyzer)
5. [Model 4: Knowledge RAG System](#5-model-4-knowledge-rag-system)
6. [Model 5: AI Coach Orchestrator](#6-model-5-ai-coach-orchestrator)
7. [Model 6: System Analytics AI](#7-model-6-system-analytics-ai)
8. [Database Architecture](#8-database-architecture)
9. [Production Infrastructure](#9-production-infrastructure)
10. [Requirements from You](#10-requirements-from-you)

---

## 1. System Overview

### 1.1 Core Philosophy
All AI interactions should be **conversational**, not form-based. Users talk naturally and AI responds contextually.

### 1.2 The 6 Models Summary

| Model | Type | Tech Stack | Port | Database |
|-------|------|------------|------|----------|
| Workout Generator | Seq2Seq LLM | Flan-T5 + LoRA | 5300 | PostgreSQL + pgvector |
| Nutrition Planner | Regression DNN | TensorFlow | 8501 | PostgreSQL |
| Vision Analyzer | Zero-shot Classification | CLIP | 5200 | PostgreSQL (history) |
| Knowledge RAG | Embeddings + Retrieval | Sentence-Transformers | 5100 | PostgreSQL + pgvector |
| AI Coach | Orchestrator LLM | GPT-4 API | N/A (C#) | PostgreSQL + Redis |
| System Analytics | Forecasting + NLQ | Prophet + LangChain | 5400 | PostgreSQL + TimescaleDB |

### 1.3 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Unified AI Chat Interface                       │   │
│  │         (Text + Voice + Photo + Rich Responses)             │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ REST/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      C# Backend API                                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   AI Coach Orchestrator                       │  │
│  │     (Intent Detection, Context Building, Function Calling)   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│         │              │              │              │              │
│         ▼              ▼              ▼              ▼              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐        │
│  │ Workout  │   │Nutrition │   │  Vision  │   │Analytics │        │
│  │   API    │   │   API    │   │   API    │   │   API    │        │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘        │
└───────┼──────────────┼──────────────┼──────────────┼────────────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Python ML Services (FastAPI)                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │Embedding│  │ Workout │  │ Vision  │  │Nutrition│  │Analytics│   │
│  │ :5100   │  │ LLM:5300│  │ :5200   │  │ :8501   │  │ :5400   │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
└─────────────────────────────┬────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Databases                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │ PostgreSQL  │  │    Redis    │  │ (Optional)  │                 │
│  │ + pgvector  │  │   (Cache)   │  │ TimescaleDB │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Model 1: Workout Generator

### 2.1 Why This Model?
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| GPT-4 API | Best quality | Expensive ($0.03/1K tokens), latency | ❌ Too costly |
| Llama-2-7B | Good quality, free | 14GB VRAM, slow on CPU | ❌ Too heavy |
| **Flan-T5-Base** | Fast, 900MB, trainable | Less creative | ✅ **Selected** |
| Mistral-7B | Great quality | 14GB VRAM | ❌ Too heavy |

**Final Choice**: `google/flan-t5-base` with custom LoRA fine-tuning
- **Why**: Small (900MB), runs on CPU, can be fine-tuned on your data, outputs structured JSON well

### 2.2 Training Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    Training Pipeline                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Data Collection                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Sources:                                                  │   │
│  │ - wger exercise database (800+ exercises)                │   │
│  │ - YOUR workout plans (from coaches) ← NEED FROM YOU      │   │
│  │ - Fitness subreddits (scraped plans)                     │   │
│  │ - Scientific papers (training principles)                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ▼                                   │
│  Step 2: Create Training Pairs                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Format: (prompt, completion)                             │   │
│  │                                                          │   │
│  │ Prompt: "Generate 4-day workout for intermediate,        │   │
│  │          muscle gain, no shoulder exercises"             │   │
│  │                                                          │   │
│  │ Completion: {"plan_name": "...", "days": [...]}         │   │
│  │                                                          │   │
│  │ Target: 5,000+ training pairs                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ▼                                   │
│  Step 3: LoRA Fine-Tuning                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Config:                                                  │   │
│  │ - LoRA rank: 16                                         │   │
│  │ - Alpha: 32                                             │   │
│  │ - Target modules: q, v                                  │   │
│  │ - Learning rate: 2e-4                                   │   │
│  │ - Epochs: 3-5                                           │   │
│  │ - Batch size: 4 (gradient accumulation: 8)              │   │
│  │                                                          │   │
│  │ Hardware: RTX 4050 (6GB) sufficient                     │   │
│  │ Time: ~2-4 hours for 5K samples                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              ▼                                   │
│  Step 4: Evaluation                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Metrics:                                                 │   │
│  │ - JSON validity rate: >95%                              │   │
│  │ - Schema compliance: >90%                               │   │
│  │ - Exercise relevance (CLIP similarity): >0.7            │   │
│  │ - Human eval (coach review): 4/5 average                │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Database Schema

```sql
-- Exercises table with embeddings for RAG
CREATE TABLE Exercises (
    Id SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Description TEXT,
    MuscleGroup VARCHAR(100),
    Equipment VARCHAR(100),
    Difficulty VARCHAR(50),
    Embedding vector(384),  -- For semantic search
    CreatedAt TIMESTAMP DEFAULT NOW()
);

-- Generated workout plans for learning
CREATE TABLE GeneratedWorkoutPlans (
    Id SERIAL PRIMARY KEY,
    UserId INT REFERENCES Users(Id),
    Prompt TEXT NOT NULL,
    GeneratedPlan JSONB NOT NULL,
    ModelVersion VARCHAR(50),
    UserRating INT,  -- 1-5 rating for RLHF
    WasAccepted BOOLEAN,
    CreatedAt TIMESTAMP DEFAULT NOW()
);

-- Index for vector similarity search
CREATE INDEX idx_exercises_embedding ON Exercises 
USING ivfflat (Embedding vector_cosine_ops) WITH (lists = 100);
```

### 2.4 What I Need From You

| Item | Why Needed | Format | Priority |
|------|------------|--------|----------|
| 50+ real workout plans from coaches | Training data | JSON with exercises, sets, reps | 🔴 HIGH |
| Exercise substitution rules | Handle injuries | CSV: exercise, substitute, reason | 🟡 MEDIUM |
| Common user requests | Prompt patterns | Text file with example requests | 🟡 MEDIUM |

---

## 3. Model 2: Nutrition Planner

### 3.1 Why This Model?
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Rule-based (Mifflin-St Jeor) | Simple, explainable | Not personalized | ❌ Boring |
| XGBoost | Fast, small | Hard to add constraints | ❌ Limited |
| **TensorFlow DNN** | Flexible, constraint loss | Needs more data | ✅ **Selected** |
| Neural Network + Rules | Best of both | More complex | ✅ **Hybrid** |

**Final Choice**: TensorFlow DNN with custom constraint loss function
- **Why**: Can learn patterns from data while enforcing nutritional constraints (protein 15-30%, carbs 40-60%, etc.)

### 3.2 Model Architecture

```python
# Model Definition
model = tf.keras.Sequential([
    # Input layer
    tf.keras.layers.Dense(128, activation='relu', input_shape=(10,)),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.Dropout(0.3),
    
    # Hidden layers
    tf.keras.layers.Dense(256, activation='relu'),
    tf.keras.layers.BatchNormalization(),
    tf.keras.layers.Dropout(0.3),
    
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dropout(0.2),
    
    tf.keras.layers.Dense(64, activation='relu'),
    
    # Output: [calories, protein_g, carbs_g, fats_g]
    tf.keras.layers.Dense(4, activation='linear')
])

# Custom loss with nutritional constraints
def nutrition_loss(y_true, y_pred):
    mse = tf.reduce_mean(tf.square(y_true - y_pred))
    
    # Extract predictions
    calories = y_pred[:, 0]
    protein = y_pred[:, 1] * 4  # 4 cal/g
    carbs = y_pred[:, 2] * 4    # 4 cal/g
    fats = y_pred[:, 3] * 9     # 9 cal/g
    
    # Constraint: macros should sum to calories (±10%)
    macro_sum = protein + carbs + fats
    sum_penalty = tf.reduce_mean(tf.square(calories - macro_sum))
    
    # Constraint: protein 15-30% of calories
    protein_ratio = protein / (calories + 1e-6)
    protein_penalty = tf.reduce_mean(
        tf.maximum(0.0, 0.15 - protein_ratio) + 
        tf.maximum(0.0, protein_ratio - 0.30)
    )
    
    return mse + 10.0 * sum_penalty + 5.0 * protein_penalty
```

### 3.3 Training Pipeline

```
Step 1: Data Collection
├── Source 1: USDA Food Database (macros per food)
├── Source 2: MyFitnessPal anonymized data (if available)
├── Source 3: YOUR member nutrition logs ← NEED FROM YOU
└── Source 4: Synthetic data generation

Step 2: Feature Engineering
├── Input Features (10):
│   ├── age (normalized 0-1)
│   ├── weight_kg (normalized)
│   ├── height_cm (normalized)
│   ├── gender (0/1)
│   ├── activity_level (1-5 encoded)
│   ├── fitness_goal (0=lose, 1=maintain, 2=gain)
│   ├── bmi (calculated)
│   ├── bmr (Mifflin-St Jeor)
│   ├── tdee (BMR × activity)
│   └── diet_type (encoded: 0=regular, 1=vegetarian, etc.)
│
└── Output Labels (4):
    ├── daily_calories
    ├── protein_grams
    ├── carbs_grams
    └── fats_grams

Step 3: Training
├── Split: 70% train, 15% val, 15% test
├── Epochs: 100 with early stopping (patience=10)
├── Optimizer: Adam (lr=0.001, decay on plateau)
└── Batch size: 32

Step 4: Evaluation Metrics
├── MAE (Mean Absolute Error) per output
├── R² score
├── Constraint violation rate (<5% target)
└── Nutritionist review (sample of 50 predictions)
```

### 3.4 What I Need From You

| Item | Why Needed | Format | Priority |
|------|------------|--------|----------|
| 500+ member profiles with goals | Training data | CSV: age, weight, height, goal | 🔴 HIGH |
| Nutritionist-approved meal plans | Ground truth labels | CSV: profile → macros | 🔴 HIGH |
| Diet restriction categories | Feature encoding | List of diet types you support | 🟡 MEDIUM |

---

## 4. Model 3: Vision Analyzer

### 4.1 Why This Model?
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Custom CNN | Full control | Needs 10K+ labeled images | ❌ No data |
| MediaPipe Pose | Pose detection | Doesn't assess muscles | ❌ Wrong task |
| **CLIP** | Zero-shot, no training | Less precise | ✅ **Selected** |
| Fine-tuned ViT | Better accuracy | Needs labeled data | 🔄 Future |

**Final Choice**: `openai/clip-vit-base-patch32`
- **Why**: Works without training data, can classify muscle development using text prompts

### 4.2 How It Works

```python
# CLIP compares image to text descriptions
MUSCLE_PROMPTS = {
    "chest": {
        "prompts": [
            "well-developed muscular chest with visible pectorals",
            "average chest development",
            "underdeveloped flat chest lacking muscle"
        ],
        "statuses": ["well_developed", "average", "underdeveloped"]
    },
    "arms": {
        "prompts": [
            "muscular arms with defined biceps and triceps",
            "average arm muscle development",
            "thin arms lacking muscle definition"
        ],
        "statuses": ["well_developed", "average", "underdeveloped"]
    },
    # ... shoulders, back, legs, core
}

# For each muscle group:
# 1. Encode image with CLIP vision encoder
# 2. Encode all text prompts with CLIP text encoder
# 3. Compute cosine similarity
# 4. Highest similarity = predicted status
```

### 4.3 Evaluation Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Accuracy vs coach assessment | >70% | Have coaches rate 100 photos, compare |
| Confidence calibration | <0.1 ECE | Predicted confidence vs actual accuracy |
| User satisfaction | 4/5 | Survey after analysis |
| False positive rate (injury risk) | <5% | Don't recommend dangerous exercises |

### 4.4 What I Need From You

| Item | Why Needed | Format | Priority |
|------|------------|--------|----------|
| Privacy policy for photo handling | Legal compliance | Document | 🔴 HIGH |
| Coach-labeled sample photos | Validation set | 50 photos with muscle ratings | 🟡 MEDIUM |
| List of injury-prone exercises | Safety filter | CSV: exercise, risk_level | 🟡 MEDIUM |

---

## 5. Model 4: Knowledge RAG System

### 5.1 Why This Model?
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Keyword search | Simple | Poor semantic understanding | ❌ Limited |
| BM25 | Fast, proven | Not semantic | ❌ Limited |
| **Sentence-Transformers** | Semantic, fast, small | Needs chunking | ✅ **Selected** |
| OpenAI Embeddings | Best quality | Costly, API dependency | ❌ Costly |

**Final Choice**: `sentence-transformers/all-MiniLM-L6-v2`
- **Why**: 384 dimensions (small), runs on CPU, excellent quality for size

### 5.2 Knowledge Base Structure

```
knowledge_base/
├── training_principles/
│   ├── volume_guidelines.json       # Sets per muscle group
│   ├── progressive_overload.json    # How to progress
│   ├── periodization.json           # Training cycles
│   └── recovery.json                # Rest recommendations
│
├── exercise_library/
│   ├── compound_movements.json      # Squats, deadlifts, etc.
│   ├── isolation_exercises.json     # Curls, extensions, etc.
│   └── alternatives.json            # Exercise substitutions
│
├── nutrition_knowledge/
│   ├── macronutrients.json          # Protein, carbs, fats
│   ├── meal_timing.json             # When to eat
│   ├── supplements.json             # Creatine, protein, etc.
│   └── diets.json                   # Keto, paleo, etc.
│
├── injury_prevention/
│   ├── common_injuries.json         # Shoulder, knee, back
│   ├── warm_up_protocols.json       # Warm-up routines
│   └── mobility_work.json           # Stretching, foam rolling
│
└── motivation/
    ├── goal_setting.json            # SMART goals
    ├── habit_formation.json         # Building consistency
    └── plateau_solutions.json       # Breaking plateaus
```

### 5.3 Chunking Strategy

```python
# Each knowledge item format
{
    "id": "vol_001",
    "category": "training_volume",
    "title": "Weekly Set Volume for Beginners",
    "content": "Beginners should aim for 10-12 sets per muscle group per week...",
    "keywords": ["sets", "volume", "beginner", "hypertrophy"],
    "source": "Renaissance Periodization guidelines",
    "embedding": [0.123, 0.456, ...]  # 384 dimensions
}

# Chunking rules:
# - Max 500 tokens per chunk
# - Keep paragraphs together
# - Include title in each chunk for context
# - Overlap 50 tokens between chunks
```

### 5.4 Vector Database Schema

```sql
-- Knowledge embeddings table
CREATE TABLE KnowledgeEmbeddings (
    Id VARCHAR(50) PRIMARY KEY,
    Category VARCHAR(100) NOT NULL,
    Title VARCHAR(255) NOT NULL,
    Content TEXT NOT NULL,
    Keywords TEXT[],
    Source VARCHAR(255),
    Embedding vector(384) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);

-- Optimized index for similarity search
CREATE INDEX idx_knowledge_embedding ON KnowledgeEmbeddings 
USING ivfflat (Embedding vector_cosine_ops) WITH (lists = 50);

-- Category filter index
CREATE INDEX idx_knowledge_category ON KnowledgeEmbeddings(Category);
```

### 5.5 What I Need From You

| Item | Why Needed | Format | Priority |
|------|------------|--------|----------|
| Gym's training philosophy | Customize knowledge base | Document | 🟡 MEDIUM |
| FAQ from members | Real user questions | List of common questions | 🟡 MEDIUM |
| Approved supplement list | Safety compliance | List with notes | 🟢 LOW |

---

## 6. Model 5: AI Coach Orchestrator

### 6.1 Why This Model?
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Rule-based router | Predictable | Not conversational | ❌ Limited |
| Claude API | Excellent | Expensive | ❌ Costly |
| **GPT-4 API** | Best quality | $0.03/1K tokens | ✅ **Selected** |
| Local LLM | Free | Quality issues | ❌ Poor quality |

**Final Choice**: GPT-4 API via Azure OpenAI (or OpenAI directly)
- **Why**: Best conversational quality, function calling for tool use, worth the cost for premium feature

### 6.2 System Prompt Template

```
You are an expert AI fitness coach for IntelliFit gym management platform.

## Your Personality
- Friendly, encouraging, and professional
- Speak naturally, not robotic
- Use emojis sparingly but effectively
- Be concise (2-3 sentences usually)

## User Context
Name: {user.first_name}
Age: {user.age} | Weight: {user.weight}kg | Height: {user.height}cm
Fitness Level: {user.fitness_level}
Goals: {user.goals}
Active Plan: {user.current_plan_summary}
Last Workout: {user.last_workout_summary}
Injuries/Limitations: {user.injuries}

## Recent Conversation
{last_10_messages}

## Available Functions
You can call these functions when needed:
- generate_workout_plan(days, goal, constraints) -> Creates workout
- generate_nutrition_plan(calories, diet_type) -> Creates meal plan
- search_exercises(query, muscle_group) -> Find exercises
- search_knowledge(question) -> Get fitness info from RAG
- analyze_photo(image_id) -> Analyze body photo
- get_user_progress(days) -> Get progress metrics
- book_equipment(equipment_id, date) -> Book gym equipment
- book_coach(coach_id, date) -> Book coaching session

## Guidelines
1. Always acknowledge the user's current state (tired, motivated, confused)
2. Personalize based on their history and preferences
3. Use functions rather than making up specific advice
4. If unsure, ask clarifying questions
5. Never provide medical advice - recommend consulting doctor
6. Encourage but don't pressure
```

### 6.3 Function Calling Flow

```
User: "I want a new workout plan focusing on my chest"

┌─────────────────────────────────────────────────────────────┐
│ Step 1: GPT-4 analyzes message                              │
│         - Intent: generate_workout_plan                     │
│         - Entities: focus="chest"                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: GPT-4 asks clarifying questions                     │
│         "How many days per week can you train?"            │
│         "Any equipment limitations?"                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: User provides info                                  │
│         "4 days, full gym access"                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: GPT-4 calls function                                │
│         generate_workout_plan(                              │
│             days=4,                                         │
│             goal="muscle_gain",                            │
│             focus=["chest"],                               │
│             user_profile=context                           │
│         )                                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Flan-T5 generates plan                              │
│         Returns: { "plan_name": "...", "days": [...] }     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 6: GPT-4 formats response                              │
│         "Here's your 4-day chest-focused plan! 💪           │
│          [Shows plan preview]                               │
│          Would you like me to explain any exercises?"       │
└─────────────────────────────────────────────────────────────┘
```

### 6.4 Conversation Memory

```sql
-- Store conversation history
CREATE TABLE AIConversations (
    Id SERIAL PRIMARY KEY,
    UserId INT REFERENCES Users(Id),
    SessionId UUID NOT NULL,  -- Groups messages in a session
    Role VARCHAR(20) NOT NULL,  -- 'user', 'assistant', 'system', 'function'
    Content TEXT NOT NULL,
    FunctionName VARCHAR(100),  -- If role='function'
    FunctionArgs JSONB,
    TokenCount INT,
    CreatedAt TIMESTAMP DEFAULT NOW()
);

-- Index for quick history retrieval
CREATE INDEX idx_conversations_user_session 
ON AIConversations(UserId, SessionId, CreatedAt DESC);

-- Cleanup old sessions (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_conversations()
RETURNS void AS $$
BEGIN
    DELETE FROM AIConversations 
    WHERE CreatedAt < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
```

### 6.5 Voice Integration (Optional Premium Feature)

```typescript
// Using OpenAI Realtime API for voice
// This is expensive - use only for premium members

interface VoiceSession {
    sessionId: string;
    userId: number;
    websocketUrl: string;
    ephemeralToken: string;
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
    expiresAt: Date;
}

// Alternative: Browser Speech API (free)
// - Use Web Speech API for speech-to-text
// - Use browser TTS for response
// - Send text to GPT-4, not audio
```

### 6.6 What I Need From You

| Item | Why Needed | Format | Priority |
|------|------------|--------|----------|
| OpenAI API key | Required for GPT-4 | API key | 🔴 HIGH |
| Monthly AI budget | Cost planning | $ amount | 🔴 HIGH |
| Sample conversations | Prompt tuning | 20+ example dialogs | 🟡 MEDIUM |
| Voice feature decision | Scope planning | Yes/No + budget | 🟡 MEDIUM |

---

## 7. Model 6: System Analytics AI

### 7.1 Why This Model?
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Traditional BI (Tableau) | Visual, proven | Not conversational | ❌ Not AI |
| SQL + Templates | Simple | Not natural language | ❌ Limited |
| **LangChain SQL Agent** | Natural language to SQL | Can be unpredictable | ✅ **Selected** |
| Custom NLQ model | Full control | Complex to build | ❌ Too complex |

**Final Choice**: LangChain SQL Agent + Prophet forecasting
- **Why**: Converts natural language to SQL, adds time series forecasting

### 7.2 Analytics Categories

```
┌─────────────────────────────────────────────────────────────┐
│                    System Analytics AI                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Member    │  │  Equipment  │  │   Booking   │         │
│  │  Analytics  │  │  Analytics  │  │  Analytics  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Revenue   │  │   Workout   │  │  Nutrition  │         │
│  │  Analytics  │  │  Analytics  │  │  Analytics  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Access Control by Role

| Analytics Type | Admin | Receptionist | Coach | Member |
|---------------|-------|--------------|-------|--------|
| Member Analytics | ✅ Full | ✅ Basic | ❌ Their clients | ❌ Self only |
| Equipment Analytics | ✅ Full | ✅ View | ❌ | ❌ |
| Booking Analytics | ✅ Full | ✅ Full | ✅ Their bookings | ❌ Self only |
| Revenue Analytics | ✅ Full | ❌ | ❌ | ❌ |
| Workout Analytics | ✅ Full | ❌ | ✅ Their clients | ✅ Self only |
| Nutrition Analytics | ✅ Full | ❌ | ✅ Their clients | ✅ Self only |

### 7.4 Technical Implementation

```python
# analytics_server.py
from langchain.agents import create_sql_agent
from langchain.sql_database import SQLDatabase
from langchain.llms import OpenAI
from prophet import Prophet

class AnalyticsEngine:
    def __init__(self, db_url: str, openai_key: str):
        self.db = SQLDatabase.from_uri(db_url)
        self.llm = OpenAI(api_key=openai_key, temperature=0)
        self.agent = create_sql_agent(
            llm=self.llm,
            db=self.db,
            verbose=True
        )
    
    def query(self, user_question: str, user_role: str) -> dict:
        # Add role-based filtering to prevent data leaks
        system_prompt = f"""
        You are a gym analytics assistant. 
        The user has role: {user_role}
        
        IMPORTANT: Only return data appropriate for this role.
        - Never expose individual member data to non-admins
        - Aggregate data when possible
        - Refuse queries outside user's scope
        """
        
        result = self.agent.run(system_prompt + "\n" + user_question)
        return {"answer": result}
    
    def forecast(self, metric: str, days_ahead: int = 30) -> dict:
        # Get historical data
        historical = self.db.run(f"""
            SELECT date, {metric} FROM daily_metrics 
            ORDER BY date DESC LIMIT 90
        """)
        
        # Prophet forecasting
        df = pd.DataFrame(historical, columns=['ds', 'y'])
        model = Prophet()
        model.fit(df)
        
        future = model.make_future_dataframe(periods=days_ahead)
        forecast = model.predict(future)
        
        return {
            "metric": metric,
            "forecast": forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_dict()
        }
```

### 7.5 Pre-built Analytics Queries

```sql
-- Member retention rate
WITH monthly_active AS (
    SELECT 
        DATE_TRUNC('month', CreatedAt) as month,
        COUNT(DISTINCT UserId) as active_users
    FROM WorkoutLogs
    GROUP BY 1
),
monthly_churned AS (
    SELECT 
        DATE_TRUNC('month', SubscriptionEndDate) as month,
        COUNT(*) as churned
    FROM Subscriptions
    WHERE Status = 'cancelled'
    GROUP BY 1
)
SELECT 
    m.month,
    m.active_users,
    COALESCE(c.churned, 0) as churned,
    ROUND((m.active_users - COALESCE(c.churned, 0))::numeric / m.active_users * 100, 1) as retention_rate
FROM monthly_active m
LEFT JOIN monthly_churned c ON m.month = c.month
ORDER BY m.month DESC;

-- Equipment utilization
SELECT 
    e.Name,
    COUNT(b.Id) as total_bookings,
    SUM(EXTRACT(EPOCH FROM (b.EndTime - b.StartTime)) / 3600) as hours_used,
    MAX(b.BookedAt) as last_booked
FROM Equipment e
LEFT JOIN EquipmentBookings b ON e.Id = b.EquipmentId
WHERE b.BookedAt >= NOW() - INTERVAL '30 days'
GROUP BY e.Id, e.Name
ORDER BY hours_used DESC;

-- Revenue by source
SELECT 
    'Memberships' as source,
    SUM(Amount) as revenue
FROM Subscriptions
WHERE CreatedAt >= DATE_TRUNC('month', NOW())
UNION ALL
SELECT 
    'Coach Bookings' as source,
    SUM(TokenCost * 2.5) as revenue  -- Token to $ conversion
FROM CoachBookings
WHERE BookedAt >= DATE_TRUNC('month', NOW())
UNION ALL
SELECT 
    'Equipment Rentals' as source,
    SUM(TokenCost * 2.5) as revenue
FROM EquipmentBookings
WHERE BookedAt >= DATE_TRUNC('month', NOW());
```

### 7.6 What I Need From You

| Item | Why Needed | Format | Priority |
|------|------------|--------|----------|
| List of KPIs you want | Define metrics | List with descriptions | 🔴 HIGH |
| Historical data access | Training forecasting | Database access | 🔴 HIGH |
| Report templates | Output format | Example reports | 🟡 MEDIUM |

---

## 8. Database Architecture

### 8.1 Database Choice Summary

| Database | Purpose | Why |
|----------|---------|-----|
| **PostgreSQL** | Primary data store | Reliable, ACID, JSON support |
| **pgvector** | Vector embeddings | Native Postgres extension, no extra infra |
| **Redis** | Caching, sessions | Fast, conversation memory |
| **TimescaleDB** (optional) | Time series metrics | If analytics volume is high |

### 8.2 Complete Schema Additions for AI

```sql
-- =====================================================
-- AI-RELATED TABLES
-- =====================================================

-- 1. Vector embeddings for exercises
ALTER TABLE Exercises ADD COLUMN IF NOT EXISTS Embedding vector(384);

-- 2. Knowledge base for RAG
CREATE TABLE IF NOT EXISTS KnowledgeEmbeddings (
    Id VARCHAR(50) PRIMARY KEY,
    Category VARCHAR(100) NOT NULL,
    Title VARCHAR(255) NOT NULL,
    Content TEXT NOT NULL,
    Embedding vector(384) NOT NULL,
    Source VARCHAR(255),
    CreatedAt TIMESTAMP DEFAULT NOW()
);

-- 3. AI conversation history
CREATE TABLE IF NOT EXISTS AIConversations (
    Id SERIAL PRIMARY KEY,
    UserId INT REFERENCES Users(Id) ON DELETE CASCADE,
    SessionId UUID NOT NULL,
    Role VARCHAR(20) NOT NULL CHECK (Role IN ('user', 'assistant', 'system', 'function')),
    Content TEXT NOT NULL,
    FunctionName VARCHAR(100),
    FunctionArgs JSONB,
    TokensUsed INT DEFAULT 0,
    CreatedAt TIMESTAMP DEFAULT NOW()
);

-- 4. Generated plans tracking (for feedback loop)
CREATE TABLE IF NOT EXISTS AIGeneratedPlans (
    Id SERIAL PRIMARY KEY,
    UserId INT REFERENCES Users(Id) ON DELETE CASCADE,
    PlanType VARCHAR(20) NOT NULL CHECK (PlanType IN ('workout', 'nutrition')),
    InputPrompt TEXT NOT NULL,
    GeneratedPlan JSONB NOT NULL,
    ModelVersion VARCHAR(50),
    WasAccepted BOOLEAN,
    UserRating INT CHECK (UserRating BETWEEN 1 AND 5),
    UserFeedback TEXT,
    CreatedAt TIMESTAMP DEFAULT NOW()
);

-- 5. Vision analysis history
CREATE TABLE IF NOT EXISTS VisionAnalyses (
    Id SERIAL PRIMARY KEY,
    UserId INT REFERENCES Users(Id) ON DELETE CASCADE,
    ImageHash VARCHAR(64),  -- SHA256 hash, not the image itself
    ChestStatus VARCHAR(20),
    ArmsStatus VARCHAR(20),
    ShouldersStatus VARCHAR(20),
    BodyCompositionStatus VARCHAR(20),
    WeakMuscles TEXT[],
    OverallConfidence FLOAT,
    IsReliable BOOLEAN,
    AnalyzedAt TIMESTAMP DEFAULT NOW()
);

-- 6. Analytics metrics cache
CREATE TABLE IF NOT EXISTS AnalyticsMetricsDaily (
    Date DATE PRIMARY KEY,
    ActiveMembers INT,
    NewSignups INT,
    Churned INT,
    TotalRevenue DECIMAL(10,2),
    CoachBookings INT,
    EquipmentBookings INT,
    WorkoutsCompleted INT,
    AvgWorkoutDuration INT,  -- minutes
    AIChatsCount INT,
    CreatedAt TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Vector similarity search
CREATE INDEX IF NOT EXISTS idx_exercises_embedding 
ON Exercises USING ivfflat (Embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_knowledge_embedding 
ON KnowledgeEmbeddings USING ivfflat (Embedding vector_cosine_ops) WITH (lists = 50);

-- Conversation lookup
CREATE INDEX IF NOT EXISTS idx_conversations_user_session 
ON AIConversations(UserId, SessionId, CreatedAt DESC);

-- Analytics date range
CREATE INDEX IF NOT EXISTS idx_analytics_date 
ON AnalyticsMetricsDaily(Date DESC);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Similarity search function
CREATE OR REPLACE FUNCTION search_similar_exercises(
    query_embedding vector(384),
    limit_count INT DEFAULT 10
)
RETURNS TABLE(id INT, name VARCHAR, similarity FLOAT) AS $$
BEGIN
    RETURN QUERY
    SELECT e.Id, e.Name, 1 - (e.Embedding <=> query_embedding) as similarity
    FROM Exercises e
    WHERE e.Embedding IS NOT NULL
    ORDER BY e.Embedding <=> query_embedding
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

---

## 9. Production Infrastructure

### 9.1 Service Ports

| Service | Port | Protocol | GPU Required |
|---------|------|----------|--------------|
| C# Backend API | 5000 | HTTP | No |
| Embedding Server | 5100 | HTTP | No (CPU OK) |
| Vision Server | 5200 | HTTP | Recommended |
| LLM Workout Server | 5300 | HTTP | Recommended |
| Analytics Server | 5400 | HTTP | No |
| TensorFlow Serving | 8501 | HTTP/gRPC | No |
| Next.js Frontend | 3000 | HTTP | No |
| PostgreSQL | 5432 | TCP | No |
| Redis | 6379 | TCP | No |

### 9.2 Docker Compose Setup

```yaml
version: '3.8'

services:
  # Frontend
  frontend:
    build: ./codeflex-ai
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:5000
    depends_on:
      - backend

  # C# Backend
  backend:
    build: ./Graduation-Project
    ports:
      - "5000:5000"
    environment:
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=intellifit;Username=postgres;Password=postgres
      - Redis__ConnectionString=redis:6379
      - AI__EmbeddingUrl=http://embedding:5100
      - AI__WorkoutLLMUrl=http://workout-llm:5300
      - AI__VisionUrl=http://vision:5200
      - AI__NutritionUrl=http://nutrition:8501
      - OpenAI__ApiKey=${OPENAI_API_KEY}
    depends_on:
      - postgres
      - redis
      - embedding
      - workout-llm

  # Python ML Services
  embedding:
    build: ./ml_models/services/embedding
    ports:
      - "5100:5100"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/intellifit

  workout-llm:
    build: ./ml_models/services/llm
    ports:
      - "5300:5300"
    deploy:
      resources:
        reservations:
          devices:
            - capabilities: [gpu]

  vision:
    build: ./ml_models/vision
    ports:
      - "5200:5200"
    deploy:
      resources:
        reservations:
          devices:
            - capabilities: [gpu]

  nutrition:
    image: tensorflow/serving
    ports:
      - "8501:8501"
    volumes:
      - ./ml_models/serving:/models
    command: --model_config_file=/models/models.config

  analytics:
    build: ./ml_models/services/analytics
    ports:
      - "5400:5400"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/intellifit
      - OPENAI_API_KEY=${OPENAI_API_KEY}

  # Databases
  postgres:
    image: pgvector/pgvector:pg16
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=intellifit
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### 9.3 Environment Variables Required

```bash
# .env file
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/intellifit
REDIS_URL=redis://localhost:6379

# OpenAI (for AI Coach)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4

# ML Services
EMBEDDING_URL=http://localhost:5100
WORKOUT_LLM_URL=http://localhost:5300
VISION_URL=http://localhost:5200
NUTRITION_URL=http://localhost:8501
ANALYTICS_URL=http://localhost:5400

# Security
JWT_SECRET=your-jwt-secret
AI_RATE_LIMIT=100  # requests per user per day
```

---

## 10. Requirements From You

### 10.1 🔴 HIGH Priority (Blocking)

| # | Item | Description | Format |
|---|------|-------------|--------|
| 1 | **OpenAI API Key** | Required for AI Coach (GPT-4) | API key string |
| 2 | **50+ Workout Plans** | Real plans from your coaches for training | JSON files |
| 3 | **Member Profiles Dataset** | 500+ profiles for nutrition model | CSV |
| 4 | **Nutritionist Meal Plans** | Ground truth for nutrition model | CSV |
| 5 | **Monthly AI Budget** | How much can you spend on API calls? | $ amount |

### 10.2 🟡 MEDIUM Priority (Important)

| # | Item | Description | Format |
|---|------|-------------|--------|
| 6 | **KPI List for Analytics** | What metrics matter to your gym? | Document |
| 7 | **Sample Conversations** | 20+ example user-AI dialogs | Text file |
| 8 | **Exercise Substitution Rules** | What replaces what for injuries | CSV |
| 9 | **Privacy Policy** | For photo handling | Legal document |
| 10 | **Coach-Rated Photos** | 50 photos with muscle assessments | Images + ratings |

### 10.3 🟢 LOW Priority (Nice to Have)

| # | Item | Description | Format |
|---|------|-------------|--------|
| 11 | **Voice Feature Decision** | Do you want voice chat? Budget? | Yes/No |
| 12 | **Gym Training Philosophy** | Your gym's unique approach | Document |
| 13 | **Supplement Policy** | What supplements to recommend | List |
| 14 | **Common Member FAQs** | Frequent questions asked | List |

### 10.4 Decisions Needed

| Decision | Options | Impact |
|----------|---------|--------|
| Voice Chat | Yes / No | Adds $100+/month, complex integration |
| GPU Server | Yes / No | Faster inference for Vision/LLM |
| OpenAI vs Azure | OpenAI / Azure OpenAI | Azure = enterprise features, slightly cheaper |
| Analytics Depth | Basic / Advanced | Advanced = TimescaleDB, more forecasting |

---

## 11. MLOps Architecture

> **Why MLOps?** Without it, you cannot safely update models, roll back bad deployments, or measure real business impact.

### 11.1 MLOps Tooling Stack

| Layer | Tool | Why | Reference |
|-------|------|-----|-----------|
| Model Registry | **MLflow** | Versioning, rollback, artifacts | [mlflow.org](https://mlflow.org/docs/latest/) |
| Experiment Tracking | MLflow | Metrics, params, comparison | |
| Deployment Strategy | Canary + A/B | Risk reduction, gradual rollout | |
| Monitoring | Prometheus + Grafana | Latency, errors, usage | |
| Alerts | Alertmanager | SLA protection | |
| CI/CD | GitHub Actions | Automated train → deploy | |
| Drift Detection | Evidently AI | Data/model drift | [evidentlyai.com](https://docs.evidentlyai.com/) |

### 11.2 Model Lifecycle (End-to-End)

```
┌─────────────┐
│ Data Ingest │ ← New training data (user feedback, new plans)
└─────┬───────┘
      ▼
┌─────────────┐
│ Train Model │ ← Python script, tracked experiment
└─────┬───────┘
      ▼
┌─────────────┐
│ Log to      │ ← Metrics, params, model artifacts
│ MLflow      │
└─────┬───────┘
      ▼
┌─────────────┐
│ Register    │ ← Model versioned (v1.0, v1.1, v2.0)
│ Model vX.Y  │
└─────┬───────┘
      ▼
┌─────────────┐
│ Shadow      │ ← Run in parallel, no user impact
│ Deployment  │
└─────┬───────┘
      ▼
┌─────────────┐
│ A/B Test    │ ← 80% control, 20% candidate
└─────┬───────┘
      ▼
┌─────────────────┐
│ Promote or      │ ← Based on metrics
│ Rollback        │
└─────────────────┘
```

### 11.3 MLflow Integration Code

```python
# training/train_workout_model.py
import mlflow
import mlflow.pytorch
from peft import LoraConfig, get_peft_model

# Start experiment
mlflow.set_experiment("workout-generator")

with mlflow.start_run(run_name="flan-t5-lora-v2"):
    # Log parameters
    mlflow.log_param("base_model", "google/flan-t5-base")
    mlflow.log_param("lora_rank", 16)
    mlflow.log_param("lora_alpha", 32)
    mlflow.log_param("epochs", 4)
    mlflow.log_param("learning_rate", 2e-4)
    mlflow.log_param("train_samples", len(train_dataset))
    
    # Train model
    trainer.train()
    
    # Log metrics
    mlflow.log_metric("json_validity_rate", 0.97)
    mlflow.log_metric("schema_compliance", 0.92)
    mlflow.log_metric("human_eval_score", 4.3)
    mlflow.log_metric("avg_latency_ms", 450)
    
    # Log model artifact
    mlflow.pytorch.log_model(
        model, 
        "workout_generator",
        registered_model_name="WorkoutGenerator"
    )
    
    # Log training data sample
    mlflow.log_artifact("data/train_sample.json")
```

### 11.4 Model Registry Commands

```bash
# Register new model version
mlflow models register \
  --model-uri runs:/<run_id>/workout_generator \
  --name WorkoutGenerator

# Promote to production
mlflow models transition \
  --name WorkoutGenerator \
  --version 2 \
  --stage Production

# Rollback to previous version
mlflow models transition \
  --name WorkoutGenerator \
  --version 1 \
  --stage Production
```

### 11.5 Database Schema for Model Registry

```sql
-- Track deployed models
CREATE TABLE AIModels (
    Id SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Version VARCHAR(20) NOT NULL,
    MLflowRunId VARCHAR(100),
    Stage VARCHAR(20) CHECK (Stage IN ('staging', 'production', 'archived')),
    IsActive BOOLEAN DEFAULT false,
    DeployedAt TIMESTAMP,
    Metrics JSONB,  -- {"json_validity": 0.97, "latency_ms": 450}
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UNIQUE(Name, Version)
);

-- Model deployment history
CREATE TABLE AIModelDeployments (
    Id SERIAL PRIMARY KEY,
    ModelId INT REFERENCES AIModels(Id),
    Action VARCHAR(20) CHECK (Action IN ('deploy', 'rollback', 'promote', 'archive')),
    PreviousVersion VARCHAR(20),
    NewVersion VARCHAR(20),
    Reason TEXT,
    DeployedBy VARCHAR(100),
    DeployedAt TIMESTAMP DEFAULT NOW()
);
```

---

## 12. A/B Testing Framework

> **Why A/B Testing?** Offline metrics ≠ real user satisfaction. A/B tests measure actual business impact.

### 12.1 What We A/B Test

| Model | Control Metric | Success Criteria |
|-------|---------------|------------------|
| Workout Generator | Plan acceptance rate | +5% vs control |
| Nutrition Planner | 7-day adherence rate | +10% vs control |
| AI Coach | Conversation satisfaction | +0.3 rating vs control |
| Vision Analyzer | Coach agreement rate | +10% vs control |

### 12.2 Traffic Allocation Strategy

```
Phase 1: Shadow Mode (0% user impact)
├── New model runs in parallel
├── Compare outputs, log differences
└── Duration: 3 days

Phase 2: Canary (5% traffic)
├── Small user group gets new model
├── Monitor for errors, latency spikes
└── Duration: 2 days

Phase 3: A/B Test (20% traffic)
├── 80% Control (Model A - current)
├── 20% Candidate (Model B - new)
└── Duration: 7-14 days

Phase 4: Rollout (100% traffic)
├── If B wins: gradual 20% → 50% → 100%
├── If A wins: archive B, iterate
└── Duration: 3 days
```

### 12.3 Database Schema for Experiments

```sql
-- A/B Experiments
CREATE TABLE AIExperiments (
    Id SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Description TEXT,
    ModelName VARCHAR(50) NOT NULL,
    ControlVersion VARCHAR(20) NOT NULL,
    CandidateVersion VARCHAR(20) NOT NULL,
    TrafficSplitPercent INT DEFAULT 20,  -- % to candidate
    Status VARCHAR(20) CHECK (Status IN ('draft', 'running', 'paused', 'completed', 'stopped')),
    StartDate TIMESTAMP,
    EndDate TIMESTAMP,
    WinnerVersion VARCHAR(20),
    CreatedBy VARCHAR(100),
    CreatedAt TIMESTAMP DEFAULT NOW()
);

-- User assignments (sticky - user stays in same group)
CREATE TABLE AIExperimentAssignments (
    UserId INT NOT NULL,
    ExperimentId INT REFERENCES AIExperiments(Id),
    Variant CHAR(1) CHECK (Variant IN ('A', 'B')),
    AssignedAt TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (UserId, ExperimentId)
);

-- Metrics collected during experiment
CREATE TABLE AIExperimentMetrics (
    Id SERIAL PRIMARY KEY,
    ExperimentId INT REFERENCES AIExperiments(Id),
    UserId INT NOT NULL,
    Variant CHAR(1) NOT NULL,
    MetricName VARCHAR(50) NOT NULL,
    MetricValue FLOAT NOT NULL,
    RecordedAt TIMESTAMP DEFAULT NOW()
);

-- Index for fast metric aggregation
CREATE INDEX idx_experiment_metrics 
ON AIExperimentMetrics(ExperimentId, Variant, MetricName);
```

### 12.4 A/B Routing Logic (C#)

```csharp
public class ABTestingService
{
    private readonly IntelliFitDbContext _db;
    
    public async Task<string> GetModelVersion(int userId, string modelName)
    {
        // Check for active experiment
        var experiment = await _db.AIExperiments
            .FirstOrDefaultAsync(e => 
                e.ModelName == modelName && 
                e.Status == "running");
        
        if (experiment == null)
            return await GetProductionVersion(modelName);
        
        // Get or create assignment (sticky)
        var assignment = await _db.AIExperimentAssignments
            .FirstOrDefaultAsync(a => 
                a.UserId == userId && 
                a.ExperimentId == experiment.Id);
        
        if (assignment == null)
        {
            // Assign randomly based on traffic split
            var isCandidate = Random.Shared.Next(100) < experiment.TrafficSplitPercent;
            assignment = new AIExperimentAssignment
            {
                UserId = userId,
                ExperimentId = experiment.Id,
                Variant = isCandidate ? 'B' : 'A'
            };
            _db.AIExperimentAssignments.Add(assignment);
            await _db.SaveChangesAsync();
        }
        
        return assignment.Variant == 'B' 
            ? experiment.CandidateVersion 
            : experiment.ControlVersion;
    }
    
    public async Task RecordMetric(int experimentId, int userId, char variant, 
                                    string metricName, float value)
    {
        _db.AIExperimentMetrics.Add(new AIExperimentMetric
        {
            ExperimentId = experimentId,
            UserId = userId,
            Variant = variant,
            MetricName = metricName,
            MetricValue = value
        });
        await _db.SaveChangesAsync();
    }
}
```

### 12.5 Statistical Analysis

| Metric Type | Test | When Significant |
|-------------|------|------------------|
| Rate (acceptance, clicks) | Chi-square / Z-test | p < 0.05 |
| Continuous (satisfaction score) | Mann–Whitney U | p < 0.05 |
| Duration (time to complete) | T-test | p < 0.05 |
| Retention (over time) | Kaplan–Meier | Log-rank p < 0.05 |

```python
# analysis/ab_test_analysis.py
from scipy import stats
import pandas as pd

def analyze_experiment(experiment_id: int, db_conn) -> dict:
    """Analyze A/B test results."""
    
    # Get metrics
    df = pd.read_sql(f"""
        SELECT Variant, MetricName, MetricValue 
        FROM AIExperimentMetrics 
        WHERE ExperimentId = {experiment_id}
    """, db_conn)
    
    results = {}
    
    for metric in df['MetricName'].unique():
        control = df[(df['Variant'] == 'A') & (df['MetricName'] == metric)]['MetricValue']
        candidate = df[(df['Variant'] == 'B') & (df['MetricName'] == metric)]['MetricValue']
        
        # Mann-Whitney U test (non-parametric)
        stat, p_value = stats.mannwhitneyu(control, candidate, alternative='two-sided')
        
        results[metric] = {
            'control_mean': control.mean(),
            'candidate_mean': candidate.mean(),
            'lift': (candidate.mean() - control.mean()) / control.mean() * 100,
            'p_value': p_value,
            'significant': p_value < 0.05,
            'winner': 'B' if candidate.mean() > control.mean() and p_value < 0.05 else 
                      'A' if control.mean() > candidate.mean() and p_value < 0.05 else 'none'
        }
    
    return results
```

---

## 13. Model Monitoring & Drift Detection

### 13.1 Real-Time Metrics (Prometheus)

```yaml
# prometheus/ai_metrics.yml
- job_name: 'ai-services'
  static_configs:
    - targets:
      - 'embedding:5100'
      - 'workout-llm:5300'
      - 'vision:5200'
      - 'analytics:5400'
  metrics_path: /metrics
```

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `ai_inference_latency_seconds` | Time per request | p99 > 2s |
| `ai_request_total` | Total requests | Anomaly detection |
| `ai_error_rate` | Errors / total | > 5% |
| `ai_json_validity_rate` | Valid JSON outputs | < 90% |
| `ai_tokens_used_total` | OpenAI token usage | > budget |
| `ai_model_version` | Current deployed version | Change alert |

### 13.2 Prometheus Metrics in Python

```python
# ml_models/services/metrics.py
from prometheus_client import Counter, Histogram, Gauge, generate_latest

# Metrics
REQUEST_COUNT = Counter(
    'ai_request_total', 
    'Total AI requests',
    ['model', 'endpoint', 'status']
)

LATENCY = Histogram(
    'ai_inference_latency_seconds',
    'AI inference latency',
    ['model'],
    buckets=[0.1, 0.25, 0.5, 1.0, 2.0, 5.0]
)

JSON_VALIDITY = Gauge(
    'ai_json_validity_rate',
    'Rate of valid JSON outputs',
    ['model']
)

MODEL_VERSION = Gauge(
    'ai_model_version_info',
    'Current model version',
    ['model', 'version']
)

# Usage in endpoint
@app.post("/generate")
async def generate_workout(request: GenerationRequest):
    start_time = time.time()
    
    try:
        result = generate_workout_plan(request)
        REQUEST_COUNT.labels(model='workout', endpoint='generate', status='success').inc()
        
        if result.success:
            JSON_VALIDITY.labels(model='workout').set(1)
        else:
            JSON_VALIDITY.labels(model='workout').set(0)
            
        return result
    except Exception as e:
        REQUEST_COUNT.labels(model='workout', endpoint='generate', status='error').inc()
        raise
    finally:
        LATENCY.labels(model='workout').observe(time.time() - start_time)

@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

### 13.3 Grafana Dashboard Panels

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI System Health Dashboard                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Requests/s  │  │ Error Rate  │  │ Avg Latency │             │
│  │    127      │  │   0.3%      │  │   340ms     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  Latency Over Time (p50, p95, p99)         │ │
│  │  ▂▃▄▅▆▇█▇▆▅▄▃▂▂▃▄▅▆▇█▇▆▅▄▃▂                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │ Model Versions      │  │ JSON Validity Rate  │              │
│  │ workout: v2.1       │  │ ████████████░ 96%   │              │
│  │ nutrition: v1.3     │  │                     │              │
│  │ vision: v1.0        │  │                     │              │
│  └─────────────────────┘  └─────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### 13.4 Data Drift Detection

```python
# monitoring/drift_detector.py
from evidently.metrics import DataDriftTable
from evidently.report import Report
import pandas as pd

class DriftDetector:
    def __init__(self, reference_data: pd.DataFrame):
        self.reference = reference_data
    
    def check_drift(self, current_data: pd.DataFrame) -> dict:
        """Check for data drift in nutrition model inputs."""
        
        report = Report(metrics=[DataDriftTable()])
        report.run(reference_data=self.reference, current_data=current_data)
        
        result = report.as_dict()
        
        # Extract drift scores
        drift_detected = False
        drifted_features = []
        
        for feature in result['metrics'][0]['result']['drift_by_columns']:
            if feature['drift_detected']:
                drift_detected = True
                drifted_features.append({
                    'feature': feature['column_name'],
                    'psi': feature['stattest_result']  # Population Stability Index
                })
        
        return {
            'drift_detected': drift_detected,
            'drifted_features': drifted_features,
            'recommendation': 'RETRAIN' if drift_detected else 'OK'
        }

# Check weekly
def weekly_drift_check():
    # Get last week's inference inputs
    current_data = get_inference_inputs(days=7)
    reference_data = get_training_data()
    
    detector = DriftDetector(reference_data)
    result = detector.check_drift(current_data)
    
    if result['drift_detected']:
        send_alert(f"Data drift detected: {result['drifted_features']}")
        # Optionally trigger retraining
```

### 13.5 Drift Alert Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| PSI (Population Stability Index) | > 0.1 | > 0.2 | Investigate / Retrain |
| JSON validity rate | < 95% | < 90% | Rollback immediately |
| Constraint violation rate | > 3% | > 5% | Retrain nutrition model |
| User acceptance rate | -10% | -20% | Investigate, A/B test |

---

## 14. Rollback Strategy

### 14.1 Automatic Rollback Triggers

| Condition | Detection | Action |
|-----------|-----------|--------|
| JSON validity < 90% | Prometheus alert | Auto-rollback |
| Latency > 2x baseline | Prometheus alert | Auto-rollback |
| Error rate > 5% | Prometheus alert | Auto-rollback |
| User rating drops 20% | Daily check | Manual review |
| Safety violation detected | Real-time | Immediate rollback + alert |

### 14.2 Rollback Procedure

```python
# ops/rollback.py
import mlflow
from datetime import datetime

class ModelRollback:
    def __init__(self, db, mlflow_client):
        self.db = db
        self.mlflow = mlflow_client
    
    def rollback(self, model_name: str, reason: str):
        """Rollback to previous production version."""
        
        # Get current and previous versions
        current = self.db.query("""
            SELECT Version FROM AIModels 
            WHERE Name = %s AND IsActive = true
        """, (model_name,)).fetchone()
        
        previous = self.db.query("""
            SELECT Version FROM AIModelDeployments
            WHERE ModelId IN (SELECT Id FROM AIModels WHERE Name = %s)
            ORDER BY DeployedAt DESC
            LIMIT 1 OFFSET 1
        """, (model_name,)).fetchone()
        
        if not previous:
            raise Exception("No previous version to rollback to")
        
        # Perform rollback
        self.db.execute("""
            UPDATE AIModels SET IsActive = false 
            WHERE Name = %s AND Version = %s
        """, (model_name, current['Version']))
        
        self.db.execute("""
            UPDATE AIModels SET IsActive = true, DeployedAt = %s
            WHERE Name = %s AND Version = %s
        """, (datetime.utcnow(), model_name, previous['Version']))
        
        # Log deployment
        self.db.execute("""
            INSERT INTO AIModelDeployments 
            (ModelId, Action, PreviousVersion, NewVersion, Reason)
            VALUES (
                (SELECT Id FROM AIModels WHERE Name = %s AND Version = %s),
                'rollback', %s, %s, %s
            )
        """, (model_name, previous['Version'], current['Version'], 
              previous['Version'], reason))
        
        # Update MLflow stage
        self.mlflow.transition_model_version_stage(
            name=model_name,
            version=previous['Version'],
            stage="Production"
        )
        
        self.db.commit()
        
        return {
            'model': model_name,
            'rolled_back_from': current['Version'],
            'rolled_back_to': previous['Version'],
            'reason': reason
        }
```

### 14.3 Alertmanager Configuration

```yaml
# alertmanager/config.yml
route:
  receiver: 'ai-ops-team'
  routes:
    - match:
        severity: critical
      receiver: 'ai-ops-pagerduty'
      
receivers:
  - name: 'ai-ops-team'
    slack_configs:
      - channel: '#ai-alerts'
        text: '{{ .Annotations.description }}'
        
  - name: 'ai-ops-pagerduty'
    pagerduty_configs:
      - service_key: '<your-pagerduty-key>'
```

---

## 15. CI/CD for ML

### 15.1 GitHub Actions Workflow

```yaml
# .github/workflows/ml-pipeline.yml
name: ML Training & Deployment Pipeline

on:
  push:
    paths:
      - 'ml_models/**'
      - 'Datasets/**'
  schedule:
    - cron: '0 2 * * 0'  # Weekly retraining Sunday 2am
  workflow_dispatch:  # Manual trigger

env:
  MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_URI }}
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

jobs:
  # Job 1: Data Validation
  validate-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.10'
          
      - name: Install dependencies
        run: pip install -r ml_models/requirements.txt
        
      - name: Validate training data
        run: python scripts/validate_data.py
        
      - name: Check for data drift
        run: python monitoring/drift_detector.py --check-training-data

  # Job 2: Train Model
  train:
    needs: validate-data
    runs-on: ubuntu-latest
    outputs:
      run_id: ${{ steps.train.outputs.run_id }}
      
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.10'
          
      - name: Install dependencies
        run: pip install -r ml_models/requirements.txt
        
      - name: Train workout generator
        id: train
        run: |
          RUN_ID=$(python training/train_workout_model.py)
          echo "run_id=$RUN_ID" >> $GITHUB_OUTPUT
          
      - name: Upload model artifact
        uses: actions/upload-artifact@v4
        with:
          name: workout-model
          path: ml_models/output/

  # Job 3: Evaluate Model
  evaluate:
    needs: train
    runs-on: ubuntu-latest
    outputs:
      passed: ${{ steps.eval.outputs.passed }}
      
    steps:
      - uses: actions/checkout@v4
      
      - name: Download model
        uses: actions/download-artifact@v4
        with:
          name: workout-model
          path: ml_models/output/
          
      - name: Run evaluation
        id: eval
        run: |
          RESULT=$(python evaluation/evaluate_model.py --run-id ${{ needs.train.outputs.run_id }})
          echo "passed=$RESULT" >> $GITHUB_OUTPUT
          
      - name: Fail if evaluation fails
        if: steps.eval.outputs.passed != 'true'
        run: exit 1

  # Job 4: Register Model
  register:
    needs: [train, evaluate]
    if: needs.evaluate.outputs.passed == 'true'
    runs-on: ubuntu-latest
    
    steps:
      - name: Register model in MLflow
        run: |
          mlflow models register \
            --model-uri runs:/${{ needs.train.outputs.run_id }}/workout_generator \
            --name WorkoutGenerator

  # Job 5: Deploy to Staging
  deploy-staging:
    needs: register
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - name: Deploy to staging
        run: |
          kubectl set image deployment/workout-llm \
            workout-llm=intellifit/workout-llm:${{ github.sha }} \
            --namespace staging
            
      - name: Run smoke tests
        run: python tests/smoke_tests.py --env staging
        
      - name: Run shadow comparison
        run: python tests/shadow_comparison.py --duration 1h

  # Job 6: Deploy to Production (manual approval)
  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Deploy with canary
        run: |
          # Deploy with 5% traffic initially
          kubectl apply -f k8s/workout-llm-canary.yml
          
      - name: Monitor canary (30 min)
        run: python ops/monitor_canary.py --duration 30m
        
      - name: Promote or rollback
        run: |
          if python ops/check_canary_health.py; then
            kubectl apply -f k8s/workout-llm-full.yml
          else
            kubectl rollback deployment/workout-llm
            exit 1
          fi
```

### 15.2 Continuous Training Trigger

```python
# scripts/check_retrain_trigger.py
"""
Check if model should be retrained based on:
1. Data drift detected
2. Performance degradation
3. New training data volume
4. Scheduled interval
"""

def should_retrain() -> tuple[bool, str]:
    # Check 1: Data drift
    drift = check_data_drift()
    if drift['drift_detected']:
        return True, f"Data drift: {drift['drifted_features']}"
    
    # Check 2: Performance degradation
    metrics = get_recent_metrics(days=7)
    if metrics['json_validity'] < 0.93:
        return True, f"JSON validity dropped to {metrics['json_validity']}"
    if metrics['acceptance_rate'] < 0.75:
        return True, f"Acceptance rate dropped to {metrics['acceptance_rate']}"
    
    # Check 3: New data volume
    new_plans = count_new_training_data(since_last_train=True)
    if new_plans > 500:
        return True, f"{new_plans} new training samples available"
    
    # Check 4: Time since last training
    last_train = get_last_training_date()
    if (datetime.now() - last_train).days > 30:
        return True, "30 days since last training"
    
    return False, "No retraining needed"
```

---

## 16. Cost Estimation & Budgeting

### 16.1 AI Service Costs

| Service | Unit | Cost | Monthly Estimate |
|---------|------|------|------------------|
| **OpenAI GPT-4** | 1K tokens | $0.03 input / $0.06 output | $150-300 |
| **OpenAI GPT-4o** | 1K tokens | $0.005 input / $0.015 output | $50-100 |
| **OpenAI Embeddings** | 1K tokens | $0.0001 | $5-10 |
| **OpenAI Realtime (Voice)** | 1 min | $0.06 input / $0.24 output | $100-500 |
| **Self-hosted Models** | GPU hours | $0.50-2.00/hr | $50-200 |
| **PostgreSQL + pgvector** | Storage | $10-50/month | $30 |
| **Redis** | Memory | $0.015/GB/hr | $10 |

### 16.2 Cost Control Strategies

```python
# Cost limiting middleware
class CostLimiter:
    def __init__(self, daily_budget_usd: float):
        self.daily_budget = daily_budget_usd
        self.redis = Redis()
    
    def check_budget(self, user_id: int, estimated_cost: float) -> bool:
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Check user daily limit
        user_key = f"ai_cost:{user_id}:{today}"
        user_spent = float(self.redis.get(user_key) or 0)
        
        if user_spent + estimated_cost > 0.50:  # $0.50/user/day
            return False
        
        # Check global daily limit
        global_key = f"ai_cost:global:{today}"
        global_spent = float(self.redis.get(global_key) or 0)
        
        if global_spent + estimated_cost > self.daily_budget:
            return False
        
        return True
    
    def record_cost(self, user_id: int, actual_cost: float):
        today = datetime.now().strftime("%Y-%m-%d")
        
        self.redis.incrbyfloat(f"ai_cost:{user_id}:{today}", actual_cost)
        self.redis.incrbyfloat(f"ai_cost:global:{today}", actual_cost)
        
        # Expire at midnight
        self.redis.expireat(f"ai_cost:{user_id}:{today}", 
                           int((datetime.now() + timedelta(days=1)).replace(hour=0).timestamp()))
```

### 16.3 Budget Alerts

```yaml
# prometheus/ai_cost_rules.yml
groups:
  - name: ai-cost-alerts
    rules:
      - alert: DailyBudget80Percent
        expr: ai_cost_daily_usd > (ai_budget_daily_usd * 0.8)
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "AI daily budget at 80%"
          
      - alert: DailyBudgetExceeded
        expr: ai_cost_daily_usd > ai_budget_daily_usd
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "AI daily budget exceeded!"
```

---

## 17. Quick Start Checklist (Updated)

```
□ Phase 1: Foundation (Week 1-2)
  □ Install PostgreSQL 16+ with pgvector
  □ Run AI database migrations (Section 8.2)
  □ Set up MLflow tracking server
  □ Configure Prometheus + Grafana
  □ Create .env with all API keys

□ Phase 2: ML Services (Week 3-4)
  □ Set up Python 3.10+ virtualenv
  □ Start embedding server (port 5100)
  □ Start vision server (port 5200)
  □ Start workout LLM server (port 5300)
  □ Verify all /health endpoints

□ Phase 3: Backend Integration (Week 5-6)
  □ Implement AI service interfaces
  □ Add A/B testing service
  □ Implement cost limiter
  □ Add Prometheus metrics endpoints
  □ Configure OpenAI API client

□ Phase 4: Frontend Chat UI (Week 7-8)
  □ Create unified chat component
  □ Add photo upload support
  □ Render rich responses (plans, charts)
  □ Add voice input (optional)

□ Phase 5: Training Pipeline (Week 9-10)
  □ Collect 50+ workout plans
  □ Fine-tune Flan-T5 with LoRA
  □ Train nutrition model
  □ Build knowledge base
  □ Register models in MLflow

□ Phase 6: MLOps Setup (Week 11-12)
  □ Configure GitHub Actions CI/CD
  □ Set up staging environment
  □ Configure Alertmanager
  □ Create Grafana dashboards
  □ Test rollback procedure

□ Phase 7: Launch (Week 13-14)
  □ Deploy to staging
  □ Run shadow tests
  □ A/B test with 20% traffic
  □ Monitor metrics for 1 week
  □ Full production rollout
```

---

## 18. Summary: Production Readiness Checklist

| Category | Requirement | Status |
|----------|-------------|--------|
| **Models** | 6 AI models defined | ✅ |
| **Architecture** | Microservices with clear APIs | ✅ |
| **Database** | PostgreSQL + pgvector + Redis | ✅ |
| **MLOps** | MLflow registry + versioning | ✅ |
| **A/B Testing** | Statistical framework + routing | ✅ |
| **Monitoring** | Prometheus + Grafana | ✅ |
| **Drift Detection** | Evidently AI integration | ✅ |
| **Rollback** | Automatic + manual procedures | ✅ |
| **CI/CD** | GitHub Actions pipeline | ✅ |
| **Cost Control** | Budget limits + alerts | ✅ |
| **Documentation** | Complete engineering guide | ✅ |

---

## 19. What I Still Need From You

### 🔴 BLOCKING (Must have before implementation)

| # | Item | Status |
|---|------|--------|
| 1 | OpenAI API Key | ⏳ Waiting |
| 2 | 50+ Workout Plans (JSON) | ⏳ Waiting |
| 3 | 500+ Member Profiles (CSV) | ⏳ Waiting |
| 4 | Monthly AI Budget Decision | ⏳ Waiting |

### 🟡 IMPORTANT (Needed during implementation)

| # | Item | Status |
|---|------|--------|
| 5 | KPI List for Analytics | ⏳ Waiting |
| 6 | Sample AI Conversations (20+) | ⏳ Waiting |
| 7 | Privacy Policy for Photos | ⏳ Waiting |

### 🟢 NICE TO HAVE (Can add later)

| # | Item | Status |
|---|------|--------|
| 8 | Voice Feature Decision | ⏳ Waiting |
| 9 | Gym Training Philosophy Doc | ⏳ Waiting |

---

*End of IntelliFit AI/ML System Engineering Guide v2.1*
*Now includes: MLOps, A/B Testing, Monitoring, Drift Detection, Rollback, CI/CD, Cost Control*
