import json
import uuid
import logging
import asyncio
from fastapi import APIRouter, Depends, Query, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Dict

from app.core.dependencies import get_current_user
from app.models.user import User

# Import the MCP Servers
from app.mcp.search_server.server import SearchMCPServer
from app.mcp.pdf_server.server import PDFMCPServer
from app.mcp.youtube_server.server import YouTubeMCPServer

logger = logging.getLogger("eduverse.api.mcp")
router = APIRouter(prefix="/mcp", tags=["mcp"])

# Initialize the singletons for the servers
active_servers = {
    "search": SearchMCPServer(),
    "pdf": PDFMCPServer(),
    "youtube": YouTubeMCPServer()
}

# Keep track of SSE connections
# Connection ID -> asyncio.Queue of JSON messages to send to the client
connection_queues: Dict[str, asyncio.Queue] = {}

class ToolCallRequest(BaseModel):
    name: str
    arguments: dict

# ──────────────────────────────────────────────────────────────────────
# REST Endpoints (for internal platform use / direct calls)
# ──────────────────────────────────────────────────────────────────────

@router.get("/servers")
def list_servers(current_user: User = Depends(get_current_user)):
    """List all registered MCP servers."""
    return {"servers": list(active_servers.keys())}

@router.get("/{server_name}/tools")
def list_server_tools(server_name: str, current_user: User = Depends(get_current_user)):
    """List tools exposed by a specific MCP server."""
    if server_name not in active_servers:
        raise HTTPException(status_code=404, detail=f"MCP Server '{server_name}' not found.")
    return {"tools": active_servers[server_name].list_tools()}

@router.post("/{server_name}/call")
async def call_server_tool(
    server_name: str,
    req: ToolCallRequest,
    current_user: User = Depends(get_current_user)
):
    """Directly invoke a tool on a specific MCP server."""
    if server_name not in active_servers:
        raise HTTPException(status_code=404, detail=f"MCP Server '{server_name}' not found.")
    
    server = active_servers[server_name]
    try:
        result = await server.call_tool(req.name, req.arguments)
        return result
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except Exception as e:
        logger.error(f"Error calling tool '{req.name}' on '{server_name}': {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ──────────────────────────────────────────────────────────────────────
# SSE / JSON-RPC Transport Endpoints (Standard Model Context Protocol)
# ──────────────────────────────────────────────────────────────────────

@router.get("/{server_name}/sse")
async def mcp_sse_handshake(server_name: str, request: Request):
    """
    Establish Model Context Protocol SSE transport connection.
    Exposes ready event with endpoint URL parameter for client POSTs.
    """
    if server_name not in active_servers:
        raise HTTPException(status_code=404, detail=f"MCP Server '{server_name}' not found.")

    connection_id = str(uuid.uuid4())
    queue = asyncio.Queue()
    connection_queues[connection_id] = queue

    logger.info(f"New MCP SSE connection '{connection_id}' established for server '{server_name}'")

    async def event_generator():
        try:
            # 1. Send the standard ready event to client containing the target message endpoint
            # In MCP, client posts to this endpoint with query param connection_id
            target_uri = f"/api/mcp/{server_name}/message?connection_id={connection_id}"
            yield f"event: endpoint\ndata: {target_uri}\n\n"

            # 2. Keep the connection open and yield messages pushed to the queue
            while True:
                # Check if client disconnected
                if await request.is_disconnected():
                    break
                
                try:
                    # Wait for a message with a short timeout to handle disconnection gracefully
                    msg = await asyncio.wait_for(queue.get(), timeout=2.0)
                    yield f"event: message\ndata: {json.dumps(msg)}\n\n"
                    queue.task_done()
                except asyncio.TimeoutError:
                    # Just yield a heartbeat keep-alive
                    yield ": keep-alive\n\n"
                    
        finally:
            # Cleanup queue on disconnect
            if connection_id in connection_queues:
                del connection_queues[connection_id]
            logger.info(f"MCP SSE connection '{connection_id}' closed")

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/{server_name}/message")
async def handle_mcp_message(
    server_name: str,
    request: Request,
    connection_id: str = Query(...)
):
    """
    Receive incoming client JSON-RPC messages and push responses back over SSE.
    """
    if server_name not in active_servers:
        raise HTTPException(status_code=404, detail=f"MCP Server '{server_name}' not found.")
    
    if connection_id not in connection_queues:
        raise HTTPException(status_code=400, detail="Invalid or expired connection_id.")
    
    server = active_servers[server_name]
    queue = connection_queues[connection_id]

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body.")

    # Standard JSON-RPC fields
    jsonrpc = body.get("jsonrpc", "2.0")
    msg_id = body.get("id")
    method = body.get("method")
    params = body.get("params", {})

    response = {
        "jsonrpc": jsonrpc,
        "id": msg_id
    }

    try:
        # Standard MCP JSON-RPC routing
        if method == "tools/list":
            response["result"] = {
                "tools": server.list_tools()
            }
        elif method == "tools/call":
            name = params.get("name")
            arguments = params.get("arguments", {})
            
            tool_result = await server.call_tool(name, arguments)
            
            # Wrap response in standard Model Context Protocol content structure
            response["result"] = {
                "content": [
                    {
                        "type": "text",
                        "text": json.dumps(tool_result) if isinstance(tool_result, (dict, list)) else str(tool_result)
                    }
                ]
            }
        else:
            response["error"] = {
                "code": -32601,
                "message": f"Method not found: {method}"
            }
    except PermissionError as pe:
        response["error"] = {
            "code": -32000,
            "message": f"Security permission denied: {pe}"
        }
    except Exception as e:
        logger.error(f"Error handling JSON-RPC message '{method}' on connection '{connection_id}': {e}")
        response["error"] = {
            "code": -32603,
            "message": f"Internal error: {e}"
        }

    # Push the response to the client's SSE event generator stream
    await queue.put(response)
    return {"status": "Accepted"}
