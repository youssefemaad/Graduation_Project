"""
dedup_exercises.py
==================
Analyzes exercises_clean_merged.json for duplicates, merges the best
fields from each copy, and outputs a single clean deduplicated file.

Deduplication strategy:
  1. Exact name match → merge, prefer richer record (has gifUrl, longer instructions, etc.)
  2. Near-duplicate names (only differ by spaces/punctuation/casing) → same merge logic
  3. After dedup: normalize equipment variants (band/bands, cable/cables, etc.)
  4. Save to data/exercises_final.json
"""

import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path

INPUT_FILE = Path("data/exercises_clean_merged.json")
OUTPUT_FILE = Path("data/exercises_final.json")

# ── Equipment normalization ────────────────────────────────────────────────
EQUIP_NORM = {
    "bands":          "band",
    "cables":         "cable",
    "kettlebells":    "kettlebell",
    "dumbbells":      "dumbbell",
    "barbells":       "barbell",
    "machines":       "machine",
    "skierg machine": "machine",
    "sled machine":   "machine",
    "hammer":         "other",
    "roller":         "other",
    "weighted":       "other",
}

# ── Helpers ────────────────────────────────────────────────────────────────


def normalize_key(name: str) -> str:
    """Canonical key for duplicate detection: lowercase, no punctuation, single spaces."""
    n = name.lower().strip()
    n = unicodedata.normalize("NFKD", n)
    n = re.sub(r"[^a-z0-9 ]", " ", n)      # strip punctuation
    n = re.sub(r"\s+", " ", n).strip()
    return n


def score(ex: dict) -> int:
    """Higher = richer record; prefer this one when merging."""
    s = 0
    if ex.get("gifUrl"):
        s += 10
    if ex.get("instructions"):
        s += len(ex["instructions"])
    if ex.get("exerciseDbId"):
        s += 5
    if ex.get("contraindications"):
        s += 3
    if ex.get("mechanic") not in ("", None):
        s += 2
    if ex.get("force") not in ("", None):
        s += 2
    return s


def merge_two(a: dict, b: dict) -> dict:
    """Merge b into a, taking the best value for each field."""
    merged = dict(a)

    # String fields: prefer non-empty
    for field in ("mechanic", "force", "movement_pattern", "difficulty_level",
                  "category", "gifUrl", "exerciseDbId"):
        if not merged.get(field) and b.get(field):
            merged[field] = b[field]

    # List fields: union (preserve order, deduplicate)
    for field in ("primaryMuscles", "secondaryMuscles", "instructions",
                  "contraindications", "goal_suitability", "bodyParts"):
        av = merged.get(field) or []
        bv = b.get(field) or []
        if not av:
            merged[field] = bv
        elif bv and len(bv) > len(av):
            # prefer longer list (more complete)
            merged[field] = bv

    # Numeric fields: prefer non-zero value; if both non-zero, keep from higher-scored source
    for field in ("fatigue_score", "stimulus_score", "sfr_ratio",
                  "axial_load", "recovery_time_hours", "order_priority"):
        av = merged.get(field, 0) or 0
        bv = b.get(field, 0) or 0
        if not av and bv:
            merged[field] = bv

    # rep_ranges_by_goal: dict — merge keys
    rr_a = merged.get("rep_ranges_by_goal") or {}
    rr_b = b.get("rep_ranges_by_goal") or {}
    if rr_b and not rr_a:
        merged["rep_ranges_by_goal"] = rr_b
    elif rr_b and rr_a:
        combined = dict(rr_b)
        combined.update(rr_a)   # a's values win
        merged["rep_ranges_by_goal"] = combined

    # skill_level: prefer non-beginner if available
    sl_map = {"beginner": 0, "intermediate": 1, "advanced": 2}
    sl_a = sl_map.get(str(merged.get("skill_level", "beginner")).lower(), 0)
    sl_b = sl_map.get(str(b.get("skill_level", "beginner")).lower(), 0)
    if sl_b > sl_a:
        merged["skill_level"] = b["skill_level"]

    return merged


def normalize_equipment(ex: dict) -> dict:
    """Normalize equipment field to canonical values."""
    eq = ex.get("equipment", "")
    ex["equipment"] = EQUIP_NORM.get(eq, eq)
    return ex


def run():
    # ── Load ────────────────────────────────────────────────────────────────
    data = json.load(open(INPUT_FILE, encoding="utf-8"))
    print(f"Input: {len(data)} exercises")

    # ── Group by canonical name key ──────────────────────────────────────────
    groups: dict[str, list] = defaultdict(list)
    for ex in data:
        key = normalize_key(ex["name"])
        groups[key].append(ex)

    exact_dupe_keys = [k for k, g in groups.items() if len(g) > 1]
    extra_copies = sum(len(g) - 1 for g in groups.values() if len(g) > 1)
    print(f"Duplicate canonical keys: {len(exact_dupe_keys)}")
    print(f"Extra copies to remove:   {extra_copies}")
    print()

    # Show top duplicated names for transparency
    top_dupes = sorted(
        [(k, g) for k, g in groups.items() if len(g) > 1],
        key=lambda x: -len(x[1])
    )[:30]
    print("Top duplicated exercises:")
    for key, group in top_dupes:
        names = [g["name"] for g in group]
        print(f"  [{len(group)}x] {names[0]!r}" +
              (f" also as {names[1:]!r}" if len(set(names)) > 1 else ""))

    # ── Merge groups ────────────────────────────────────────────────────────
    deduped = []
    for key, group in groups.items():
        if len(group) == 1:
            deduped.append(normalize_equipment(group[0]))
        else:
            # Sort by richness score descending, start from the best
            sorted_group = sorted(group, key=score, reverse=True)
            best = sorted_group[0]
            for other in sorted_group[1:]:
                best = merge_two(best, other)
            deduped.append(normalize_equipment(best))

    # Sort final list by name for determinism
    deduped.sort(key=lambda x: x["name"])

    # ── Stats ────────────────────────────────────────────────────────────────
    print()
    print(
        f"Output: {len(deduped)} unique exercises (removed {len(data) - len(deduped)} duplicates)")
    print()

    # Equipment distribution
    from collections import Counter
    equip_c = Counter(ex["equipment"] for ex in deduped)
    muscle_c = Counter(
        m for ex in deduped for m in ex.get("primaryMuscles", []))
    mechanic_c = Counter(ex.get("mechanic", "") for ex in deduped)
    skill_c = Counter(ex.get("skill_level", "") for ex in deduped)
    has_gif = sum(1 for ex in deduped if ex.get("gifUrl"))
    has_instr = sum(1 for ex in deduped if ex.get("instructions"))
    has_contra = sum(1 for ex in deduped if ex.get("contraindications"))

    print("By equipment:")
    for k, v in sorted(equip_c.items(), key=lambda x: -x[1]):
        print(f"  {k}: {v}")

    print("\nBy primary muscle:")
    for k, v in sorted(muscle_c.items(), key=lambda x: -x[1]):
        print(f"  {k}: {v}")

    print("\nBy mechanic:", dict(mechanic_c))
    print("By skill level:", dict(skill_c))
    print(
        f"\nwith gifUrl:           {has_gif}/{len(deduped)} ({100*has_gif/len(deduped):.1f}%)")
    print(
        f"with instructions:     {has_instr}/{len(deduped)} ({100*has_instr/len(deduped):.1f}%)")
    print(
        f"with contraindications:{has_contra}/{len(deduped)} ({100*has_contra/len(deduped):.1f}%)")

    # ── Save ────────────────────────────────────────────────────────────────
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(deduped, f, indent=2, ensure_ascii=False)
    print(f"\nSaved to: {OUTPUT_FILE.resolve()}")


if __name__ == "__main__":
    run()
