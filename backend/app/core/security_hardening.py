import html
import re
import logging
from fastapi import HTTPException, status, Depends
from typing import Callable
from app.core.dependencies import get_current_user
from app.models.user import User

logger = logging.getLogger("eduverse.app.core.security_hardening")

# Common prompt injection / jailbreak patterns
PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(?:previous|above|all)\s+instructions",
    r"system\s+(?:override|directive|prompt)",
    r"bypass\s+(?:system|guidelines|safety)",
    r"forget\s+(?:your\s+rules|who\s+you\s+are)",
    r"you\s+must\s+now\s+act\s+as",
    r"jailbreak",
    r"roleplay\s+as",
    r"dan\s+mode",
    r"do\s+anything\s+now",
    r"override\s+directives",
    r"ignore\s+safety\s+filters"
]

def sanitize_input_text(text: str) -> str:
    """
    Sanitize text input to prevent HTML/XSS injection.
    Escapes script tags and HTML markup characters.
    """
    if not text:
        return ""
    # Strip any potential scripts or dangerous tags
    clean_text = html.escape(text.strip())
    # Strip dangerous iframe and script tags entirely just in case
    clean_text = re.sub(r"&lt;script.*?&gt;.*?&lt;/script&gt;", "", clean_text, flags=re.IGNORECASE)
    clean_text = re.sub(r"&lt;iframe.*?&gt;.*?&lt;/iframe&gt;", "", clean_text, flags=re.IGNORECASE)
    return clean_text

def check_prompt_injection(text: str) -> bool:
    """
    Scans a given text prompt for signatures of LLM prompt injection or jailbreak attempts.
    Returns True if an injection attempt is detected.
    """
    if not text:
        return False
    
    normalized_text = text.lower().strip()
    
    # Check regex patterns
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, normalized_text):
            logger.warning(f"Prompt injection pattern detected: '{pattern}' in text: {text[:100]}...")
            return True
            
    return False

def requires_role(allowed_roles: list[str]) -> Callable:
    """
    Dependency to enforce Role-Based Access Control (RBAC).
    Checks that the current authenticated user has an allowed role.
    """
    def dependency(current_user: User = Depends(get_current_user)):
        # If User model doesn't have role attribute yet, allow everything for compatibility
        user_role = getattr(current_user, "role", "student") or "student"
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Requires one of roles {allowed_roles}"
            )
        return current_user
    return dependency
