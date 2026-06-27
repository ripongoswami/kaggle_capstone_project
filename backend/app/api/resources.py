from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.schemas.resource import ResourceSearchResponse
from app.services.resource_service import ResourceService
from app.models.user import User
from app.core.security_hardening import check_prompt_injection, sanitize_input_text
from typing import Literal

router = APIRouter(prefix="/resources", tags=["resources"])

VALID_INTENTS = ["resources", "docs", "courses", "books", "career"]

@router.get("/search", response_model=ResourceSearchResponse)
def search_resources(
    query: str = Query(..., min_length=2, description="Search query"),
    intent: str = Query(default="resources", description="One of: resources | docs | courses | books | career"),
    limit: int = Query(default=20, description="Limit results"),
    offset: int = Query(default=0, description="Offset results"),
    force_refresh: bool = Query(default=False, description="Force regeneration by bypassing cache"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Search educational resources using the Research Agent with security filters.
    """
    # 1. Prompt Injection Protection
    if check_prompt_injection(query):
        raise HTTPException(
            status_code=400,
            detail="Potential prompt injection or jailbreak attempt detected."
        )
        
    # 2. XSS Input Sanitization
    query = sanitize_input_text(query)

    if intent not in VALID_INTENTS:
        intent = "resources"
        
    resource_service = ResourceService(db)
    return resource_service.search_resources(
        query=query,
        intent=intent,
        user=current_user,
        limit=limit,
        offset=offset,
        force_refresh=force_refresh
    )
