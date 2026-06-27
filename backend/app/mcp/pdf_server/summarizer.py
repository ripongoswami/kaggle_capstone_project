import logging
from app.mcp.pdf_server.extractor import PDFExtractor
from app.mcp.shared.config import GEMINI_API_KEY

logger = logging.getLogger("eduverse.mcp.pdf.summarizer")

class PDFSummarizer:
    def __init__(self, extractor: PDFExtractor):
        self.extractor = extractor

    def summarize_chapter(self, file_path: str, chapter_keywords: str) -> str:
        # 1. Extract first few pages
        text = self.extractor.extract_pages(file_path, start_page=1, end_page=6)
        if text.startswith("Error:"):
            return text

        # 2. Check if Gemini key is available to perform high-quality summarization via new SDK
        if GEMINI_API_KEY:
            try:
                from google import genai
                client = genai.Client(api_key=GEMINI_API_KEY)
                prompt = (
                    f"Summarize the following textbook pages focusing on keywords: {chapter_keywords}.\n\n"
                    f"TEXT CONTENT:\n{text}\n\n"
                    f"Summary must be structured with key takeaways and bullet points."
                )
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                return response.text or "Error: Empty response from AI model."
            except Exception as e:
                logger.error(f"Gemini summarization failed: {e}")

        # 3. Fallback simple heuristic summarizer
        lines = text.split("\n")
        relevance_lines = [l for l in lines if any(kw.lower() in l.lower() for kw in chapter_keywords.split(","))]
        
        summary_bullets = "\n".join([f"- {line.strip()}" for line in relevance_lines[:5]])
        
        return (
            f"### Chapter Summary focusing on '{chapter_keywords}':\n"
            f"Extracted relevance lines:\n"
            f"{summary_bullets or '- Content contains general references to the specified keywords.'}\n\n"
            f"*Note: Add GEMINI_API_KEY to enable smart generative summaries of this document.*"
        )
