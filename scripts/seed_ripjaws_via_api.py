# -*- coding: utf-8 -*-
"""
Seed script: fully populate ripjaws@gmail.com with mock learning data.

Pre-conditions:
  - Backend running at http://localhost:8000 (or pass BASE env var)
  - eduverse/.env has USE_MOCK_AGENTS=true, ASSISTANT_LLM_BRIDGE=false
  - ripjaws@gmail.com password = ripjaws123

Run:
  cd eduverse/scripts
  python seed_ripjaws_via_api.py          # idempotent; re-runs safely
  python seed_ripjaws_via_api.py --force  # clears cache before resource fetch
  python seed_ripjaws_via_api.py --base http://localhost:8001  # custom port
"""

import sys
import time
import argparse
import os
import requests

BASE = os.environ.get("SEED_BASE", "http://localhost:8001/api")

# ---- helpers -----------------------------------------------------------------

def ok(resp: requests.Response, label: str) -> dict:
    if resp.status_code not in (200, 201):
        print("  FAIL {}: HTTP {}  {}".format(label, resp.status_code, resp.text[:200]))
        sys.exit(1)
    data = resp.json()
    print("  OK   {}".format(label))
    return data


def auth_headers(token: str) -> dict:
    return {"Authorization": "Bearer {}".format(token)}


# ---- step 1: login -----------------------------------------------------------

def login() -> str:
    print("\n[Step 1] Login")
    resp = requests.post("{}/auth/login".format(BASE), json={
        "username": "ripjaws@gmail.com",
        "password": "ripjaws123"
    })
    data = ok(resp, "POST /auth/login")
    token = data["access_token"]
    print("     token: {}...".format(token[:30]))
    return token


# ---- step 2: update profile --------------------------------------------------

def update_profile(token: str) -> None:
    print("\n[Step 2] Update Profile")
    resp = requests.put("{}/auth/me".format(BASE), headers=auth_headers(token), json={
        "goal": "Python Web Developer",
        "skill_level": "Beginner",
        "daily_study_time": 60,
        "target_date": "2026-09-25"
    })
    ok(resp, "PUT /auth/me (goal + skill level)")


# ---- step 3: four onboarding steps -------------------------------------------

def run_onboarding(token: str) -> dict:
    """Run all 4 onboarding steps and return the roadmap."""
    print("\n[Step 3] Onboarding (4 steps)")

    # 3a. Planner
    resp = requests.post("{}/roadmap/step/planner".format(BASE), headers=auth_headers(token), json={
        "goal": "Python Web Developer",
        "skill_level": "Beginner",
        "daily_study_time": 60,
        "target_date": "2026-09-25"
    })
    roadmap = ok(resp, "POST /roadmap/step/planner")
    roadmap_id = roadmap["id"]
    milestones = roadmap.get("milestones", [])
    total_lessons = sum(len(m["lessons"]) for m in milestones)
    print("     roadmap_id={}  milestones={}  lessons={}".format(
        roadmap_id, len(milestones), total_lessons))

    # 3b. Tutor -- generates study notes per lesson
    resp = requests.post("{}/roadmap/step/tutor".format(BASE), headers=auth_headers(token), json={
        "roadmap_id": roadmap_id
    })
    ok(resp, "POST /roadmap/step/tutor (study notes)")

    # 3c. Quiz -- pre-generates quiz questions per lesson
    resp = requests.post("{}/roadmap/step/quiz".format(BASE), headers=auth_headers(token), json={
        "roadmap_id": roadmap_id
    })
    ok(resp, "POST /roadmap/step/quiz (quiz questions)")

    # 3d. Research -- resources + career analysis
    resp = requests.post("{}/roadmap/step/research".format(BASE), headers=auth_headers(token), json={
        "roadmap_id": roadmap_id
    })
    ok(resp, "POST /roadmap/step/research (resources + career)")

    return roadmap


# ---- step 4: supplemental enrichment ----------------------------------------

def enrich(token: str, roadmap: dict, force_refresh: bool) -> None:
    print("\n[Step 4] Supplemental Enrichment")
    milestones = roadmap.get("milestones", [])

    # Flatten lessons
    all_lessons = []
    for m in milestones:
        for lesson in m["lessons"]:
            all_lessons.append(lesson)

    if not all_lessons:
        print("  WARNING: No lessons found -- skipping enrichment")
        return

    # 4a: Lesson statuses
    print("\n  Setting lesson statuses ({} lessons)...".format(len(all_lessons)))
    for i, lesson in enumerate(all_lessons):
        lid = lesson["id"]
        if i == 0:
            target_status = "Completed"
        elif i == 1:
            target_status = "Current"
        else:
            target_status = "Locked"
        resp = requests.put(
            "{}/roadmap/lesson/{}/status".format(BASE, lid),
            headers=auth_headers(token),
            params={"status": target_status}
        )
        ok(resp, "PUT /roadmap/lesson/{}/status -> {}".format(lid, target_status))

    # 4b: Generate quizzes for first 3 lessons
    print("\n  Generating quizzes for first 3 lessons...")
    quiz_ids = []
    for lesson in all_lessons[:3]:
        lid = lesson["id"]
        resp = requests.get("{}/quiz/generate/{}".format(BASE, lid), headers=auth_headers(token))
        data = ok(resp, "GET /quiz/generate/{}".format(lid))
        quiz_ids.append((data["quiz_id"], lid, data.get("questions", [])))

    # 4c: Submit quiz attempts for first 2 lessons
    print("\n  Submitting quiz attempts for first 2 lessons...")
    for quiz_id, lid, questions in quiz_ids[:2]:
        if not questions:
            print("  WARNING: No questions for quiz {}, skipping submit".format(quiz_id))
            continue

        answers = []
        for q in questions:
            if q["type"] in ("MCQ", "TF") and q.get("options"):
                answers.append({
                    "question_id": q["question_id"],
                    "selected_option_idx": 0,
                    "short_answer_text": ""
                })
            else:
                answers.append({
                    "question_id": q["question_id"],
                    "selected_option_idx": None,
                    "short_answer_text": "This is a sample short answer response for testing purposes."
                })

        resp = requests.post("{}/quiz/submit".format(BASE), headers=auth_headers(token), json={
            "quiz_id": quiz_id,
            "answers": answers
        })
        ok(resp, "POST /quiz/submit (quiz_id={}, lesson={})".format(quiz_id, lid))

    # 4d: Extra practice quiz for first lesson
    print("\n  Generating extra practice quiz for lesson 1...")
    first_lid = all_lessons[0]["id"]
    resp = requests.get("{}/quiz/generate-extra/{}".format(BASE, first_lid), headers=auth_headers(token))
    if resp.status_code in (200, 201):
        ok(resp, "GET /quiz/generate-extra/{}".format(first_lid))
    else:
        print("  WARNING: Extra quiz skipped: {} {}".format(resp.status_code, resp.text[:100]))

    # 4e: Tutor chat on current lesson (index 1)
    current_lesson = all_lessons[1] if len(all_lessons) > 1 else all_lessons[0]
    clid = current_lesson["id"]
    print("\n  Seeding tutor chat on lesson {} ({})...".format(clid, current_lesson["title"]))
    chat_messages = [
        "Can you give me a quick overview of this lesson?",
        "What are the most important concepts I should focus on?",
        "Can you show me a simple Python code example for this topic?",
        "What are common mistakes beginners make with this topic?",
        "How does this relate to what I'll learn in the next milestone?",
        "Can you give me a mini quiz question to test my understanding?"
    ]
    for msg in chat_messages:
        resp = requests.post(
            "{}/tutor/chat".format(BASE),
            headers=auth_headers(token),
            json={"message": msg, "lesson_id": clid},
            stream=True
        )
        if resp.status_code in (200, 201):
            # drain streaming response
            for _ in resp.iter_content(chunk_size=512):
                pass
            print("  OK   Tutor chat: '{}'".format(msg[:55]))
        else:
            print("  WARNING: Tutor chat failed ({}): {}".format(resp.status_code, resp.text[:100]))
        time.sleep(0.3)

    # 4f: Cache resources for all 5 intents
    print("\n  Fetching resources for all 5 intents (query: Python Web Developer)...")
    intents = ["resources", "docs", "courses", "books", "career"]
    for intent in intents:
        resp = requests.get(
            "{}/resources/search".format(BASE),
            headers=auth_headers(token),
            params={
                "query": "Python Web Developer",
                "intent": intent,
                "limit": 20,
                "force_refresh": str(force_refresh).lower()
            }
        )
        if resp.status_code in (200, 201):
            data = resp.json()
            count = len(data.get("resources", []))
            print("  OK   GET /resources/search?intent={}  -> {} results".format(intent, count))
        else:
            print("  WARNING: Resources [{}] failed: {} {}".format(
                intent, resp.status_code, resp.text[:100]))
        time.sleep(0.5)


# ---- main --------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Seed ripjaws@gmail.com with mock data")
    parser.add_argument("--force", action="store_true", help="Force-refresh resource cache")
    parser.add_argument("--base", default=None, help="Override API base URL")
    args = parser.parse_args()

    global BASE
    if args.base:
        BASE = args.base.rstrip("/") + "/api"

    print("=" * 60)
    print("  EduVerse -- Ripjaws Mock Data Seed Script")
    print("=" * 60)
    print("  Target : ripjaws@gmail.com")
    print("  Base   : {}".format(BASE))
    print("  Force  : {}".format(args.force))

    token = login()
    update_profile(token)
    roadmap = run_onboarding(token)
    enrich(token, roadmap, force_refresh=args.force)

    milestones = roadmap.get("milestones", [])
    total_lessons = sum(len(m["lessons"]) for m in milestones)

    print("\n" + "=" * 60)
    print("  Seed complete!")
    print("  Roadmap ID : {}".format(roadmap["id"]))
    print("  Milestones : {}".format(len(milestones)))
    print("  Lessons    : {}".format(total_lessons))
    print("=" * 60)


if __name__ == "__main__":
    main()
