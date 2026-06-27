from app.agents.shared.base_agent import BaseAgent
from app.agents.quiz_agent.prompts import QUIZ_GENERATOR_INSTRUCTION
from app.agents.planner_agent.tools import clean_json_response
import logging

logger = logging.getLogger("eduverse.agents.quiz")

class QuizAgent(BaseAgent):
    def __init__(self, api_key: str = None):
        super().__init__(model_name="gemini-2.5-flash", api_key=api_key)

    def generate_quiz(self, lesson_title: str, lesson_description: str, difficulty: str) -> list[dict]:
        # Synthesize a learning objective based on the description
        learning_objective = f"Understand the core concepts of {lesson_title} and apply them practically."
        
        prompt = (
            f"Lesson Title: {lesson_title}\n"
            f"Lesson Description: {lesson_description}\n"
            f"Learning Objectives: {learning_objective}\n"
            f"Difficulty: {difficulty}\n"
        )
        try:
            raw_response = self.generate(prompt, system_instruction=QUIZ_GENERATOR_INSTRUCTION)
            return clean_json_response(raw_response)
        except Exception as e:
            logger.error(f"Failed to generate quiz: {e}")
            # Resilient, dynamic fallback questions based on the title
            return [
                {
                    "question_id": 1,
                    "type": "MCQ",
                    "question": f"Which of the following is a primary feature or benefit of {lesson_title}?",
                    "options": ["It simplifies the underlying complexity", "It is only used in legacy systems", "It prevents code from executing", "It requires no syntax rules"],
                    "correct_option_idx": 0
                },
                {
                    "question_id": 2,
                    "type": "TF",
                    "question": f"True or False: Mastering {lesson_title} is considered an important step in this learning roadmap.",
                    "correct_option_idx": 0
                },
                {
                    "question_id": 3,
                    "type": "SA",
                    "question": f"Briefly explain in your own words what {lesson_title} is and why it's useful."
                }
            ]
