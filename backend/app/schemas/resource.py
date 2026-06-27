from pydantic import BaseModel
from typing import List, Optional

class ResourceItem(BaseModel):
    title: str
    type: str                          # 'YouTube' | 'Article' | 'Course' | 'Book' | 'Docs' | 'Career'
    url: str
    description: Optional[str] = None
    relevance_score: float = 1.0
    author: Optional[str] = None       # Author, instructor, or platform name
    level: Optional[str] = None        # 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels'
    duration: Optional[str] = None     # e.g. '20 min read', '12 hour course'
    source_domain: Optional[str] = None

class ResourceSearchResponse(BaseModel):
    query: str
    intent: str = "resources"
    resources: List[ResourceItem]
