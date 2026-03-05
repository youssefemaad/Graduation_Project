"""
Combine ExerciseDB v1 (1500 exercises) + v2 (25 exercises) into a unified dataset.
The v1 data lacks exerciseType, so we infer it from exercise characteristics.

Strategy:
1. Load v2 data (25 exercises with exerciseType: STRENGTH/CARDIO/PLYOMETRICS)  
2. Load v1 data (1500 exercises without exerciseType)
3. Infer exerciseType for v1 exercises based on name/equipment/bodyPart patterns
4. Merge, deduplicate by name, save as JSON + CSV
"""

import requests
import json
import csv
import time
import os

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_FILE = os.path.join(OUTPUT_DIR, "exercisedb_v2_full.json")
CSV_FILE = os.path.join(OUTPUT_DIR, "exercisedb_v2_full.csv")

# ── RapidAPI config for v2 (25 exercises with exerciseType) ──
RAPIDAPI_KEY = "ee078c024bmsh57059f06a13cb5dp151ca6jsnf8d922748207"
RAPIDAPI_HOST = "edb-with-videos-and-images-by-ascendapi.p.rapidapi.com"

# ── V1 free API ──
V1_BASE = "https://exercisedb-api.vercel.app/api/v1/exercises"


def fetch_v2_exercises():
    """Fetch the 25 exercises available on v2 free plan."""
    print("📡 Fetching v2 exercises (RapidAPI)...")
    url = f"https://{RAPIDAPI_HOST}/api/v1/exercises"
    headers = {"X-RapidAPI-Key": RAPIDAPI_KEY, "X-RapidAPI-Host": RAPIDAPI_HOST}
    try:
        resp = requests.get(url, headers=headers, params={"limit": 100}, timeout=30)
        if resp.status_code == 200:
            data = resp.json().get("data", [])
            print(f"   ✅ Got {len(data)} v2 exercises")
            return data
    except Exception as e:
        print(f"   ❌ Error: {e}")
    return []


def fetch_v1_exercises():
    """Fetch all 1500 exercises from v1 API."""
    print("📡 Fetching v1 exercises (Vercel API)...")
    all_ex = []
    offset = 0
    while True:
        try:
            resp = requests.get(V1_BASE, params={"limit": 100, "offset": offset}, timeout=30)
            if resp.status_code == 429:
                print(f"   Rate limited at offset {offset}, waiting 15s...")
                time.sleep(15)
                continue
            resp.raise_for_status()
            data = resp.json().get("data", [])
            if not data:
                break
            all_ex.extend(data)
            print(f"   offset={offset} → {len(all_ex)} total", flush=True)
            if len(data) < 100:
                break
            offset += 100
            time.sleep(1.5)
        except Exception as e:
            print(f"   Error at offset {offset}: {e}")
            if all_ex:
                break
            time.sleep(5)
    print(f"   ✅ Got {len(all_ex)} v1 exercises")
    return all_ex


def infer_exercise_type(name, equipments, body_parts):
    """Infer exercise type (STRENGTH/CARDIO/PLYOMETRICS) from characteristics."""
    name_lower = name.lower()
    equip_str = " ".join(equipments).lower() if equipments else ""
    bp_str = " ".join(body_parts).lower() if body_parts else ""

    # Cardio indicators
    cardio_keywords = [
        "run", "jog", "sprint", "cycling", "bike", "rowing", "elliptical",
        "treadmill", "swim", "walk", "stair", "climb", "skierg", "ski erg",
        "jumping jack", "mountain climber", "burpee", "high knees", "butt kick",
        "cardio", "aerobic", "skipping", "rope"
    ]
    if any(kw in name_lower for kw in cardio_keywords):
        return "CARDIO"
    if "cardiovascular system" in bp_str or "cardio" in bp_str:
        return "CARDIO"

    # Plyometrics indicators
    plyo_keywords = [
        "jump", "hop", "bound", "plyo", "explosive", "box jump",
        "tuck jump", "depth jump", "clap push", "power clean", "snatch",
        "clean and jerk", "thruster"
    ]
    if any(kw in name_lower for kw in plyo_keywords):
        return "PLYOMETRICS"

    # Stretching/flexibility
    stretch_keywords = ["stretch", "yoga", "flexibility", "foam roll", "mobility"]
    if any(kw in name_lower for kw in stretch_keywords):
        return "STRETCHING"

    # Default: STRENGTH (vast majority of gym exercises)
    return "STRENGTH"


def normalize_v1(ex):
    """Normalize a v1 exercise to unified format."""
    name = ex.get("name", "")
    body_parts = ex.get("bodyParts", [])
    equipments = ex.get("equipments", [])

    # v1 uses lowercase, v2 uses UPPERCASE
    body_parts_upper = [bp.upper() for bp in body_parts] if body_parts else []
    equipments_upper = [eq.upper() for eq in equipments] if equipments else []
    target_upper = [t.upper() for t in ex.get("targetMuscles", [])] if ex.get("targetMuscles") else []
    secondary_upper = [s.upper() for s in ex.get("secondaryMuscles", [])] if ex.get("secondaryMuscles") else []

    return {
        "exerciseId": ex.get("exerciseId", ""),
        "name": name.title(),  # Normalize casing
        "exerciseType": infer_exercise_type(name, equipments, body_parts),
        "bodyParts": body_parts_upper,
        "equipments": equipments_upper,
        "targetMuscles": target_upper,
        "secondaryMuscles": secondary_upper,
        "instructions": ex.get("instructions", []),
        "imageUrl": ex.get("gifUrl", ex.get("imageUrl", "")),
        "videoUrl": ex.get("videoUrl", ""),
    }


def normalize_v2(ex):
    """Normalize a v2 exercise (already in correct format)."""
    return {
        "exerciseId": ex.get("exerciseId", ""),
        "name": ex.get("name", "").title(),
        "exerciseType": ex.get("exerciseType", "STRENGTH"),
        "bodyParts": ex.get("bodyParts", []),
        "equipments": ex.get("equipments", []),
        "targetMuscles": ex.get("targetMuscles", []),
        "secondaryMuscles": ex.get("secondaryMuscles", []),
        "instructions": ex.get("instructions", []),
        "imageUrl": ex.get("imageUrl", ""),
        "videoUrl": ex.get("videoUrl", ""),
    }


def flatten(ex):
    def join_list(v):
        if isinstance(v, list):
            return "|".join(str(x) for x in v)
        return str(v) if v else ""
    return {
        "exerciseId": ex.get("exerciseId", ""),
        "name": ex.get("name", ""),
        "exerciseType": ex.get("exerciseType", ""),
        "bodyParts": join_list(ex.get("bodyParts")),
        "equipments": join_list(ex.get("equipments")),
        "targetMuscles": join_list(ex.get("targetMuscles")),
        "secondaryMuscles": join_list(ex.get("secondaryMuscles")),
        "instructions": join_list(ex.get("instructions")),
        "imageUrl": ex.get("imageUrl", ""),
        "videoUrl": ex.get("videoUrl", ""),
    }


def main():
    print("=" * 60)
    print("🏋️  ExerciseDB — Combined v1 + v2 Dataset Builder")
    print("=" * 60)

    merged = {}  # name_lower -> exercise

    # ── 1. Fetch v2 exercises (priority — they have exerciseType) ──
    v2_raw = fetch_v2_exercises()
    for ex in v2_raw:
        norm = normalize_v2(ex)
        key = norm["name"].strip().lower()
        if key:
            merged[key] = norm
    print(f"   After v2: {len(merged)} unique exercises")

    # ── 2. Fetch v1 exercises (fill in the rest) ──
    v1_raw = fetch_v1_exercises()
    v1_new = 0
    for ex in v1_raw:
        norm = normalize_v1(ex)
        key = norm["name"].strip().lower()
        if key and key not in merged:
            merged[key] = norm
            v1_new += 1
    print(f"   After v1: {len(merged)} unique (+{v1_new} new from v1)")

    exercises_list = list(merged.values())

    if not exercises_list:
        print("❌ No exercises!")
        return

    # ── Type distribution ──
    type_counts = {}
    for ex in exercises_list:
        t = ex.get("exerciseType", "UNKNOWN")
        type_counts[t] = type_counts.get(t, 0) + 1
    print(f"\n📊 Exercise Type Distribution:")
    for t, c in sorted(type_counts.items()):
        print(f"   {t}: {c}")

    # ── Save JSON ──
    print(f"\n💾 Saving {len(exercises_list)} exercises...")
    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(exercises_list, f, indent=2, ensure_ascii=False)
    json_mb = os.path.getsize(JSON_FILE) / (1024 * 1024)
    print(f"   ✅ JSON: {json_mb:.2f} MB")

    # ── Save CSV ──
    flat = [flatten(ex) for ex in exercises_list]
    fields = ["exerciseId", "name", "exerciseType", "bodyParts", "equipments",
              "targetMuscles", "secondaryMuscles", "instructions", "imageUrl", "videoUrl"]
    with open(CSV_FILE, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(flat)
    csv_mb = os.path.getsize(CSV_FILE) / (1024 * 1024)
    print(f"   ✅ CSV:  {csv_mb:.2f} MB")

    # ── Stats ──
    bp = set(); eq = set(); tgt = set()
    for ex in exercises_list:
        for x in (ex.get("bodyParts") or []): bp.add(x)
        for x in (ex.get("equipments") or []): eq.add(x)
        for x in (ex.get("targetMuscles") or []): tgt.add(x)

    print(f"\n{'=' * 60}")
    print(f"🎉 {len(exercises_list)} UNIQUE exercises saved!")
    print(f"   Body parts  ({len(bp)}): {sorted(bp)}")
    print(f"   Equipment   ({len(eq)}): {sorted(eq)}")
    print(f"   Muscles     ({len(tgt)}): {sorted(tgt)}")
    print(f"   Types: {type_counts}")
    print(f"   JSON: {json_mb:.2f} MB | CSV: {csv_mb:.2f} MB")
    print("=" * 60)


if __name__ == "__main__":
    main()
