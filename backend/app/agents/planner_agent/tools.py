import json
import logging

logger = logging.getLogger("eduverse.agents.planner.tools")

def clean_json_response(raw_text: str) -> dict:
    """
    Cleans up any markdown wrappers or surrounding text from Gemini to return a clean json object.
    """
    cleaned = raw_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()
    try:
        return json.loads(cleaned)
    except Exception as e:
        logger.error(f"Failed to parse JSON response: {e}. Raw content was: {raw_text}")
        raise e
