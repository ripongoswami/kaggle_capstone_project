# Architecture Documentation: EduVerse AI

## System Overview
EduVerse AI utilizes a modern, decoupled client-server architecture. The backend is built entirely in Python using FastAPI, implementing Domain-Driven Design (DDD) and Clean Architecture principles. The frontend is a Next.js 15 application utilizing React 19.

## 1. Backend Architecture (Clean Architecture)

The backend (`/backend/app`) is structured into strictly separated layers:

### Presentation Layer (`/api`)
FastAPI routers (`auth.py`, `roadmap.py`, `tutor.py`, etc.) handle HTTP requests and responses. They enforce Pydantic schemas for data validation and handle authentication dependencies.

### Application/Service Layer (`/services`)
Contains the core business logic (`roadmap_service.py`, etc.). Services act as the glue between the API routers, the Repositories, and the AI Agents. 

### Domain/Model Layer (`/models` & `/schemas`)
- **Models**: SQLAlchemy declarative base classes (e.g., `User`, `Roadmap`, `Lesson`) that map directly to the SQLite tables.
- **Schemas**: Pydantic models (e.g., `RoadmapCreateRequest`, `LessonResponse`) that define the data contracts for APIs.

### Infrastructure Layer (`/repositories`, `/database`, `/core`)
- **Repositories**: Encapsulate all database queries (e.g., `RoadmapRepository`). The Service layer calls repositories rather than using `Session` directly, allowing for easy mocking during testing.
- **Database**: SQLite via SQLAlchemy.
- **Core**: Contains `settings.py` (environment variable loading via Pydantic Settings), logging configurations, and security utilities.

---

## 2. The Multi-Agent Engine

Located in `/backend/app/agents/`, the AI orchestration is decoupled from standard business logic. We utilize the `google-genai` SDK.

### The Agents:
1. **Planner Agent** (`planner_agent.py`): 
   - **Role**: Curriculum design.
   - **Input**: User goal, level, timeframe.
   - **Output**: JSON schema representing Roadmap phases and sequential Lessons.
2. **Tutor Agent** (`tutor_agent.py`): 
   - **Role**: Content generation and conversational tutoring.
   - **Input**: Lesson Title and Description.
   - **Output**: Markdown-formatted study notes. Also handles SSE (Server-Sent Events) streaming for the live chat console.
3. **Quiz Agent** (`quiz_agent.py`):
   - **Role**: Knowledge validation.
   - **Input**: The Tutor's generated study notes.
   - **Output**: JSON array of MCQs (Multiple Choice Questions) with distractors and explanations.
4. **Research Agent** (`research_agent.py`):
   - **Role**: Context enrichment.
   - **Input**: Learning topic.
   - **Output**: Curated external links. 
   - **Integration**: Uses Tavily API for live web search and contextual grounding.

### Adaptive Remediation Workflow
The true power of this architecture is its closed-loop feedback system:
1. User submits a Quiz (`POST /api/quiz/submit`).
2. Service calculates score.
3. If Score < 60%: Service invokes **Planner Agent** with the failed context.
4. Planner generates a "Remedial Lesson" and injects it into the DB before the next milestone.
5. Service triggers **Tutor** and **Quiz** agents asynchronously to populate the new remedial lesson.

---

## 3. Frontend Architecture

Located in `/frontend/src`, built with Next.js App Router.

### Directory Structure
- `/app`: Defines the routing topology (`/dashboard`, `/roadmap`, `/tutor`, etc.). Uses Next.js 15 Server and Client components where appropriate (primarily Client for interactive elements).
- `/components`: Reusable UI elements (Buttons, Layouts, Navbars).
- `/styles`: Global CSS and Tailwind directives.

### State Management & Data Fetching
- Authentication state is managed via JWT stored in `localStorage`. 
- An `AuthGuard` component wraps protected routes, intercepting rendering if the JWT is missing or invalid.
- Data fetching relies on standard `fetch` within `useEffect` hooks, keeping dependencies lightweight and relying heavily on React's concurrent features.

### UI/UX Paradigm
- **Framer Motion**: Handles all layout animations, page transitions, and micro-interactions.
- **Glassmorphism**: Uses Tailwind's `backdrop-blur` and low-opacity backgrounds on top of gradient backdrops (`bg-card/40 backdrop-blur-3xl`).
