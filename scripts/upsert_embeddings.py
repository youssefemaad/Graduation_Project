#!/usr/bin/env python3
"""
CLI to compute embeddings for all exercises and upsert them to the database.

Usage:
  python scripts/upsert_embeddings.py --batch 64

This script connects directly to Postgres, reads `Exercises` rows (Id, Name, Description),
computes embeddings using the same model as `ml_models/embedding_server.py`, and upserts.
"""
import os
import argparse
from sentence_transformers import SentenceTransformer
import psycopg2
from psycopg2.extras import execute_values
from pgvector.psycopg2 import register_vector
from pgvector import Vector
import numpy as np

DB_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:123@postgres:5432/intellifit_db")
MODEL_NAME = os.environ.get("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")


def get_conn():
    conn = psycopg2.connect(DB_URL)
    register_vector(conn)
    return conn


def fetch_exercises(conn):
    cur = conn.cursor()
    cur.execute('SELECT "Id", COALESCE("Name", ''), COALESCE("Description", '') FROM "Exercises";')
    rows = cur.fetchall()
    cur.close()
    return rows


def upsert_rows(conn, rows):
    cur = conn.cursor()
    sql = "INSERT INTO \"Exercises\" (\"Id\", \"Embedding\") VALUES %s ON CONFLICT (\"Id\") DO UPDATE SET \"Embedding\" = EXCLUDED.\"Embedding\";"
    execute_values(cur, sql, rows)
    conn.commit()
    cur.close()


def main(batch_size=64):
    print(f"Loading model {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)
    conn = get_conn()
    try:
        exercises = fetch_exercises(conn)
        print(f"Found {len(exercises)} exercises")
        items = []
        for idx, name, desc in exercises:
            text = (name or "") + " \n " + (desc or "")
            items.append((idx, text))

            for i in range(0, len(items), batch_size):
                batch = items[i:i+batch_size]
                ids = [b[0] for b in batch]
                texts = [b[1] for b in batch]
                embs = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
                rows = [(ids[j], Vector(np.asarray(embs[j]).tolist())) for j in range(len(ids))]
                upsert_rows(conn, rows)
                print(f"Upserted batch {i // batch_size + 1} ({len(rows)} rows)")
    finally:
        conn.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--batch', type=int, default=64)
    args = parser.parse_args()
    main(batch_size=args.batch)
