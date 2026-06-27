from pydantic import BaseModel, Field
from typing import List, Optional

class SearchRequest(BaseModel):
    query: str = Field(..., description="The query to search the web for")
    max_results: int = Field(5, description="Maximum number of search results to return")

class SearchItem(BaseModel):
    title: str
    url: str
    content: str
    score: float = 1.0

class SearchResponse(BaseModel):
    results: List[SearchItem]
