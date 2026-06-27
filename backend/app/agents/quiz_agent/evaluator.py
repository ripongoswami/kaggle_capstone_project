from app.agents.shared.base_agent import BaseAgent
from app.agents.quiz_agent.prompts import EVALUATOR_INSTRUCTION
from app.agents.planner_agent.tools import clean_json_response
import logging

logger = logging.getLogger("eduverse.agents.quiz.evaluator")

class QuizEvaluator(BaseAgent):
    def __init__(self):
        super().__init__(model_name="gemini-2.5-flash")

    def evaluate_short_answer(self, question: str, student_response: str) -> dict:
        prompt = (
            f"Question: {question}\n"
            f"Student Response: {student_response}\n"
        )
        try:
            raw_response = self.generate(prompt, system_instruction=EVALUATOR_INSTRUCTION)
            return clean_json_response(raw_response)
        except Exception as e:
            logger.error(f"Failed to grade short answer: {e}")
            # Fallback grade
            return {
                "score_fraction": 0.5,
                "explanation": "Could not execute AI grading, returning default pass score.",
                "weaknesses": ["conceptual review"]
            }
