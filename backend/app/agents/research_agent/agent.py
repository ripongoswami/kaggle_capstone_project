"""
Research Agent — Core ADK Implementation
Uses Google GenAI SDK (google-genai) with:
  - Tavily Search API (primary web search)
  - Gemini Grounding (Google Search fallback)
  - 5 domain-specific responsibilities
"""
import logging
import json
from app.agents.shared.base_agent import BaseAgent
from app.agents.research_agent.prompts import (
    RESOURCES_INSTRUCTION,
    DOCS_INSTRUCTION,
    COURSES_INSTRUCTION,
    BOOKS_INSTRUCTION,
    CAREER_INSTRUCTION,
)
from app.agents.research_agent.tools import ResearchToolkit
from app.agents.research_agent.ranking import ResourceRanker
from app.agents.planner_agent.tools import clean_json_response

logger = logging.getLogger("eduverse.agents.research")

# Intent → system instruction mapping
INTENT_INSTRUCTIONS = {
    "resources": RESOURCES_INSTRUCTION,
    "docs":      DOCS_INSTRUCTION,
    "courses":   COURSES_INSTRUCTION,
    "books":     BOOKS_INSTRUCTION,
    "career":    CAREER_INSTRUCTION,
}


class ResearchAgent(BaseAgent):
    """
    Research Agent powered by Google GenAI (gemini-2.5-flash).
    
    Responsibilities:
        1. find_resources()      — Educational articles + YouTube videos
        2. find_documentation()  — Official language/framework docs
        3. find_courses()        — Structured online courses
        4. recommend_books()     — Curated book recommendations
        5. suggest_career_paths()— Career roadmap with roles and salary
    """

    def __init__(self, gemini_api_key: str = None, tavily_api_key: str = None, max_results: int = 8):
        super().__init__(model_name="gemini-2.5-flash", api_key=gemini_api_key)
        # Pass Gemini client to toolkit for Grounding fallback
        self.toolkit = ResearchToolkit(gemini_client=self.client, tavily_api_key=tavily_api_key)
        self.ranker = ResourceRanker(max_results=max_results)
        self.max_results = max_results

    # ─────────────────────────────────────────────
    # UNIFIED SEARCH METHOD (used by API layer)
    # ─────────────────────────────────────────────
    def search(self, query: str, intent: str = "resources") -> list[dict]:
        """
        Route to the appropriate domain method based on intent.
        Valid intents: resources | docs | courses | books | career
        """
        intent = (intent or "resources").lower().strip()
        method_map = {
            "resources": self.find_resources,
            "docs":      self.find_documentation,
            "courses":   self.find_courses,
            "books":     self.recommend_books,
            "career":    self.suggest_career_paths,
        }
        method = method_map.get(intent, self.find_resources)
        return method(query)

    # ─────────────────────────────────────────────
    # INTERNAL: Core generate + rank pipeline
    # ─────────────────────────────────────────────
    def _generate_and_rank(self, query: str, intent: str, search_query: str = None, skill_level: str = "Beginner") -> list[dict]:
        """
        1. Search Tavily (or Gemini Grounding fallback)
        2. Build context prompt from results
        3. Ask Gemini to generate curated JSON resource list
        4. Run ResourceRanker on output
        """
        system_instruction = INTENT_INSTRUCTIONS.get(intent, RESOURCES_INSTRUCTION)
        effective_query = search_query or query
        
        # Local Caching Implementation
        import os
        cache_file = "research_cache.json"
        cache_key = f"{intent}::{effective_query}::{skill_level}"
        try:
            if os.path.exists(cache_file):
                with open(cache_file, "r", encoding="utf-8") as f:
                    cache_data = json.load(f)
                    if cache_key in cache_data and cache_data[cache_key]:
                        logger.info(f"[{intent}] Cache hit for: {cache_key}")
                        return cache_data[cache_key]
        except Exception as e:
            logger.warning(f"Cache read error: {e}")

        # Mock gating — return demo resources when mock mode is active
        from app.agents.shared.base_agent import _should_use_mock
        if _should_use_mock(self.api_key):
            try:
                from app.agents.shared.mock_engine import get_mock_response
                mock_res = get_mock_response(query, self.__class__.__name__, system_instruction)
                if mock_res is not None:
                    resources = json.loads(mock_res)
                    if isinstance(resources, dict):
                        resources = resources.get("resources", [resources])
                    if resources:
                        return self.ranker.rank(resources)
            except Exception as e:
                logger.warning(f"Error loading mock resources in ResearchAgent: {e}")

        # Step 1: Web search (Tavily → Gemini Grounding → knowledge only)
        search_results = self.toolkit.search(effective_query, max_results=max(self.max_results + 5, 25))

        # Step 2: Build prompt with search context
        context = self.toolkit.build_candidates_prompt(effective_query, search_results)
        extra_inst = ""
        if self.max_results > 8:
            extra_inst = f"\nIMPORTANT: Ignore any rules about returning only 5-8 results. You MUST return at least {self.max_results} results in the JSON array."
        full_prompt = (
            f"Student Query: {query}\n"
            f"Student Skill Level: {skill_level} (ensure resources are appropriate for this level)\n\n"
            f"Search Context:\n{context}\n\n"
            f"Now generate the final curated resource list as a JSON array.{extra_inst}"
        )

        # Step 3: Generate via Assistant Bridge or Gemini
        from app.agents.shared.base_agent import _use_assistant_bridge
        raw_text = None
        if _use_assistant_bridge():
            try:
                raw_text = self.generate(full_prompt, system_instruction=system_instruction)
            except Exception as e:
                logger.error(f"Assistant bridge failed for [{intent}] query '{query}': {e}")
        elif self.client:
            try:
                from google.genai import types
                config = types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    safety_settings=[
                        types.SafetySetting(
                            category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                            threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                        ),
                        types.SafetySetting(
                            category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                            threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                        ),
                    ],
                    temperature=0.2,
                )
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=full_prompt,
                    config=config,
                )
                raw_text = response.text or ""
            except Exception as e:
                logger.error(f"Gemini generation failed for [{intent}] query '{query}': {e}")

        if raw_text:
            try:
                resources = clean_json_response(raw_text)
                if isinstance(resources, dict):
                    resources = resources.get("resources", [resources])
                if resources:
                    ranked = self.ranker.rank(resources)
                    logger.info(f"[{intent}] Generated {len(ranked)} ranked resources for: {query!r}")
                    try:
                        cache_data = {}
                        if os.path.exists(cache_file):
                            with open(cache_file, "r", encoding="utf-8") as f:
                                cache_data = json.load(f)
                        cache_data[cache_key] = ranked
                        with open(cache_file, "w", encoding="utf-8") as f:
                            json.dump(cache_data, f, indent=2)
                    except Exception as e:
                        logger.warning(f"Cache write error: {e}")
                    return ranked
            except Exception as e:
                logger.error(f"Failed to parse resources for [{intent}]: {e}")

        # Step 4: Fallback — return search results directly if generation failed
        ranked = self._fallback_resources(query, intent, search_results)
        if ranked:
            return ranked
        return self._mock_resources_last_resort(query, system_instruction)

    def _mock_resources_last_resort(self, query: str, system_instruction: str) -> list[dict]:
        """Return mock resources when live search and Tavily fallback both fail."""
        try:
            from app.agents.shared.mock_engine import get_mock_response
            mock_res = get_mock_response(query, self.__class__.__name__, system_instruction)
            if mock_res is not None:
                resources = json.loads(mock_res)
                if isinstance(resources, dict):
                    resources = resources.get("resources", [resources])
                if resources:
                    return self.ranker.rank(resources)
        except Exception as e:
            logger.warning(f"Mock resource last-resort failed: {e}")
        return []

    def _fallback_resources(self, query: str, intent: str, search_results: list[dict]) -> list[dict]:
        """Build basic resource cards from Tavily results when Gemini fails."""
        type_map = {
            "docs": "Docs",
            "courses": "Course",
            "books": "Book",
            "career": "Career",
        }
        rtype = type_map.get(intent, "Article")
        fallback = []
        for r in search_results[: self.max_results]:
            if r.get("url", "").startswith("https://"):
                fallback.append({
                    "title": r.get("title", f"Resource for {query}"),
                    "type": rtype,
                    "url": r["url"],
                    "description": r.get("description", ""),
                    "relevance_score": round(r.get("score", 0.7), 2),
                    "level": "All Levels",
                })
        return self.ranker.rank(fallback) if fallback else []

    # ─────────────────────────────────────────────
    # RESPONSIBILITY 1: Educational Resources
    # ─────────────────────────────────────────────
    def find_resources(self, query: str, skill_level: str = "Beginner") -> list[dict]:
        """Find educational articles and YouTube tutorials."""
        logger.info(f"Finding resources for: {query!r} at {skill_level} level")
        return self._generate_and_rank(
            query=query,
            intent="resources",
            search_query=f"{query} tutorial video article",
            skill_level=skill_level
        )

    # ─────────────────────────────────────────────
    # RESPONSIBILITY 2: Official Documentation
    # ─────────────────────────────────────────────
    def find_documentation(self, query: str, skill_level: str = "Beginner") -> list[dict]:
        """Find official documentation and reference guides."""
        logger.info(f"Finding documentation for: {query!r} at {skill_level} level")
        return self._generate_and_rank(
            query=query,
            intent="docs",
            search_query=f"{query} official documentation reference guide",
            skill_level=skill_level
        )

    # ─────────────────────────────────────────────
    # RESPONSIBILITY 3: Online Courses
    # ─────────────────────────────────────────────
    def find_courses(self, query: str, skill_level: str = "Beginner") -> list[dict]:
        """Find structured online courses."""
        logger.info(f"Finding courses for: {query!r} at {skill_level} level")
        return self._generate_and_rank(
            query=query,
            intent="courses",
            search_query=f"{query} online course tutorial freeCodeCamp Coursera Udemy",
            skill_level=skill_level
        )

    # ─────────────────────────────────────────────
    # RESPONSIBILITY 4: Book Recommendations
    # ─────────────────────────────────────────────
    def recommend_books(self, query: str, skill_level: str = "Beginner") -> list[dict]:
        """Recommend books for the given topic."""
        logger.info(f"Recommending books for: {query!r} at {skill_level} level")
        return self._generate_and_rank(
            query=query,
            intent="books",
            search_query=f"best books to learn {query} programming",
            skill_level=skill_level
        )

    # ─────────────────────────────────────────────
    # RESPONSIBILITY 5: Career Paths
    # ─────────────────────────────────────────────
    def suggest_career_paths(self, query: str, skill_level: str = "Beginner") -> list[dict]:
        """Generate a career path roadmap for a goal or technology."""
        logger.info(f"Suggesting career paths for: {query!r} at {skill_level} level")
        return self._generate_and_rank(
            query=query,
            intent="career",
            search_query=f"{query} developer career path job roles salary roadmap",
            skill_level=skill_level
        )
