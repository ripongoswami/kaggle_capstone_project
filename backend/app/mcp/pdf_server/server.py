from app.mcp.pdf_server.extractor import PDFExtractor
from app.mcp.pdf_server.summarizer import PDFSummarizer

class PDFMCPServer:
    def __init__(self):
        self.extractor = PDFExtractor()
        self.summarizer = PDFSummarizer(self.extractor)

    async def call_tool(self, name: str, arguments: dict) -> dict:
        file_path = arguments.get("file_path", "")
        if name == "extract_pdf_pages":
            start_page = arguments.get("start_page", 1)
            end_page = arguments.get("end_page", 5)
            text = self.extractor.extract_pages(file_path, start_page, end_page)
            return {"content": text}
        elif name == "summarize_pdf_chapter":
            keywords = arguments.get("chapter_keywords", "")
            summary = self.summarizer.summarize_chapter(file_path, keywords)
            return {"summary": summary}
        else:
            raise ValueError(f"Unknown tool name: {name}")

    def list_tools(self) -> list[dict]:
        return [
            {
                "name": "extract_pdf_pages",
                "description": "Reads and extracts plain text from specific pages of a local PDF document.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "file_path": {
                            "type": "string",
                            "description": "Absolute local path to the PDF file"
                        },
                        "start_page": {
                            "type": "integer",
                            "description": "First page index to extract (1-based)"
                        },
                        "end_page": {
                            "type": "integer",
                            "description": "Last page index to extract"
                        }
                    },
                    "required": ["file_path"]
                }
            },
            {
                "name": "summarize_pdf_chapter",
                "description": "Generates a structured chapter summary from a PDF textbook file based on keywords.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "file_path": {
                            "type": "string",
                            "description": "Absolute path to the PDF file"
                        },
                        "chapter_keywords": {
                            "type": "string",
                            "description": "Comma-separated topics or terms to focus summary on"
                        }
                    },
                    "required": ["file_path", "chapter_keywords"]
                }
            }
        ]

class_name = "PDFMCPServer"
