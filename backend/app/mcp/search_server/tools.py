import httpx
import logging
from app.mcp.shared.config import TAVILY_API_KEY, GEMINI_API_KEY
from app.mcp.search_server.schemas import SearchRequest, SearchResponse, SearchItem

logger = logging.getLogger("eduverse.mcp.search")

class TavilySearchTool:
    def __init__(self):
        self.api_url = "https://api.tavily.com/search"
        self.api_key = TAVILY_API_KEY
        self.gemini_client = None
        
        if GEMINI_API_KEY:
            try:
                from google import genai
                self.gemini_client = genai.Client(api_key=GEMINI_API_KEY)
            except Exception as e:
                logger.error(f"Failed to initialize GenAI Client for Search fallback: {e}")

    async def execute_search(self, request: SearchRequest) -> SearchResponse:
        results = []
        
        # 1. Try Tavily search first if api key is configured
        if self.api_key and self.api_key.startswith("tvly-"):
            try:
                payload = {
                    "api_key": self.api_key,
                    "query": request.query,
                    "max_results": request.max_results,
                    "include_answer": False,
                    "include_raw_content": False
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.post(self.api_url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        for item in data.get("results", []):
                            results.append(SearchItem(
                                title=item.get("title", "No Title"),
                                url=item.get("url", ""),
                                content=item.get("content", ""),
                                score=item.get("score", 1.0)
                            ))
                        logger.info(f"Tavily search returned {len(results)} results.")
                        if results:
                            return SearchResponse(results=results)
                    else:
                        logger.error(f"Tavily returned error: {res.status_code} - {res.text}")
            except Exception as e:
                logger.error(f"Error querying Tavily: {e}")

        # 2. Fallback to Gemini Google Search Grounding if Tavily failed or key not present
        if self.gemini_client:
            try:
                logger.info(f"Using Gemini Grounding search fallback for query: '{request.query}'")
                from google.genai import types
                
                # Enable Google Search grounding tool
                config = types.GenerateContentConfig(
                    tools=[types.Tool(google_search=types.GoogleSearch())],
                    temperature=0.1,
                )
                prompt = (
                    f"Find the top {request.max_results} most authoritative and educational resources about: '{request.query}'\n"
                    f"For each resource provide: title, URL, and a brief description of its content.\n"
                    f"Format the response cleanly."
                )
                
                # Run content generation in threadpool or async-friendly way if needed,
                # but since this is an async function in python, we call it directly.
                response = self.gemini_client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                    config=config,
                )
                
                # Extract grounding metadata citations
                try:
                    if hasattr(response, "candidates") and response.candidates:
                        candidate = response.candidates[0]
                        if hasattr(candidate, "grounding_metadata") and candidate.grounding_metadata:
                            chunks = candidate.grounding_metadata.grounding_chunks or []
                            for chunk in chunks:
                                if hasattr(chunk, "web") and chunk.web:
                                    results.append(SearchItem(
                                        title=chunk.web.title or f"Gemini Grounding: {request.query}",
                                        url=chunk.web.uri or "",
                                        content=f"Reference to: {chunk.web.title or request.query}",
                                        score=0.85
                                    ))
                except Exception as ex:
                    logger.error(f"Error parsing grounding metadata: {ex}")
                
                # If grounding metadata was parsed successfully, return it
                if results:
                    # Deduplicate by URL
                    seen_urls = set()
                    unique_results = []
                    for r in results:
                        if r.url and r.url not in seen_urls:
                            seen_urls.add(r.url)
                            unique_results.append(r)
                    logger.info(f"Gemini Grounding returned {len(unique_results)} unique results.")
                    return SearchResponse(results=unique_results[:request.max_results])
                    
                # Synthetic fallback if metadata wasn't available but text was returned
                if response.text:
                    results.append(SearchItem(
                         title=f"AI-Curated Search: {request.query}",
                         url="https://example.com/search-fallback",
                         content=response.text[:500],
                         score=0.75
                    ))
                    return SearchResponse(results=results)
                    
            except Exception as e:
                logger.error(f"Gemini Grounding search fallback failed: {e}")

        # 3. Last fallback: return mock data
        logger.warning("All live search options failed or unconfigured. Returning mock data.")
        mock_items = [
            SearchItem(
                title=f"Mock: Introduction to {request.query}",
                url="https://example.com/mock-intro",
                content=f"This is a simulated search result for '{request.query}'. Please add a TAVILY_API_KEY or GEMINI_API_KEY in the .env file to enable live search results.",
                score=0.95
            ),
            SearchItem(
                title=f"Mock: Comprehensive Guide on {request.query}",
                url="https://example.com/mock-guide",
                content=f"An in-depth simulated guide discussing syntax, frameworks, and practical applications of {request.query}.",
                score=0.88
            )
        ]
        return SearchResponse(results=mock_items)
