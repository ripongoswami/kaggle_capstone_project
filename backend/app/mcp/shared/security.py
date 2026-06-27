import os
from typing import Optional

def sanitize_file_path(file_path: str, allowed_directory: Optional[str] = None) -> str:
    """
    Ensure the path is absolute, resolved (resolves symlinks and relative parts),
    and fits strictly within the allowed directory structure to prevent directory traversal.
    """
    # Resolve absolute path and all symlinks
    abs_path = os.path.realpath(os.path.abspath(file_path))
    
    # If no allowed directory is passed, restrict to the project workspace root
    if not allowed_directory:
        # Default containment to the workspace root directory
        allowed_directory = os.path.realpath(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
        
    abs_allowed = os.path.realpath(os.path.abspath(allowed_directory))
    
    # Check if the path is contained inside allowed_directory
    # Ensure there is a trailing separator to prevent matching /path/to/project_sibling when allowed is /path/to/project
    prefix = os.path.join(abs_allowed, "")
    
    if not abs_path.startswith(prefix) and abs_path != abs_allowed:
        raise PermissionError("Access denied: File path is outside the allowed directory scope.")
        
    return abs_path

def validate_file_extension(file_path: str, allowed_extensions: list[str]) -> bool:
    _, ext = os.path.splitext(file_path)
    return ext.lower() in [e.lower() for e in allowed_extensions]
