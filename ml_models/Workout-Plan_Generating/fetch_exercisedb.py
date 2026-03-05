"""
fetch_exercisedb.py
===================
Downloads ALL exercises from ExerciseDB v1 API (https://www.exercisedb.dev)
Free, no auth required, 1500 exercises with:
  - name, targetMuscles, secondaryMuscles, equipments, bodyParts
  - instructions (step-by-step)
  - gifUrl (animated exercise demo for frontend)

Usage:
    python fetch_exercisedb.py
    
Output:
    data/exercisedb_v1_raw.json  — all 1500 raw exercises
"""

import json
import time
import urllib.request
import urllib.error
from pathlib import Path
from tqdm import tqdm

# ── Config ──────────────────────────────────────────────────────────────────
API_BASE = "https://www.exercisedb.dev/api/v1"
PAGE_SIZE = 25          # API max
DELAY_SECONDS = 1.2     # polite delay between pages (avoids 429)
RETRY_DELAYS = [5, 10, 20]  # exponential backoff on 429
OUTPUT_FILE = Path("data/exercisedb_v1_raw.json")

# ── Equipment name normalization (exercisedb → our format) ───────────────────
EQUIP_MAP = {
    "body weight":        "body only",
    "assisted":           "machine",
    "resistance band":    "bands",
    "ez barbell":         "e-z curl bar",
    "olympic barbell":    "barbell",
    "trap bar":           "barbell",
    "smith machine":      "machine",
    "leverage machine":   "machine",
    "upper body ergometer": "other",
    "wheel roller":       "other",
    "bosu ball":          "exercise ball",
    "rope":               "cables",
}

# ── Muscle name normalization (exercisedb → our format) ─────────────────────
MUSCLE_MAP = {
    "upper back":      "upper back",
    "middle back":     "middle back",
    "lower back":      "lower back",
    "lats":            "lats",
    "traps":           "traps",
    "delts":           "shoulders",
    "shoulders":       "shoulders",
    "pectorals":       "chest",
    "chest":           "chest",
    "abs":             "abdominals",
    "abdominals":      "abdominals",
    "serratus anterior": "abdominals",
    "obliques":        "abdominals",
    "quads":           "quadriceps",
    "quadriceps":      "quadriceps",
    "hamstrings":      "hamstrings",
    "glutes":          "glutes",
    "calves":          "calves",
    "biceps":          "biceps",
    "triceps":         "triceps",
    "forearms":        "forearms",
    "spine":           "lower back",
    "adductors":       "adductors",
    "abductors":       "abductors",
}


def fetch_page(offset: int) -> dict:
    """Fetch one page of exercises from the API."""
    url = f"{API_BASE}/exercises?limit={PAGE_SIZE}&offset={offset}"
    req = urllib.request.Request(
        url, headers={"User-Agent": "workout-ml-builder/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())


def normalize_exercise(ex: dict) -> dict:
    """Convert ExerciseDB format to our exercise DB format."""
    # Normalize equipment
    raw_equip = (ex.get("equipments") or ["body weight"])
    equip = raw_equip[0] if raw_equip else "body only"
    equip = EQUIP_MAP.get(equip.lower(), equip.lower())

    # Normalize muscles
    def norm_muscles(muscles):
        return [MUSCLE_MAP.get(m.lower(), m.lower()) for m in (muscles or [])]

    primary = norm_muscles(ex.get("targetMuscles", []))
    secondary = norm_muscles(ex.get("secondaryMuscles", []))

    # Instructions: ExerciseDB has "Step:N text" format, clean it up
    raw_instructions = ex.get("instructions", [])
    clean_instructions = []
    for step in raw_instructions:
        # Remove "Step:N " prefix if present
        if step.startswith("Step:"):
            parts = step.split(" ", 1)
            clean_instructions.append(parts[1] if len(parts) > 1 else step)
        else:
            clean_instructions.append(step)

    return {
        "name": ex["name"].strip().lower(),
        "primaryMuscles": primary,
        "secondaryMuscles": secondary,
        "equipment": equip,
        "bodyParts": ex.get("bodyParts", []),
        "instructions": clean_instructions,
        "gifUrl": ex.get("gifUrl", ""),
        "exerciseDbId": ex.get("exerciseId", ""),
    }


def fetch_all_exercises() -> list:
    """Fetch all exercises from ExerciseDB with pagination."""
    # Get total count first
    print("Connecting to ExerciseDB API...")
    first_page = fetch_page(0)
    total = first_page["metadata"]["totalExercises"]
    total_pages = (total + PAGE_SIZE - 1) // PAGE_SIZE
    print(f"Total exercises: {total} | Pages: {total_pages}")

    all_exercises = []

    # Process first page
    for ex in first_page["data"]:
        all_exercises.append(normalize_exercise(ex))

    # Fetch remaining pages
    with tqdm(total=total_pages - 1, desc="Fetching pages", unit="page") as pbar:
        for page_idx in range(1, total_pages):
            offset = page_idx * PAGE_SIZE
            for attempt, wait in enumerate([0] + RETRY_DELAYS):
                if wait:
                    time.sleep(wait)
                try:
                    page = fetch_page(offset)
                    for ex in page["data"]:
                        all_exercises.append(normalize_exercise(ex))
                    break
                except urllib.error.HTTPError as e:
                    if e.code == 429:
                        if attempt < len(RETRY_DELAYS):
                            print(
                                f"\n  429 rate limit at offset {offset}, waiting {RETRY_DELAYS[attempt]}s...")
                        else:
                            print(
                                f"\n  Skipping offset {offset} after {len(RETRY_DELAYS)} retries")
                    else:
                        print(f"\n  HTTP {e.code} at offset {offset}")
                        break
                except Exception as e:
                    if attempt < len(RETRY_DELAYS):
                        print(
                            f"\n  Error at offset {offset}: {e}, retrying...")
                    else:
                        print(f"\n  Failed offset {offset}: {e}")
                        break

            time.sleep(DELAY_SECONDS)
            pbar.update(1)

    return all_exercises


def main():
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    exercises = fetch_all_exercises()
    print(f"\nFetched {len(exercises)} exercises")

    # Save raw normalized data
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(exercises, f, indent=2, ensure_ascii=False)
    print(f"Saved to {OUTPUT_FILE}")

    # Quick stats
    equip_counts = {}
    muscle_counts = {}
    for ex in exercises:
        equip_counts[ex["equipment"]] = equip_counts.get(
            ex["equipment"], 0) + 1
        for m in ex["primaryMuscles"]:
            muscle_counts[m] = muscle_counts.get(m, 0) + 1

    print("\nTop equipment:")
    for k, v in sorted(equip_counts.items(), key=lambda x: -x[1])[:10]:
        print(f"  {k}: {v}")

    print("\nTop muscles:")
    for k, v in sorted(muscle_counts.items(), key=lambda x: -x[1])[:10]:
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
