from sqlalchemy.orm import Session
from app.schemas.resource import ResourceSearchResponse, ResourceItem
import logging

logger = logging.getLogger("eduverse")

CACHE_FILE = "research_cache.json"


def _clear_research_file_cache(normalized_query: str, intent: str) -> None:
    """Remove matching entries from the on-disk research agent cache."""
    import os
    import json
    if not os.path.exists(CACHE_FILE):
        return
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            cache_data = json.load(f)
        prefix = f"{intent}::"
        keys_to_remove = [
            k for k in cache_data
            if k.startswith(prefix) and normalized_query in k.lower()
        ]
        if keys_to_remove:
            for k in keys_to_remove:
                cache_data.pop(k, None)
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(cache_data, f, indent=2)
    except Exception as e:
        logger.warning(f"Could not clear research file cache: {e}")

# Fallback resource templates per intent
FALLBACK_TEMPLATES = {
    "resources": lambda q: [
        ResourceItem(
            title=f"{q} — YouTube Tutorials",
            type="YouTube",
            url=f"https://www.youtube.com/results?search_query={q.replace(' ', '+')}+tutorial",
            description=f"Search freeCodeCamp, Traversy Media, and Fireship for {q} video tutorials.",
            relevance_score=0.82,
            level="All Levels",
            source_domain="youtube.com",
        ),
        ResourceItem(
            title=f"{q} — Wikipedia Overview",
            type="Article",
            url=f"https://en.wikipedia.org/wiki/{q.replace(' ', '_')}",
            description=f"Background reading and conceptual overview of {q}.",
            relevance_score=0.70,
            level="Beginner",
            source_domain="wikipedia.org",
        ),
    ],
    "docs": lambda q: [
        ResourceItem(
            title=f"{q} — Official Documentation",
            url=f"https://developer.mozilla.org/en-US/search?q={q.replace(' ', '+')}",
            type="Docs",
            description=f"Search MDN Web Docs for official reference material on {q}.",
            relevance_score=0.85,
            level="All Levels",
            source_domain="developer.mozilla.org",
        ),
    ],
    "courses": lambda q: [
        ResourceItem(
            title=f"Learn {q} — freeCodeCamp",
            type="Course",
            url=f"https://www.freecodecamp.org/news/search/?query={q.replace(' ', '+')}",
            description=f"Free structured course content covering {q} on freeCodeCamp.",
            relevance_score=0.85,
            level="Beginner",
            author="freeCodeCamp",
            source_domain="freecodecamp.org",
        ),
        ResourceItem(
            title=f"{q} Courses — Coursera",
            type="Course",
            url=f"https://www.coursera.org/search?query={q.replace(' ', '+')}",
            description=f"Browse university-level courses on {q} from Coursera.",
            relevance_score=0.78,
            level="All Levels",
            author="Coursera",
            source_domain="coursera.org",
        ),
    ],
    "books": lambda q: [
        ResourceItem(
            title=f"Best Books for {q}",
            type="Book",
            url=f"https://www.amazon.com/s?k={q.replace(' ', '+')}+programming+book",
            description=f"Discover highly rated programming books on {q} at Amazon.",
            relevance_score=0.72,
            level="All Levels",
            source_domain="amazon.com",
        ),
    ],
    "career": lambda q: [
        ResourceItem(
            title=f"{q} Developer Career Roadmap",
            type="Career",
            url=f"https://roadmap.sh/{q.lower().replace(' ', '-')}",
            description=f"Step-by-step visual career roadmap for becoming a {q} developer.",
            relevance_score=0.90,
            level="All Levels",
            source_domain="roadmap.sh",
        ),
        ResourceItem(
            title=f"{q} Jobs — LinkedIn",
            type="Career",
            url=f"https://www.linkedin.com/jobs/search/?keywords={q.replace(' ', '+')}",
            description=f"Browse current {q} job listings and required skills on LinkedIn.",
            relevance_score=0.80,
            level="All Levels",
            source_domain="linkedin.com",
        ),
    ],
}


class ResourceService:
    def __init__(self, db: Session):
        self.db = db

    def search_resources(
        self,
        query: str,
        intent: str = "resources",
        user = None,
        limit: int = 20,
        offset: int = 0,
        force_refresh: bool = False,
    ) -> ResourceSearchResponse:
        from app.models.resource import Resource
        normalized_query = query.strip().lower()

        # 1. Handle force refresh
        if force_refresh:
            try:
                self.db.query(Resource).filter(
                    Resource.search_query == normalized_query,
                    Resource.intent == intent
                ).delete()
                self.db.commit()
                _clear_research_file_cache(normalized_query, intent)
            except Exception as e:
                logger.error(f"Error deleting cached resources on force refresh: {e}")
                self.db.rollback()

        # 2. Check database cache
        db_resources = []
        try:
            db_resources = self.db.query(Resource).filter(
                Resource.search_query == normalized_query,
                Resource.intent == intent
            ).order_by(Resource.relevance_score.desc()).all()
        except Exception as e:
            logger.error(f"Error querying resource cache from DB: {e}")

        # 3. If cache miss, generate resources
        if not db_resources:
            results_data = []
            try:
                from app.agents.research_agent.agent import ResearchAgent
                gemini_key = user.gemini_api_key if user else None
                tavily_key = user.tavily_api_key if user else None
                
                researcher = ResearchAgent(gemini_api_key=gemini_key, tavily_api_key=tavily_key, max_results=30)
                results_data = researcher.search(query=query, intent=intent)
            except Exception as e:
                logger.error(f"ResearchAgent [{intent}] failed for '{query}': {e}. Using fallback.")
                fallback_fn = FALLBACK_TEMPLATES.get(intent, FALLBACK_TEMPLATES["resources"])
                fallback_items = fallback_fn(query)
                results_data = [item.dict() for item in fallback_items]

            if not results_data:
                logger.warning(f"ResearchAgent [{intent}] returned empty for '{query}'. Using fallback templates.")
                fallback_fn = FALLBACK_TEMPLATES.get(intent, FALLBACK_TEMPLATES["resources"])
                fallback_items = fallback_fn(query)
                results_data = [item.dict() for item in fallback_items]

            # Cache to database
            try:
                db_items = []
                for res in results_data:
                    db_item = Resource(
                        title=res.get("title", "Untitled Resource"),
                        type=res.get("type", "Article"),
                        url=res.get("url", ""),
                        description=res.get("description", ""),
                        relevance_score=float(res.get("relevance_score", 0.75)),
                        search_query=normalized_query,
                        intent=intent,
                        author=res.get("author"),
                        level=res.get("level"),
                        duration=res.get("duration"),
                        source_domain=res.get("source_domain"),
                    )
                    db_items.append(db_item)
                if db_items:
                    self.db.add_all(db_items)
                    self.db.commit()
                    
                # Re-query to get clean instances and correct ordering
                db_resources = self.db.query(Resource).filter(
                    Resource.search_query == normalized_query,
                    Resource.intent == intent
                ).order_by(Resource.relevance_score.desc()).all()
            except Exception as e:
                logger.error(f"Error caching generated resources to DB: {e}")
                self.db.rollback()
                # Fallback to in-memory items mapping if DB save completely failed
                db_resources = []
                for res in results_data:
                    db_resources.append(Resource(
                        title=res.get("title", "Untitled Resource"),
                        type=res.get("type", "Article"),
                        url=res.get("url", ""),
                        description=res.get("description", ""),
                        relevance_score=float(res.get("relevance_score", 0.75)),
                        search_query=normalized_query,
                        intent=intent,
                        author=res.get("author"),
                        level=res.get("level"),
                        duration=res.get("duration"),
                        source_domain=res.get("source_domain"),
                    ))

        # 4. Slicing and mapping to response models
        sliced = db_resources[offset : offset + limit]
        results = [
            ResourceItem(
                title=r.title,
                type=r.type,
                url=r.url,
                description=r.description or "",
                relevance_score=r.relevance_score or 1.0,
                author=r.author,
                level=r.level,
                duration=r.duration,
                source_domain=r.source_domain,
            ) for r in sliced
        ]

        return ResourceSearchResponse(query=query, intent=intent, resources=results)
