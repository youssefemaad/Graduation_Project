"""Export exercises_final.json to a flat CSV file (all fields)."""
import json
import csv
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
with open(SCRIPT_DIR / "data" / "exercises_final.json", "r", encoding="utf-8") as f:
    exercises = json.load(f)

out = SCRIPT_DIR / "data" / "exercises_all_fields.csv"
GOALS = ["Strength", "Muscle", "WeightLoss", "Endurance", "General"]

with open(out, "w", encoding="utf-8-sig", newline="") as f:
    w = csv.writer(f)
    # ── Header ──────────────────────────────────────────────────────────────
    header = [
        "name",
        "primaryMuscles",
        "secondaryMuscles",
        "equipment",
        "mechanic",
        "force",
        "movement_pattern",
        "difficulty_level",
        "category",
        "skill_level",
        "fatigue_score",
        "stimulus_score",
        "sfr_ratio",
        "axial_load",
        "recovery_time_hours",
        "order_priority",
        "gifUrl",
        "goal_Strength",
        "goal_Muscle",
        "goal_WeightLoss",
        "goal_Endurance",
        "goal_General",
    ]
    for goal in GOALS:
        header += [
            f"{goal}_min_reps",
            f"{goal}_max_reps",
            f"{goal}_rest_seconds",
            f"{goal}_sets",
        ]
    header += ["contraindications", "instructions"]
    w.writerow(header)

    # ── Rows ─────────────────────────────────────────────────────────────────
    for ex in exercises:
        gs = ex.get("goal_suitability", {})
        rr = ex.get("rep_ranges_by_goal", {})
        row = [
            ex.get("name", ""),
            "|".join(ex.get("primaryMuscles", [])),
            "|".join(ex.get("secondaryMuscles", [])),
            ex.get("equipment", ""),
            ex.get("mechanic", ""),
            ex.get("force", ""),
            ex.get("movement_pattern", ""),
            ex.get("difficulty_level", ""),
            ex.get("category", ""),
            ex.get("skill_level", ""),
            ex.get("fatigue_score", ""),
            ex.get("stimulus_score", ""),
            ex.get("sfr_ratio", ""),
            ex.get("axial_load", ""),
            ex.get("recovery_time_hours", ""),
            ex.get("order_priority", ""),
            ex.get("gifUrl", ""),
            gs.get("Strength", ""),
            gs.get("Muscle", ""),
            gs.get("WeightLoss", ""),
            gs.get("Endurance", ""),
            gs.get("General", ""),
        ]
        for goal in GOALS:
            r = rr.get(goal, {})
            row += [
                r.get("min_reps", ""),
                r.get("max_reps", ""),
                r.get("rest_seconds", ""),
                r.get("sets", ""),
            ]
        row += [
            "|".join(ex.get("contraindications", [])),
            " | ".join(ex.get("instructions", [])),
        ]
        w.writerow(row)

print(f"Wrote {len(exercises)} exercises -> {out}")
