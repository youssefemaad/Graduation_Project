import requests
import json
import time
import sys

# Force UTF-8 for Windows console
sys.stdout.reconfigure(encoding='utf-8')

URL = "http://localhost:5300/predict"
HEALTH_URL = "http://localhost:5300/health"

payload = {
    "user_id": 1,
    "fitness_level": "Intermediate",
    "goal": "Muscle",
    "days_per_week": 3,
    "equipment": ["Dumbbells", "Barbell", "Bench"],
    "injuries": [],
    "user_context": {
        "inbody_data": {
            "body_fat_percent": 18.5,
            "muscle_mass_kg": 35.0
        },
        "muscle_scan": {
            "weak_areas": ["Chest", "Triceps"],
            "strong_areas": ["Legs"]
        }
    }
}

def check_health():
    try:
        print(f"Checking health at {HEALTH_URL}...")
        resp = requests.get(HEALTH_URL)
        if resp.status_code == 200:
            print(f"✅ Service Healthy: {resp.json()}")
            return True
        else:
            print(f"❌ Service Unhealthy: {resp.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health Check Failed: {e}")
        return False

def test_predict():
    print(f"\nSending POST request to {URL}...")
    print(f"Payload:\n{json.dumps(payload, indent=2)}")

    try:
        start = time.time()
        resp = requests.post(URL, json=payload)
        latency = time.time() - start
        
        print(f"\nStatus Code: {resp.status_code}")
        print(f"Latency: {latency:.2f}s")
        
        if resp.status_code == 200:
            data = resp.json()
            print("\nResponse Body:")
            print(json.dumps(data, indent=2))
            
            plan = data.get("plan")
            if plan:
                print(f"\n✅ Plan Generated (Valid JSON: {data.get('is_valid_json')})")
                print(f"Plan Name: {plan.get('plan_name')}")
                if "days" in plan:
                    print(f"Days Generated: {len(plan['days'])}")
                    for day in plan['days']:
                        print(f" - Day {day.get('day_number')}: {day.get('day_name')} ({len(day.get('exercises', []))} exercises)")
            else:
                print("\n❌ NO PLAN generated.")
                if data.get("error"):
                    print(f"Error: {data.get('error')}")
        else:
            print(f"\n❌ Error: {resp.text}")

    except Exception as e:
        print(f"\n❌ FAILED to connect: {e}")

if __name__ == "__main__":
    if check_health():
        test_predict()
    else:
        print("Skipping prediction test due to health check failure.")
