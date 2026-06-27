# EduVerse AI

EduVerse AI is a premium, AI-native adaptive learning platform. A team of four specialized Google Gemini agents (Planner, Tutor, Quiz, Research) collaborates to build and continuously improve a personalized learning ecosystem from a single goal entry.

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS v4, Framer Motion, Recharts
- **Backend**: FastAPI, SQLite, SQLAlchemy
- **AI Orchestration**: Google Gemini 2.5 Flash via `google-genai`
- **MCP Servers**: Search (Tavily), YouTube, PDF Extractor

## Folder Structure

```
eduverse/
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI entry point
│   │   ├── api/                # HTTP routers
│   │   ├── core/               # config, security, logging
│   │   ├── database/           # session, seed
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   ├── services/           # business logic
│   │   ├── agents/             # Planner, Tutor, Quiz, Research, Orchestrator
│   │   └── mcp/                # Search, PDF, YouTube MCP servers
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/                # Next.js App Router pages
│       ├── components/         # AuthGuard, Sidebar, UI widgets
│       ├── lib/                # constants
│       └── styles/
├── docs/                       # Architecture and design documents
├── scripts/                    # start.sh, seed_db.py, reset_db.py
├── .env.example
└── README.md
```

## Local Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in your API keys:

```env
GEMINI_API_KEY=your_gemini_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here

# Set to false to use real Gemini API calls (requires valid GEMINI_API_KEY)
# Keep as true to run the app with demo data — no API keys needed
USE_MOCK_AGENTS=true
```

### 2. Backend

```bash
cd eduverse/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The backend auto-creates SQLite tables and seeds a demo user on first run.

**Default demo account:** `student@eduverse.ai` / `Password123`

### 3. Frontend

```bash
cd eduverse/frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Start Both Together (Linux/Mac/WSL)

```bash
./scripts/start.sh
```

## How It Works

1. **Register** → redirected to `/onboarding`
2. **Onboarding** → enter your goal, skill level, and daily study time; four agents run sequentially:
   - `PlannerAgent` builds the roadmap and milestones
   - `TutorAgent` generates study notes per lesson
   - `QuizAgent` creates assessments per lesson
   - `ResearchAgent` finds resources and career paths
3. **Dashboard** shows your command center: progress, notes, quizzes, resources, career readiness
4. **Tutor** (`/tutor`) — SSE streaming chat with lesson context
5. **Quiz** (`/quiz`) — submit answers; if score < 60%, the Planner inserts revision lessons and the Tutor + Research agents generate remedial content automatically
6. **Resources** (`/resources`) — search with cache
7. **Settings** (`/settings/security`) — enter your own Gemini and Tavily API keys

## API Keys (Optional)

The app ships with `USE_MOCK_AGENTS=true` so it works out of the box with demo data.

To enable real AI responses, set `USE_MOCK_AGENTS=false` in `.env` and provide a valid `GEMINI_API_KEY`. Get one free at [aistudio.google.com](https://aistudio.google.com).

For real web search results in resources, also add a `TAVILY_API_KEY` from [tavily.com](https://tavily.com).

Users can also add their own keys per-account under `/settings/security` → Test Connection.
