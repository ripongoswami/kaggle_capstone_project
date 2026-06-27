from app.agents.shared.base_agent import BaseAgent
from app.agents.planner_agent.prompts import PLANNER_SYSTEM_INSTRUCTION, REVISION_SYSTEM_INSTRUCTION
from app.agents.planner_agent.tools import clean_json_response
import logging

logger = logging.getLogger("eduverse.agents.planner")

class PlannerAgent(BaseAgent):
    def __init__(self, api_key: str = None):
        super().__init__(model_name="gemini-2.5-flash", api_key=api_key)

    def generate_roadmap_data(self, goal: str, skill_level: str, daily_study_time: int) -> dict:
        prompt = (
            f"Generate a customized learning plan for this objective:\n"
            f"Goal: {goal}\n"
            f"Skill level: {skill_level}\n"
            f"Daily study availability: {daily_study_time} minutes.\n"
        )
        
        raw_response = self.generate(prompt, system_instruction=PLANNER_SYSTEM_INSTRUCTION)
        try:
            return clean_json_response(raw_response)
        except Exception:
            # High-resilient fallback template if JSON parsing failed
            return {
                "title": f"Intro to {goal}",
                "milestones": [
                    {
                        "title": "Milestone 1: Fundamentals",
                        "lessons": [
                            {"title": f"Basics of {goal}", "description": "Introductory concepts.", "estimated_time": 30},
                            {"title": f"Intermediate {goal}", "description": "Applying patterns.", "estimated_time": 45}
                        ]
                    }
                ]
            }

    def generate_revision_lessons(self, topic: str, weaknesses: list[str], difficulty: str) -> list[dict]:
        weakness_str = ", ".join(weaknesses)
        prompt = (
            f"Generate remedial sub-lessons because student failed evaluation for topic: '{topic}'.\n"
            f"Weaknesses detected: {weakness_str}\n"
            f"Current course difficulty: {difficulty}"
        )
        raw_response = self.generate(prompt, system_instruction=REVISION_SYSTEM_INSTRUCTION)
        try:
            return clean_json_response(raw_response)
        except Exception:
            return [
                {
                    "title": f"Revision: {topic} Core Functions",
                    "description": f"Review concepts surrounding {weakness_str} to solidify understanding.",
                    "estimated_time": 25
                }
            ]
        
