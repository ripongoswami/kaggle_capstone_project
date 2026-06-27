"""HTTP client for the local Assistant LLM Bridge (port 9999)."""
import logging
import requests
from app.core.config import settings

logger = logging.getLogger("eduverse.agents.assistant_bridge")


def call_assistant_bridge(prompt: str, agent_class: str, system_instruction: str = None) -> str:
    url = f"{settings.ASSISTANT_LLM_BRIDGE_URL.rstrip('/')}/v1/generate"
    payload = {
        "prompt": prompt,
        "system_instruction": system_instruction or "",
        "agent_class": agent_class,
    }
    try:
        resp = requests.post(url, json=payload, timeout=600)
        resp.raise_for_status()
        data = resp.json()
        text = data.get("text", "")
        if not text:
            raise ValueError("Bridge returned empty text")
        return text
    except Exception as e:
        logger.error(f"Assistant bridge call failed for {agent_class}: {e}")
        raise
