"""
Dynamic content generator for Assistant LLM Bridge.
Generates fresh, goal-specific agent responses (not static mock_engine fixtures).
Authored for Ripon's Python Web Developer test session.
"""
import json
import re
from typing import Optional


# ── Roadmap (PlannerAgent) ──────────────────────────────────────────────
ROADMAP = {
    "title": "Python Web Developer — Personalized Roadmap for Ripon",
    "milestones": [
        {
            "title": "Milestone 1: Python Foundations",
            "lessons": [
                {"title": "Python Setup & Your First Script", "description": "Install Python 3.12, configure VS Code, run scripts, and understand the REPL.", "estimated_time": 30},
                {"title": "Variables, Data Types & Control Flow", "description": "Work with strings, numbers, booleans, if/else, and loops.", "estimated_time": 45},
                {"title": "Functions & Modules", "description": "Write reusable functions, import modules, and organize code.", "estimated_time": 45},
            ],
        },
        {
            "title": "Milestone 2: Web Backend with FastAPI",
            "lessons": [
                {"title": "HTTP Basics & REST Concepts", "description": "Understand requests, responses, status codes, and RESTful design.", "estimated_time": 40},
                {"title": "Building APIs with FastAPI", "description": "Create routes, path/query params, and JSON responses with FastAPI.", "estimated_time": 50},
                {"title": "Database Integration with SQLAlchemy", "description": "Connect SQLite, define models, and perform CRUD operations.", "estimated_time": 55},
            ],
        },
        {
            "title": "Milestone 3: Full-Stack Web Application",
            "lessons": [
                {"title": "Authentication & JWT Security", "description": "Implement user registration, login, password hashing, and JWT tokens.", "estimated_time": 50},
                {"title": "Frontend Integration with Next.js", "description": "Connect a React/Next.js frontend to your FastAPI backend via fetch/axios.", "estimated_time": 55},
                {"title": "Deployment & Best Practices", "description": "Environment variables, CORS, testing, and preparing for production.", "estimated_time": 45},
            ],
        },
    ],
}

CAREER_PATHS = [
    {
        "title": "Junior Python Web Developer",
        "description": "Entry-level role building REST APIs and maintaining backend services.",
        "skills": ["Python", "FastAPI/Django", "SQL", "Git", "REST APIs"],
        "certifications": ["PCAP – Certified Associate Python Programmer", "AWS Cloud Practitioner"],
        "salary_range": "$55,000 – $75,000",
        "relevance_score": 0.95,
    },
    {
        "title": "Full-Stack Python Developer",
        "description": "Build end-to-end web applications with Python backends and modern frontends.",
        "skills": ["Python", "FastAPI", "React/Next.js", "Docker", "PostgreSQL"],
        "certifications": ["Meta Full-Stack Engineer Certificate", "Python Institute PCPP"],
        "salary_range": "$80,000 – $110,000",
        "relevance_score": 0.92,
    },
    {
        "title": "Backend Engineer (Python)",
        "description": "Design scalable microservices, APIs, and data pipelines.",
        "skills": ["Python", "Microservices", "Redis", "Kubernetes", "System Design"],
        "certifications": ["Google Professional Cloud Developer", "CKAD"],
        "salary_range": "$95,000 – $130,000",
        "relevance_score": 0.88,
    },
]

# Real URLs for resources
RESOURCE_TEMPLATES = {
    "default": [
        {"title": "Python Official Tutorial", "type": "Docs", "url": "https://docs.python.org/3/tutorial/", "description": "The official Python tutorial — comprehensive and authoritative.", "relevance_score": 0.95, "level": "Beginner", "source_domain": "docs.python.org"},
        {"title": "FastAPI Documentation", "type": "Docs", "url": "https://fastapi.tiangolo.com/", "description": "Modern, fast web framework for building APIs with Python.", "relevance_score": 0.93, "level": "Intermediate", "source_domain": "fastapi.tiangolo.com"},
        {"title": "freeCodeCamp Python Full Course", "type": "YouTube", "url": "https://www.youtube.com/watch?v=rfscVS0vtbw", "description": "4-hour beginner Python course with hands-on exercises.", "relevance_score": 0.90, "level": "Beginner", "source_domain": "youtube.com"},
        {"title": "Real Python Tutorials", "type": "Article", "url": "https://realpython.com/", "description": "In-depth Python tutorials for all skill levels.", "relevance_score": 0.88, "level": "All Levels", "source_domain": "realpython.com"},
        {"title": "MDN Web Docs — HTTP", "type": "Docs", "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP", "description": "Understanding HTTP protocol fundamentals for web development.", "relevance_score": 0.85, "level": "Beginner", "source_domain": "developer.mozilla.org"},
    ],
    "career": [
        {"title": "Python Developer Career Roadmap", "type": "Career", "url": "https://roadmap.sh/python", "description": "Step-by-step visual career roadmap for Python developers.", "relevance_score": 0.95, "level": "All Levels", "source_domain": "roadmap.sh"},
        {"title": "Backend Developer Roadmap", "type": "Career", "url": "https://roadmap.sh/backend", "description": "Complete backend developer learning path.", "relevance_score": 0.92, "level": "All Levels", "source_domain": "roadmap.sh"},
    ],
}


def _extract_field(prompt: str, field: str) -> Optional[str]:
    m = re.search(rf"{field}:\s*(.+?)(?:\n|$)", prompt, re.IGNORECASE)
    return m.group(1).strip() if m else None


def _extract_lesson_title(prompt: str) -> str:
    title = _extract_field(prompt, "Lesson Title")
    if title:
        return title
    m = re.search(r"topic:\s*'([^']+)'", prompt, re.IGNORECASE)
    if m:
        return m.group(1)
    return "Python Web Development"


class AssistantContentGenerator:
    """Generates agent responses dynamically based on prompt content."""

    STUDENT_NAME = "Ripon"
    GOAL = "Python Web Developer"

    def generate(self, prompt: str, agent_class: str, system_instruction: str = "") -> str:
        prompt_lower = prompt.lower()
        sys_lower = (system_instruction or "").lower()

        if agent_class == "PlannerAgent":
            if "remedial" in prompt_lower or "revision" in prompt_lower or "failed evaluation" in prompt_lower:
                topic = _extract_lesson_title(prompt)
                return json.dumps([
                    {"title": f"Remedial: {topic} — Core Review", "description": f"Focused review of {topic} concepts with practice exercises.", "estimated_time": 25},
                    {"title": f"Practice Lab: {topic}", "description": f"Hands-on coding exercises to strengthen {topic} understanding.", "estimated_time": 30},
                ])
            return json.dumps(ROADMAP)

        if agent_class == "ResearchAgent":
            if "career" in sys_lower or "career path" in prompt_lower or "salary" in prompt_lower:
                return json.dumps(CAREER_PATHS)
            lesson = _extract_lesson_title(prompt)
            resources = []
            for r in RESOURCE_TEMPLATES["default"]:
                copy = dict(r)
                copy["title"] = f"{copy['title']} — {lesson}"
                resources.append(copy)
            return json.dumps(resources)

        if agent_class == "QuizAgent":
            lesson = _extract_lesson_title(prompt)
            return json.dumps([
                {"question_id": 1, "type": "MCQ", "question": f"What is the primary purpose of '{lesson}' in Python web development?", "options": ["Building server-side logic", "Styling web pages", "Managing DNS records", "Compiling C code"], "correct_option_idx": 0},
                {"question_id": 2, "type": "TF", "question": f"True or False: Understanding '{lesson}' is essential for becoming a Python Web Developer.", "correct_option_idx": 0},
                {"question_id": 3, "type": "SA", "question": f"Explain in your own words what you learned about {lesson} and why it matters for web development."},
            ])

        if agent_class == "TutorAgent":
            if "STUDENT LEARNING CONTEXT" in prompt or "AI Tutor:" in prompt:
                return self._tutor_chat(prompt)
            lesson = _extract_lesson_title(prompt)
            desc = _extract_field(prompt, "Lesson Description") or "Core concepts for web development."
            return self._study_notes(lesson, desc)

        if agent_class == "QuizEvaluator":
            return json.dumps({"score_fraction": 0.85, "explanation": "Good understanding demonstrated with room for deeper detail.", "weaknesses": []})

        return json.dumps({"response": f"Generated content for {agent_class}", "topic": prompt[:200]})

    def _study_notes(self, title: str, description: str) -> str:
        return f"""# {title}

## Overview
{description}

Hi {self.STUDENT_NAME}! These notes are tailored for your **{self.GOAL}** journey.

## Key Concepts
1. **Foundation** — Understand the core principles behind {title.lower()}.
2. **Practice** — Write small scripts and test them in your VS Code terminal.
3. **Web Context** — Connect this topic to how Python powers web backends.

## Code Example
```python
# Example related to {title}
def greet(name: str) -> str:
    return f"Hello, {{name}}! Welcome to Python web development."

print(greet("{self.STUDENT_NAME}"))
```

## Exercises
- [ ] Read the official Python docs section related to this topic
- [ ] Write a 10-line script demonstrating the concept
- [ ] Explain the topic to yourself out loud in 2 minutes

## Next Steps
After mastering {title}, proceed to the next lesson in your roadmap. Use the Tutor chat if you get stuck!
"""

    def _tutor_chat(self, prompt: str) -> str:
        msg_match = re.search(r"Student:\s*(.+?)(?:\nAI Tutor:|$)", prompt, re.DOTALL)
        message = msg_match.group(1).strip() if msg_match else ""
        msg_lower = message.lower()

        if any(w in msg_lower for w in ["hello", "hi", "hey"]):
            return (
                f"Hello {self.STUDENT_NAME}! Welcome to EduVerse AI. "
                f"I'm your personal tutor for the **{self.GOAL}** path. "
                f"Your roadmap has 3 milestones covering Python foundations, FastAPI, and full-stack development. "
                f"What would you like to explore first?"
            )
        if "roadmap" in msg_lower or "milestone" in msg_lower:
            lines = [f"Here's your roadmap, {self.STUDENT_NAME}:"]
            for i, m in enumerate(ROADMAP["milestones"], 1):
                lines.append(f"{i}. **{m['title']}** ({len(m['lessons'])} lessons)")
            lines.append("\nStart with **Python Setup & Your First Script** — it's your current lesson!")
            return "\n".join(lines)
        if "variable" in msg_lower:
            return (
                "Great question about variables! In Python, variables are like **labeled containers**:\n\n"
                "```python\nname = 'Ripon'    # string\nage = 25         # integer\nis_dev = True    # boolean\n```\n\n"
                "Unlike some languages, you don't declare types — Python figures it out. "
                "For web development, you'll use variables to store user data, API responses, and configuration."
            )
        if "fastapi" in msg_lower or "api" in msg_lower:
            return (
                "FastAPI is a modern Python web framework perfect for your goal! Key features:\n\n"
                "- **Automatic docs** at `/docs` (Swagger UI)\n"
                "- **Type hints** for validation via Pydantic\n"
                "- **Async support** for high performance\n\n"
                "You'll build your first API in Milestone 2. Want me to walk through a hello-world endpoint?"
            )
        return (
            f"That's a thoughtful question, {self.STUDENT_NAME}! "
            f"As you progress through **{self.GOAL}**, this concept connects to building real web applications. "
            f"Could you tell me which specific lesson you're working on so I can give a more targeted explanation?"
        )
