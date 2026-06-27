import time
import logging
from collections import defaultdict
from fastapi import Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("eduverse.middleware.security")

class RateLimitingMiddleware(BaseHTTPMiddleware):
    """
    Sliding window rate-limiter based on client IP.
    Default: 100 requests per 60 seconds per IP.
    """
    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # Maps IP address -> list of request timestamps
        self.requests = defaultdict(list)

    async def dispatch(self, request: Request, call_next) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        
        # Filter out timestamps older than the sliding window
        active_timestamps = [t for t in self.requests[client_ip] if now - t < self.window_seconds]
        self.requests[client_ip] = active_timestamps
        
        # Check rate-limit threshold
        if len(active_timestamps) >= self.max_requests:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return Response(
                content="Rate limit exceeded. Please try again later.",
                status_code=status.HTTP_429_TOO_MANY_REQUESTS
            )
            
        # Register new request timestamp
        self.requests[client_ip].append(now)
        
        return await call_next(request)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Injects standard security headers to safeguard client browser sessions.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Protect against clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # Enable XSS filter in older browsers
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Enforce HTTPS (HSTS)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Content Security Policy (CSP) baseline
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://api.tavily.com https://generativelanguage.googleapis.com;"
        )
        
        return response
