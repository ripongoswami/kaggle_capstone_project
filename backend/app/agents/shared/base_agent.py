import logging
from app.core.config import settings

logger = logging.getLogger("eduverse.agents.base")


def _should_use_mock(api_key: str = None) -> bool:
    if settings.ASSISTANT_LLM_BRIDGE:
        return False
    if settings.USE_MOCK_AGENTS:
        return True
    effective_key = api_key or settings.GEMINI_API_KEY
    return not bool(effective_key)


def _use_assistant_bridge() -> bool:
    return bool(settings.ASSISTANT_LLM_BRIDGE)


class BaseAgent:
    def __init__(self, model_name: str = "gemini-2.5-flash", api_key: str = None):
        self.model_name = model_name
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.client = None

        if _use_assistant_bridge():
            logger.info(f"Agent '{self.__class__.__name__}' using Assistant LLM Bridge (Gemini available as fallback).")
        if self.api_key and not settings.USE_MOCK_AGENTS:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Failed to initialize GenAI Client for model '{model_name}': {e}")
        elif not self.api_key and not _use_assistant_bridge():
            logger.warning(
                f"GEMINI_API_KEY is not set. Agent '{self.__class__.__name__}' will operate in mock fallback mode."
            )

    def generate(self, prompt: str, system_instruction: str = None) -> str:
        if _use_assistant_bridge():
            try:
                from app.agents.shared.assistant_bridge import call_assistant_bridge
                return call_assistant_bridge(prompt, self.__class__.__name__, system_instruction)
            except Exception as e:
                logger.error(f"Assistant bridge failed in {self.__class__.__name__}: {e}. Falling back to Gemini/mock.")

        if _should_use_mock(self.api_key):
            try:
                from app.agents.shared.mock_engine import get_mock_response
                mock_res = get_mock_response(prompt, self.__class__.__name__, system_instruction)
                if mock_res is not None:
                    return mock_res
            except Exception as e:
                logger.warning(f"Error loading mock response: {e}")

        if not self.client:
            return self._fallback_response(prompt)

        import time
        max_retries = 4
        backoff = 1.0
        for attempt in range(max_retries):
            try:
                from google.genai import types
                config = None
                if system_instruction:
                    config = types.GenerateContentConfig(
                        system_instruction=system_instruction
                    )
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=config
                )
                return response.text
            except Exception as e:
                logger.warning(
                    f"Gemini API error in {self.__class__.__name__} (attempt {attempt + 1}/{max_retries}): {e}"
                )
                if attempt == max_retries - 1:
                    logger.error(f"Gemini API failed after {max_retries} attempts in {self.__class__.__name__}: {e}")
                    return self._fallback_response(prompt)
                time.sleep(backoff)
                backoff *= 2.0

    def _fallback_response(self, prompt: str) -> str:
        return (
            f"Mock response from {self.__class__.__name__} since Gemini API is unconfigured or failed. "
            f"Query: {prompt[:40]}..."
        )
