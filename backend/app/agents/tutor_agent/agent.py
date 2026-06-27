from app.agents.shared.base_agent import BaseAgent
from app.agents.tutor_agent.prompts import TUTOR_SYSTEM_INSTRUCTION, LEVEL_INSTRUCTIONS, STUDY_NOTES_INSTRUCTION
from typing import Generator
import time
import logging

logger = logging.getLogger("eduverse.agents.tutor")

class TutorAgent(BaseAgent):
    def __init__(self, api_key: str = None):
        super().__init__(model_name="gemini-2.5-flash", api_key=api_key)

    def generate_study_notes(self, lesson_title: str, lesson_description: str, difficulty: str) -> str:
        prompt = (
            f"Lesson Title: {lesson_title}\n"
            f"Lesson Description: {lesson_description}\n"
            f"Student Level: {difficulty}\n"
        )
        try:
            return self.generate(prompt, system_instruction=STUDY_NOTES_INSTRUCTION)
        except Exception as e:
            logger.error(f"Failed to generate study notes: {e}")
            return f"# {lesson_title}\\n\\n{lesson_description}\\n\\n*Note: AI note generation fallback.*"

    def chat_stream(self, message: str, history: list[dict], user_goal: str, user_level: str, lesson_context: str = "") -> Generator[str, None, None]:
        from app.agents.shared.base_agent import _should_use_mock, _use_assistant_bridge
        if _should_use_mock(self.api_key):
            try:
                from app.agents.shared.mock_engine import get_tutor_chat_response
                reply = get_tutor_chat_response(message)
                for chunk in [reply[i:i+6] for i in range(0, len(reply), 6)]:
                    time.sleep(0.02)
                    yield chunk
                return
            except Exception as e:
                logger.warning(f"Error in mock tutor chat stream: {e}")

        # Normalize skill level
        level = (user_level or "beginner").lower().strip()
        level_instruction = LEVEL_INSTRUCTIONS.get(level, LEVEL_INSTRUCTIONS["beginner"])

        # Dynamically compile the full system instruction with level parameters
        full_system_instruction = f"{TUTOR_SYSTEM_INSTRUCTION}\n{level_instruction}"

        # Prune conversation history to the last 6 turns (3 Student, 3 AI Tutor messages)
        trimmed_history = history[-6:]
        history_str = ""
        for h in trimmed_history:
            role = "Student" if h['role'] == "user" else "AI Tutor"
            history_str += f"{role}: {h['content']}\n"

        prompt = (
            f"STUDENT LEARNING CONTEXT:\n"
            f"- Primary Learning Goal: {user_goal}\n"
            f"- Student Current Skill Level: {user_level}\n\n"
        )
        if lesson_context:
            prompt += f"ACTIVE LESSON TOPIC CONTEXT:\n{lesson_context}\n\n"

        prompt += (
            f"CONVERSATION HISTORY:\n"
            f"{history_str}\n"
            f"Student: {message}\n"
            f"AI Tutor:"
        )

        # Assistant bridge: generate full reply then stream in chunks
        if _use_assistant_bridge():
            try:
                reply = self.generate(prompt, system_instruction=full_system_instruction)
                for chunk in [reply[i:i+6] for i in range(0, len(reply), 6)]:
                    time.sleep(0.02)
                    yield chunk
                return
            except Exception as e:
                logger.warning(f"Assistant bridge tutor chat failed: {e}")

        if self.client and self.api_key:
            try:
                from google.genai import types
                
                # Configure standard safety parameters and dynamic system instructions
                config = types.GenerateContentConfig(
                    system_instruction=full_system_instruction,
                    safety_settings=[
                        types.SafetySetting(
                            category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                            threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                        ),
                        types.SafetySetting(
                            category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                            threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                        ),
                        types.SafetySetting(
                            category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                            threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                        ),
                        types.SafetySetting(
                            category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                            threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                        ),
                    ]
                )

                response = self.client.models.generate_content_stream(
                    model=self.model_name,
                    contents=prompt,
                    config=config
                )
                
                for chunk in response:
                    try:
                        # Handle potential safety blocks during stream
                        if chunk.candidates and chunk.candidates[0].finish_reason == "SAFETY":
                            yield "I cannot answer this query as it violates safety guidelines. Let's redirect our focus to the active study goals."
                            return
                        if chunk.text:
                            yield chunk.text
                    except ValueError:
                        # Raised if chunk text is blocked or empty
                        yield "I cannot answer this query as it violates safety guidelines. Let's redirect our focus to the active study goals."
                        return
                return
            except Exception as e:
                logger.error(f"Streaming error in TutorAgent: {e}")
                pass

        # Resilient backup typist fallback if offline or failed
        fallback_msg = (
            f"Hello! I am here to help you study. I see you are learning about '{user_goal}' "
            f"at a '{user_level}' level. Let's discuss your question: '{message}'.\n\n"
            f"Here is a quick analogy:\n"
            f"- Think of variables as labeled boxes.\n"
            f"- Functions are like machines that process inputs and yield outputs.\n\n"
            f"What specific part of this concept would you like to cover?"
        )
        for chunk in [fallback_msg[i:i+8] for i in range(0, len(fallback_msg), 8)]:
            time.sleep(0.04)
            yield chunk

