# IntelliFit / CodeFlex AI - Project Overview

**IntelliFit** (also referred to as CodeFlex AI in the frontend) is a comprehensive AI-powered fitness coaching platform. It combines a .NET Core backend, a Next.js frontend, and a suite of Python-based ML models to provide personalized workout plans, nutrition advice, and real-time coaching.

## 🏗 Architecture

The system follows a microservices-like architecture:

### 1. **Frontend (`codeflex-ai`)**
*   **Framework**: Next.js 15 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS, Shadcn UI
*   **State/Data**: Convex, React Query (implied)
*   **Key Integrations**:
    *   `@google/generative-ai` (Gemini)
    *   `@vapi-ai/web` (Voice AI)
    *   `@clerk/nextjs` (Authentication)

### 2. **Backend API (`Graduation-Project`)**
*   **Framework**: .NET 8 Web API
*   **Architecture**: Clean Architecture (Core, Infrastructure, Presentation, Shared)
*   **Database**: PostgreSQL (with `pgvector` for embeddings)
*   **ORM**: Entity Framework Core

### 3. **AI/ML Services (`ml_models`)**
*   **Workout Generator**: Python-based API (`workout_api.py`) using **Flan-T5-Small + LoRA** adapter.
*   **Vision Analyzer**: Computer vision components.
*   **Nutrition Planner**: TensorFlow-based nutrition models.
*   **Chatbot**: AI Coach implementation.
*   **Orchestration**: Can be run locally via Python scripts or containerized with TensorFlow Serving.

---

## 🚀 Getting Started

### Prerequisites
*   **Node.js** (v18+)
*   **indotnet SDK** (v8.0)
*   **Python** (3.8+) with Conda or venv
*   **PostgreSQL** (running locally or via Docker)
*   **Docker** (optional, for containerized run)

### Method 1: Quick Start (Windows Batch Script)
The easiest way to spin up the development environment is using the provided batch script. This starts the Python AI server, .NET Backend, and Next.js Frontend in separate windows.

```cmd
.\START_ALL_SERVICES.bat
```
*   **Frontend**: `http://localhost:3000`
*   **Backend API**: `http://localhost:5000`
*   **AI API**: `http://localhost:8000`

**Note**: This requires the `workout_ml` conda environment to be set up. If not, see the "Manual Setup" below.

### Method 2: Manual Setup

#### 1. Python AI Service
```bash
cd ml_models/Workout-Plan_Generating
# Create/Activate environment (if not using Conda, use venv)
conda activate workout_ml
# OR
python -m venv venv
.\venv\Scripts\activate

pip install -r requirements.txt
python workout_api.py
```

#### 2. .NET Backend
```bash
cd Graduation-Project
dotnet restore
dotnet run
```

#### 3. Frontend
```bash
cd codeflex-ai
npm install
npm run dev
```

### Method 3: Docker Compose
*Note: The `docker-compose.yml` references `intellifit-frontend` which may need to be updated to `codeflex-ai`.*

```bash
docker-compose up --build
```

---

## 📂 Key Directory Structure

*   `codeflex-ai/` - **Frontend Application** (Next.js)
*   `Graduation-Project/` - **Main API Entry Point** (.NET)
*   `Core/` - **Domain Layer** (Entities, Interfaces, DTOs)
*   `Infrastructure/` - **Data Access & Implementation** (EF Core, Repositories)
*   `Shared/` - **Shared Resources** (Constants, Helpers)
*   `ml_models/` - **Machine Learning Components**
    *   `Workout-Plan_Generating/` - Main generator API
    *   `Nutrition-Plan_Generating/`
    *   `Vision Analyzer/`
    *   `_ML/` - Docker/Migration scripts
*   `scripts/` - **Utility Scripts** (Database seeding, checks)
*   `Documentation/` - **SQL Scripts & Guides**

## 🛠 Development Notes

*   **Database Seeding**: Use scripts in `scripts/` or SQL files in `Documentation/` to populate initial data.
*   **AI Models**: The `ML-IMPLEMENTATION-GUIDE.md` outlines a roadmap for moving towards ML.NET and more robust vector search. The current running state heavily relies on the Python APIs in `ml_models`.
*   **Environment Variables**: Check `.env` files in `codeflex-ai` and `appsettings.json` in `Graduation-Project` for configuration keys (DB connection, API keys).
