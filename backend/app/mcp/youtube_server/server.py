import os
from app.mcp.youtube_server.search import YouTubeSearch
from app.mcp.youtube_server.ranking import VideoRanker

class YouTubeMCPServer:
    def __init__(self):
        # Load YouTube API key from environment variable
        api_key = os.environ.get("YOUTUBE_API_KEY", "")
        self.searcher = YouTubeSearch(api_key=api_key)
        self.ranker = VideoRanker()

    async def call_tool(self, name: str, arguments: dict) -> dict:
        if name == "youtube_search":
            query = arguments.get("query", "")
            max_duration = arguments.get("max_duration_minutes", 30)
            
            videos = await self.searcher.search_videos(query)
            ranked_videos = self.ranker.rank_videos(videos, max_duration)
            return {"videos": ranked_videos}
        else:
            raise ValueError(f"Unknown tool name: {name}")

    def list_tools(self) -> list[dict]:
        return [
            {
                "name": "youtube_search",
                "description": "Searches for relevant, educational YouTube videos based on study topics and filters them by duration.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The educational topic to search for"
                        },
                        "max_duration_minutes": {
                            "type": "integer",
                            "description": "Maximum video duration allowed in minutes (default is 30)"
                        }
                    },
                    "required": ["query"]
                }
            }
        ]

class_name = "YouTubeMCPServer"
