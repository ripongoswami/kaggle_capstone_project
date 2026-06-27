import os
import logging
from typing import Optional
from app.mcp.shared.security import sanitize_file_path

logger = logging.getLogger("eduverse.mcp.pdf.extractor")

class PDFExtractor:
    def __init__(self, allowed_dir: Optional[str] = None):
        self.allowed_dir = allowed_dir

    def extract_pages(self, file_path: str, start_page: int = 1, end_page: int = 5) -> str:
        # Security sanitization: run BEFORE try/except so PermissionError propagates
        safe_path = sanitize_file_path(file_path, self.allowed_dir)
        
        try:
            if not os.path.exists(safe_path):
                return f"Error: File '{file_path}' does not exist on disk."

            # Dynamic import of pypdf to stay resilient
            try:
                import pypdf
                reader = pypdf.PdfReader(safe_path)
                total_pages = len(reader.pages)
                
                start_idx = max(0, start_page - 1)
                end_idx = min(total_pages, end_page)
                
                extracted_text = []
                for i in range(start_idx, end_idx):
                    page_text = reader.pages[i].extract_text()
                    extracted_text.append(f"--- Page {i + 1} ---\n{page_text}")
                    
                return "\n".join(extracted_text)
                
            except ImportError:
                logger.warning("pypdf library not installed. Falling back to plain text reader or mock metadata.")
                if safe_path.endswith(".txt"):
                    with open(safe_path, 'r', encoding='utf-8', errors='ignore') as f:
                        lines = f.readlines()
                        start_line = (start_page - 1) * 40
                        end_line = end_page * 40
                        return "".join(lines[start_line:end_line])
                
                return (
                    f"--- Page 1 (Simulated) ---\n"
                    f"Content of document: {os.path.basename(safe_path)}\n"
                    f"This is a simulated PDF page extraction. To enable real PDF scanning, "
                    f"please run `pip install pypdf` in your python environment.\n"
                    f"Lesson Overview:\n"
                    f"1. Core concepts and definitions.\n"
                    f"2. Practical code blocks and examples."
                )
        except Exception as e:
            return f"Error extracting pages: {e}"
