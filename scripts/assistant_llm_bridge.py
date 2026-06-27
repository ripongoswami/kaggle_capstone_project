"""
Assistant LLM Bridge — local HTTP server that generates agent responses
without calling Gemini API. Used for product testing when API quota is exhausted.
"""
import json
import os
import sys
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

# Allow importing assistant_content_generator from same directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from assistant_content_generator import AssistantContentGenerator

ROOT = Path(__file__).resolve().parent.parent.parent  # agentic_ai/
SESSION_DIR = ROOT / "assets" / "llm_session"
SESSION_DIR.mkdir(parents=True, exist_ok=True)

PROMPTS_LOG = SESSION_DIR / "prompts.jsonl"
RESPONSES_LOG = SESSION_DIR / "responses.jsonl"
TOKEN_SUMMARY = SESSION_DIR / "token_summary.json"

generator = AssistantContentGenerator()
app = FastAPI(title="Assistant LLM Bridge")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_stats = {"requests": 0, "input_tokens_est": 0, "output_tokens_est": 0}


class GenerateRequest(BaseModel):
    prompt: str
    system_instruction: str = ""
    agent_class: str = "BaseAgent"


class GenerateResponse(BaseModel):
    text: str


def _est_tokens(text: str) -> int:
    return max(1, len(text) // 4)


def _log_jsonl(path: Path, record: dict):
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def _save_summary():
    with open(TOKEN_SUMMARY, "w", encoding="utf-8") as f:
        json.dump({**_stats, "updated_at": datetime.now(timezone.utc).isoformat()}, f, indent=2)


@app.get("/health")
def health():
    return {"status": "ok", "requests_served": _stats["requests"]}


@app.post("/v1/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    req_id = str(uuid.uuid4())[:8]
    t0 = time.time()

    in_tok = _est_tokens(req.prompt + (req.system_instruction or ""))
    text = generator.generate(req.prompt, req.agent_class, req.system_instruction)
    out_tok = _est_tokens(text)
    elapsed = round(time.time() - t0, 2)

    _stats["requests"] += 1
    _stats["input_tokens_est"] += in_tok
    _stats["output_tokens_est"] += out_tok

    ts = datetime.now(timezone.utc).isoformat()
    _log_jsonl(PROMPTS_LOG, {"id": req_id, "ts": ts, "agent_class": req.agent_class, "prompt": req.prompt[:500], "input_tokens_est": in_tok})
    _log_jsonl(RESPONSES_LOG, {"id": req_id, "ts": ts, "agent_class": req.agent_class, "output_tokens_est": out_tok, "elapsed_s": elapsed})
    _save_summary()

    return GenerateResponse(text=text)


if __name__ == "__main__":
    print(f"Assistant LLM Bridge starting on http://127.0.0.1:9999")
    print(f"Session logs: {SESSION_DIR}")
    uvicorn.run(app, host="127.0.0.1", port=9999, log_level="warning")
