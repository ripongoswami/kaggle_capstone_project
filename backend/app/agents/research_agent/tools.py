"""
Research Agent — Tools Layer
Primary: Tavily Search API
Fallback: Gemini Grounding (Google Search via google-genai)
"""
import logging
import requests
from app.core.config import settings

logger = logging.getLogger("eduverse.agents.research.tools")

# ─────────────────────────────────────────────
# Trusted domain authority bonus list
# ─────────────────────────────────────────────
AUTHORITY_DOMAINS = {
    "docs.python.org": 0.15,
    "developer.mozilla.org": 0.15,
    "reactjs.org": 0.12,
    "react.dev": 0.12,
    "docs.djangoproject.com": 0.12,
    "nodejs.org": 0.12,
    "developer.google.com": 0.12,
    "docs.microsoft.com": 0.10,
    "learn.microsoft.com": 0.10,
    "aws.amazon.com/documentation": 0.10,
    "freecodecamp.org": 0.10,
    "realpython.com": 0.10,
    "roadmap.sh": 0.10,
    "kaggle.com": 0.08,
    "towardsdatascience.com": 0.08,
    "css-tricks.com": 0.08,
    "github.com": 0.05,
}


class TavilySearchTool:
    """
    Calls the Tavily Search API for real-time educational web search.
    Tavily is purpose-built for AI agents — returns clean, structured results.
    """

    BASE_URL = "https://api.tavily.com/search"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.enabled = bool(api_key and api_key.startswith("tvly-"))

    def search(self, query: str, max_results: int = 6, topic: str = "general") -> list[dict]:
        """Search Tavily and return cleaned result list."""
        if not self.enabled:
            logger.warning("Tavily API key not configured or invalid.")
            return []
        try:
            payload = {
                "api_key": self.api_key,
                "query": query,
                "search_depth": "advanced",
                "include_answer": False,
                "include_raw_content": False,
                "max_results": max_results,
                "topic": topic,           # "general" or "news"
            }
            resp = requests.post(self.BASE_URL, json=payload, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            results = []
            for r in data.get("results", []):
                results.append({
                    "title": r.get("title", ""),
                    "url": r.get("url", ""),
                    "description": r.get("content", "")[:300],
                    "score": r.get("score", 0.7),
                })
            logger.info(f"Tavily returned {len(results)} results for: {query!r}")
            return results
        except Exception as e:
            logger.error(f"Tavily search failed: {e}")
            return []


class GeminiGroundingTool:
    """
    Fallback: Uses Gemini's Google Search grounding tool when Tavily fails.
    Gemini Grounding performs a Google Search internally and returns cited results.
    """

    def __init__(self, client, model_name: str = "gemini-2.5-flash"):
        self.client = client
        self.model_name = model_name

    def search(self, query: str) -> list[dict]:
        """Use Gemini with Google Search grounding to find real web results."""
        if not self.client:
            return []
        try:
            from google.genai import types

            # Enable Google Search grounding tool
            config = types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                temperature=0.1,
            )
            prompt = (
                f"Find the top 5 most authoritative and educational resources about: '{query}'\n"
                f"For each resource provide: title, URL, and a brief description of its content.\n"
                f"Focus on official documentation, reputable tutorials, and well-known courses."
            )
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config,
            )
            raw_text = response.text or ""

            # Extract grounding metadata citations if available
            results = []
            try:
                if hasattr(response, "candidates") and response.candidates:
                    candidate = response.candidates[0]
                    if hasattr(candidate, "grounding_metadata") and candidate.grounding_metadata:
                        chunks = candidate.grounding_metadata.grounding_chunks or []
                        for chunk in chunks:
                            if hasattr(chunk, "web") and chunk.web:
                                results.append({
                                    "title": chunk.web.title or "",
                                    "url": chunk.web.uri or "",
                                    "description": "",
                                    "score": 0.8,
                                })
            except Exception:
                pass

            # If grounding chunks not available, parse the text response
            if not results and raw_text:
                # Return the raw text as a single synthetic result so Gemini can re-rank
                results.append({
                    "title": f"AI-Curated Resources: {query}",
                    "url": "",
                    "description": raw_text[:500],
                    "score": 0.75,
                })

            logger.info(f"Gemini Grounding returned {len(results)} results for: {query!r}")
            return results
        except Exception as e:
            logger.error(f"Gemini Grounding search failed: {e}")
            return []


class ResearchToolkit:
    """
    Unified research toolkit with Tavily primary + Gemini Grounding fallback.
    """

    def __init__(self, gemini_client=None, tavily_api_key: str = None):
        self.tavily = TavilySearchTool(api_key=tavily_api_key or settings.TAVILY_API_KEY)
        self.grounding = GeminiGroundingTool(client=gemini_client) if gemini_client else None

    def search(self, query: str, max_results: int = 6) -> list[dict]:
        """
        Search strategy:
        1. Try Tavily (real-time web search, structured for AI agents)
        2. Fallback: Gemini Grounding (Google Search via Gemini)
        3. Final fallback: Return empty list (agent uses pure Gemini knowledge)
        """
        # Primary: Tavily
        results = self.tavily.search(query, max_results=max_results)
        if results:
            return results

        # Fallback: Gemini Grounding
        if self.grounding:
            logger.info(f"Tavily returned no results — falling back to Gemini Grounding for: {query!r}")
            results = self.grounding.search(query)
            if results:
                return results

        logger.warning(f"Both search strategies failed for: {query!r}. Agent will use knowledge only.")
        return []

    def build_candidates_prompt(self, query: str, search_results: list[dict]) -> str:
        """Format search results as context for Gemini ranking."""
        if not search_results:
            return f"No external search results available. Use your training knowledge to suggest resources for: '{query}'"

        lines = [f"Web search results for '{query}':\n"]
        for i, r in enumerate(search_results, 1):
            lines.append(
                f"{i}. TITLE: {r.get('title', 'N/A')}\n"
                f"   URL: {r.get('url', 'N/A')}\n"
                f"   SNIPPET: {r.get('description', 'N/A')[:200]}\n"
            )
        lines.append(
            "\nUsing the above search results as context, generate the final curated resource list. "
            "You may supplement with well-known resources from your knowledge if search results are insufficient."
        )
        return "\n".join(lines)
