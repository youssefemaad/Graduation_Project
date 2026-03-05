#!/usr/bin/env python3
"""
Simple embedding microservice using sentence-transformers and Flask.

Endpoints:
- POST /embed   -> { "texts": ["...", ...] } returns { "embeddings": [[...], ...] }
- POST /upsert  -> { "items": [{"id": 1, "text": "..."}, ...] } upserts embeddings to Postgres Exercises.Embedding

This script is intentionally minimal and safe for MVP. It uses CPU by default.
"""
import os
from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import psycopg2
from psycopg2.extras import execute_values
from pgvector.psycopg2 import register_vector
from pgvector import Vector
import threading
import numpy as np

DB_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:123@postgres:5432/intellifit_db")
MODEL_NAME = os.environ.get("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
# Limit parallelism to reduce CPU and memory usage on constrained machines
os.environ.setdefault("OMP_NUM_THREADS", os.environ.get("EMBEDDER_OMP_THREADS", "1"))
os.environ.setdefault("OPENBLAS_NUM_THREADS", os.environ.get("EMBEDDER_OPENBLAS_THREADS", "1"))
os.environ.setdefault("MKL_NUM_THREADS", os.environ.get("EMBEDDER_MKL_THREADS", "1"))
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

app = Flask(__name__)

print(f"Loading embedding model: {MODEL_NAME}")
model = SentenceTransformer(MODEL_NAME)


def get_db_conn():
    conn = psycopg2.connect(DB_URL)
    register_vector(conn)
    return conn


@app.route("/embed", methods=["POST"])
def embed():
    data = request.get_json(force=True) or {}
    texts = data.get("texts")
    if not texts or not isinstance(texts, list):
        return jsonify({"error": "Provide a JSON body with a `texts` array."}), 400

    # return numpy arrays for efficient conversion
    embeddings = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
    embeddings = [np.asarray(e).tolist() for e in embeddings]
    return jsonify({"embeddings": embeddings})


@app.route("/upsert", methods=["POST"])
def upsert():
    data = request.get_json(force=True) or {}
    items = data.get("items")
    if not items or not isinstance(items, list):
        return jsonify({"error": "Provide a JSON body with an `items` array of {id, text} objects."}), 400

    texts = [item.get("text", "") for item in items]
    ids = [item.get("id") for item in items]

    embeddings = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
    # Upsert into Exercises (assumes table and Embedding column exist)
    rows = []
    for i in range(len(ids)):
        vec = Vector(embeddings[i].tolist())
        rows.append((ids[i], vec))

    conn = get_db_conn()
    cur = conn.cursor()
    try:
        sql = "INSERT INTO \"Exercises\" (\"Id\", \"Embedding\") VALUES %s ON CONFLICT (\"Id\") DO UPDATE SET \"Embedding\" = EXCLUDED.\"Embedding\";"
        execute_values(cur, sql, rows)
        conn.commit()
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

    return jsonify({"upserted": len(rows)})


@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model": MODEL_NAME}), 200


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5100))
    app.run(host='0.0.0.0', port=port)
