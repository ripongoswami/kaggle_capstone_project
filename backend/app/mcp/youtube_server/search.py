import httpx
import urllib.parse
import logging
from typing import List, Dict

logger = logging.getLogger("eduverse.mcp.youtube.search")

class YouTubeSearch:
    def __init__(self, api_key: str = ""):
        self.api_key = api_key

    async def search_videos(self, query: str) -> List[dict]:
        # Return mock results if no API key is available
        if not self.api_key:
            logger.info("No YouTube API key provided. Returning mock results.")
            query_esc = urllib.parse.quote_plus(query)
            return [
                {
                    "title": f"Introduction to {query} - Crash Course",
                    "video_id": "dQw4w9WgXcQ",
                    "url": f"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    "duration_seconds": 645,
                    "duration": "10:45",
                    "description": f"An educational crash course discussing all major foundations of {query}."
                },
                {
                    "title": f"Mastering {query} in 15 Minutes",
                    "video_id": "yPYZpwSpKmA",
                    "url": f"https://www.youtube.com/watch?v=yPYZpwSpKmA",
                    "duration_seconds": 900,
                    "duration": "15:00",
                    "description": f"Learn variables, expressions, and structures of {query} in this fast paced guide."
                },
                {
                    "title": f"Advanced {query} - Deep Dive Tutorial",
                    "video_id": "3JZ_D3KntHM",
                    "url": f"https://www.youtube.com/watch?v=3JZ_D3KntHM",
                    "duration_seconds": 2400,
                    "duration": "40:00",
                    "description": f"Professional review of design choices, patterns, and optimization scripts for {query}."
                }
            ]

        # Call YouTube Data API v3
        try:
            url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&q={urllib.parse.quote(query)}&type=video&maxResults=5&key={self.api_key}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    videos = []
                    for item in data.get("items", []):
                        snippet = item.get("snippet", {})
                        video_id = item.get("id", {}).get("videoId", "")
                        videos.append({
                            "title": snippet.get("title", ""),
                            "video_id": video_id,
                            "url": f"https://www.youtube.com/watch?v={video_id}",
                            "duration_seconds": 600, # default average duration if not fetching details
                            "duration": "10:00",
                            "description": snippet.get("description", "")
                        })
                    return videos
                else:
                    logger.error(f"YouTube API error: {res.status_code} - {res.text}")
        except Exception as e:
            logger.error(f"YouTube search request failed: {e}")

        return []
