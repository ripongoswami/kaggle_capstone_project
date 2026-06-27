from app.mcp.search_server.tools import TavilySearchTool
from app.mcp.search_server.schemas import SearchRequest, SearchResponse

class SearchMCPServer:
    def __init__(self):
        self.tool = TavilySearchTool()

    async def call_tool(self, name: str, arguments: dict) -> dict:
        if name == "web_search":
            req = SearchRequest(**arguments)
            res: SearchResponse = await self.tool.execute_search(req)
            return res.model_dump()
        else:
            raise ValueError(f"Unknown tool name: {name}")

    def list_tools(self) -> list[dict]:
        return [
            {
                "name": "web_search",
                "description": "Performs a real-time semantic web search for details on topics, programming languages, and resources.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "The search keywords or question"
                        },
                        "max_results": {
                            "type": "integer",
                            "description": "Maximum number of results to fetch"
                        }
                    },
                    "required": ["query"]
                }
            }
        ]
class_name = "SearchMCPServer"
