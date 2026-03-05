ML Models - Embeddings & Serving
================================

This folder contains model configs and helper scripts for the IntelliFit ML components.

Goal: provide a safe, step-by-step embedding pipeline for RAG and similarity search.

Quick start (CPU):

1. Create virtualenv and install deps:

```powershell
cd ml_models
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Run the embedding server (exposes HTTP API on port 5100):

```powershell
# Option A (recommended for development - venv):
cd ml_models
.venv\Scripts\Activate.ps1
python embedding_server.py

# Option B (docker):
docker-compose up -d embedder
```

3. Compute and upsert embeddings for all exercises (low-resource tips):

```powershell
# Run with small batch sizes on laptops to avoid high memory/CPU spikes
# e.g., batch 16 or 32. Ensure DATABASE_URL env var points to your Postgres.
python ..\scripts\upsert_embeddings.py --batch 32
```

Resource recommendations:
- For an RTX4050 (6GB) you can choose slightly larger batch sizes (32-64), but monitor memory.
- If you have low RAM or CPU, keep `EMBEDDER_OMP_THREADS=1` and `EMBEDDER_OPENBLAS_THREADS=1` and `--batch 16`.
- Prefer running the embedding server in a local venv rather than Docker if you want to avoid large Docker image builds for `torch`.

Notes & order of operations (safe for Copilot implementation):

- Step 1 (Embedding): Implement `ml_models/embedding_server.py` and `scripts/upsert_embeddings.py` (done).
- Step 2 (DB): Ensure `Documentation/ML/01_DatabaseMigration.sql` has been applied so `Exercises.Embedding` exists (vector(384)).
- Step 3 (TF nutrition): Train and export SavedModel to `ml_models/serving/nutrition_model/1/`.
- Step 4 (Recommender): Train ML.NET/LightGBM using `UserWorkoutHistory`.
- Step 5 (LLM/chat): Build text-only LLM prototype that calls embeddings + retriever; only enable LLMs when GPU or hosted inference is available.

If you want, I can scaffold tests and a small Dockerfile for an image that includes torch for GPU later.
