"""
Research Agent — Resource Ranking Logic
Scores and filters resources by domain authority, type, and quality signals.
"""
import logging
from urllib.parse import urlparse

logger = logging.getLogger("eduverse.agents.research.ranking")

# Domain authority score bonuses
AUTHORITY_DOMAINS = {
    "docs.python.org": 0.15,
    "developer.mozilla.org": 0.15,
    "react.dev": 0.12,
    "reactjs.org": 0.12,
    "docs.djangoproject.com": 0.12,
    "nodejs.org": 0.12,
    "developer.google.com": 0.12,
    "learn.microsoft.com": 0.10,
    "docs.microsoft.com": 0.10,
    "freecodecamp.org": 0.10,
    "realpython.com": 0.10,
    "roadmap.sh": 0.10,
    "kaggle.com": 0.08,
    "towardsdatascience.com": 0.08,
    "css-tricks.com": 0.08,
    "w3schools.com": 0.05,
    "github.com": 0.05,
}

# Type-weight bonuses
TYPE_WEIGHTS = {
    "Docs": 0.10,
    "Course": 0.08,
    "YouTube": 0.06,
    "Book": 0.05,
    "Article": 0.03,
    "Career": 0.0,
}


class ResourceRanker:
    """
    Post-processes the Gemini-generated resource list:
    1. Validates URLs
    2. Applies domain authority bonuses
    3. Applies content-type bonuses
    4. Deduplicates by domain
    5. Sorts by final relevance_score and caps at max_results
    """

    def __init__(self, max_results: int = 8):
        self.max_results = max_results

    def _get_domain(self, url: str) -> str:
        try:
            return urlparse(url).netloc.lower().replace("www.", "")
        except Exception:
            return ""

    def _is_valid_url(self, url: str) -> bool:
        """Accept only https:// URLs with a non-empty path domain."""
        if not url:
            return False
        if not url.startswith("https://"):
            return False
        domain = self._get_domain(url)
        return bool(domain and "." in domain)

    def _apply_authority_bonus(self, resource: dict) -> float:
        """Add bonus score for trusted domains."""
        domain = self._get_domain(resource.get("url", ""))
        for auth_domain, bonus in AUTHORITY_DOMAINS.items():
            if auth_domain in domain:
                return bonus
        return 0.0

    def _apply_type_bonus(self, resource: dict) -> float:
        """Add bonus score based on content type."""
        rtype = resource.get("type", "Article")
        return TYPE_WEIGHTS.get(rtype, 0.0)

    def _clamp_score(self, score: float) -> float:
        """Keep relevance_score between 0.50 and 1.0."""
        return round(min(1.0, max(0.50, score)), 2)

    def rank(self, resources: list[dict]) -> list[dict]:
        """
        Full ranking pipeline:
        validate → score → deduplicate → sort → cap
        """
        if not resources:
            return []

        # Step 1: Validate URLs
        valid = []
        for r in resources:
            url = r.get("url", "")
            if self._is_valid_url(url):
                valid.append(r)
            else:
                logger.debug(f"Filtered out invalid URL: {url!r}")

        # Step 2: Apply bonuses
        for r in valid:
            base_score = float(r.get("relevance_score", 0.75))
            authority_bonus = self._apply_authority_bonus(r)
            type_bonus = self._apply_type_bonus(r)
            r["relevance_score"] = self._clamp_score(base_score + authority_bonus + type_bonus)
            r["source_domain"] = self._get_domain(r.get("url", ""))

        # Step 3: Deduplicate by domain (keep highest scored per domain)
        seen_domains: dict[str, dict] = {}
        for r in valid:
            domain = r.get("source_domain", "")
            if domain not in seen_domains or r["relevance_score"] > seen_domains[domain]["relevance_score"]:
                seen_domains[domain] = r
        deduped = list(seen_domains.values())

        # Step 4: Sort descending by relevance_score
        deduped.sort(key=lambda x: x["relevance_score"], reverse=True)

        # Step 5: Cap results
        result = deduped[: self.max_results]
        logger.info(f"ResourceRanker: {len(resources)} → {len(valid)} valid → {len(deduped)} deduped → {len(result)} returned")
        return result

    def filter_bad_urls(self, resources: list[dict]) -> list[dict]:
        """Legacy helper — kept for backwards compat."""
        return [r for r in resources if self._is_valid_url(r.get("url", ""))]
