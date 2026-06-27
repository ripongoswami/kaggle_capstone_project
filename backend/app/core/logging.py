import logging
import sys
import io

def setup_logging():
    # Use UTF-8 encoding for stdout to prevent UnicodeEncodeError on Windows
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
    
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

logger = logging.getLogger("eduverse")
